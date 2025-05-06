use std::{fmt::Display, str::FromStr};

use serde::*;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub enum FilterType {
    AnyOf,
    AllOf,
    NoneOf,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum ComparisonOperator {
    Eq,
    Ne,
    #[default]
    Gt,
    Gte,
    Lt,
    Lte,
}

impl Display for ComparisonOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Eq => write!(f, "eq"),
            Self::Ne => write!(f, "ne"),
            Self::Gt => write!(f, "gt"),
            Self::Gte => write!(f, "gte"),
            Self::Lt => write!(f, "lt"),
            Self::Lte => write!(f, "lte"),
        }
    }
}
impl FromStr for ComparisonOperator {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "eq" => Ok(Self::Eq),
            "ne" => Ok(Self::Ne),
            "gt" => Ok(Self::Gt),
            "gte" => Ok(Self::Gte),
            "lt" => Ok(Self::Lt),
            "lte" => Ok(Self::Lte),
            _ => Err(anyhow::anyhow!("Invalid comparison operator")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CounterFilter<T, V> {
    pub filter: T,
    pub operator: ComparisonOperator,
    pub value: V,
}

impl<T: Display, V: Display> Display for CounterFilter<T, V> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}:{}:{}", self.filter, self.operator, self.value)
    }
}

impl<T: FromStr, V: Default + FromStr> FromStr for CounterFilter<T, V> {
    type Err = anyhow::Error;

    fn from_str(filter: &str) -> Result<Self, Self::Err> {
        let mut parts = filter.split(":");
        let filter = parts
            .next()
            .ok_or(anyhow::anyhow!(
                "Invalid filter for type {}",
                std::any::type_name::<T>()
            ))?
            .parse::<T>()
            .map_err(|_| {
                anyhow::anyhow!("Invalid filter for type {}", std::any::type_name::<T>())
            })?;

        let operator = parts
            .next()
            .unwrap_or_default()
            .parse::<ComparisonOperator>()
            .map_err(|_| anyhow::anyhow!("Invalid filter operator",))?;
        let value = parts
            .next()
            .unwrap_or_default()
            .parse::<V>()
            .map_err(|_| anyhow::anyhow!("Invalid filter value"))?;
        Ok(Self {
            filter,
            operator,
            value,
        })
    }
}

impl<T, V: Into<sea_query::Value> + Clone> CounterFilter<T, V> {
    pub fn apply_operator(&self, query: &mut sea_query::SelectStatement, col: sea_query::Expr) {
        match self.operator {
            ComparisonOperator::Eq => {
                query.and_where(col.eq(self.value.clone()));
            }
            ComparisonOperator::Ne => {
                query.and_where(col.ne(self.value.clone()));
            }
            ComparisonOperator::Gt => {
                query.and_where(col.gt(self.value.clone()));
            }
            ComparisonOperator::Gte => {
                query.and_where(col.gte(self.value.clone()));
            }
            ComparisonOperator::Lt => {
                query.and_where(col.lt(self.value.clone()));
            }
            ComparisonOperator::Lte => {
                query.and_where(col.lte(self.value.clone()));
            }
        }
    }
}
