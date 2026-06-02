from fastapi import FastAPI

app = FastAPI(title="Bug-O-Dex API")


@app.get("/health")
def health_check():
    return {"status": "ok"}
