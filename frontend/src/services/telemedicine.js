/**
 * Telemedicine Service - Video call management
 */

import { apiService } from './api';

class TelemedicineService {
  /**
   * Initiate a video call
   */
  async initiateCall(patientId, doctorId) {
    try {
      const response = await apiService.post('/telemedicine/call', {
        patient_id: patientId,
        doctor_id: doctorId,
        status: 'initiated'
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(callId) {
    try {
      const response = await apiService.put(`/telemedicine/call/${callId}`, {
        status: 'accepted'
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject/decline a call
   */
  async declineCall(callId, reason = 'Declined by user') {
    try {
      const response = await apiService.put(`/telemedicine/call/${callId}/decline`, {
        reason
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * End an active call
   */
  async endCall(callId) {
    try {
      const response = await apiService.put(`/telemedicine/call/${callId}`, {
        status: 'ended',
        end_time: new Date().toISOString()
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get call history for a patient
   */
  async getCallHistory(patientId, limit = 20) {
    try {
      const response = await apiService.get(
        `/telemedicine/patient/${patientId}/call-history?limit=${limit}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending calls for a user
   */
  async getPendingCalls(userId) {
    try {
      const response = await apiService.get(`/telemedicine/user/${userId}/pending-calls`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send WebRTC offer
   */
  async sendOffer(callId, offer) {
    try {
      const response = await apiService.post(`/telemedicine/call/${callId}/offer`, {
        offer: offer
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send WebRTC answer
   */
  async sendAnswer(callId, answer) {
    try {
      const response = await apiService.post(`/telemedicine/call/${callId}/answer`, {
        answer: answer
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(callId, candidate) {
    try {
      const response = await apiService.post(`/telemedicine/call/${callId}/ice-candidate`, {
        candidate: candidate
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record call (if enabled)
   */
  async recordCall(callId, shouldRecord) {
    try {
      const response = await apiService.put(`/telemedicine/call/${callId}/recording`, {
        record: shouldRecord
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get call recordings
   */
  async getCallRecordings(patientId) {
    try {
      const response = await apiService.get(
        `/telemedicine/patient/${patientId}/recordings`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create consultation note
   */
  async createConsultationNote(callId, noteData) {
    try {
      const response = await apiService.post(
        `/telemedicine/call/${callId}/consultation-note`,
        noteData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get call quality metrics
   */
  async getCallMetrics(callId) {
    try {
      const response = await apiService.get(
        `/telemedicine/call/${callId}/metrics`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const telemedicineService = new TelemedicineService();
