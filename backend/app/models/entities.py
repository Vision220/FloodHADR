import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class StudyAreaModel(Base):
    __tablename__ = "study_areas"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    river: Mapped[str] = mapped_column(String(150), nullable=False)
    dam_name: Mapped[str] = mapped_column(String(150), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    dem_resolution: Mapped[str] = mapped_column(String(50), default="12m ALOS")
    area_km2: Mapped[float] = mapped_column(Float, default=1000.0)
    elevation_min: Mapped[float] = mapped_column(Float, default=100.0)
    elevation_max: Mapped[float] = mapped_column(Float, default=2000.0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    dams: Mapped[list["DamModel"]] = relationship("DamModel", back_populates="study_area", cascade="all, delete-orphan")
    rivers: Mapped[list["RiverModel"]] = relationship("RiverModel", back_populates="study_area", cascade="all, delete-orphan")


class DamModel(Base):
    __tablename__ = "dams"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    river: Mapped[str] = mapped_column(String(150), nullable=False)
    study_area_id: Mapped[str] = mapped_column(String(50), ForeignKey("study_areas.id"), nullable=False)
    height_m: Mapped[float] = mapped_column(Float, nullable=False)
    crest_length_m: Mapped[float] = mapped_column(Float, nullable=False)
    reservoir_volume_mm3: Mapped[float] = mapped_column(Float, nullable=False)
    full_reservoir_level_m: Mapped[float] = mapped_column(Float, nullable=False)
    current_water_level_m: Mapped[float] = mapped_column(Float, nullable=False)
    dam_type: Mapped[str] = mapped_column(String(100), default="Embankment")
    construction_year: Mapped[int] = mapped_column(Integer, default=2000)
    spillway_capacity_m3s: Mapped[float] = mapped_column(Float, default=10000.0)

    study_area: Mapped["StudyAreaModel"] = relationship("StudyAreaModel", back_populates="dams")
    scenarios: Mapped[list["DamBreakScenarioModel"]] = relationship("DamBreakScenarioModel", back_populates="dam", cascade="all, delete-orphan")


class RiverModel(Base):
    __tablename__ = "rivers"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    study_area_id: Mapped[str] = mapped_column(String(50), ForeignKey("study_areas.id"), nullable=False)
    length_km: Mapped[float] = mapped_column(Float, default=50.0)
    average_slope: Mapped[str] = mapped_column(String(50), default="0.005 m/m")

    study_area: Mapped["StudyAreaModel"] = relationship("StudyAreaModel", back_populates="rivers")


class DamBreakScenarioModel(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    dam_id: Mapped[str] = mapped_column(String(50), ForeignKey("dams.id"), nullable=False)
    failure_mode: Mapped[str] = mapped_column(String(100), nullable=False)
    breach_width_m: Mapped[float] = mapped_column(Float, nullable=False)
    breach_height_m: Mapped[float] = mapped_column(Float, nullable=False)
    formation_time_hr: Mapped[float] = mapped_column(Float, nullable=False)
    peak_discharge_m3s: Mapped[float] = mapped_column(Float, nullable=False)
    reservoir_water_level_percent: Mapped[float] = mapped_column(Float, default=100.0)
    mannings_n: Mapped[float] = mapped_column(Float, default=0.035)
    form_state_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_date: Mapped[str] = mapped_column(String(50), default=lambda: datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M"))

    dam: Mapped["DamModel"] = relationship("DamModel", back_populates="scenarios")
    simulations: Mapped[list["SimulationRunModel"]] = relationship("SimulationRunModel", back_populates="scenario", cascade="all, delete-orphan")


class SimulationRunModel(Base):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    scenario_id: Mapped[str] = mapped_column(String(50), ForeignKey("scenarios.id"), nullable=False)
    scenario_title: Mapped[str] = mapped_column(String(200), nullable=False)
    dam_name: Mapped[str] = mapped_column(String(150), nullable=False)
    study_area_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Completed")
    progress_percent: Mapped[int] = mapped_column(Integer, default=100)
    execution_time_sec: Mapped[float] = mapped_column(Float, default=35.0)
    max_flood_area_km2: Mapped[float] = mapped_column(Float, default=150.0)
    max_depth_m: Mapped[float] = mapped_column(Float, default=12.0)
    max_velocity_ms: Mapped[float] = mapped_column(Float, default=7.5)
    affected_population: Mapped[int] = mapped_column(Integer, default=100000)
    time_steps_total: Mapped[int] = mapped_column(Integer, default=72)
    current_time_step_sec: Mapped[int] = mapped_column(Integer, default=21600)
    peak_flow_time_hr: Mapped[float] = mapped_column(Float, default=2.0)
    output_geojson_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    scenario: Mapped["DamBreakScenarioModel"] = relationship("DamBreakScenarioModel", back_populates="simulations")
