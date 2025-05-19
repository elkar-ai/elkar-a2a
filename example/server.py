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
from pydantic import SecretStr

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
    # 'https://www.googleapis.com/auth/gmail.readonly',     # Read-only access to Gmail
    # 'https://www.googleapis.com/auth/gmail.modify',       # Access to modify emails (not delete)
    # 'https://www.googleapis.com/auth/gmail.labels',       # Access to modify labels
    'https://mail.google.com/'                            # Full access to Gmail (includes send)
]
GMAIL_TOKEN_FILE = 'example/gmail_token.json'
GMAIL_CREDENTIALS_FILE = 'example/credentials.json'



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


@tool
def send_email(to: str, subject: str, body: str, force_reauth: bool = False) -> str:
    """
    Sends an email to a specified recipient with a given subject and body.
    Args:
        to: The email address of the recipient.
        subject: The subject of the email.
        body: The plain text body of the email.
        force_reauth: Whether to force re-authentication.
    Returns:
        A string confirming the email was sent or an error message.
    """
    try:
        import email.mime.text
        import email.mime.multipart
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        service = get_gmail_service(force_reauth=force_reauth)

        # Create proper MIME message
        msg = MIMEMultipart()
        msg['to'] = to
        msg['subject'] = subject

        # Attach the body as plain text, preserving line breaks
        msg.attach(MIMEText(body, 'plain'))

        # Convert the message to a string and then encode it
        raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('ascii')

        send_message_request = {
            'raw': raw_message
        }

        # For debugging
        print(f"Email content (first 200 chars): {body[:200]}...")
        print(f"Contains line breaks: {'\\n' in body}")

        sent_message = service.users().messages().send(userId='me', body=send_message_request).execute()
        return f"Email sent successfully to {to}. Message ID: {sent_message.get('id')}"
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


