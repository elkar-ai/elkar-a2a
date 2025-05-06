use std::{future::Future, time::Duration};
use tokio::task::{AbortHandle, JoinError, JoinSet};

pub struct BoundedJoinSet<T> {
    join_set: JoinSet<T>,
    max_concurrency: usize,
    collection: Vec<T>,
    errors: Vec<JoinError>,
    sleep_duration: Option<Duration>,
}

impl<T> BoundedJoinSet<T> {
    pub fn new(max_concurrency: usize) -> Self {
        Self {
            join_set: JoinSet::new(),
            max_concurrency,
            collection: Vec::new(),
            errors: Vec::new(),
            sleep_duration: None,
        }
    }

    pub fn set_sleep_duration(&mut self, sleep_duration: Option<Duration>) {
        self.sleep_duration = sleep_duration;
    }

    pub fn into_collection(self) -> Vec<T> {
        self.collection
    }

    pub fn collection(&self) -> &Vec<T> {
        &self.collection
    }

    pub fn into_errors(self) -> Vec<JoinError> {
        self.errors
    }

    pub fn errors(&self) -> &Vec<JoinError> {
        &self.errors
    }

    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    pub fn trace_errors(&self) {
        for error in &self.errors {
            tracing::error!("BoundedJoinSet Error: {:?}", error);
        }
    }
}
impl<T: 'static> BoundedJoinSet<T> {
    pub async fn spawn<F>(&mut self, future: F) -> AbortHandle
    where
        F: Future<Output = T>,
        F: Send + 'static,
        T: Send,
    {
        while self.join_set.len() >= self.max_concurrency {
            if let Some(result) = self.join_set.join_next().await {
                match result {
                    Ok(item) => self.collection.push(item),
                    Err(e) => self.errors.push(e),
                }
            }
            if let Some(sleep_duration) = self.sleep_duration {
                tokio::time::sleep(sleep_duration).await;
            }
        }
        self.join_set.spawn(future)
    }

    pub async fn join_next(&mut self) -> Option<Result<T, JoinError>> {
        self.join_set.join_next().await
    }

    pub async fn join_all(&mut self) {
        while let Some(result) = self.join_set.join_next().await {
            match result {
                Ok(item) => self.collection.push(item),
                Err(e) => self.errors.push(e),
            }
        }
    }
}
