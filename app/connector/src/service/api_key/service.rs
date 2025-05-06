use base64::{prelude::BASE64_STANDARD, Engine};
use sha2::Digest;

pub(super) const API_KEY_PREFIX: &str = "sk_elkar_";

pub(super) fn hash_api_key(api_key: &str) -> String {
    let mut context = sha2::Sha256::new();
    context.update(api_key.as_bytes());
    let digest = context.finalize();
    hex::encode(digest)
}

pub(super) fn generate_api_key() -> String {
    // Generate a 32-byte random string, encoded as base64
    let random_bytes: [u8; 32] = rand::random();

    format!("{}{}", API_KEY_PREFIX, BASE64_STANDARD.encode(random_bytes))
}
