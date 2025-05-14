#!/usr/bin/env python
"""
Elkar A2A server that wraps a CrewAI agent for Gmail and animal color tasks.
"""
import asyncio
import os
import json
import base64
from typing import List, Optional, Dict, Any, Tuple
import uuid
from datetime import datetime
import pickle
# You'll need to install these packages:
# pip install crewai langchain-openai langchain-core elkar dotenv
# pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
from crewai import Agent, Task as CrewTask, Crew, Process
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from dotenv import load_dotenv
import uvicorn
import httplib2

# Google API imports
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.errors import HttpError

# Elkar imports
from elkar.a2a_types import (
    AgentCard,
    AgentCapabilities,
    TaskStatus,
    TaskState,
    Message,
    TextPart,
    Artifact,
    AgentSkill,
)
from elkar.server.server import A2AServer
from elkar.task_manager.task_manager_base import RequestContext
from elkar.task_manager.task_manager_with_task_modifier import TaskManagerWithModifier
from elkar.task_modifier.base import TaskModifierBase
from elkar.task_modifier.task_modifier import TaskModifier
from elkar.a2a_types import *
from elkar.store.elkar_client_store import ElkarClientStore
from elkar.server.server import A2AServer
from elkar.task_manager.task_manager_base import RequestContext
from elkar.task_manager.task_manager_with_task_modifier import TaskManagerWithModifier
from elkar.task_modifier.base import TaskModifierBase

# Load environment variables
load_dotenv()

# Define the Gmail API scopes - use multiple scopes to ensure we have proper permissions
GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',     # Read-only access to Gmail
    'https://www.googleapis.com/auth/gmail.modify',       # Access to modify emails (not delete)
    'https://www.googleapis.com/auth/gmail.labels',       # Access to modify labels
    'https://mail.google.com/'                            # Full access to Gmail (includes send)
]
GMAIL_TOKEN_FILE = 'gmail_token.json'
GMAIL_CREDENTIALS_FILE = 'credentials.json'



# @tool
# async def ask_required_inputs(
#     message: str,
#     ) -> str:
#     """
#     Ask the user for required inputs.
#     Args:
#         message: The message to display to the user
#     Returns:
#         The user's response"""
#     #set the elkas tasks status from input.required to working. 
#     # it kill the http connexion and wait for claude next http call
#     #

# Remove Animal color tool for CrewAI
# @tool
# def get_animal_color(animal: str) -> str:
#     """
#     Returns the color associated with the specified animal.
#     Args:
#         animal: Must be either 'cat' or 'dog'
#     Returns:
#         The color associated with the animal: 'red' for cat, 'blue' for dog
#     """
#     if animal.lower() == "cat":
#         return "red"
#     elif animal.lower() == "dog":
#         return "blue"
#     else:
#         return f"Error: '{animal}' is not supported. Please specify either 'cat' or 'dog'."


