use diesel::prelude::*;
use diesel_async::AsyncPgConnection;
use uuid::Uuid;

use crate::extensions::errors::AppResult;
use database_schema::schema::*;

pub async fn delete_agent(id: Uuid, conn: &mut AsyncPgConnection) -> AppResult<()> {
    let delete_stmt = diesel::update(agent::table)
        .filter(agent::id.eq(id))
        .set(agent::is_deleted.eq(true));

    diesel_async::RunQueryDsl::execute(delete_stmt, conn).await?;

    Ok(())
}
