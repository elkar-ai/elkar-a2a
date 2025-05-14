# Task Store

> **Persistence for every task—choose in-memory or remote.**

The **Task Store** is the persistent backbone of your agent system. It ensures that every task, its status, and its results are reliably stored and retrievable, whether you use fast in-memory storage for development or a remote store for production.

---

## Why Persistence Matters
- **Reliability:** Tasks survive server restarts and crashes (with remote stores).
- **Auditability:** You can always fetch the full history and results of any task.
- **Scalability:** Remote stores let you scale across multiple servers or services.

---

## Storage Backends: Choose What Fits

### 🧪 In-Memory (for dev & testing)
- **Volatile:** Data is lost on restart.
- **Fast:** No network or disk overhead.
- **Use case:** Local development, CI, or ephemeral workloads.

```python
from elkar.store.in_memory import InMemoryTaskManagerStore
store = InMemoryTaskManagerStore()

# Save a task
await store.upsert_task(params)

# Retrieve a task
stored = await store.get_task(task_id="task-123")
```

---

### ☁️ ElkarClientStore (for production & long-running agents)
- **Persistent:** Data is stored remotely and survives restarts.
- **Long-running tasks:** Made for long-running agents.

```python
from elkar.store.elkar_client_store import ElkarClientStore
store = ElkarClientStore(base_url="https://your-elkar-server", api_key="...optional...")

# Save a task
await store.upsert_task(params)

# Retrieve a task
stored = await store.get_task(task_id="task-123")
```

---

## Integration Example

**With a Task Manager:**
```python
from elkar.task_manager.task_manager_with_store import TaskManagerWithStore

# Swap store=... for either InMemoryTaskManagerStore or ElkarClientStore
store = InMemoryTaskManagerStore()  # or ElkarClientStore(...)
task_manager = TaskManagerWithStore(store=store, ...)
```

---

## Interface Reference
```python
class TaskManagerStore(Protocol):
    async def upsert_task(params, ...): ...
    async def get_task(task_id, ...): ...
    async def update_task(task_id, params, ...): ...
```

---

## See Also
- [Task Manager](task_manager.md) 