# PHASE 30 — TRUE TEMPORAL HYDRODYNAMIC ANIMATION

## Executive Summary & Frame Integrity Mandate
Phase 30 replaces decorative flood animation loops with **true time-indexed simulation frames**. Every frame $t_0, t_1, t_2, \dots, t_n$ is loaded directly from 2D SWE/DWE solver simulation outputs.

### Governing Animation Rule:
> **"The timeline MUST represent real model timestamps ($T + Z.Z\,\text{hr}$, Step $X / Y$). Decorative interpolation between unrelated static polygons is strictly forbidden. If no temporal simulation frames exist, animation controls are disabled with explicit notice."**

---

## 1. Frame Payload Architecture (`SimulationFramePayload`)

For every timestep $t$, the animation engine loads:
* `depth[t]`: 2D water depth grid ($h$).
* `velocity[t]`: 2D velocity magnitude grid ($V = \sqrt{u^2 + v^2}$).
* `velocity_x[t]`: 2D eastward velocity grid ($u$).
* `velocity_y[t]`: 2D northward velocity grid ($v$).
* `water_surface[t]`: 2D WSE grid ($WSE = Z_{\text{dem}} + h$).
* `wet_mask[t]`: Binary wet cell mask ($h \ge 0.05\,\text{m}$).

---

## 2. Dynamic Reactive Updates Across System

When the user moves the timeline scrubber or plays the animation:

1. **2D Flood Extent**: Polygon boundary is dynamically regenerated from `wet_mask[t]`.
2. **Depth Visualization**: Color classification styling updates $1:1$ with `depth[t]`.
3. **Velocity Vectors**: Velocity magnitude and directional arrows update $1:1$ with `velocity_x[t]` and `velocity_y[t]`.
4. **3D Digital Twin Water Surface**: Three.js water mesh vertex heights update $1:1$ with `water_surface[t]` via `Map3DSynchronizationService.ts`.
5. **Infrastructure Status**: Critical asset submergence status updates dynamically when $h \ge 0.5\,\text{m}$ (e.g. `NORMAL` $\rightarrow$ `WARNING` $\rightarrow$ `SUBMERGED`).
6. **Virtual Gauges**: Hydrograph stage markers and flow rates update $1:1$ for Dam Toe, Koti Village, Devprayag, and Rishikesh.

---

## 3. Timeline Scrubber UI Controls

Updated [`TimelineScrubber.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/components/Timeline/TimelineScrubber.tsx):

* **Play / Pause**: Starts or pauses time step progression.
* **Previous / Next Step**: Steps backward/forward one frame ($t_{k-1}$ or $t_{k+1}$).
* **Playback Speed**: $0.5\times, 1.0\times, 2.0\times, 5.0\times$ speed options.
* **Timestamp Header**: Displays `T + 4.8 hr` and `Step 24 / 72`.
* **Range Scrubber**: Continuous scrub handle from $0\,\text{m}$ to $360\,\text{m}$.
* **Disabled Banner**: Displays `ANIMATION DISABLED — NO TEMPORAL RESULT AVAILABLE` when results are absent.

---

## 4. Deliverables & Verification

1. **Documentation**: Created [`docs/PHASE_30_TEMPORAL_ANIMATION.md`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/docs/PHASE_30_TEMPORAL_ANIMATION.md).
2. **Backend Animation Service**: Created [`backend/app/simulation/temporal_animation_service.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/app/simulation/temporal_animation_service.py).
3. **Frontend Timeline Scrubber**: Upgraded [`frontend/src/components/Timeline/TimelineScrubber.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/components/Timeline/TimelineScrubber.tsx).
4. **Automated Unit Tests**: Created [`backend/test_phase30_temporal_animation.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/test_phase30_temporal_animation.py) (`Ran 5 tests in 0.301s - OK`).
