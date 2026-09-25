import type { FeatureCollection, Geometry, Point, LineString, Polygon } from 'geojson';

// 1. Study Area Boundary GeoJSON (Tehri Basin)
export const sampleStudyAreaGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Tehri River Basin ROI',
        areaKm2: 1240,
        demResolution: '12m ALOS PALSAR',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.35, 30.45],
            [78.60, 30.45],
            [78.65, 30.25],
            [78.50, 30.00],
            [78.20, 30.00],
            [78.22, 30.25],
            [78.35, 30.45],
          ],
        ],
      },
    },
  ],
};

// 2. Main River Reach GeoJSON (Bhagirathi / Ganga River downstream line)
export const sampleRiverGeoJSON: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Bhagirathi / Ganga River Main Channel',
        lengthKm: 65.4,
        averageSlope: '0.008 m/m',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.4802, 30.3781], // Tehri Dam
          [78.4850, 30.3500],
          [78.4980, 30.2780], // Koteshwar
          [78.5200, 30.2000],
          [78.5986, 30.1458], // Devprayag Confluence
          [78.3880, 30.1380], // Shivpuri
          [78.2950, 30.1050], // Rishikesh
          [78.1600, 29.9500], // Haridwar
        ],
      },
    },
  ],
};

// 3. Dam Site Point GeoJSON
export const sampleDamGeoJSON: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'dam-tehri',
        name: 'Tehri Earth & Rockfill Dam',
        river: 'Bhagirathi River',
        reservoirLevel: '822.4 m MSL (95% FRL)',
        height: '260.5 m',
        breachWidth: '180 m',
        currentScenario: 'Tehri PMF Overtopping Failure',
        spillwayCapacity: '15,540 m³/s',
        constructionYear: 2006,
      },
      geometry: {
        type: 'Point',
        coordinates: [78.4802, 30.3781],
      },
    },
  ],
};

// 4. Flood Inundation Classified Depth Polygons GeoJSON
export const sampleFloodDepthGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    // Zone 1: Severe Inundation Depth (> 3.0 m)
    {
      type: 'Feature',
      properties: {
        zoneName: 'Severe Hydrodynamic Breach Zone',
        depthM: 14.6,
        velocityMs: 8.4,
        arrivalTimeHr: 0.2,
        riskLevel: 'Severe Flood (> 3.0m)',
        color: '#dc2626',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.4802, 30.3781],
            [78.4900, 30.3400],
            [78.5100, 30.2600],
            [78.4800, 30.2500],
            [78.4600, 30.3300],
            [78.4802, 30.3781],
          ],
        ],
      },
    },
    // Zone 2: High Risk Depth (1.5 - 3.0 m)
    {
      type: 'Feature',
      properties: {
        zoneName: 'Devprayag Valley High Water Zone',
        depthM: 2.8,
        velocityMs: 5.2,
        arrivalTimeHr: 1.1,
        riskLevel: 'High Risk (1.5m - 3.0m)',
        color: '#f97316',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.5100, 30.2600],
            [78.6100, 30.1500],
            [78.5700, 30.1300],
            [78.4800, 30.2500],
            [78.5100, 30.2600],
          ],
        ],
      },
    },
    // Zone 3: Moderate Flood Depth (0.5 - 1.5 m)
    {
      type: 'Feature',
      properties: {
        zoneName: 'Shivpuri - Rishikesh Surge Zone',
        depthM: 1.2,
        velocityMs: 3.4,
        arrivalTimeHr: 2.5,
        riskLevel: 'Moderate (0.5m - 1.5m)',
        color: '#eab308',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.6100, 30.1500],
            [78.4200, 30.1400],
            [78.3000, 30.1000],
            [78.2800, 30.0800],
            [78.3500, 30.1200],
            [78.5700, 30.1300],
            [78.6100, 30.1500],
          ],
        ],
      },
    },
    // Zone 4: Low Risk Inundation Fringe (< 0.5 m)
    {
      type: 'Feature',
      properties: {
        zoneName: 'Outer Floodplain Fringe Zone',
        depthM: 0.35,
        velocityMs: 1.1,
        arrivalTimeHr: 4.8,
        riskLevel: 'Low Risk (< 0.5m)',
        color: '#10b981',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.3000, 30.1000],
            [78.2500, 30.0400],
            [78.2000, 29.9800],
            [78.1800, 29.9600],
            [78.2200, 29.9800],
            [78.2800, 30.0800],
            [78.3000, 30.1000],
          ],
        ],
      },
    },
  ],
};

