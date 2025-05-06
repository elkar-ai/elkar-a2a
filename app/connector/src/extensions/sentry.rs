use sentry::integrations::tracing::EventFilter;

use tracing::Metadata;
use tracing::{level_filters::LevelFilter, Level};
use tracing_subscriber::filter::EnvFilter;
use tracing_subscriber::prelude::*;

pub fn init() {
    init_with_default_level(LevelFilter::INFO)
}

pub fn event_filter(metadata: &Metadata<'_>) -> EventFilter {
    match metadata.level() {
        &Level::ERROR => EventFilter::Exception,
        &Level::WARN | &Level::INFO => EventFilter::Breadcrumb,
        &Level::DEBUG | &Level::TRACE => EventFilter::Ignore,
    }
}

fn init_with_default_level(level: LevelFilter) {
    let env_filter = EnvFilter::builder()
        .with_default_directive(level.into())
        .from_env_lossy();

    let log_layer = tracing_subscriber::fmt::layer()
        .compact()
        .with_file(true)
        .with_line_number(true)
        .without_time()
        .with_ansi(false)
        .with_filter(env_filter);

    let sentry_layer = sentry::integrations::tracing::layer()
        .event_filter(event_filter)
        .with_filter(LevelFilter::INFO);

    tracing_subscriber::registry()
        .with(log_layer)
        .with(sentry_layer)
        .init();
}
