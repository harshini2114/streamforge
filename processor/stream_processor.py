import json
import time
from collections import defaultdict
from rocksdict import Rdict


DB_PATH = "streamforge_state"

# Persistent RocksDB state
db = Rdict(DB_PATH)

# In-memory events for the current 5-minute window
window_events = defaultdict(list)

WINDOW_SECONDS = 300


def process_stream_event(telemetry):

    truck_id = telemetry["truck_id"]
    timestamp = float(telemetry["timestamp"])
    speed = telemetry["speed"]
    temperature = telemetry.get("temperature", 0.0)

    current_time = time.time()

    event = {
        "truck_id": truck_id,
        "temperature": temperature,
        "speed": speed,
        "timestamp": timestamp
    }

    # -----------------------------------------
    # LATE EVENT DETECTION
    # -----------------------------------------

    event_age = current_time - timestamp

    if event_age > WINDOW_SECONDS:

        late_key = f"late:{truck_id}:{timestamp}"

        db[late_key] = json.dumps({
            **event,
            "status": "LATE_EVENT",
            "detected_at": current_time
        })

        print("\n========== LATE EVENT ==========")
        print(f"Truck ID : {truck_id}")
        print(f"Event Age: {round(event_age, 2)} seconds")
        print("Status   : Late event stored")
        print("================================")

        return {
            "truck_id": truck_id,
            "window": "5-minute",
            "event_count": 0,
            "average_temperature": 0.0,
            "latest_speed": speed,
            "last_timestamp": timestamp,
            "late_event": True
        }

    # -----------------------------------------
    # ROCKSDB STATE
    # -----------------------------------------

    db_key = f"truck:{truck_id}"

    existing_state = db.get(db_key)

    if existing_state is None:

        should_update_state = True

    else:

        previous_state = json.loads(existing_state)

        should_update_state = (
            timestamp >= float(previous_state["last_timestamp"])
        )

    if should_update_state:

        db[db_key] = json.dumps({
            "truck_id": truck_id,
            "latest_temperature": temperature,
            "latest_speed": speed,
            "last_timestamp": timestamp
        })

    # -----------------------------------------
    # 5-MINUTE WINDOW
    # -----------------------------------------

    window_events[truck_id].append(event)

    window_events[truck_id] = [
        e for e in window_events[truck_id]
        if current_time - float(e["timestamp"]) <= WINDOW_SECONDS
    ]

    events = window_events[truck_id]

    if events:

        average_temperature = sum(
            e["temperature"] for e in events
        ) / len(events)

        latest_event = max(
            events,
            key=lambda e: float(e["timestamp"])
        )

        result = {
            "truck_id": truck_id,
            "window": "5-minute",
            "event_count": len(events),
            "average_temperature": round(
                average_temperature, 2
            ),
            "latest_speed": latest_event["speed"],
            "last_timestamp": latest_event["timestamp"],
            "late_event": False
        }

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