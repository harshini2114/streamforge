import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  Database,
  Gauge,
  LayoutDashboard,
  Radio,
  Server,
  Settings,
  ShieldAlert,
  Wifi,
} from "lucide-react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

const topologyNodes = [
  {
    id: "producer",
    position: { x: 40, y: 230 },
    data: {
      label: (
        <div className="flow-node producer-node">
          <div className="node-icon">
            <Radio size={18} />
          </div>
          <div>
            <strong>Telemetry Producer</strong>
            <span>Truck Data Generator</span>
          </div>
        </div>
      ),
    },
    style: {
      background: "#111111",
      color: "#ffffff",
      border: "1px solid #333333",
      borderRadius: "14px",
      width: 220,
      padding: 14,
    },
  },

  {
    id: "kafka",
    position: { x: 330, y: 230 },
    data: {
      label: (
        <div className="flow-node kafka-node">
          <div className="node-icon">
            <Database size={18} />
          </div>
          <div>
            <strong>Apache Kafka</strong>
            <span>truck-telemetry</span>
          </div>
        </div>
      ),
    },
    style: {
      background: "#151515",
      color: "#ffffff",
      border: "1px solid #444444",
      borderRadius: "14px",
      width: 220,
      padding: 14,
    },
  },

  {
    id: "partition0",
    position: { x: 620, y: 70 },
    data: {
      label: (
        <div className="partition-node">
          <strong>Partition 0</strong>
          <span>Worker 1</span>
        </div>
      ),
    },
    style: {
      background: "#181818",
      color: "#ffffff",
      border: "1px solid #555555",
      borderRadius: "12px",
      width: 170,
      padding: 14,
    },
  },

  {
    id: "partition1",
    position: { x: 620, y: 220 },
    data: {
      label: (
        <div className="partition-node">
          <strong>Partition 1</strong>
          <span>Worker 2</span>
        </div>
      ),
    },
    style: {
      background: "#181818",
      color: "#ffffff",
      border: "1px solid #555555",
      borderRadius: "12px",
      width: 170,
      padding: 14,
    },
  },

  {
    id: "partition2",
    position: { x: 620, y: 370 },
    data: {
      label: (
        <div className="partition-node">
          <strong>Partition 2</strong>
          <span>Worker 3</span>
        </div>
      ),
    },
    style: {
      background: "#181818",
      color: "#ffffff",
      border: "1px solid #555555",
      borderRadius: "12px",
      width: 170,
      padding: 14,
    },
  },

  {
    id: "output",
    position: { x: 920, y: 230 },
    data: {
      label: (
        <div className="flow-node output-node">
          <div className="node-icon">
            <ShieldAlert size={18} />
          </div>
          <div>
            <strong>Alert Output</strong>
            <span>Overspeed Alerts</span>
          </div>
        </div>
      ),
    },
    style: {
      background: "#111111",
      color: "#ffffff",
      border: "1px solid #333333",
      borderRadius: "14px",
      width: 210,
      padding: 14,
    },
  },
];

