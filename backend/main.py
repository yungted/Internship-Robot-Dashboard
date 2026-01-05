# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from requests.auth import HTTPDigestAuth 
from fastapi.responses import StreamingResponse

app = FastAPI()

# --- 1. Allow React (Frontend) to Talk to Python (Backend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. CAMERA CONFIGURATION (UPDATE THESE!) ---
# This is the "Magic URL" we found for Hikvision PTZ control
CAM_URL = "http://192.168.1.19/ISAPI/PTZCtrl/channels/1/continuous"

# ⚠️ REPLACE THESE WITH YOUR REAL CAMERA LOGIN ⚠️
CAM_USER = "admin"        
CAM_PASS = "abcd1234"  

# Define the data format coming from React
class PTZCommand(BaseModel):
    action: str      # 'move'
    direction: str   # 'left', 'right', 'up', 'down', 'zoom_in', 'zoom_out', 'stop'
    speed: int = 60  # 0-100

@app.post("/api/proxy")
def send_command(cmd: PTZCommand):
    print(f"👉 Received: {cmd.direction}")

    # --- 3. Calculate Speed Values ---
    pan = 0   # Left/Right
    tilt = 0  # Up/Down
    zoom = 0  # In/Out

    s = cmd.speed

    # Map direction to Pan/Tilt/Zoom values
    if cmd.direction == "left":      pan = -s
    elif cmd.direction == "right":   pan = s
    elif cmd.direction == "up":      tilt = s
    elif cmd.direction == "down":    tilt = -s
    elif cmd.direction == "zoom_in": zoom = s
    elif cmd.direction == "zoom_out": zoom = -s
    # "stop" defaults to 0,0,0 which stops the camera

    # --- 4. Create XML Payload ---
    # Hikvision cameras expect this specific XML format
    xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
    <PTZData>
        <pan>{pan}</pan>
        <tilt>{tilt}</tilt>
        <zoom>{zoom}</zoom>
    </PTZData>
    """

    try:
        # --- 5. Send Request to Camera ---
        # We use 'put' and 'HTTPDigestAuth' as required by Hikvision ISAPI
        response = requests.put(
            CAM_URL, 
            data=xml_payload, 
            headers={"Content-Type": "application/xml"},
            auth=HTTPDigestAuth(CAM_USER, CAM_PASS),
            timeout=2
        )
        
        if response.status_code == 200:
            return {"status": "success", "msg": "Camera moved"}
        elif response.status_code == 401:
            print("❌ Auth Failed: Check username/password in main.py")
            return {"status": "error", "msg": "Wrong Password"}
        else:
            print(f"❌ Camera Error: {response.status_code}")
            return {"status": "error", "msg": response.text}

    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return {"status": "error", "msg": str(e)}
    
STREAM_URL = "http://192.168.1.19/ISAPI/Streaming/channels/102/httpPreview"

# backend/main.py (Replace the bottom video_proxy function with this)

# backend/main.py

@app.get("/api/video")
def video_proxy():
    try:
        # 1. Connect to the camera
        req = requests.get(
            STREAM_URL, 
            stream=True, 
            auth=HTTPDigestAuth(CAM_USER, CAM_PASS),
            timeout=10
        )

        # DEBUG: Print the status
        print(f"📷 Camera Status: {req.status_code}")
        
        # --- NEW: Check for errors and print the "It" (The XML Body) ---
        if req.status_code != 200:
            print(f"❌ BLOCKED! Camera sent this message:") 
            print(req.text)  # <--- THIS PRINTS THE XML ERROR
            return {"error": f"Camera blocked access: {req.status_code}"}

        # If success, stream the video
        def generate():
            for chunk in req.iter_content(chunk_size=4096):
                if chunk: yield chunk

        return StreamingResponse(
            generate(), 
            media_type="multipart/x-mixed-replace; boundary=boundary"
        )

    except Exception as e:
        print(f"❌ Video Error: {e}")
        return {"error": "Video stream unavailable"}