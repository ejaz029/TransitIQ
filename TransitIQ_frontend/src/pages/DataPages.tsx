import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Download,
  Settings,
  ShieldAlert,
  BusFront,
  Users,
  Accessibility,
  Armchair,
} from 'lucide-react';

import {
  DataTable,
  EmptyState,
  ErrorState,
  Loading,
  PageHeading,
  SearchBox,
  StatusPill,
} from '../components/Primitives';

import {
  endpoints,
  errorMessage,
  field,
  unwrapList,
} from '../lib/api';

const PAGE_SIZE = 50;

type PageKind =
  | 'students'
  | 'fleet'
  | 'routes'
  | 'assignments'
  | 'attendance'
  | 'notifications'
  | 'exceptions';

type Column = {
  key: string;
  label: string;
  aliases?: string[];
  status?: boolean;
  render?: (row: any) => ReactNode;
};

type Config = {
  title: string;
  eyebrow: string;
  description: string;
  queryKey: string;
  paginated?: boolean;
  query: (params?: Record<string, unknown>) => Promise<any>;
  columns: Column[];
};

const configs: Record<PageKind, Config> = {
  students: {
    title: 'Students',
    eyebrow: 'MASTER DATA',
    description: 'Browse student records and their transport eligibility details.',
    queryKey: 'students',
    paginated: true,
    query: (params = {}) => endpoints.students(params),
    columns: [
      { key: 'student_id', label: 'Student ID', aliases: ['id'] },
      { key: 'full_name', label: 'Student name', aliases: ['name', 'student_name'] },
      { key: 'grade', label: 'Grade', aliases: ['class', 'year'] },
      { key: 'zone_id', label: 'Address zone', aliases: ['address_zone_id'] },
      {
        key: 'requires_accessible_vehicle',
        label: 'Accessibility',
        aliases: ['accessibility_required'],
      },
      { key: 'status', label: 'Status', status: true },
    ],
  },

  fleet: {
    title: 'Fleet',
    eyebrow: 'FLEET MANAGEMENT',
    description: 'Monitor vehicle capacity, student allocation, accessibility and availability.',
    queryKey: 'buses',
    query: () => endpoints.buses(),
    columns: [
      { key: 'bus_id', label: 'Vehicle ID', aliases: ['id'] },
      {
        key: 'registration_number',
        label: 'Registration',
        aliases: ['registration', 'license_plate'],
      },
      { key: 'assigned_route', label: 'Assigned route' },
      { key: 'driver_id', label: 'Assigned driver', aliases: ['driver_name'] },
      { key: 'capacity', label: 'Seat capacity', aliases: ['max_capacity'] },
      { key: 'assigned_students', label: 'Assigned students' },
      { key: 'available_seats', label: 'Available seats' },
      {
        key: 'utilization',
        label: 'Capacity utilization',
        render: row => row.utilization == null ? '—' : `${row.utilization}%`,
      },
      {
        key: 'is_accessible',
        label: 'Accessible',
        aliases: ['accessible'],
        render: row => {
          const value = field(row, 'is_accessible', 'accessible');
          return value === true || value === 1 || value === '1' || value === 'true'
            ? 'Yes'
            : 'No';
        },
      },
      { key: 'status', label: 'Status', status: true },
    ],
  },

  routes: {
    title: 'Routes',
    eyebrow: 'NETWORK PLANNING',
    description: 'Monitor route coverage, assigned students, vehicle and driver allocation.',
    queryKey: 'routes',
    query: () => endpoints.routes(),
    columns: [
      { key: 'route_id', label: 'Route ID', aliases: ['id'] },
      { key: 'route_name', label: 'Route name', aliases: ['name'] },
      { key: 'assigned_bus', label: 'Assigned bus' },
      { key: 'assigned_driver', label: 'Assigned driver' },
      { key: 'stop_count_display', label: 'Stops' },
      { key: 'assigned_students', label: 'Assigned students' },
      { key: 'status', label: 'Status', status: true },
    ],
  },

  assignments: {
    title: 'Student assignments',
    eyebrow: 'ALLOCATION',
    description: 'See how students are allocated to buses, routes and pickup stops.',
    queryKey: 'assignments',
    paginated: true,
    query: (params = {}) => endpoints.assignments(params),
    columns: [
      { key: 'assignment_id', label: 'Assignment ID', aliases: ['id'] },
      { key: 'student_id', label: 'Student' },
      { key: 'route_id', label: 'Route' },
      { key: 'bus_id', label: 'Bus' },
      { key: 'stop_id', label: 'Pickup stop' },
      { key: 'status', label: 'Status', status: true },
    ],
  },

  attendance: {
    title: 'Attendance',
    eyebrow: 'DAILY OPERATIONS',
    description: 'Review boarding, absence and pickup exception events.',
    queryKey: 'attendance',
    paginated: true,
    query: (params = {}) => endpoints.attendance(params),
    columns: [
      { key: 'event_id', label: 'Event ID', aliases: ['attendance_id', 'id'] },
      { key: 'assignment_id', label: 'Assignment' },
      { key: 'event_date', label: 'Service date', aliases: ['service_date', 'date'] },
      {
        key: 'event_type',
        label: 'Event type',
        aliases: ['status', 'attendance_status'],
        status: true,
      },
      { key: 'event_time', label: 'Event time', aliases: ['timestamp', 'created_at'] },
    ],
  },

  notifications: {
    title: 'Notifications',
    eyebrow: 'GUARDIAN COMMUNICATION',
    description: 'Track notification records created for transport events.',
    queryKey: 'notifications',
    paginated: true,
    query: (params = {}) => endpoints.notifications(params),
    columns: [
      { key: 'notification_id', label: 'Notification ID', aliases: ['id'] },
      { key: 'guardian_id', label: 'Guardian' },
      { key: 'channel', label: 'Channel' },
      {
        key: 'message_type',
        label: 'Message type',
        aliases: ['notification_type', 'event_type'],
      },
      { key: 'status', label: 'Delivery status', status: true },
      { key: 'sent_at', label: 'Sent at' },
    ],
  },

  exceptions: {
    title: 'Safety & exceptions',
    eyebrow: 'VALIDATION & SAFETY',
    description: 'Review detected data-quality and operational constraint violations.',
    queryKey: 'exceptions',
    query: () => endpoints.exceptions(),
    columns: [
      { key: 'anomaly_id', label: 'Case ID', aliases: ['case_id', 'id'] },
      { key: 'anomaly_type', label: 'Exception', aliases: ['type', 'rule'] },
      { key: 'decision', label: 'Decision', status: true },
      { key: 'severity', label: 'Severity', status: true },
      { key: 'message', label: 'Details', aliases: ['description', 'reason'] },
    ],
  },
};

