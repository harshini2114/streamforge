import json

from kafka import KafkaConsumer

consumer = KafkaConsumer(
    "truck-telemetry",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    group_id="streamforge-consumer"
)

print("Listening for truck telemetry...")

message_count = 0

for message in consumer:
    message_count += 1

    try:
        telemetry = json.loads(message.value.decode("utf-8"))

        required_fields = [
            "truck_id",
            "speed",
            "latitude",
            "longitude",
            "timestamp"
        ]

        if not all(field in telemetry for field in required_fields):
            print(f"Invalid telemetry message {message_count}: missing fields")
            continue

        print(f"\nMessage {message_count}")
        print(f"Truck ID : {telemetry['truck_id']}")
        print(f"Speed    : {telemetry['speed']} km/h")

        if telemetry["speed"] > 80:
            print("ALERT: Truck is overspeeding!")
        else:
            print("Speed is normal")

        print(f"Latitude : {telemetry['latitude']}")
        print(f"Longitude: {telemetry['longitude']}")
        print(f"Timestamp: {telemetry['timestamp']}")

    except (json.JSONDecodeError, KeyError) as error:
        print(f"Invalid telemetry message: {error}")