from app.simulation.base_model import HydrodynamicModel
from app.simulation.simple_flood_model import SimpleFloodModel
from app.simulation.sph_model import ExperimentalSPHModel
from app.simulation.delft3d.adapter import Delft3DAdapter
from app.simulation.delft3d.config_generator import Delft3DConfigGenerator
from app.simulation.delft3d.input_builder import Delft3DInputBuilder
from app.simulation.delft3d.runner import Delft3DRunner, UNCONFIGURED_MESSAGE

def test_delft3d_architecture():
    print("Testing HydrodynamicModel interface hierarchy...")
    
    models = [
        SimpleFloodModel(),
        ExperimentalSPHModel(),
        Delft3DAdapter()
    ]

    for model in models:
        assert isinstance(model, HydrodynamicModel)
        st = model.get_status("test-run")
        print(f"Engine: {st.get('engine')} -> Status: {st.get('status')} (Available: {st.get('is_available')})")

    print("\nTesting Delft3DAdapter graceful unconfigured detection...")
    adapter = Delft3DAdapter()
    status_deck = adapter.get_status("sys-check")
    assert status_deck["message"] == UNCONFIGURED_MESSAGE
    print(f"Status Message: '{status_deck['message']}'")

    print("\nTesting Delft3D Config Generator...")
    mdf = Delft3DConfigGenerator.generate_mdf_file({"title": "Test Scenario", "duration_hr": 6.0})
    bct = Delft3DInputBuilder.generate_bct_file(50000.0)
    
    assert "Delft3D-FLOW" in mdf
    assert "table-name" in bct
    print("Generated MDF & BCT decks verified!")
    print("\nALL DELFT3D ARCHITECTURE TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_delft3d_architecture()
