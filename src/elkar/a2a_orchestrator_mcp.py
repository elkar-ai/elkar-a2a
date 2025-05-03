from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Dict, Optional
from uuid import uuid4


from elkar.a2a_types import AgentCard, Message, Task, TaskSendParams
from elkar.client.a2a_client import A2AClient, A2AClientConfig
from mcp.server.fastmcp import FastMCP, Context
import httpx
from pydantic import BaseModel

# Create the MCP server


class MCP2AContext:
    async def __init__(self):
        self._agent_urls = []
        self._agent_cards: dict[str, AgentCard] = {}
        self.a2a_clients: dict[str, A2AClient] = {}
        self.session_id = uuid4().hex
        await self.initiate()

    async def initiate(self):
        for url in self._agent_urls:
            agent_config = A2AClientConfig(base_url=url)
            self.a2a_clients[url] = A2AClient(agent_config)
            self._agent_cards[url] = await self.a2a_clients[url].get_agent_card()

    async def list_agent_cards(self) -> list[AgentCard]:
        return list(self._agent_cards.values())


@asynccontextmanager
async def breezy_lifespan(server: FastMCP) -> AsyncIterator[MCP2AContext]:
    """Manage MCP2A client lifecycle with OAuth handling"""
    try:
        yield MCP2AContext()

    finally:
        pass


mcp = FastMCP(
    name="MCP2A MCP",
    instructions="This is the MCP2A MCP",
    lifespan=breezy_lifespan,
)


def get_mcp2a_context(ctx: Context) -> MCP2AContext:
    return ctx.request_context.lifespan_context


@mcp.tool()
async def list_a2a_servers(ctx: Context) -> dict[str, Any]:
    mcp2a_ctx = get_mcp2a_context(ctx)
    agent_cards = await mcp2a_ctx.list_agent_cards()
    return {
        "agent_cards": [
            {
                "name": card.name,
                "description": card.description,
                "url": card.url,
            }
            for card in agent_cards
        ],
    }


@mcp.tool()
async def send_task(
    ctx: Context, url: str, task_send_params: TaskSendParams
) -> Task | str:
    """Send a task to a specific A2A server

    Args:
        url: The URL of the A2A server
        message: The message to send to the A2A server. The message is a JSON object with the following fields:
            - role: The role of the message sender your role is "user"
            - parts: The parts of the message
            - metadata: The metadata of the message

    Returns:
        The response from the A2A server
    """

    mcp2a_ctx = get_mcp2a_context(ctx)
    if url not in mcp2a_ctx.a2a_clients:
        return f"Error: Server {url} not found"
    a2a_client = mcp2a_ctx.a2a_clients[url]
    task_send_params.sessionId = mcp2a_ctx.session_id
    task = await a2a_client.send_task(task_send_params)
    if task.result:
        return task.result
    elif task.error:
        return task.error.message
    else:
        return "Error: Unknown error"


if __name__ == "__main__":
    mcp.run()
