from kafka import KafkaProducer
import json
import time
import random

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

while True:
    telemetry = {
        "truck_id": f"TRUCK-{random.randint(1, 10):03d}",
        "speed": round(random.uniform(20, 100), 2),
        "latitude": round(random.uniform(16.4, 17.0), 6),
        "longitude": round(random.uniform(80.0, 81.0), 6),
        "timestamp": time.time()
    }

    producer.send("truck-telemetry", telemetry)
    producer.flush()

    print("Sent:", telemetry)

    time.sleep(2)