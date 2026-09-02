def process_alert(telemetry):
    if telemetry["speed"] > 80:
        print("\n🚨 OVERSPEED ALERT 🚨")
        print(f"Truck ID : {telemetry['truck_id']}")
        print(f"Speed    : {telemetry['speed']} km/h")
        print("Status   : Overspeeding")

        return True

    return False