// 5. Flood Wave Velocity Vectors GeoJSON
export const sampleVelocityVectorsGeoJSON: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { velocityMs: 8.4, direction: 'SSW 210°' },
      geometry: { type: 'LineString', coordinates: [[78.4802, 30.3781], [78.4900, 30.3400]] },
    },
    {
      type: 'Feature',
      properties: { velocityMs: 6.8, direction: 'SW 225°' },
      geometry: { type: 'LineString', coordinates: [[78.4900, 30.3400], [78.5100, 30.2600]] },
    },
    {
      type: 'Feature',
      properties: { velocityMs: 5.2, direction: 'SE 140°' },
      geometry: { type: 'LineString', coordinates: [[78.5100, 30.2600], [78.5986, 30.1458]] },
    },
    {
      type: 'Feature',
      properties: { velocityMs: 3.4, direction: 'WSW 245°' },
      geometry: { type: 'LineString', coordinates: [[78.5986, 30.1458], [78.2950, 30.1050]] },
    },
  ],
};

// 6. Arrival Time Isochrones GeoJSON
export const sampleArrivalIsochronesGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { arrivalTimeHr: 0.5, label: '0.5 Hours (30 mins)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.4802, 30.3781],
            [78.5000, 30.3200],
            [78.4500, 30.3200],
            [78.4802, 30.3781],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { arrivalTimeHr: 1.0, label: '1.0 Hour (60 mins)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.5000, 30.3200],
            [78.5500, 30.2200],
            [78.4700, 30.2200],
            [78.4500, 30.3200],
            [78.5000, 30.3200],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { arrivalTimeHr: 2.0, label: '2.0 Hours (120 mins)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.5500, 30.2200],
            [78.6000, 30.1400],
            [78.5000, 30.1300],
            [78.4700, 30.2200],
            [78.5500, 30.2200],
          ],
        ],
      },
    },
  ],
};

// 7. Critical Infrastructure Buildings & Points GeoJSON
export const sampleInfrastructureGeoJSON: FeatureCollection<Geometry> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Rishikesh District Government Hospital',
        type: 'Hospital',
        floodDepthM: 3.4,
        status: 'Inundated',
        capacity: '350 Beds',
        distanceKm: 42.5,
      },
      geometry: { type: 'Point', coordinates: [78.2676, 30.0869] },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Devprayag Base Trauma Center',
        type: 'Hospital',
        floodDepthM: 6.8,
        status: 'Critical Submerged',
        capacity: '120 Beds',
        distanceKm: 24.1,
      },
      geometry: { type: 'Point', coordinates: [78.5986, 30.1458] },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Tehri Hydro 1000MW Power Substation',
        type: 'Power Grid',
        floodDepthM: 8.2,
        status: 'Critical Submerged',
        capacity: '1000 MW',
        distanceKm: 3.2,
      },
      geometry: { type: 'Point', coordinates: [78.4750, 30.3700] },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Koteshwar Dam Spillway Bridge',
        type: 'Bridge',
        floodDepthM: 11.5,
        status: 'Critical Submerged',
        capacity: 'Double Lane Highway',
        distanceKm: 14.8,
      },
      geometry: { type: 'Point', coordinates: [78.4980, 30.2780] },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Rishikesh Relief Shelter Alpha',
        type: 'Evacuation Center',
        floodDepthM: 0.0,
        status: 'Safe High Ground',
        capacity: '4,500 Evacuees',
        distanceKm: 45.0,
      },
      geometry: { type: 'Point', coordinates: [78.2950, 30.1050] },
    },
  ],
};

// 8. Key Transportation Roads GeoJSON
export const sampleRoadsGeoJSON: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'NH-58 National Highway', status: 'Blocked at Byasi', type: 'Arterial Highway' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.5986, 30.1458],
          [78.4200, 30.1380],
          [78.2950, 30.1050],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Tehri Chamba Bypass Road', status: 'Clear & Open', type: 'High Ground Bypass' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.4802, 30.3781],
          [78.4000, 30.3400],
          [78.3500, 30.2800],
          [78.2950, 30.1050],
        ],
      },
    },
  ],
};
