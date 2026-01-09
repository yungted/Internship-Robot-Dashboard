// /* src/components/lidar_imaging.tsx */
// import { useEffect, useRef } from 'react';
// import * as ROSLIB from 'roslib';

// // @ts-ignore
// const ROS3D = window.ROS3D;

// interface LidarViewerProps {
//   ros: ROSLIB.Ros | null;
//   topic?: string;
// }

// export default function LidarViewer({ ros, topic = '/voxel/points' }: LidarViewerProps) {
//   const viewerDiv = useRef<HTMLDivElement>(null);
//   const viewerRef = useRef<any>(null);
//   const clientsRef = useRef<any>(null);

//   // 1. SETUP VIEWER (Run once)
//   useEffect(() => {
//     if (!viewerDiv.current || !ROS3D) return;

//     const viewer = new ROS3D.Viewer({
//       divID: viewerDiv.current.id,
//       width: 600,
//       height: 400,
//       antialias: true,
//       background: '#111111',
//       cameraPose: { x: 8, y: 8, z: 5 }, // Zoom out a bit more
//     });

//     viewer.addObject(new ROS3D.Grid({
//       color: '#333333',
//       cellSize: 1.0,
//       num_cells: 20
//     }));

//     viewerRef.current = viewer;

//     return () => {
//       if (viewerDiv.current) viewerDiv.current.innerHTML = '';
//     };
//   }, []);

//   // 2. MANAGE CONNECTION
//   useEffect(() => {
//     const viewer = viewerRef.current;
//     if (!viewer) return;

//     // Clean up previous clients
//     if (clientsRef.current) {
//       if (clientsRef.current.cloudClient) {
//           viewer.scene.remove(clientsRef.current.cloudClient.points);
//           clientsRef.current.cloudClient.unsubscribe();
//       }
//       clientsRef.current = null;
//     }

//     if (!ros) return;

//     try {
//       // ✅ UPDATE: Use the 'velodyne' frame from your JSON log
//       const tfClient = new ROSLIB.TFClient({
//         ros: ros,
//         angularThres: 0.01,
//         transThres: 0.01,
//         rate: 10.0,
//         fixedFrame: 'velodyne' 
//       });

//       const cloudClient = new ROS3D.PointCloud2({
//         ros: ros,
//         tfClient: tfClient,
//         rootObject: viewer.scene,
//         topic: topic,
//         max_pts: 200000,
//         material: { size: 0.05, color: 0x00ff00 } // Green points
//       });

//       clientsRef.current = { tfClient, cloudClient };
//       console.log(`[LIDAR] Listening to ${topic} in frame 'velodyne'`);

//     } catch (err) {
//       console.error("Failed to init ROS3D clients", err);
//     }

//   }, [ros, topic]);

//   return (
//     <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
//       <div id="lidar-viewer" ref={viewerDiv} style={{ width: '100%', height: '100%' }} />
//       {!ros && (
//         <div style={{
//           position: 'absolute', top: 10, right: 10,
//           background: 'rgba(255,0,0,0.3)', color: 'white', 
//           padding: '4px 8px', borderRadius: '4px', fontSize: '10px'
//         }}>
//           OFFLINE
//         </div>
//       )}
//     </div>
//   );
// }