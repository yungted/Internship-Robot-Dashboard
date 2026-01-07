/* src/App.tsx */
import { useState } from 'react';
import PTZCamera from './components/ptz_camera';
import StatusBar from './components/status_bar';
import './App.css';

function App() {
  // --- STATE ---
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [robotMode, setRobotMode] = useState<'MANUAL' | 'AUTONOMOUS'>('MANUAL');
  const [ptzStatus, setPtzStatus] = useState<string>('Ready');

  // ⚠️ CONFIGURATION
  const PYTHON_API_URL = 'http://localhost:8000/api/proxy';
  const OPTICAL_STREAM_URL = 'http://localhost:8000/api/video';
  const THERMAL_STREAM_URL = 'http://localhost:8000/api/thermal';

  // --- HANDLERS ---
  const handleRobotMove = (cmd: string) => {
    if (!isConnected) return;
    console.log(`[ROBOT] ${cmd}`);
    // Ideally send ROS command here
  };

  const handlePtzMove = async (dir: string) => {
    setPtzStatus(dir === 'stop' ? 'Stopping...' : `Moving ${dir}...`);

    const payload = {
      action: 'move',
      direction: dir,
      speed: 60,
    };

    try {
      await fetch(PYTHON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('PTZ Connection Failed:', err);
      setPtzStatus('Error: Backend Offline?');
    }
  };

  const handleCapture = (camera: 'OPTICAL' | 'THERMAL') => {
    console.log(`[CAPTURE] ${camera}`);
    alert(`Snapshot taken: ${camera}`);
  };

  const toggleMode = () => {
    setRobotMode((prev) => (prev === 'MANUAL' ? 'AUTONOMOUS' : 'MANUAL'));
  };

  return (
    <div className="dashboard-container">
      <StatusBar onConnectionChange={setIsConnected} />

      {/* MAIN GRID */}
      <div className="main-grid">
        
        {/* LEFT SIDEBAR */}
        <div className="left-sidebar">
          <div className="secondary-panel">
            <div className="overlay-text">📡 LIDAR</div>
            <div className="lidar-placeholder">◎</div>
          </div>
          <div className="control-section left-controls">
            <div className="control-group" style={{flexDirection: 'row', gap: '50px', flex: 1}}>
              {/* Robot Drive - Left */}
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
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

              {/* Right side buttons grid */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(4, 1fr)', gap: '8px', width: '100%', maxWidth: '160px', minHeight: '200px'}}>
                <button className="btn-action" onClick={toggleMode} style={{background: robotMode === 'AUTONOMOUS' ? '#3b82f6' : '', fontSize: '0.75rem', padding: '8px'}}>GO {robotMode === 'MANUAL' ? 'AUTO' : 'MANUAL'}</button>
                <button className="btn-action" style={{borderColor: '#ef4444', color: '#ef4444', fontSize: '0.75rem', padding: '8px'}}>⚠️ E-STOP</button>
                <button className="btn-action" style={{fontSize: '0.75rem', padding: '8px'}}>LOCK WHEELS</button>
                <button className="btn-action" style={{fontSize: '0.75rem', padding: '8px'}}>ROTATION MODE</button>
                <button className="btn-action" style={{fontSize: '0.75rem', padding: '8px'}}>LIGHTS</button>
                <button className="btn-action" style={{fontSize: '0.75rem', padding: '8px'}}>Button 6</button>
                <button className="btn-action" style={{fontSize: '0.75rem', padding: '8px'}}>Button 7</button>
                <button className="btn-action" style={{fontSize: '0.75rem', padding: '8px'}}>Button 8</button>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CAMERAS */}
        <div className="center-cameras">
          <div className="primary-view">
            <div className="overlay-text">🔴 LIVE: OPTICAL PTZ</div>
            <img className="camera-feed" src={OPTICAL_STREAM_URL} alt="Waiting for Video Stream..." />
            <button className="btn-action camera-button" onClick={() => handleCapture('OPTICAL')}>📸 SNAP</button>
          </div>
          <div className="secondary-panel">
            <div className="overlay-text">🔥 THERMAL</div>
            <img className="camera-feed" src={THERMAL_STREAM_URL} alt="Waiting for Thermal Stream..." />
            <button className="btn-action camera-button" onClick={() => handleCapture('THERMAL')}>🌡️ HEAT</button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="right-sidebar">
          <div className="secondary-panel">
            <div className="overlay-text">🗺️ MAP</div>
            <div style={{color:'#555'}}>GPS Map Placeholder</div>
          </div>
          <div className="control-section right-controls">
            <PTZCamera onMove={handlePtzMove} status={ptzStatus} onCapture={handleCapture} />
          </div>
        </div>

        {/* CENTER CONTROLS */}
        <div className="center-controls">
          <div className="control-section center-control-section">
            <div className="control-group">
              <div className="group-label">ACTIONS</div>
              <div className="actions-grid">
                <button className="btn-action" onClick={() => handleCapture('OPTICAL')}>📸 SNAP</button>
                <button className="btn-action" onClick={() => handleCapture('THERMAL')}>📸 SNAP</button>
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