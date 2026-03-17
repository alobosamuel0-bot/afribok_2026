"""
ML Prediction Engine
Prophet + XGBoost ensemble for patient volume forecasting
"""

from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from db.models import Patient
from db.connection import DatabaseManager


logger = structlog.get_logger(__name__)


class PredictionEngine:
    """Forecast hospital patient volume and bed demand"""

    @staticmethod
    async def get_historical_data(
        db: AsyncSession,
        hospital_id: int,
        days: int = 90
    ) -> pd.DataFrame:
        """
        Get historical patient admission data
        
        Returns DataFrame with columns: date, admission_count, risk_level_distribution
        """

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Query admissions by date
        query = select(
            func.date(Patient.admission_time).label("admission_date"),
            func.count(Patient.patient_id).label("admission_count")
        ).where(
            (Patient.hospital_id == hospital_id) &
            (Patient.admission_time >= start_date) &
            (Patient.admission_time <= end_date)
        ).group_by(
            func.date(Patient.admission_time)
        ).order_by(
            "admission_date"
        )

        result = await db.execute(query)
        data = result.all()

        df = pd.DataFrame(data, columns=["date", "admission_count"])
        df["date"] = pd.to_datetime(df["date"])

        # Fill missing dates with 0
        date_range = pd.date_range(
            start=start_date.date(),
            end=end_date.date(),
            freq="D"
        )
        df = df.set_index("date").reindex(
            date_range,
            fill_value=0
        ).reset_index().rename(columns={"index": "date"})

        return df

    @staticmethod
    def forecast_admissions(
        df: pd.DataFrame,
        forecast_days: int = 14
    ) -> Dict[str, List]:
        """
        Forecast patient admissions using Prophet + XGBoost ensemble
        
        Returns:
        {
            "date": [...],
            "forecast": [...],
            "lower_bound": [...],
            "upper_bound": [...]
        }
        """

        try:
            from prophet import Prophet
            from xgboost import XGBRegressor
            from sklearn.metrics import mean_absolute_error

            # Prepare data for Prophet
            prophet_df = df.copy()
            prophet_df.columns = ["ds", "y"]
            prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])

            # Prophet model
            logger.info("prediction.prophet_training", rows=len(prophet_df))
            
            model_prophet = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=True,
                interval_width=0.95
            )
            model_prophet.fit(prophet_df)

            future_prophet = model_prophet.make_future_dataframe(periods=forecast_days)
            forecast_prophet = model_prophet.predict(future_prophet)

            # Prepare XGBoost features
            df_xgb = df.copy()
            df_xgb["day_of_year"] = pd.to_datetime(df_xgb["date"]).dt.dayofyear
            df_xgb["week_of_year"] = pd.to_datetime(df_xgb["date"]).dt.isocalendar().week
            df_xgb["day_of_week"] = pd.to_datetime(df_xgb["date"]).dt.dayofweek

            X = df_xgb[["day_of_year", "week_of_year", "day_of_week"]]
            y = df_xgb["admission_count"]

            logger.info("prediction.xgboost_training", rows=len(X))

            model_xgb = XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            model_xgb.fit(X, y, verbose=False)

            # Forecast future dates
            future_dates = pd.date_range(
                start=df["date"].max() + timedelta(days=1),
                periods=forecast_days,
                freq="D"
            )
            
            future_xgb = pd.DataFrame({
                "date": future_dates,
                "day_of_year": future_dates.dayofyear,
                "week_of_year": future_dates.isocalendar().week,
                "day_of_week": future_dates.dayofweek
            })

            forecast_xgb = model_xgb.predict(
                future_xgb[["day_of_year", "week_of_year", "day_of_week"]]
            )

            # Ensemble: 60% Prophet, 40% XGBoost
            prophet_future = forecast_prophet[forecast_prophet["ds"] > df["date"].max()]
            
            ensemble_forecast = (
                prophet_future["yhat"].values * 0.6 +
                np.maximum(forecast_xgb, 0) * 0.4  # Ensure non-negative
            )

            # Add bounds
            prophet_lower = prophet_future["yhat_lower"].values
            prophet_upper = prophet_future["yhat_upper"].values
            
            lower_bound = prophet_lower * 0.6 + np.percentile(forecast_xgb, 25) * 0.4
            upper_bound = prophet_upper * 0.6 + np.percentile(forecast_xgb, 75) * 0.4

            result = {
                "date": prophet_future["ds"].dt.strftime("%Y-%m-%d").tolist(),
                "forecast": np.round(ensemble_forecast).astype(int).tolist(),
                "lower_bound": np.round(lower_bound).astype(int).tolist(),
                "upper_bound": np.round(upper_bound).astype(int).tolist(),
                "model_weights": {"prophet": 0.6, "xgboost": 0.4}
            }

            logger.info(
                "prediction.forecast_complete",
                forecast_days=forecast_days,
                avg_forecast=float(np.mean(ensemble_forecast))
            )

            return result

        except Exception as e:
            logger.error("prediction.forecast_error", error=str(e), exc_info=True)
            raise

    @staticmethod
    def predict_bed_demand(
        forecast_admissions: List[int],
        avg_stay_hours: float = 24.0
    ) -> Dict[str, any]:
        """
        Convert admission forecasts to bed demand
        
        Formula: bed_demand = forecast_admissions * (avg_stay_hours / 24)
        """

        bed_multiplier = avg_stay_hours / 24.0
        bed_demand = [int(admission * bed_multiplier) for admission in forecast_admissions]

        return {
            "bed_demand": bed_demand,
            "peak_bed_demand": max(bed_demand),
            "average_bed_demand": int(np.mean(bed_demand)),
            "avg_stay_hours": avg_stay_hours
        }

    @staticmethod
    async def predict_hospital_capacity(
        db: AsyncSession,
        hospital_id: int,
        total_beds: int,
        forecast_days: int = 14
    ) -> Dict[str, any]:
        """
        Complete capacity prediction workflow
        """

        try:
            # Get historical data
            historical_data = await PredictionEngine.get_historical_data(
                db,
                hospital_id,
                days=90
            )

            if len(historical_data) < 30:
                logger.warning(
                    "prediction.insufficient_data",
                    hospital_id=hospital_id,
                    data_points=len(historical_data)
                )
                # Return baseline forecast
                return {
                    "status": "insufficient_data",
                    "message": "Need 30+ days of historical data",
                    "baseline_forecast": [total_beds * 0.7] * forecast_days
                }

            # Forecast admissions
            admission_forecast = PredictionEngine.forecast_admissions(
                historical_data,
                forecast_days=forecast_days
            )

            # Predict bed demand
            admission_counts = admission_forecast["forecast"]
            bed_forecast = PredictionEngine.predict_bed_demand(
                admission_counts,
                avg_stay_hours=24.0
            )

            # Check capacity warnings
            capacity_warnings = []
            if bed_forecast["peak_bed_demand"] > total_beds * 0.85:
                capacity_warnings.append({
                    "level": "warning",
                    "message": f"Peak bed demand ({bed_forecast['peak_bed_demand']}) exceeds 85% capacity"
                })

            if bed_forecast["peak_bed_demand"] > total_beds * 0.95:
                capacity_warnings.append({
                    "level": "critical",
                    "message": f"Peak bed demand ({bed_forecast['peak_bed_demand']}) exceeds 95% capacity"
                })

            result = {
                "hospital_id": hospital_id,
                "total_beds": total_beds,
                "forecast_days": forecast_days,
                "admissions": admission_forecast,
                "bed_demand": bed_forecast,
                "capacity_warnings": capacity_warnings,
                "generated_at": datetime.utcnow().isoformat(),
                "confidence": "high" if len(historical_data) >= 60 else "medium"
            }

            logger.info(
                "prediction.capacity_forecast_complete",
                hospital_id=hospital_id,
                peak_bed_demand=bed_forecast["peak_bed_demand"]
            )

            return result

        except Exception as e:
            logger.error(
                "prediction.capacity_forecast_error",
                hospital_id=hospital_id,
                error=str(e),
                exc_info=True
            )
            raise
