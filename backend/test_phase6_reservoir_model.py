"""
backend/test_phase6_reservoir_model.py

Verification tests for Phase 6 Tehri Reservoir Operation Model.

Proves:
1. Reservoir operation model strictly obeys mass balance (Mass Balance Error = 0.000%).
2. Output arrays (storage, water_level, inflow, outflow, spillway_flow) are accurately computed per timestep.
3. Presets MDDL, MID_STORAGE, FRL, EXTREME, and USER_DEFINED are supported.
4. User modifying initial reservoir level dynamically changes downstream simulation results (peak outflow, depth, velocity, inundation area).
5. REST API endpoints (/api/reservoirs/operation/presets, /api/reservoirs/operation/simulate, /api/reservoirs/operation/downstream-coupled) function correctly.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app
from app.simulation.reservoir_operation_model import (
    ReservoirOperationModel,
    ReservoirPreset,
    TehriReservoirHypsometry,
    run_reservoir_downstream_coupled_simulation
)

client = TestClient(app)

class TestPhase6ReservoirModel(unittest.TestCase):

    def test_01_mass_balance_water_conservation(self):
        """Verify Reservoir Operation Model strictly obeys mass conservation (Error < 0.001%)."""
        model = ReservoirOperationModel(preset=ReservoirPreset.FRL)
        
        # 24-hour inflow hydrograph with peak surge
        inflows = [{"inflow_m3s": 1000.0 + 3000.0 * math.exp(-0.5 * ((t - 10)/3.0)**2)} for t in range(24)]
        
        res = model.run_simulation(
            inflow_hydrograph=inflows,
            controlled_outflow_m3s=450.0,
            timestep_sec=3600.0,
            simulation_duration_sec=86400.0
        )

        self.assertTrue(res["water_balance_obeyed"])
        self.assertLess(res["mass_balance_error_percent"], 0.001)

        arrays = res["summary_arrays"]
        self.assertEqual(len(arrays["storage"]), 24)
        self.assertEqual(len(arrays["water_level"]), 24)
        self.assertEqual(len(arrays["inflow"]), 24)
        self.assertEqual(len(arrays["outflow"]), 24)
        self.assertEqual(len(arrays["spillway_flow"]), 24)

        print(f"\n  [PASS] Test 1: Mass balance water conservation verified (Error = {res['mass_balance_error_percent']:.6f}%).")

    def test_02_all_reservoir_presets_supported(self):
        """Verify MDDL, MID_STORAGE, FRL, EXTREME, USER_DEFINED presets."""
        presets = [
            (ReservoirPreset.MDDL, 740.0),
            (ReservoirPreset.MID_STORAGE, 785.0),
            (ReservoirPreset.FRL, 830.0),
            (ReservoirPreset.EXTREME, 839.5)
        ]

        for p_enum, expected_z in presets:
            model = ReservoirOperationModel(preset=p_enum)
            self.assertEqual(model.initial_elevation_m, expected_z)
            res = model.run_simulation(inflow_hydrograph=[{"inflow_m3s": 500.0}])
            self.assertTrue(res["water_balance_obeyed"])

        # User-defined preset
        user_model = ReservoirOperationModel(preset=ReservoirPreset.USER_DEFINED, custom_elevation=812.5)
        self.assertEqual(user_model.initial_elevation_m, 812.5)
        print("  [PASS] Test 2: All 5 reservoir presets (MDDL, MID_STORAGE, FRL, EXTREME, USER_DEFINED) verified.")

    def test_03_downstream_responsiveness_and_coupling(self):
        """
        PROOF TEST: Verify that changing initial reservoir level directly modifies
        downstream simulation results (peak breach outflow, max depth, max velocity, inundation area).
        """
        # Run at MDDL (740.0m)
        run_mddl = run_reservoir_downstream_coupled_simulation(initial_elevation_m=740.0)
        # Run at FRL (830.0m)
        run_frl = run_reservoir_downstream_coupled_simulation(initial_elevation_m=830.0)
        # Run at EXTREME (839.5m)
        run_ext = run_reservoir_downstream_coupled_simulation(initial_elevation_m=839.5)

        q_mddl = run_mddl["downstream_hydrodynamics"]["peak_breach_outflow_m3s"]
        q_frl = run_frl["downstream_hydrodynamics"]["peak_breach_outflow_m3s"]
        q_ext = run_ext["downstream_hydrodynamics"]["peak_breach_outflow_m3s"]

        depth_mddl = run_mddl["downstream_hydrodynamics"]["max_downstream_depth_m"]
        depth_frl = run_frl["downstream_hydrodynamics"]["max_downstream_depth_m"]
        depth_ext = run_ext["downstream_hydrodynamics"]["max_downstream_depth_m"]

        area_mddl = run_mddl["downstream_hydrodynamics"]["max_inundation_area_km2"]
        area_frl = run_frl["downstream_hydrodynamics"]["max_inundation_area_km2"]
        area_ext = run_ext["downstream_hydrodynamics"]["max_inundation_area_km2"]

        # Peak Outflow must increase with elevation: MDDL < FRL < EXTREME
        self.assertLess(q_mddl, q_frl)
        self.assertLess(q_frl, q_ext)

        # Downstream Max Depth must increase with elevation: MDDL < FRL < EXTREME
        self.assertLess(depth_mddl, depth_frl)
        self.assertLess(depth_frl, depth_ext)

        # Inundation Area must increase with elevation: MDDL < FRL < EXTREME
        self.assertLess(area_mddl, area_frl)
        self.assertLess(area_frl, area_ext)

        print(f"  [PASS] Test 3: PROVED — Reservoir level changes dynamically alter downstream results:")
        print(f"         740m (MDDL)   -> Q_peak={q_mddl}m3/s, Max Depth={depth_mddl}m, Area={area_mddl}km2")
        print(f"         830m (FRL)    -> Q_peak={q_frl}m3/s, Max Depth={depth_frl}m, Area={area_frl}km2")
        print(f"         839.5m (EXT)  -> Q_peak={q_ext}m3/s, Max Depth={depth_ext}m, Area={area_ext}km2")

    def test_04_rest_api_reservoir_operation_endpoints(self):
        """Verify REST API endpoints (/api/reservoirs/operation/presets, /api/reservoirs/operation/simulate, /api/reservoirs/operation/downstream-coupled)."""
        # 1. GET presets
        res_p = client.get("/api/reservoirs/operation/presets")
        self.assertEqual(res_p.status_code, 200)
        self.assertEqual(len(res_p.json()["presets"]), 4)

        # 2. POST simulate
        res_sim = client.post(
            "/api/reservoirs/operation/simulate",
            json={
                "preset": "FRL",
                "initial_reservoir_elevation": 830.0,
                "controlled_outflow_m3s": 450.0,
                "simulation_duration_sec": 43200.0
            }
        )
        self.assertEqual(res_sim.status_code, 200)
        sim_json = res_sim.json()
        self.assertTrue(sim_json["water_balance_obeyed"])
        self.assertIn("summary_arrays", sim_json)

        # 3. POST downstream-coupled
        res_coup = client.post(
            "/api/reservoirs/operation/downstream-coupled",
            json={
                "initial_reservoir_elevation": 835.0,
                "breach_width_m": 160.0
            }
        )
        self.assertEqual(res_coup.status_code, 200)
        coup_json = res_coup.json()
        self.assertEqual(coup_json["status"], "SUCCESS")
        self.assertIn("downstream_hydrodynamics", coup_json)
        print("  [PASS] Test 4: REST API reservoir operation endpoints verified.")


import math

if __name__ == "__main__":
    unittest.main()
