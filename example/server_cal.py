#!/usr/bin/env python
"""
Elkar A2A server that wraps a CrewAI agent for Google Calendar tasks.
"""
import asyncio
import os
import json
import base64
from typing import List, Optional, Dict, Any, Tuple, cast
import uuid
from datetime import datetime, timedelta
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

# Define the Google Calendar API scopes - use multiple scopes to ensure we have proper permissions
CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',       # Full access to all calendars
    'https://www.googleapis.com/auth/calendar.events', # Full access to events on all calendars
    'https://www.googleapis.com/auth/calendar.readonly', # Read-only access to calendars
    'https://www.googleapis.com/auth/calendar.events.readonly' # Read-only access to events
]
CALENDAR_TOKEN_FILE = 'token.json'
CALENDAR_CREDENTIALS_FILE = 'credentials.json'


# Google Calendar API tools
def get_calendar_service(force_reauth: bool = False):
    """
    Gets an authorized Google Calendar API service instance.
    
    Args:
        force_reauth: If True, forces re-authentication by deleting existing token
        
    Returns:
        A Google Calendar API service object.
    """
    creds = None
    
    # If force_reauth is True, delete the token file if it exists
    if force_reauth and os.path.exists(CALENDAR_TOKEN_FILE):
        os.remove(CALENDAR_TOKEN_FILE)
        print(f"Deleted existing token file to force re-authentication")
    
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists(CALENDAR_TOKEN_FILE):
        with open(CALENDAR_TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
        print(f"Loaded credentials from {CALENDAR_TOKEN_FILE}")
    
    # If credentials don't exist or are invalid, prompt the user to log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print(f"Refreshing expired credentials")
            creds.refresh(Request())
        else:
            # Check if credentials file exists
            if not os.path.exists(CALENDAR_CREDENTIALS_FILE):
                raise FileNotFoundError(f"Credentials file not found: {CALENDAR_CREDENTIALS_FILE}. Please set up OAuth credentials.")
            
            print(f"Starting new OAuth flow with scopes: {CALENDAR_SCOPES}")
            flow = InstalledAppFlow.from_client_secrets_file(
                CALENDAR_CREDENTIALS_FILE, CALENDAR_SCOPES)
            creds = flow.run_local_server(port=0)
            print(f"New authentication completed")
        
        # Save the credentials for the next run
        with open(CALENDAR_TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
            print(f"Saved credentials to {CALENDAR_TOKEN_FILE}")
    
    service = build('calendar', 'v3', credentials=creds)
    return service


@tool
def list_upcoming_events(max_results: int = 10, time_min_days: int = 0, force_reauth: bool = False) -> str:
    """
    Lists upcoming events from the user's primary calendar.
    Args:
        max_results: Maximum number of events to retrieve
        time_min_days: Number of days from now to start looking for events (0 = today)
        force_reauth: Whether to force re-authentication
    Returns:
        A string with upcoming event information
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Calculate time_min as current time
        now = datetime.utcnow()
        if time_min_days > 0:
            now = now + timedelta(days=time_min_days)
            
        time_min = now.isoformat() + 'Z'  # 'Z' indicates UTC time
        
        # Call the Calendar API
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        if not events:
            return "No upcoming events found."
            
        event_info = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            
            # Format the start time for display
            try:
                if 'T' in start:  # This is a dateTime format
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    start_formatted = start_dt.strftime('%Y-%m-%d %H:%M:%S')
                else:  # This is a date format
                    start_formatted = start
            except:
                start_formatted = start
                
            # Get event details
            summary = event.get('summary', 'No Title')
            location = event.get('location', 'No Location')
            description = event.get('description', 'No Description')
            event_id = event.get('id', 'No ID')
            
            # Truncate description if too long
            if description and len(description) > 100:
                description = description[:97] + "..."
                
            event_info.append(f"Event: {summary}\nID: {event_id}\nWhen: {start_formatted}\nLocation: {location}\nDescription: {description}\n---")
            
        return "\n".join(event_info)
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


@tool
def search_calendar_events(query: str, max_results: int = 10, force_reauth: bool = False) -> str:
    """
    Searches for events in the user's primary calendar based on a query.
    Args:
        query: Search query (e.g., 'meeting', 'dinner', etc.)
        max_results: Maximum number of events to retrieve
        force_reauth: Whether to force re-authentication
    Returns:
        A string with matching event information
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Calculate time_min as current time
        time_min = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        
        # Call the Calendar API with a query
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime',
            q=query
        ).execute()
        
        events = events_result.get('items', [])
        
        if not events:
            return f"No events found matching query: {query}"
            
        event_info = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            
            # Format the start time for display
            try:
                if 'T' in start:  # This is a dateTime format
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    start_formatted = start_dt.strftime('%Y-%m-%d %H:%M:%S')
                else:  # This is a date format
                    start_formatted = start
            except:
                start_formatted = start
                
            # Get event details
            summary = event.get('summary', 'No Title')
            location = event.get('location', 'No Location')
            description = event.get('description', 'No Description')
            event_id = event.get('id', 'No ID')
            
            # Truncate description if too long
            if description and len(description) > 100:
                description = description[:97] + "..."
                
            event_info.append(f"Event: {summary}\nID: {event_id}\nWhen: {start_formatted}\nLocation: {location}\nDescription: {description}\n---")
            
        return "\n".join(event_info)
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


@tool
def get_calendar_details(days: int = 7, force_reauth: bool = False) -> str:
    """
    Gets detailed information about the user's primary calendar and upcoming events.
    Args:
        days: Number of days to look ahead for events
        force_reauth: Whether to force re-authentication
    Returns:
        A string with calendar information
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Get calendar details
        calendar = service.calendars().get(calendarId='primary').execute()
        calendar_info = [
            f"Calendar Name: {calendar.get('summary', 'Unknown')}",
            f"Calendar ID: {calendar.get('id', 'Unknown')}",
            f"Time Zone: {calendar.get('timeZone', 'Unknown')}",
            f"Description: {calendar.get('description', 'None')}"
        ]
        
        # Calculate time range for events
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'
        time_max = (now + timedelta(days=days)).isoformat() + 'Z'
        
        # Get event count
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True
        ).execute()
        
        events = events_result.get('items', [])
        calendar_info.append(f"Events in the next {days} days: {len(events)}")
        
        return "\n".join(calendar_info)
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


@tool
<<<<<<< HEAD
def create_calendar_event(summary: str, start_time: str, end_time: str, description: str = "", location: str = "", time_zone: str = "", force_reauth: bool = False) -> str:
    """
    Creates a new event in the user's primary calendar.
    Args:
        summary: Title of the event.
        start_time: Start time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD'.
        end_time: End time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD'.
        description: Optional description of the event.
        location: Optional location of the event.
        time_zone: Optional IANA time zone name (e.g., 'Europe/Paris'). If provided, start_time and end_time are considered local to this timezone. Otherwise, they must include timezone information (offset or 'Z').
        force_reauth: Whether to force re-authentication.
    Returns:
        A string with the created event information.
=======
def create_calendar_event(summary: str, start_time: str, end_time: str, description: str = "", location: str = "", force_reauth: bool = False) -> str:
    """
    Creates a new event in the user's primary calendar.
    Args:
        summary: Title of the event
        start_time: Start time in ISO format (YYYY-MM-DDTHH:MM:SS) or date (YYYY-MM-DD)
        end_time: End time in ISO format (YYYY-MM-DDTHH:MM:SS) or date (YYYY-MM-DD)
        description: Optional description of the event
        location: Optional location of the event
        force_reauth: Whether to force re-authentication
    Returns:
        A string with the created event information
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
<<<<<<< HEAD
        is_all_day = 'T' not in start_time

        event_body: Dict[str, Any] = {
=======
        # Determine if this is an all-day event or a timed event
        is_all_day = 'T' not in start_time
        
        # Create event body
        event = {
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
            'summary': summary,
            'location': location,
            'description': description,
        }
<<<<<<< HEAD

        if is_all_day:
            event_body['start'] = {'date': start_time}
            event_body['end'] = {'date': end_time}
        else:
            if time_zone:
                event_body['start'] = {'dateTime': start_time, 'timeZone': time_zone}
                event_body['end'] = {'dateTime': end_time, 'timeZone': time_zone}
            else:
                # Ensure proper ISO format with timezone if time_zone is not specified
                if not start_time.endswith('Z') and '+' not in start_time and '-' not in start_time[10:]: # check if offset is missing
                    return "Error: start_time must be in ISO format with Z or offset if time_zone is not provided."
                if not end_time.endswith('Z') and '+' not in end_time and '-' not in end_time[10:]: # check if offset is missing
                    return "Error: end_time must be in ISO format with Z or offset if time_zone is not provided."
                event_body['start'] = {'dateTime': start_time}
                event_body['end'] = {'dateTime': end_time}
        
        created_event = service.events().insert(calendarId='primary', body=event_body).execute()
        
        return f"Event created successfully!\nID: {created_event.get('id')}\nLink: {created_event.get('htmlLink')}"
=======
        
        if is_all_day:
            # All-day event
            event['start'] = {'date': start_time}
            event['end'] = {'date': end_time}
        else:
            # Timed event - ensure proper ISO format with timezone
            if not start_time.endswith('Z') and '+' not in start_time:
                start_time += 'Z'  # Add UTC marker if no timezone
            if not end_time.endswith('Z') and '+' not in end_time:
                end_time += 'Z'  # Add UTC marker if no timezone
                
            event['start'] = {'dateTime': start_time}
            event['end'] = {'dateTime': end_time}
        
        # Create the event
        event = service.events().insert(calendarId='primary', body=event).execute()
        
        return f"Event created successfully!\nID: {event.get('id')}\nLink: {event.get('htmlLink')}"
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


@tool
def update_calendar_event(event_id: str, summary: str = "", start_time: str = "", 
<<<<<<< HEAD
                         end_time: str = "", description: str = "", location: str = "", time_zone: str = "", force_reauth: bool = False) -> str:
    """
    Updates an existing event in the user's primary calendar.
    Args:
        event_id: ID of the event to update.
        summary: New title of the event (optional).
        start_time: New start time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD' (optional).
        end_time: New end time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD' (optional).
        description: New description of the event (optional).
        location: New location of the event (optional).
        time_zone: Optional IANA time zone name (e.g., 'Europe/Paris'). If provided and start/end times are being updated, these times are local to this zone.
        force_reauth: Whether to force re-authentication.
    Returns:
        A string with the updated event information.
=======
                         end_time: str = "", description: str = "", location: str = "", force_reauth: bool = False) -> str:
    """
    Updates an existing event in the user's primary calendar.
    Args:
        event_id: ID of the event to update
        summary: New title of the event (optional)
        start_time: New start time in ISO format (YYYY-MM-DDTHH:MM:SS) or date (YYYY-MM-DD) (optional)
        end_time: New end time in ISO format (YYYY-MM-DDTHH:MM:SS) or date (YYYY-MM-DD) (optional)
        description: New description of the event (optional)
        location: New location of the event (optional)
        force_reauth: Whether to force re-authentication
    Returns:
        A string with the updated event information
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
<<<<<<< HEAD
        event: Dict[str, Any] = service.events().get(calendarId='primary', eventId=event_id).execute()
        
=======
        # Get the existing event
        event: Dict[str, Any] = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        # Update the fields that were provided
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
        if summary:
            event['summary'] = summary
        if location:
            event['location'] = location
        if description:
            event['description'] = description
        
<<<<<<< HEAD
        if start_time:
            is_all_day_start = 'T' not in start_time
            if is_all_day_start:
                event['start'] = {'date': start_time}
            else:
                if time_zone:
                    event['start'] = {'dateTime': start_time, 'timeZone': time_zone}
                else:
                    if not start_time.endswith('Z') and '+' not in start_time and '-' not in start_time[10:]:
                        return "Error: start_time must be in ISO format with Z or offset if time_zone is not provided for update."
                    event['start'] = {'dateTime': start_time}
                
        if end_time:
            is_all_day_end = 'T' not in end_time
            if is_all_day_end:
                event['end'] = {'date': end_time}
            else:
                if time_zone:
                    event['end'] = {'dateTime': end_time, 'timeZone': time_zone}
                else:
                    if not end_time.endswith('Z') and '+' not in end_time and '-' not in end_time[10:]:
                        return "Error: end_time must be in ISO format with Z or offset if time_zone is not provided for update."
                    event['end'] = {'dateTime': end_time}
        
=======
        # Update start and end times if provided
        if start_time:
            is_all_day = 'T' not in start_time
            if is_all_day:
                # For all-day events
                event['start'] = {'date': start_time}
            else:
                # For timed events
                if not start_time.endswith('Z') and '+' not in start_time:
                    start_time += 'Z'  # Add UTC marker if no timezone
                event['start'] = {'dateTime': start_time}
                
        if end_time:
            is_all_day = 'T' not in end_time
            if is_all_day:
                # For all-day events
                event['end'] = {'date': end_time}
            else:
                # For timed events
                if not end_time.endswith('Z') and '+' not in end_time:
                    end_time += 'Z'  # Add UTC marker if no timezone
                event['end'] = {'dateTime': end_time}
        
        # Update the event
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
        updated_event = service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
        
        return f"Event updated successfully!\nID: {updated_event.get('id')}\nLink: {updated_event.get('htmlLink')}"
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


@tool
def delete_calendar_event(event_id: str, force_reauth: bool = False) -> str:
    """
    Deletes an event from the user's primary calendar.
    Args:
        event_id: ID of the event to delete
        force_reauth: Whether to force re-authentication
    Returns:
        A confirmation message
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Delete the event
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        
        return f"Event with ID {event_id} deleted successfully!"
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


