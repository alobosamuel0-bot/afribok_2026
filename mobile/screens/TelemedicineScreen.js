import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import RTCView from 'react-native-webrtc/RTCView';
import { RTCPeerConnection, RTCSessionDescription, MediaStream } from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import telemedicineService from '../services/telemedicine';

export default function TelemedicineScreen({ route, navigation }) {
  const [callState, setCallState] = useState('idle'); // idle, ringing, connected, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [consultationNote, setConsultationNote] = useState('');

  const peerConnectionRef = useRef(null);
  const callIdRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (callState === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => clearInterval(durationIntervalRef.current);
  }, [callState]);

  const initializeCall = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      // Get media stream
      const stream = await getMediaStream();
      setLocalStream(stream);

      // Initialize peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ],
      });

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.stream);
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setCallState('connected');
        } else if (peerConnection.connectionState === 'disconnected') {
          setCallState('ended');
        }
      };

      peerConnectionRef.current = peerConnection;
      setCallState('ringing');
    } catch (error) {
      console.error('Failed to initialize call:', error);
      setCallState('ended');
    } finally {
      setLoading(false);
    }
  };

  const getMediaStream = async () => {
    const stream = await MediaStream.getDisplayMedia({
      audio: true,
      video: { frameRate: 30, width: 640, height: 480 },
    });
    return stream;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const endCall = async () => {
    try {
      if (callIdRef.current) {
        await telemedicineService.endCall(callIdRef.current);
      }
      cleanupCall();
      setShowNoteModal(true);
    } catch (error) {
      console.error('Failed to end call:', error);
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallState('idle');
    setCallDuration(0);
    setRemoteStream(null);
  };

  const saveConsultationNote = async () => {
    try {
      if (callIdRef.current && consultationNote) {
        await telemedicineService.createConsultationNote(callIdRef.current, {
          note: consultationNote,
          timestamp: new Date().toISOString(),
        });
      }
      setShowNoteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save consultation note:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle' || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing call...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      )}

      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror
        />
      )}

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.callStatus}>
            {callState === 'connected' ? 'Call in progress' : 'Connecting...'}
          </Text>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
            onPress={toggleVideo}
          >
            <Text style={styles.controlIcon}>{isVideoOn ? '📹' : '📷'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
          >
            <Text style={styles.controlIcon}>☎️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Consultation Note Modal */}
      <Modal visible={showNoteModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Consultation Notes</Text>
            <ScrollView style={styles.noteInput}>
              <Text style={styles.label}>Consultation Summary</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter consultation notes..."
                value={consultationNote}
                onChangeText={setConsultationNote}
                multiline
                placeholderTextColor="#999"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => {
                  setShowNoteModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveBtn]}
                onPress={saveConsultationNote}
              >
                <Text style={styles.modalButtonText}>Save & Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  localVideo: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
  },
  callStatus: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  duration: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#FF3B30',
  },
  controlIcon: {
    fontSize: 28,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
  loadingText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  noteInput: {
    flex: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  textArea: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#E5E5EA',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
