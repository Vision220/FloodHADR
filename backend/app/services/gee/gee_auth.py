import os
import json
import logging
from typing import Tuple, Optional
from app.services.gee.gee_config import GEEConfig

logger = logging.getLogger("FloodHADR.GEEAuth")

class GEEAuth:
    _initialized = False
    _authenticated = False
    _project_id: Optional[str] = None
    _status_message = "Google Earth Engine not configured"

    @classmethod
    def initialize(cls) -> Tuple[bool, str]:
        """
        Server-side authentication for Google Earth Engine.
        Fails gracefully if credentials are not present or invalid.
        """
        if cls._initialized:
            return cls._authenticated, cls._status_message

        cls._initialized = True
        project_id = GEEConfig.PROJECT_ID or os.getenv("GEE_PROJECT_ID")
        service_account = GEEConfig.SERVICE_ACCOUNT or os.getenv("GEE_SERVICE_ACCOUNT")
        private_key = GEEConfig.PRIVATE_KEY or os.getenv("GEE_PRIVATE_KEY")
        cred_file = GEEConfig.CREDENTIALS_FILE or os.getenv("GEE_CREDENTIALS_FILE")

        try:
            import ee
            if cred_file and os.path.exists(cred_file):
                logger.info(f"Authenticating GEE using service account file: {cred_file}")
                credentials = ee.ServiceAccountCredentials(service_account, cred_file)
                ee.Initialize(credentials, project=project_id)
                cls._authenticated = True
                cls._project_id = project_id or "service-account-auth"
                cls._status_message = "Google Earth Engine authenticated via service account file"
                return True, cls._status_message

            elif service_account and private_key:
                logger.info(f"Authenticating GEE using inline service account credentials: {service_account}")
                credentials = ee.ServiceAccountCredentials(service_account, key_data=private_key)
                ee.Initialize(credentials, project=project_id)
                cls._authenticated = True
                cls._project_id = project_id
                cls._status_message = "Google Earth Engine authenticated via inline service account"
                return True, cls._status_message

            else:
                # Attempt default local EE initialization if user logged in via 'earthengine authenticate'
                try:
                    ee.Initialize(project=project_id)
                    cls._authenticated = True
                    cls._project_id = project_id or "default-user-auth"
                    cls._status_message = "Google Earth Engine authenticated via local user profile"
                    return True, cls._status_message
                except Exception as local_err:
                    cls._authenticated = False
                    cls._status_message = f"GEE Credentials missing. Local init failed: {str(local_err)}"
                    logger.warning(cls._status_message)
                    return False, cls._status_message

        except ModuleNotFoundError:
            cls._authenticated = False
            cls._status_message = "earthengine-api Python package is not installed."
            logger.warning(cls._status_message)
            return False, cls._status_message

        except Exception as e:
            cls._authenticated = False
            cls._status_message = f"Google Earth Engine auth error: {str(e)}"
            logger.error(cls._status_message)
            return False, cls._status_message

    @classmethod
    def get_status(cls) -> dict:
        auth_status, msg = cls.initialize()
        return {
            "enabled": True,
            "authenticated": auth_status,
            "project": cls._project_id or (GEEConfig.PROJECT_ID or "Not Configured"),
            "service": "Google Earth Engine Data Catalog",
            "message": msg,
            "mode": "REAL_GEE_AUTHENTICATED" if auth_status else "DEMO_DATA_MODE"
        }
