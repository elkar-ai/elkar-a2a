import asyncio
import uvicorn

# Run both API and A2A server
if __name__ == "__main__":
    uvicorn.run("app_sample:app", host="0.0.0.0", port=5001, reload=True)
