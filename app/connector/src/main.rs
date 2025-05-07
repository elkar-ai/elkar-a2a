use axum::routing::*;
use elkar_app::api_doc::{PrivateApiDoc, PublicApiDoc};
use elkar_app::extensions::APP_CONFIG;
use elkar_app::extensions::async_database::make_manager_config;
use elkar_app::router::build_api_router;
use secrecy::ExposeSecret;
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;

use diesel::{Connection, PgConnection};
use diesel_migrations::MigrationHarness;
use diesel_migrations::{EmbeddedMigrations, embed_migrations};

use elkar_app::{
    extensions::sentry as sentry_extension,
    router::{apply_middleware, build_router},
    state::AppState,
};

use diesel_async::pooled_connection::AsyncDieselConnectionManager;
use diesel_async::pooled_connection::deadpool::Pool;
use utoipa_swagger_ui::SwaggerUi;

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

    let no_rls_user_db_url = APP_CONFIG.database.no_rls_user_url.expose_secret();
    let no_rls_user_manager_config = make_manager_config(true);
    let no_rls_user_manager = AsyncDieselConnectionManager::new_with_config(
        no_rls_user_db_url,
        no_rls_user_manager_config,
    );
    let no_rls_user_pg_pool = Pool::builder(no_rls_user_manager)
        .config(deadpool::managed::PoolConfig {
            max_size: 10,
            ..Default::default()
        })
        .build()
        .unwrap();

    let app_state = AppState {
        async_pool: async_pg_pool,
        no_rls_user_pool: no_rls_user_pg_pool,
    };
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");
    // init app
    tracing::info!("Initializing App.");
    let (router, api): (axum::Router, utoipa::openapi::OpenApi) =
        OpenApiRouter::with_openapi(PrivateApiDoc::openapi())
            .merge(build_router())
            .split_for_parts();

    let (api_router, public_api) = OpenApiRouter::with_openapi(PublicApiDoc::openapi())
        .nest("/api", build_api_router())
        .split_for_parts();

    let router = router.merge(api_router);
    let app = apply_middleware(app_state, router)
        .route("/health", get(health_check))
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", api.clone()))
        .merge(
            SwaggerUi::new("/public-swagger-ui")
                .url("/public-api-docs/openapi.json", public_api.clone()),
        );

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
