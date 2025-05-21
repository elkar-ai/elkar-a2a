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
from pydantic import AnyUrl
import mcp.server.stdio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
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
    """Sends a task to a specified Elkar A2A (Agent-to-Agent) compliant agent and awaits its response.

    As an MCP tool, this function communicates with a running A2A agent (server) to request task execution.
    It leverages the Elkar A2A protocol; this framework is utilized for debugging, logging of task interactions, 
    and maintaining the status of the submitted task.
    The function constructs a task with the given message and parameters, sends it to the target agent's URL,
    and then processes the agent's response. The interaction is stateless, meaning each call is independent,
    and the remote agent does not retain context from previous calls unless explicitly managed within the task itself.

    The function first attempts to retrieve the agent's 'card' (a summary of its capabilities and identity)
    to ensure connectivity and gather basic information. If successful, it proceeds to send the actual task.
    The response from the agent, which includes the task's final status, any generated artifacts (results),
    and potential error messages, is then parsed and returned.

    Args:
        ctx: The MCP (Multi-Capability Platform) context object, providing access to platform features.
        agent_url: The complete base URL of the target Elkar A2A agent (e.g., 'http://localhost:5001').
        task_message: The primary content or instruction for the task to be performed by the remote agent.
        task_id: An optional custom identifier for the task. If not provided, a unique UUID will be automatically generated.
        headers: Optional dictionary of HTTP headers to include in the request, typically for authentication (e.g., API keys) or custom routing.
        timeout: The maximum time in seconds to wait for a response from the A2A agent. Defaults to 300 seconds (5 minutes).
        metadata: Optional dictionary of arbitrary key-value pairs to be sent along with the task, which the remote agent might use.

    Returns:
        A dictionary containing the outcome of the task interaction. This includes:
        - 'task_id': The ID of the task.
        - 'status': The final state of the task (e.g., 'completed', 'failed', 'input_required').
        - 'agent_info': Basic information about the agent (name, description, version).
        - 'message': (Optional) A message from the agent related to the task's status.
        - 'artifacts': (Optional) A list of strings, where each string is the content of an artifact produced by the agent.
        - 'error': (Optional) An error message if any part of the process failed (e.g., connection error, task error, client initialization error).
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
    # ctx: Context,
    agent_url: str,
    # timeout: int = 10,
    # headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Retrieves and returns the 'Agent Card' from a specified Elkar A2A agent.

    The Agent Card provides metadata about an A2A agent, including its name, description, version,
    capabilities (like streaming support, push notifications, state history), and the skills it offers.
    This function is useful for discovering an agent's functionalities before sending it tasks.

    Args:
        ctx: The MCP context object.
        agent_url: The base URL of the Elkar A2A agent from which to fetch the card (e.g., 'http://localhost:5001').
        timeout: The maximum time in seconds to wait for a response from the agent. Defaults to 10 seconds.
        headers: Optional dictionary of HTTP headers to include in the request, often used for authentication.

    Returns:
        A dictionary containing the agent card information upon success, or error details upon failure.
        Successful response structure:
        - 'status': 'success'
        - 'url': The agent_url queried.
        - 'name': Name of the agent.
        - 'description': Description of the agent.
        - 'version': Version of the agent.
        - 'capabilities': (Optional) Dictionary of agent capabilities (streaming, pushNotifications, stateTransitionHistory).
        - 'skills': (Optional) List of skills, each with 'id' and 'name'.
        Error response structure:
        - 'status': 'error'
        - 'url': The agent_url queried.
        - 'error': A message detailing the error (e.g., connection failure, error retrieving card).
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
    """Discovers available Elkar A2A agents by querying a list of URLs and summarizing their capabilities, potentially enabling new features by identifying agents with specific skills.

    This function iterates through a provided list of agent URLs (or a default list from environment variables)
    and attempts to retrieve the Agent Card from each. It compiles a report of successfully contacted agents
    along with their key information (name, description, version, capabilities, skills) and a list of any
    URLs that resulted in errors (e.g., connection failed, agent card not retrieved).

    This is useful for dynamically finding and understanding the A2A agents available in a network.

    Returns:
        A dictionary with two keys:
        - 'available_agents': A list of dictionaries, where each dictionary represents a successfully
          contacted agent and contains its 'url', 'name', 'description', 'version',
          'capabilities' (streaming, pushNotifications, stateTransitionHistory), and 'skills'.
        - 'errors': A list of dictionaries, where each entry details an error encountered while trying
          to contact an agent, including the 'url' and an 'error' message.
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
    load_dotenv()
    mcp.run("stdio")