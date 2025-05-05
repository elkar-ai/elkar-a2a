use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    tags(
        (name = "API for Frontend", description = "API for Frontend")
    )
)]
pub struct PrivateApiDoc;

#[derive(OpenApi)]
#[openapi(
    tags(
        (name = "API for Public", description = "API for Public")
    )
)]
pub struct PublicApiDoc;