const topologyEdges = [
  {
    id: "producer-kafka",
    source: "producer",
    target: "kafka",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "kafka-p0",
    source: "kafka",
    target: "partition0",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "kafka-p1",
    source: "kafka",
    target: "partition1",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "kafka-p2",
    source: "kafka",
    target: "partition2",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "p0-output",
    source: "partition0",
    target: "output",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "p1-output",
    source: "partition1",
    target: "output",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "p2-output",
    source: "partition2",
    target: "output",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

function MetricCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        <Icon size={19} />
      </div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function WorkerCard({ worker, partition, status }) {
  return (
    <div className="worker-card">
      <div className="worker-left">
        <div className="worker-icon">
          <Server size={18} />
        </div>

        <div>
          <strong>{worker}</strong>
          <span>Kafka {partition}</span>
        </div>
      </div>

      <div className="worker-status">
        <span className="status-dot"></span>
        {status}
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");

  return (
    <div className="app">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Activity size={20} />
          </div>

          <div>
            <h2>STREAMFORGE</h2>
            <span>TELEMETRY PLATFORM</span>
          </div>
        </div>

        <nav>
          <p className="nav-title">COMMAND CENTER</p>

          {[
            [LayoutDashboard, "Overview"],
            [Activity, "Topology"],
            [Server, "Workers"],
            [BarChart3, "Metrics"],
            [AlertTriangle, "Alerts"],
            [Settings, "Settings"],
          ].map(([Icon, label]) => (
            <button
              key={label}
              className={activePage === label ? "nav-item active" : "nav-item"}
              onClick={() => setActivePage(label)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-status">
            <span className="status-dot"></span>
            <div>
              <strong>Cluster Online</strong>
              <span>localhost:9092</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">REAL-TIME TELEMETRY</p>
            <h1>{activePage}</h1>
          </div>

          <div className="live-status">
            <span className="status-dot"></span>
            LIVE
          </div>
        </header>

        {/* METRICS */}

        <section className="metrics-grid">
          <MetricCard
            icon={Gauge}
            title="Events / sec"
            value="42.8"
            subtitle="Current throughput"
          />

          <MetricCard
            icon={Clock3}
            title="Processing Lag"
            value="28 ms"
            subtitle="Average latency"
          />

          <MetricCard
            icon={Wifi}
            title="Workers"
            value="3 / 3"
            subtitle="Healthy workers"
          />

          <MetricCard
            icon={AlertTriangle}
            title="Active Alerts"
            value="02"
            subtitle="Overspeed events"
          />
        </section>

        {/* TOPOLOGY */}

        <section className="panel topology-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">SYSTEM ARCHITECTURE</p>
              <h2>Live Pipeline Topology</h2>
            </div>

            <div className="topology-badge">
              <span className="status-dot"></span>
              STREAMING
            </div>
          </div>

          <div className="flow-container">
            <ReactFlow
              nodes={topologyNodes}
              edges={topologyEdges}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={24} size={1} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </section>

        {/* WORKERS + PERFORMANCE */}

        <section className="lower-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">WORKER MONITORING</p>
                <h2>Worker Health</h2>
              </div>

              <span className="healthy-label">3 HEALTHY</span>
            </div>

            <div className="worker-list">
              <WorkerCard
                worker="Worker 1"
                partition="Partition 0"
                status="RUNNING"
              />

              <WorkerCard
                worker="Worker 2"
                partition="Partition 1"
                status="RUNNING"
              />

              <WorkerCard
                worker="Worker 3"
                partition="Partition 2"
                status="RUNNING"
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">STREAM PERFORMANCE</p>
                <h2>Pipeline Metrics</h2>
              </div>
            </div>

            <div className="performance-list">
              <div>
                <span>Throughput</span>
                <strong>42.8 events/sec</strong>
              </div>

              <div>
                <span>Processing Lag</span>
                <strong>28 ms</strong>
              </div>

              <div>
                <span>Partitions</span>
                <strong>3 Active</strong>
              </div>

              <div>
                <span>Messages Processed</span>
                <strong>18,420</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ALERTS */}

        <section className="panel alerts-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">EVENT MONITORING</p>
              <h2>Recent Alerts</h2>
            </div>

            <span className="alert-count">02 EVENTS</span>
          </div>

          <div className="alert-row">
            <div className="alert-icon">
              <AlertTriangle size={18} />
            </div>

            <div className="alert-content">
              <strong>OVERSPEED</strong>
              <span>TRUCK-007 exceeded 80 km/h</span>
            </div>

            <span className="alert-time">2 min ago</span>
          </div>

          <div className="alert-row">
            <div className="alert-icon">
              <AlertTriangle size={18} />
            </div>

            <div className="alert-content">
              <strong>OVERSPEED</strong>
              <span>TRUCK-003 exceeded 80 km/h</span>
            </div>

            <span className="alert-time">5 min ago</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;