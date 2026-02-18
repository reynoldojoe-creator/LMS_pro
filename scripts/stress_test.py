import asyncio
import aiohttp
import time
import statistics
import json
import logging
from dataclasses import dataclass
from typing import List, Dict

# Configuration
BASE_URL = "http://localhost:8000/api"
SUBJECT_ID = 1 # Replace with valid ID
TOPIC_ID = 1   # Replace with valid ID
CONCURRENT_USERS = 5 # Keep low for local LLM
TOTAL_REQUESTS = 10

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("StressTest")

@dataclass
class RequestStats:
    endpoint: str
    status: int
    latency: float
    error: str = None

async def generate_questions(session: aiohttp.ClientSession, request_id: int) -> RequestStats:
    url = f"{BASE_URL}/subjects/{SUBJECT_ID}/topics/{TOPIC_ID}/questions/generate"
    payload = {
        "count": 1, # Minimal count for speed
        "question_types": ["MCQ"],
        "difficulty": "Medium",
        "blooms_levels": ["Understand"]
    }
    
    start_time = time.time()
    try:
        async with session.post(url, json=payload, timeout=60) as response:
            latency = time.time() - start_time
            status = response.status
            error = None
            if status != 200:
                text = await response.text()
                error = f"HTTP {status}: {text[:100]}"
                logger.error(f"Req {request_id} Failed: {error}")
            else:
                logger.info(f"Req {request_id} Success: {latency:.2f}s")
                
            return RequestStats("generate_questions", status, latency, error)
            
    except Exception as e:
        latency = time.time() - start_time
        logger.error(f"Req {request_id} Error: {str(e)}")
        return RequestStats("generate_questions", 0, latency, str(e))

async def run_stress_test():
    logger.info(f"Starting Stress Test: {CONCURRENT_USERS} users, {TOTAL_REQUESTS} total requests")
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(TOTAL_REQUESTS):
            tasks.append(generate_questions(session, i))
            # Optional: staggering
            # await asyncio.sleep(0.5) 
        
        # Run in batches of CONCURRENT_USERS
        results = []
        for i in range(0, len(tasks), CONCURRENT_USERS):
            batch = tasks[i:i+CONCURRENT_USERS]
            batch_results = await asyncio.gather(*batch)
            results.extend(batch_results)
            
    # Analysis
    logger.info("--- Test Complete ---")
    analyze_results(results)

def analyze_results(results: List[RequestStats]):
    successful = [r for r in results if r.status == 200]
    failed = [r for r in results if r.status != 200]
    
    logger.info(f"Total Requests: {len(results)}")
    logger.info(f"Successful: {len(successful)}")
    logger.info(f"Failed: {len(failed)}")
    
    if successful:
        latencies = [r.latency for r in successful]
        logger.info(f"Latency (Avg): {statistics.mean(latencies):.2f}s")
        logger.info(f"Latency (Median): {statistics.median(latencies):.2f}s")
        logger.info(f"Latency (Max): {max(latencies):.2f}s")
        logger.info(f"Latency (Min): {min(latencies):.2f}s")
        
    if failed:
        logger.info("Errors:")
        for r in failed[:5]:
            logger.info(f" - {r.error}")

if __name__ == "__main__":
    # Ensure server is running before running this
    print("Ensure the backend server is running on http://localhost:8000")
    # time.sleep(2) 
    asyncio.run(run_stress_test())