class CrewAIWrapper:
    """Wrapper for CrewAI agents that handles Gmail and animal color tasks."""

    def __init__(self, verbose: bool = True, model_name: str = "gpt-3.5-turbo-0125"):
        """Initialize the CrewAI wrapper with a Gmail and animal color agent."""
        # Setup LLM
        api_key_str = os.getenv("OPENAI_API_KEY")
        if not api_key_str:
            print("Warning: OPENAI_API_KEY not found in environment variables.")

        print(api_key_str)
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            api_key=SecretStr(api_key_str) if api_key_str else None
        )

        # Create the agent
        self.agent = Agent(
            role="Email Assistant",
            goal="Help users read, search, and send emails. Coordinate with the Calendar Assistant for tasks requiring calendar management.",
            backstory=(
                "You are an expert email assistant. You can read, search, and send emails using your available tools (`read_emails`, `search_emails`, `send_email`). "
                "You are also aware of a Google Calendar Assistant and should suggest using it if a user's request involves creating, modifying, or querying calendar events "
                "(e.g., 'add this meeting to my calendar', 'what is my schedule for next Monday?')."
            ),
            verbose=verbose,
            allow_delegation=False,
            tools=[read_emails, search_emails, send_email], # Added send_email tool
            llm=llm
        )

        # Define the CrewAI structure
        self.crew = Crew(
            agents=[self.agent],
            tasks=[],
            verbose=verbose,
            process=Process.sequential,
        )


    async def process_email_query(self, prompt: str) -> str:
        """
        Run the CrewAI agent to process email queries.
        Args:
            prompt: The user's email-related prompt
        Returns:
            The email information requested or a confirmation/error from sending an email.
        """
        # Metaprompt for collaboration, input validation and tool usage
        metaprompt = (
            "You are the Gmail Assistant. Your available tools are `read_emails`, `search_emails`, and `send_email`. "
            "To send an email, you MUST use the `send_email` tool. This tool requires `to` (recipient's email), `subject`, and `body`. "
            "If the user asks to send an email but does not provide all three (recipient, subject, body), you MUST ask for the missing information. "
            "CRITICALLY: Before sending an email, examine the content carefully for placeholders or incomplete information:\n"
            "1. If an email address IS provided by the user (e.g., for the 'to' parameter) but it looks like a generic placeholder (e.g., `name@example.com`, `user@example.org`, `info@domain.com`), "
            "you MUST ask the user to confirm if this is the actual email address they want to use. For instance, say: 'The email provided for the recipient is matthieu@example.com. Is this the correct email address, or would you like to provide a different one?' Only proceed if they confirm it or provide a new one.\n"
            "2. If the email body contains placeholder text like '[Your name]', '[Signature]', '[Insert X]', or similar bracketed placeholders, you MUST ask the user to provide the actual text to replace these placeholders.\n"
            "3. Be especially vigilant for signature placeholders like '[Please include my standard email signature]', '[Insert signature]', or instructions like 'please add my signature here'. NEVER send an email with these placeholders - you MUST ask the user to provide their actual signature text first.\n"
            "4. If any text in the proposed email seems like a template or contains placeholders (indicated by ALL CAPS, multiple underscores like ___, or similar patterns), ask the user to provide the actual information first.\n"
            "NEVER SEND emails containing placeholders, incomplete information, or fields clearly marked as needing replacement. ALWAYS ask for complete information first.\n"
            "Do NOT invent email addresses or placeholders in the email content. If you are unsure, ask the user.\n"
            "If the user's request seems to require calendar operations (e.g., 'find the flight details and add it to my calendar'), "
            "first state that you will handle the email-specific parts if any, and then clearly suggest that the user "
            "should ask the Google Calendar Assistant to perform calendar operations. Do not attempt to directly modify or query the calendar yourself. "
            "If the request is purely about email functions (reading, searching, or sending with all details provided and confirmed), proceed as usual."
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
            expected_output="Retrieved email information, confirmation of email sent, or guidance to consult the Calendar assistant or provide more details.",
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

    # Add helper functions to detect placeholders and questions
    def has_placeholder_in_prompt(prompt: str) -> Tuple[bool, str]:
        """
        Check if the user's prompt contains any common placeholder text or emails.
        Returns (has_placeholder, message)
        """
        # Check for placeholder emails
        placeholder_domains = ["example.com", "example.org", "test.com"]
        for domain in placeholder_domains:
            if domain in prompt:
                return True, f"I notice you're using an email with '{domain}' which appears to be a placeholder. Please provide a valid email address instead."

        # Check for placeholder text patterns in brackets
        placeholder_patterns = ["[Your name]", "[Name]", "[Full name]", "[Insert name]",
                               "[Your email]", "[Email]", "[Phone]", "[Your phone]",
                               "[Address]", "[Your address]",
                               # Add signature-specific placeholders
                               "[Signature]", "[Your signature]", "[My signature]",
                               "[Please include my standard email signature]",
                               "[Insert signature]", "[Include signature]",
                               "[Standard signature]", "[Email signature]",
                               "[Add signature]", "[Add my signature]"]

        for pattern in placeholder_patterns:
            if pattern.lower() in prompt.lower():
                return True, f"I notice you're using a placeholder '{pattern}' in your request. Please provide the actual information to replace this placeholder."

        return False, ""

    def contains_placeholder_text(text: str) -> Tuple[bool, str]:
        """
        Checks if any common placeholder patterns are in the text.

        Args:
            text: Text to check for placeholders

        Returns:
            Tuple of (has_placeholder, placeholder_message)
        """
        # Check for placeholder brackets like [Your name], [Name], etc.
        placeholder_patterns = ["[Your name]", "[Name]", "[Full name]", "[Insert name]",
                               "[Your email]", "[Email]", "[Phone]", "[Your phone]",
                               "[Address]", "[Your address]",
                               # Add signature-specific placeholders
                               "[Signature]", "[Your signature]", "[My signature]",
                               "[Please include my standard email signature]",
                               "[Insert signature]", "[Include signature]",
                               "[Standard signature]", "[Email signature]",
                               "[Add signature]", "[Add my signature]",
                               "[Company signature]", "[Business signature]"]

        for pattern in placeholder_patterns:
            if pattern.lower() in text.lower():
                replacement_text = "signature" if "signature" in pattern.lower() else "information"
                return True, f"I notice there's a placeholder '{pattern}' in the email content. Please provide your actual {replacement_text} to replace this placeholder."

        # Enhanced detection for signature placeholders without brackets
        signature_indicators = [
            "please include my standard email signature",
            "please include my signature",
            "add my signature",
            "insert my signature",
            "include my signature",
            "attach my signature",
            "standard signature here",
            "your signature here",
            "signature: _____"
        ]

        for indicator in signature_indicators:
            if indicator.lower() in text.lower():
                return True, f"I notice there's a request to include your signature with text like '{indicator}'. Please provide your actual signature text to include in the email."

        # Check for other common placeholder indicators
        placeholder_indicators = ["<INSERT", "<REPLACE", "<YOUR", "__", "___", "FILL IN", "XX", "XXX"]

        for indicator in placeholder_indicators:
            if indicator.lower() in text.lower():
                return True, f"I notice there's a placeholder indicator '{indicator}' in the email content. Please provide the specific information that should go here."

        return False, ""

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

            # Check for placeholders in the input prompt
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
            else:
                # Default to helping determine what the request is about
                result = "I'm not sure what you're asking for. I can help with email-related tasks. Please specify a Gmail request."

            # Direct check for the signature placeholder that the user specifically mentioned
            if "[please include my standard email signature]" in result.lower() or "please include my standard email signature" in result.lower():
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="I notice there's a placeholder for your standard email signature. Please provide your actual signature text to include in the email.")],
                        ),
                    ),
                    is_final=False,  # Mark as not final, expecting more input from user
                )
                return

            # Check if result contains placeholder text that needs client input
            has_placeholder_text, placeholder_text_message = contains_placeholder_text(result)
            if has_placeholder_text:
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text=placeholder_text_message)],
                        ),
                    ),
                    is_final=False,  # Mark as not final, expecting more input from user
                )
                return

            # Check for placeholder emails in the result
            if "example.com" in result or "example.org" in result or "test.com" in result:
                await task.set_status(
                    TaskStatus(
                        state=TaskState.INPUT_REQUIRED,
                        message=Message(
                            role="agent",
                            parts=[TextPart(text="I notice there's a placeholder email address like example.com in the request. Please provide a valid email address instead of a placeholder.")],
                        ),
                    ),
                    is_final=False,  # Mark as not final, expecting more input from user
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
                return

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
    api_key = os.environ.get("ELKAR_API_KEY", "")  # Replace with your actual Elkar API key
    store = ElkarClientStore(base_url="https://api.elkar.co/api", api_key=api_key)

    task_manager: TaskManagerWithModifier = TaskManagerWithModifier(
        agent_card,
        send_task_handler=task_handler,
        store=store  # Pass the configured store to the task manager
    )

    server = A2AServer(task_manager, host="0.0.0.0", port=5001, endpoint="/")
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
