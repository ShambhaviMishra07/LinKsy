// client/src/components/SOSCamera.jsx — full updated version

import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { colors as c } from '../theme';

export default function SOSCamera({ alertId, onStop }) {
  const { socket } = useSocket();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]); // store all chunks locally too
  const [recording, setRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [chunksSent, setChunksSent] = useState(0);
  const [error, setError] = useState('');
  const [recordedUrl, setRecordedUrl] = useState(null); // local playback URL

  useEffect(() => {
    startCamera('user');
    return () => stopEverything();
  }, []);

  const startCamera = async (facing) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      startRecording(stream);
      setRecording(true);
      setError('');
    } catch (err) {
      setError('Camera permission denied. Please allow camera access and try again.');
    }
  };

  const startRecording = (stream) => {
    chunksRef.current = [];
    setRecordedUrl(null);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0) {
        // Store locally
        chunksRef.current.push(event.data);

        // Send to trusted contacts via socket
        if (socket && alertId) {
          const buffer = await event.data.arrayBuffer();
          socket.emit('sos_video_chunk', {
            alertId,
            chunk: buffer,
            timestamp: new Date(),
            mimeType
          });
          setChunksSent(prev => prev + 1);
        }
      }
    };

    // Fire ondataavailable every 5 seconds
    recorder.start(5000);
    recorderRef.current = recorder;
  };

  const stopEverything = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      // Request final chunk before stopping
      recorderRef.current.requestData();
      recorderRef.current.stop();

      // After stopping, create a local playback URL from all collected chunks
      recorderRef.current.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedUrl(url);
          setRecording(false);
        }
      };
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const handleStop = () => {
    stopEverything();
    // Don't call onStop immediately — wait for onstop to fire and show the recording
  };

  const handleDiscard = () => {
    setRecordedUrl(null);
    chunksRef.current = [];
    if (onStop) onStop();
  };

  const handleDownload = () => {
    if (!recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `linksy-sos-${Date.now()}.webm`;
    a.click();
  };

  const switchCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (recorderRef.current) recorderRef.current.stop();
    await startCamera(newFacing);
  };

  // Show recorded video playback after stopping
  if (recordedUrl) {
    return (
      <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden' }}>
        <video
          src={recordedUrl}
          controls
          style={{ width: '100%', display: 'block' }}
        />
        <div style={{ display: 'flex', gap: 10, padding: 12 }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: c.pink, color: '#fff', fontSize: 13,
              fontWeight: 500, cursor: 'pointer'
            }}
          >
            💾 Save video
          </button>
          <button
            onClick={handleDiscard}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: `1px solid ${c.border}`, background: 'transparent',
              color: c.textPrimary, fontSize: 13, cursor: 'pointer'
            }}
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

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
            muted
            playsInline
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
          />

          {recording && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: '4px 10px'
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: c.danger,
                animation: 'pulse 1s infinite'
              }} />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>
                REC · {chunksSent} chunk{chunksSent !== 1 ? 's' : ''} sent
              </span>
            </div>
          )}

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
              onClick={handleStop}
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