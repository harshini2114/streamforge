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
    print(f"Message {message_count}: {message.value.decode('utf-8')}")