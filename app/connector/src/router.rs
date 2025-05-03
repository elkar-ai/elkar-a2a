use crate::extensions::extractors::user_context::UserContext;

use crate::handler::tenant::routes::tenant_router;
use crate::handler::user::routes::user_router;
use crate::state::AppState;
use axum::body::Body;

use axum::{middleware::from_extractor, Extension};
use bytes::Bytes;
use http::{Request, Response};
use sentry::integrations::tower as sentry_tower;
use std::time::Duration;

use tower_http::body::UnsyncBoxBody;
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Span;

use uuid::Uuid;

pub fn build_router() -> axum::Router {
    axum::Router::new()
        .merge(user_router())
        .merge(tenant_router())
}

type ResponseBody = UnsyncBoxBody<Bytes, Box<(dyn std::error::Error + Send + Sync + 'static)>>;

pub fn apply_middleware(app_state: AppState, router: axum::Router) -> axum::Router {
    let trace_layer = TraceLayer::new_for_http()
        .make_span_with(|_req: &Request<Body>| {
            tracing::info_span!("http-request", request_id = Uuid::new_v4().to_string())
        })
        .on_request(|request: &Request<Body>, _span: &Span| {
            tracing::info!(
                "Starting Request {} {}",
                request.method(),
                request.uri().path()
            )
        })
        .on_response(
            |response: &Response<ResponseBody>, latency: Duration, _span: &Span| {
                tracing::info!(
                    "Ending request: {}  {:?}ms",
                    response.status(),
                    latency.as_millis()
                )
            },
        );

    let middleware = tower::ServiceBuilder::new()
        .layer(trace_layer)
        .layer(CatchPanicLayer::custom(|error| {
            tracing::error!("Panic Error: {:?}", error);
            Response::builder()
                .status(http::StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::empty())
                .unwrap()
        }))
        .layer(CorsLayer::permissive().allow_origin(Any))
        .layer(sentry_tower::NewSentryLayer::new_from_top())
        .layer(sentry_tower::SentryHttpLayer::with_transaction())
        .layer(Extension(app_state))
        .layer(from_extractor::<UserContext>());

    router.layer(middleware)
}
