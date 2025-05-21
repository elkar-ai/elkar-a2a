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
from crewai.tools import tool
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
import logging

# Load environment variables
load_dotenv()

# Define the Google Calendar API scopes - use multiple scopes to ensure we have proper permissions
CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',       # Full access to all calendars
    # 'https://www.googleapis.com/auth/calendar.events', # Full access to events on all calendars
    # 'https://www.googleapis.com/auth/calendar.readonly', # Read-only access to calendars
    # 'https://www.googleapis.com/auth/calendar.events.readonly' # Read-only access to events
]
CALENDAR_TOKEN_FILE = os.environ.get('CALENDAR_TOKEN_FILE', 'example/token.json')
CALENDAR_CREDENTIALS_FILE = os.environ.get('CALENDAR_CREDENTIALS_FILE', 'example/credentials.json')

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
    
    logging.info(f"Using credentials file: {CALENDAR_CREDENTIALS_FILE}")
    logging.info(f"Using token file: {CALENDAR_TOKEN_FILE}")
    
    # If force_reauth is True, delete the token file if it exists
    if force_reauth and os.path.exists(CALENDAR_TOKEN_FILE):
        os.remove(CALENDAR_TOKEN_FILE)
        logging.info(f"Deleted existing token file to force re-authentication")
    
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists(CALENDAR_TOKEN_FILE):
        try:
            with open(CALENDAR_TOKEN_FILE, 'rb') as token:
                creds = pickle.load(token)
            logging.info(f"Loaded credentials from {CALENDAR_TOKEN_FILE}")
            logging.info(f"Credentials valid: {creds.valid}")
            if creds.expired:
                logging.info("Credentials are expired")
            if creds.refresh_token:
                logging.info("Refresh token is available")
        except Exception as e:
            logging.info(f"Error loading token file: {str(e)}")
    
    # If credentials don't exist or are invalid, prompt the user to log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logging.info(f"Refreshing expired credentials")
            try:
                creds.refresh(Request())
                logging.info("Successfully refreshed credentials")
            except Exception as e:
                logging.info(f"Error refreshing credentials: {str(e)}")
        else:
            # Check if credentials file exists
            if not os.path.exists(CALENDAR_CREDENTIALS_FILE):
                raise FileNotFoundError(f"Credentials file not found: {CALENDAR_CREDENTIALS_FILE}. Please set up OAuth credentials.")
            
            logging.info(f"Starting new OAuth flow with scopes: {CALENDAR_SCOPES}")
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CALENDAR_CREDENTIALS_FILE, CALENDAR_SCOPES)
                creds = flow.run_local_server(port=0)
                logging.info(f"New authentication completed")
            except Exception as e:
                logging.info(f"Error during OAuth flow: {str(e)}")
                raise
        
        # Save the credentials for the next run
        try:
            with open(CALENDAR_TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
                logging.info(f"Saved credentials to {CALENDAR_TOKEN_FILE}")
        except Exception as e:
            logging.info(f"Error saving token file: {str(e)}")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        logging.info("Successfully built calendar service")
        return service
    except Exception as e:
        logging.info(f"Error building calendar service: {str(e)}")
        raise


@tool
def list_calendar_events(max_results: int = 10, time_min_days: int = -7, time_max_days: int = 7, force_reauth: bool = False) -> str:
    """
    Retrieves a list of events from the user's primary Google Calendar within a specified time range.

    This function queries the Google Calendar API for events within a time window specified by
    time_min_days and time_max_days relative to the current time. For example:
    - time_min_days=-7, time_max_days=7 will show events from 7 days ago to 7 days in the future
    - time_min_days=-1, time_max_days=0 will show events from yesterday to now
    - time_min_days=0, time_max_days=0 will show events for today only
    - time_min_days=0, time_max_days=7 will show events from now to 7 days in the future

    Args:
        max_results: The maximum number of events to retrieve. Defaults to 10.
        time_min_days: The number of days before current time to start listing events.
                      Negative values look into the past. Defaults to -7 (one week ago).
        time_max_days: The number of days after current time to end listing events.
                      Defaults to 7 (one week ahead).
        force_reauth: If True, forces the Google Calendar API to re-authenticate.
                      Defaults to False.

    Returns:
        A string containing formatted information for each event,
        separated by '---'. If no events are found, it returns
        "No events found in the specified time range.". In case of an API error or other
        exception, it returns an error message.
    """
    try:
        service = get_calendar_service(force_reauth=force_reauth)
        
        # Calculate time range
        now = datetime.now(timezone.utc)
        
        # For today's events (time_min_days=0, time_max_days=0), set the time range to cover the entire day
        if time_min_days == 0 and time_max_days == 0:
            # Set time_min to start of today
            time_min = now.replace(hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            # Set time_max to end of today
            time_max = now.replace(hour=23, minute=59, second=59, microsecond=999999).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        else:
            # For other time ranges, use the original calculation
            time_min = (now + timedelta(days=time_min_days)).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            time_max = (now + timedelta(days=time_max_days)).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        
        # Call the Calendar API
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        if not events:
            if time_min_days == 0 and time_max_days == 0:
                return "No events found for today."
            return f"No events found in the specified time range ({time_min_days} to {time_max_days} days from now)."
            
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
    Searches for events in the user's primary Google Calendar that match a given query.

    This function uses the Google Calendar API to find events based on a textual query.
    It looks for matches in event titles, descriptions, attendees, etc. For each
    matching event, it retrieves and formats details like summary, start time,
    location, description, and event ID. Start times are formatted for clarity,
    and long descriptions are truncated.

    Args:
        query: The search term or query string to use for finding events.
               For example, "meeting with John" or "dentist appointment".
        max_results: The maximum number of matching events to retrieve.
                     Defaults to 10.
        force_reauth: If True, forces the Google Calendar API to re-authenticate.
                      Defaults to False.

    Returns:
        A string containing formatted information for each matching event,
        separated by '---'. If no events match the query, it returns
        "No events found matching query: <query>". In case of an API error
        or other exception, it returns an error message.
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
    Retrieves general details about the user's primary Google Calendar and a summary of upcoming events.

    This function fetches metadata about the primary calendar, including its name,
    ID, time zone, and description. It also calculates and returns the number
    of events scheduled within a specified number of upcoming days.

    Args:
        days: The number of days into the future to look for counting events.
              For example, a value of 7 will count events in the next 7 days.
              Defaults to 7.
        force_reauth: If True, forces the Google Calendar API to re-authenticate.
                      Defaults to False.

    Returns:
        A string containing the calendar's name, ID, time zone, description,
        and the count of events in the specified upcoming period. Each piece
        of information is on a new line. In case of an API error or other
        exception, it returns an error message.
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
    Deletes a specific event from the user's primary Google Calendar.

    This function uses the Google Calendar API to remove an event identified by its unique ID.

    Args:
        event_id: The unique identifier of the calendar event to be deleted.
                  This ID can typically be obtained from functions like
                  `list_upcoming_events` or `search_calendar_events`.
        force_reauth: If True, forces the Google Calendar API to re-authenticate.
                      Defaults to False.

    Returns:
        A string confirming the successful deletion of the event, e.g.,
        "Event with ID <event_id> deleted successfully!". If an error occurs
        (e.g., event not found, permission issues), it returns an error message.
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
    Creates a new event in the user's primary Google Calendar with specified details.

    This function allows for the creation of a new calendar event, including its title (summary),
    start and end times, description, location, and attendees. It can also automatically
    generate a Google Meet conference link for the event.

    Time Handling:
    - If `time_zone` is provided (e.g., 'Europe/Paris'), `start_time` and `end_time` should be
      in 'YYYY-MM-DDTHH:MM:SS' format and are considered local to that timezone.
    - If `time_zone` is NOT provided, `start_time` and `end_time` MUST be in full ISO 8601
      format with a UTC offset (e.g., '2023-10-26T10:00:00-07:00') or 'Z' for UTC
      (e.g., '2023-10-26T17:00:00Z').
    - For all-day events, `start_time` and `end_time` should be in 'YYYY-MM-DD' format,
      and `time_zone` is not applicable in the same way (the event spans the whole day
      regardless of timezone for display, but Google Calendar handles the underlying UTC).

    Args:
        summary: The title or summary of the event (e.g., "Team Meeting").
        start_time: The start date/time of the event. Format depends on whether `time_zone`
                    is provided and if it's an all-day event. See Time Handling notes.
        end_time: The end date/time of the event. Format follows the same rules as `start_time`.
        description: An optional detailed description for the event.
        location: An optional location for the event (e.g., "Conference Room 4" or an address).
        time_zone: Optional. The IANA time zone name for `start_time` and `end_time`
                   (e.g., 'America/New_York', 'Europe/London'). If not provided, times must
                   include offset information.
        attendees: An optional list of email addresses of people to invite to the event.
                   (e.g., ['user1@example.com', 'user2@example.com']).
        create_conference: If True (default), attempts to create a Google Meet conference
                           link for the event. Set to False to not create one.
        force_reauth: If True, forces the Google Calendar API to re-authenticate.
                      Defaults to False.

    Returns:
        A string confirming the successful creation of the event, including its ID, a web link
        to the event, and a conference link if generated (e.g., "Event created successfully and verified!\nID: <id>\nLink: <htmlLink>\nConference Link: <uri>").
        If `create_conference` was True but no link was generated, a note is added.
        Returns an error message if the event creation fails due to API errors, permission
        issues, invalid parameters, or event conflicts.
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
    Updates an existing event in the user's primary Google Calendar.

    This function allows modification of various properties of an existing calendar event,
    identified by its `event_id`. Fields that are not provided or are empty strings (for textual
    fields) will not be updated. Attendee lists can be modified by providing lists of emails
    to add or remove.

    Time Handling for Updates:
    - Similar to `create_calendar_event`, if `start_time` or `end_time` are being updated AND
      `time_zone` is provided, the times are local to that zone.
    - If `time_zone` is not provided when updating times, the new `start_time` and `end_time`
      must include UTC offset or 'Z'.
    - To convert an event to all-day or change an all-day event's date, provide `start_time`
      and `end_time` in 'YYYY-MM-DD' format.

    Args:
        event_id: The unique ID of the event to be updated.
        summary: Optional. The new title for the event. If empty, not updated.
        start_time: Optional. The new start date/time. See Time Handling notes. If empty, not updated.
        end_time: Optional. The new end date/time. See Time Handling notes. If empty, not updated.
        description: Optional. The new description for the event. If empty, not updated.
        location: Optional. The new location for the event. If empty, not updated.
        time_zone: Optional. The IANA time zone for updated `start_time` and `end_time`.
        attendees_to_add: Optional. A list of email addresses to add as attendees.
        attendees_to_remove: Optional. A list of email addresses to remove from attendees.
        force_reauth: If True, forces the Google Calendar API to re-authenticate.
                      Defaults to False.

    Returns:
        A string confirming the successful update of the event, including its ID and web link
        (e.g., "Event updated successfully!\nID: <id>\nLink: <htmlLink>").
        Returns an error message if the update fails (e.g., event not found, API error,
        permission issues).
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
    
    def __init__(self, verbose: bool = True, model_name: str = "gpt-3.5-turbo-0125"):#gpt-4o-mini"):
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
                list_calendar_events, 
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
            "Your goal is to fulfill the user's request using your tools. You have a tool `create_calendar_event`, which automatically adds a video link (like Google Meet) if `create_conference` is true (default). "
            "NEVER invent information, especially personal details like emails. Only use what's given or derived from tool output. "
            "Before using any tool, ensure all critical info is present. If anything essential is missing, ASK the user for it—do NOT proceed without it. "
            "To create events: you MUST have a summary, start time, and end time. "
            "- Attendee emails:\n"
            "  - If a person is mentioned (e.g., 'Meet with Olga'), assume they should be invited as an attendee.\n"
            "  - Try to find their email using prior event history or from related emails.\n"
            "  - If not found, ask the user to provide it using the Task input.required prompt (e.g., 'What is Olga's email address so I can send the invite?').\n"
            "  - Do NOT invent or use placeholders like 'name@example.com'.\n"
            "  - If an email looks generic (e.g., olga@example.com), ASK for confirmation before proceeding.\n"
            "- Timezones:\n"
            "  - Do NOT convert times unless told to. Use any provided IANA timezone (e.g., Europe/Paris) as-is.\n"
            "  - If the time includes a named zone (e.g., '10 AM EST'), map it to IANA (e.g., America/New_York) and use it in the `time_zone` parameter.\n"
            "  - If time is ISO 8601 with 'Z' or offset, pass it as-is without `time_zone`.\n"
            "  - If the user gives time without timezone info (e.g., '2 PM'), you MUST ask for an IANA timezone. Never assume UTC.\n"
            "- After using `create_calendar_event` or `update_calendar_event`, verify success. Only say it's successful if tool confirms with 'Event created successfully and verified'. Report errors clearly.\n"
            "- For updates/deletes: you MUST have `event_id`. If missing, ask the user or suggest listing/searching events.\n"
            "- Adding attendees: if only names are given, ask for email addresses. Do NOT proceed with placeholders.\n"
            "- If times/dates are vague (e.g., 'evening', 'next Tuesday'), ask for exact info.\n"
            "If any of the following is missing: summary, start/end time, valid/confirmed attendee emails, timezone for local time, or event_id (for updates), DO NOT USE ANY TOOL. Ask the user instead. "
            "If the request needs info from emails, refer the user to the Gmail Assistant. Only act on calendar tasks if all data is present."
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
            AgentSkill(
                id="calendar-assistant",
                name="calendar-assistant",
                description="Overall capability to manage and interact with Google Calendar. This includes understanding natural language requests related to calendar operations.",
                tags=["calendar", "assistant", "google calendar", "natural language processing"],
                examples=[
                    "What's on my calendar for tomorrow?",
                    "Can you schedule a meeting for me?",
                    "Remind me about my doctor's appointment."
                ],
                inputModes=["text"],
                outputModes=["text"]
            ),
            AgentSkill(
                id="google-calendar",
                name="google-calendar",
                description="Direct interaction with the Google Calendar API. This skill covers the technical aspects of connecting to and using Google Calendar services.",
                tags=["google calendar", "api", "integration", "events"],
                examples=[
                    "List events from my primary calendar.",
                    "Authenticate with Google Calendar.",
                    "Check permissions for calendar access."
                ],
                inputModes=["text"], # Can also be API calls internally
                outputModes=["text", "json"] # API responses
            ),
            AgentSkill(
                id="event-management",
                name="event-management",
                description="Specific skills for creating, reading, updating, and deleting (CRUD) calendar events. Handles event details like summaries, times, attendees, and locations.",
                tags=["event", "create", "update", "delete", "list", "manage", "crud"],
                examples=[
                    "Create an event titled 'Team Meeting' for next Monday at 10 AM.",
                    "Update my 'Project Deadline' event to be on Friday.",
                    "Delete the 'Lunch with Alex' event.",
                    "Show me all events for next week."
                ],
                inputModes=["text"],
                outputModes=["text"]
            ),
            AgentSkill(
                id="scheduling",
                name="scheduling",
                description="Assists with scheduling appointments, meetings, and managing time slots. This can involve finding free time, coordinating with attendees (if supported), and setting reminders.",
                tags=["schedule", "appointment", "meeting", "time management", "coordination"],
                examples=[
                    "Schedule a 30-minute call with Sarah next Tuesday afternoon.",
                    "Find a free slot for a 1-hour meeting next week.",
                    "Add a recurring weekly reminder for project updates."
                ],
                inputModes=["text"],
                outputModes=["text"]
            )
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
            
            # Add a simple warning about placeholder emails
            user_prompt += "\n\nNever use placeholder email domains like example.com."
            
            # Call CrewAI to process calendar query
            result = await crew_ai_wrapper.process_calendar_query(user_prompt)
            
            # Check for error indicators in the response
            if any(indicator in result.lower() for indicator in ["http error", "api error", "permission error"]):
                await task.set_status(
                    TaskStatus(
                        state=TaskState.FAILED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text=f"There was an issue with the calendar request: {result}")],
                        ),
                    ),
                    is_final=True,
                )
                return
            
            # Check for placeholder domains in the result
            if any(domain in result for domain in ["example.com", "example.org", "test.com"]):
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="I notice there's a placeholder email address in the request. Please provide a valid email address.")],
                        ),
                    ),
                    is_final=False,
                )
                return
            
            # Check if the agent is asking for more information
            if result.strip().endswith("?") or any(phrase in result.lower() for phrase in ["please provide", "do you mean", "clarify"]):
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
                        parts=[TextPart(text=f"Error processing request: {str(e)}")],
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
    return server


if __name__ == "__main__":
    # Set up and run the server using uvicorn directly, avoiding asyncio conflict
    server = asyncio.run(setup_server())
    print("Starting Elkar A2A server on http://localhost:5002")
    print("Press Ctrl+C to stop the server")
    
    # Run with uvicorn directly instead of server.start()
    uvicorn.run(server.app, host="0.0.0.0", port=5002) 