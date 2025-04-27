# A2A API Client

This is a React + TypeScript client application for testing the Agent-to-Agent (A2A) protocol implementation. It provides a simple UI to interact with an A2A-compatible server.

## Features

- Configure server URL and API key
- Send messages to an A2A agent
- View task status and response
- Get task details by ID
- Cancel tasks
- Display artifacts returned by the agent

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd a2a-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal)

## Usage

1. Configure the API:
   - Enter your A2A server URL (default: http://localhost:8000)
   - Enter your API key if required

2. Send a Task:
   - Type your message in the text area
   - Click "Send Task"

3. Get Task Details:
   - Enter a task ID
   - Click "Get Task" to view the details

4. Cancel a Task:
   - Enter a task ID
   - Click "Cancel Task"

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build locally

### Project Structure

- `src/types/a2aTypes.ts` - TypeScript definitions for A2A protocol
- `src/services/a2aClient.ts` - Client service for interacting with A2A server
- `src/App.tsx` - Main application component
- `src/App.css` - Styling for the application

## License

MIT
