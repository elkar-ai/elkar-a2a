use std::fmt::Display;

use http::HeaderMap;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{APP_CONFIG, Environment};

#[derive(Debug)]
pub struct SupabaseToken<'a>(&'a str);

impl Display for SupabaseToken<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Supabase Token Error: {}", self.0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AudEnum {
    String(String),
    Vec(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Amr {
    pub method: String,
    pub timestamp: i64,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodedSupabaseToken {
    pub aud: AudEnum,
    pub exp: i64,
    pub iat: i64,
    pub iss: String,
    pub sub: Uuid,
    // pub encrypted_password: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub role: Option<String>,
    pub aal: Option<String>,
    pub session_id: Option<String>,
    pub amr: Option<Vec<Amr>>,
}

impl<'a> SupabaseToken<'a> {
    pub fn new(token: &'a str) -> Self {
        Self(token)
    }
    pub fn decode(&self) -> Result<DecodedSupabaseToken, jsonwebtoken::errors::Error> {
        let secret_key = dotenv::var("SUPABASE_SECRET_KEY").unwrap();
        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_audience(&["authenticated"]);
        validation.set_required_spec_claims(&["amr", "aal"]);
        validation.validate_exp = true;
        let decoded_token = decode::<DecodedSupabaseToken>(
            self.0,
            &DecodingKey::from_secret(secret_key.as_ref()),
            &validation,
        )?;

        // if APP_CONFIG.environment == Environment::Production {
        //     let amr = decoded_token.claims.amr.clone().unwrap_or_default();
        //     if amr.iter().any(|a| a.method == "password")
        //         && decoded_token.claims.aal != Some("aal2".to_string())
        //     {
        //         return Err(jsonwebtoken::errors::ErrorKind::MissingRequiredClaim(
        //             "Missing 2FA".to_string(),
        //         )
        //         .into());
        //     }
        // }
        Ok(decoded_token.claims)
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct TokenError<'a>(&'a str);

impl Display for TokenError<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Token Error: {}", self.0)
    }
}

pub fn extract_token(header_map: &HeaderMap) -> Result<String, TokenError> {
    let bearer_token = header_map
        .get("Authorization")
        .ok_or(TokenError("Missing Authorization Header"))?
        .to_str()
        .map_err(|_| TokenError("Failed to parse Token"))?;
    let token = bearer_token
        .strip_prefix("Bearer ")
        .ok_or(TokenError("Failed to parse Token"))?;
    Ok(token.to_string())
}