function flattenExceptions(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  for (const key of ['results', 'items', 'exceptions', 'anomalies', 'cases', 'detections']) {
    if (Array.isArray(data[key])) return data[key];
  }

  if (Array.isArray(data.results?.detections)) return data.results.detections;
  return [];
}

function getRowValue(row: any, column: Column) {
  return field(row, column.key, ...(column.aliases || []));
}

function toNumber(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isAccessible(bus: any): boolean {
  const value = field(bus, 'is_accessible', 'accessible');
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

function normalizedStatus(value: any): string {
  return String(value ?? 'unknown').trim().toLowerCase().replaceAll('_', ' ');
}

function isCountableAssignment(assignment: any): boolean {
  const status = normalizedStatus(field(assignment, 'status', 'assignment_status'));
  return !['cancelled', 'canceled', 'inactive', 'completed', 'withdrawn', 'deleted'].includes(status);
}

async function fetchAllPages(
  fetchPage: (params: Record<string, unknown>) => Promise<any>,
  pageSize = 200,
): Promise<any[]> {
  const firstPayload = await fetchPage({ skip: 0, limit: pageSize });
  const first = unwrapList(firstPayload);
  const all = [...first.items];
  let skip = first.items.length;
  let requests = 0;

  while (skip < first.total && first.items.length > 0 && requests < 50) {
    const payload = await fetchPage({ skip, limit: pageSize });
    const page = unwrapList(payload);
    if (!page.items.length) break;
    all.push(...page.items);
    skip += page.items.length;
    requests += 1;
  }
  return all;
}

async function fetchAllAssignments(): Promise<any[]> {
  const limit = 200;
  const firstPayload = await endpoints.assignments({ skip: 0, limit });
  const first = unwrapList(firstPayload);
  const all = [...first.items];

  // Continue only when the API provides a total larger than the first page.
  // A hard cap prevents an unexpected API response from causing an endless loop.
  const total = first.total;
  let skip = first.items.length;
  let requests = 0;

  while (skip < total && first.items.length > 0 && requests < 50) {
    const payload = await endpoints.assignments({ skip, limit });
    const page = unwrapList(payload);
    if (!page.items.length) break;

    all.push(...page.items);
    skip += page.items.length;
    requests += 1;
  }

  return all;
}

function RouteOverview({
  routes,
  assignments,
}: {
  routes: any[];
  assignments: any[];
}) {
  const routeStats = useMemo(() => {
    const assignmentCounts = new Map<string, number>();
    for (const assignment of assignments) {
      if (!isCountableAssignment(assignment)) continue;
      const routeId = field(assignment, 'route_id');
      if (routeId === undefined || routeId === null || routeId === '') continue;
      const key = String(routeId);
      assignmentCounts.set(key, (assignmentCounts.get(key) || 0) + 1);
    }

    const rows = routes.map(route => {
      const routeId = field(route, 'route_id', 'id');
      const busId = field(route, 'bus_id', 'vehicle_id');
      const stopList = field(route, 'stops', 'stop_ids', 'route_stops');
      const explicitStopCount = field(route, 'stop_count', 'number_of_stops');
      const stopCount = Array.isArray(stopList)
        ? stopList.length
        : explicitStopCount !== undefined
          ? toNumber(explicitStopCount)
          : null;

      return {
        ...route,
        route_id: routeId,
        assigned_bus: busId ?? 'Unassigned',
        assigned_driver: field(route, 'driver_id', 'driver_name') ?? '—',
        stop_count_display: stopCount === null ? '—' : stopCount,
        assigned_students: assignmentCounts.get(String(routeId)) || 0,
      };
    });

    const assignedStudents = rows.reduce((sum, route) => sum + route.assigned_students, 0);
    const allocatedRoutes = rows.filter(route => {
      const bus = field(route, 'bus_id', 'vehicle_id');
      return bus !== undefined && bus !== null && bus !== '';
    }).length;
    const unallocatedRoutes = rows.length - allocatedRoutes;

    return { rows, assignedStudents, allocatedRoutes, unallocatedRoutes };
  }, [routes, assignments]);

  return (
    <section className="route-intelligence">
      <div className="route-metrics">
        <div className="route-metric">
          <span className="route-metric-label">Configured routes</span>
          <strong>{routes.length.toLocaleString()}</strong>
          <small>Route records returned by API</small>
        </div>
        <div className="route-metric">
          <span className="route-metric-label">Assigned students</span>
          <strong>{routeStats.assignedStudents.toLocaleString()}</strong>
          <small>Active assignments mapped to routes</small>
        </div>
        <div className="route-metric">
          <span className="route-metric-label">Routes with a bus</span>
          <strong>{routeStats.allocatedRoutes.toLocaleString()}</strong>
          <small>Vehicle allocation present</small>
        </div>
        <div className="route-metric">
          <span className="route-metric-label">Unallocated routes</span>
          <strong>{routeStats.unallocatedRoutes.toLocaleString()}</strong>
          <small>No bus linked in route records</small>
        </div>
      </div>
      <p className="route-data-note">
        Stop counts are shown only when the route API includes stop details or a stop-count field.
        No route distance, duration or live location is inferred.
      </p>
    </section>
  );
}

function AssignmentOverview({ assignments }: { assignments: any[] }) {
  const stats = useMemo(() => {
    const statusCounts = new Map<string, number>();
    let routeLinked = 0;
    let busLinked = 0;
    let stopLinked = 0;
    let active = 0;

    for (const assignment of assignments) {
      const status = normalizedStatus(field(assignment, 'status', 'assignment_status'));
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      if (isCountableAssignment(assignment)) active += 1;

      const routeId = field(assignment, 'route_id');
      const busId = field(assignment, 'bus_id', 'vehicle_id');
      const stopId = field(assignment, 'stop_id', 'pickup_stop_id');

      if (routeId !== undefined && routeId !== null && routeId !== '') routeLinked += 1;
      if (busId !== undefined && busId !== null && busId !== '') busLinked += 1;
      if (stopId !== undefined && stopId !== null && stopId !== '') stopLinked += 1;
    }

    const statusSummary = [...statusCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total: assignments.length,
      active,
      routeLinked,
      busLinked,
      stopLinked,
      statusSummary,
    };
  }, [assignments]);

  return (
    <section className="assignment-intelligence">
      <div className="assignment-metrics">
        <div className="assignment-metric">
          <span className="assignment-metric-label">Total assignments</span>
          <strong>{stats.total.toLocaleString()}</strong>
          <small>Records returned across all pages</small>
        </div>
        <div className="assignment-metric">
          <span className="assignment-metric-label">Current allocations</span>
          <strong>{stats.active.toLocaleString()}</strong>
          <small>Excludes cancelled, inactive and completed</small>
        </div>
        <div className="assignment-metric">
          <span className="assignment-metric-label">Route linked</span>
          <strong>{stats.routeLinked.toLocaleString()}</strong>
          <small>Assignments with a route ID</small>
        </div>
        <div className="assignment-metric">
          <span className="assignment-metric-label">Bus / stop linked</span>
          <strong>{stats.busLinked.toLocaleString()} / {stats.stopLinked.toLocaleString()}</strong>
          <small>Assignments with vehicle and pickup stop IDs</small>
        </div>
      </div>

      <div className="assignment-status-panel">
        <div>
          <b>Assignment status distribution</b>
          <span>Based on the status values returned by the API</span>
        </div>
        <div className="assignment-status-list">
          {stats.statusSummary.length ? stats.statusSummary.map(([status, count]) => (
            <div className="assignment-status-item" key={status}>
              <span>{status === 'unknown' ? 'Not specified' : status}</span>
              <strong>{count.toLocaleString()}</strong>
              <div className="assignment-status-track">
                <i style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
          )) : <span>No status values returned.</span>}
        </div>
      </div>
    </section>
  );
}

function FleetOverview({ buses, assignments }: { buses: any[]; assignments: any[] }) {
  const assignmentsByBus = useMemo(() => {
    const counts = new Map<string, number>();

    for (const assignment of assignments) {
      if (!isCountableAssignment(assignment)) continue;
      const busId = field(assignment, 'bus_id', 'vehicle_id');
      if (busId === undefined || busId === null || busId === '') continue;

      const key = String(busId);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return counts;
  }, [assignments]);

  const fleetRows = useMemo(() => buses.map(bus => {
    const busId = field(bus, 'bus_id', 'id', 'vehicle_id');
    const capacity = toNumber(field(bus, 'capacity', 'max_capacity', 'seat_capacity'));
    const assigned = assignmentsByBus.get(String(busId)) || 0;
    const available = Math.max(capacity - assigned, 0);

    return {
      ...bus,
      bus_id: busId,
      capacity,
      assigned_students: assigned,
      available_seats: available,
      utilization: capacity > 0 ? Math.round((assigned / capacity) * 100) : null,
    };
  }), [buses, assignmentsByBus]);

  const totalCapacity = fleetRows.reduce((sum, bus) => sum + bus.capacity, 0);
  const totalAssigned = fleetRows.reduce((sum, bus) => sum + bus.assigned_students, 0);
  const totalAvailable = Math.max(totalCapacity - totalAssigned, 0);
  const accessibleCount = fleetRows.filter(isAccessible).length;
  const maintenanceCount = fleetRows.filter(bus =>
    normalizedStatus(field(bus, 'status', 'vehicle_status')).includes('maintenance')
  ).length;
  const overallUtilization = totalCapacity > 0
    ? Math.round((totalAssigned / totalCapacity) * 100)
    : null;

  return (
    <section className="fleet-intelligence">
      <div className="fleet-metrics">
        <div className="fleet-metric">
          <span className="fleet-metric-icon"><BusFront size={17} /></span>
          <span className="fleet-metric-label">Total vehicles</span>
          <strong>{fleetRows.length.toLocaleString()}</strong>
          <small>Vehicle records returned</small>
        </div>
        <div className="fleet-metric">
          <span className="fleet-metric-icon"><Users size={17} /></span>
          <span className="fleet-metric-label">Assigned students</span>
          <strong>{totalAssigned.toLocaleString()}</strong>
          <small>Assignments mapped to these buses</small>
        </div>
        <div className="fleet-metric">
          <span className="fleet-metric-icon"><Armchair size={17} /></span>
          <span className="fleet-metric-label">Available seats</span>
          <strong>{totalAvailable.toLocaleString()}</strong>
          <small>Capacity less assigned students</small>
        </div>
        <div className="fleet-metric">
          <span className="fleet-metric-icon"><Accessibility size={17} /></span>
          <span className="fleet-metric-label">Accessible vehicles</span>
          <strong>{accessibleCount.toLocaleString()}</strong>
          <small>{maintenanceCount} marked for maintenance</small>
        </div>
      </div>

      <div className="fleet-utilization-panel">
        <div className="fleet-utilization-heading">
          <div>
            <b>Fleet capacity utilization</b>
            <span>Calculated from bus seat capacity and student assignments</span>
          </div>
          <strong>{overallUtilization == null ? '—' : `${overallUtilization}%`}</strong>
        </div>
        <div
          className="fleet-utilization-track"
          role="progressbar"
          aria-label="Fleet capacity utilization"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overallUtilization ?? 0}
        >
          <div
            className="fleet-utilization-fill"
            style={{ width: `${Math.min(overallUtilization ?? 0, 100)}%` }}
          />
        </div>
        <div className="fleet-utilization-legend">
          <span>{totalAssigned.toLocaleString()} assigned</span>
          <span>{totalCapacity.toLocaleString()} total seats</span>
        </div>
      </div>
    </section>
  );
}

function OperationalMetric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="ops-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function AttendanceOverview({ events }: { events: any[] }) {
  const stats = useMemo(() => {
    const counts = new Map<string, number>();
    let dated = 0;
    for (const event of events) {
      const type = normalizedStatus(field(event, 'event_type', 'attendance_status', 'status'));
      counts.set(type, (counts.get(type) || 0) + 1);
      if (field(event, 'event_date', 'service_date', 'date')) dated += 1;
    }
    const boarded = [...counts.entries()]
      .filter(([key]) => key.includes('board'))
      .reduce((sum, [, count]) => sum + count, 0);
    const absent = [...counts.entries()]
      .filter(([key]) => key.includes('absent'))
      .reduce((sum, [, count]) => sum + count, 0);
    const exceptions = [...counts.entries()]
      .filter(([key]) => ['missed', 'disrupt', 'exception', 'late'].some(term => key.includes(term)))
      .reduce((sum, [, count]) => sum + count, 0);
    return { counts, boarded, absent, exceptions, dated };
  }, [events]);

  const statusRows = [...stats.counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <section className="ops-overview">
      <div className="ops-metrics">
        <OperationalMetric label="Attendance events" value={events.length.toLocaleString()} note="Records retrieved across all pages" />
        <OperationalMetric label="Boarded" value={stats.boarded.toLocaleString()} note="Event types containing boarded" />
        <OperationalMetric label="Absent" value={stats.absent.toLocaleString()} note="Event types containing absent" />
        <OperationalMetric label="Pickup / disruption exceptions" value={stats.exceptions.toLocaleString()} note="Missed, disrupted, late or exception events" />
      </div>
      <div className="ops-breakdown">
        <b>Attendance event breakdown</b>
        <span>Counts are grouped by the event labels returned by the API.</span>
        <div className="ops-breakdown-grid">
          {statusRows.length ? statusRows.map(([label, count]) => (
            <div className="ops-breakdown-item" key={label}>
              <span>{label}</span><strong>{count.toLocaleString()}</strong>
              <i><em style={{ width: `${events.length ? count / events.length * 100 : 0}%` }} /></i>
            </div>
          )) : <span>No attendance events returned.</span>}
        </div>
      </div>
    </section>
  );
}

function NotificationsOverview({ notifications }: { notifications: any[] }) {
  const stats = useMemo(() => {
    const statuses = new Map<string, number>();
    const channels = new Map<string, number>();
    for (const item of notifications) {
      const status = normalizedStatus(field(item, 'status', 'delivery_status'));
      const channel = normalizedStatus(field(item, 'channel', 'delivery_channel'));
      statuses.set(status, (statuses.get(status) || 0) + 1);
      channels.set(channel, (channels.get(channel) || 0) + 1);
    }
    const delivered = [...statuses.entries()]
      .filter(([key]) => ['sent', 'delivered', 'success', 'completed'].some(term => key.includes(term)))
      .reduce((sum, [, count]) => sum + count, 0);
    const failed = [...statuses.entries()]
      .filter(([key]) => ['failed', 'error', 'undelivered'].some(term => key.includes(term)))
      .reduce((sum, [, count]) => sum + count, 0);
    return { statuses, channels, delivered, failed };
  }, [notifications]);
  const statusRows = [...stats.statuses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const channelRows = [...stats.channels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <section className="ops-overview">
      <div className="ops-metrics">
        <OperationalMetric label="Notification records" value={notifications.length.toLocaleString()} note="Records retrieved across all pages" />
        <OperationalMetric label="Sent / delivered" value={stats.delivered.toLocaleString()} note="Based on returned status labels" />
        <OperationalMetric label="Failed" value={stats.failed.toLocaleString()} note="Failed, error or undelivered statuses" />
        <OperationalMetric label="Channels used" value={stats.channels.size.toLocaleString()} note="Distinct channel labels in API records" />
      </div>
      <div className="ops-breakdown-grid ops-dual-breakdown">
        <div className="ops-breakdown">
          <b>Delivery status</b><span>Actual API status values</span>
          {statusRows.map(([label, count]) => <div className="ops-inline-stat" key={label}><span>{label}</span><strong>{count}</strong></div>)}
        </div>
        <div className="ops-breakdown">
          <b>Communication channels</b><span>Actual API channel values</span>
          {channelRows.map(([label, count]) => <div className="ops-inline-stat" key={label}><span>{label}</span><strong>{count}</strong></div>)}
        </div>
      </div>
      <p className="ops-note">These are notification records in the database; they do not independently confirm delivery to a guardian's device.</p>
    </section>
  );
}

function ExceptionsOverview({ exceptions }: { exceptions: any[] }) {
  const stats = useMemo(() => {
    const severities = new Map<string, number>();
    const types = new Map<string, number>();
    for (const item of exceptions) {
      const severity = normalizedStatus(field(item, 'severity', 'priority'));
      const type = normalizedStatus(field(item, 'anomaly_type', 'exception_type', 'type'));
      severities.set(severity, (severities.get(severity) || 0) + 1);
      types.set(type, (types.get(type) || 0) + 1);
    }
    return { severities, types };
  }, [exceptions]);
  const severityRows = [...stats.severities.entries()].sort((a, b) => b[1] - a[1]);
  const typeRows = [...stats.types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <section className="ops-overview">
      <div className="ops-metrics">
        <OperationalMetric label="Detected exceptions" value={exceptions.length.toLocaleString()} note="Records returned by the exceptions endpoint" />
        <OperationalMetric label="High severity" value={(stats.severities.get('high') || stats.severities.get('critical') || 0).toLocaleString()} note="High or critical labels where present" />
        <OperationalMetric label="Severity categories" value={stats.severities.size.toLocaleString()} note="Distinct severity labels returned" />
        <OperationalMetric label="Exception types" value={stats.types.size.toLocaleString()} note="Distinct exception type labels" />
      </div>
      <div className="ops-breakdown-grid ops-dual-breakdown">
        <div className="ops-breakdown">
          <b>Severity distribution</b><span>Based on API severity fields</span>
          {severityRows.map(([label, count]) => <div className="ops-inline-stat" key={label}><span>{label === 'unknown' ? 'Not specified' : label}</span><strong>{count}</strong></div>)}
        </div>
        <div className="ops-breakdown">
          <b>Exception types</b><span>Most common returned types</span>
          {typeRows.map(([label, count]) => <div className="ops-inline-stat" key={label}><span>{label === 'unknown' ? 'Not specified' : label}</span><strong>{count}</strong></div>)}
        </div>
      </div>
      <p className="ops-note">Exception counts reflect the detection endpoint response; they are not a generalized model accuracy score.</p>
    </section>
  );
}

export function DataPage({ kind }: { kind: PageKind }) {
  const config = configs[kind];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [fleetStatus, setFleetStatus] = useState('all');
  const [accessibilityFilter, setAccessibilityFilter] = useState('all');

  const query = useQuery({
    queryKey: [config.queryKey, page],
    queryFn: () => config.query(
      config.paginated ? { skip: page * PAGE_SIZE, limit: PAGE_SIZE } : undefined
    ),
    placeholderData: previous => previous,
  });

  const assignmentsQuery = useQuery({
    queryKey: ['fleet-assignments-for-utilization'],
    queryFn: fetchAllAssignments,
    enabled: kind === 'fleet',
    staleTime: 30_000,
  });

  const allAssignmentsQuery = useQuery({
    queryKey: ['assignments-overview-all-pages'],
    queryFn: fetchAllAssignments,
    enabled: kind === 'assignments',
    staleTime: 30_000,
  });

  const routesQuery = useQuery({
    queryKey: ['fleet-routes-for-driver-mapping'],
    queryFn: endpoints.routes,
    enabled: kind === 'fleet',
    staleTime: 30_000,
  });

  const routeAssignmentsQuery = useQuery({
    queryKey: ['route-assignments-for-allocation'],
    queryFn: fetchAllAssignments,
    enabled: kind === 'routes',
    staleTime: 30_000,
  });

  const attendanceAllQuery = useQuery({
    queryKey: ['attendance-overview-all-pages'],
    queryFn: () => fetchAllPages(params => endpoints.attendance(params)),
    enabled: kind === 'attendance',
    staleTime: 30_000,
  });

  const notificationsAllQuery = useQuery({
    queryKey: ['notifications-overview-all-pages'],
    queryFn: () => fetchAllPages(params => endpoints.notifications(params)),
    enabled: kind === 'notifications',
    staleTime: 30_000,
  });

  const result = useMemo(() => {
    if (kind === 'exceptions') {
      const items = flattenExceptions(query.data);
      return { items, total: items.length };
    }
    return unwrapList(query.data);
  }, [query.data, kind]);

  const fleetRows = useMemo(() => {
    if (kind !== 'fleet') return result.items;

    const routeList = unwrapList(routesQuery.data).items;
    const routeByBus = new Map<string, any>();
    routeList.forEach((route: any) => {
      const busId = field(route, 'bus_id', 'vehicle_id');
      if (busId !== undefined && busId !== null) routeByBus.set(String(busId), route);
    });

    const assignments = assignmentsQuery.data || [];
    const counts = new Map<string, number>();

    assignments.forEach((assignment: any) => {
      if (!isCountableAssignment(assignment)) return;
      const busId = field(assignment, 'bus_id', 'vehicle_id');
      if (busId === undefined || busId === null || busId === '') return;
      const key = String(busId);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return result.items.map((bus: any) => {
      const busId = field(bus, 'bus_id', 'id', 'vehicle_id');
      const capacity = toNumber(field(bus, 'capacity', 'max_capacity', 'seat_capacity'));
      const assigned = counts.get(String(busId)) || 0;

      const assignedRoute = routeByBus.get(String(busId));
      return {
        ...bus,
        bus_id: busId,
        assigned_route: assignedRoute
          ? field(assignedRoute, 'route_name', 'name', 'route_id', 'id')
          : 'Unassigned',
        driver_id: assignedRoute
          ? field(assignedRoute, 'driver_id', 'driver_name') ?? '—'
          : '—',
        capacity,
        assigned_students: assigned,
        available_seats: Math.max(capacity - assigned, 0),
        utilization: capacity > 0 ? Math.round((assigned / capacity) * 100) : null,
      };
    });
  }, [kind, result.items, assignmentsQuery.data, routesQuery.data]);

  const routeRows = useMemo(() => {
    if (kind !== 'routes') return fleetRows;

    const assignments = routeAssignmentsQuery.data || [];
    const counts = new Map<string, number>();
    assignments.forEach((assignment: any) => {
      if (!isCountableAssignment(assignment)) return;
      const routeId = field(assignment, 'route_id');
      if (routeId === undefined || routeId === null || routeId === '') return;
      const key = String(routeId);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return result.items.map((route: any) => {
      const routeId = field(route, 'route_id', 'id');
      const stops = field(route, 'stops', 'stop_ids', 'route_stops');
      const explicitStopCount = field(route, 'stop_count', 'number_of_stops');
      const stopCount = Array.isArray(stops)
        ? stops.length
        : explicitStopCount !== undefined
          ? toNumber(explicitStopCount)
          : null;

      return {
        ...route,
        route_id: routeId,
        assigned_bus: field(route, 'bus_id', 'vehicle_id') ?? 'Unassigned',
        assigned_driver: field(route, 'driver_id', 'driver_name') ?? '—',
        stop_count_display: stopCount === null ? '—' : stopCount,
        assigned_students: counts.get(String(routeId)) || 0,
      };
    });
  }, [kind, fleetRows, result.items, routeAssignmentsQuery.data]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return routeRows.filter((row: any) => {
      const matchesSearch = !needle || Object.values(row || {}).some(value =>
        String(value ?? '').toLowerCase().includes(needle)
      );

      if (!matchesSearch) return false;

      if (kind === 'fleet') {
        const status = normalizedStatus(field(row, 'status', 'vehicle_status'));
        const isMaintenance = status.includes('maintenance');
        const isInactive = ['inactive', 'retired', 'out of service', 'decommissioned'].some(s => status.includes(s));
        const isActive = !isMaintenance && !isInactive &&
          ['active', 'available', 'operational', 'in service', ''].some(s => status === s || status.includes(s));

        if (fleetStatus === 'active' && !isActive) return false;
        if (fleetStatus === 'maintenance' && !isMaintenance) return false;
        if (fleetStatus === 'inactive' && !isInactive) return false;

        if (accessibilityFilter === 'yes' && !isAccessible(row)) return false;
        if (accessibilityFilter === 'no' && isAccessible(row)) return false;
      }

      return true;
    });
  }, [routeRows, search, kind, fleetStatus, accessibilityFilter]);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const columns = config.columns.map(column => ({
    key: column.key,
    label: column.label,
    render: (row: any) => {
      if (column.render) return column.render(row);
      const value = getRowValue(row, column);
      return column.status ? <StatusPill value={value} /> : String(value ?? '—');
    },
  }));

  const changePage = (nextPage: number) => {
    setPage(Math.max(0, Math.min(nextPage, totalPages - 1)));
  };

  const isLoading = query.isLoading ||
    (kind === 'fleet' && (assignmentsQuery.isLoading || routesQuery.isLoading)) ||
    (kind === 'routes' && routeAssignmentsQuery.isLoading) ||
    (kind === 'assignments' && allAssignmentsQuery.isLoading) ||
    (kind === 'attendance' && attendanceAllQuery.isLoading) ||
    (kind === 'notifications' && notificationsAllQuery.isLoading);
  const isError = query.isError ||
    (kind === 'fleet' && assignmentsQuery.isError) ||
    (kind === 'routes' && routeAssignmentsQuery.isError) ||
    (kind === 'assignments' && allAssignmentsQuery.isError) ||
    (kind === 'attendance' && attendanceAllQuery.isError) ||
    (kind === 'notifications' && notificationsAllQuery.isError);
  const currentError = query.isError
    ? query.error
    : kind === 'routes'
      ? routeAssignmentsQuery.error
      : kind === 'assignments'
        ? allAssignmentsQuery.error
        : kind === 'attendance'
          ? attendanceAllQuery.error
          : kind === 'notifications'
            ? notificationsAllQuery.error
            : assignmentsQuery.error;

  return (
    <>
      <PageHeading
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={
          <button
            className="btn btn-light"
            onClick={() => {
              query.refetch();
              if (kind === 'fleet') {
                assignmentsQuery.refetch();
                routesQuery.refetch();
              }
              if (kind === 'routes') routeAssignmentsQuery.refetch();
              if (kind === 'assignments') allAssignmentsQuery.refetch();
              if (kind === 'attendance') attendanceAllQuery.refetch();
              if (kind === 'notifications') notificationsAllQuery.refetch();
            }}
          >
            <Download size={15} />
            Refresh records
          </button>
        }
      />

      {kind === 'fleet' && !isLoading && !isError && (
        <FleetOverview
          buses={result.items}
          assignments={assignmentsQuery.data || []}
        />
      )}

      {kind === 'routes' && !isLoading && !isError && (
        <RouteOverview
          routes={result.items}
          assignments={routeAssignmentsQuery.data || []}
        />
      )}

      {kind === 'assignments' && !isLoading && !isError && (
        <AssignmentOverview assignments={allAssignmentsQuery.data || []} />
      )}

      {kind === 'attendance' && !isLoading && !isError && (
        <AttendanceOverview events={attendanceAllQuery.data || []} />
      )}

      {kind === 'notifications' && !isLoading && !isError && (
        <NotificationsOverview notifications={notificationsAllQuery.data || []} />
      )}

      {kind === 'exceptions' && !isLoading && !isError && (
        <ExceptionsOverview exceptions={result.items} />
      )}

      <div className="panel data-panel">
        <div className="table-toolbar">
          <div>
            <b>{kind === 'fleet' ? 'Vehicle directory' : kind === 'routes' ? 'Route directory' : kind === 'assignments' ? 'Assignment register' : kind === 'attendance' ? 'Attendance event log' : kind === 'notifications' ? 'Notification register' : kind === 'exceptions' ? 'Exception register' : `${config.title} directory`}</b>
            <span>
              {isLoading
                ? 'Loading records…'
                : `${kind === 'fleet' || kind === 'routes' ? filteredRows.length : result.total.toLocaleString()} records`}
            </span>
          </div>

          <div className="fleet-toolbar-controls">
            {kind === 'fleet' && (
              <>
                <select
                  className="fleet-filter"
                  value={fleetStatus}
                  onChange={event => setFleetStatus(event.target.value)}
                  aria-label="Filter fleet by status"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active / available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive / out of service</option>
                </select>
                <select
                  className="fleet-filter"
                  value={accessibilityFilter}
                  onChange={event => setAccessibilityFilter(event.target.value)}
                  aria-label="Filter accessible vehicles"
                >
                  <option value="all">All vehicles</option>
                  <option value="yes">Accessible only</option>
                  <option value="no">Not accessible</option>
                </select>
              </>
            )}
            <SearchBox
              value={search}
              onChange={value => {
                setSearch(value);
                setPage(0);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState
            message={errorMessage(currentError)}
            retry={() => {
              query.refetch();
              if (kind === 'fleet') {
                assignmentsQuery.refetch();
                routesQuery.refetch();
              }
              if (kind === 'routes') routeAssignmentsQuery.refetch();
              if (kind === 'assignments') allAssignmentsQuery.refetch();
              if (kind === 'attendance') attendanceAllQuery.refetch();
              if (kind === 'notifications') notificationsAllQuery.refetch();
            }}
          />
        ) : filteredRows.length > 0 ? (
          <DataTable
            columns={columns}
            rows={filteredRows}
            rowKey={config.columns[0].key}
          />
        ) : (
          <EmptyState
            title={search || fleetStatus !== 'all' || accessibilityFilter !== 'all'
              ? 'No matching records'
              : 'No records returned'}
            detail="Try changing the search term or filters."
          />
        )}

        {!isLoading && !isError && (
          <div className="pagination">
            <span className="pagination-info">
              {config.paginated
                ? `Page ${page + 1} of ${totalPages} · ${result.total.toLocaleString()} records`
                : `${filteredRows.length} records`}
              {search && config.paginated ? ' · Search applies to this page' : ''}
            </span>

            {config.paginated && (
              <div className="pagination-actions">
                <button
                  className="btn btn-light"
                  disabled={page === 0 || query.isFetching}
                  onClick={() => changePage(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-light"
                  disabled={page + 1 >= totalPages || query.isFetching}
                  onClick={() => changePage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        <div className="table-bottom">
          <span>TransitIQ data view</span>
          <span>
            {query.isFetching ||
            (kind === 'fleet' && (assignmentsQuery.isFetching || routesQuery.isFetching)) ||
            (kind === 'routes' && routeAssignmentsQuery.isFetching) ||
            (kind === 'assignments' && allAssignmentsQuery.isFetching) ||
            (kind === 'attendance' && attendanceAllQuery.isFetching) ||
            (kind === 'notifications' && notificationsAllQuery.isFetching)
              ? 'Updating…'
              : 'Connected to API'}
          </span>
        </div>
      </div>
    </>
  );
}

export function ReportsPage() {
  const queries = [
    useQuery({ queryKey: ['report-students-all'], queryFn: () => fetchAllPages(params => endpoints.students(params)) }),
    useQuery({ queryKey: ['report-buses'], queryFn: endpoints.buses }),
    useQuery({ queryKey: ['report-routes'], queryFn: endpoints.routes }),
    useQuery({ queryKey: ['report-assignments-all'], queryFn: fetchAllAssignments }),
    useQuery({ queryKey: ['report-attendance-all'], queryFn: () => fetchAllPages(params => endpoints.attendance(params)) }),
    useQuery({ queryKey: ['report-notifications-all'], queryFn: () => fetchAllPages(params => endpoints.notifications(params)) }),
    useQuery({ queryKey: ['report-exceptions'], queryFn: async () => flattenExceptions(await endpoints.exceptions()) }),
  ];

  const names = ['Students', 'Fleet', 'Routes', 'Assignments', 'Attendance events', 'Notifications', 'Safety exceptions'];
  const sources = [
    'GET /api/students', 'GET /api/buses', 'GET /api/routes',
    'GET /api/assignments', 'GET /api/attendance', 'GET /api/notifications', 'GET /api/exceptions',
  ];
  const values = queries.map((query, index) => {
    if (index === 1 || index === 2 || index === 6) return Array.isArray(query.data) ? query.data.length : 0;
    return Array.isArray(query.data) ? query.data.length : unwrapList(query.data).total;
  });
  const busy = queries.some(query => query.isLoading);
  const failed = queries.find(query => query.isError);

  const exportCsv = () => {
    const lines = [
      ['Dataset', 'Records', 'API source'],
      ...names.map((name, index) => [name, String(values[index]), sources[index]]),
    ];
    const csv = lines
      .map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'transitiq-report-summary.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeading
        eyebrow="REPORTING"
        title="Reports & exports"
        description="A consolidated inventory of records retrieved from the TransitIQ API."
        action={
          <button className="btn btn-primary" onClick={exportCsv} disabled={busy || !!failed}>
            <Download size={15} />
            Export summary CSV
          </button>
        }
      />
      <div className="panel data-panel">
        <div className="table-toolbar">
          <div>
            <b>Operational dataset inventory</b>
            <span>Counts are calculated from fetched records across paginated endpoints.</span>
          </div>
        </div>
        {busy ? (
          <Loading />
        ) : failed ? (
          <ErrorState message={errorMessage(failed.error)} retry={() => queries.forEach(query => query.refetch())} />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Dataset' },
              { key: 'count', label: 'Records' },
              { key: 'source', label: 'API source' },
            ]}
            rows={names.map((name, index) => ({ name, count: values[index], source: sources[index] }))}
            rowKey="name"
          />
        )}
        <div className="table-bottom">
          <span>CSV contains dataset counts and API paths only; no personal contact information is exported.</span>
          <span>Live API data</span>
        </div>
      </div>
    </>
  );
}

export function SettingsPage() {
  const health = useQuery({
    queryKey: ['settings-health'],
    queryFn: endpoints.health,
  });

  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE CONFIGURATION"
        title="Settings"
        description="Environment and connection information for this TransitIQ frontend."
      />

      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-title">
            <div className="health-symbol blue"><Settings size={17} /></div>
            <div>
              <b>API connection</b>
              <span>Backend service connectivity</span>
            </div>
          </div>

          <div className="setting-line">
            <span>API base URL</span>
            <code>{import.meta.env.VITE_API_BASE_URL || 'Vite proxy → http://127.0.0.1:8000'}</code>
          </div>

          <div className="setting-line">
            <span>Health endpoint</span>
            <StatusPill
              value={health.isLoading ? 'Checking' : health.isError ? 'Unavailable' : 'Responding'}
            />
          </div>

          <div className="setting-line">
            <span>Frontend mode</span>
            <code>{import.meta.env.MODE}</code>
          </div>

          <button className="btn btn-light" onClick={() => health.refetch()}>
            <Activity size={15} />
            Test connection
          </button>
        </section>

        <section className="panel settings-card">
          <div className="settings-title">
            <div className="health-symbol green"><ShieldAlert size={17} /></div>
            <div>
              <b>Data & privacy</b>
              <span>Current product boundaries</span>
            </div>
          </div>

          <ul className="settings-list">
            <li>Student and guardian records are read from the backend.</li>
            <li>Guardian phone numbers and email addresses are not displayed in this UI.</li>
            <li>No actual SMS messages are sent by the frontend.</li>
            <li>No GPS tracking or live vehicle location is currently connected.</li>
            <li>Changes to operational records are not enabled because the API exposes read endpoints.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
