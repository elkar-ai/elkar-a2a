# from dataclasses import dataclass
# from datetime import datetime
# import psycopg
# from elkar.a2a_types import Task, TaskSendParams, TaskState, TaskStatus, Message
# from elkar.store.base import TaskManagerStore, StoredTask, UpdateTaskParams
# from sqlalchemy.orm import Mapped, mapped_column
# import sqlalchemy as sa
# from sqlalchemy.ext.declarative import declarative_base
# from contextlib import asynccontextmanager

# Base = declarative_base()


# class PostgreSQLTaskStore(TaskManagerStore):
#     async def __init__(self, db_url: str) -> None:
#         self.db_url = db_url
#         self.conn = await psycopg.AsyncConnection.connect(self.db_url)
#         self.cursor = self.conn.cursor()

#     @asynccontextmanager
#     async def transaction(self):
#         """Async context manager for transaction handling.

#         Example:
#             async with store.transaction():
#                 task = await store.get_task(task_id)
#                 # Do something with the task
#                 # Transaction will be automatically committed if no exception occurs
#                 # or rolled back if an exception occurs
#         """
#         try:
#             await self.begin_transaction()
#             yield
#             await self.commit_transaction()
#         except Exception:
#             await self.rollback_transaction()
#             raise

#     async def begin_transaction(self):
#         """Begin a new transaction."""
#         await self.conn.execute("BEGIN")

#     async def commit_transaction(self):
#         """Commit the current transaction."""
#         await self.conn.commit()

#     async def rollback_transaction(self):
#         """Rollback the current transaction."""
#         await self.conn.rollback()

#     async def get_task(
#         self,
#         task_id: str,
#         history_length: int | None = None,
#         caller_id: str | None = None,
#     ) -> StoredTask:
#         query = """
#             SELECT *
#             FROM task
#             WHERE uuid = %s
#         """
#         params = [task_id]

#         if caller_id is not None:
#             query += " AND caller_id = %s"
#             params.append(caller_id)

#         await self.cursor.execute(query, params)
#         row = await self.cursor.fetchone()

#         if row is None:
#             raise ValueError(f"Task {task_id} does not exist")

#         # Convert row to StoredTask
#         return StoredTask(
#             id=row[0],
#             caller_id=row[2],
#             session_id=row[1],
#             task=Task(
#                 id=row[0],
#                 status=TaskStatus.from_dict(row[4]),
#                 sessionId=row[1],
#                 history=(
#                     row[3].get("history", [])[-history_length:]
#                     if history_length
#                     else row[3].get("history", [])
#                 ),
#                 metadata=row[3].get("metadata", {}),
#             ),
#             push_notification=row[3].get("push_notification"),
#             created_at=row[5],
#             updated_at=row[6],
#         )

#     async def upsert_task(
#         self, params: TaskSendParams, caller_id: str | None = None
#     ) -> StoredTask:
#         await self.cursor.execute(
#             """
#             INSERT INTO tasks (uuid, session_id, caller_id, task, status, created_at, updated_at)
#             VALUES (%s, %s, %s, %s, %s, %s, %s)
#             ON CONFLICT (uuid) DO UPDATE SET status = %s, updated_at = %s
#             """,
#             (
#                 params.id,
#                 params.sessionId,
#                 caller_id,
#                 {
#                     "history": [params.message],
#                     "metadata": params.metadata or {},
#                     "push_notification": params.pushNotification,
#                 },
#                 TaskStatus(
#                     state=TaskState.SUBMITTED,
#                     message=params.message,
#                     timestamp=datetime.now(),
#                 ).to_dict(),
#                 datetime.now(),
#                 datetime.now(),
#                 TaskStatus(
#                     state=TaskState.SUBMITTED,
#                     message=params.message,
#                     timestamp=datetime.now(),
#                 ).to_dict(),
#                 datetime.now(),
#             ),
#         )
#         return await self.get_task(params.id, caller_id=caller_id)

#     async def update_task(self, task_id: str, params: UpdateTaskParams) -> StoredTask:
#         # First get the current task
#         current_task = await self.get_task(task_id)

#         # Prepare update fields
#         update_fields = []
#         update_values = []

#         if params.status is not None:
#             update_fields.append("status = %s")
#             update_values.append(params.status.to_dict())

#         if params.new_messages is not None:
#             current_task.task.history.extend(params.new_messages)
#             update_fields.append("task = jsonb_set(task, '{history}', %s)")
#             update_values.append(current_task.task.history)

#         if params.metadata is not None:
#             current_task.task.metadata.update(params.metadata)
#             update_fields.append("task = jsonb_set(task, '{metadata}', %s)")
#             update_values.append(current_task.task.metadata)

#         if params.push_notification is not None:
#             update_fields.append("task = jsonb_set(task, '{push_notification}', %s)")
#             update_values.append(params.push_notification.to_dict())

#         if params.caller_id is not None:
#             update_fields.append("caller_id = %s")
#             update_values.append(params.caller_id)

#         if not update_fields:
#             return current_task

#         update_fields.append("updated_at = %s")
#         update_values.append(datetime.now())

#         query = f"""
#             UPDATE tasks
#             SET {', '.join(update_fields)}
#             WHERE uuid = %s
#         """
#         update_values.append(task_id)

#         await self.cursor.execute(query, update_values)
#         return await self.get_task(task_id)
