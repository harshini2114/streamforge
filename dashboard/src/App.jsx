import { useEffect, useState } from "react";
import axios from "axios";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Clock3,
  Gauge,
  LayoutDashboard,
  Radio,
  Server,
  Settings,
  ShieldAlert,
  Wifi,
  Zap,
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

const API = "http://127.0.0.1:8000";


// ============================================================
// TOPOLOGY NODES
// ============================================================

const nodes = [
  {
    id: "producer",
    position: { x: 40, y: 155 },
    data: {
      label: (
        <div className="flow-node">
          <Radio size={17} />
          <div>
            <strong>Truck Fleet</strong>
            <span>Telemetry Producer</span>
          </div>
        </div>
      ),
    },
  },

  {
    id: "kafka",
    position: { x: 300, y: 155 },
    data: {
      label: (
        <div className="flow-node">
          <Boxes size={17} />
          <div>
            <strong>Apache Kafka</strong>
            <span>truck-telemetry</span>
          </div>
        </div>
      ),
    },
  },

  {
    id: "worker1",
    position: { x: 570, y: 45 },
    data: {
      label: (
        <div className="flow-node">
          <Server size={17} />
          <div>
            <strong>Worker 1</strong>
            <span>Partition 0</span>
          </div>
        </div>
      ),
    },
  },

  {
    id: "worker2",
    position: { x: 570, y: 155 },
    data: {
      label: (
        <div className="flow-node">
          <Server size={17} />
          <div>
            <strong>Worker 2</strong>
            <span>Partition 1</span>
          </div>
        </div>
      ),
    },
  },

  {
    id: "worker3",
    position: { x: 570, y: 265 },
    data: {
      label: (
        <div className="flow-node">
          <Server size={17} />
          <div>
            <strong>Worker 3</strong>
            <span>Partition 2</span>
          </div>
        </div>
      ),
    },
  },

  {
    id: "alerts",
    position: { x: 850, y: 155 },
    data: {
      label: (
        <div className="flow-node">
          <ShieldAlert size={17} />
          <div>
            <strong>Alert Engine</strong>
            <span>Overspeed Events</span>
          </div>
        </div>
      ),
    },
  },
];


// ============================================================
// TOPOLOGY EDGES
// ============================================================