# Gmail API tools
def get_gmail_service(force_reauth: bool = False):
    """
    Gets an authorized Gmail API service instance.
    
    Args:
        force_reauth: If True, forces re-authentication by deleting existing token
        
    Returns:
        A Gmail API service object.
    """
    creds = None
    
    # If force_reauth is True, delete the token file if it exists
    if force_reauth and os.path.exists(GMAIL_TOKEN_FILE):
        os.remove(GMAIL_TOKEN_FILE)
        print(f"Deleted existing token file to force re-authentication")
    
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists(GMAIL_TOKEN_FILE):
        with open(GMAIL_TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
        print(f"Loaded credentials from {GMAIL_TOKEN_FILE}")
    
    # If credentials don't exist or are invalid, prompt the user to log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print(f"Refreshing expired credentials")
            creds.refresh(Request())
        else:
            # Check if credentials file exists
            if not os.path.exists(GMAIL_CREDENTIALS_FILE):
                raise FileNotFoundError(f"Credentials file not found: {GMAIL_CREDENTIALS_FILE}. Please set up OAuth credentials.")
            
            print(f"Starting new OAuth flow with scopes: {GMAIL_SCOPES}")
            flow = InstalledAppFlow.from_client_secrets_file(
                GMAIL_CREDENTIALS_FILE, GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)
            print(f"New authentication completed")
        
        # Save the credentials for the next run
        with open(GMAIL_TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
            print(f"Saved credentials to {GMAIL_TOKEN_FILE}")
    
    service = build('gmail', 'v1', credentials=creds)
    return service


@tool
def read_emails(max_results: int = 10, force_reauth: bool = False) -> str:
    """
    Reads a specified number of emails from the user's inbox.
    Args:
        max_results: Maximum number of emails to retrieve
        force_reauth: Whether to force re-authentication
    Returns:
        A string with email information
    """
    try:
        service = get_gmail_service(force_reauth=force_reauth)
        results = service.users().messages().list(userId='me', maxResults=max_results).execute()
        messages = results.get('messages', [])
        
        if not messages:
            return "No messages found."
        
        email_info = []
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id']).execute()
            
            # Extract headers
            headers = msg['payload']['headers']
            subject = next((header['value'] for header in headers if header['name'].lower() == 'subject'), 'No Subject')
            sender = next((header['value'] for header in headers if header['name'].lower() == 'from'), 'Unknown Sender')
            date = next((header['value'] for header in headers if header['name'].lower() == 'date'), 'Unknown Date')
            
            # Get snippet
            snippet = msg.get('snippet', 'No preview available')
            
            email_info.append(f"From: {sender}\nSubject: {subject}\nDate: {date}\nSnippet: {snippet}\n---")
        
        return "\n".join(email_info)
    
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


@tool
def search_emails(query: str, max_results: int = 10, force_reauth: bool = False) -> str:
    """
    Searches emails based on a Gmail search query.
    Args:
        query: Gmail search query (e.g., 'from:example@gmail.com')
        max_results: Maximum number of results to return
        force_reauth: Whether to force re-authentication
    Returns:
        A string with matching email information
    """
    try:
        service = get_gmail_service(force_reauth=force_reauth)
        results = service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
        messages = results.get('messages', [])
        
        if not messages:
            return f"No messages found matching query: {query}"
        
        email_info = []
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id']).execute()
            
            # Extract headers
            headers = msg['payload']['headers']
            subject = next((header['value'] for header in headers if header['name'].lower() == 'subject'), 'No Subject')
            sender = next((header['value'] for header in headers if header['name'].lower() == 'from'), 'Unknown Sender')
            date = next((header['value'] for header in headers if header['name'].lower() == 'date'), 'Unknown Date')
            
            # Get snippet
            snippet = msg.get('snippet', 'No preview available')
            
            email_info.append(f"From: {sender}\nSubject: {subject}\nDate: {date}\nSnippet: {snippet}\n---")
        
        return "\n".join(email_info)
    
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


class CrewAIWrapper:
    """Wrapper for CrewAI agents that handles Gmail and animal color tasks."""
    
    def __init__(self, verbose: bool = True, model_name: str = "gpt-3.5-turbo-0125"):
        """Initialize the CrewAI wrapper with a Gmail and animal color agent."""
        # Setup LLM
        api_key=os.getenv("OPENAI_API_KEY")
        print(api_key)
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            api_key=api_key
        )
        
        # Create the agent
        self.agent = Agent(
            role="Email Assistant",
            goal="Help users access their email content. Coordinate with the Calendar Assistant for tasks requiring calendar management.",
            backstory="You are an expert email assistant. You can read and search emails. You are also aware of a Google Calendar Assistant and can suggest using it if a user's request involves creating, modifying, or querying calendar events (e.g., 'add this meeting to my calendar', 'what is my schedule for next Monday?').",
            verbose=verbose,
            allow_delegation=False,
            tools=[read_emails, search_emails], # Removed get_animal_color
            llm=llm
        )
        
        # Define the CrewAI structure
        self.crew = Crew(
            agents=[self.agent],
            tasks=[],
            verbose=verbose,
            process=Process.sequential,
        )
    
    # async def get_animal_color(self, prompt: str) -> str: # Removed this method
    #     """
    #     Run the CrewAI agent to get animal color based on the prompt.
    #     
    #     Args:
    #         prompt: The user's prompt for animal color
    #         
    #     Returns:
    #         The animal color
    #     """
    #     # Create a dynamic task based on user input
    #     print(f"Animal Prompt: {prompt}")
    #     task = CrewTask(
    #         description=f"Determine the animal color for: {prompt}",
    #         expected_output="The color associated with the specified animal (red for cat, blue for dog)",
    #         agent=self.agent,
    #         status={
    #             "state": "submitted", 
    #             "created_at": datetime.now().isoformat()
    #         }
    #     )
    #     # Update crew tasks and execute
    #     self.crew.tasks = [task]
    #     
    #     # Run the crew in an executor to avoid blocking
    #     loop = asyncio.get_event_loop()
    #     result = await loop.run_in_executor(None, self.crew.kickoff)
    #     # Extract string from CrewOutput object
    #     if hasattr(result, 'raw'):
    #         return str(result.raw)
    #     return str(result)
    
    async def process_email_query(self, prompt: str) -> str:
        """
        Run the CrewAI agent to process email queries.
        
        Args:
            prompt: The user's email-related prompt
            
        Returns:
            The email information requested
        """
        # Metaprompt for collaboration
        metaprompt = (
            "You are the Gmail Assistant. If the user's request seems to require calendar operations "
            "(e.g., 'find the flight details and add it to my calendar', 'what are my meetings today?', "
            "'create an event for the details I found in this email'), "
            "first state that you will handle the email-specific parts if any (like extracting details), and then clearly suggest that the user "
            "should ask the Google Calendar Assistant to perform calendar operations (like creating or listing events). "
            "Do not attempt to directly modify or query the calendar yourself. "
            "For example, if asked to 'find the meeting details in my email and add it to my calendar', you should respond by saying something like: "
            "'I found the meeting details: [details]. Please ask the Google Calendar Assistant to add this to your calendar.' "
            "If the request is purely about email functions (e.g., 'read my latest emails', 'search for emails from John'), proceed as usual."
        )

        # Check if this is a request to force re-authentication
        force_reauth = "force reauth" in prompt.lower() or "re-authenticate" in prompt.lower()
        
        # If permission error is mentioned, suggest re-authentication
        if "permission" in prompt.lower() or "403" in prompt or "insufficient authentication" in prompt:
            update_prompt = f"{prompt}\n\nIt seems there might be authentication or permission issues. Try using force_reauth=True to re-authenticate with Gmail."
        else:
            update_prompt = prompt
        
        # Create a dynamic task based on user input
        print(f"Email Prompt: {update_prompt}")
        task = CrewTask(
            description=f"{metaprompt}\\n\\nUser request: {update_prompt}",
            expected_output="Retrieved email information based on the user's request, or guidance to consult the Calendar assistant.",
            agent=self.agent,
            status={
                "state": "submitted", 
                "created_at": datetime.now().isoformat()
            }
        )
        
        # Update crew tasks and execute
        self.crew.tasks = [task]
        
        # Run the crew in an executor to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self.crew.kickoff)
        # Extract string from CrewOutput object
        if hasattr(result, 'raw'):
            return str(result.raw)
        return str(result)
                


# Set up Elkar A2A server with CrewAI integration
async def setup_server():
    """Main function to set up the Elkar A2A server with CrewAI integration."""
    
    # Create the CrewAI wrapper
    crew_ai_wrapper = CrewAIWrapper()
    
    # Create the agent card - using proper AgentSkill objects
    agent_card = AgentCard(
        name="Gmail Assistant",
        description="Manages Gmail. Can read and search emails. Collaborates with the Google Calendar Assistant for tasks requiring calendar operations (e.g., creating events from email details).",
        url="http://localhost:5001",
        version="1.0.0",
        skills=[
            AgentSkill(id="email-assistant", name="email-assistant"),
            AgentSkill(id="gmail-integration", name="gmail-integration")
        ],
        capabilities=AgentCapabilities(
            streaming=True,
            pushNotifications=True,
            stateTransitionHistory=True,
        ),
    )
    
    # Define the task handler to process requests via CrewAI
    async def task_handler(
        task: TaskModifier, request_context: RequestContext | None
    ) -> None:
        """Handle tasks by using the CrewAI wrapper to get animal colors or process email requests."""
        
        try:
            # Access the task message using the pattern from crewai_a2a_server.py
            task_obj = task._task
            user_prompt = ""
            print(f"Task: {task_obj}")
            
            # Extract text from message parts if they exist
            if hasattr(task_obj, 'status') and hasattr(task_obj.status, 'message') and task_obj.status.message and hasattr(task_obj.status.message, 'parts'):
                for part in task_obj.status.message.parts:
                    if hasattr(part, "text"):
                        user_prompt += part.text
            # If no message in status, try to look in history
            elif hasattr(task_obj, 'history') and task_obj.history and len(task_obj.history) > 0:
                for msg in task_obj.history:
                    if hasattr(msg, 'parts'):
                        for part in msg.parts:
                            if hasattr(part, "text"):
                                user_prompt += part.text
            
            print(f"User prompt: {user_prompt}")
            if not user_prompt:
                await task.set_status(
                    TaskStatus(
                        state=TaskState.FAILED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="No text prompt was provided in the request.")],
                        ),
                    ),
                    is_final=True,
                )
                return
            
            # Check if this is a request to re-authenticate
            if "force reauth" in user_prompt.lower() or "re-authenticate" in user_prompt.lower():
                await task.set_status(
                    TaskStatus(
                        state=TaskState.WORKING,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="I'll try to re-authenticate with Gmail...")],
                        ),
                    )
                )
                
                # Try forcing re-authentication first
                try:
                    get_gmail_service(force_reauth=True)
                    await task.set_status(
                        TaskStatus(
                            state=TaskState.WORKING,
                            message=Message(
                                role="agent",
                                parts=[TextPart(text="Successfully re-authenticated with Gmail. Now processing your request...")],
                            ),
                        )
                    )
                except Exception as e:
                    await task.set_status(
                        TaskStatus(
                            state=TaskState.FAILED,
                            message=Message(
                                role="agent",
                                parts=[TextPart(text=f"Failed to re-authenticate: {str(e)}")],
                            ),
                        ),
                        is_final=True,
                    )
                    return
            else:
                # Send initial status update
                await task.set_status(
                    TaskStatus(
                        state=TaskState.WORKING,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="I'm processing your request...")],
                        ),
                    )
                )
            
            # Determine if this is an email-related request
            is_email_request = any(keyword in user_prompt.lower() for keyword in 
                               ["email", "gmail", "inbox", "message", "mail"])
            
            # Determine if this is an animal color request - REMOVED
            # is_animal_request = any(keyword in user_prompt.lower() for keyword in 
            #                     ["cat", "dog", "animal", "color"])
            
            if is_email_request:
                # Call CrewAI to process email query
                result = await crew_ai_wrapper.process_email_query(user_prompt)
            # elif is_animal_request: # REMOVED
                # Call CrewAI to get animal color
                # result = await crew_ai_wrapper.get_animal_color(user_prompt)
            else:
                # Default to helping determine what the request is about
                result = "I'm not sure what you're asking for. I can help with email-related tasks. Please specify a Gmail request."
            
            # Add the generated text as an artifact
            await task.upsert_artifacts(
                [
                    Artifact(
                        parts=[TextPart(text=result)],
                        index=0,
                    )
                ]
            )
            
            # Mark the task as completed
            await task.set_status(
                TaskStatus(
                    state=TaskState.COMPLETED,
                    message=Message(
                        role="agent",
                        parts=[TextPart(text="Request completed successfully!")],
                    ),
                ),
                is_final=True,
            )
            
        except Exception as e:
            # Handle any errors
            error_message = f"Error processing request: {str(e)}"
            await task.set_status(
                TaskStatus(
                    state=TaskState.FAILED,
                    message=Message(
                        role="agent",
                        parts=[TextPart(text=error_message)],
                    ),
                ),
                is_final=True,
            )
    
    # Create the task manager with the handler
    task_manager = TaskManagerWithModifier(
        agent_card, send_task_handler=task_handler
    )
    

    

    # Configure the ElkarClientStore
    api_key = "sk_elkar_0s8MbK+hdy8cYypF9AN6pAFpnPjwXHmVb5BonqHEEp4="  # Replace with your actual Elkar API key
    store = ElkarClientStore(base_url="https://api.elkar.co/api", api_key=api_key)

    task_manager: TaskManagerWithModifier = TaskManagerWithModifier(
        agent_card, 
        send_task_handler=task_handler,
        store=store  # Pass the configured store to the task manager
    )

    server = A2AServer(task_manager, host="0.0.0.0", port=5001, endpoint="/")
    # Create and return the server
    # server = A2AServer(task_manage÷r, host="0.0.0.0", port=5001, endpoint="/")
    return server


if __name__ == "__main__":
    # Set up and run the server using uvicorn directly, avoiding asyncio conflict
    load_dotenv()
    print(os.getenv("OPENAI_API_KEY"))
    server = asyncio.run(setup_server())
    
    print("Starting Elkar A2A server on http://localhost:5001")
    print("Press Ctrl+C to stop the server")
    
    # Run with uvicorn directly instead of server.start()
    uvicorn.run(server.app, host="0.0.0.0", port=5001) 