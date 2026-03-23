"""
Layer 3: Multi-channel Notifications Module
Send alerts via Email, SMS, WhatsApp, and In-app
"""

from typing import List, Dict, Optional
from enum import Enum
import os


class NotificationChannel(Enum):
    """Notification channel types"""
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    IN_APP = "in_app"


class NotificationStatus(Enum):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class NotificationManager:
    """Manage multi-channel notifications"""

    def __init__(self):
        self.twilio_sid = os.getenv("TWILIO_SID")
        self.twilio_auth = os.getenv("TWILIO_AUTH")
        self.smtp_config = {
            "host": os.getenv("SMTP_HOST"),
            "port": os.getenv("SMTP_PORT"),
            "user": os.getenv("SMTP_USER"),
            "password": os.getenv("SMTP_PASS")
        }

    def send_email(self, to: str, subject: str, message: str) -> bool:
        """Send email notification"""
        try:
            print(f"[EMAIL] To: {to}, Subject: {subject}")
            print(f"[EMAIL] Message: {message}")
            # In production, integrate with SMTP or SendGrid
            return True
        except Exception as e:
            print(f"Email notification failed: {e}")
            return False

    def send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio"""
        try:
            if not self.twilio_sid or not self.twilio_auth:
                print("Twilio credentials not configured")
                return False

            print(f"[SMS] To: {phone_number}, Message: {message}")
            # In production, integrate with Twilio API
            return True
        except Exception as e:
            print(f"SMS notification failed: {e}")
            return False

    def send_whatsapp(self, phone_number: str, message: str) -> bool:
        """Send WhatsApp via Twilio"""
        try:
            if not self.twilio_sid or not self.twilio_auth:
                print("Twilio credentials not configured")
                return False

            print(f"[WHATSAPP] To: {phone_number}, Message: {message}")
            # In production, integrate with Twilio WhatsApp API
            return True
        except Exception as e:
            print(f"WhatsApp notification failed: {e}")
            return False

    def send_in_app(self, user_id: int, subject: str, message: str) -> bool:
        """Send in-app notification"""
        try:
            print(f"[IN-APP] User: {user_id}, Subject: {subject}, Message: {message}")
            # In production, store in database and push via WebSocket
            return True
        except Exception as e:
            print(f"In-app notification failed: {e}")
            return False

    def send_capacity_alert(
        self,
        hospital_id: int,
        current_capacity: int,
        max_capacity: int,
        channels: List[str] = None
    ) -> Dict[str, bool]:
        """Send capacity alert via multiple channels"""
        if channels is None:
            channels = ["email", "in_app"]

        capacity_percentage = (current_capacity / max_capacity) * 100
        severity = "CRITICAL" if capacity_percentage >= 90 else "HIGH" if capacity_percentage >= 75 else "MEDIUM"

        message = f"Hospital capacity alert: {capacity_percentage:.1f}% occupied ({current_capacity}/{max_capacity} beds). Severity: {severity}"

        results = {}
        for channel in channels:
            if channel == "email":
                results["email"] = self.send_email(
                    "admin@hospital.com",
                    "Hospital Capacity Alert",
                    message
                )
            elif channel == "sms":
                results["sms"] = self.send_sms("+1234567890", message)
            elif channel == "whatsapp":
                results["whatsapp"] = self.send_whatsapp("+1234567890", message)
            elif channel == "in_app":
                results["in_app"] = self.send_in_app(1, "Capacity Alert", message)

        return results

    def send_high_risk_alert(
        self,
        hospital_id: int,
        patient_name: str,
        risk_level: str,
        channels: List[str] = None
    ) -> Dict[str, bool]:
        """Send high-risk patient alert"""
        if channels is None:
            channels = ["email", "in_app"]

        message = f"High-risk patient admitted: {patient_name} (Risk Level: {risk_level}). Immediate attention required."

        results = {}
        for channel in channels:
            if channel == "email":
                results["email"] = self.send_email(
                    "admin@hospital.com",
                    "High-Risk Patient Alert",
                    message
                )
            elif channel == "in_app":
                results["in_app"] = self.send_in_app(1, "High-Risk Alert", message)

        return results

    def send_disease_surge_alert(
        self,
        hospital_id: int,
        disease_name: str,
        predicted_cases: int,
        channels: List[str] = None
    ) -> Dict[str, bool]:
        """Send disease surge alert"""
        if channels is None:
            channels = ["email", "in_app"]

        message = f"Disease surge warning: {disease_name}. Predicted cases: {predicted_cases}. Prepare resources accordingly."

        results = {}
        for channel in channels:
            if channel == "email":
                results["email"] = self.send_email(
                    "admin@hospital.com",
                    "Disease Surge Alert",
                    message
                )
            elif channel == "in_app":
                results["in_app"] = self.send_in_app(1, "Disease Surge Alert", message)

        return results

    def send_doctor_assignment(self, doctor_id: int, patient_name: str, department: str) -> bool:
        """Notify doctor of patient assignment"""
        message = f"New patient assignment: {patient_name} in {department}"
        return self.send_in_app(doctor_id, "Patient Assignment", message)

    def send_discharge_reminder(self, patient_id: int, patient_name: str, discharge_time: str) -> bool:
        """Send discharge reminder"""
        message = f"Discharge reminder: Patient {patient_name} expected discharge at {discharge_time}"
        return self.send_in_app(patient_id, "Discharge Reminder", message)


def get_notification_manager() -> NotificationManager:
    """Factory function to get notification manager instance"""
    return NotificationManager()
