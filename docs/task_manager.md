# Task Manager

The **Task Manager** is the core component responsible for managing tasks, including creation, retrieval, cancellation, and notifications. It acts as the business logic layer between the server and the underlying task store/queue.

## Key Responsibilities
- Receives and processes task-related requests from the server
- Interacts with the Task Store and Task Queue for persistence and execution
- Handles task lifecycle: creation, status updates, cancellation, and notifications

## Main Methods
- `get_task(request, context)` — Retrieve task information
- `send_task(request, context)` — Submit a new task
- `send_task_streaming(request, context)` — Submit a task with streaming response
- `cancel_task(request, context)` — Cancel a running task
- `set_task_push_notification(request, context)` — Set up push notifications for task updates
- `get_task_push_notification(request, context)` — Retrieve push notification settings
- `resubscribe_to_task(request, context)` — Resubscribe to task updates

## Usage
Implement or extend a Task Manager and provide it to the server:

```python
from elkar.task_manager.task_manager_base import TaskManager

class MyTaskManager(TaskManager):
    ...

server = A2AServer(task_manager=MyTaskManager())
```

---
See also: [Task Store](task_store.md), [Task Queue](task_queue.md) 