use diesel::backend::Backend;
use diesel::pg::Pg;
use diesel::query_builder::{AstPass, Query, QueryFragment, QueryId};
use diesel::sql_types::BigInt;
use diesel::{query_dsl::methods::LoadQuery, PgConnection};
use diesel::{QueryResult, QueryableByName};

use sea_query::{Alias, Asterisk, Expr, SeaRc};

use std::fmt::Debug;

use super::{Paginated, PaginationOptions};
use crate::extensions::errors::AppResult;
use crate::extensions::pagination::query_async::build_diesel_query;
use serde::*;

use diesel::connection::LoadConnection;

pub trait Conn: LoadConnection<Backend = Pg> {}

impl<T> Conn for T where T: LoadConnection<Backend = Pg> {}

#[derive(Debug, Clone, Copy)]
pub struct PaginatedQuery<T> {
    pub query: T,
    pub options: PaginationOptions,
}

pub trait Paginate: Sized {
    fn paginate(self, options: PaginationOptions) -> PaginatedQuery<Self> {
        PaginatedQuery {
            query: self,
            options,
        }
    }
}
impl<T> Paginate for T {}

impl<T, DB> diesel::RunQueryDsl<DB> for PaginatedQuery<T> {}

impl<T> PaginatedQuery<T> {
    pub fn load_all<'a, U, Conn>(self, conn: &mut Conn) -> QueryResult<Paginated<U>>
    where
        Self: LoadQuery<'a, Conn, (U, i64)>,
    {
        let options = self.options;
        let records_and_total: Vec<(U, i64)> =
            self.internal_load(conn)?.collect::<QueryResult<_>>()?;

        Ok(compute_paginated(records_and_total, Some(options)))
    }
}

impl<T: Query> Query for PaginatedQuery<T> {
    type SqlType = (T::SqlType, BigInt);
}

impl<T> QueryId for PaginatedQuery<T> {
    const HAS_STATIC_QUERY_ID: bool = false;
    type QueryId = ();
}

impl<T, DB: Backend> QueryFragment<DB> for PaginatedQuery<T>
where
    T: QueryFragment<DB>,
{
    fn walk_ast<'b>(&'b self, mut out: AstPass<'_, 'b, DB>) -> QueryResult<()> {
        out.push_sql("SELECT *, COUNT(*) OVER () FROM (");
        self.query.walk_ast(out.reborrow())?;
        out.push_sql(format!(") t LIMIT {}", self.options.per_page + 1).as_str());
        if let Some(offset) = self.options.offset() {
            out.push_sql(format!(" OFFSET {}", offset).as_str());
        }
        Ok(())
    }
}

pub fn compute_paginated<U>(
    mut records_and_total: Vec<(U, i64)>,
    options: Option<PaginationOptions>,
) -> Paginated<U> {
    let has_more = match options {
        Some(options) => records_and_total.len() as i64 > options.per_page,
        None => false,
    };

    if has_more {
        records_and_total.pop();
    }
    let total = records_and_total
        .first()
        .map(|(_, total)| *total)
        .unwrap_or(0);
    let records = records_and_total
        .into_iter()
        .map(|(record, _)| record)
        .collect();

    Paginated {
        records,
        total,
        has_more,
        options,
    }
}

#[derive(QueryableByName, Debug, Clone, Serialize, Deserialize)]
pub struct CountedOutput<T> {
    #[diesel(embed)]
    pub record: T,
    #[diesel(sql_type = BigInt)]
    pub total_count: i64,
}

pub fn load_with_pagination<T>(
    select_statement: sea_query::SelectStatement,
    pagination: &PaginationOptions,
    conn: &mut PgConnection,
) -> AppResult<Paginated<T>>
where
    T: QueryableByName<Pg> + Send + 'static,
{
    use diesel::RunQueryDsl;
    let select_statement_alias = SeaRc::new(Alias::new("subquery_stmt"));
    let query = sea_query::Query::select()
        .column((select_statement_alias.clone(), Asterisk))
        .expr_as(Expr::cust("COUNT(*) OVER ()"), Alias::new("total_count"))
        .from_subquery(select_statement, select_statement_alias.clone())
        .limit(pagination.per_page as u64 + 1)
        .offset(pagination.offset().unwrap_or(0) as u64)
        .to_owned();
    let diesel_query = build_diesel_query(query);
    let records_and_total_counted: Vec<CountedOutput<T>> =
        diesel_query.get_results::<CountedOutput<T>>(conn)?;
    let record_and_totals = records_and_total_counted
        .into_iter()
        .map(|record| (record.record, record.total_count))
        .collect();

    let output = compute_paginated(record_and_totals, Some(*pagination));
    Ok(output)
}
