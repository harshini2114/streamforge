import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Circle,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  HardDrive,
  LayoutDashboard,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  Timer,
  TrendingUp,
  Users,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";

import "./App.css";

const API = "http://127.0.0.1:8000";
const PROMETHEUS_API = `${API}/api/prometheus`;

/* =========================================================
   HELPERS
========================================================= */

function getArray(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function getMetric(metrics, key, fallback = 0) {
  const value = Number(metrics?.[key]);

  return Number.isFinite(value) ? value : fallback;
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "--";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString();
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [activePage, setActivePage] =
    useState("Overview");

  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [prometheus, setPrometheus] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(null);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const fetchData = async () => {
    try {
      const results =
        await Promise.allSettled([
          axios.get(`${API}/api/status`),

          axios.get(`${API}/api/metrics`),

          axios.get(`${API}/api/workers`),

          axios.get(`${API}/api/alerts`),

          axios.get(PROMETHEUS_API),
        ]);

      const [
        statusResponse,
        metricsResponse,
        workersResponse,
        alertsResponse,
        prometheusResponse,
      ] = results;

      /* -----------------------------------------------
         STATUS
      ------------------------------------------------ */

      if (
        statusResponse.status ===
        "fulfilled"
      ) {
        setStatus(
          statusResponse.value.data
        );
      }

      /* -----------------------------------------------
         METRICS
      ------------------------------------------------ */

      if (
        metricsResponse.status ===
        "fulfilled"
      ) {
        setMetrics(
          metricsResponse.value.data
        );
      }

      /* -----------------------------------------------
         WORKERS
      ------------------------------------------------ */

      if (
        workersResponse.status ===
        "fulfilled"
      ) {
        const workerData =
          workersResponse.value.data;

        const workerArray = getArray(
          workerData,
          ["workers", "data"]
        );

        setWorkers(workerArray);
      }

      /* -----------------------------------------------
         ALERTS
      ------------------------------------------------ */

      if (
        alertsResponse.status ===
        "fulfilled"
      ) {
        const alertData =
          alertsResponse.value.data;

        const alertArray = getArray(
          alertData,
          ["alerts", "data"]
        );

        setAlerts(alertArray);
      }

      /* -----------------------------------------------
         PROMETHEUS
      ------------------------------------------------ */

      if (
        prometheusResponse.status ===
        "fulfilled"
      ) {
        const prometheusData =
          prometheusResponse.value.data;

        console.log(
          "Prometheus:",
          prometheusData
        );

        setPrometheus(
          prometheusData
        );
      }

      setLastUpdated(
        new Date()
      );

      setLoading(false);

    } catch (error) {
      console.error(
        "Dashboard API error:",
        error
      );

      setLoading(false);
    }
  };

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    fetchData();

    const interval =
      setInterval(() => {
        fetchData();
      }, 5000);

    return () =>
      clearInterval(interval);
  }, []);

  /* =======================================================
     WORKER ACTION
  ======================================================= */

  const handleWorkerAction = async (
    workerId,
    action
  ) => {
    try {
      setActionLoading(
        `${workerId}-${action}`
      );

      await axios.post(
        `${API}/api/workers/${workerId}/${action}`
      );

      await fetchData();

    } catch (error) {
      console.error(
        "Worker action failed:",
        error
      );

      alert(
        "Worker action failed. Check FastAPI."
      );

    } finally {
      setActionLoading(null);
    }
  };

  /* =======================================================
     WORKER HEALTH
  ======================================================= */

  const workerHealth = useMemo(() => {
    return workers.filter(
      (worker) =>
        worker.status === "RUNNING"
    ).length;
  }, [workers]);

  /* =======================================================
     PROMETHEUS METRICS
  ======================================================= */

  const prometheusMetrics =
    prometheus?.metrics || {};

  const eventsPerSecond =
    getMetric(
      prometheusMetrics,
      "events_per_second",
      getMetric(
        metrics,
        "events_per_second"
      )
    );

  const processingLag =
    getMetric(
      prometheusMetrics,
      "processing_lag_ms",
      getMetric(
        metrics,
        "processing_lag_ms"
      )
    );

  const messagesProcessed =
    getMetric(
      prometheusMetrics,
      "messages_processed",
      getMetric(
        metrics,
        "messages_processed"
      )
    );

  const activePartitions =
    getMetric(
      prometheusMetrics,
      "active_partitions",
      getMetric(
        metrics,
        "active_partitions"
      )
    );

  const activeAlerts =
    getMetric(
      prometheusMetrics,
      "active_alerts",
      getMetric(
        metrics,
        "active_alerts",
        alerts.length
      )
    );

  const healthyWorkers =
    getMetric(
      prometheusMetrics,
      "healthy_workers",
      workerHealth
    );

  /* =======================================================
     BOTTLENECK
  ======================================================= */

  const bottleneck = useMemo(() => {
    const failedWorker =
      workers.find(
        (worker) =>
          worker.status === "FAILED"
      );

    if (failedWorker) {
      return {
        title: "Worker Bottleneck",
        detail:
          `${failedWorker.worker_id} is failed`,
        type: "danger",
        icon: Server,
      };
    }

    const recoveringWorker =
      workers.find(
        (worker) =>
          worker.status === "RECOVERING"
      );

    if (recoveringWorker) {
      return {
        title: "Recovery in Progress",
        detail:
          `${recoveringWorker.worker_id} is recovering`,
        type: "warning",
        icon: RefreshCw,
      };
    }

    if (processingLag > 1000) {
      return {
        title: "Processing Bottleneck",
        detail:
          `${Math.round(
            processingLag
          )} ms processing lag`,
        type: "warning",
        icon: Timer,
      };
    }

    return {
      title: "No Bottleneck",
      detail:
        "Pipeline operating normally",
      type: "success",
      icon: CheckCircle2,
    };
  }, [
    workers,
    processingLag,
  ]);

  /* =======================================================
     PAGE TITLE
  ======================================================= */

  const pageTitle = {
    Overview: "System Overview",
    Topology: "Pipeline Topology",
    Workers: "Worker Monitoring",
    Metrics: "Prometheus Metrics",
    Alerts: "Alert Monitoring",
    Settings: "System Settings",
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="app-shell">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Activity size={24} />
          </div>

          <div>
            <h1>StreamForge</h1>
            <span>
              Telemetry Platform
            </span>
          </div>

        </div>

        <div className="system-status">

          <span className="status-dot"></span>

          <div>
            <strong>
              {status?.status ||
                "ONLINE"}
            </strong>

            <small>
              Real-time streaming
            </small>
          </div>

        </div>

        <nav className="navigation">

          <p className="nav-label">
            MONITORING
          </p>

          <NavItem
            icon={LayoutDashboard}
            label="Overview"
            active={
              activePage === "Overview"
            }
            onClick={() =>
              setActivePage("Overview")
            }
          />

          <NavItem
            icon={GitBranch}
            label="Topology"
            active={
              activePage === "Topology"
            }
            onClick={() =>
              setActivePage("Topology")
            }
          />

          <NavItem
            icon={Users}
            label="Workers"
            active={
              activePage === "Workers"
            }
            onClick={() =>
              setActivePage("Workers")
            }
          />

          <NavItem
            icon={BarChart3}
            label="Metrics"
            active={
              activePage === "Metrics"
            }
            onClick={() =>
              setActivePage("Metrics")
            }
          />

          <NavItem
            icon={Bell}
            label="Alerts"
            active={
              activePage === "Alerts"
            }
            onClick={() =>
              setActivePage("Alerts")
            }
          />

          <p className="nav-label settings-label">
            SYSTEM
          </p>

          <NavItem
            icon={Settings}
            label="Settings"
            active={
              activePage === "Settings"
            }
            onClick={() =>
              setActivePage("Settings")
            }
          />

        </nav>

        <div className="sidebar-footer">

          <div className="connection-line">
            <Wifi size={15} />

            <span>
              FastAPI
            </span>

            <strong>
              CONNECTED
            </strong>
          </div>

          <div className="connection-line">

            <Activity size={15} />

            <span>
              Prometheus
            </span>

            <strong>
              {prometheus?.status ===
              "CONNECTED"
                ? "CONNECTED"
                : "WAITING"}
            </strong>

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main-content">

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              StreamForge /{" "}
              {pageTitle[activePage]}
            </div>

            <h2>
              {pageTitle[activePage]}
            </h2>

          </div>

          <div className="topbar-right">

            <div className="live-indicator">

              <span></span>

              LIVE

            </div>

            <button
              className="refresh-button"
              onClick={fetchData}
              title="Refresh dashboard"
            >
              <RefreshCw size={17} />
            </button>

            <div className="updated-time">

              Updated{" "}

              {lastUpdated
                ? formatTime(
                    lastUpdated
                  )
                : "--"}

            </div>

          </div>

        </header>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        {activePage ===
          "Overview" && (

          <OverviewPage
            eventsPerSecond={
              eventsPerSecond
            }
            processingLag={
              processingLag
            }
            healthyWorkers={
              healthyWorkers
            }
            activeAlerts={
              activeAlerts
            }
            messagesProcessed={
              messagesProcessed
            }
            activePartitions={
              activePartitions
            }
            workers={workers}
            alerts={alerts}
            bottleneck={
              bottleneck
            }
          />

        )}

        {/* =================================================
            TOPOLOGY
        ================================================= */}

        {activePage ===
          "Topology" && (

          <TopologyPage
            workers={workers}
            activePartitions={
              activePartitions
            }
          />

        )}

        {/* =================================================
            WORKERS
        ================================================= */}

        {activePage ===
          "Workers" && (

          <WorkersPage
            workers={workers}
            handleWorkerAction={
              handleWorkerAction
            }
            actionLoading={
              actionLoading
            }
          />

        )}

        {/* =================================================
            METRICS
        ================================================= */}

        {activePage ===
          "Metrics" && (

          <MetricsPage
            prometheus={
              prometheus
            }
            metrics={metrics}
            eventsPerSecond={
              eventsPerSecond
            }
            processingLag={
              processingLag
            }
            messagesProcessed={
              messagesProcessed
            }
            activePartitions={
              activePartitions
            }
            activeAlerts={
              activeAlerts
            }
            healthyWorkers={
              healthyWorkers
            }
            bottleneck={
              bottleneck
            }
          />

        )}

        {/* =================================================
            ALERTS
        ================================================= */}

        {activePage ===
          "Alerts" && (

          <AlertsPage
            alerts={alerts}
          />

        )}

        {/* =================================================
            SETTINGS
        ================================================= */}

        {activePage ===
          "Settings" && (

          <SettingsPage />

        )}

      </main>

    </div>
  );
}

