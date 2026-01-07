//Code for controlling a PTZ camera via a dashboard interface
interface PTZCameraProps {
  onMove: (dir: string) => void;
  status: string;
}

export default function PTZCamera({ onMove, status }: PTZCameraProps) {
  return (
    <div className="ptz-container">
      <div className="group-label">PTZ CAMERA CONTROL</div>

      {/* PTZ Layout with Zoom on Sides */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* ZOOM OUT - LEFT */}
        <button className="btn-ctrl btn-zoom"
          onMouseDown={() => onMove('zoom_out')}
          onMouseUp={() => onMove('stop')}
          onMouseLeave={() => onMove('stop')}
        >🔍−</button>

        {/* D-PAD - CENTER */}
        <div className="d-pad">
          {/* TOP LEFT */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('up_left')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >↖</button>

          {/* UP */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('up')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >▲</button>

          {/* TOP RIGHT */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('up_right')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >↗</button>

          {/* LEFT */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('left')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >◀</button>

          {/* HOME */}
          <button className="btn-ctrl btn-home"
            onClick={() => onMove('home')}
          >⌂</button>

          {/* RIGHT */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('right')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >▶</button>

          {/* BOTTOM LEFT */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('down_left')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >↙</button>

          {/* DOWN */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('down')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >▼</button>

          {/* BOTTOM RIGHT */}
          <button className="btn-ctrl"
            onMouseDown={() => onMove('down_right')}
            onMouseUp={() => onMove('stop')}
            onMouseLeave={() => onMove('stop')}
          >↘</button>
        </div>

        {/* ZOOM IN - RIGHT */}
        <button className="btn-ctrl btn-zoom"
          onMouseDown={() => onMove('zoom_in')}
          onMouseUp={() => onMove('stop')}
          onMouseLeave={() => onMove('stop')}
        >🔍+</button>
      </div>

      <small style={{ color: '#666', marginTop: '8px' }}>{status}</small>
    </div>
  );
}