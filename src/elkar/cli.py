import typer
from typing_extensions import Annotated
import logging
import uvicorn
from fastapi import FastAPI

# Assuming your FastMCP instance is in server_mcp.py and named 'mcp'
from .server_mcp import mcp

# Attempt to import the SSE route utility
try:
    from mcp.server.fastapi import add_sse_route
except ImportError:
    add_sse_route = None
    logging.warning(
        "Could not import 'add_sse_route' from 'mcp.server.fastapi'. "
        "SSE mode might not work correctly if this utility is required. "
        "Please ensure your FastMCP library is installed correctly and provides this utility, or adjust the import path."
    )

app = typer.Typer(
    name="elkar-mcp-cli",
    help="CLI for running the Elkar MCP server with different transport protocols.",
    add_completion=False,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.command()
def stdio():
    """
    Starts the MCP server with STDIO transport.
    Reads from stdin and writes to stdout.
    """
    logger.info("Starting MCP server with STDIO transport...")
    mcp.run(transport="stdio")

@app.command()
def sse(
    port: Annotated[int, typer.Option(help="Port to run the SSE server on.")] = 8000,
    host: Annotated[str, typer.Option(help="Host to bind the SSE server to.")] = "0.0.0.0",
):
    """
    Starts the MCP server with SSE (Server-Sent Events) transport.
    Runs an HTTP server for SSE communication.
    """
    logger.info(f"Starting MCP server with SSE transport on {host}:{port}...")
    
    if add_sse_route is None:
        logger.error("Cannot start SSE server because 'add_sse_route' utility could not be imported.")
        logger.error("Please check your FastMCP installation and the import path in cli.py.")
        return

    try:
        # Create a FastAPI app
        fastapi_app = FastAPI(
            title=f"{mcp.name} - SSE Server",
            description=mcp.instructions,
            # lifespan=mcp.lifespan # If your mcp has a lifespan, pass it here
        )
        
        # Add the MCP SSE route to the FastAPI app
        add_sse_route(fastapi_app, mcp)
        
        # Run the FastAPI app with Uvicorn
        uvicorn.run(fastapi_app, host=host, port=port)

    except Exception as e:
        logger.error(f"An unexpected error occurred while trying to start the SSE server: {e}")
        logger.error("Ensure FastAPI is installed and mcp object is correctly initialized.")

if __name__ == "__main__":
    app() 