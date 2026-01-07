import { useState, useEffect, useRef } from 'react';
import * as ROSLIB from 'roslib';

interface StatusBarProps {
  onConnectionChange: (isConnected: boolean) => void;
}

export default function StatusBar({ onConnectionChange }: StatusBarProps) {
  // --- STATE ---
  const [battery, setBattery] = useState<number>(0);
  const [batterySOH, setBatterySOH] = useState<number>(0);
  const [batteryCurrent, setBatteryCurrent] = useState<number>(0);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(0);
  const [batteryTemperature, setBatteryTemperature] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [debugMsg, setDebugMsg] = useState<string>('Initializing...');

  // --- CONFIGURATION ---
  const ROBOT_WS_URL = 'ws://192.168.1.102:9090';

  // --- REFS ---
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true); // Tracks if component is alive
  
  // Ref for the callback to prevent dependency loops
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Update the callback ref whenever the parent changes it
  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  // --- MAIN CONNECTION LOGIC ---
  useEffect(() => {
    isMountedRef.current = true; // Mark as alive on mount

    // Prevent duplicate connections
    if (rosRef.current) return;

    const connectToRos = () => {
      // Safety: Don't try to connect if we are already unmounted
      if (!isMountedRef.current) return;

      console.log(`[StatusBar] Connecting to ${ROBOT_WS_URL}...`);
      setDebugMsg('Connecting...');

      const ros = new ROSLIB.Ros({
        url: ROBOT_WS_URL,
      });

      rosRef.current = ros;

      // --- EVENT: CONNECTED ---
      ros.on('connection', () => {
        if (!isMountedRef.current) return;
        
        console.log('[StatusBar] ✅ Connected');
        setDebugMsg('Connected');
        setIsConnected(true);
        onConnectionChangeRef.current(true);

        // Clear any pending reconnect timers
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      });

      // --- EVENT: ERROR ---
      ros.on('error', (error) => {
        if (!isMountedRef.current) return;
        console.warn('[StatusBar] ❌ ROS Error:', error);
        setDebugMsg('Connection Error');
        // We let the 'close' event handle the retry logic
      });

      // --- EVENT: CLOSED ---
      ros.on('close', () => {
        // 🛑 CRITICAL FIX: If we unmounted intentionally, STOP HERE.
        if (!isMountedRef.current) {
            console.log('[StatusBar] Intentional close. No retry.');
            return;
        }

        console.log('[StatusBar] ⚠️ Connection dropped. Retrying in 3s...');
        setDebugMsg('Reconnecting...');
        setIsConnected(false);
        onConnectionChangeRef.current(false);
        
        rosRef.current = null;

        // Only schedule a retry if one isn't already pending
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
                connectToRos();
            }
          }, 3000);
        }
      });

      // --- SUBSCRIPTIONS ---
      // @ts-ignore
      const statusListener = new ROSLIB.Topic({
        ros: ros,
        name: '/dash_board/BMS_status',
        // messageType: 'std_msgs/String' // Uncomment if you know the type
      });

      statusListener.subscribe((message: any) => {
        if (!isMountedRef.current) return;
        
        // Handle both direct JSON and ROS message formats
        const data = message.msg || message;

        // Update state only if values exist
        if (data.SOC !== undefined) setBattery(data.SOC);
        if (data.SOH !== undefined) setBatterySOH(data.SOH);
        if (data.batteryCurrent !== undefined) setBatteryCurrent(data.batteryCurrent);
        if (data.batteryVoltage !== undefined) setBatteryVoltage(data.batteryVoltage);
        if (data.batteryTemperature !== undefined) setBatteryTemperature(data.batteryTemperature);
      });
    };

    // Start the connection
    connectToRos();

    // --- CLEANUP ---
    return () => {
      console.log('[StatusBar] 🧹 Unmounting...');
      isMountedRef.current = false; // 1. Kill the "alive" flag

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (rosRef.current) {
        rosRef.current.close(); // 2. Close connection (Won't trigger retry because flag is false)
        rosRef.current = null;
      }
    };
  }, []); // ⚠️ Empty dependency array = Runs ONCE

  return (
    <header className="header">
      <h2 style={{ margin: 0, letterSpacing: '1px' }}>🤖 AGILEX RANGER CONTROLLER</h2>
      <div className="status-bar">
        
        {/* CONNECTION STATUS */}
        <div className="status-item">
          <span style={{ fontSize: '11px', marginRight: '8px', color: '#999' }}>
            {debugMsg}
          </span>
          <div className="indicator" style={{ background: isConnected ? '#10b981' : '#ef4444' }}></div>
          {isConnected ? 'ONLINE' : 'OFFLINE'}
        </div>
        
        {/* BATTERY SOC */}
        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>BATTERY:</span>
          <span style={{ color: battery < 20 ? '#ef4444' : '#10b981' }}>
            {battery}%
          </span>
        </div>

        {/* BATTERY SOH */}
        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>SOH:</span>
          <span style={{ color: batterySOH < 80 ? '#f59e0b' : '#10b981' }}>
            {batterySOH}%
          </span>
        </div>

        {/* VOLTAGE */}
        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>VOLTAGE:</span>
          <span style={{ color: '#3b82f6' }}>{batteryVoltage.toFixed(1)}V</span>
        </div>

        {/* CURRENT */}
        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>CURRENT:</span>
          <span style={{ color: '#3b82f6' }}>{batteryCurrent.toFixed(1)}A</span>
        </div>

        {/* TEMPERATURE */}
        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>TEMP:</span>
          <span style={{ color: batteryTemperature > 50 ? '#ef4444' : '#10b981' }}>
            {batteryTemperature.toFixed(1)}°C
          </span>
        </div>

        {/* STATUS PLACEHOLDER */}
        <div className="status-item">
          <span style={{ color: '#8b9bb4' }}>STATUS:</span>
        </div>

      </div>
    </header>
  );
}