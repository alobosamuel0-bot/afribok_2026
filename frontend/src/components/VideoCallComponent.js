/**
 * Video Call Component for Telemedicine
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';

export default function VideoCallComponent({ 
  isOpen, 
  onClose, 
  remoteUserId, 
  remoteUserName,
  onCallStart,
  onCallEnd 
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC Configuration
  const ICE_SERVERS = [
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] }
  ];

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const initializeCall = async () => {
    setIsConnecting(true);
    try {
      // Request user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to remote peer (via signaling server)
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          onCallStart && onCallStart();
        }
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      setIsConnecting(false);
    } catch (err) {
      setError(err.message || 'Failed to initialize call');
      setIsConnecting(false);
    }
  };

  const handleToggleMic = async () => {
    if (peerConnectionRef.current) {
      const senders = await peerConnectionRef.current.getSenders();
      senders.forEach(sender => {
        if (sender.track?.kind === 'audio') {
          sender.track.enabled = !sender.track.enabled;
        }
      });
      setIsMicOn(!isMicOn);
    }
  };

  const handleToggleVideo = async () => {
    if (peerConnectionRef.current) {
      const senders = await peerConnectionRef.current.getSenders();
      senders.forEach(sender => {
        if (sender.track?.kind === 'video') {
          sender.track.enabled = !sender.track.enabled;
        }
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleEndCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    onCallEnd && onCallEnd();
    onClose();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <Box sx={{ position: 'relative', backgroundColor: '#000', aspectRatio: '16/9' }}>
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000'
          }}
        />

        {/* Local Video (small, bottom-right) */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 150,
            height: 150,
            overflow: 'hidden',
            borderRadius: 1
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Paper>

        {/* Call Info */}
        <Box sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: '#fff'
        }}>
          <Typography variant="h6">{remoteUserName || 'Remote User'}</Typography>
          <Typography variant="body2">{formatDuration(callDuration)}</Typography>
        </Box>

        {/* Controls */}
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: 1,
          borderRadius: 2
        }}>
          <Tooltip title={isMicOn ? 'Mute' : 'Unmute'}>
            <IconButton
              onClick={handleToggleMic}
              sx={{ color: isMicOn ? '#fff' : '#f44336' }}
            >
              {isMicOn ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isVideoOn ? 'Stop Video' : 'Start Video'}>
            <IconButton
              onClick={handleToggleVideo}
              sx={{ color: isVideoOn ? '#fff' : '#f44336' }}
            >
              {isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="End Call">
            <IconButton
              onClick={handleEndCall}
              sx={{ color: '#f44336' }}
            >
              <CallEndIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Loading State */}
        {isConnecting && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: '#fff'
          }}>
            <CircularProgress sx={{ mb: 2, color: '#fff' }} />
            <Typography>Connecting...</Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%'
          }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