const edges = [
  {
    id: "producer-kafka",
    source: "producer",
    target: "kafka",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },

  {
    id: "kafka-worker1",
    source: "kafka",
    target: "worker1",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },

  {
    id: "kafka-worker2",
    source: "kafka",
    target: "worker2",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },

  {
    id: "kafka-worker3",
    source: "kafka",
    target: "worker3",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },

  {
    id: "worker1-alerts",
    source: "worker1",
    target: "alerts",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },

  {
    id: "worker2-alerts",
    source: "worker2",
    target: "alerts",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },

  {
    id: "worker3-alerts",
    source: "worker3",
    target: "alerts",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  icon,
  label,
  value,
  unit,
  description,
}) {
  return (
    <div className="metric-card">

      <div className="metric-icon">
        {icon}
      </div>

      <div className="metric-content">

        <div className="metric-label">
          {label}
        </div>

        <div className="metric-value">
          {value}

          {unit && (
            <span>{unit}</span>
          )}
        </div>

        <div className="metric-description">
          {description}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// WORKER CARD
// ============================================================

function WorkerCard({ worker }) {

  const healthy =
    worker.status === "RUNNING";

  return (
    <div className="worker-card">

      <div className="worker-header">

        <div className="worker-symbol">
          <Server size={17} />
        </div>

        <div className="worker-status">

          <span
            className={
              healthy
                ? "status-dot green"
                : "status-dot red"
            }
          />

          {worker.status}

        </div>

      </div>

      <div className="worker-name">
        {worker.worker_id}
      </div>

      <div className="worker-details">

        <div>
          <span>Partition</span>
          <strong>
            #{worker.partition}
          </strong>
        </div>

        <div>
          <span>Health</span>

          <strong
            className={
              healthy
                ? "healthy-text"
                : "failed-text"
            }
          >
            {healthy
              ? "Healthy"
              : "Failed"}
          </strong>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [status, setStatus] =
    useState(null);

  const [metrics, setMetrics] =
    useState(null);

  const [workers, setWorkers] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [apiOnline, setApiOnline] =
    useState(false);

  const [activePage, setActivePage] =
    useState("Overview");


  // ==========================================================
  // FETCH DASHBOARD DATA
  // ==========================================================

  const fetchDashboardData =
    async () => {

      try {

        const [
          statusResponse,
          metricsResponse,
          workersResponse,
          alertsResponse,
        ] = await Promise.all([

          axios.get(
            `${API}/api/status`
          ),

          axios.get(
            `${API}/api/metrics`
          ),

          axios.get(
            `${API}/api/workers`
          ),

          axios.get(
            `${API}/api/alerts`
          ),

        ]);


        setStatus(
          statusResponse.data
        );

        setMetrics(
          metricsResponse.data
        );

        setWorkers(
          workersResponse.data.workers || []
        );

        setAlerts(
          alertsResponse.data.alerts || []
        );

        setApiOnline(true);

      } catch (error) {

        console.error(
          "StreamForge API Error:",
          error
        );

        setApiOnline(false);
      }
    };


  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {

    fetchDashboardData();

    const interval =
      setInterval(
        fetchDashboardData,
        5000
      );

    return () =>
      clearInterval(interval);

  }, []);


  // ==========================================================
  // HEALTHY WORKERS
  // ==========================================================

  const healthyWorkers =
    workers.filter(
      (worker) =>
        worker.status === "RUNNING"
    ).length;


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="app">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            <Activity size={22} />
          </div>

          <div className="brand-name">
            STREAM<span>FORGE</span>
          </div>

          <div className="brand-subtitle">
            REAL-TIME TELEMETRY
          </div>

        </div>


        <div className="nav-section-title">
          COMMAND CENTER
        </div>


        <nav className="nav">

          {[
            {
              name: "Overview",
              icon:
                <LayoutDashboard
                  size={18}
                />,
            },

            {
              name: "Topology",
              icon:
                <Activity
                  size={18}
                />,
            },

            {
              name: "Workers",
              icon:
                <Server
                  size={18}
                />,
            },

            {
              name: "Metrics",
              icon:
                <BarChart3
                  size={18}
                />,
            },

            {
              name: "Alerts",
              icon:
                <AlertTriangle
                  size={18}
                />,
            },

            {
              name: "Settings",
              icon:
                <Settings
                  size={18}
                />,
            },
          ].map((item) => (

            <button
              key={item.name}
              className={
                activePage === item.name
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setActivePage(
                  item.name
                )
              }
            >

              {item.icon}

              <span>
                {item.name}
              </span>

            </button>

          ))}

        </nav>


        {/* API CONNECTION */}

        <div className="connection-card">

          <div className="connection-header">

            <span>
              API CONNECTION
            </span>

            <span
              className={
                apiOnline
                  ? "connection-badge online"
                  : "connection-badge offline"
              }
            >
              {apiOnline
                ? "ONLINE"
                : "OFFLINE"}
            </span>

          </div>


          <div className="connection-main">

            <span
              className={
                apiOnline
                  ? "status-dot green"
                  : "status-dot red"
              }
            />

            <strong>
              {apiOnline
                ? "Live System"
                : "Disconnected"}
            </strong>

          </div>


          <div className="connection-host">
            localhost:8000
          </div>

        </div>

      </aside>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main">

        {/* TOP HEADER */}

        <header className="topbar">

          <div>

            <div className="eyebrow">
              REAL-TIME TELEMETRY
            </div>

            <h1>
              {activePage}
            </h1>

            <p className="page-description">
              Live insights from your
              distributed streaming pipeline
            </p>

          </div>


          <div className="live-pill">

            <span className="live-dot" />

            {apiOnline
              ? "SYSTEM LIVE"
              : "API OFFLINE"}

          </div>

        </header>


        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <section className="metrics-grid">

          <MetricCard
            icon={<Gauge size={20} />}
            label="Events / sec"
            value={
              metrics?.events_per_second ??
              "--"
            }
            description="Current throughput"
          />


          <MetricCard
            icon={<Clock3 size={20} />}
            label="Processing Lag"
            value={
              metrics?.processing_lag_ms ??
              "--"
            }
            unit=" ms"
            description="Average latency"
          />


          <MetricCard
            icon={<Wifi size={20} />}
            label="Workers"
            value={`${healthyWorkers} / ${
              workers.length || 3
            }`}
            description="Healthy workers"
          />


          <MetricCard
            icon={<ShieldAlert size={20} />}
            label="Active Alerts"
            value={
              metrics?.active_alerts ??
              "--"
            }
            description="Overspeed events"
          />

        </section>


        {/* ==================================================
            TOPOLOGY
        ================================================== */}

        <section className="panel topology-panel">

          <div className="panel-header">

            <div>

              <div className="panel-eyebrow">
                SYSTEM ARCHITECTURE
              </div>

              <h2>
                Live Pipeline Topology
              </h2>

            </div>


            <div className="streaming-indicator">

              <span />

              STREAMING

            </div>

          </div>


          <div className="flow-container">

            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{
                padding: 0.2,
              }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnScroll={false}
            >

              <Background
                gap={22}
                size={1}
              />

              <Controls />

              <MiniMap />

            </ReactFlow>

          </div>

        </section>


        {/* ==================================================
            WORKERS + PERFORMANCE
        ================================================== */}

        <section className="two-column">


          {/* WORKER HEALTH */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <div className="panel-eyebrow">
                  WORKER MONITORING
                </div>

                <h2>
                  Worker Health
                </h2>

              </div>


              <div className="health-summary">

                <span className="status-dot green" />

                {healthyWorkers} HEALTHY

              </div>

            </div>


            <div className="workers-grid">

              {workers.length > 0 ? (

                workers.map(
                  (worker) => (

                    <WorkerCard
                      key={
                        worker.worker_id
                      }
                      worker={worker}
                    />

                  )
                )

              ) : (

                <div className="empty-state">
                  No worker data available
                </div>

              )}

            </div>

          </div>


          {/* PERFORMANCE */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <div className="panel-eyebrow">
                  STREAM PERFORMANCE
                </div>

                <h2>
                  Pipeline Metrics
                </h2>

              </div>

              <Zap
                size={19}
                className="panel-icon"
              />

            </div>


            <div className="performance-list">

              <div className="performance-item">

                <div>
                  <span>
                    Throughput
                  </span>

                  <small>
                    Events processed per second
                  </small>
                </div>

                <strong>
                  {
                    metrics?.events_per_second ??
                    "--"
                  }

                  <small>
                    {" "}evt/s
                  </small>
                </strong>

              </div>


              <div className="performance-item">

                <div>
                  <span>
                    Processing Lag
                  </span>

                  <small>
                    Average processing latency
                  </small>
                </div>

                <strong>
                  {
                    metrics?.processing_lag_ms ??
                    "--"
                  }

                  <small>
                    {" "}ms
                  </small>
                </strong>

              </div>


              <div className="performance-item">

                <div>
                  <span>
                    Messages Processed
                  </span>

                  <small>
                    Total events handled
                  </small>
                </div>

                <strong>
                  {
                    metrics?.messages_processed
                      ?.toLocaleString() ??
                    "--"
                  }
                </strong>

              </div>


              <div className="performance-item">

                <div>
                  <span>
                    Active Partitions
                  </span>

                  <small>
                    Kafka partitions in use
                  </small>
                </div>

                <strong>
                  {
                    metrics?.active_partitions ??
                    "--"
                  }
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            ALERTS
        ================================================== */}

        <section className="panel alert-panel">

          <div className="panel-header">

            <div>

              <div className="panel-eyebrow">
                EVENT MONITORING
              </div>

              <h2>
                Recent Alerts
              </h2>

            </div>


            <div className="alert-count">
              {alerts.length} EVENTS
            </div>

          </div>


          {alerts.length > 0 ? (

            <div className="alert-table">

              <div className="alert-table-header">

                <span>EVENT</span>

                <span>TRUCK</span>

                <span>SPEED</span>

                <span>STATUS</span>

              </div>


              {alerts.map(
                (alert, index) => (

                  <div
                    className="alert-row"
                    key={index}
                  >

                    <div className="alert-event">

                      <AlertTriangle
                        size={16}
                      />

                      <strong>
                        {alert.alert_type}
                      </strong>

                    </div>


                    <span className="truck-id">
                      {alert.truck_id}
                    </span>


                    <span className="speed-value">
                      {alert.speed} km/h
                    </span>


                    <span className="alert-status">
                      {alert.status}
                    </span>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="empty-state">
              No active alerts
            </div>

          )}

        </section>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="footer">

          <span>
            STREAMFORGE TELEMETRY PLATFORM
          </span>

          <span>
            Kafka • FastAPI • React Flow
          </span>

          <span>

            {status?.timestamp

              ? `Last update: ${new Date(
                  status.timestamp
                ).toLocaleTimeString()}`

              : "Waiting for API"}

          </span>

        </footer>

      </main>

    </div>
  );
}


export default App;