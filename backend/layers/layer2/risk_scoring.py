"""
Layer 2: Risk Scoring Module
Advanced patient risk calculation with multiple factors
"""

from typing import List, Dict, Optional
from enum import Enum


class RiskLevel(Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskFactor:
    """Represents a single risk factor"""

    def __init__(self, name: str, weight: float, value: float):
        self.name = name
        self.weight = weight
        self.value = value

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "weight": self.weight,
            "value": self.value
        }


class PatientRiskScorer:
    """Calculate comprehensive patient risk scores"""

    def __init__(self):
        self.age_thresholds = {
            "very_high": 75,
            "high": 65,
            "medium": 50,
            "low": 5
        }

    def calculate_risk(
        self,
        patient_id: int,
        age: int,
        disease_id: int,
        chronic_conditions: List[str] = None,
        environmental_factors: List[str] = None
    ) -> Dict:
        """
        Calculate comprehensive risk score for a patient
        Factors: age, chronic conditions, disease severity, environmental factors
        """
        if chronic_conditions is None:
            chronic_conditions = []
        if environmental_factors is None:
            environmental_factors = []

        factors = []
        score = 0

        # Age factor (highest weight)
        age_factor = self._calculate_age_factor(age)
        factors.append(age_factor)
        score += age_factor.value

        # Chronic conditions factor
        chronic_factor = self._calculate_chronic_factor(chronic_conditions)
        if chronic_factor:
            factors.append(chronic_factor)
            score += chronic_factor.value

        # Disease severity factor
        disease_factor = self._calculate_disease_factor(disease_id)
        if disease_factor:
            factors.append(disease_factor)
            score += disease_factor.value

        # Environmental factors
        env_factor = self._calculate_environmental_factor(environmental_factors)
        if env_factor:
            factors.append(env_factor)
            score += env_factor.value

        # Determine risk level
        risk_level = self._determine_risk_level(score)

        return {
            "patient_id": patient_id,
            "risk_level": risk_level.value,
            "score": round(score, 1),
            "factors": [f.to_dict() for f in factors],
            "timestamp": str(datetime.now())
        }

    def _calculate_age_factor(self, age: int) -> RiskFactor:
        """Calculate age-based risk"""
        if age > self.age_thresholds["very_high"]:
            return RiskFactor("Age > 75", 0.3, 4)
        elif age > self.age_thresholds["high"]:
            return RiskFactor("Age 65-75", 0.25, 3)
        elif age < self.age_thresholds["low"]:
            return RiskFactor("Age < 5", 0.25, 2)
        elif age > self.age_thresholds["medium"]:
            return RiskFactor("Age 50-65", 0.15, 1)
        else:
            return RiskFactor("Age 5-50", 0.1, 0)

    def _calculate_chronic_factor(self, conditions: List[str]) -> Optional[RiskFactor]:
        """Calculate chronic condition risk"""
        if not conditions:
            return None

        condition_count = len(conditions)
        value = min(condition_count * 1.5, 5)

        return RiskFactor(
            f"Chronic Conditions ({condition_count})",
            0.25,
            value
        )

    def _calculate_disease_factor(self, disease_id: int) -> Optional[RiskFactor]:
        """Calculate disease severity risk"""
        if not disease_id:
            return None

        # Simplified: assume moderate severity
        return RiskFactor("Disease Severity", 0.2, 2)

    def _calculate_environmental_factor(self, factors: List[str]) -> Optional[RiskFactor]:
        """Calculate environmental risk"""
        if not factors:
            return None

        env_score = min(len(factors) * 0.5, 2)
        return RiskFactor(
            f"Environmental Factors ({len(factors)})",
            0.1,
            env_score
        )

    def _determine_risk_level(self, score: float) -> RiskLevel:
        """Determine risk level from score"""
        if score >= 8:
            return RiskLevel.HIGH
        elif score >= 4:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def prioritize_patients(self, patients: List[Dict]) -> List[Dict]:
        """Sort patients by risk level"""
        risk_order = {RiskLevel.HIGH.value: 0, RiskLevel.MEDIUM.value: 1, RiskLevel.LOW.value: 2}

        return sorted(
            patients,
            key=lambda p: (risk_order.get(p["risk_level"], 3), -p["score"])
        )

    def get_risk_color(self, risk_level: str) -> str:
        """Get UI color for risk level"""
        colors = {
            "low": "#10b981",
            "medium": "#f59e0b",
            "high": "#ef4444"
        }
        return colors.get(risk_level, "#6b7280")

    def batch_calculate_risks(self, patients: List[Dict]) -> List[Dict]:
        """Calculate risks for multiple patients"""
        results = []
        for patient in patients:
            risk = self.calculate_risk(
                patient["patient_id"],
                patient["age"],
                patient.get("disease_id"),
                patient.get("chronic_conditions", []),
                patient.get("environmental_factors", [])
            )
            results.append(risk)
        return results


def get_risk_scorer() -> PatientRiskScorer:
    """Factory function to get risk scorer instance"""
    return PatientRiskScorer()


from datetime import datetime
