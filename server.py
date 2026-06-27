import os
import sys

# Prevent OpenSSL Applink and SSLKEYLOGFILE path crashes on Windows
if "SSLKEYLOGFILE" in os.environ:
    del os.environ["SSLKEYLOGFILE"]

# Configure UTF-8 output to avoid Windows console encoding issues when printing Web content
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import queue
import threading
import contextlib
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from workflow import run_research

app = FastAPI(title="AI Research Assistant API")

# Enable CORS for the frontend app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    query: str

class QueueWriter:
    def __init__(self, q):
        self.q = q
        self.original_stdout = sys.stdout
        
    def write(self, message):
        # Write to system stdout
        self.original_stdout.write(message)
        # Put into the queue for the client stream
        if message.strip():
            self.q.put(("log", message.strip()))
            
    def flush(self):
        self.original_stdout.flush()

def run_research_thread(query: str, q: queue.Queue):
    writer = QueueWriter(q)
    # Redirect standard output to our QueueWriter during research execution
    with contextlib.redirect_stdout(writer):
        try:
            result = run_research(query)
            q.put(("result", result))
        except Exception as e:
            q.put(("error", str(e)))

@app.post("/api/research")
async def research_endpoint(req: ResearchRequest):
    q = queue.Queue()
    t = threading.Thread(target=run_research_thread, args=(req.query, q))
    t.start()
    
    def event_generator():
        while t.is_alive() or not q.empty():
            try:
                # Poll queue for new logs or final result
                msg_type, data = q.get(timeout=0.5)
                yield f"event: {msg_type}\ndata: {json.dumps(data)}\n\n"
            except queue.Empty:
                continue
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
