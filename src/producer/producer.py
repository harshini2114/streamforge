import json
import random
import time
from datetime import datetime, timezone

from kafka import KafkaProducer


KAFKA_BROKER = "localhost:9092"
TOPIC_NAME = "truck-telemetry"


producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda value: json.dumps(value).encode("utf-8"),
)


def generate_telemetry():
    return {
        "truck_id": f"TRUCK-{random.randint(1, 10):03d}",
        "temperature": round(random.uniform(20.0, 40.0), 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def main():
    print("StreamForge telemetry producer started...")

    try:
        while True:
            event = generate_telemetry()

            producer.send(TOPIC_NAME, value=event)
            producer.flush()

            print(f"Sent: {event}")

            time.sleep(1)

    except KeyboardInterrupt:
        print("\nProducer stopped.")

    finally:
        producer.close()


if __name__ == "__main__":
    main()