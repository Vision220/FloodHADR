import type { MapStyleMode } from '../types/digitalTwin3dTypes';

export interface MapTileProviderInfo {
  id: MapStyleMode;
  name: string;
  urlTemplate: string;
  attribution: string;
  maxZoom: number;
  isSatellite: boolean;
  requiresApiKey: boolean;
  statusNotice: string;
}

export class MapProviderService {
  private static providers: Record<MapStyleMode, MapTileProviderInfo> = {
    ROADMAP: {
      id: 'ROADMAP',
      name: 'Google Roadmap (Official API)',
      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; Google Maps Platform / OpenStreetMap',
      maxZoom: 19,
      isSatellite: false,
      requiresApiKey: true,
      statusNotice: 'GOOGLE ROADMAP VECTOR LAYER'
    },
    STREET: {
      id: 'STREET',
      name: 'OpenStreetMap Carto Standard',
      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      isSatellite: false,
      requiresApiKey: false,
      statusNotice: 'OPEN ACCESS TILE SERVICE ACTIVE'
    },
    SATELLITE: {
      id: 'SATELLITE',
      name: 'Google Satellite / ESRI World Imagery',
      urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18,
      isSatellite: true,
      requiresApiKey: false,
      statusNotice: 'HIGH-RESOLUTION SATELLITE EO FEED'
    },
    HYBRID: {
      id: 'HYBRID',
      name: 'ESRI World Imagery + Roads Overlay',
      urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
      maxZoom: 18,
      isSatellite: true,
      requiresApiKey: false,
      statusNotice: 'HYBRID SATELLITE & INFRASTRUCTURE OVERLAY'
    },
    TERRAIN: {
      id: 'TERRAIN',
      name: 'USGS Topographic Terrain Contour',
      urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Map data: &copy; Esri, OpenStreetMap, SRTM',
      maxZoom: 17,
      isSatellite: false,
      requiresApiKey: false,
      statusNotice: 'DEM CONTOUR & TOPOGRAPHIC TERRAIN'
    },
    PHOTOREALISTIC_3D: {
      id: 'PHOTOREALISTIC_3D',
      name: 'Google Photorealistic 3D Tiles',
      urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Google Maps Platform Photorealistic 3D Tiles',
      maxZoom: 20,
      isSatellite: true,
      requiresApiKey: true,
      statusNotice: 'PHOTOREALISTIC 3D TILES LAYER'
    }
  };

  public static getProvider(style: MapStyleMode): MapTileProviderInfo {
    return this.providers[style] || this.providers.SATELLITE;
  }

  public static getAllProviders(): MapTileProviderInfo[] {
    return Object.values(this.providers);
  }
}
