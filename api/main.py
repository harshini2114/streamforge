from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(title="StreamForge API")


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STATUS API
# ============================================================

@app.get("/api/status")
def get_status():
    return {
        "system": "StreamForge",
        "status": "RUNNING",
        "kafka": "localhost:9092",
        "topic": "truck-telemetry",
        "workers": 3,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================
# WORKERS API
# ============================================================

@app.get("/api/workers")
def get_workers():
    return {
        "workers": [
            {
                "worker_id": "worker-1",
                "status": "RUNNING",
                "partition": 0
            },
            {
                "worker_id": "worker-2",
                "status": "RUNNING",
                "partition": 1
            },
            {
                "worker_id": "worker-3",
                "status": "RUNNING",
                "partition": 2
            }
        ]
    }


# ============================================================
# METRICS API
# ============================================================

@app.get("/api/metrics")
def get_metrics():
    return {
        "events_per_second": 42.8,
        "processing_lag_ms": 28,
        "messages_processed": 18420,
        "active_partitions": 3,
        "active_alerts": 2
    }


# ============================================================
# ALERTS API
# ============================================================

@app.get("/api/alerts")
def get_alerts():
    return {
        "alerts": [
            {
                "alert_type": "OVERSPEED",
                "truck_id": "TRUCK-007",
                "speed": 92.4,
                "threshold": 80,
                "status": "OVERSPEEDING"
            },
            {
                "alert_type": "OVERSPEED",
                "truck_id": "TRUCK-003",
                "speed": 87.6,
                "threshold": 80,
                "status": "OVERSPEEDING"
            }
        ]
    }