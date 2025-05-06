use super::Paginated;

use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct PaginationInformation {
    pub page: i64,
    pub total_pages: i64,
    pub total: i64,
    pub has_more: bool,
}

#[derive(Serialize, ToSchema)]
pub struct PaginatedOutput<T> {
    pub records: Vec<T>,
    pub pagination: PaginationInformation,
}

#[derive(Serialize, ToSchema)]
pub struct UnpaginatedOutput<T> {
    pub records: Vec<T>,
}

impl<T> PaginatedOutput<T> {
    pub fn map<U>(self, f: impl Fn(T) -> U) -> PaginatedOutput<U> {
        PaginatedOutput {
            records: self.records.into_iter().map(f).collect(),
            pagination: self.pagination,
        }
    }
}

impl<T: From<U> + 'static, U: 'static> From<Paginated<U>> for PaginatedOutput<T> {
    fn from(paginated: Paginated<U>) -> Self {
        let pagination = PaginationInformation {
            page: paginated.page(),
            total_pages: paginated.total_pages(),
            total: paginated.total(),
            has_more: paginated.has_more(),
        };
        Self {
            pagination,
            records: paginated.into_iter().map(|record| record.into()).collect(),
        }
    }
}

impl<T> From<Vec<T>> for UnpaginatedOutput<T> {
    fn from(records: Vec<T>) -> Self {
        Self { records }
    }
}
