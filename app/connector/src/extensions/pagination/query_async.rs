use diesel::pg::Pg;
use diesel::query_builder::SqlQuery;
use diesel::{sql_query, QueryResult, QueryableByName};

use diesel_async::AsyncConnection;
use sea_query::{Alias, Asterisk, Expr, PostgresQueryBuilder, QueryStatementWriter, SeaRc};
use serde::{Deserialize, Serialize};

use crate::extensions::errors::AppResult;

use super::{Paginated, PaginationOptions};

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

#[derive(Debug, Clone, Copy)]
pub struct PaginatedQuery<T> {
    pub query: T,
    pub options: PaginationOptions,
}

impl<T> PaginatedQuery<T> {
    pub fn load_all_async<'a, U, AsyncConn>(
        self,
        conn: &'a mut AsyncConn,
    ) -> impl std::future::Future<Output = QueryResult<Paginated<U>>> + Send + 'a
    where
        T: 'a,
        U: Send + 'a,
        AsyncConn: AsyncConnection<Backend = Pg> + Send + 'static,
        Self: diesel_async::methods::LoadQuery<'a, AsyncConn, (U, i64)>,
    {
        let options = self.options;
        let results = diesel_async::RunQueryDsl::load(self, conn);
        async move {
            let records_and_total = results.await?;

            Ok(compute_paginated(records_and_total, Some(options)))
        }
    }
}
#[derive(QueryableByName, Debug, Clone, Serialize, Deserialize)]
pub struct CountedOutput<T> {
    #[diesel(embed)]
    pub record: T,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_count: i64,
}
pub fn load_with_pagination_async<'a, U, AsyncConn>(
    select_statement: sea_query::SelectStatement,
    pagination: Option<&'a PaginationOptions>,
    conn: &'a mut AsyncConn,
) -> impl std::future::Future<Output = AppResult<Paginated<U>>> + Send + 'a
where
    U: Send + QueryableByName<Pg> + 'static,
    AsyncConn: AsyncConnection<Backend = Pg>,
{
    let select_statement_alias = SeaRc::new(Alias::new("subquery_stmt"));
    let mut query = sea_query::Query::select()
        .column((select_statement_alias.clone(), Asterisk))
        .expr_as(Expr::cust("COUNT(*) OVER ()"), Alias::new("total_count"))
        .from_subquery(select_statement, select_statement_alias.clone())
        .to_owned();

    if let Some(pagination) = pagination {
        query
            .limit(pagination.per_page as u64 + 1)
            .offset(pagination.offset().unwrap_or(0) as u64);
    }
    let diesel_query = build_diesel_query(query);
    async move {
        let records_and_total_counted =
            diesel_async::RunQueryDsl::get_results::<CountedOutput<U>>(diesel_query, conn);

        let record_and_totals = records_and_total_counted
            .await?
            .into_iter()
            .map(|record| (record.record, record.total_count))
            .collect();
        let output = compute_paginated(record_and_totals, pagination.cloned());
        Ok(output)
    }
}

pub fn load_with_clause_with_pagination_async<'a, U, AsyncConn>(
    select_statement: sea_query::SelectStatement,
    with_clause: sea_query::WithClause,
    pagination: Option<&'a PaginationOptions>,
    conn: &'a mut AsyncConn,
) -> impl std::future::Future<Output = AppResult<Paginated<U>>> + Send + 'a
where
    U: Send + QueryableByName<Pg> + 'static,
    AsyncConn: AsyncConnection<Backend = Pg>,
{
    let select_statement_alias = SeaRc::new(Alias::new("subquery_stmt"));
    let mut query = sea_query::Query::select()
        .column((select_statement_alias.clone(), Asterisk))
        .expr_as(Expr::cust("COUNT(*) OVER ()"), Alias::new("total_count"))
        .from_subquery(select_statement, select_statement_alias.clone())
        .to_owned();

    if let Some(pagination) = pagination {
        query
            .limit(pagination.per_page as u64 + 1)
            .offset(pagination.offset().unwrap_or(0) as u64);
    }

    let stmt = query.with(with_clause);

    let diesel_query = build_diesel_query_with_cte(stmt);
    async move {
        let records_and_total_counted =
            diesel_async::RunQueryDsl::get_results::<CountedOutput<U>>(diesel_query, conn);

        let record_and_totals = records_and_total_counted
            .await?
            .into_iter()
            .map(|record| (record.record, record.total_count))
            .collect();
        let output = compute_paginated(record_and_totals, pagination.cloned());
        Ok(output)
    }
}

#[derive(QueryableByName)]
#[diesel(check_for_backend(Pg))]
struct CountResult {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    total_count: i64,
}

pub fn load_with_clause_count_async<'a, AsyncConn>(
    select_statement: sea_query::SelectStatement,
    with_clause: sea_query::WithClause,
    conn: &'a mut AsyncConn,
) -> impl std::future::Future<Output = AppResult<i64>> + Send + 'a
where
    AsyncConn: AsyncConnection<Backend = Pg>,
{
    let select_statement_alias = SeaRc::new(Alias::new("subquery_stmt"));
    let query = sea_query::Query::select()
        .expr_as(Expr::cust("COUNT(*) "), Alias::new("total_count"))
        .from_subquery(select_statement, select_statement_alias.clone())
        .to_owned();

    let stmt = query.with(with_clause);
    let diesel_query = build_diesel_query_with_cte(stmt);

    async move {
        let output: CountResult =
            diesel_async::RunQueryDsl::get_result::<CountResult>(diesel_query, conn).await?;

        Ok(output.total_count)
    }
}

pub fn load_count_async<'a, AsyncConn>(
    select_statement: sea_query::SelectStatement,

    conn: &'a mut AsyncConn,
) -> impl std::future::Future<Output = AppResult<i64>> + Send + 'a
where
    AsyncConn: AsyncConnection<Backend = Pg>,
{
    let select_statement_alias = SeaRc::new(Alias::new("subquery_stmt"));
    let query = sea_query::Query::select()
        .expr_as(Expr::cust("COUNT(*) "), Alias::new("total_count"))
        .from_subquery(select_statement, select_statement_alias.clone())
        .to_owned();

    let diesel_query = build_diesel_query(query);

    async move {
        let output: CountResult =
            diesel_async::RunQueryDsl::get_result::<CountResult>(diesel_query, conn).await?;
        Ok(output.total_count)
    }
}

pub fn build_diesel_query<T: QueryStatementWriter>(sea_query_stmt: T) -> SqlQuery {
    {
        let q_string = sea_query_stmt.to_string(PostgresQueryBuilder);
        sql_query(q_string)
    }
}

pub fn build_diesel_query_with_cte(sea_query_stmt: sea_query::WithQuery) -> SqlQuery {
    let diesel_query = {
        let q_string = sea_query_stmt.to_string(PostgresQueryBuilder);

        tracing::debug!("Query: {}", q_string);
        sql_query(q_string)
    };
    diesel_query
}
