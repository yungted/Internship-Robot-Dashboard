import { useState, useEffect } from 'react';
import * as ROSLIB from 'roslib';

interface StatusBarProps {
  // We keep this prop in case the parent component (e.g., Joystick) needs to know the status
  onConnectionChange: (isConnected: boolean) => void;
}

const ROBOT_WS_URL = 'ws://192.168.1.102:9090';

/* ======================================================
   GLOBAL SINGLETON & DATA STORE
   (Background Logic - Invisible to User)
====================================================== */

// 1. The Data Store
const bmsStore = {
  SOC: 0,
  SOH: 0,
  batteryCurrent: 0,
  batteryVoltage: 0,
  batteryTemperature: 0,
};

// 2. Connection State
let ros: ROSLIB.Ros | null = null;
let reconnectTimer: number | null = null;
let isGlobalConnecting = false;
let isGlobalConnected = false;

// 3. Listeners
const dataListeners = new Set<() => void>();
const connectionListeners = new Set<(connected: boolean) => void>();

const notifyDataChange = () => dataListeners.forEach((cb) => cb());
const notifyConnectionChange = (status: boolean) => {
  isGlobalConnected = status;
  connectionListeners.forEach((cb) => cb(status));
};

// 4. Background Subscription Manager
function setupSubscriptions() {
  if (!ros) return;

  const statusListener = new ROSLIB.Topic({
    ros: ros,
    name: '/dash_board/BMS_status',
  });

  statusListener.subscribe((message: any) => {
    const data = message.msg ?? message;

    if (data.SOC !== undefined) bmsStore.SOC = data.SOC;
    if (data.SOH !== undefined) bmsStore.SOH = data.SOH;
    if (data.batteryCurrent !== undefined) bmsStore.batteryCurrent = data.batteryCurrent;
    if (data.batteryVoltage !== undefined) bmsStore.batteryVoltage = data.batteryVoltage;
    if (data.batteryTemperature !== undefined) bmsStore.batteryTemperature = data.batteryTemperature;

    notifyDataChange();
  });
}

// 5. Connection Loop
function connectRos() {
  if (ros || isGlobalConnecting) return;
  isGlobalConnecting = true;
  // console.log('[ROS] Connecting...'); // Optional: Comment out for total silence

  ros = new ROSLIB.Ros({ url: ROBOT_WS_URL });

  ros.on('connection', () => {
    // console.log('[ROS] Connected');
    isGlobalConnecting = false;
    notifyConnectionChange(true);
    setupSubscriptions(); // Auto-subscribe on connect
  });

  ros.on('close', () => {
    ros = null;
    isGlobalConnecting = false;
    notifyConnectionChange(false);
    
    // Silent auto-reconnect
    if (!reconnectTimer) {
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectRos();
      }, 3000);
    }
  });

  ros.on('error', () => {
    // Suppress errors in console if desired, or keep minimal logging
  });
}

// Initialize immediately
connectRos();


/* ======================================================
   COMPONENT
====================================================== */
export default function StatusBar({ onConnectionChange }: StatusBarProps) {
  // We only track 'bms' for rendering. 
  // We don't track 'isConnected' for rendering anymore, only for the callback.
  const [bms, setBms] = useState({ ...bmsStore });

  useEffect(() => {
    const handleDataUpdate = () => setBms({ ...bmsStore });

    // We still listen to connection changes to notify the PARENT (via onConnectionChange)
    // but we won't update any local state to trigger a UI re-render for it.
    const handleConnectionUpdate = (connected: boolean) => {
      onConnectionChange(connected);
    };

    dataListeners.add(handleDataUpdate);
    connectionListeners.add(handleConnectionUpdate);

    // Initial sync for parent
    onConnectionChange(isGlobalConnected);

    return () => {
      dataListeners.delete(handleDataUpdate);
      connectionListeners.delete(handleConnectionUpdate);
    };
  }, [onConnectionChange]);

  return (
    <header className="header">
      <h2 style={{ margin: 0, letterSpacing: '1px' }}>
        🤖 AGILEX RANGER CONTROLLER
      </h2>

      <div className="status-bar">
        {/* REMOVED: The "status-item" block containing debugMsg 
           and the Online/Offline indicator. 
        */}

        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>BATTERY:</span>
          <span style={{ color: bms.SOC < 20 ? '#ef4444' : '#10b981' }}>
            {bms.SOC}%
          </span>
        </div>

        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>SOH:</span>
          <span style={{ color: bms.SOH < 80 ? '#f59e0b' : '#10b981' }}>
            {bms.SOH}%
          </span>
        </div>

        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>VOLTAGE:</span>
          <span style={{ color: '#3b82f6' }}>
            {bms.batteryVoltage.toFixed(1)}V
          </span>
        </div>

        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>CURRENT:</span>
          <span style={{ color: '#3b82f6' }}>
            {bms.batteryCurrent.toFixed(1)}A
          </span>
        </div>

        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>TEMP:</span>
          <span
            style={{
              color: bms.batteryTemperature > 50 ? '#ef4444' : '#10b981',
            }}
          >
            {bms.batteryTemperature.toFixed(1)}°C
          </span>
        </div>

        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>STATUS:</span>
        </div>
      </div>
    </header>
  );
}