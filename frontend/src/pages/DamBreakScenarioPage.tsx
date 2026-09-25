import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ScenarioFormState, BreachTypeOption } from '../types';
import { apiService } from '../services/api';
import { HydrographChart } from '../components/analytics/HydrographChart';
import {
  Flame,
  PlayCircle,
  RotateCcw,
  Save,
  CheckCircle2,
  MapPin,
  Database,
  Layers,
  Sliders,
  X,
  Info
} from 'lucide-react';

// Default Form Initial State
const defaultFormState: ScenarioFormState = {
  scenarioTitle: 'Tehri PMF Overtopping Failure Scenario',
  // Study Area
  riverName: 'Bhagirathi / Ganga River',
  damName: 'Tehri Dam',
  latitude: 30.3781,
  longitude: 78.4802,
  // Reservoir
  reservoirElevationM: 830.0,
  initialWaterDepthM: 245.0,
  reservoirAreaKm2: 42.0,
  storageVolumeMm3: 3540,
  // Dam
  damHeightM: 260.5,
  damWidthM: 575.0,
  damCrestElevationM: 830.0,
  // Breach
  breachWidthM: 100.0,
  finalBreachWidthM: 180.0,
  breachFormationTimeMin: 30.0,
  breachElevationM: 710.0,
  breachType: 'Gradual dam break',
  // Simulation
  simulationDurationHr: 6.0,
  timeStepSec: 300,
  manningsN: 0.035,
  gridResolutionM: 30,
};

