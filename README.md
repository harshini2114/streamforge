## Week 2 – Real-Time Alert Processing

Week 2 extends the StreamForge pipeline with real-time overspeed detection and structured alert logging.

### Alert Processing Flow

Producer → Kafka → Consumer → Validation → Alert Processor → Overspeed Alert → alerts.json

### Week 2 Features

- Real-time overspeed detection
- Speed threshold: 80 km/h
- Structured JSON alert generation
- Truck ID, speed, threshold, and timestamp
- Alert persistence in `alerts.json`
- Modular alert processing using `processor/alert_processor.py`

### Week 2 Status

- [x] Alert Processor
- [x] Overspeed Detection
- [x] Structured Alert Output
- [x] Alert Logging
- [x] End-to-End Kafka Pipeline Testing