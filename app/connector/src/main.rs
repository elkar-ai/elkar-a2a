use axum::routing::*;
use elkar_app::extensions::async_database::make_manager_config;
use elkar_app::extensions::APP_CONFIG;
use secrecy::ExposeSecret;

use diesel::{Connection, PgConnection};
use diesel_migrations::MigrationHarness;
use diesel_migrations::{embed_migrations, EmbeddedMigrations};

use elkar_app::{
    extensions::sentry as sentry_extension,
    router::{apply_middleware, build_router},
    state::AppState,
};

use diesel_async::pooled_connection::deadpool::Pool;
use diesel_async::pooled_connection::AsyncDieselConnectionManager;

const EMBEDDED_MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

pub async fn health_check() {}

fn main() {
    dotenv::dotenv().ok();
    // init sentry
    let client_options = sentry::ClientOptions {
        auto_session_tracking: true,
        environment: Some(APP_CONFIG.environment.as_str().into()),
        release: sentry::release_name!(),
        traces_sample_rate: 1.,
        attach_stacktrace: true,
        debug: false,
        ..Default::default()
    };
    let _guard = sentry::init((APP_CONFIG.sentry_dsn.expose_secret(), client_options));
    sentry_extension::init();

    // Run migrations
    tracing::info!("Running Pending Migrations");
    let admin_db_url = APP_CONFIG.database.admin_url.expose_secret();
    PgConnection::establish(admin_db_url)
        .expect("Failed to connect Admin DB url")
        .run_pending_migrations(EMBEDDED_MIGRATIONS)
        .expect("Failed to run migrations");

    // init db pool
    tracing::info!("Initializing DB pool.");
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

    let app_state = AppState {
        async_pool: async_pg_pool,
    };
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");
    // init app
    tracing::info!("Initializing App.");

    let app = apply_middleware(app_state, build_router()).route("/health", get(health_check));

    // build rt
    let mut builder = tokio::runtime::Builder::new_multi_thread();
    builder.enable_all();
    builder.worker_threads(4);
    builder.max_blocking_threads(8);
    let rt = builder.build().unwrap();

    // start server
    rt.block_on(async {
        let listener = tokio::net::TcpListener::bind("0.0.0.0:1996").await.unwrap();
        tracing::info!("Starting Server.");
        axum::serve(listener, app).await.unwrap();
    });
}
