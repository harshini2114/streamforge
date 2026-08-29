from kafka import KafkaConsumer

consumer = KafkaConsumer(
    "truck-telemetry",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    group_id="streamforge-consumer"
)

print("Listening for truck telemetry...")

for message in consumer:
    print(message.value.decode("utf-8"))