pub mod async_database;
pub mod errors;
pub mod extractors;
pub mod filters_common;
pub mod helpers;
pub mod pagination;
pub mod query_common;
pub mod sentry;
pub mod sql_functions;
pub mod token;
use secrecy::SecretString;

#[derive(Debug, Clone)]
pub struct SupabaseConfig {
    pub url: SecretString,
    pub secret_key: SecretString,
    pub admin_key: SecretString,
}

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub app_user_url: SecretString,
    pub admin_url: SecretString,
    pub no_rls_user_url: SecretString,
}
#[derive(Debug, Clone)]
pub struct NotionConfig {
    pub client_id: SecretString,
    pub client_secret: SecretString,
    pub redirect_uri: SecretString,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub environment: Environment,
    pub frontend_url: String,
    pub sentry_dsn: SecretString,
    pub supabase: SupabaseConfig,
    pub database: DatabaseConfig,
}

lazy_static! {
    pub static ref APP_CONFIG: AppConfig = AppConfig {
        environment: Environment::try_from(dotenv::var("ENVIRONMENT").unwrap_or_default()).unwrap(),
        frontend_url: dotenv::var("FRONT_URL").unwrap(),
        sentry_dsn: dotenv::var("SENTRY_DSN").unwrap().into(),
        supabase: SupabaseConfig {
            url: dotenv::var("SUPABASE_URL").unwrap().into(),
            secret_key: dotenv::var("SUPABASE_SECRET_KEY").unwrap().into(),
            admin_key: dotenv::var("SUPABASE_ADMIN_KEY").unwrap().into(),
        },
        database: DatabaseConfig {
            app_user_url: dotenv::var("APP_USER_DATABASE_URL").unwrap().into(),
            admin_url: dotenv::var("DATABASE_URL").unwrap().into(),
            no_rls_user_url: dotenv::var("NO_RLS_USER_DATABASE_URL").unwrap().into(),
        },
    };
}

/// The possible runtime environment for our application.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Environment {
    Local,
    Development,
    Production,
}
impl Environment {
    pub fn as_str(&self) -> &'static str {
        match self {
            Environment::Local => "local",
            Environment::Development => "development",
            Environment::Production => "production",
        }
    }
}

impl TryFrom<String> for Environment {
    type Error = String;
    fn try_from(s: String) -> Result<Self, Self::Error> {
        match s.to_lowercase().as_str() {
            "local" => Ok(Self::Local),
            "development" => Ok(Self::Development),
            "production" => Ok(Self::Production),
            other => Err(format!(
                "{} is not a supported environment. Use either `local`, `development` or `production`.",
                other
            )),
        }
    }
}
