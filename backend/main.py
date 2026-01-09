# backend/main.py - uvicorn main:app --reload
import subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from requests.auth import HTTPDigestAuth 
from fastapi.responses import StreamingResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CAMERA CONFIGURATION ---
CAM_URL = "http://192.168.1.19/ISAPI/PTZCtrl/channels/1/continuous"
CAM_USER = "admin"        
CAM_PASS = "abcd1234"  

class PTZCommand(BaseModel):
    action: str      
    direction: str   
    speed: int = 60  

@app.post("/api/proxy")
def send_command(cmd: PTZCommand):
    print(f"👉 Received: {cmd.direction}")

    pan = 0   
    tilt = 0  
    zoom = 0  
    s = cmd.speed

    # Direction Mapping
    if cmd.direction == "left":      pan = -s
    elif cmd.direction == "right":   pan = s
    elif cmd.direction == "up":      tilt = s
    elif cmd.direction == "down":    tilt = -s
    elif cmd.direction == "up_left":
        pan = -s
        tilt = s
    elif cmd.direction == "up_right":
        pan = s
        tilt = s
    elif cmd.direction == "down_left":
        pan = -s
        tilt = -s
    elif cmd.direction == "down_right":
        pan = s
        tilt = -s
    elif cmd.direction == "zoom_in":
        zoom = s
    elif cmd.direction == "zoom_out":
        zoom = -s
    elif cmd.direction == "home":
        # 'Home' usually means go to Preset 1, or just stop. 
        # Sending 0,0,0 effectively stops it for now.
        pan = 0
        tilt = 0
        zoom = 0

    # ✅ FIX: XML string must NOT have leading indentation/spaces
    xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
<PTZData version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema">
    <pan>{pan}</pan>
    <tilt>{tilt}</tilt>
    <zoom>{zoom}</zoom>
</PTZData>"""

    try:
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
            print("❌ Auth Failed")
            return {"status": "error", "msg": "Wrong Password"}
        else:
            print(f"❌ Camera Error {response.status_code}: {response.text}")
            return {"status": "error", "msg": response.text}

    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return {"status": "error", "msg": str(e)}

# --- Video Streaming ---
RTSP_CAM_URL = "rtsp://admin:abcd1234@192.168.1.19:554/Streaming/Channels/102"
@app.get("/api/video")
def optical_video_proxy():
    def generate():
        ffmpeg_cmd = [
            "ffmpeg", "-rtsp_transport", "tcp", "-i", RTSP_CAM_URL,
            "-vf", "scale=1920:1440", "-q:v", "5", 
            "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"
        ]
        process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10**8)
        
        data = b""
        while True:
            chunk = process.stdout.read(1024)
            if not chunk: break
            data += chunk
            while True:
                start = data.find(b"\xff\xd8")
                end = data.find(b"\xff\xd9")
                if start != -1 and end != -1 and end > start:
                    frame = data[start:end+2]
                    data = data[end+2:]
                    yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
                else:
                    break
        process.kill()

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

RTSP_THERMALCAM_URL = "rtsp://admin:ipc12345@192.168.1.29:554/Streaming/Channels/102"
@app.get("/api/thermal")
def thermal_video_proxy():
    def generate():
        ffmpeg_cmd = [
            "ffmpeg", "-rtsp_transport", "tcp", "-i", RTSP_THERMALCAM_URL,
            "-vf", "scale=1920:1440", "-q:v", "5", 
            "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"
        ]
        process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10**8)
        data = b""
        while True:
            chunk = process.stdout.read(1024)
            if not chunk: break
            data += chunk
            while True:
                start = data.find(b"\xff\xd8")
                end = data.find(b"\xff\xd9")
                if start != -1 and end != -1 and end > start:
                    frame = data[start:end+2]
                    data = data[end+2:]
                    yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
                else:
                    break
        process.kill()

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")