# FINAL_TEHRI_DATA_AUDIT — TEHRI HYDROLOGIC & GEOSPATIAL DATASET AUDIT

## Executive Overview
This document provides the hydrologic, dam safety, topographic, and critical infrastructure dataset audit for the Tehri Dam Complex & Bhagirathi River Floodplain (`TEHRI_GOLDEN_BENCHMARK_V1`).

---

## 1. Tehri Dam Complex Technical Parameters

- **Dam Name**: Tehri High Earth and Rockfill Dam
- **River**: Bhagirathi River (Tributary of Ganga)
- **Location**: $30.3781^\circ\text{N}, 78.4802^\circ\text{E}$, Tehri Garhwal District, Uttarakhand, India
- **Crest Elevation**: $830.0\text{ m MSL}$
- **Structural Height**: $260.5\text{ m}$ (Tallest dam in India, 5th tallest in the world)
- **Crest Length**: $575.0\text{ m}$
- **Crest Width**: $20.0\text{ m}$
- **Base Width**: $1,125.0\text{ m}$
- **Spillway Type**: Chute Spillway with 4 Radial Gates + 2 Tunnel Spillways
- **Spillway Capacity**: $15,540\text{ m}^3/\text{s}$
- **Data Provenance**: THDC India Ltd Official Technical Specifications & Central Water Commission (CWC) Dam Safety Audit.

---

## 2. Tehri Reservoir Hydrologic Data

- **Full Reservoir Level (FRL)**: $830.0\text{ m MSL}$
- **Minimum Drawdown Level (MDDL)**: $740.0\text{ m MSL}$
- **Gross Storage Capacity**: $3,540\text{ Mm}^3$ ($3.54\text{ km}^3$)
- **Live Storage Capacity**: $2,615\text{ Mm}^3$ ($2.615\text{ km}^3$)
- **Dead Storage Capacity**: $925\text{ Mm}^3$
- **Reservoir Surface Area at FRL**: $42.0\text{ km}^2$
- **Catchment Area**: $7,511\text{ km}^2$ (Glacial & snowmelt fed from Gangotri Glacier)
- **Probable Maximum Flood (PMF) Peak Inflow**: $15,350\text{ m}^3/\text{s}$

---

## 3. Topographic DEM & Coordinate System Audit

- **DEM Dataset**: NRSC / Bhuvan ALOS PALSAR 12.5m DEM
- **Study Domain Extent**: $30.350^\circ\text{N} - 30.400^\circ\text{N}, 78.450^\circ\text{E} - 78.510^\circ\text{E}$
- **Grid Resolution**: $25.0\text{ m}$ cell size ($30 \times 30$ calculation grid)
- **Min Elevation**: $380.0\text{ m MSL}$ (Downstream gorge)
- **Max Elevation**: $2,450.0\text{ m MSL}$ (Surrounding mountain ridges)
- **Projection**: EPSG:32644 (UTM Zone 44N) / EPSG:4326 (WGS84)

---

## 4. Critical Infrastructure Inventory

| Asset ID | Asset Name | Type | Latitude | Longitude | Ground Elevation ($m$) | Data Source / Provenance |
|---|---|---|---|---|---|---|
| `infra-hep-1000mw` | Tehri Hydroelectric Power Plant 1000MW | Power Station | $30.3765^\circ\text{N}$ | $78.4790^\circ\text{E}$ | $640.0\text{ m}$ | THDC Official Record (`REAL`) |
| `ast-road-access` | Tehri Dam Access Highway | Primary Road | $30.3750^\circ\text{N}$ | $78.4780^\circ\text{E}$ | $720.0\text{ m}$ | Uttarakhand PWD (`REAL`) |
| `infra-substation-01` | Tehri 400kV Power Substation | Substation | $30.3750^\circ\text{N}$ | $78.4770^\circ\text{E}$ | $710.0\text{ m}$ | THDC Electrical GIS (`DEMO`) |
| `bldg-emergency-01` | Tehri HADR Emergency Command Center | Building | $30.3710^\circ\text{N}$ | $78.4740^\circ\text{E}$ | $720.0\text{ m}$ | NRSC GIS Database (`DEMO`) |
| `bldg-hospital-01` | District Civil Hospital Tehri | Hospital | $30.3680^\circ\text{N}$ | $78.4720^\circ\text{E}$ | $680.0\text{ m}$ | Health Dept GIS (`REAL`) |
| `br-tehri-suspension` | Tehri Suspension Bridge | Bridge | $30.3730^\circ\text{N}$ | $78.4750^\circ\text{E}$ | $650.0\text{ m}$ | PWD Bridge Survey (`DEMO`) |
| `br-koti-crossing` | Koti Nala Highway Crossing | Bridge | $30.3600^\circ\text{N}$ | $78.4680^\circ\text{E}$ | $580.0\text{ m}$ | NHAI Bridge Database (`DEMO`) |
| `ast-sch-chamba` | Chamba High School & Relief Assembly | School | $30.3550^\circ\text{N}$ | $78.4650^\circ\text{E}$ | $610.0\text{ m}$ | Education Dept GIS (`DEMO`) |
