import uvicorn

if __name__ == "__main__":
    uvicorn.run("appv2:app", host="0.0.0.0", port=5001, reload=True)
