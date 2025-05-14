from mcp.server import Server
from mcp.server.models import InitializationOptions
import mcp.types as types
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
from mcp.server.fastmcp import FastMCP, Context
import os
import json
import datetime
from dotenv import load_dotenv
# from api_client import BreezyAIClient, SupabasePasswordCredentials
from pydantic import AnyUrl
import mcp.server.stdio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
# from database_schema import DATABASE_SCHEMA
import asyncpg
import urllib.parse
import uuid
# Add Elkar A2A client imports
from elkar.a2a_types import Message, TextPart, TaskSendParams, Task, TaskState
from elkar.client.a2a_client import A2AClient, A2AClientConfig


load_dotenv()

settings = dict(
    debug=True,
    log_level="DEBUG",
    warn_on_duplicate_resources=True,
    warn_on_duplicate_tools=True,
    warn_on_duplicate_prompts=True,
)


mcp = FastMCP(
    "A2A com using elkar",
    instructions="""You are a helpful assistant.""",
    # lifespan=breezy_lifespan
)

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


@mcp.tool()
async def send_task_to_a2a_agent(
    ctx: Context, 
    agent_url: str, 
    task_message: str,
    task_id: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 300,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Send a task to an external Elkar A2A agent and retrieve the results.
    Be careful, task are completely stateless, and therefore they are independent and the agent will not remember the context of previous interaction.
    
    Args:
        agent_url: The base URL of the A2A agent to call (e.g., 'http://localhost:5001')
        task_message: The content of the task to send to the agent
        task_id: Optional custom task ID (defaults to auto-generated UUID)
        headers: Optional HTTP headers for authentication or other purposes
        timeout: Timeout in seconds (default: 300)
        metadata: Optional metadata to include with the task
        
    Returns:
        The response from the A2A agent including task status, artifacts, and any error information
    """
    try:
        # Configure the A2A client
        config = A2AClientConfig(
            base_url=agent_url,
            headers=headers,
            timeout=timeout
        )
        
        # Create message from input text
        message = Message(
            role="user", 
            parts=[TextPart(text=task_message)]
        )
        
        # Prepare task parameters - use model_dump to serialize properly
        task_params = TaskSendParams(
            id=task_id or str(uuid.uuid4()),  # Will generate a UUID if None
            message=message,
            metadata=metadata or {},
            sessionId="1"
        )
        
        logger.debug(f"Sending task parameters: {json.dumps(task_params.model_dump())}")
        
        # Use the client as a context manager for proper resource management
        async with A2AClient(config) as client:
            # Get the agent card to verify connection
            try:
                agent_card = await client.get_agent_card()
                agent_info = {
                    "name": agent_card.name,
                    "description": agent_card.description,
                    "version": agent_card.version
                }
            except Exception as e:
                return {
                    "error": f"Failed to connect to A2A agent: {str(e)}",
                    "status": "connection_error"
                }
            
            # Send the task
            try:
                   # Modified task_params before sending:
                if hasattr(task_params, "model_dump"):
                    serialized_params = task_params.model_dump(mode='json')
                else:
                    # Fall back to dict conversion
                    serialized_params = task_params.__dict__
                response = await client.send_task(task_params)  # Use the original task_params object, not the serialized dict
                logger.debug(f"Response: {response}")
                #  Handle error response
                if response.error:
                    
                    return {
                        "error": response.error.message,
                        "status": "task_error",
                        "agent_info": agent_info
                    }
                
                # Handle successful response
                task = response.result
                if task is None:
                    return {
                        "error": "No task received from A2A agent",
                        "status": "task_error",
                        "agent_info": agent_info
                    }
                logger.debug(f"Task: {task}")
                result = {
                    "task_id": task.id,
                    "status": task.status.state.value if task.status and task.status.state else "unknown",
                    "agent_info": agent_info,
                }
                
                # Include the message from the status if available
                if task.status and task.status.message:
                    result["message"] = " ".join([
                        part.text for part in task.status.message.parts 
                        if hasattr(part, "text")
                    ])
                
                # Include artifacts if available
                if task.artifacts and len(task.artifacts) > 0:
                    artifacts_content = []
                    for artifact in task.artifacts:
                        artifact_text = " ".join([
                            part.text for part in artifact.parts 
                            if hasattr(part, "text")
                        ])
                        artifacts_content.append(artifact_text)
                    
                    result["artifacts"] = artifacts_content
                
                return result
                
            except Exception as e:
                return {
                    "error": f"Error while sending task: {str(e)}",
                    "status": "request_error",
                    "agent_info": agent_info
                }
                
    except Exception as e:
        return {
            "error": f"Failed to initialize A2A client: {str(e)}",
            "status": "client_error"
        }

@mcp.tool()
async def get_a2a_agent_card(
    ctx: Context,
    agent_url: str,
    timeout: int = 10,
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Retrieve the agent card from a specific Elkar A2A agent.
    
    Args:
        agent_url: URL of the A2A agent (e.g., 'http://localhost:5001')
        timeout: Connection timeout in seconds (default: 10)
        headers: Optional HTTP headers for authentication or other purposes
        
    Returns:
        Agent card information or error details
    """
    try:
        # Configure the A2A client
        config = A2AClientConfig(
            base_url=agent_url,
            headers=headers,
            timeout=timeout
        )
        
        # Use the client as a context manager for proper resource management
        async with A2AClient(config) as client:
            try:
                # Retrieve the agent card
                agent_card = await client.get_agent_card()
                
                # Extract and return comprehensive information
                result = {
                    "status": "success",
                    "url": agent_url,
                    "name": agent_card.name,
                    "description": agent_card.description,
                    "version": agent_card.version,
                }
                
                # Include capabilities
                if hasattr(agent_card, "capabilities"):
                    result["capabilities"] = {}
                    capabilities = agent_card.capabilities
                    
                    if hasattr(capabilities, "streaming"):
                        result["capabilities"]["streaming"] = capabilities.streaming
                    
                    if hasattr(capabilities, "pushNotifications"):
                        result["capabilities"]["pushNotifications"] = capabilities.pushNotifications
                    
                    if hasattr(capabilities, "stateTransitionHistory"):
                        result["capabilities"]["stateTransitionHistory"] = capabilities.stateTransitionHistory
                
                # Include skills
                if hasattr(agent_card, "skills") and agent_card.skills:
                    result["skills"] = [
                        {"id": skill.id, "name": skill.name} 
                        for skill in agent_card.skills
                    ]
                
                return result
                
            except Exception as e:
                return {
                    "status": "error",
                    "url": agent_url,
                    "error": f"Error retrieving agent card: {str(e)}"
                }
                
    except Exception as e:
        return {
            "status": "error",
            "url": agent_url,
            "error": f"Failed to connect to A2A agent: {str(e)}"
        }

@mcp.tool()
async def discover_a2a_agents(
    ctx: Context,
    agent_urls: Optional[List[str]] = None,
    timeout: int = 10,
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Describe the available Elkar A2A agents and their capabilities.
    
    Args:
        agent_urls: Optional list of URLs to check for A2A agents. If not provided, uses AGENT_URLS from environment.
        timeout: Connection timeout in seconds (default: 10)
        headers: Optional HTTP headers for authentication or other purposes
        
    Returns:
        Dictionary with available agents and their capabilities
    """
    # If agent_urls not provided, use environment variable
    if agent_urls is None:
        # Get from environment and split by comma
        env_urls = os.environ.get('AGENT_URLS', 'http://localhost:5001')
        agent_urls = [url.strip() for url in env_urls.split(',')]
    
    results = {
        "available_agents": [],
        "errors": []
    }
    
    for url in agent_urls:
        try:
            # Configure the A2A client for this URL
            config = A2AClientConfig(
                base_url=url,
                headers=headers,
                timeout=timeout
            )
            
            # Use the client as a context manager for proper resource management
            async with A2AClient(config) as client:
                try:
                    # Retrieve the agent card
                    agent_card = await client.get_agent_card()
                    
                    # Extract key information from the agent card
                    agent_info = {
                        "url": url,
                        "name": agent_card.name,
                        "description": agent_card.description,
                        "version": agent_card.version,
                        "capabilities": {
                            "streaming": agent_card.capabilities.streaming if hasattr(agent_card.capabilities, "streaming") else False,
                            "pushNotifications": agent_card.capabilities.pushNotifications if hasattr(agent_card.capabilities, "pushNotifications") else False,
                            "stateTransitionHistory": agent_card.capabilities.stateTransitionHistory if hasattr(agent_card.capabilities, "stateTransitionHistory") else False,
                        }
                    }
                    
                    # Include skills information if available
                    if hasattr(agent_card, "skills") and agent_card.skills:
                        agent_info["skills"] = [
                            {"id": skill.id, "name": skill.name} 
                            for skill in agent_card.skills
                        ]
                    
                    results["available_agents"].append(agent_info)
                    
                except Exception as e:
                    # Add to errors if we can connect but can't get the agent card
                    results["errors"].append({
                        "url": url,
                        "error": f"Error retrieving agent card: {str(e)}"
                    })
                    
        except Exception as e:
            # Add to errors if we can't even connect to the URL
            results["errors"].append({
                "url": url,
                "error": f"Failed to connect to A2A agent: {str(e)}"
            })
    
    return results

if __name__ == "__main__":
    mcp.run("stdio")
    # mcp.run("sse")
    # export CONFIG=/Users/mm/BreezyAI/backend/mcp_breezy/config.json
    # /Users/mm/BreezyAI/backend/mcp_breezy/server_template.py

    # mcp.run()
