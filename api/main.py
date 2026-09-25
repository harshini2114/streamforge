from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from pathlib import Path
import json
import time
import urllib.request

from prometheus_client import (
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="StreamForge API",
    description="Real-time truck telemetry monitoring API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

ALERTS_FILE = BASE_DIR / "alerts.json"


# ============================================================
# WORKER STATE
# ============================================================

worker_state = {
    "worker-1": {
        "worker_id": "worker-1",
        "status": "RUNNING",
        "partition": 0,
    },
    "worker-2": {
        "worker_id": "worker-2",
        "status": "RUNNING",
        "partition": 1,
    },
    "worker-3": {
        "worker_id": "worker-3",
        "status": "RUNNING",
        "partition": 2,
    },
}


# ============================================================
# METRICS STATE
# ============================================================

metrics_state = {
    "events_per_second": 0.0,
    "processing_lag_ms": 0.0,
    "messages_processed": 0,
    "active_partitions": 3,
    "active_alerts": 0,
}


# ============================================================
# PROMETHEUS GAUGES
# ============================================================

events_per_second_gauge = Gauge(
    "streamforge_events_per_second",
    "Current StreamForge events per second",
)

processing_lag_gauge = Gauge(
    "streamforge_processing_lag_ms",
    "Latest StreamForge processing lag in milliseconds",
)

messages_processed_gauge = Gauge(
    "streamforge_messages_processed",
    "Number of processed StreamForge messages",
)

active_partitions_gauge = Gauge(
    "streamforge_active_partitions",
    "Number of active Kafka partitions",
)

active_alerts_gauge = Gauge(
    "streamforge_active_alerts",
    "Number of active StreamForge alerts",
)

healthy_workers_gauge = Gauge(
    "streamforge_healthy_workers",
    "Number of healthy StreamForge workers",
)


# ============================================================
# READ ALERTS
# ============================================================

def read_alerts():
    """
    Read alerts from the project-level alerts.json file.

    The file is located one directory above the api folder:
    streamforge/
        alerts.json
        api/
            main.py
    """

    alerts_file = Path(__file__).resolve().parent.parent / "alerts.json"

    if not alerts_file.exists():
        return []

    alerts = []

    try:
        with alerts_file.open("r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()

                if not line:
                    continue

                try:
                    alerts.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    except Exception:
        return []

    return alerts


# ============================================================
# CALCULATE METRICS
# ============================================================

def calculate_metrics():
    alerts = read_alerts()

    messages_processed = len(alerts)

    # --------------------------------------------------------
    # Events per second
    # --------------------------------------------------------

    events_per_second = 0.0

    if len(alerts) >= 2:
        timestamps = []

        for alert in alerts:
            timestamp = alert.get("timestamp")

            if timestamp:
                try:
                    timestamp_value = time.mktime(
                        time.strptime(
                            timestamp.split(".")[0],
                            "%Y-%m-%dT%H:%M:%S",
                        )
                    )

                    timestamps.append(timestamp_value)

                except Exception:
                    continue

        if len(timestamps) >= 2:
            timestamps.sort()

            time_window = timestamps[-1] - timestamps[0]

            if time_window > 0:
                events_per_second = (
                    len(timestamps) - 1
                ) / time_window

    # --------------------------------------------------------
    # Processing lag
    # --------------------------------------------------------

    processing_lag_ms = 0.0

    if alerts:
        latest_timestamp = alerts[-1].get("timestamp")

        if latest_timestamp:
            try:
                parsed_time = time.strptime(
                    latest_timestamp.split(".")[0],
                    "%Y-%m-%dT%H:%M:%S",
                )

                latest_epoch = time.mktime(parsed_time)

                processing_lag_ms = max(
                    0.0,
                    (time.time() - latest_epoch) * 1000,
                )

            except Exception:
                processing_lag_ms = 0.0

    # --------------------------------------------------------
    # Workers
    # --------------------------------------------------------

    healthy_workers = sum(
        1
        for worker in worker_state.values()
        if worker["status"] == "RUNNING"
    )

    # --------------------------------------------------------
    # Active alerts
    # --------------------------------------------------------

    active_alerts = min(len(alerts), 100)

    # --------------------------------------------------------
    # Store metrics
    # --------------------------------------------------------

    metrics_state["events_per_second"] = round(
        events_per_second,
        2,
    )

    metrics_state["processing_lag_ms"] = round(
        processing_lag_ms,
        2,
    )

    metrics_state["messages_processed"] = messages_processed

    metrics_state["active_partitions"] = 3

    metrics_state["active_alerts"] = active_alerts

    # --------------------------------------------------------
    # Prometheus update
    # --------------------------------------------------------

    events_per_second_gauge.set(
        metrics_state["events_per_second"]
    )

    processing_lag_gauge.set(
        metrics_state["processing_lag_ms"]
    )

    messages_processed_gauge.set(
        metrics_state["messages_processed"]
    )

    active_partitions_gauge.set(
        metrics_state["active_partitions"]
    )

    active_alerts_gauge.set(
        metrics_state["active_alerts"]
    )

    healthy_workers_gauge.set(
        healthy_workers
    )

    return {
        **metrics_state,
        "healthy_workers": healthy_workers,
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "name": "StreamForge API",
        "status": "running",
        "version": "1.0.0",
    }


# ============================================================
# SYSTEM STATUS
# ============================================================

@app.get("/api/status")
def get_status():
    metrics = calculate_metrics()

    return {
        "status": "ONLINE",
        "kafka": "HEALTHY",
        "workers": metrics["healthy_workers"],
        "partitions": metrics["active_partitions"],
        "processed": metrics["messages_processed"],
    }


# ============================================================
# WORKERS
# ============================================================

@app.get("/api/workers")
def get_workers():
    return {
        "workers": list(worker_state.values())
    }


@app.post("/api/workers/{worker_id}/fail")
def fail_worker(worker_id: str):

    if worker_id not in worker_state:
        return {
            "status": "ERROR",
            "message": "Worker not found",
        }

    worker_state[worker_id]["status"] = "FAILED"

    return {
        "status": "FAILED",
        "worker": worker_state[worker_id],
    }


@app.post("/api/workers/{worker_id}/recover")
def recover_worker(worker_id: str):

    if worker_id not in worker_state:
        return {
            "status": "ERROR",
            "message": "Worker not found",
        }

    worker_state[worker_id]["status"] = "RECOVERING"

    return {
        "status": "RECOVERING",
        "worker": worker_state[worker_id],
    }


@app.post("/api/workers/{worker_id}/resume")
def resume_worker(worker_id: str):

    if worker_id not in worker_state:
        return {
            "status": "ERROR",
            "message": "Worker not found",
        }

    worker_state[worker_id]["status"] = "RUNNING"

    return {
        "status": "RUNNING",
        "worker": worker_state[worker_id],
    }


# ============================================================
# METRICS API
# ============================================================

@app.get("/api/metrics")
def get_metrics():
    return calculate_metrics()


# ============================================================
# ALERTS API
# ============================================================

@app.get("/api/alerts")
def get_alerts():

    alerts = read_alerts()

    return alerts


# ============================================================
# PROMETHEUS METRICS ENDPOINT
# ============================================================

@app.get("/metrics")
def prometheus_metrics():

    calculate_metrics()

    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


# ============================================================
# PROMETHEUS QUERY API
# ============================================================

@app.get("/api/prometheus")
def get_prometheus_metrics():

    queries = {
        "events_per_second":
            "streamforge_events_per_second",

        "processing_lag_ms":
            "streamforge_processing_lag_ms",

        "messages_processed":
            "streamforge_messages_processed",

        "active_partitions":
            "streamforge_active_partitions",

        "active_alerts":
            "streamforge_active_alerts",

        "healthy_workers":
            "streamforge_healthy_workers",
    }

    result = {}

    for name, query in queries.items():

        try:

            url = (
                "http://127.0.0.1:9090/api/v1/query"
                f"?query={query}"
            )

            with urllib.request.urlopen(
                url,
                timeout=2,
            ) as response:

                data = json.loads(
                    response.read().decode("utf-8")
                )

            values = (
                data
                .get("data", {})
                .get("result", [])
            )

            if values:

                result[name] = float(
                    values[0]["value"][1]
                )

            else:

                result[name] = 0

        except Exception:

            result[name] = 0

    return {
        "status": "CONNECTED",
        "metrics": result,
    }


# ============================================================
# STARTUP MESSAGE
# ============================================================

@app.on_event("startup")
def startup_event():

    print("")
    print("=" * 60)
    print("🚀 StreamForge API Started")
    print("=" * 60)
    print(f"📁 Alerts file: {ALERTS_FILE}")
    print(f"📊 Alerts exist: {ALERTS_FILE.exists()}")
    print("=" * 60)
    print("")