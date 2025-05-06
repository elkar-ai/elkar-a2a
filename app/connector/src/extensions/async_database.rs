use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::{ClientConfig as RustlsClientConfig, SignatureScheme};
use std::ops::{Deref, DerefMut};
use std::sync::Arc;

use diesel::result::Error as DieselError;

use diesel::ConnectionResult;
use diesel_async::pooled_connection::{AsyncDieselConnectionManager, ManagerConfig};
use diesel_async::{AsyncConnection, AsyncPgConnection, SimpleAsyncConnection};
use secrecy::ExposeSecret;
use uuid::Uuid;

use crate::certs::GLOBAL_BUNDLE;

use super::errors::AppResult;
use super::APP_CONFIG;

pub type AsyncPooledPgConnection =
    deadpool::managed::Object<AsyncDieselConnectionManager<AsyncPgConnection>>;

pub type AsyncPgPool = deadpool::managed::Pool<AsyncDieselConnectionManager<AsyncPgConnection>>;
pub struct AsyncDataBaseConnection<T: Deref<Target = AsyncPgConnection> + DerefMut + Send>(pub T);

impl<T> Deref for AsyncDataBaseConnection<T>
where
    T: Deref<Target = AsyncPgConnection> + DerefMut + Send,
{
    type Target = AsyncPgConnection;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for AsyncDataBaseConnection<T>
where
    T: Deref<Target = AsyncPgConnection> + DerefMut + Send,
{
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[derive(Clone)]
pub struct AsyncUserPgPool {
    tenant_id: Option<Uuid>,
    pool: AsyncPgPool,
}

impl AsyncUserPgPool {
    pub fn new(pool: AsyncPgPool) -> Self {
        Self {
            tenant_id: None,
            pool,
        }
    }

    pub fn tenant_id(self, tenant_id: Uuid) -> Self {
        Self {
            tenant_id: Some(tenant_id),
            pool: self.pool,
        }
    }

    pub async fn get(&self) -> anyhow::Result<AsyncDataBaseConnection<AsyncPooledPgConnection>> {
        let mut conn = self.pool.get().await.map_err(anyhow::Error::new)?;
        reset_tenant_id_async(&mut conn)
            .await
            .map_err(anyhow::Error::new)?;
        if let Some(tenant_id) = self.tenant_id {
            set_tenant_id_async(&mut conn, tenant_id)
                .await
                .map_err(anyhow::Error::new)?;
        }
        Ok(AsyncDataBaseConnection(conn))
    }
}

pub async fn set_tenant_id_async(
    conn: &mut AsyncPgConnection,
    tenant_id: Uuid,
) -> Result<(), DieselError> {
    conn.batch_execute(format!("SET tenant.id = '{}'", tenant_id).as_str())
        .await
}

pub async fn reset_tenant_id_async(conn: &mut AsyncPgConnection) -> Result<(), DieselError> {
    conn.batch_execute("RESET tenant.id").await
}

#[doc(hidden)]
#[derive(Debug)]
struct DummyVerifier;

impl ServerCertVerifier for DummyVerifier {
    fn verify_server_cert(
        &self,
        _end_entity: &rustls_pki_types::CertificateDer<'_>,
        _intermediates: &[rustls_pki_types::CertificateDer<'_>],
        _server_name: &rustls_pki_types::ServerName<'_>,
        _ocsp_response: &[u8],
        _now: rustls_pki_types::UnixTime,
    ) -> Result<ServerCertVerified, rustls::Error> {
        Ok(ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &rustls_pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        Ok(HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &rustls_pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        Ok(HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        vec![
            SignatureScheme::RSA_PKCS1_SHA1,
            SignatureScheme::ECDSA_SHA1_Legacy,
            SignatureScheme::RSA_PKCS1_SHA256,
            SignatureScheme::ECDSA_NISTP256_SHA256,
            SignatureScheme::RSA_PKCS1_SHA384,
            SignatureScheme::ECDSA_NISTP384_SHA384,
            SignatureScheme::RSA_PKCS1_SHA512,
            SignatureScheme::ECDSA_NISTP521_SHA512,
            SignatureScheme::RSA_PSS_SHA256,
            SignatureScheme::RSA_PSS_SHA384,
            SignatureScheme::RSA_PSS_SHA512,
            SignatureScheme::ED25519,
            SignatureScheme::ED448,
        ]
    }
}

pub async fn establish_async_connection(
    url: &str,
    enable_tls: bool,
) -> ConnectionResult<AsyncPgConnection> {
    if !enable_tls {
        return AsyncPgConnection::establish(url).await;
    }
    let mut roots = rustls::RootCertStore::empty();
    let mut bundle = GLOBAL_BUNDLE;

    let certs = rustls_pemfile::certs(&mut bundle);
    for cert in certs {
        let cert_cc = cert.unwrap();
        roots.add(cert_cc).unwrap();
    }

    let tls_config = RustlsClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(DummyVerifier))
        .with_no_client_auth();

    let connector = tokio_postgres_rustls::MakeRustlsConnect::new(tls_config);

    let result = tokio_postgres::connect(url, connector).await;
    let (client, conn) = result.unwrap();

    tokio::spawn(async move {
        if let Err(e) = conn.await {
            eprintln!("Database connection: {e}");
        }
    });

    AsyncPgConnection::try_from(client).await
}

pub async fn establish_async_connection_with_tenant(
    tenant_id: Uuid,
) -> AppResult<AsyncPgConnection> {
    let db_url = APP_CONFIG.database.app_user_url.expose_secret();
    let mut async_conn = establish_async_connection(db_url, true).await.unwrap();
    set_tenant_id_async(&mut async_conn, tenant_id).await?;
    Ok(async_conn)
}

pub fn make_manager_config(enable_tls: bool) -> ManagerConfig<AsyncPgConnection> {
    let mut manager_config = ManagerConfig::default();
    manager_config.custom_setup =
        Box::new(move |url| Box::pin(establish_async_connection(url, enable_tls)));
    manager_config
}
