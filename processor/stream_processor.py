import json
import time
from collections import defaultdict

from kafka import KafkaProducer
from rocksdict import Rdict


# ============================================================
# CONFIGURATION
# ============================================================

DB_PATH = "streamforge_state"

WINDOW_SECONDS = 300

CHANGELOG_TOPIC = "streamforge-state-changelog"


# ============================================================
# ROCKSDB
# ============================================================

db = Rdict(DB_PATH)


# ============================================================
# KAFKA CHANGELOG PRODUCER
# ============================================================

changelog_producer = KafkaProducer(
    bootstrap_servers="127.0.0.1:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)


# ============================================================
# IN-MEMORY WINDOW STATE
# ============================================================

window_events = defaultdict(list)


# ============================================================
# STREAM PROCESSING
# ============================================================

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

    # ========================================================
    # LATE EVENT DETECTION
    # ========================================================

    event_age = current_time - timestamp

    if event_age > WINDOW_SECONDS:

        late_key = f"late:{truck_id}:{timestamp}"

        late_event = {
            **event,
            "status": "LATE_EVENT",
            "detected_at": current_time
        }

        # Store late event in RocksDB
        db[late_key] = json.dumps(late_event)

        # Send late event to Kafka changelog
        changelog_producer.send(
            CHANGELOG_TOPIC,
            {
                "record_type": "LATE_EVENT",
                "key": late_key,
                "data": late_event
            }
        )

        changelog_producer.flush()

        print("\n========== LATE EVENT ==========")
        print(f"Truck ID : {truck_id}")
        print(f"Event Age: {round(event_age, 2)} seconds")
        print("Status   : Late event stored")
        print("Changelog: Kafka")
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

    # ========================================================
    # ROCKSDB LATEST STATE
    # ========================================================

    db_key = f"truck:{truck_id}"

    existing_state = db.get(db_key)

    if existing_state is None:

        should_update_state = True

    else:

        previous_state = json.loads(existing_state)

        should_update_state = (
            timestamp >= float(previous_state["last_timestamp"])
        )

    # ========================================================
    # UPDATE STATE
    # ========================================================

    if should_update_state:

        truck_state = {
            "truck_id": truck_id,
            "latest_temperature": temperature,
            "latest_speed": speed,
            "last_timestamp": timestamp
        }

        # Save state in RocksDB
        db[db_key] = json.dumps(truck_state)

        # Save same state in Kafka changelog
        changelog_producer.send(
            CHANGELOG_TOPIC,
            {
                "record_type": "TRUCK_STATE",
                "key": db_key,
                "data": truck_state
            }
        )

        changelog_producer.flush()

    # ========================================================
    # ADD EVENT TO 5-MINUTE WINDOW
    # ========================================================

    window_events[truck_id].append(event)

    # Remove events older than 5 minutes
    window_events[truck_id] = [
        e
        for e in window_events[truck_id]
        if current_time - float(e["timestamp"]) <= WINDOW_SECONDS
    ]

    events = window_events[truck_id]

    # ========================================================
    # CALCULATE ROLLING TEMPERATURE AVERAGE
    # ========================================================

    if events:

        average_temperature = sum(
            e["temperature"]
            for e in events
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
                average_temperature,
                2
            ),
            "latest_speed": latest_event["speed"],
            "last_timestamp": latest_event["timestamp"],
            "late_event": False
        }

        # ====================================================
        # SAVE WINDOW RESULT TO ROCKSDB
        # ====================================================

        window_key = f"window:{truck_id}"

        db[window_key] = json.dumps(result)

        # ====================================================
        # SAVE WINDOW RESULT TO KAFKA CHANGELOG
        # ====================================================

        changelog_producer.send(
            CHANGELOG_TOPIC,
            {
                "record_type": "WINDOW_RESULT",
                "key": window_key,
                "data": result
            }
        )

        changelog_producer.flush()

        return result

    return None


# ============================================================
# GET TRUCK STATE
# ============================================================

def get_truck_state(truck_id):

    value = db.get(
        f"truck:{truck_id}"
    )

    if value is None:
        return None

    return json.loads(value)


# ============================================================
# GET WINDOW RESULT
# ============================================================

def get_window_result(truck_id):

    value = db.get(
        f"window:{truck_id}"
    )

    if value is None:
        return None

    return json.loads(value)


# ============================================================
# CLOSE RESOURCES
# ============================================================

def close_stream_processor():

    try:
        changelog_producer.flush()
        changelog_producer.close()
    except Exception:
        pass

    try:
        db.close()
    except Exception:
        pass