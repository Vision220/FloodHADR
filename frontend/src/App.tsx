import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DemoPresentationPanel } from './components/demo/DemoPresentationPanel';
import { DemoSummaryModal } from './components/demo/DemoSummaryModal';

import { DashboardPage } from './pages/DashboardPage';
import { StudyAreaPage } from './pages/StudyAreaPage';
import { BasinIntelligencePage } from './pages/BasinIntelligencePage';
import { DamReservoirIntelligencePage } from './pages/DamReservoirIntelligencePage';
import { RainfallIntelligencePage } from './pages/RainfallIntelligencePage';
import { CompoundFloodPage } from './pages/CompoundFloodPage';
import { ClimateProjectionPage } from './pages/ClimateProjectionPage';
import { LandslideBlockagePage } from './pages/LandslideBlockagePage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { RealtimeMonitoringPage } from './pages/RealtimeMonitoringPage';
import { DataInputPage } from './pages/DataInputPage';
import { DamBreakScenarioPage } from './pages/DamBreakScenarioPage';
import { SimulationPage } from './pages/SimulationPage';
import { Simulation3DPage } from './pages/Simulation3DPage';
import { FloodMapPage } from './pages/FloodMapPage';
import { ImpactAnalysisPage } from './pages/ImpactAnalysisPage';
import { ScenarioComparisonPage } from './pages/ScenarioComparisonPage';
import { SatelliteMonitoringPage } from './pages/SatelliteMonitoringPage';
import { ReportsExportPage } from './pages/ReportsExportPage';
import { PredictiveEnsemblePage } from './pages/PredictiveEnsemblePage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { SettingsPage } from './pages/SettingsPage';
import { DigitalTwin3DPage } from './pages/DigitalTwin3DPage';
import { EarthEnginePage } from './pages/EarthEnginePage';

const MainContent: React.FC = () => {
  const { activePage } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'command-center':
        return <CommandCenterPage />;
      case 'earth-engine':
        return <EarthEnginePage />;
      case '3d-flood-twin':
        return <DigitalTwin3DPage />;
      case 'dashboard':
      case 'legacy-dashboard':
        return <DashboardPage />;
      case 'study-area':
        return <StudyAreaPage />;
      case 'basin-intelligence':
        return <BasinIntelligencePage />;
      case 'dam-reservoir':
        return <DamReservoirIntelligencePage />;
      case 'rainfall':
        return <RainfallIntelligencePage />;
      case 'compound-flood':
        return <CompoundFloodPage />;
      case 'climate':
        return <ClimateProjectionPage />;
      case 'landslide':
        return <LandslideBlockagePage />;
      case 'multi-model':
        return <ModelComparisonPage />;
      case 'realtime-sensors':
        return <RealtimeMonitoringPage />;
      case 'predictive-ensemble':
        return <PredictiveEnsemblePage />;
      case 'data':
        return <DataInputPage />;
      case 'dam-break':
        return <DamBreakScenarioPage />;
      case 'simulation':
        return <SimulationPage />;
      case 'simulation-3d':
        return <Simulation3DPage />;
      case 'flood-map':
        return <FloodMapPage />;
      case 'impact-analysis':
        return <ImpactAnalysisPage />;
      case 'scenario-comparison':
        return <ScenarioComparisonPage />;
      case 'satellite':
        return <SatelliteMonitoringPage />;
      case 'reports':
        return <ReportsExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CommandCenterPage />;
    }
  };

  const is3D = activePage === 'simulation-3d' || activePage === '3d-flood-twin';

  return (
    <main className={is3D ? "flex-1 overflow-hidden relative w-full h-[calc(100vh-4rem)] bg-slate-950" : "flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full"}>
      {renderPage()}
    </main>
  );
};

const DemoOverlays: React.FC = () => {
  const { showFinalSummaryModal, setShowFinalSummaryModal, startDemoMode } = useApp();

  return (
    <>
      <DemoPresentationPanel />
      <DemoSummaryModal
        isOpen={showFinalSummaryModal}
        onClose={() => setShowFinalSummaryModal(false)}
        onReplayDemo={() => {
          setShowFinalSummaryModal(false);
          startDemoMode();
        }}
      />
    </>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative">
        <Navbar />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <MainContent />
        </div>
        <DemoOverlays />
      </div>
    </AppProvider>
  );
}

export default App;
