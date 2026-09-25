import type { MapStyleMode, GeoReference } from '../types/digitalTwin3dTypes';

export interface MapProvider {
  id: MapStyleMode;
  name: string;
  isSatellite: boolean;
  requiresApiKey: boolean;
  statusNotice: string;
  attribution: string;
  initialize(apiKey?: string): void;
  getSession(): any;
  getTileUrl(z: number, x: number, y: number): string;
  getViewport(): { center: [number, number]; zoom: number };
  dispose(): void;
}

export const DEFAULT_GEO_REFERENCE: GeoReference = {
  crs: 'EPSG:4326',
  originLat: 30.3781,
  originLng: 78.4802,
  elevationDatum: 'MSL (Mean Sea Level)',
  boundingBox: [78.35, 30.15, 78.95, 30.98], // Tehri Upper Bhagirathi Basin
  terrainResolutionM: 12.0,
  mapScale: 1.0,
  verticalScale: 2.0,
};

// ----------------------------------------------------
// 1. GOOGLE MAPS PLATFORM PROVIDERS (MAP TILES API)
// ----------------------------------------------------
export class GoogleSatelliteProvider implements MapProvider {
  public id: MapStyleMode = 'SATELLITE';
  public name = 'Google Satellite Map (Official API)';
  public isSatellite = true;
  public requiresApiKey = true;
  public statusNotice = 'GOOGLE MAPS PLATFORM SATELLITE EO FEED';
  public attribution = '&copy; Google Maps Platform Map Tiles API';
  private apiKey = '';
  private sessionToken = '';

  public initialize(apiKey?: string): void {
    this.apiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (this.apiKey) {
      this.sessionToken = `session_gmaps_sat_${Date.now()}`;
    }
  }

  public getSession(): any {
    return { token: this.sessionToken, provider: 'Google', mode: 'satellite' };
  }

  public getTileUrl(z: number, x: number, y: number): string {
    if (!this.apiKey) {
      // Fallback to high-res ESRI satellite if Google API Key is not set
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?session=${this.sessionToken}&key=${this.apiKey}`;
  }

  public getViewport() {
    return { center: [30.3781, 78.4802] as [number, number], zoom: 11 };
  }

  public dispose(): void {
    this.sessionToken = '';
  }
}

export class GoogleRoadmapProvider implements MapProvider {
  public id: MapStyleMode = 'ROADMAP';
  public name = 'Google Roadmap (Official API)';
  public isSatellite = false;
  public requiresApiKey = true;
  public statusNotice = 'GOOGLE MAPS ROADMAP LAYER';
  public attribution = '&copy; Google Maps Platform';
  private apiKey = '';

  public initialize(apiKey?: string): void {
    this.apiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  public getSession(): any {
    return { provider: 'Google', mode: 'roadmap' };
  }

  public getTileUrl(z: number, x: number, y: number): string {
    if (!this.apiKey) {
      return `https://{s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
    return `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?key=${this.apiKey}`;
  }

  public getViewport() {
    return { center: [30.3781, 78.4802] as [number, number], zoom: 11 };
  }

  public dispose(): void {}
}

export class GoogleTerrainProvider implements MapProvider {
  public id: MapStyleMode = 'TERRAIN';
  public name = 'Google Terrain & Contour Map';
  public isSatellite = false;
  public requiresApiKey = true;
  public statusNotice = 'GOOGLE TERRAIN DEM RELIEF LAYER';
  public attribution = '&copy; Google Maps Platform Terrain';
  private apiKey = '';

  public initialize(apiKey?: string): void {
    this.apiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  public getSession(): any {
    return { provider: 'Google', mode: 'terrain' };
  }

  public getTileUrl(z: number, x: number, y: number): string {
    if (!this.apiKey) {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?key=${this.apiKey}`;
  }

  public getViewport() {
    return { center: [30.3781, 78.4802] as [number, number], zoom: 11 };
  }

  public dispose(): void {}
}

export class GoogleHybridProvider implements MapProvider {
  public id: MapStyleMode = 'HYBRID';
  public name = 'Google Hybrid (Satellite + Roads/Labels)';
  public isSatellite = true;
  public requiresApiKey = true;
  public statusNotice = 'GOOGLE HYBRID SATELLITE & ROADS OVERLAY';
  public attribution = '&copy; Google Maps Platform Hybrid';
  private apiKey = '';

  public initialize(apiKey?: string): void {
    this.apiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  public getSession(): any {
    return { provider: 'Google', mode: 'hybrid' };
  }

  public getTileUrl(z: number, x: number, y: number): string {
    if (!this.apiKey) {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?key=${this.apiKey}`;
  }

  public getViewport() {
    return { center: [30.3781, 78.4802] as [number, number], zoom: 11 };
  }

  public dispose(): void {}
}

// ----------------------------------------------------
// 2. MAP PROVIDER FACTORY & ALIGNMENT VALIDATION
// ----------------------------------------------------
export function getMapProvider(style: MapStyleMode, apiKey?: string): MapProvider {
  const envKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  let provider: MapProvider;

  switch (style) {
    case 'ROADMAP':
    case 'STREET':
      provider = new GoogleRoadmapProvider();
      break;
    case 'SATELLITE':
      provider = new GoogleSatelliteProvider();
      break;
    case 'HYBRID':
      provider = new GoogleHybridProvider();
      break;
    case 'TERRAIN':
      provider = new GoogleTerrainProvider();
      break;
    case 'PHOTOREALISTIC_3D':
      provider = new GoogleSatelliteProvider();
      provider.name = 'Google Photorealistic 3D Tiles Provider';
      break;
    default:
      provider = new GoogleSatelliteProvider();
  }

  provider.initialize(envKey);
  return provider;
}

/**
 * Validate geospatial alignment between Satellite imagery, DEM coordinates, and 3D terrain.
 */
export function validateGeoAlignment(
  satCoords: { lat: number; lng: number },
  demCoords: { lat: number; lng: number },
  toleranceM: number = 5.0
): { status: 'VALIDATED' | 'ALIGNMENT_WARNING'; offsetMeters: number; message: string } {
  // Haversine distance calculation in meters
  const R = 6371000; // Earth radius meters
  const dLat = ((demCoords.lat - satCoords.lat) * Math.PI) / 180;
  const dLng = ((demCoords.lng - satCoords.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((satCoords.lat * Math.PI) / 180) *
      Math.cos((demCoords.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const offsetMeters = Math.round(R * c * 10) / 10;

  if (offsetMeters <= toleranceM) {
    return {
      status: 'VALIDATED',
      offsetMeters,
      message: `Geospatial coordinate alignment validated (Δ = ${offsetMeters}m <= ${toleranceM}m tolerance)`,
    };
  } else {
    return {
      status: 'ALIGNMENT_WARNING',
      offsetMeters,
      message: `Geospatial alignment warning: DEM vs Satellite imagery offset Δ = ${offsetMeters}m exceeds ${toleranceM}m tolerance.`,
    };
  }
}
