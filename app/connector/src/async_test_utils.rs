use database_schema::schema::tenant;
use deadpool::managed::Pool;
use diesel_async::pooled_connection::AsyncDieselConnectionManager;
use secrecy::ExposeSecret;

use crate::extensions::async_database::{
    establish_async_connection, make_manager_config, AsyncUserPgPool,
};

use crate::extensions::APP_CONFIG;
use diesel::connection::LoadConnection;
use diesel::deserialize::QueryableByName;
use diesel::sql_types::Text;
use diesel::{sql_query, Connection, PgConnection};
use diesel::{ExpressionMethods, RunQueryDsl};
use diesel_async::async_connection_wrapper::AsyncConnectionWrapper;
use diesel_async::SimpleAsyncConnection;
use diesel_migrations::MigrationHarness;
use diesel_migrations::{embed_migrations, EmbeddedMigrations};
use rstest::{fixture, rstest};
use serial_test::serial;
use std::ops::{Deref, DerefMut};
use tokio::task::spawn_blocking;
use uuid::Uuid;

use diesel::pg::Pg;
use diesel_async::{AsyncConnection, AsyncPgConnection};

const EMBEDDED_MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");
const TEST_TENANT_ID: &str = "f7950401-5271-4cdf-9ed7-42f406d2a93a";

#[derive(Clone)]
pub struct TestPool(pub AsyncUserPgPool);

impl Drop for TestPool {
    fn drop(&mut self) {
        let db_url = APP_CONFIG.database.admin_url.expose_secret();
        let mut admin_conn = PgConnection::establish(db_url).unwrap();
        truncate_all_tables(&mut admin_conn, "public").unwrap();
        revert_all_migrations(&mut admin_conn);
    }
}

#[fixture]
pub async fn test_pool() -> TestPool {
    rustls::crypto::ring::default_provider()
        .install_default()
        .unwrap();
    let admin_db_url = APP_CONFIG.database.admin_url.expose_secret();
    let admin_conn = establish_async_connection(admin_db_url, false)
        .await
        .unwrap();
    spawn_blocking(move || {
        let mut conn: AsyncConnectionWrapper<_> = admin_conn.into();
        conn.run_pending_migrations(EMBEDDED_MIGRATIONS).unwrap();
    })
    .await
    .unwrap();
    let db_url = APP_CONFIG.database.app_user_url.expose_secret();
    let manager_config = make_manager_config(true);
    let manager = AsyncDieselConnectionManager::new_with_config(db_url, manager_config);

    let async_pg_pool = Pool::builder(manager)
        .config(deadpool::managed::PoolConfig {
            max_size: 10,

            ..Default::default()
        })
        .build()
        .unwrap();
    let mut pool = AsyncUserPgPool::new(async_pg_pool);
    pool = pool.tenant_id(TEST_TENANT_ID.parse::<Uuid>().unwrap());
    TestPool(pool)
}

pub struct TestAsyncAppUserDatabaseConnection<T>(T)
where
    T: AsyncConnection<Backend = Pg>;

impl TestAsyncAppUserDatabaseConnection<AsyncPgConnection> {
    pub async fn new() -> Self {
        tracing::info!("Creating test app user database connection");
        let admin_db_url = APP_CONFIG.database.admin_url.expose_secret();
        let admin_conn = establish_async_connection(admin_db_url, false)
            .await
            .unwrap();

        spawn_blocking(move || {
            let mut conn: AsyncConnectionWrapper<_> = admin_conn.into();
            conn.run_pending_migrations(EMBEDDED_MIGRATIONS).unwrap();
        })
        .await
        .unwrap();
        let db_url = APP_CONFIG.database.app_user_url.expose_secret();
        let mut app_user_conn = establish_async_connection(db_url, false).await.unwrap();

        app_user_conn
            .batch_execute(&format!("set tenant.id='{TEST_TENANT_ID}'"))
            .await
            .unwrap();

        let insert_tenant_stmt = diesel::insert_into(tenant::table).values((
            tenant::id.eq(TEST_TENANT_ID.parse::<Uuid>().unwrap()),
            tenant::name.eq("test_tenant"),
        ));

        diesel_async::RunQueryDsl::execute(insert_tenant_stmt, &mut app_user_conn)
            .await
            .unwrap();

        Self(app_user_conn)
    }
}

impl Deref for TestAsyncAppUserDatabaseConnection<AsyncPgConnection> {
    type Target = AsyncPgConnection;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for TestAsyncAppUserDatabaseConnection<AsyncPgConnection> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[derive(QueryableByName)]
struct TableName {
    #[diesel(sql_type = Text)]
    tablename: String,
}

// Function to get all table names from a schema
fn get_all_table_names<C>(conn: &mut C, schema: &str) -> Result<Vec<String>, diesel::result::Error>
where
    C: LoadConnection<Backend = Pg>,
{
    let query = format!(
        "SELECT tablename FROM pg_tables WHERE schemaname = '{}'",
        schema
    );
    let table_names: Vec<TableName> = sql_query(query).load(conn)?;
    Ok(table_names.into_iter().map(|t| t.tablename).collect())
}

// Function to drop all tables in a schema
fn truncate_all_tables<C>(conn: &mut C, schema: &str) -> Result<(), diesel::result::Error>
where
    C: LoadConnection<Backend = Pg>,
{
    let table_names = get_all_table_names(conn, schema)?;
    let mut drop_query = String::new();
    for table_name in table_names {
        if table_name == "__diesel_schema_migrations" {
            continue;
        }
        drop_query.push_str(&format!(
            "TRUNCATE TABLE {}.{} CASCADE;\n",
            schema, table_name
        ));
    }
    conn.batch_execute(&drop_query)?;
    Ok(())
}

fn revert_all_migrations<C>(connection: &mut C)
where
    C: MigrationHarness<Pg>,
{
    connection
        .revert_all_migrations(EMBEDDED_MIGRATIONS)
        .unwrap();
}

impl<T> Drop for TestAsyncAppUserDatabaseConnection<T>
where
    T: AsyncConnection<Backend = Pg>,
{
    fn drop(&mut self) {
        let db_url = APP_CONFIG.database.admin_url.expose_secret();
        let mut admin_conn = PgConnection::establish(db_url).unwrap();
        truncate_all_tables(&mut admin_conn, "public").unwrap();
        revert_all_migrations(&mut admin_conn);
    }
}

#[fixture]
pub async fn async_app_user_conn() -> TestAsyncAppUserDatabaseConnection<AsyncPgConnection> {
    TestAsyncAppUserDatabaseConnection::new().await
}

#[tokio::test]
#[rstest]
#[serial]
#[allow(unused_variables)]
async fn test_base(
    #[future] async_app_user_conn: TestAsyncAppUserDatabaseConnection<AsyncPgConnection>,
) {
}
