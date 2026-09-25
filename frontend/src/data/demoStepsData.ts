import type { PageId } from '../types';

export interface DemoStep {
  step: number;
  title: string;
  subtitle: string;
  pageId: PageId;
  durationSec: number; // Default duration at 1x speed (~37.5s each for 300s / 5 min total)
  summary: string;
  narrative: string;
  hadrContext: string;
  highlights: string[];
  metricsPreview?: {
    label: string;
    value: string;
    color: string;
  }[];
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Select Study Area',
    subtitle: 'Region Baseline & DEM Elevation Grid Specification',
    pageId: 'study-area',
    durationSec: 35,
    summary: 'Selecting Tehri River Basin & ALOS PALSAR 50m DEM raster dataset.',
    narrative: 'Welcome to FloodHADR Demo Mode. In Step 1, we initialize our study area: the Tehri River Basin in Uttarakhand, India. The system loads ALOS PALSAR high-resolution DEM elevation grids spanning 1,240 square kilometers, ranging from 280 to 2,600 meters above sea level.',
    hadrContext: 'Accurate Digital Elevation Models are essential for defining downstream valley topography, steep river channels, and flood conveyance pathways.',
    highlights: [
      'ALOS PALSAR 50m DEM raster grid loaded',
      'Elevation range: 280m to 2,600m MSL',
      'Area boundary: 1,240 km² coverage',
      'EPSG:4326 WGS84 Spatial Reference'
    ],
    metricsPreview: [
      { label: 'Baseline Area', value: '1,240 km²', color: 'text-sky-600' },
      { label: 'DEM Grid Res', value: '50m Grid', color: 'text-teal-600' },
      { label: 'Elev Span', value: '2,320 m', color: 'text-indigo-600' }
    ]
  },
  {
    step: 2,
    title: 'View Dam and River',
    subtitle: 'Dam Structural Geometry & River Channel Hydrology',
    pageId: 'study-area',
    durationSec: 35,
    summary: 'Inspecting Tehri Dam specifications & Bhagirathi River hydrology.',
    narrative: 'In Step 2, we inspect the Tehri Earth & Rockfill Dam on the Bhagirathi River. The dam reaches a height of 260.5 meters with a crest length of 575 meters and holds 3,540 Million Cubic Meters of water at Full Reservoir Level (830m MSL).',
    hadrContext: 'Impounded water volume and hydraulic head directly govern the total energy and peak discharge released during breach initiation.',
    highlights: [
      'Dam: Tehri Earth & Rockfill Dam (Bhagirathi River)',
      'Height: 260.5 meters | Crest Length: 575 meters',
      'Reservoir Storage: 3,540 Million m³ (FRL 830m MSL)',
      'Design Spillway Capacity: 15,540 m³/s'
    ],
    metricsPreview: [
      { label: 'Dam Height', value: '260.5 m', color: 'text-amber-600' },
      { label: 'Reservoir Vol', value: '3,540 MMm³', color: 'text-sky-600' },
      { label: 'Spillway Q', value: '15,540 m³/s', color: 'text-emerald-600' }
    ]
  },
  {
    step: 3,
    title: 'Configure Dam Break',
    subtitle: 'Failure Mode & Breach Hydrograph Parameterization',
    pageId: 'dam-break',
    durationSec: 40,
    summary: 'Configuring PMF Overtopping & Piping failure mode hydrograph.',
    narrative: 'In Step 3, we configure the dam breach scenario parameters. We select an Overtopping and Piping failure mode with a 120-meter final breach width and 1.5-hour formation time. The Froehlich empirical breach formula computes a peak outflow hydrograph of 48,500 m³/s.',
    hadrContext: 'Breach formation speed dictates downstream lead times, allowing emergency management teams to calculate evacuation windows.',
    highlights: [
      'Failure Mode: PMF Overtopping & Rapid Piping',
      'Breach Width: 120m initial to 180m final',
      'Breach Formation Time: 1.5 hours (90 minutes)',
      'Peak Outflow Hydrograph: 48,500 m³/s'
    ],
    metricsPreview: [
      { label: 'Breach Width', value: '120 m', color: 'text-red-600' },
      { label: 'Breach Time', value: '1.5 hrs', color: 'text-amber-600' },
      { label: 'Peak Outflow Q', value: '48,500 m³/s', color: 'text-purple-600' }
    ]
  },
  {
    step: 4,
    title: 'Run Simulation',
    subtitle: '2D Cellular Automata Hydrodynamic Solver Execution',
    pageId: 'simulation',
    durationSec: 40,
    summary: 'Executing 2D Diffusive Wave shallow water simulation.',
    narrative: 'Step 4 executes the 2D hydrodynamic simulation engine. The cellular automata solver calculates 2D shallow water equations across 72 timesteps (12 propagation hours). The Courant-Friedrichs-Lewy stability condition is verified at CFL = 0.42.',
    hadrContext: 'High-speed 2D numerical solvers enable rapid situational awareness before and during flood surge events.',
    highlights: [
      'Engine: 2D Diffusive Wave Hydro Core',
      'Simulation Horizon: 12.0 Hours (72 Timesteps)',
      'CFL Stability Check: 0.42 (Numerically Stable)',
      'Solver Execution Time: 36.4 seconds'
    ],
    metricsPreview: [
      { label: 'Execution Status', value: 'COMPLETED', color: 'text-emerald-600' },
      { label: 'Solve Time', value: '36.4 s', color: 'text-teal-600' },
      { label: 'CFL Index', value: '0.42 (Safe)', color: 'text-sky-600' }
    ]
  },
  {
    step: 5,
    title: 'View Flood Inundation',
    subtitle: 'Dynamic GIS Flood Raster, Velocity Vectors & Depth Map',
    pageId: 'flood-map',
    durationSec: 40,
    summary: 'Analyzing spatial inundation extent, depth raster & velocity vectors.',
    narrative: 'In Step 5, we examine the GIS flood map. The simulation reveals a maximum flood depth of 14.8 meters, peak flow velocity of 7.4 m/s, and a total inundation area of 28.6 square kilometers extending downstream along the valley.',
    hadrContext: 'Dynamic spatial velocity vectors highlight high-kinetic surge zones where structural damage and bridge scour are imminent.',
    highlights: [
      'Maximum Inundation Depth: 14.8 meters',
      'Maximum Water Velocity: 7.4 m/s',
      'Total Flood Extent Area: 28.6 km²',
      'Interactive Time Step Scrubbing: 0 to 12 Hours'
    ],
    metricsPreview: [
      { label: 'Max Depth', value: '14.8 m', color: 'text-red-600' },
      { label: 'Max Velocity', value: '7.4 m/s', color: 'text-indigo-600' },
      { label: 'Inundation Area', value: '28.6 km²', color: 'text-teal-600' }
    ]
  },
  {
    step: 6,
    title: 'View Impact Analysis',
    subtitle: 'HADR Infrastructure Damage & Population Risk Assessment',
    pageId: 'impact-analysis',
    durationSec: 40,
    summary: 'Evaluating impacted structures, roads, and critical assets.',
    narrative: 'Step 6 performs automated HADR impact analysis. Overlapping spatial inundation layers with GIS infrastructure assets reveals 1,420 affected buildings, 84.5 kilometers of flooded roads, and 12 critical assets (including hospitals, substations, and bridges).',
    hadrContext: 'Prioritizes rescue routes and identifies power substations and hospitals at risk for emergency defense deployment.',
    highlights: [
      'Affected Structures: 1,420 residential & commercial buildings',
      'Affected Road Network: 84.5 km of transport corridors',
      'Critical Facilities: 2 Hospitals, 2 Power Substation Grids, 4 Bridges',
      'Estimated At-Risk Population: 18,450 residents'
    ],
    metricsPreview: [
      { label: 'Buildings', value: '1,420', color: 'text-amber-600' },
      { label: 'Road Network', value: '84.5 km', color: 'text-sky-600' },
      { label: 'Critical Assets', value: '12 Facilities', color: 'text-red-600' }
    ]
  },
  {
    step: 7,
    title: 'Compare Scenarios',
    subtitle: 'Multi-Scenario Hydrograph & Spatial IoU Agreement Comparison',
    pageId: 'scenario-comparison',
    durationSec: 35,
    summary: 'Cross-comparing PMF Overtopping vs Controlled Release.',
    narrative: 'In Step 7, we compare multiple flood scenarios: PMF Overtopping Breach versus Controlled Spillway Discharge. The system computes a spatial Intersection-over-Union (IoU = 0.84) and plots peak outflow hydrograph curves.',
    hadrContext: 'Scenario comparisons empower disaster authorities to model "What-If" dam release strategies to mitigate downstream impact.',
    highlights: [
      'Comparison: PMF Overtopping vs Controlled Spillway Surge',
      'Spatial IoU Overlap Agreement: 84.2%',
      'Peak Flow Difference: 48,500 m³/s vs 12,200 m³/s',
      'Comparative Inundation Reduction: -14.2 km²'
    ],
    metricsPreview: [
      { label: 'Spatial IoU', value: '84.2%', color: 'text-indigo-600' },
      { label: 'Area Diff', value: '-14.2 km²', color: 'text-emerald-600' },
      { label: 'Peak Flow Reduction', value: '74.8%', color: 'text-sky-600' }
    ]
  },
  {
    step: 8,
    title: 'Export Results',
    subtitle: 'GIS Product Generation & Final Simulation Summary',
    pageId: 'reports',
    durationSec: 40,
    summary: 'Generating 5 GIS export packages & launching Final Summary.',
    narrative: 'Finally, in Step 8, we reach the GIS Export & Executive Summary stage. FloodHADR packages all simulation results into 5 standard formats: KML, ESRI Shapefile, GeoTIFF, CSV analytics, and HADR Brief PDF report, launching our FLOOD SIMULATION COMPLETE summary!',
    hadrContext: 'Multi-format interoperability ensures instant data sharing with defense mapping agencies, NDRF units, and civil command centers.',
    highlights: [
      'Google Earth KML (.kml)',
      'ESRI Shapefile Bundle (.zip)',
      '32-bit GeoTIFF Depth Raster (.tif)',
      'Tabular Hydro Analytics CSV (.csv)',
      'HADR Executive Summary Report PDF'
    ],
    metricsPreview: [
      { label: 'Formats', value: '5 GIS Types', color: 'text-teal-600' },
      { label: 'CRS Reference', value: 'EPSG:4326', color: 'text-sky-600' },
      { label: 'Status', value: 'READY FOR EXPORT', color: 'text-emerald-600' }
    ]
  }
];
