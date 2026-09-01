# Stream Forge
# StreamForge 🚛📡

StreamForge is a real-time truck telemetry streaming system built using Python and Apache Kafka.

## Project Overview

StreamForge simulates truck telemetry data and streams it through Apache Kafka for real-time processing.

The system generates truck information such as:

- Truck ID
- Speed
- Latitude
- Longitude
- Timestamp

The consumer reads the telemetry from Kafka, parses the JSON data, validates required fields, and detects overspeeding trucks.

## Architecture

Producer → Kafka → truck-telemetry → Consumer → Validation → Overspeed Detection

## Technologies

- Python
- Apache Kafka
- kafka-python
- JSON
- Git & GitHub

## Project Structure

```text
streamforge/
│
├── producer/
│   └── producer.py
│
├── consumer/
│   └── consumer.py
│
├── README.md
└── requirements.txt