from app.simulation.sph.sph_engine import sph_engine

def test_sph():
    print("Testing SPH Engine dam break simulation...")
    res = sph_engine.run_dam_break_simulation(column_width_m=15.0, column_height_m=10.0, total_time_sec=2.0, fps=5)
    
    assert res["status"] == "SUCCESS"
    assert res["is_experimental_prototype"] is True
    assert len(res["frames"]) == 10
    
    p0 = res["frames"][0]["particles"][0]
    assert "x" in p0 and "y" in p0 and "z" in p0
    assert "velocity_x" in p0 and "velocity_y" in p0
    assert "density" in p0 and "pressure" in p0 and "mass" in p0

    metrics = res["summary_metrics"]
    print(f"SPH Execution Succeeded! Frames: {len(res['frames'])}, Particles: {metrics['particle_count']}, Peak Velocity: {metrics['max_velocity_ms']} m/s, Exec Time: {metrics['execution_time_sec']}s")
    print("ALL SPH ENGINE VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_sph()