class CrewAIWrapper:
    """Wrapper for CrewAI agents that handles calendar tasks."""
    
    def __init__(self, verbose: bool = True, model_name: str = "gpt-3.5-turbo-0125"):
        """Initialize the CrewAI wrapper with a calendar agent."""
        # Setup LLM
        openai_api_key = os.environ.get("OPENAI_API_KEY", "")
        if not openai_api_key:
            print("Warning: OPENAI_API_KEY not found in environment variables.")
            
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            api_key=openai_api_key
        )
        
        # Create an agent with calendar tools
        self.agent = Agent(
            role="Calendar Assistant",
<<<<<<< HEAD
            goal="Help users access, create, update, and manage their Google Calendar. Coordinate with the Gmail Assistant for tasks requiring email access.",
            backstory="You are an expert calendar assistant. You can manage schedules, appointments, and events. You are also aware of a Gmail Assistant and can suggest using it if a user's request involves reading emails (e.g., to find event details sent via email) or sending email confirmations.",
=======
            goal="Help users access, create, update, and manage their calendar information",
            backstory="You are an expert calendar assistant who can help users manage their schedule, appointments, and events efficiently.",
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
            verbose=verbose,
            allow_delegation=False,
            tools=[
                list_upcoming_events, 
                search_calendar_events, 
                get_calendar_details,
                create_calendar_event,
                update_calendar_event,
                delete_calendar_event
            ],
            llm=llm
        )
        
        # Define the CrewAI structure
        self.crew = Crew(
            agents=[self.agent],
            tasks=[],
            verbose=verbose,
            process=Process.sequential,
        )
    
    async def process_calendar_query(self, prompt: str) -> str:
        """
        Run the CrewAI agent to process calendar queries.
        
        Args:
            prompt: The user's calendar-related prompt
            
        Returns:
            The calendar information requested
        """
