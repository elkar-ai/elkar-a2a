# Server

The **Server** component is responsible for handling incoming API requests, routing them to the appropriate task management logic, and returning responses. It is built using Starlette and supports CORS, JSON-RPC, and streaming responses.

## Key Features
- Handles JSON-RPC requests for task management
- Supports CORS and streaming (SSE) responses
- Integrates with a Task Manager for business logic

## Main API
- `POST /` — Main endpoint for JSON-RPC requests
- `GET /.well-known/agent.json` — Returns the agent card (metadata)

## Usage
Instantiate the server with a Task Manager implementation and start it:

```python
from elkar.server.server import A2AServer
from elkar.task_manager.task_manager_base import TaskManager

server = A2AServer(task_manager=TaskManager())
server.start()
```

---
See also: [Task Manager](task_manager.md) 