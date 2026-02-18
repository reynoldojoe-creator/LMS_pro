import sys
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.info("Starting import of app.main")
try:
    from app.main import app
    logger.info("Successfully imported app.main")
except Exception as e:
    logger.exception("Failed to import app.main")
    sys.exit(1)
