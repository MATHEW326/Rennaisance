import os
import sys

# Prevent OpenSSL Applink and SSLKEYLOGFILE path crashes on Windows
if "SSLKEYLOGFILE" in os.environ:
    del os.environ["SSLKEYLOGFILE"]

# Configure UTF-8 output to avoid Windows console encoding issues when printing Web content
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import queue
import threading
import contextlib
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from workflow import run_research

app = FastAPI(
    title="AI Research Assistant API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Models
# -----------------------------
class ResearchRequest(BaseModel):
    query: str


# -----------------------------
# Health & Root Endpoints
# -----------------------------
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Research Assistant API",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# -----------------------------
# Streaming Helper
# -----------------------------
class QueueWriter:
    def __init__(self, q):
        self.q = q
        self.original_stdout = sys.stdout

    def write(self, message):
        self.original_stdout.write(message)

        if message.strip():
            self.q.put(("log", message.strip()))

    def flush(self):
        self.original_stdout.flush()


def run_research_thread(query: str, q: queue.Queue):
    writer = QueueWriter(q)

    with contextlib.redirect_stdout(writer):
        try:
            result = run_research(query)
            q.put(("result", result))
        except Exception as e:
            q.put(("error", str(e)))


# -----------------------------
# Research Endpoint
# -----------------------------
@app.post("/api/research")
async def research_endpoint(req: ResearchRequest):
    q = queue.Queue()

    t = threading.Thread(
        target=run_research_thread,
        args=(req.query, q),
        daemon=True
    )
    t.start()

    def event_generator():
        while t.is_alive() or not q.empty():
            try:
                msg_type, data = q.get(timeout=0.5)

                yield (
                    f"event: {msg_type}\n"
                    f"data: {json.dumps(data)}\n\n"
                )

            except queue.Empty:
                continue

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


# -----------------------------
# Local Development / Railway
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000))
    )