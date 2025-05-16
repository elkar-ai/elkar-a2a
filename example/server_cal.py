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
from datetime import datetime, timedelta, timezone
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
from elkar.a2a_types import *
from elkar.store.elkar_client_store import ElkarClientStore
from elkar.server.server import A2AServer
from elkar.task_manager.task_manager_base import RequestContext
from elkar.task_manager.task_manager_with_task_modifier import TaskManagerWithModifier
from elkar.task_modifier.base import TaskModifierBase
from elkar.task_modifier.task_modifier import TaskModifier
from pydantic import SecretStr

# Load environment variables
load_dotenv()

# Define the Google Calendar API scopes - use multiple scopes to ensure we have proper permissions
CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',       # Full access to all calendars
    'https://www.googleapis.com/auth/calendar.events', # Full access to events on all calendars
    'https://www.googleapis.com/auth/calendar.readonly', # Read-only access to calendars
    'https://www.googleapis.com/auth/calendar.events.readonly' # Read-only access to events
]
CALENDAR_TOKEN_FILE = 'example/token.json'
CALENDAR_CREDENTIALS_FILE = 'example/credentials.json'

# Google API imports
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.errors import HttpError

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


# Utility functions for the server (not exposed as LLM tools)
def get_calendar_timezone(force_reauth: bool = False) -> str:
    """
    Gets the timezone setting of the user's primary calendar.
    Args:
        force_reauth: Whether to force re-authentication
    Returns:
        A string with the calendar's timezone (e.g., 'Europe/Paris')
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Get calendar details
        calendar = service.calendars().get(calendarId='primary').execute()
        timezone = calendar.get('timeZone', 'UTC')
        
        return timezone
        
    except HttpError as error:
        return "UTC"  # Default to UTC in case of error
    except Exception as e:
        return "UTC"  # Default to UTC in case of error


def contains_placeholder_email(email_list: List[str]) -> Tuple[bool, List[str]]:
    """
    Checks if any email in the list appears to be a placeholder.
    
    Args:
        email_list: List of email addresses to check
        
    Returns:
        Tuple of (has_placeholder, list_of_placeholders)
    """
    placeholder_domains = [
        "example.com", "example.org", "example.net", "test.com", "test.net", 
        "domain.com", "yourdomain.com", "anycompany.com", "email.com", "user.com"
    ]
    
    placeholder_prefixes = [
        "user", "test", "info", "admin", "contact", "hello", "name", "email", 
        "username", "sample", "demo", "fake"
    ]
    
    placeholders_found = []
    
    for email in email_list:
        if not email or '@' not in email:
            continue
            
        domain = email.split('@')[1].lower()
        prefix = email.split('@')[0].lower()
        
        # Check for placeholder domains
        if any(pd in domain for pd in placeholder_domains):
            placeholders_found.append(email)
            continue
            
        # Check for common placeholder patterns
        if any(pp == prefix for pp in placeholder_prefixes):
            placeholders_found.append(email)
            continue
    
    return len(placeholders_found) > 0, placeholders_found


@tool
def create_calendar_event(summary: str, start_time: str, end_time: str, 
                         description: str = "", location: str = "", time_zone: str = "", 
                         attendees: Optional[List[str]] = None, 
                         create_conference: bool = True,
                         force_reauth: bool = False) -> str:
    """
    Creates a new event in the user's primary calendar.
    Args:
        summary: Title of the event.
        start_time: Start time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD'.
        end_time: End time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD'.
        description: Optional description of the event.
        location: Optional location of the event.
        time_zone: Optional IANA time zone name (e.g., 'Europe/Paris', 'America/New_York'). If provided, start_time and end_time are considered local to this timezone. Otherwise, they must include timezone information (offset or 'Z').
        attendees: Optional list of email addresses for attendees to invite.
        create_conference: Whether to automatically create a video conference link for the event (defaults to True).
        force_reauth: Whether to force re-authentication.
    Returns:
        A string with the created event information.
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        is_all_day = 'T' not in start_time

        event_body: Dict[str, Any] = {
            'summary': summary,
            'location': location,
            'description': description,
        }

        if is_all_day:
            event_body['start'] = {'date': start_time}
            event_body['end'] = {'date': end_time}
        else:
            if time_zone:
                event_body['start'] = {'dateTime': start_time, 'timeZone': time_zone}
                event_body['end'] = {'dateTime': end_time, 'timeZone': time_zone}
            else:
                if not start_time.endswith('Z') and '+' not in start_time and '-' not in start_time[10:]:
                    return "Error: start_time must be in ISO format with Z or offset if time_zone is not provided."
                if not end_time.endswith('Z') and '+' not in end_time and '-' not in end_time[10:]:
                    return "Error: end_time must be in ISO format with Z or offset if time_zone is not provided."
                event_body['start'] = {'dateTime': start_time}
                event_body['end'] = {'dateTime': end_time}
        
        if attendees:
            event_body['attendees'] = [{'email': email} for email in attendees]

        if create_conference:
            event_body['conferenceData'] = {
                'createRequest': {
                    'requestId': f'{uuid.uuid4().hex}',
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }
            
        print(f"Creating event with params: {event_body}")
        
        # Validate if the event can be created before actually creating it
        try:
            # First, attempt to verify if the event is valid by fetching calendar metadata
            service.calendars().get(calendarId='primary').execute()
        except HttpError as calendar_error:
            return f"Calendar access error: {str(calendar_error)}. Please check your calendar permissions and authentication."
        except Exception as e:
            return f"Failed to verify calendar: {str(e)}"

        # Attempt to create the event
        try:
            created_event = service.events().insert(
                calendarId='primary', 
                body=event_body,
                sendUpdates="all",
                conferenceDataVersion=1 if create_conference else 0 # Required if conferenceData is set
            ).execute()
        except HttpError as http_error:
            if http_error.resp.status == 403:
                return f"Permission error: {str(http_error)}. Make sure the Google account has proper permissions to create events."
            elif http_error.resp.status == 400:
                return f"Invalid event parameters: {str(http_error)}. Please check the event details provided."
            elif http_error.resp.status == 409:
                return f"Event conflict: {str(http_error)}. The event may conflict with another event."
            else:
                return f"API error creating event: {str(http_error)}"
        except Exception as e:
            return f"Unexpected error creating event: {str(e)}"

        # Verify the event was actually created by trying to fetch it
        try:
            event_id = created_event.get('id')
            verification = service.events().get(calendarId='primary', eventId=event_id).execute()
            if not verification or verification.get('id') != event_id:
                return f"Event appears to have been created (ID: {event_id}) but verification failed. Please check your calendar."
        except Exception as ve:
            return f"Event was inserted but verification failed: {str(ve)}. The event might not have been properly created."
        
        html_link = created_event.get('htmlLink')
        event_id_str = created_event.get('id')

        conference_info = ""
        conference_link_created = False
        if created_event.get('conferenceData') and created_event['conferenceData'].get('entryPoints'):
            for entry_point in created_event['conferenceData']['entryPoints']:
                if entry_point.get('entryPointType') == 'video':
                    conference_info = f"\nConference Link: {entry_point.get('uri')}"
                    conference_link_created = True
                    break
        
        main_message = f"Event created successfully and verified!\nID: {event_id_str}\nLink: {html_link}"
        final_message = main_message + conference_info
        
        if create_conference and not conference_link_created:
            final_message += "\nNote: A video conference was requested, but a link was not present in the API response."
        
        # Print the successful event creation details for debugging
        print(f"Event created: {event_id_str}, Summary: {summary}, Start: {start_time}, Time zone: {time_zone}")
        
        return final_message
        
    except HttpError as error:
        error_details = f"HTTP error {error.resp.status}: {error._get_reason()}"
        print(f"Calendar API HTTP error: {error_details}")
        return f"An error occurred with the Calendar API: {error_details}"
    except Exception as e:
        print(f"Unexpected exception creating calendar event: {str(e)}")
        return f"An unexpected error occurred: {str(e)}"


@tool
def update_calendar_event(event_id: str, summary: str = "", start_time: str = "", 
                         end_time: str = "", description: str = "", location: str = "", time_zone: str = "", 
                         attendees_to_add: Optional[List[str]] = None, 
                         attendees_to_remove: Optional[List[str]] = None, 
                         force_reauth: bool = False) -> str:
    """
    Updates an existing event in the user's primary calendar. Can update details and/or attendees.
    Args:
        event_id: ID of the event to update.
        summary: New title of the event (optional).
        start_time: New start time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD' (optional).
        end_time: New end time in 'YYYY-MM-DDTHH:MM:SS' format (if time_zone is provided) or full ISO 8601 format with offset/Z (if time_zone is not provided). For all-day events, use 'YYYY-MM-DD' (optional).
        description: New description of the event (optional).
        location: New location of the event (optional).
        time_zone: Optional IANA time zone name (e.g., 'Europe/Paris'). If provided and start/end times are being updated, these times are local to this zone.
        attendees_to_add: Optional list of email addresses for attendees to add to the event.
        attendees_to_remove: Optional list of email addresses for attendees to remove from the event.
        force_reauth: Whether to force re-authentication.
    Returns:
        A string with the updated event information or an error message.
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Get the existing event
        event: Dict[str, Any] = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        # Update standard properties if provided
        if summary:
            event['summary'] = summary
        if location:
            event['location'] = location
        if description:
            event['description'] = description
        
        # Update start time if provided
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
        
        # Update end time if provided
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

        # Manage attendees
        current_attendees = event.get('attendees', [])
        updated_attendees = [att for att in current_attendees] # Make a mutable copy

        if attendees_to_remove:
            emails_to_remove = set(attendees_to_remove)
            updated_attendees = [att for att in updated_attendees if att.get('email') not in emails_to_remove]

        if attendees_to_add:
            existing_emails = {att.get('email') for att in updated_attendees}
            for email_to_add in attendees_to_add:
                if email_to_add not in existing_emails:
                    updated_attendees.append({'email': email_to_add})
        
        event['attendees'] = updated_attendees
        
        # Update the event
        updated_event = service.events().update(
            calendarId='primary', 
            eventId=event_id, 
            body=event, 
            sendUpdates="all"  # Ensure notifications are sent
        ).execute()
        
        return f"Event updated successfully!\nID: {updated_event.get('id')}\nLink: {updated_event.get('htmlLink')}"
        
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


class CrewAIWrapper:
    """Wrapper for CrewAI agents that handles calendar tasks."""
    
    def __init__(self, verbose: bool = True, model_name: str = "gpt-3.5-turbo-0125"):
        """Initialize the CrewAI wrapper with a calendar agent."""
        # Setup LLM
        openai_api_key_str = os.environ.get("OPENAI_API_KEY", "")
        if not openai_api_key_str:
            print("Warning: OPENAI_API_KEY not found in environment variables.")
            
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            api_key=SecretStr(openai_api_key_str) if openai_api_key_str else None
        )
        
        # Create an agent with calendar tools
        self.agent = Agent(
            role="Calendar Assistant",
            goal="Help users access, create, update, and manage their Google Calendar. Coordinate with the Gmail Assistant for tasks requiring email access.",
            backstory="You are an expert calendar assistant. You can manage schedules, appointments, and events. You are also aware of a Gmail Assistant and can suggest using it if a user's request involves reading emails (e.g., to find event details sent via email) or sending email confirmations.",
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
        current_utc_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        # Metaprompt for collaboration, date awareness, input validation, preventing hallucinations, and conference creation
        metaprompt = (
            f"You are the Google Calendar Assistant. Today's UTC date is {current_utc_date}. "
            "Your primary goal is to successfully fulfill the user's request using your available tools. You have a tool `create_calendar_event` that can automatically create a video conference link (like Google Meet) if `create_conference` is true (which it is by default)."
            "You MUST NOT invent any information you are not explicitly given or cannot derive directly from your tool outputs. This is especially critical for personal information like email addresses or specific private details. "
            "Before attempting to use any tool, ensure you have all necessary information. If critical information is missing, your response MUST be to ask the user for that information. Do not proceed with tool use if essential details are absent or unconfirmed. "
            "For example: "
            "- When creating events: You MUST have a summary, a start time, and an end time. "
            "  - Attendee Emails: \n"
            "    - If an attendee is mentioned by name (e.g., 'Invite Olga') AND THEIR EMAIL ADDRESS IS NOT PROVIDED IN THE USER'S REQUEST, your ONLY permissible action MUST be to ask the user for their email address. For example, if the user says 'Invite Olga', you MUST respond with a question like: 'What is Olga\'s email address so I can include her in the invitation?'. \n"
            "    - You are ABSOLUTELY PROHIBITED from inventing email addresses or using any form of placeholder like 'name@example.com', 'user@domain.com', 'contact@somegenericdomain.org', etc., if an email is not explicitly provided by the user for that named attendee. Inventing or assuming an email address for an attendee is a critical failure of your task. Using 'example.com' or similar placeholder domains when an email was not given is strictly forbidden.\n"
            "    - If the user *does* provide an email address that appears to be a generic placeholder (e.g., 'olga@example.com', 'test@test.net', 'info@company.com'), you MUST ask for confirmation before proceeding. For example: 'The email provided for Olga is olga@example.com. Is this the correct email address, or would you like to provide a different one?' Only proceed if they confirm it or provide a new one. Do not use the tool until this confirmation is received.\n"
            "    - Final Pre-Tool-Call Check for Placeholder Attendee Emails: Before you use the `create_calendar_event` or `update_calendar_event` tools, critically examine the attendee list you are about to use. If ANY email address in that list for ANY attendee is a placeholder (e.g., uses domains like `example.com`, `example.org`, `test.net`, `yourdomain.com`, `anycompany.com`, `email.com`, `user.com`, or is clearly generic like `info@...`, `contact@...`, `admin@...`), YOU MUST NOT CALL THE TOOL. Instead, your direct output to the user MUST be a question asking for the correct, non-placeholder email for EACH such attendee. For example, if you were about to use `olga@example.com`, your response to the user should be: 'I need a valid email address for Olga. The email olga@example.com appears to be a placeholder. What is Olga\'s correct email address?' If there are multiple such emails, ask for all of them. Do not proceed with the event creation/update until you receive valid, non-placeholder email addresses for all intended attendees.\n"
            # Enhanced Timezone Instructions:
            "- Timezones and Calendar Event Time Handling:\n"
            "  - CRITICAL: When creating or updating calendar events, the time MUST be handled correctly to prevent timezone mismatch issues where events appear at different times than intended. Do NOT make timezone conversions unless explicitly instructed.\n"
            "  - If the user's prompt contains calendar timezone information (e.g., 'The user's Google Calendar is set to the Europe/Paris timezone'), you MUST use this information. In this case, when the user provides a local time (e.g., '5 PM'), use this time as-is with the specified time zone (e.g., `start_time='YYYY-MM-DDT17:00:00'` with `time_zone='Europe/Paris'`).\n"
            "  - If the user provides a time with a specific timezone (e.g., '2 PM Paris time', '10 AM EST'), identify the IANA timezone (e.g., 'Europe/Paris', 'America/New_York'). You will use this for the 'time_zone' parameter of the 'create_calendar_event' or 'update_calendar_event' tool.\n"
            "  - When you use the 'time_zone' parameter with an IANA timezone, the 'start_time' and 'end_time' parameters for the tool MUST be provided as local time strings in 'YYYY-MM-DDTHH:MM:SS' format for THAT IANA ZONE. For example, if the user says 'August 10th, 2 PM in Paris', and you determine the year is 2024, you should call the tool with `start_time=\'2024-08-10T14:00:00\'` and `time_zone=\'Europe/Paris\'`. Do NOT include 'Z' or any UTC offset like '+02:00' in the 'start_time' or 'end_time' strings when 'time_zone' is also being provided. Do NOT convert the time to UTC or any other timezone.\n"
            "  - If the user provides time without any timezone information (e.g., 'tomorrow at 2 PM', '1:30 PM') or a relative time ('in 2 hours'), you MUST ask them to provide a specific IANA timezone (e.g., 'Europe/Paris', 'America/New_York') to use for the event. Do not assume a timezone. Explicitly state: Do NOT default to UTC or any other timezone in this scenario; you MUST get the IANA timezone from the user before proceeding with event creation/modification. If no IANA timezone is specified by the user for a local time, ask 'What timezone should I use for the time 1:30 PM? Please provide an IANA timezone like Europe/Paris or America/New_York.' \n"
            "  - If the user provides a time already in full ISO 8601 format with a 'Z' or a UTC offset (e.g., '2024-05-15T13:30:00Z' or '2024-05-15T15:30:00+02:00'), then you should pass this time string directly as 'start_time'/'end_time' and you should *not* provide the 'time_zone' parameter (leave it empty/default).\n"
            # Event creation verification:
            "- Event Creation/Modification Verification:\n"
            "  - After calling 'create_calendar_event' or 'update_calendar_event', you MUST carefully examine the response to verify that the event was actually created or updated successfully.\n"
            "  - If the response includes error messages (like 'HTTP error', 'Permission error', 'Invalid event parameters', etc.), inform the user of the failure with exact details and suggest corrective actions.\n"
            "  - If the response includes 'verification failed', tell the user there was an issue creating the event and they should check their calendar to see if it appears.\n"
            "  - Only tell the user an event was successfully created if the response explicitly includes 'Event created successfully and verified'.\n"
            "- Updating/Deleting Events: You MUST have the event_id. If not provided, ask the user for it. You can suggest they use 'list_upcoming_events' or 'search_calendar_events' to find the event ID. "
            "- Adding Attendees (Update): If asked to add attendees to an existing event and you are given a name (e.g., 'Olga') but not their email address, your ONLY permissible action MUST be to ask the user for their email address (e.g., 'What is Olga\'s email address so I can update the invitation?'). Do not proceed if the email is missing. Using 'example.com' or similar is forbidden here too."
            "- Ambiguous Times/Dates: If a date or time is ambiguous (e.g., 'next Tuesday', 'evening'), ask for clarification to get a specific date and time. "
            "If any of the above critical pieces of information (summary, start time, end time for creation; event_id for updates/deletions; VALID and CONFIRMED attendee email addresses if attendees are specified by name; a specific IANA timezone if a local time without offset is given) is missing or unconfirmed, YOU MUST NOT USE ANY TOOL. Your response MUST BE a question to the user to obtain or confirm the missing information. Do not make assumptions or proceed with incomplete or invented data. This is paramount."
            "If the user's request seems to require information from their emails (e.g., 'find Olga\'s actual email address'), suggest asking the Gmail Assistant. Do not attempt to directly access emails yourself. "
            "If the request is purely about calendar functions and all necessary information is clearly provided and confirmed, proceed as usual."
        )

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
            description=f"{metaprompt}\\n\\nUser request: {update_prompt}",
            expected_output="Retrieved or modified calendar information based on the user's request, or guidance to consult the Gmail assistant.",
            agent=self.agent
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
        description="Manages Google Calendar. Can create, update, delete, and list events. Collaborates with the Gmail Assistant for tasks requiring email access (e.g., finding event details in emails).",
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
    
    # Create a simple function to check for placeholder emails in the user's input
    def has_placeholder_in_prompt(prompt: str) -> Tuple[bool, str]:
        """
        Check if the user's prompt contains any common placeholder emails.
        Returns (has_placeholder, message)
        """
        for placeholder_domain in ["example.com", "example.org", "test.com"]:
            if placeholder_domain in prompt:
                return True, f"I notice you're using an email with '{placeholder_domain}' which appears to be a placeholder. Please provide a valid email address instead."
        
        return False, ""

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
                    if hasattr(part, "text") and isinstance(part, TextPart):
                        user_prompt += part.text
            # If no message in status, try to look in history
            elif hasattr(task_obj, 'history') and task_obj.history and len(task_obj.history) > 0:
                for msg in task_obj.history:
                    if hasattr(msg, 'parts'):
                        for part in msg.parts:
                            if hasattr(part, "text") and isinstance(part, TextPart):
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
            
            # Simple check for placeholder emails in the user's request
            has_placeholder, placeholder_message = has_placeholder_in_prompt(user_prompt)
            if has_placeholder:
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text=placeholder_message)],
                        ),
                    ),
                    is_final=False,  # Mark as not final, expecting more input from user
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
            
            # Inject calendar timezone information into the prompt if the request involves creating/updating events
            calendar_related_keywords = ["schedule", "meeting", "appointment", "event", "calendar", "remind", "book"]
            time_related_keywords = ["am", "pm", "today", "tomorrow", "next week", ":00", "o'clock"]
            
            if (any(keyword in user_prompt.lower() for keyword in calendar_related_keywords) and 
                any(keyword in user_prompt.lower() for keyword in time_related_keywords)):
                try:
                    # Get the user's calendar timezone
                    calendar_timezone = get_calendar_timezone()
                    
                    # Enhance the prompt with the calendar timezone information
                    timezone_info = f"\n\nIMPORTANT: The user's Google Calendar is set to the '{calendar_timezone}' timezone. " + \
                                   f"When creating or updating events without explicit timezone information, " + \
                                   f"ALWAYS use the local time in '{calendar_timezone}' timezone " + \
                                   f"with the time_zone parameter set to '{calendar_timezone}'. " + \
                                   f"For example, if the user asks for an event at '5 PM', " + \
                                   f"use start_time='YYYY-MM-DDT17:00:00' with time_zone='{calendar_timezone}'. " + \
                                   f"DO NOT convert to UTC or any other timezone unless explicitly requested."
                                   
                    user_prompt += timezone_info
                    print(f"Enhanced prompt with timezone info for calendar: {calendar_timezone}")
                except Exception as e:
                    print(f"Error getting calendar timezone: {str(e)}")
            
            # Add explicit instruction to NEVER use example.com domains
            user_prompt += "\n\nCRITICAL: NEVER use emails with placeholder domains like example.com, test.com, or fake domains. If the user includes such placeholder emails, you MUST ask for real email addresses instead."
            
            # Call CrewAI to process calendar query
            result = await crew_ai_wrapper.process_calendar_query(user_prompt)
            
            # Check for error indicators in the response
            error_indicators = [
                "HTTP error", "API error", "Permission error", "Calendar access error", 
                "Invalid event parameters", "Error creating event", "verification failed",
                "exception", "error occurred"
            ]
            
            creation_failed = False
            for indicator in error_indicators:
                if indicator.lower() in result.lower():
                    creation_failed = True
                    print(f"Found error indicator in response: {indicator}")
                    break
            
            # Check for placeholder domains in the result
            if "example.com" in result or "example.org" in result or "test.com" in result:
                # Return a INPUT_REQUIRED response to the client
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="I notice there's a placeholder email address like example.com in the calendar request. Please provide a valid email address instead of a placeholder.")],
                        ),
                    ),
                    is_final=False,  # Mark as not final, expecting more input from user
                )
                return
            
            # If creation failed, set the task to FAILED with error details
            if creation_failed:
                await task.set_status(
                    TaskStatus(
                        state=TaskState.FAILED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text=f"There was an issue creating or updating the calendar event: {result}")],
                        ),
                    ),
                    is_final=True,
                )
                return
            
            # Check if the agent is asking for more information
            # Simple heuristic: check for question marks or common question phrases
            is_question = result.strip().endswith("?") or \
                          any(phrase in result.lower() for phrase in 
                              ["what ", "which ", "when ", "who ", "how ", 
                               "could you specify", "please provide", "do you mean", "clarify"])

            if is_question:
                # Agent is asking for more information, set state to INPUT_REQUIRED
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text=result)],  # Pass the agent's question back
                        ),
                    ),
                    is_final=False,  # Mark as not final, expecting more input from user
                )
            else:
                # Agent provided a final response or took an action
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
                            parts=[TextPart(text="Calendar request processed.")], # Generic message, artifact has details
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
    print("Starting Elkar A2A server on http://localhost:5002")
    print("Press Ctrl+C to stop the server")
    
    # Run with uvicorn directly instead of server.start()
    uvicorn.run(server.app, host="0.0.0.0", port=5002) 