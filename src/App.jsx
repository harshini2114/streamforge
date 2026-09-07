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
  ShieldCheck,
  Zap,
} from "lucide-react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

const initialNodes = [
  {
    id: "producer",
    position: { x: 40, y: 180 },
    data: { label: "Telemetry Producer" },
    sourcePosition: Position.Right,
    type: "default",
  },
  {
    id: "kafka",
    position: { x: 320, y: 180 },
    data: { label: "Apache Kafka\ntruck-telemetry" },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    type: "default",
  },
  {
    id: "worker1",
    position: { x: 650, y: 50 },
    data: { label: "Worker 1\nPartition 0" },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    type: "default",
  },
  {
    id: "worker2",
    position: { x: 650, y: 180 },
    data: { label: "Worker 2\nPartition 1" },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    type: "default",
  },
  {
    id: "worker3",
    position: { x: 650, y: 310 },
    data: { label: "Worker 3\nPartition 2" },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    type: "default",
  },
  {
    id: "output",
    position: { x: 950, y: 180 },
    data: { label: "Alert Output" },
    targetPosition: Position.Left,
    type: "default",
  },
];

const initialEdges = [
  {
    id: "e1",
    source: "producer",
    target: "kafka",
    animated: true,
  },
  {
    id: "e2",
    source: "kafka",
    target: "worker1",
    animated: true,
  },
  {
    id: "e3",
    source: "kafka",
    target: "worker2",
    animated: true,
  },
  {
    id: "e4",
    source: "kafka",
    target: "worker3",
    animated: true,
  },
  {
    id: "e5",
    source: "worker1",
    target: "output",
    animated: true,
  },
  {
    id: "e6",
    source: "worker2",
    target: "output",
    animated: true,
  },
  {
    id: "e7",
    source: "worker3",
    target: "output",
    animated: true,
  },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [activeSection, setActiveSection] = useState("Overview");

  const onConnect = (params) =>
    setEdges((currentEdges) => addEdge(params, currentEdges));

  const navigation = [
    {
      name: "Overview",
      icon: LayoutDashboard,
    },
    {
      name: "Topology",
      icon: Radio,
    },
    {
      name: "Workers",
      icon: Server,
    },
    {
      name: "Metrics",
      icon: BarChart3,
    },
    {
      name: "Alerts",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Zap size={21} />
          </div>

          <div>
            <h1>STREAMFORGE</h1>
            <span>Telemetry Platform</span>
          </div>
        </div>

        <div className="sidebar-label">COMMAND CENTER</div>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activeSection === item.name ? "active" : ""
                }`}
                onClick={() => setActiveSection(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="system-mini">
            <div className="live-dot"></div>

            <div>
              <strong>System Online</strong>
              <span>All services operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* HEADER */}
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              STREAMFORGE / {activeSection.toUpperCase()}
            </div>

            <h2>Real-Time Telemetry Command Center</h2>

            <p>
              Monitor streaming pipelines, workers and system performance.
            </p>
          </div>

          <div className="header-status">
            <div className="status-indicator">
              <span></span>
              LIVE
            </div>

            <div className="environment">
              <Database size={16} />
              LOCAL CLUSTER
            </div>
          </div>
        </header>

        {/* METRICS */}
        <section className="metrics-grid">
          <MetricCard
            icon={<Activity size={20} />}
            title="EVENTS / SEC"
            value="42.8"
            suffix="events/s"
            trend="+8.4%"
          />

          <MetricCard
            icon={<Clock3 size={20} />}
            title="PROCESSING LAG"
            value="28"
            suffix="ms"
            trend="-12.6%"
          />

          <MetricCard
            icon={<Server size={20} />}
            title="WORKERS"
            value="3 / 3"
            suffix="healthy"
            trend="100%"
          />

          <MetricCard
            icon={<AlertTriangle size={20} />}
            title="ACTIVE ALERTS"
            value="02"
            suffix="alerts"
            trend="LIVE"
          />
        </section>

        {/* CONTENT GRID */}
        <section className="dashboard-grid">
          {/* TOPOLOGY */}
          <div className="panel topology-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <Radio size={17} />
                  PIPELINE TOPOLOGY
                </div>

                <span className="panel-subtitle">
                  Real-time stream processing graph
                </span>
              </div>

              <div className="panel-badge">
                <span></span>
                STREAMING
              </div>
            </div>

            <div className="flow-container">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={22} size={1} />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>

          {/* WORKERS */}
          <div className="panel worker-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <Server size={17} />
                  WORKER HEALTH
                </div>

                <span className="panel-subtitle">
                  Processing node status
                </span>
              </div>
            </div>

            <div className="worker-list">
              <Worker
                name="Worker 1"
                partition="Partition 0"
                events="14.2"
              />

              <Worker
                name="Worker 2"
                partition="Partition 1"
                events="13.7"
              />

              <Worker
                name="Worker 3"
                partition="Partition 2"
                events="14.9"
              />
            </div>

            <div className="worker-footer">
              <ShieldCheck size={16} />
              All workers operational
            </div>
          </div>
        </section>

        {/* LOWER SECTION */}
        <section className="lower-grid">
          {/* STREAM */}
          <div className="panel stream-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <Gauge size={17} />
                  STREAM PERFORMANCE
                </div>

                <span className="panel-subtitle">
                  Current processing activity
                </span>
              </div>
            </div>

            <div className="performance-row">
              <PerformanceMetric
                label="Throughput"
                value="42.8"
                unit="events/s"
              />

              <PerformanceMetric
                label="Average Lag"
                value="28"
                unit="ms"
              />

              <PerformanceMetric
                label="Kafka Partitions"
                value="3"
                unit="active"
              />

              <PerformanceMetric
                label="Messages"
                value="12.4K"
                unit="processed"
              />
            </div>
          </div>

          {/* ALERTS */}
          <div className="panel alert-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <AlertTriangle size={17} />
                  RECENT ALERTS
                </div>

                <span className="panel-subtitle">
                  Latest stream events
                </span>
              </div>

              <span className="alert-count">02</span>
            </div>

            <div className="alert-item">
              <div className="alert-icon">
                <AlertTriangle size={16} />
              </div>

              <div>
                <strong>Overspeed detected</strong>
                <span>TRUCK-007 · 94.7 km/h</span>
              </div>

              <time>12s</time>
            </div>

            <div className="alert-item">
              <div className="alert-icon">
                <AlertTriangle size={16} />
              </div>

              <div>
                <strong>Overspeed detected</strong>
                <span>TRUCK-003 · 87.2 km/h</span>
              </div>

              <time>41s</time>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon, title, value, suffix, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <div className="metric-icon">{icon}</div>

        <span className="metric-trend">{trend}</span>
      </div>

      <div className="metric-title">{title}</div>

      <div className="metric-value">
        {value}
        <span>{suffix}</span>
      </div>
    </div>
  );
}

function Worker({ name, partition, events }) {
  return (
    <div className="worker-card">
      <div className="worker-status">
        <span></span>
      </div>

      <div className="worker-info">
        <strong>{name}</strong>
        <span>{partition}</span>
      </div>

      <div className="worker-events">
        <strong>{events}</strong>
        <span>events/s</span>
      </div>
    </div>
  );
}

function PerformanceMetric({ label, value, unit }) {
  return (
    <div className="performance-metric">
      <span>{label}</span>

      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}

export default App;