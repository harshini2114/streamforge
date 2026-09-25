import time
import json
import random
from kafka import KafkaProducer


BOOTSTRAP_SERVER = "localhost:9092"
TOPIC = "truck-telemetry"
TOTAL_EVENTS = 100_000


producer = KafkaProducer(
    bootstrap_servers=BOOTSTRAP_SERVER,
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    linger_ms=0,
    batch_size=65536,
    compression_type="lz4",
    acks=1
)


print("=" * 60)
print("🚀 STREAMFORGE 100K EVENTS/SEC PERFORMANCE TEST")
print("=" * 60)

start_time = time.perf_counter()

for i in range(TOTAL_EVENTS):

    telemetry = {
        "truck_id": f"TRUCK-{random.randint(1, 100):03d}",
        "speed": round(random.uniform(20, 100), 2),
        "temperature": round(random.uniform(25, 45), 2),
        "latitude": round(random.uniform(16.4, 17.0), 6),
        "longitude": round(random.uniform(80.0, 81.0), 6),
        "timestamp": time.time()
    }

    producer.send(TOPIC, telemetry)

    if (i + 1) % 10_000 == 0:
        producer.flush()
        elapsed = time.perf_counter() - start_time
        rate = (i + 1) / elapsed

        print(
            f"📦 {i + 1:,} events | "
            f"⏱️ {elapsed:.2f}s | "
            f"🚀 {rate:,.0f} events/sec"
        )

producer.flush()

elapsed = time.perf_counter() - start_time
events_per_second = TOTAL_EVENTS / elapsed

print("\n" + "=" * 60)
print("✅ PERFORMANCE TEST COMPLETE")
print("=" * 60)
print(f"Total Events      : {TOTAL_EVENTS:,}")
print(f"Total Time        : {elapsed:.2f} seconds")
print(f"Events / Second   : {events_per_second:,.0f}")
print("=" * 60)

producer.close()