/* =========================================================
   NAV ITEM
========================================================= */

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <Icon size={19} />
      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   OVERVIEW PAGE
========================================================= */

function OverviewPage({
  eventsPerSecond,
  processingLag,
  healthyWorkers,
  activeAlerts,
  messagesProcessed,
  activePartitions,
  workers,
  alerts,
  bottleneck,
}) {
  return (
    <div className="page">

      <section className="kpi-grid">

        <KpiCard
          title="Events / Second"
          value={
            eventsPerSecond
          }
          suffix="events/s"
          icon={Zap}
          description="Current processing rate"
        />

        <KpiCard
          title="Processing Lag"
          value={
            Math.round(
              processingLag
            )
          }
          suffix="ms"
          icon={Timer}
          description="Latest telemetry lag"
        />

        <KpiCard
          title="Healthy Workers"
          value={
            healthyWorkers
          }
          suffix={`/ ${
            workers.length || 3
          }`}
          icon={Users}
          description="Worker nodes running"
        />

        <KpiCard
          title="Active Alerts"
          value={
            activeAlerts
          }
          suffix=""
          icon={AlertTriangle}
          description="Overspeed events"
        />

      </section>

      <div className="content-grid">

        <section className="panel">

          <PanelHeader
            title="Real-Time Pipeline"
            subtitle="Streaming architecture"
            icon={GitBranch}
          />

          <Pipeline />

          <div className="pipeline-footer">

            <InfoRow
              icon={Database}
              label="Kafka Topic"
              value="truck-telemetry"
            />

            <InfoRow
              icon={HardDrive}
              label="Partitions"
              value={
                activePartitions
              }
            />

            <InfoRow
              icon={Activity}
              label="Processed"
              value={
                messagesProcessed
              }
            />

          </div>

        </section>

        <section className="panel">

          <PanelHeader
            title="Bottleneck Monitor"
            subtitle="Pipeline health analysis"
            icon={Gauge}
          />

          <BottleneckCard
            bottleneck={bottleneck}
          />

          <div className="health-summary">

            <HealthRow
              label="Kafka"
              value="Healthy"
              good
            />

            <HealthRow
              label="Workers"
              value={`${healthyWorkers} healthy`}
              good={
                healthyWorkers ===
                workers.length
              }
            />

            <HealthRow
              label="Prometheus"
              value="Monitoring"
              good
            />

            <HealthRow
              label="API"
              value="Connected"
              good
            />

          </div>

        </section>

      </div>

      <div className="content-grid">

        <section className="panel">

          <PanelHeader
            title="Worker Health"
            subtitle="Live worker state"
            icon={Users}
          />

          <div className="worker-mini-grid">

            {workers.length ? (

              workers.map(
                (worker) => (
                  <WorkerMini
                    key={
                      worker.worker_id
                    }
                    worker={worker}
                  />
                )
              )

            ) : (

              <EmptyState
                text="No workers available"
              />

            )}

          </div>

        </section>

        <section className="panel">

          <PanelHeader
            title="Recent Alerts"
            subtitle="Latest telemetry events"
            icon={Bell}
          />

          <AlertsList
            alerts={
              alerts.slice(0, 5)
            }
          />

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   TOPOLOGY PAGE
========================================================= */

function TopologyPage({
  workers,
  activePartitions,
}) {
  return (
    <div className="page">

      <section className="panel topology-large">

        <PanelHeader
          title="StreamForge Data Topology"
          subtitle="Real-time telemetry flow"
          icon={GitBranch}
        />

        <div className="large-pipeline">

          <PipelineNode
            icon={Wifi}
            title="Telemetry"
            subtitle="Truck devices"
            status="LIVE"
          />

          <PipelineArrow />

          <PipelineNode
            icon={Database}
            title="Kafka"
            subtitle="truck-telemetry"
            status={`${activePartitions} partitions`}
          />

          <PipelineArrow />

          <PipelineNode
            icon={Cpu}
            title="Stream Processor"
            subtitle="Python workers"
            status={`${workers.length} workers`}
          />

          <PipelineArrow />

          <PipelineNode
            icon={BarChart3}
            title="FastAPI"
            subtitle="REST metrics"
            status="ONLINE"
          />

          <PipelineArrow />

          <PipelineNode
            icon={LayoutDashboard}
            title="Dashboard"
            subtitle="React UI"
            status="LIVE"
          />

        </div>

      </section>

      <section className="panel">

        <PanelHeader
          title="Kafka Partition Assignment"
          subtitle="Current worker topology"
          icon={Database}
        />

        <div className="partition-grid">

          {[0, 1, 2].map(
            (partition) => {

              const worker =
                workers.length
                  ? workers[
                      partition %
                        workers.length
                    ]
                  : null;

              return (
                <div
                  className="partition-card"
                  key={partition}
                >

                  <div className="partition-number">
                    P{partition}
                  </div>

                  <div>

                    <strong>
                      {worker?.worker_id ||
                        `worker-${
                          partition + 1
                        }`}
                    </strong>

                    <span>
                      {worker?.status ||
                        "RUNNING"}
                    </span>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   WORKERS PAGE
========================================================= */

function WorkersPage({
  workers,
  handleWorkerAction,
  actionLoading,
}) {
  return (
    <div className="page">

      <section className="panel">

        <PanelHeader
          title="Worker Monitoring"
          subtitle="Failure and recovery controls"
          icon={Users}
        />

        <div className="worker-grid">

          {workers.length ? (

            workers.map(
              (worker) => (
                <WorkerCard
                  key={
                    worker.worker_id
                  }
                  worker={worker}
                  handleWorkerAction={
                    handleWorkerAction
                  }
                  actionLoading={
                    actionLoading
                  }
                />
              )
            )

          ) : (

            <EmptyState
              text="No workers available"
            />

          )}

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   METRICS PAGE
========================================================= */

function MetricsPage({
  prometheus,
  metrics,
  eventsPerSecond,
  processingLag,
  messagesProcessed,
  activePartitions,
  activeAlerts,
  healthyWorkers,
  bottleneck,
}) {
  const prometheusConnected =
    prometheus?.status ===
    "CONNECTED";

  return (
    <div className="page">

      <section className="metrics-status">

        <div>

          <span
            className={`status-dot ${
              prometheusConnected
                ? ""
                : "status-danger"
            }`}
          ></span>

          <strong>
            Prometheus{" "}
            {prometheusConnected
              ? "Connected"
              : "Disconnected"}
          </strong>

        </div>

        <span>
          Scrape interval: 5 seconds
        </span>

      </section>

      <section className="metrics-grid">

        <DetailMetric
          title="Events / Second"
          value={
            eventsPerSecond.toFixed(
              2
            )
          }
          unit="events/s"
          icon={Zap}
        />

        <DetailMetric
          title="Processing Lag"
          value={
            Math.round(
              processingLag
            )
          }
          unit="ms"
          icon={Timer}
        />

        <DetailMetric
          title="Messages Processed"
          value={
            messagesProcessed
          }
          unit="messages"
          icon={Activity}
        />

        <DetailMetric
          title="Active Partitions"
          value={
            activePartitions
          }
          unit="partitions"
          icon={Database}
        />

        <DetailMetric
          title="Active Alerts"
          value={
            activeAlerts
          }
          unit="alerts"
          icon={AlertTriangle}
        />

        <DetailMetric
          title="Healthy Workers"
          value={
            healthyWorkers
          }
          unit="workers"
          icon={Users}
        />

      </section>

      <section className="content-grid">

        <section className="panel">

          <PanelHeader
            title="Prometheus Metrics"
            subtitle="Live metric values"
            icon={BarChart3}
          />

          <MetricTable
            prometheus={
              prometheus
            }
            metrics={metrics}
          />

        </section>

        <section className="panel">

          <PanelHeader
            title="Bottleneck Analysis"
            subtitle="Current pipeline condition"
            icon={Gauge}
          />

          <BottleneckCard
            bottleneck={
              bottleneck
            }
          />

          <div className="metric-note">

            <ShieldCheck
              size={17}
            />

            <span>
              Metrics are collected
              through the StreamForge
              FastAPI exporter and
              scraped by Prometheus.
            </span>

          </div>

        </section>

      </section>

    </div>
  );
}

/* =========================================================
   ALERTS PAGE
========================================================= */

function AlertsPage({
  alerts,
}) {
  return (
    <div className="page">

      <section className="panel">

        <PanelHeader
          title="Telemetry Alerts"
          subtitle="Overspeed detection events"
          icon={Bell}
        />

        <AlertsList
          alerts={alerts}
          large
        />

      </section>

    </div>
  );
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

function SettingsPage() {
  return (
    <div className="page">

      <section className="panel settings-panel">

        <PanelHeader
          title="System Configuration"
          subtitle="StreamForge service endpoints"
          icon={Settings}
        />

        <div className="settings-list">

          <SettingRow
            label="FastAPI"
            value="http://127.0.0.1:8000"
          />

          <SettingRow
            label="Prometheus"
            value="http://127.0.0.1:9090"
          />

          <SettingRow
            label="Kafka"
            value="localhost:9092"
          />

          <SettingRow
            label="Kafka Topic"
            value="truck-telemetry"
          />

          <SettingRow
            label="Dashboard"
            value="React + Vite"
          />

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  title,
  value,
  suffix,
  icon: Icon,
  description,
}) {
  return (
    <div className="kpi-card">

      <div className="kpi-top">

        <span>
          {title}
        </span>

        <div className="kpi-icon">
          <Icon size={18} />
        </div>

      </div>

      <div className="kpi-value">

        {formatKpi(value)}

        <small>
          {suffix}
        </small>

      </div>

      <div className="kpi-description">

        <TrendingUp size={13} />

        {description}

      </div>

    </div>
  );
}

function formatKpi(value) {
  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return "0";
  }

  if (number >= 1000) {
    return number.toLocaleString();
  }

  return number % 1 === 0
    ? number
    : number.toFixed(2);
}

/* =========================================================
   PANEL HEADER
========================================================= */

function PanelHeader({
  title,
  subtitle,
  icon: Icon,
}) {
  return (
    <div className="panel-header">

      <div className="panel-title">

        <div className="panel-icon">
          <Icon size={18} />
        </div>

        <div>

          <h3>
            {title}
          </h3>

          <span>
            {subtitle}
          </span>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   PIPELINE
========================================================= */

function Pipeline() {
  return (
    <div className="pipeline">

      <PipelineNode
        icon={Wifi}
        title="Telemetry"
        subtitle="Truck sensors"
        status="LIVE"
      />

      <PipelineArrow />

      <PipelineNode
        icon={Database}
        title="Kafka"
        subtitle="truck-telemetry"
        status="ONLINE"
      />

      <PipelineArrow />

      <PipelineNode
        icon={Cpu}
        title="Workers"
        subtitle="Stream processing"
        status="RUNNING"
      />

      <PipelineArrow />

      <PipelineNode
        icon={Server}
        title="FastAPI"
        subtitle="Metrics API"
        status="ONLINE"
      />

      <PipelineArrow />

      <PipelineNode
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="React UI"
        status="LIVE"
      />

    </div>
  );
}

function PipelineNode({
  icon: Icon,
  title,
  subtitle,
  status,
}) {
  return (
    <div className="pipeline-node">

      <div className="pipeline-node-icon">
        <Icon size={21} />
      </div>

      <strong>
        {title}
      </strong>

      <span>
        {subtitle}
      </span>

      <small>

        <span className="mini-dot"></span>

        {status}

      </small>

    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="pipeline-arrow">

      <div></div>

      <span>›</span>

    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="info-row">

      <Icon size={16} />

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   WORKER MINI
========================================================= */

function WorkerMini({
  worker,
}) {
  const running =
    worker.status ===
    "RUNNING";

  return (
    <div className="worker-mini">

      <div className="worker-avatar">
        <Cpu size={17} />
      </div>

      <div>

        <strong>
          {worker.worker_id}
        </strong>

        <span>
          {worker.status}
        </span>

      </div>

      <div
        className={`worker-state ${
          running
            ? "good"
            : "bad"
        }`}
      >

        {running ? (
          <CheckCircle2
            size={16}
          />
        ) : (
          <XCircle
            size={16}
          />
        )}

      </div>

    </div>
  );
}

/* =========================================================
   WORKER CARD
========================================================= */

function WorkerCard({
  worker,
  handleWorkerAction,
  actionLoading,
}) {
  const id =
    worker.worker_id;

  const status =
    worker.status;

  const isRunning =
    status === "RUNNING";

  const isFailed =
    status === "FAILED";

  const isRecovering =
    status ===
    "RECOVERING";

  return (
    <div className="worker-card">

      <div className="worker-card-header">

        <div className="worker-avatar large">
          <Cpu size={22} />
        </div>

        <div>

          <h3>
            {id}
          </h3>

          <span
            className={`worker-status ${
              status?.toLowerCase()
            }`}
          >

            <Circle
              size={8}
              fill="currentColor"
            />

            {status}

          </span>

        </div>

      </div>

      <div className="worker-details">

        <InfoRow
          icon={Database}
          label="Partition"
          value={
            worker.partition ??
            worker.partitions ??
            "--"
          }
        />

        <InfoRow
          icon={Activity}
          label="State"
          value={
            status
          }
        />

      </div>

      <div className="worker-actions">

        {isRunning && (

          <button
            className="danger-button"
            disabled={
              actionLoading ===
              `${id}-fail`
            }
            onClick={() =>
              handleWorkerAction(
                id,
                "fail"
              )
            }
          >

            {actionLoading ===
            `${id}-fail`
              ? "Failing..."
              : "FAIL WORKER"}

          </button>

        )}

        {isFailed && (

          <button
            className="warning-button"
            disabled={
              actionLoading ===
              `${id}-recover`
            }
            onClick={() =>
              handleWorkerAction(
                id,
                "recover"
              )
            }
          >

            {actionLoading ===
            `${id}-recover`
              ? "Recovering..."
              : "RECOVER"}

          </button>

        )}

        {isRecovering && (

          <button
            className="primary-button"
            disabled={
              actionLoading ===
              `${id}-resume`
            }
            onClick={() =>
              handleWorkerAction(
                id,
                "resume"
              )
            }
          >

            {actionLoading ===
            `${id}-resume`
              ? "Resuming..."
              : "RESUME"}

          </button>

        )}

      </div>

    </div>
  );
}

/* =========================================================
   ALERT LIST
========================================================= */

function AlertsList({
  alerts,
  large = false,
}) {
  if (!alerts?.length) {
    return (
      <EmptyState
        text="No alerts detected"
      />
    );
  }

  return (
    <div
      className={`alerts-list ${
        large
          ? "alerts-large"
          : ""
      }`}
    >

      {alerts.map(
        (alert, index) => {

          const truck =
            alert.truck_id ||
            alert.truck ||
            "UNKNOWN";

          const speed =
            alert.speed ??
            alert.value ??
            "--";

          const timestamp =
            alert.timestamp ||
            alert.time ||
            alert.created_at;

          return (
            <div
              className="alert-item"
              key={
                alert.id ||
                `${truck}-${timestamp}-${index}`
              }
            >

              <div className="alert-icon">
                <AlertTriangle
                  size={17}
                />
              </div>

              <div className="alert-content">

                <strong>
                  Overspeed detected
                </strong>

                <span>
                  {truck} exceeded speed limit
                </span>

              </div>

              <div className="alert-speed">

                <strong>
                  {speed}
                </strong>

                <span>
                  km/h
                </span>

              </div>

              <div className="alert-time">
                {formatTime(
                  timestamp
                )}
              </div>

            </div>
          );
        }
      )}

    </div>
  );
}

/* =========================================================
   DETAIL METRIC
========================================================= */

function DetailMetric({
  title,
  value,
  unit,
  icon: Icon,
}) {
  return (
    <div className="detail-metric">

      <div className="detail-metric-icon">
        <Icon size={20} />
      </div>

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {unit}
      </small>

    </div>
  );
}

/* =========================================================
   METRIC TABLE
========================================================= */

function MetricTable({
  prometheus,
  metrics,
}) {
  const metricValues =
    prometheus?.metrics ||
    metrics ||
    {};

  const rows = [
    [
      "streamforge_events_per_second",
      metricValues.events_per_second,
      "events/s",
    ],

    [
      "streamforge_processing_lag_ms",
      metricValues.processing_lag_ms,
      "ms",
    ],

    [
      "streamforge_messages_processed",
      metricValues.messages_processed,
      "messages",
    ],

    [
      "streamforge_active_partitions",
      metricValues.active_partitions,
      "partitions",
    ],

    [
      "streamforge_active_alerts",
      metricValues.active_alerts,
      "alerts",
    ],

    [
      "streamforge_healthy_workers",
      metricValues.healthy_workers,
      "workers",
    ],
  ];

  return (
    <div className="metric-table">

      <div className="metric-table-header">

        <span>
          METRIC
        </span>

        <span>
          VALUE
        </span>

        <span>
          UNIT
        </span>

      </div>

      {rows.map(
        ([name, value, unit]) => (

          <div
            className="metric-table-row"
            key={name}
          >

            <code>
              {name}
            </code>

            <strong>

              {typeof value ===
              "number"
                ? value.toFixed(
                    value % 1 === 0
                      ? 0
                      : 2
                  )
                : value ?? 0}

            </strong>

            <span>
              {unit}
            </span>

          </div>

        )
      )}

    </div>
  );
}

/* =========================================================
   BOTTLENECK
========================================================= */

function BottleneckCard({
  bottleneck,
}) {
  const Icon =
    bottleneck.icon;

  return (
    <div
      className={`bottleneck-card ${
        bottleneck.type
      }`}
    >

      <div className="bottleneck-icon">

        <Icon size={25} />

      </div>

      <div>

        <strong>
          {bottleneck.title}
        </strong>

        <span>
          {bottleneck.detail}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   HEALTH ROW
========================================================= */

function HealthRow({
  label,
  value,
  good,
}) {
  return (
    <div className="health-row">

      <span>
        {label}
      </span>

      <strong
        className={
          good
            ? "health-good"
            : "health-bad"
        }
      >

        <span className="mini-dot"></span>

        {value}

      </strong>

    </div>
  );
}

/* =========================================================
   SETTINGS ROW
========================================================= */

function SettingRow({
  label,
  value,
}) {
  return (
    <div className="setting-row">

      <span>
        {label}
      </span>

      <code>
        {value}
      </code>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  text,
}) {
  return (
    <div className="empty-state">

      <Activity size={22} />

      <span>
        {text}
      </span>

    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default App;