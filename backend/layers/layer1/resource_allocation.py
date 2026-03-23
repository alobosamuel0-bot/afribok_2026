"""
Layer 1: Resource Allocation Module
Doctor assignment and bed allocation with load balancing
"""

from typing import List, Dict, Optional
import random


class ResourceAllocator:
    """Manage doctor and bed allocation"""

    def __init__(self, hospital_id: int):
        self.hospital_id = hospital_id

    def assign_doctor(self, department_id: int) -> Optional[int]:
        """
        Assign doctor with least current patients (load balancing)
        In production, query database for doctors in department
        """
        try:
            print(f"[RESOURCE] Assigning doctor for department {department_id}")
            # Mock: return random doctor ID
            doctor_id = random.randint(1, 100)
            print(f"[RESOURCE] Assigned doctor {doctor_id}")
            return doctor_id
        except Exception as e:
            print(f"Doctor assignment failed: {e}")
            return None

    def get_doctor_load(self, doctor_id: int) -> Optional[Dict]:
        """Get doctor workload information"""
        try:
            print(f"[RESOURCE] Getting workload for doctor {doctor_id}")
            return {
                "doctor_id": doctor_id,
                "name": "Dr. Smith",
                "specialization": "Internal Medicine",
                "current_patients": random.randint(5, 15),
                "max_daily_patients": 20,
                "availability_percentage": random.randint(40, 80)
            }
        except Exception as e:
            print(f"Failed to get doctor load: {e}")
            return None

    def allocate_bed(self, department_id: int) -> Optional[Dict]:
        """
        Allocate first available bed in department
        In production, query database for available beds
        """
        try:
            print(f"[RESOURCE] Allocating bed for department {department_id}")
            return {
                "bed_id": random.randint(1, 1000),
                "bed_number": random.randint(1, 100),
                "status": "free",
                "ward": "General",
                "bed_type": "standard"
            }
        except Exception as e:
            print(f"Bed allocation failed: {e}")
            return None

    def release_bed(self, bed_id: int) -> bool:
        """Release bed when patient is discharged"""
        try:
            print(f"[RESOURCE] Releasing bed {bed_id}")
            # In production, update database
            return True
        except Exception as e:
            print(f"Bed release failed: {e}")
            return False

    def mark_bed_for_cleaning(self, bed_id: int) -> bool:
        """Mark bed for cleaning"""
        try:
            print(f"[RESOURCE] Marking bed {bed_id} for cleaning")
            return True
        except Exception as e:
            print(f"Failed to mark bed for cleaning: {e}")
            return False

    def get_available_beds(self, department_id: int) -> List[Dict]:
        """Get available beds in department"""
        try:
            print(f"[RESOURCE] Getting available beds for department {department_id}")
            return [
                {"bed_id": 1, "bed_number": 101, "status": "free", "ward": "General"},
                {"bed_id": 2, "bed_number": 102, "status": "free", "ward": "General"},
                {"bed_id": 3, "bed_number": 103, "status": "free", "ward": "ICU"},
            ]
        except Exception as e:
            print(f"Failed to get available beds: {e}")
            return []

    def get_bed_occupancy(self) -> Dict:
        """Get bed occupancy statistics"""
        try:
            total = 100
            occupied = random.randint(60, 85)
            available = total - occupied - random.randint(2, 8)
            cleaning = total - occupied - available

            return {
                "total": total,
                "occupied": occupied,
                "available": available,
                "cleaning": cleaning,
                "occupancy_rate": round((occupied / total) * 100, 1)
            }
        except Exception as e:
            print(f"Failed to get bed occupancy: {e}")
            return {
                "total": 0,
                "occupied": 0,
                "available": 0,
                "cleaning": 0,
                "occupancy_rate": 0
            }

    def predict_bed_availability(self, hours: int = 24) -> List[Dict]:
        """Predict when beds will become available"""
        try:
            predictions = []
            for i in range(hours):
                predictions.append({
                    "hour": i,
                    "available_beds": random.randint(5, 20),
                    "expected_discharges": random.randint(2, 8)
                })
            return predictions
        except Exception as e:
            print(f"Failed to predict bed availability: {e}")
            return []

    def get_doctors_by_department(self, department_id: int) -> List[Dict]:
        """Get doctors by department"""
        try:
            print(f"[RESOURCE] Getting doctors for department {department_id}")
            return [
                {
                    "doctor_id": 1,
                    "name": "Dr. Smith",
                    "specialization": "Internal Medicine",
                    "current_patients": 12,
                    "max_daily_patients": 20,
                    "availability_percentage": 60
                },
                {
                    "doctor_id": 2,
                    "name": "Dr. Johnson",
                    "specialization": "Internal Medicine",
                    "current_patients": 8,
                    "max_daily_patients": 20,
                    "availability_percentage": 40
                }
            ]
        except Exception as e:
            print(f"Failed to get doctors: {e}")
            return []


def get_allocator(hospital_id: int) -> ResourceAllocator:
    """Factory function to get resource allocator instance"""
    return ResourceAllocator(hospital_id)
