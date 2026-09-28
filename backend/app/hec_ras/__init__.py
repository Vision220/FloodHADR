"""
backend/app/hec_ras/__init__.py

HEC-RAS 2D Reference Model Generator, Runner, and Validation Suite.
Provides authoritative USACE HEC-RAS project generation, executable runner detection,
results parsing, and FloodHADR parameter equivalence validation.
"""

from app.hec_ras.hec_ras_project import HECRASProjectGenerator, HECRASProjectConfig
from app.hec_ras.hec_ras_terrain import HECRASTerrainExporter, HECRASTerrainConfig
from app.hec_ras.hec_ras_geometry import HECRASGeometryGenerator, HECRASGeometryConfig
from app.hec_ras.hec_ras_mesh import HECRASMeshGenerator, HECRAS2DMeshGenerator, HECRASMeshConfig, MeshResolutionPreset, Breakline, RefinementRegion
from app.hec_ras.hec_ras_breach import HECRASBreachGenerator, HECRASBreachConfig
from app.hec_ras.hec_ras_plan import HECRASPlanGenerator, HECRASPlanConfig
from app.hec_ras.hec_ras_runner import HECRASRunner, HECRASExecutionStatus
from app.hec_ras.hec_ras_results import HECRASResultsParser
from app.hec_ras.hec_ras_validation import HECRASValidationSuite
from app.hec_ras.hec_ras_2d_model import HECRAS2DModelBuilder, HECRAS2DModelConfig
from app.hec_ras.hec_ras_importer import HECRASResultImporter

__all__ = [
    "HECRASProjectGenerator",
    "HECRASProjectConfig",
    "HECRASTerrainExporter",
    "HECRASTerrainConfig",
    "HECRASGeometryGenerator",
    "HECRASGeometryConfig",
    "HECRASMeshGenerator",
    "HECRAS2DMeshGenerator",
    "HECRASMeshConfig",
    "MeshResolutionPreset",
    "Breakline",
    "RefinementRegion",
    "HECRASBreachGenerator",
    "HECRASBreachConfig",
    "HECRASPlanGenerator",
    "HECRASPlanConfig",
    "HECRASRunner",
    "HECRASExecutionStatus",
    "HECRASResultsParser",
    "HECRASValidationSuite",
    "HECRAS2DModelBuilder",
    "HECRAS2DModelConfig",
    "HECRASResultImporter",
]

