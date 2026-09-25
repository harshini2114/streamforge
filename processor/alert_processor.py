from datetime import datetime
import json


def process_alert(telemetry):
    if telemetry["speed"] > 80:
        alert = {
            "alert_type": "OVERSPEED",
            "truck_id": telemetry["truck_id"],
            "speed": telemetry["speed"],
            "threshold": 80,
            "timestamp": datetime.now().isoformat()
        }

        print("\n========== OVERSPEED ALERT ==========")
        print(f"Truck ID  : {alert['truck_id']}")
        print(f"Speed     : {alert['speed']} km/h")
        print(f"Threshold : {alert['threshold']} km/h")
        print(f"Time      : {alert['timestamp']}")
        print("Status    : OVERSPEEDING")
        print("=====================================")

        with open("alerts.json", "a") as file:
            file.write(json.dumps(alert) + "\n")

        return alert

    return None