import type {
  LocationInspectionData,
  TwinAsset3D,
  CameraPresetTarget,
  TwinVisualizationLayer,
  MapStyleMode
} from '../../types/digitalTwin3dTypes';
import { geoRefService } from './GeoReferenceService';

export interface SyncState {
  centerLat: number;
  centerLng: number;
  zoom: number;
  selectedLocation: LocationInspectionData | null;
  selectedAsset: TwinAsset3D | null;
  cameraPreset: CameraPresetTarget;
  activeLayer: TwinVisualizationLayer;
  mapStyle: MapStyleMode;
  simulationTimeMin: number;
  isPlaying: boolean;
  debugMode: boolean;
}

type SyncListener = (state: SyncState) => void;

/**
 * Map3DSynchronizationService
 * Coordinates bidirectional real-time synchronization between the 2D GIS map,
 * Google Earth Engine observations, hydrodynamic solver clock, and 3D Digital Twin.
 */
export class Map3DSynchronizationService {
  private static instance: Map3DSynchronizationService;

  private state: SyncState = {
    centerLat: 30.3781,
    centerLng: 78.4802,
    zoom: 12,
    selectedLocation: null,
    selectedAsset: null,
    cameraPreset: 'PERSPECTIVE',
    activeLayer: 'DEPTH',
    mapStyle: 'HYBRID',
    simulationTimeMin: 0,
    isPlaying: false,
    debugMode: false
  };

  private listeners: Set<SyncListener> = new Set();

  private constructor() {}

  public static getInstance(): Map3DSynchronizationService {
    if (!Map3DSynchronizationService.instance) {
      Map3DSynchronizationService.instance = new Map3DSynchronizationService();
    }
    return Map3DSynchronizationService.instance;
  }

  public getState(): SyncState {
    return { ...this.state };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach(fn => fn(currentState));
  }

  /**
   * Called when user interacts with 2D GIS Map (pan, zoom, click location).
   * Automatically updates 3D camera focus and selection.
   */
  public select2DLocation(lat: number, lng: number, elevationM: number = 750) {
    const worldPos = geoRefService.geoToWorld(lat, lng, elevationM);

    const inspectionData: LocationInspectionData = {
      lat,
      lng,
      worldX: worldPos.x,
      worldZ: worldPos.z,
      elevationM,
      slopeDeg: 14.5,
      waterDepthM: 3.2,
      waterSurfaceM: elevationM + 3.2,
      velocityMs: 4.8,
      flowDirectionDeg: 185,
      arrivalTimeMin: 45,
      floodDurationHr: 24.0,
      nearestRiver: 'Bhagirathi River Main Channel',
      provenance: 'SIMULATED'
    };

    this.state = {
      ...this.state,
      centerLat: lat,
      centerLng: lng,
      selectedLocation: inspectionData,
      selectedAsset: null
    };
    this.notify();
  }

  /**
   * Called when user clicks an infrastructure building or dam in 3D Digital Twin.
   * Automatically moves 2D map center and highlights 2D feature.
   */
  public select3DAsset(asset: TwinAsset3D) {
    const geo = geoRefService.worldToGeo(asset.position[0], asset.position[1], asset.position[2]);

    this.state = {
      ...this.state,
      centerLat: geo.lat,
      centerLng: geo.lng,
      selectedAsset: asset,
      selectedLocation: null
    };
    this.notify();
  }

  public setCameraPreset(preset: CameraPresetTarget) {
    this.state = { ...this.state, cameraPreset: preset };
    this.notify();
  }

  public setSimulationTime(timeMin: number) {
    this.state = { ...this.state, simulationTimeMin: timeMin };
    this.notify();
  }

  public togglePlay(playing?: boolean) {
    this.state = { ...this.state, isPlaying: playing !== undefined ? playing : !this.state.isPlaying };
    this.notify();
  }

  public toggleDebugMode(debug?: boolean) {
    this.state = { ...this.state, debugMode: debug !== undefined ? debug : !this.state.debugMode };
    this.notify();
  }

  public setLayer(layer: TwinVisualizationLayer) {
    this.state = { ...this.state, activeLayer: layer };
    this.notify();
  }
}

export const syncService = Map3DSynchronizationService.getInstance();
