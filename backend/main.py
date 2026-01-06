#backend/main.py
#Code to call the APIs and handle the requests
import subprocess
import threading
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

# --- 2. CAMERA CONFIGURATION (Camera IP and channel)---
CAM_URL = "http://192.168.1.19/ISAPI/PTZCtrl/channels/1/continuous"

# REPLACE WITH CAMERA LOGIN USERNAME AND PASSWORD
CAM_USER = "admin"        
CAM_PASS = "abcd1234"  

# Define the data format coming from React
class PTZCommand(BaseModel):
    action: str      # 'move'
    direction: str   # 'left', 'right', 'up', 'down', 'zoom_in', 'zoom_out', 'stop'
    speed: int = 60  # 0-100

# Camera control using API endpoint
@app.post("/api/proxy")
def send_command(cmd: PTZCommand):
    print(f"👉 Received: {cmd.direction}")

    #Speed Values
    pan = 0   # Left/Right
    tilt = 0  # Up/Down
    zoom = 0  # In/Out

    s = cmd.speed

    #Map direction to Pan/Tilt/Zoom values
    if cmd.direction == "left":      pan = -s
    elif cmd.direction == "right":   pan = s
    elif cmd.direction == "up":      tilt = s
    elif cmd.direction == "down":    tilt = -s
    elif cmd.direction == "zoom_in": zoom = s
    elif cmd.direction == "zoom_out": zoom = -s
    #"stop" defaults to 0,0,0

    #XML Payload 
    #Hikvision cameras expects XML format
    xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
    <PTZData>
        <pan>{pan}</pan>
        <tilt>{tilt}</tilt>
        <zoom>{zoom}</zoom>
    </PTZData>
    """

    try:
        #Sending Request to Camera ---
        response = requests.put(
            CAM_URL, 
            data=xml_payload, 
            headers={"Content-Type": "application/xml"},
            auth=HTTPDigestAuth(CAM_USER, CAM_PASS),
            timeout=2
        )
        
        #Debugging/Response Status
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
    

# --- Video Streaming Endpoint ---

# --- RTSP URL for Cam and Thermal ---
# --- Optical Camera --
RTSP_CAM_URL = "rtsp://admin:abcd1234@192.168.1.19:554/Streaming/Channels/102"
@app.get("/api/video")
def video_proxy():
    def generate():
        # FFmpeg command to convert RTSP -> MJPEG frames with improved quality
        ffmpeg_cmd = [
            "ffmpeg",
            "-rtsp_transport", "tcp",
            "-i", RTSP_CAM_URL,
            "-vf", "scale=1920:1440",  # Increased resolution for better quality
            "-q:v", "5",                # Better quality (lower = better, 1-2 max quality)
            "-f", "image2pipe",
            "-vcodec", "mjpeg",
            "pipe:1"
        ]

        process = subprocess.Popen(
            ffmpeg_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            bufsize=10**8
        )

        # Read full JPEG frames
        data = b""
        while True:
            chunk = process.stdout.read(1024)
            if not chunk:
                break
            data += chunk

            while True:
                # JPEG frames start with 0xFFD8 and end with 0xFFD9
                start = data.find(b"\xff\xd8")
                end = data.find(b"\xff\xd9")
                if start != -1 and end != -1 and end > start:
                    frame = data[start:end+2]
                    data = data[end+2:]

                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                    )
                else:
                    break

        process.kill()

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# --- Thermal Camera ---
RTSP_THERMALCAM_URL = "rtsp://admin:ipc12345@192.168.1.29:554/Streaming/Channels/102"
@app.get("/api/thermal")
def video_proxy():
    def generate():
        # FFmpeg command to convert RTSP -> MJPEG frames with improved quality
        ffmpeg_cmd = [
            "ffmpeg",
            "-rtsp_transport", "tcp",
            "-i", RTSP_THERMALCAM_URL,
            "-vf", "scale=1920:1440",  # Increased resolution for better quality
            "-q:v", "5",                # Better quality (lower = better, 1-2 max quality)
            "-f", "image2pipe",
            "-vcodec", "mjpeg",
            "pipe:1"
        ]

        process = subprocess.Popen(
            ffmpeg_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            bufsize=10**8
        )

        # Read full JPEG frames
        data = b""
        while True:
            chunk = process.stdout.read(1024)
            if not chunk:
                break
            data += chunk

            while True:
                # JPEG frames start with 0xFFD8 and end with 0xFFD9
                start = data.find(b"\xff\xd8")
                end = data.find(b"\xff\xd9")
                if start != -1 and end != -1 and end > start:
                    frame = data[start:end+2]
                    data = data[end+2:]

                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                    )
                else:
                    break

        process.kill()

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
