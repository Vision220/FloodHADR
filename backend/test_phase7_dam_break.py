"""
backend/test_phase7_dam_break.py

Regression verification tests for Phase 7 Tehri Dam Break & Breach Model.

Proves:
1. Changing breach width MUST change the discharge hydrograph Q_b(t).
2. Changing formation time MUST change the discharge hydrograph Q_b(t).
3. Changing reservoir elevation MUST change the discharge hydrograph Q_b(t).
4. All 6 breach modes (PARTIAL, RAPID, SLOW, USER_DEFINED, OVERTOPPING, PIPING) generate valid time-series arrays.
5. All output datasets carry provenance: "SCENARIO" and an uncalibrated disclaimer notice.
6. REST API endpoints (/api/scenarios/breach/modes, /api/scenarios/breach/simulate) function correctly.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app
from app.simulation.dam_break import (
    DamBreachModel,
    BreachMode,
    run_authoritative_dam_break_simulation
)

client = TestClient(app)

class TestPhase7DamBreakModel(unittest.TestCase):

    def test_01_breach_width_sensitivity(self):
        """REGRESSION TEST: Prove changing breach width MUST change the hydrograph."""
        m_narrow = DamBreachModel(mode=BreachMode.USER_DEFINED, breach_width_m=60.0, reservoir_level_m=830.0)
        m_medium = DamBreachModel(mode=BreachMode.USER_DEFINED, breach_width_m=120.0, reservoir_level_m=830.0)
        m_wide = DamBreachModel(mode=BreachMode.USER_DEFINED, breach_width_m=180.0, reservoir_level_m=830.0)

        res_narrow = m_narrow.calculate_breach_hydrograph()
        res_medium = m_medium.calculate_breach_hydrograph()
        res_wide = m_wide.calculate_breach_hydrograph()

        q_narrow = res_narrow["summary_metrics"]["peak_discharge_m3s"]
        q_medium = res_medium["summary_metrics"]["peak_discharge_m3s"]
        q_wide = res_wide["summary_metrics"]["peak_discharge_m3s"]

        self.assertLess(q_narrow, q_medium)
        self.assertLess(q_medium, q_wide)

        print(f"\n  [PASS] Test 1: PROVED — Changing breach width changes hydrograph:")
        print(f"         Width = 60m  -> Peak Q = {q_narrow} m3/s")
        print(f"         Width = 120m -> Peak Q = {q_medium} m3/s")
        print(f"         Width = 180m -> Peak Q = {q_wide} m3/s")

    def test_02_formation_time_sensitivity(self):
        """REGRESSION TEST: Prove changing formation time MUST change the hydrograph."""
        m_rapid = DamBreachModel(mode=BreachMode.USER_DEFINED, breach_width_m=150.0, breach_formation_time_hr=0.5)
        m_normal = DamBreachModel(mode=BreachMode.USER_DEFINED, breach_width_m=150.0, breach_formation_time_hr=1.5)
        m_slow = DamBreachModel(mode=BreachMode.USER_DEFINED, breach_width_m=150.0, breach_formation_time_hr=3.0)

        res_rapid = m_rapid.calculate_breach_hydrograph()
        res_normal = m_normal.calculate_breach_hydrograph()
        res_slow = m_slow.calculate_breach_hydrograph()

        t_rapid = res_rapid["summary_metrics"]["time_to_peak_hr"]
        t_slow = res_slow["summary_metrics"]["time_to_peak_hr"]

        q_rapid = res_rapid["summary_metrics"]["peak_discharge_m3s"]
        q_slow = res_slow["summary_metrics"]["peak_discharge_m3s"]

        self.assertLess(t_rapid, t_slow)
        self.assertGreater(q_rapid, q_slow)

        print(f"  [PASS] Test 2: PROVED — Changing formation time changes hydrograph:")
        print(f"         tf = 0.5h (RAPID) -> Peak Q = {q_rapid} m3/s at t = {t_rapid} h")
        print(f"         tf = 1.5h (NORM)  -> Peak Q = {res_normal['summary_metrics']['peak_discharge_m3s']} m3/s at t = {res_normal['summary_metrics']['time_to_peak_hr']} h")
        print(f"         tf = 3.0h (SLOW)  -> Peak Q = {q_slow} m3/s at t = {t_slow} h")

    def test_03_reservoir_level_sensitivity(self):
        """REGRESSION TEST: Prove changing reservoir level MUST change the hydrograph."""
        m_low = DamBreachModel(mode=BreachMode.OVERTOPPING, reservoir_level_m=740.0)
        m_mid = DamBreachModel(mode=BreachMode.OVERTOPPING, reservoir_level_m=830.0)
        m_high = DamBreachModel(mode=BreachMode.OVERTOPPING, reservoir_level_m=839.5)

        res_low = m_low.calculate_breach_hydrograph()
        res_mid = m_mid.calculate_breach_hydrograph()
        res_high = m_high.calculate_breach_hydrograph()

        q_low = res_low["summary_metrics"]["peak_discharge_m3s"]
        q_mid = res_mid["summary_metrics"]["peak_discharge_m3s"]
        q_high = res_high["summary_metrics"]["peak_discharge_m3s"]

        self.assertLess(q_low, q_mid)
        self.assertLess(q_mid, q_high)

        print(f"  [PASS] Test 3: PROVED — Changing reservoir elevation changes hydrograph:")
        print(f"         H0 = 740.0m -> Peak Q = {q_low} m3/s")
        print(f"         H0 = 830.0m -> Peak Q = {q_mid} m3/s")
        print(f"         H0 = 839.5m -> Peak Q = {q_high} m3/s")

    def test_04_all_modes_and_provenance_labeling(self):
        """Verify all 6 breach modes and provenance='SCENARIO' labeling."""
        modes = [BreachMode.PARTIAL, BreachMode.RAPID, BreachMode.SLOW, BreachMode.USER_DEFINED, BreachMode.OVERTOPPING, BreachMode.PIPING]

        for m in modes:
            model = DamBreachModel(mode=m)
            res = model.calculate_breach_hydrograph()
            
            self.assertEqual(res["provenance"], "SCENARIO")
            self.assertIn("SCENARIO ESTIMATE", res["calibration_notice"])
            self.assertEqual(len(res["summary_arrays"]["breach_width"]), len(res["summary_arrays"]["breach_discharge"]))
            self.assertEqual(len(res["time_series"]), 72)  # 12h @ 10min steps = 72 steps

        print("  [PASS] Test 4: All 6 breach modes & provenance='SCENARIO' labeling verified.")

    def test_05_rest_api_breach_endpoints(self):
        """Verify REST API endpoints (/api/scenarios/breach/modes and /api/scenarios/breach/simulate)."""
        # 1. GET modes
        res_m = client.get("/api/scenarios/breach/modes")
        self.assertEqual(res_m.status_code, 200)
        self.assertEqual(len(res_m.json()["modes"]), 6)

        # 2. POST simulate
        res_sim = client.post(
            "/api/scenarios/breach/simulate",
            json={
                "mode": "PIPING",
                "breach_width_m": 150.0,
                "breach_formation_time_hr": 2.0,
                "reservoir_level_m": 830.0
            }
        )
        self.assertEqual(res_sim.status_code, 200)
        sim_json = res_sim.json()
        self.assertEqual(sim_json["provenance"], "SCENARIO")
        self.assertIn("summary_arrays", sim_json)
        self.assertGreater(sim_json["summary_metrics"]["peak_discharge_m3s"], 0)
        print("  [PASS] Test 5: REST API breach simulation endpoints verified.")


if __name__ == "__main__":
    unittest.main()
