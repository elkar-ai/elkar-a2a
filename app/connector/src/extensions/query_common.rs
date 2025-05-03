use serde::*;
use utoipa::ToSchema;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum QueryOrder {
    Asc,
    #[default]
    Desc,
}

#[derive(Debug, Clone, Default)]
pub struct SortBy<T> {
    pub field: T,
    pub order: QueryOrder,
}

impl<T> SortBy<T> {
    pub fn new(field: T, order: QueryOrder) -> Self {
        Self { field, order }
    }

    pub fn field(&self) -> &T {
        &self.field
    }

    pub fn order(&self) -> QueryOrder {
        self.order
    }

    pub fn to_sq_order(&self) -> sea_query::Order {
        match self.order {
            QueryOrder::Asc => sea_query::Order::Asc,
            QueryOrder::Desc => sea_query::Order::Desc,
        }
    }
}
