# Elkar

**The open-source protocol to send, track, and orchestrate tasks between AI agents based on Google's Agent2Agent Protocol (A2A).**

No more silos. Elkar lets your agents collaborate — even across companies or tech stacks.

[Website](http://elkar.co) &nbsp;&nbsp;&nbsp; [💬 Discord](https://discord.gg/f5Znhcvm) &nbsp;&nbsp;&nbsp; [Open Issues](https://github.com/elkar-ai/elkar/issues) &nbsp;&nbsp;&nbsp; [Open PRs](https://github.com/elkar-ai/elkar/pulls)

## ✨ What is Elkar?

Elkar is an open-source framework designed to coordinate **multiple AI agents**, even across different companies or systems.

Use it to:
- **Send tasks** to any agent via API
- **Track long-running jobs** asynchronously
- **Stream workflows** between agents in real-time
- **Browse and manage task history** for visibility

Built for developers and teams who want to orchestrate autonomous agent networks — without reinventing the wheel.

## 🧪 Getting Started

1. **Clone the repo**

## 📦 Python Package

The  Python package provides a simple implementation of the A2A protocol for building and connecting AI agents.



### Basic Usage

```python
from elkar import A2AServer, TaskManager

# Create your task manager
task_manager = TaskManager()

# Initialize the A2A server
server = A2AServer(
    task_manager=task_manager,
    host="0.0.0.0",
    port=5000
)

# Start the server
server.start()
```

### Features
- Full A2A protocol implementation
- Built-in task management
- Support for streaming responses
- Push notifications
- State transition history
- CORS support
- Custom authentication

## 🖥️ A2A Client

The A2A client is a React + TypeScript application for testing and interacting with A2A-compatible servers.

### Features
- Configure server URL (authentication coming soon)
- Send messages to A2A Servers
- View task status and responses
- Get task details by ID
- Cancel tasks
- Display artifacts returned by agents
- Task management

### Getting Started with the Client

1. **Install dependencies**
```bash
cd a2a-client
npm install
```

2. **Start the development server**
```bash
npm run dev
```

3. **Open your browser** at `http://localhost:5173`

### Usage
- Configure your A2A server URL and API key
- Send tasks and messages to agents
- Monitor task status and responses
- Manage task history and artifacts

## Community
Join our [Discord server](https://discord.gg/f5Znhcvm)

## Contribute
We ❤️ feedback, issues, PRs, and ideas!
Open a [pull request](https://github.com/elkar-ai/elkar/pulls), and we'll review it as soon as possible.

If you find Elkar useful, a GitHub ⭐️ would mean a lot!
It helps more people discover the project and join the journey! 


