from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import logging
from typing import Any, Dict, List
from uuid import uuid4

from elkar.host.host_agent import HostAgent, HostAgentConfig
from elkar.a2a_types import (
    Message,
    TextPart,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="A2A Host Agent")

# Create host agent instance
host_agent = HostAgent(
    config=HostAgentConfig(
        name="Conversational Host Agent",
        description="A host agent that interfaces between humans and AI agents",
        version="1.0.0",
        base_url="http://localhost:8000",
        agent_registry_urls=[
            "http://localhost:8001",  # Example agent registry URL
            "http://localhost:8002",  # Another example agent registry URL
        ],
    )
)


@app.on_event("startup")
async def startup_event():
    """Initialize the host agent on startup."""
    await host_agent.initialize()


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    await host_agent.cleanup()


# Serve static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def get_chat_interface():
    """Serve the chat interface."""
    with open("static/index.html") as f:
        return HTMLResponse(content=f.read())


@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections for chat."""
    await websocket.accept()

    # Generate a unique user ID for this session
    user_id = str(uuid4())

    try:
        while True:
            # Receive message from user
            message = await websocket.receive_text()

            # Process message with host agent
            async for response in host_agent.handle_user_message(user_id, message):
                # Send response back to user
                await websocket.send_json(
                    {
                        "role": response.role,
                        "content": (
                            response.parts[0].text
                            if response.parts
                            and isinstance(response.parts[0], TextPart)
                            else ""
                        ),
                    }
                )

    except Exception as e:
        logger.exception("Error in WebSocket connection")
        await websocket.close()


@app.get("/.well-known/agent.json")
async def get_agent_card():
    """Get the agent card describing this host's capabilities."""
    return host_agent.get_agent_card()


@app.get("/conversation/{user_id}")
async def get_conversation_history(user_id: str) -> List[Dict[str, Any]]:
    """Get the conversation history for a user."""
    messages = await host_agent.get_conversation_history(user_id)
    return [
        {
            "role": msg.role,
            "content": (
                msg.parts[0].text
                if msg.parts and isinstance(msg.parts[0], TextPart)
                else ""
            ),
        }
        for msg in messages
    ]


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500, content={"error": "Internal server error", "detail": str(exc)}
    )
