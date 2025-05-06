use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub mod output;
pub mod query_async;

pub fn default_per_page() -> i64 {
    40
}

fn default_per_page_string() -> String {
    "40".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PaginationOptionsQuery {
    pub page: Option<String>,
    #[serde(default = "default_per_page_string")]
    pub per_page: String,
}

impl TryFrom<PaginationOptionsQuery> for PaginationOptions {
    type Error = anyhow::Error;

    fn try_from(value: PaginationOptionsQuery) -> Result<Self, Self::Error> {
        let page = value.page.map(|p| p.parse::<i64>()).transpose()?;
        let per_page = value.per_page.parse::<i64>().unwrap_or(default_per_page());
        Ok(Self { page, per_page })
    }
}

#[derive(Copy, Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PaginationOptions {
    pub page: Option<i64>,
    #[serde(default = "default_per_page")]
    pub per_page: i64,
}

impl Default for PaginationOptions {
    fn default() -> Self {
        Self {
            page: Some(1),
            per_page: 40,
        }
    }
}

impl PaginationOptions {
    pub fn offset(&self) -> Option<i64> {
        self.page.map(|p| (p - 1) * self.per_page)
    }

    pub fn limit(&self) -> i64 {
        self.per_page + 1
    }
}

#[derive(Debug, Clone)]
pub struct Paginated<T> {
    pub records: Vec<T>,
    pub total: i64,
    pub has_more: bool,
    pub options: Option<PaginationOptions>,
}

impl<T> Paginated<T> {
    pub fn pop(&mut self) -> Option<T> {
        self.records.pop()
    }
}

impl<T, E> Paginated<Result<T, E>> {
    pub fn transpose(self) -> Result<Paginated<T>, E> {
        let records = self.records.into_iter().collect::<Result<Vec<_>, _>>()?;
        Ok(Paginated {
            records,
            total: self.total,
            has_more: self.has_more,
            options: self.options,
        })
    }
}

impl<T: 'static> IntoIterator for Paginated<T> {
    type Item = T;
    type IntoIter = std::vec::IntoIter<T>;

    fn into_iter(self) -> Self::IntoIter {
        self.records.into_iter()
    }
}

impl<T> Paginated<T> {
    pub fn map<U: Sized>(self, f: impl FnMut(T) -> U) -> Paginated<U> {
        Paginated {
            records: self.records.into_iter().map(f).collect(),
            total: self.total,
            has_more: self.has_more,
            options: self.options,
        }
    }

    pub(crate) fn total(&self) -> i64 {
        self.total
    }

    pub fn records(&self) -> Vec<&T> {
        self.records.iter().collect()
    }

    pub fn into_records(self) -> Vec<T> {
        self.records
    }

    pub fn has_more(&self) -> bool {
        self.has_more
    }

    pub fn page(&self) -> i64 {
        self.options.map(|o| o.page.unwrap_or(1)).unwrap_or(1)
    }
    pub fn per_page(&self) -> i64 {
        self.options.map(|o| o.per_page).unwrap_or(self.total())
    }

    pub fn total_pages(&self) -> i64 {
        (self.total() as f64 / self.per_page() as f64).ceil() as i64
    }

    pub fn from_vec(records: Vec<T>, total: i64, options: Option<PaginationOptions>) -> Self {
        let has_more = match &options {
            Some(options) => records.len() as i64 > options.per_page,
            None => false,
        };
        let records = if has_more {
            records
                .into_iter()
                .take(options.map(|o| o.per_page).unwrap_or(total) as usize)
                .collect()
        } else {
            records
        };
        Self {
            records,
            total,
            has_more,
            options,
        }
    }
}
