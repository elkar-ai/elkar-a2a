use std::str::FromStr;

use reqwest::{Client, RequestBuilder};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use serde_json::Value;
use uuid::Uuid;

pub struct SupabaseClient {
    pub supabase_url: String,
    pub token: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SupabaseError {
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SupabaseInviteUser {
    pub email: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SupabaseUser {
    pub id: Uuid,
    pub email: String,
}

impl SupabaseClient {
    pub fn new(supabase_url: String, token: String) -> Self {
        Self {
            supabase_url,
            token,
        }
    }

    fn post_client<T: Serialize>(&self, endpoint: &str, data: &T) -> RequestBuilder {
        let mut endpoint_url = url::Url::from_str(&self.supabase_url).unwrap();
        endpoint_url.set_path(endpoint);

        Client::new()
            .post(endpoint_url)
            .header("Apikey", &self.token)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&data)
    }

    fn get_client<T: Serialize>(&self, endpoint: &str, data: &T) -> RequestBuilder {
        let mut endpoint_url = url::Url::from_str(&self.supabase_url).unwrap();
        endpoint_url.set_path(endpoint);

        let url_encoded_string = serde_urlencoded::to_string(data).unwrap();
        endpoint_url.set_query(Some(&url_encoded_string));

        Client::new()
            .get(endpoint_url)
            .header("Apikey", &self.token)
            .header("Authorization", format!("Bearer {}", self.token))
    }

    pub async fn generic_call<T: Serialize, U: DeserializeOwned>(
        &self,
        method: &str,
        endpoint: &str,
        data: &T,
    ) -> Result<U, SupabaseError> {
        let client = match method {
            "GET" => self.get_client(endpoint, data),
            "POST" => self.post_client(endpoint, data),
            _ => {
                return Err(SupabaseError {
                    message: "Invalid method".to_string(),
                });
            }
        };
        let output = client.send().await;
        let output = match output {
            Ok(o) => o,
            Err(e) => {
                return Err(SupabaseError {
                    message: e.to_string(),
                });
            }
        };
        match output.status().is_success() {
            true => {}
            false => {
                return Err(SupabaseError {
                    message: output.text().await.unwrap(),
                });
            }
        };
        let output = output.json::<Value>().await;
        let output = output.map_err(|e| SupabaseError {
            message: e.to_string(),
        })?;

        let u = serde_json::from_value(output).map_err(|e| SupabaseError {
            message: e.to_string(),
        })?;

        Ok(u)
    }

    pub async fn invite_user(
        &self,
        invite_input: &SupabaseInviteUser,
    ) -> Result<SupabaseUser, SupabaseError> {
        self.generic_call("POST", "auth/v1/invite", &invite_input)
            .await
    }
}
