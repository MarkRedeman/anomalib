#!/usr/bin/env python3

import asyncio
import logging
from services.training_service import TrainingService

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

async def train_all_pending_jobs() -> None:
    """Main training loop that polls for jobs and trains models."""
    # Keep processing jobs until there are no more pending jobs
    while True:
        try:
            result = await TrainingService.train_pending_job()
            if result is None:
                logger.info("No more pending jobs found, exiting.")
                break
            logger.info(f"Successfully trained model: {result.name}")
        except Exception as e:
            logger.error(f"Error occurred in training loop: {e}", exc_info=True)


def main() -> None:
    """Entry point that runs the async function."""
    asyncio.run(train_all_pending_jobs())
    print("Finished all training jobs")

if __name__ == "__main__":
    main()
