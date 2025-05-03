import asyncio
from elkar.client.a2a_client import A2AClient, A2AClientConfig
from elkar.a2a_types import Message, TextPart


async def main():
    # Configure the client
    config = A2AClientConfig(
        base_url="http://localhost:8000",
        headers={"Authorization": "Bearer your-token-here"},
    )

    # Use the client with async context manager
    async with A2AClient(config) as client:
        # Get the agent card
        agent_card = await client.get_agent_card()
        print(f"Connected to agent: {agent_card.name}")

        # Create a task
        task_id = "task-123"
        message = Message(
            role="user", parts=[TextPart(text="Hello, can you help me with something?")]
        )

        # Send the task
        response = await client.send_task(
            task_id=task_id, message=message, metadata={"priority": "high"}
        )

        if response.error:
            print(f"Error: {response.error}")
        else:
            print(f"Task created: {response.result}")

        # Example of streaming response
        async for event in client.send_task_streaming(task_id=task_id, message=message):
            if event.error:
                print(f"Error: {event.error}")
            else:
                print(f"Event: {event.result}")


if __name__ == "__main__":
    asyncio.run(main())
