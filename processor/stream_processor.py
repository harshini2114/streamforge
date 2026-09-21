import json
import time
from collections import defaultdict
from datetime import datetime
from rocksdict import Rdict


DB_PATH = "streamforge_state"

# Persistent state
db = Rdict(DB_PATH)

# In-memory events for the current 5-minute window
window_events = defaultdict(list)

WINDOW_SECONDS = 300


def process_stream_event(telemetry):
    truck_id = telemetry["truck_id"]
    timestamp = telemetry["timestamp"]
    speed = telemetry["speed"]

    # Use temperature if available.
    # Current producer doesn't generate temperature yet.
    temperature = telemetry.get("temperature", 0.0)

    event = {
        "truck_id": truck_id,
        "temperature": temperature,
        "speed": speed,
        "timestamp": timestamp
    }

    # Store persistent latest state in RocksDB
    db_key = f"truck:{truck_id}"

    db[db_key] = json.dumps({
        "truck_id": truck_id,
        "latest_temperature": temperature,
        "latest_speed": speed,
        "last_timestamp": timestamp
    })

    # Add event to current window
    window_events[truck_id].append(event)

    # Remove events older than 5 minutes
    current_time = time.time()

    window_events[truck_id] = [
        e for e in window_events[truck_id]
        if current_time - float(e["timestamp"]) <= WINDOW_SECONDS
    ]

    events = window_events[truck_id]

    if events:
        avg_temperature = sum(
            e["temperature"] for e in events
        ) / len(events)

        result = {
            "truck_id": truck_id,
            "window": "5-minute",
            "event_count": len(events),
            "average_temperature": round(avg_temperature, 2),
            "latest_speed": speed,
            "last_timestamp": timestamp
        }

        # Save aggregation result in RocksDB
        db[f"window:{truck_id}"] = json.dumps(result)

        return result

    return None


def get_truck_state(truck_id):
    value = db.get(f"truck:{truck_id}")

    if value is None:
        return None

    return json.loads(value)


def get_window_result(truck_id):
    value = db.get(f"window:{truck_id}")

    if value is None:
        return None

    return json.loads(value)