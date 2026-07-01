// client/src/components/SOSCamera.jsx

import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { colors as c } from '../theme';

export default function SOSCamera({ alertId, onStop }) {
  const { socket } = useSocket();
  const videoRef = useRef(null);       // shows live preview to the sender
  const streamRef = useRef(null);      // holds the MediaStream object
  const recorderRef = useRef(null);    // holds the MediaRecorder
  const [recording, setRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user'=front, 'environment'=back
  const [error, setError] = useState('');
  const [chunksSent, setChunksSent] = useState(0);


  const startCamera = async (facing = 'user') => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      // getUserMedia requests permission to access camera + microphone
      // The browser shows a native permission dialog the first time
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true
      });

      streamRef.current = stream;

      // Show live preview in the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      startRecording(stream);
      setChunksSent(0);
      setRecording(true);
      setError('');

    } catch (err) {
      setError('Camera permission denied. Please allow camera access.');
      console.error('Camera error:', err);
    }
  };

  const startRecording = (stream) => {
    // MediaRecorder captures the stream and fires ondataavailable
    // with a chunk every 5 seconds — we immediately send each chunk to contacts
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm' // fallback for older browsers
    });

   recorder.ondataavailable = async (event) => {
  if (event.data && event.data.size > 0 && socket && alertId) {
    // Convert blob to ArrayBuffer so it can travel over the socket
    const buffer = await event.data.arrayBuffer();

    socket.emit('sos_video_chunk', {
      alertId,
      chunk: buffer,
      timestamp: new Date()
    });

    setChunksSent(prev => prev + 1);
  }
};

    // timeslice: 5000 = fire ondataavailable every 5 seconds
    recorder.start(5000);
    recorderRef.current = recorder;
  };

  const stopCamera = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
    if (onStop) onStop();
  };

  const switchCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);

    // Stop current recorder cleanly before switching
    if (recorderRef.current) {
      recorderRef.current.stop();
    }

    await startCamera(newFacing);
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, []);

  return (
    <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      {error ? (
        <div style={{ padding: 24, color: c.danger, textAlign: 'center', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted     // muted for the sender's preview — audio still records
            playsInline
            style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
          />

          {/* Recording indicator */}
          {recording && (
  <div
    style={{
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(0,0,0,0.6)',
      borderRadius: 8,
      padding: '4px 10px'
    }}
  >
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: c.danger
      }}
    />
    <span
      style={{
        color: '#fff',
        fontSize: 12,
        fontWeight: 500
      }}
    >
      LIVE · {chunksSent} chunk{chunksSent !== 1 ? 's' : ''} sent
    </span>
  </div>
)}

          {/* Controls */}
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-around', alignItems: 'center'
          }}>
            <button
              onClick={switchCamera}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: '#fff', fontSize: 20, cursor: 'pointer'
              }}
            >
              🔄
            </button>
            <button
              onClick={stopCamera}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: c.danger, border: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
}