export const DamBreakScenarioPage: React.FC = () => {
  const { setSelectedScenario, setActiveSimulation, startSimulation } = useApp();

  const [formState, setFormState] = useState<ScenarioFormState>(defaultFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Field change handler
  const handleChange = (field: keyof ScenarioFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Form Validation Logic
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.scenarioTitle.trim()) newErrors.scenarioTitle = 'Scenario title is required';
    if (!formState.riverName.trim()) newErrors.riverName = 'River name is required';
    if (!formState.damName.trim()) newErrors.damName = 'Dam name is required';

    if (isNaN(formState.latitude) || formState.latitude < -90 || formState.latitude > 90) {
      newErrors.latitude = 'Latitude must be between -90° and +90°';
    }
    if (isNaN(formState.longitude) || formState.longitude < -180 || formState.longitude > 180) {
      newErrors.longitude = 'Longitude must be between -180° and +180°';
    }

    if (formState.reservoirElevationM <= 0) newErrors.reservoirElevationM = 'Elevation must be > 0 m';
    if (formState.initialWaterDepthM <= 0) newErrors.initialWaterDepthM = 'Initial water depth must be > 0 m';
    if (formState.initialWaterDepthM > formState.damHeightM) {
      newErrors.initialWaterDepthM = 'Initial depth cannot exceed dam height';
    }

    if (formState.storageVolumeMm3 <= 0) newErrors.storageVolumeMm3 = 'Storage volume must be > 0 Mm³';
    if (formState.damHeightM <= 0) newErrors.damHeightM = 'Dam height must be > 0 m';
    if (formState.damWidthM <= 0) newErrors.damWidthM = 'Dam width must be > 0 m';

    if (formState.breachWidthM <= 0) newErrors.breachWidthM = 'Breach width must be > 0 m';
    if (formState.breachWidthM > formState.damWidthM) {
      newErrors.breachWidthM = 'Breach width cannot exceed dam width';
    }
    if (formState.finalBreachWidthM < formState.breachWidthM) {
      newErrors.finalBreachWidthM = 'Final breach width must be ≥ initial breach width';
    }
    if (formState.breachFormationTimeMin <= 0) newErrors.breachFormationTimeMin = 'Breach formation time must be > 0 min';

    if (formState.simulationDurationHr <= 0 || formState.simulationDurationHr > 72) {
      newErrors.simulationDurationHr = 'Duration must be between 0.5 and 72 hours';
    }
    if (formState.timeStepSec < 10 || formState.timeStepSec > 3600) {
      newErrors.timeStepSec = 'Time step must be between 10s and 3600s';
    }
    if (formState.manningsN < 0.01 || formState.manningsN > 0.20) {
      newErrors.manningsN = "Manning's n must be between 0.010 and 0.200";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Preset Handler
  const loadPreset = (type: BreachTypeOption) => {
    if (type === 'Sudden dam break') {
      setFormState({
        ...defaultFormState,
        scenarioTitle: 'Sudden Catastrophic Collapse Scenario',
        breachType: 'Sudden dam break',
        breachWidthM: 150,
        finalBreachWidthM: 220,
        breachFormationTimeMin: 10,
        simulationDurationHr: 6,
      });
    } else if (type === 'Gradual dam break') {
      setFormState({
        ...defaultFormState,
        scenarioTitle: 'Gradual Internal Piping Erosion Scenario',
        breachType: 'Gradual dam break',
        breachWidthM: 90,
        finalBreachWidthM: 140,
        breachFormationTimeMin: 60,
        simulationDurationHr: 12,
      });
    } else if (type === 'Controlled water release') {
      setFormState({
        ...defaultFormState,
        scenarioTitle: 'Emergency Spillway Controlled Surge',
        breachType: 'Controlled water release',
        breachWidthM: 40,
        finalBreachWidthM: 60,
        breachFormationTimeMin: 120,
        simulationDurationHr: 24,
      });
    } else if (type === 'River blockage release') {
      setFormState({
        ...defaultFormState,
        scenarioTitle: 'Landslide Lake Outburst Surge',
        breachType: 'River blockage release',
        breachWidthM: 110,
        finalBreachWidthM: 160,
        breachFormationTimeMin: 25,
        simulationDurationHr: 8,
      });
    }
  };

  // Reset Handler
  const handleReset = () => {
    setFormState(defaultFormState);
    setErrors({});
    setSaveNotification(null);
  };

  // Save Scenario Handler (Connected to API Service)
  const handleSaveScenario = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const res = await apiService.saveScenario(formState);
      if (res.success) {
        setSelectedScenario(res.scenario);
        setSaveNotification(`Scenario "${res.scenario.title}" saved successfully!`);
        setTimeout(() => setSaveNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run Simulation Handler -> Open Summary Modal First
  const handleOpenSummary = () => {
    if (!validateForm()) return;
    setShowSummaryModal(true);
  };

  // Confirm & Execute Simulation via API
  const handleConfirmRunSimulation = async () => {
    setIsSubmitting(true);
    try {
      const saveRes = await apiService.saveScenario(formState);
      const simRes = await apiService.runSimulation(saveRes.scenario.id, formState);

      if (simRes.success) {
        setSelectedScenario(saveRes.scenario);
        setActiveSimulation(simRes.simulationRun);
        setShowSummaryModal(false);
        startSimulation(); // Navigates to simulation page & starts wave solver
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-sky-600" />
            <span>Dam Break Hydrodynamic Scenario Builder</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Scenario Parameterization & Hydrograph Form
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure river, dam, reservoir, breach geometry, and numerical timestep parameters.
          </p>
        </div>

        {/* Top Header Buttons */}
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-all flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Reset Form</span>
          </button>
          <button
            onClick={handleSaveScenario}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Scenario</span>
          </button>
          <button
            onClick={handleOpenSummary}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {saveNotification && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Preset Scenario Selector Buttons */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
          Quick Preset Scenario Templates:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['Sudden dam break', 'Gradual dam break', 'Controlled water release', 'River blockage release'] as BreachTypeOption[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => loadPreset(type)}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                formState.breachType === type
                  ? 'border-sky-600 bg-sky-50 font-bold text-sky-900 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Preset Option</div>
              <div>{type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Input Form Cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Scenario Title Input */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Scenario Designation Title *
            </label>
            <input
              type="text"
              value={formState.scenarioTitle}
              onChange={(e) => handleChange('scenarioTitle', e.target.value)}
              placeholder="e.g. Demo Dam Break – 100m Breach"
              className={`w-full px-3 py-2 border rounded text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                errors.scenarioTitle ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
            />
            {errors.scenarioTitle && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.scenarioTitle}</p>}
          </div>

          {/* SECTION 1: Study Area */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>1. Study Area Location Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">River Name *</label>
                <input
                  type="text"
                  value={formState.riverName}
                  onChange={(e) => handleChange('riverName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.riverName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.riverName && <p className="text-[11px] text-red-600 mt-0.5">{errors.riverName}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dam Name *</label>
                <input
                  type="text"
                  value={formState.damName}
                  onChange={(e) => handleChange('damName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.damName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.damName && <p className="text-[11px] text-red-600 mt-0.5">{errors.damName}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Latitude (°N) *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formState.latitude}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded font-mono ${errors.latitude ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.latitude && <p className="text-[11px] text-red-600 mt-0.5">{errors.latitude}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Longitude (°E) *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formState.longitude}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded font-mono ${errors.longitude ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.longitude && <p className="text-[11px] text-red-600 mt-0.5">{errors.longitude}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 2: Reservoir */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Database className="w-4 h-4 text-teal-600" />
              <span>2. Reservoir Hydrology Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reservoir Elevation (m MSL) *</label>
                <input
                  type="number"
                  value={formState.reservoirElevationM}
                  onChange={(e) => handleChange('reservoirElevationM', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.reservoirElevationM ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.reservoirElevationM && <p className="text-[11px] text-red-600 mt-0.5">{errors.reservoirElevationM}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Water Depth (m) *</label>
                <input
                  type="number"
                  value={formState.initialWaterDepthM}
                  onChange={(e) => handleChange('initialWaterDepthM', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.initialWaterDepthM ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.initialWaterDepthM && <p className="text-[11px] text-red-600 mt-0.5">{errors.initialWaterDepthM}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reservoir Area (km²)</label>
                <input
                  type="number"
                  value={formState.reservoirAreaKm2}
                  onChange={(e) => handleChange('reservoirAreaKm2', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Storage Volume (Million m³) *</label>
                <input
                  type="number"
                  value={formState.storageVolumeMm3}
                  onChange={(e) => handleChange('storageVolumeMm3', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.storageVolumeMm3 ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.storageVolumeMm3 && <p className="text-[11px] text-red-600 mt-0.5">{errors.storageVolumeMm3}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 3: Dam */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>3. Dam Structural Geometry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dam Height (m) *</label>
                <input
                  type="number"
                  value={formState.damHeightM}
                  onChange={(e) => handleChange('damHeightM', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.damHeightM ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.damHeightM && <p className="text-[11px] text-red-600 mt-0.5">{errors.damHeightM}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dam Width / Crest Length (m) *</label>
                <input
                  type="number"
                  value={formState.damWidthM}
                  onChange={(e) => handleChange('damWidthM', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.damWidthM ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.damWidthM && <p className="text-[11px] text-red-600 mt-0.5">{errors.damWidthM}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dam Crest Elevation (m MSL)</label>
                <input
                  type="number"
                  value={formState.damCrestElevationM}
                  onChange={(e) => handleChange('damCrestElevationM', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Breach */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 text-red-600" />
              <span>4. Breach Geometry & Failure Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Breach Type Scenario *</label>
                <select
                  value={formState.breachType}
                  onChange={(e) => handleChange('breachType', e.target.value as BreachTypeOption)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Sudden dam break">Sudden dam break (Catastrophic Failure)</option>
                  <option value="Gradual dam break">Gradual dam break (Piping / Erosion)</option>
                  <option value="Controlled water release">Controlled water release (Spillway Gate Surge)</option>
                  <option value="River blockage release">River blockage release (Landslide Dam Break)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Breach Width (m) *</label>
                <input
                  type="number"
                  value={formState.breachWidthM}
                  onChange={(e) => handleChange('breachWidthM', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.breachWidthM ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.breachWidthM && <p className="text-[11px] text-red-600 mt-0.5">{errors.breachWidthM}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Final Breach Width (m) *</label>
                <input
                  type="number"
                  value={formState.finalBreachWidthM}
                  onChange={(e) => handleChange('finalBreachWidthM', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.finalBreachWidthM ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.finalBreachWidthM && <p className="text-[11px] text-red-600 mt-0.5">{errors.finalBreachWidthM}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Breach Formation Time (Minutes) *</label>
                <input
                  type="number"
                  value={formState.breachFormationTimeMin}
                  onChange={(e) => handleChange('breachFormationTimeMin', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.breachFormationTimeMin ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.breachFormationTimeMin && <p className="text-[11px] text-red-600 mt-0.5">{errors.breachFormationTimeMin}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Breach Invert Elevation (m MSL)</label>
                <input
                  type="number"
                  value={formState.breachElevationM}
                  onChange={(e) => handleChange('breachElevationM', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Simulation */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>5. Hydrodynamic Simulation Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Simulation Duration (Hours) *</label>
                <input
                  type="number"
                  step="0.5"
                  value={formState.simulationDurationHr}
                  onChange={(e) => handleChange('simulationDurationHr', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-medium ${errors.simulationDurationHr ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.simulationDurationHr && <p className="text-[11px] text-red-600 mt-0.5">{errors.simulationDurationHr}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Time Step (Seconds) *</label>
                <input
                  type="number"
                  step="30"
                  value={formState.timeStepSec}
                  onChange={(e) => handleChange('timeStepSec', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-mono ${errors.timeStepSec ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.timeStepSec && <p className="text-[11px] text-red-600 mt-0.5">{errors.timeStepSec}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Manning Roughness Coefficient (n) *</label>
                <input
                  type="number"
                  step="0.005"
                  value={formState.manningsN}
                  onChange={(e) => handleChange('manningsN', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded font-mono ${errors.manningsN ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                />
                {errors.manningsN && <p className="text-[11px] text-red-600 mt-0.5">{errors.manningsN}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Grid Cell Resolution (m)</label>
                <input
                  type="number"
                  value={formState.gridResolutionM}
                  onChange={(e) => handleChange('gridResolutionM', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Outflow Hydrograph Preview & Summary Preview */}
        <div className="space-y-6">
          {/* Quick Scenario Summary Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-sky-600" />
              <span>Scenario Quick Summary</span>
            </h3>

            <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1.5 text-slate-700">
              <div className="font-bold text-slate-900 border-b pb-1">
                "{formState.scenarioTitle}"
              </div>
              <div className="flex justify-between">
                <span>Reservoir Level:</span>
                <span className="font-mono font-bold text-sky-700">{formState.initialWaterDepthM} m</span>
              </div>
              <div className="flex justify-between">
                <span>Breach Width:</span>
                <span className="font-mono font-bold text-red-600">{formState.breachWidthM} m</span>
              </div>
              <div className="flex justify-between">
                <span>Breach Formation:</span>
                <span className="font-semibold text-slate-900">{formState.breachFormationTimeMin} min</span>
              </div>
              <div className="flex justify-between">
                <span>Simulation Duration:</span>
                <span className="font-semibold text-slate-900">{formState.simulationDurationHr} hours</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenSummary}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-xs shadow transition-all flex items-center justify-center space-x-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Review Summary & Launch</span>
            </button>
          </div>

          {/* Hydrograph Chart Preview */}
          <HydrographChart />
        </div>
      </div>

      {/* SCENARIO SUMMARY MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm Simulation Execution</h3>
                  <p className="text-xs text-slate-500">Hydrodynamic Scenario Summary Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formatted Scenario Summary Box as requested by prompt */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs text-slate-800">
              <div className="flex justify-between border-b pb-1.5 font-bold text-slate-900 text-sm">
                <span>Scenario:</span>
                <span className="text-sky-700 font-sans">"{formState.scenarioTitle}"</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block">Reservoir Level:</span>
                  <span className="font-bold text-sky-700 font-mono">{formState.initialWaterDepthM} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Breach Width:</span>
                  <span className="font-bold text-red-600 font-mono">{formState.breachWidthM} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Breach Time:</span>
                  <span className="font-bold text-slate-900">{formState.breachFormationTimeMin} min</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Simulation Duration:</span>
                  <span className="font-bold text-slate-900">{formState.simulationDurationHr} hours</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-teal-800">
                <span>API Endpoint:</span>
                <span className="font-mono text-xs text-slate-600">POST /api/v1/simulations/run</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all"
              >
                Cancel / Edit Inputs
              </button>
              <button
                type="button"
                onClick={handleConfirmRunSimulation}
                disabled={isSubmitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Calling REST API...</span>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Confirm & Launch 2D Solver</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
