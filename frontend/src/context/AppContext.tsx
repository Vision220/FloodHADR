import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { PageId, StudyArea, DamSpec, BreachScenario, SimulationRun } from '../types';
import { mockStudyAreas, mockDamSpecs, mockScenarios, mockSimulations } from '../data/mockData';
import { apiService } from '../services/api';
import { DEMO_STEPS } from '../data/demoStepsData';

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  selectedStudyArea: StudyArea;
  setSelectedStudyArea: (area: StudyArea) => void;
  selectedDam: DamSpec;
  setSelectedDam: (dam: DamSpec) => void;
  selectedScenario: BreachScenario;
  setSelectedScenario: (scenario: BreachScenario) => void;
  activeSimulation: SimulationRun;
  setActiveSimulation: (sim: SimulationRun) => void;
  currentTimeStep: number;
  setCurrentTimeStep: (step: number) => void;
  mapLayerMode: 'depth' | 'velocity' | 'arrival' | 'infrastructure';
  setMapLayerMode: (mode: 'depth' | 'velocity' | 'arrival' | 'infrastructure') => void;
  isSimulating: boolean;
  setIsSimulating: (building: boolean) => void;
  startSimulation: () => void;
  isDemoLoading: boolean;
  demoNotice: string | null;
  setDemoNotice: (notice: string | null) => void;
  loadDemoScenario: () => Promise<void>;

  // DEMO MODE State & Methods
  isDemoMode: boolean;
  startDemoMode: () => void;
  stopDemoMode: () => void;
  currentDemoStep: number;
  goToDemoStep: (step: number) => void;
  nextDemoStep: () => void;
  prevDemoStep: () => void;
  isDemoPlaying: boolean;
  toggleDemoPlay: () => void;
  demoSpeed: number;
  setDemoSpeed: (speed: number) => void;
  isPresentationPanelOpen: boolean;
  togglePresentationPanel: () => void;
  isAudioNarratorActive: boolean;
  toggleAudioNarrator: () => void;
  showFinalSummaryModal: boolean;
  setShowFinalSummaryModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('command-center');
  const [selectedStudyArea, setSelectedStudyArea] = useState<StudyArea>(mockStudyAreas[0]);
  const [selectedDam, setSelectedDam] = useState<DamSpec>(mockDamSpecs[0]);
  const [selectedScenario, setSelectedScenario] = useState<BreachScenario>(mockScenarios[0]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationRun>(mockSimulations[0]);
  const [currentTimeStep, setCurrentTimeStep] = useState<number>(24);
  const [mapLayerMode, setMapLayerMode] = useState<'depth' | 'velocity' | 'arrival' | 'infrastructure'>('depth');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // DEMO MODE state
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [currentDemoStep, setCurrentDemoStep] = useState<number>(1);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [demoSpeed, setDemoSpeed] = useState<number>(1);
  const [isPresentationPanelOpen, setIsPresentationPanelOpen] = useState<boolean>(true);
  const [isAudioNarratorActive, setIsAudioNarratorActive] = useState<boolean>(false);
  const [showFinalSummaryModal, setShowFinalSummaryModal] = useState<boolean>(false);

  const startSimulation = () => {
    setIsSimulating(true);
    setActivePage('simulation');
  };

  const loadDemoScenario = async () => {
    setIsDemoLoading(true);
    try {
      const res = await apiService.loadDemoScenarioPackage();
      
      const demoArea: StudyArea = {
        id: res.study_area_id || 'sa-tehri-demo',
        name: 'Tehri River Basin (Synthetic Demo)',
        state: 'Uttarakhand',
        river: 'Bhagirathi / Ganga River',
        damName: 'Tehri Earth & Rockfill Dam',
        lat: 30.3781,
        lng: 78.4802,
        coordinates: { lat: 30.3781, lng: 78.4802 },
        demResolution: '50m Synthetic Grid',
        areaKm2: 1240.0,
        elevationMin: 280,
        elevationMax: 2600,
        elevationRange: { min: 280, max: 2600 },
        description: 'Synthetic baseline study area dataset for decision support testing.',
        isDemo: true,
      };

      const demoDam: DamSpec = {
        id: res.dam_id || 'dam-tehri-demo',
        name: 'Tehri Dam (Synthetic Baseline)',
        river: 'Bhagirathi River',
        studyAreaId: demoArea.id,
        heightM: 260.5,
        crestLengthM: 575,
        reservoirVolumeMm3: 3540,
        fullReservoirLevelM: 830,
        currentWaterLevelM: 830,
        damType: 'Rockfill',
        constructionYear: 2006,
        spillwayCapacityM3s: 15540,
        coordinates: { lat: 30.3781, lng: 78.4802 },
        isDemo: true,
      };

      const demoScenario: BreachScenario = {
        id: res.scenario_id || 'scen-demo-pmf-001',
        title: 'Tehri PMF Overtopping & Rapid Piping Breach (Synthetic Demo)',
        damId: demoDam.id,
        failureMode: 'Overtopping & Piping',
        breachWidthM: 120,
        breachHeightM: 45,
        formationTimeHr: 1.5,
        peakDischargeM3s: 48500,
        reservoirWaterLevelPercent: 100,
        manningsN: 0.035,
        createdDate: new Date().toISOString().substring(0, 10),
        isDemo: true,
      };

      const demoSim: SimulationRun = {
        id: res.simulation_id || 'sim-demo-package-001',
        scenarioId: demoScenario.id,
        scenarioTitle: demoScenario.title,
        damName: demoDam.name,
        studyAreaName: demoArea.name,
        status: 'Completed',
        progressPercent: 100,
        executionTimeSec: 36.4,
        maxFloodAreaKm2: res.results_summary?.max_flood_area_km2 || 28.6,
        maxDepthM: res.results_summary?.max_depth_m || 14.8,
        maxVelocityMs: res.results_summary?.max_velocity_ms || 7.4,
        affectedPopulation: res.results_summary?.affected_population || 18450,
        timeStepsTotal: 72,
        currentTimeStepSec: 21600,
        timestamp: new Date().toISOString().substring(0, 16),
        peakFlowTimeHr: 1.8,
        isDemo: true,
      };

      setSelectedStudyArea(demoArea);
      setSelectedDam(demoDam);
      setSelectedScenario(demoScenario);
      setActiveSimulation(demoSim);
      setDemoNotice(res.notice || "DEMO DATA NOTICE: All loaded datasets are synthetic demonstration layers generated for decision-support modeling.");
    } catch (err) {
      console.error("Failed to load demo scenario package", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Demo Mode Navigation Methods
  const startDemoMode = async () => {
    await loadDemoScenario();
    setIsDemoMode(true);
    setCurrentDemoStep(1);
    setIsDemoPlaying(true);
    setIsPresentationPanelOpen(true);
    setShowFinalSummaryModal(false);
    setActivePage('study-area');
    setDemoNotice("[DEMO MODE ACTIVE] 8-Step Interactive Guided Presentation Tour (~5 minutes).");
  };

  const stopDemoMode = () => {
    setIsDemoMode(false);
    setIsDemoPlaying(false);
    setShowFinalSummaryModal(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const goToDemoStep = (stepNumber: number) => {
    const validStep = Math.max(1, Math.min(8, stepNumber));
    setCurrentDemoStep(validStep);
    
    const stepObj = DEMO_STEPS.find(s => s.step === validStep);
    if (stepObj) {
      setActivePage(stepObj.pageId);
    }

    if (validStep === 8) {
      setShowFinalSummaryModal(true);
    }
  };

  const nextDemoStep = () => {
    if (currentDemoStep < 8) {
      goToDemoStep(currentDemoStep + 1);
    } else {
      setShowFinalSummaryModal(true);
    }
  };

  const prevDemoStep = () => {
    if (currentDemoStep > 1) {
      goToDemoStep(currentDemoStep - 1);
    }
  };

  const toggleDemoPlay = () => {
    setIsDemoPlaying((prev) => !prev);
  };

  const togglePresentationPanel = () => {
    setIsPresentationPanelOpen((prev) => !prev);
  };

  const toggleAudioNarrator = () => {
    setIsAudioNarratorActive((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedStudyArea,
        setSelectedStudyArea,
        selectedDam,
        setSelectedDam,
        selectedScenario,
        setSelectedScenario,
        activeSimulation,
        setActiveSimulation,
        currentTimeStep,
        setCurrentTimeStep,
        mapLayerMode,
        setMapLayerMode,
        isSimulating,
        setIsSimulating,
        startSimulation,
        isDemoLoading,
        demoNotice,
        setDemoNotice,
        loadDemoScenario,

        // Demo mode state & handlers
        isDemoMode,
        startDemoMode,
        stopDemoMode,
        currentDemoStep,
        goToDemoStep,
        nextDemoStep,
        prevDemoStep,
        isDemoPlaying,
        toggleDemoPlay,
        demoSpeed,
        setDemoSpeed,
        isPresentationPanelOpen,
        togglePresentationPanel,
        isAudioNarratorActive,
        toggleAudioNarrator,
        showFinalSummaryModal,
        setShowFinalSummaryModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
