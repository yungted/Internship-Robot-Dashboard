import { useState } from 'react';

const API_URL = "http://localhost:8000/api/proxy"; // Points to Python

export default function PTZCamera() {
  const [status, setStatus] = useState("Ready");

  const send = async (dir: string) => {
    setStatus(dir === "stop" ? "Stopping" : `Moving ${dir}...`);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', direction: dir, speed: 60 })
      });
    } catch (e) {
      console.error(e);
      setStatus("Error");
    }
  };

  return (
    <div className="control-group">
      <div className="group-label">PTZ CONTROL</div>
      <div className="d-pad">
         {/* ZOOM IN */}
         <button className="btn-ctrl" 
           onMouseDown={() => send('zoom_in')} 
           onMouseUp={() => send('stop')}>+</button>
         
         {/* UP */}
         <button className="btn-ctrl" 
           onMouseDown={() => send('up')} 
           onMouseUp={() => send('stop')}>▲</button>
         
         {/* ZOOM OUT */}
         <button className="btn-ctrl" 
           onMouseDown={() => send('zoom_out')} 
           onMouseUp={() => send('stop')}>-</button>
         
         {/* LEFT */}
         <button className="btn-ctrl" 
           onMouseDown={() => send('left')} 
           onMouseUp={() => send('stop')}>◀</button>
         
         {/* STOP (Emergency) */}
         <button className="btn-ctrl stop" onClick={() => send('stop')}>●</button>
         
         {/* RIGHT */}
         <button className="btn-ctrl" 
           onMouseDown={() => send('right')} 
           onMouseUp={() => send('stop')}>▶</button>
         
         <div></div>
         {/* DOWN */}
         <button className="btn-ctrl" 
           onMouseDown={() => send('down')} 
           onMouseUp={() => send('stop')}>▼</button>
         <div></div>
      </div>
      <small style={{color:'#666'}}>{status}</small>
    </div>
  );
}