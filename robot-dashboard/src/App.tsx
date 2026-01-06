/* src/App.tsx */
import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // --- STATE ---
  const [battery, setBattery] = useState<number>(85);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [robotMode, setRobotMode] = useState<'MANUAL' | 'AUTONOMOUS'>('MANUAL');
  const [ptzStatus, setPtzStatus] = useState<string>("Ready");

  // ⚠️ CONFIGURATION
  const PYTHON_API_URL = "http://localhost:8000/api/proxy";
  const OPTICAL_STREAM_URL = "http://localhost:8000/api/video";
  const THERMAL_STREAM_URL = "http://localhost:8000/api/thermal";

  // --- HANDLERS ---
  // 1. Robot Movement (Placeholder)
  const handleRobotMove = (cmd: string) => {
    if (!isConnected) return;
    console.log(`[ROBOT] ${cmd}`);
  };

  // 2. PTZ Camera Control
  const handlePtzMove = async (dir: string) => {
    setPtzStatus(dir === "stop" ? "Stopping..." : `Moving ${dir}...`);
    
    const payload = {
      action: "move", 
      direction: dir, 
      speed: 60       
    };

    try {
      await fetch(PYTHON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("PTZ Connection Failed:", err);
      setPtzStatus("Error: Backend Offline?");
    }
  };

  // 3. Snapshot Function
  const handleCapture = (camera: 'OPTICAL' | 'THERMAL') => {
    console.log(`[CAPTURE] ${camera}`);
    alert(`Snapshot taken: ${camera}`);
  };

  // 4. Toggle Mode
  const toggleMode = () => {
    setRobotMode(prev => prev === 'MANUAL' ? 'AUTONOMOUS' : 'MANUAL');
  };

  // Battery Mock
  useEffect(() => {
    const interval = setInterval(() => setBattery(b => (b > 0 ? b - 1 : 0)), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <header className="header">
        <h2 style={{margin:0, letterSpacing: '1px'}}>🤖 AGILEX RANGER CONTROLLER</h2>
        <div className="status-bar">
          <div className="status-item">
            <div className="indicator" style={{background: isConnected ? '#10b981' : '#ef4444'}}></div>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="status-item">
            <span style={{color: '#8b9bb4'}}>BATTERY:</span>
            <span style={{color: battery < 20 ? '#ef4444' : '#10b981'}}>{battery}%</span>
          </div>
          <div className="status-item">
             <span style={{color: '#8b9bb4'}}>STATUS:</span>
             <span style={{color: '#3b82f6'}}>{ptzStatus}</span>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="main-grid">
        
        {/* LEFT SIDEBAR - LIDAR + ROBOT DRIVE */}
        <div className="left-sidebar">
          <div className="secondary-panel">
            <div className="overlay-text">📡 LIDAR</div>
            <div className="lidar-placeholder">◎</div>
          </div>
          <div className="control-section left-controls">
            <div className="control-group">
              <div className="group-label">ROBOT DRIVE</div>
              <div className="d-pad">
                <div></div>
                <button className="btn-ctrl" onMouseDown={() => handleRobotMove('FORWARD')}>▲</button>
                <div></div>
                <button className="btn-ctrl" onMouseDown={() => handleRobotMove('LEFT')}>◀</button>
                <button className="btn-ctrl btn-stop" onClick={() => handleRobotMove('STOP')}>STOP</button>
                <button className="btn-ctrl" onMouseDown={() => handleRobotMove('RIGHT')}>▶</button>
                <div></div>
                <button className="btn-ctrl" onMouseDown={() => handleRobotMove('REVERSE')}>▼</button>
                <div></div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CAMERAS */}
        <div className="center-cameras">
          {/* --- 🔴 LIVE VIDEO SECTION --- */}
          <div className="primary-view">
            <div className="overlay-text">🔴 LIVE: OPTICAL PTZ</div>
            <img 
            className="camera-feed"
            src={OPTICAL_STREAM_URL}
            alt="Waiting for Video Stream..."
            />
          </div>

          {/* THERMAL CAMERA*/}
          <div className="secondary-panel">
            <div className="overlay-text">🔥 THERMAL</div>
            <img 
            className="camera-feed"
            src={THERMAL_STREAM_URL}
            alt="Waiting for Thermal Stream..."
            />
          </div>
        </div>

        {/* RIGHT SIDEBAR - MAP + PTZ CONTROL */}
        <div className="right-sidebar">
          <div className="secondary-panel">
            <div className="overlay-text">🗺️ MAP</div>
            <div style={{color:'#555'}}>GPS Map Placeholder</div>
          </div>
          <div className="control-section right-controls">
            <div className="control-group">
              <div className="group-label">PTZ CONTROL</div>
              <div className="d-pad">
                {/* ZOOM IN */}
                <button className="btn-ctrl" style={{fontSize: '0.8rem'}} 
                  onMouseDown={() => handlePtzMove('zoom_in')} 
                  onMouseUp={() => handlePtzMove('stop')}
                  onMouseLeave={() => handlePtzMove('stop')}
                >Z+</button>
                
                {/* TILT UP */}
                <button className="btn-ctrl" 
                  onMouseDown={() => handlePtzMove('up')} 
                  onMouseUp={() => handlePtzMove('stop')}
                  onMouseLeave={() => handlePtzMove('stop')}
                >▲</button>
                
                {/* ZOOM OUT */}
                <button className="btn-ctrl" style={{fontSize: '0.8rem'}} 
                  onMouseDown={() => handlePtzMove('zoom_out')} 
                  onMouseUp={() => handlePtzMove('stop')}
                  onMouseLeave={() => handlePtzMove('stop')}
                >Z-</button>
                
                {/* PAN LEFT */}
                <button className="btn-ctrl" 
                  onMouseDown={() => handlePtzMove('left')} 
                  onMouseUp={() => handlePtzMove('stop')}
                  onMouseLeave={() => handlePtzMove('stop')}
                >◀</button>
                
                <button className="btn-ctrl" style={{background: '#1f2937'}}>●</button>
                
                {/* PAN RIGHT */}
                <button className="btn-ctrl" 
                  onMouseDown={() => handlePtzMove('right')} 
                  onMouseUp={() => handlePtzMove('stop')}
                  onMouseLeave={() => handlePtzMove('stop')}
                >▶</button>
                
                <div></div>
                {/* TILT DOWN */}
                <button className="btn-ctrl" 
                  onMouseDown={() => handlePtzMove('down')} 
                  onMouseUp={() => handlePtzMove('stop')}
                  onMouseLeave={() => handlePtzMove('stop')}
                >▼</button>
                <div></div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CONTROLS - ACTIONS */}
        <div className="center-controls">
          <div className="control-section center-control-section">
            <div className="control-group">
              <div className="group-label">ACTIONS</div>
              <div className="actions-grid">
                <button className="btn-action" onClick={() => handleCapture('OPTICAL')}>📸 SNAP</button>
                <button className="btn-action" onClick={() => handleCapture('THERMAL')}>🌡️ HEAT</button>
                <button className="btn-action" onClick={toggleMode} style={{background: robotMode === 'AUTONOMOUS' ? '#3b82f6' : ''}}>
                   {robotMode === 'MANUAL' ? 'GO AUTO' : 'GO MANUAL'}
                </button>
                <button className="btn-action" style={{borderColor: '#ef4444', color: '#ef4444'}}>
                  ⚠️ E-STOP
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;