<<<<<<< HEAD
        current_utc_date = datetime.utcnow().strftime('%Y-%m-%d')
        # Metaprompt for collaboration and date awareness
        metaprompt = (
            f"You are the Google Calendar Assistant. Today's UTC date is {current_utc_date}. "
            "When creating or updating events, if the user specifies a time without a timezone (e.g., '2 PM'), clarify the timezone or ask them to provide it using the IANA format (e.g., 'Europe/Paris') for the 'time_zone' parameter. "
            "If the user's request seems to require information from their emails "
            "(e.g., 'find the flight details for my trip to Paris', 'what was the address for the meeting John sent me?'), "
            "first state that you will handle the calendar-specific parts if any, and then clearly suggest that the user "
            "should ask the Gmail Assistant to retrieve the necessary details from their emails. "
            "Do not attempt to directly access emails yourself. "
            "For example, if asked to 'find my flight to Paris and add it to my calendar', you should respond by saying something like: "
            "'I can help add the flight to your calendar once you have the details. Please ask the Gmail Assistant to find the flight information from your emails.' "
            "If the request is purely about calendar functions (e.g., 'list my events for tomorrow', 'create an event for a meeting'), proceed as usual."
        )

=======
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
        # Check if this is a request to force re-authentication
        force_reauth = "force reauth" in prompt.lower() or "re-authenticate" in prompt.lower()
        
        # If permission error is mentioned, suggest re-authentication
        if "permission" in prompt.lower() or "403" in prompt or "insufficient authentication" in prompt:
            update_prompt = f"{prompt}\n\nIt seems there might be authentication or permission issues. Try using force_reauth=True to re-authenticate with Google Calendar."
        else:
            update_prompt = prompt
        
        # Create a dynamic task based on user input
        print(f"Calendar Prompt: {update_prompt}")
        task = CrewTask(
<<<<<<< HEAD
            description=f"{metaprompt}\\n\\nUser request: {update_prompt}",
            expected_output="Retrieved or modified calendar information based on the user's request, or guidance to consult the Gmail assistant.",
=======
            description=f"Process the following calendar-related request: {update_prompt}",
            expected_output="Retrieved or modified calendar information based on the user's request",
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
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
        name="Google Calendar Assistant",
<<<<<<< HEAD
        description="Manages Google Calendar. Can create, update, delete, and list events. Collaborates with the Gmail Assistant for tasks requiring email access (e.g., finding event details in emails).",
=======
        description="A specialized agent that helps users access and manage their Google Calendar, including creating, updating, and deleting events",
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
        url="http://localhost:5002",
        version="1.0.0",
        skills=[
            AgentSkill(id="calendar-assistant", name="calendar-assistant"),
            AgentSkill(id="google-calendar", name="google-calendar"),
            AgentSkill(id="event-management", name="event-management"),
            AgentSkill(id="scheduling", name="scheduling")
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
        """Handle tasks by using the CrewAI wrapper to process calendar requests."""
        
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
                            parts=[TextPart(text="I'll try to re-authenticate with Google Calendar...")],
                        ),
                    )
                )
                
                # Try forcing re-authentication first
                try:
                    get_calendar_service(force_reauth=True)
                    await task.set_status(
                        TaskStatus(
                            state=TaskState.WORKING,
                            message=Message(
                                role="agent",
                                parts=[TextPart(text="Successfully re-authenticated with Google Calendar. Now processing your request...")],
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
                            parts=[TextPart(text="I'm processing your calendar request...")],
                        ),
                    )
                )
            
            # Call CrewAI to process calendar query
            result = await crew_ai_wrapper.process_calendar_query(user_prompt)
            
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
                        parts=[TextPart(text="Calendar request completed successfully!")],
                    ),
                ),
                is_final=True,
            )
            
        except Exception as e:
            # Handle any errors
            error_message = f"Error processing calendar request: {str(e)}"
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
    api_key = os.environ.get("ELKAR_API_KEY", "")  # Get API key from environment variables
    if not api_key:
        print("Warning: ELKAR_API_KEY not found in environment variables.")
    store = ElkarClientStore(base_url="https://api.elkar.co/api", api_key=api_key)

    task_manager: TaskManagerWithModifier = TaskManagerWithModifier(
        agent_card, 
        send_task_handler=task_handler,
        store=store  # Pass the configured store to the task manager
    )

    server = A2AServer(task_manager, host="0.0.0.0", port=5002, endpoint="/")
    # Create and return the server
    # server = A2AServer(task_manage÷r, host="0.0.0.0", port=5001, endpoint="/")
    return server


if __name__ == "__main__":
    # Set up and run the server using uvicorn directly, avoiding asyncio conflict
    server = asyncio.run(setup_server())
<<<<<<< HEAD

=======
    
>>>>>>> 324e16c (adding a2a elkar servers through MCP tools)
    print("Starting Elkar A2A server on http://localhost:5002")
    print("Press Ctrl+C to stop the server")
    
    # Run with uvicorn directly instead of server.start()
    uvicorn.run(server.app, host="0.0.0.0", port=5002) 