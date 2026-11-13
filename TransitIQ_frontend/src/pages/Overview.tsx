import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BusFront,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Route as RouteIcon,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { endpoints, errorMessage, field, unwrapList } from '../lib/api';
import {
  ErrorState,
  Loading,
  PageHeading,
  StatCard,
  StatusPill,
} from '../components/Primitives';

const ATTENDANCE_PAGE_SIZE = 200;
const MAX_ATTENDANCE_PAGES = 100;

type AttendanceRow = Record<string, any>;
type AttendancePage = {
  items: AttendanceRow[];
  total?: number;
};

/**
 * Normalize the response shapes used by list endpoints. Attendance has
 * appeared as a raw array as well as an object containing items/events.
 */
function readAttendancePage(payload: any): AttendancePage {
  if (Array.isArray(payload)) {
    return { items: payload, total: undefined };
  }

  if (!payload || typeof payload !== 'object') {
    return { items: [], total: 0 };
  }

  const possibleLists = [
    payload.items,
    payload.results,
    payload.data,
    payload.records,
    payload.attendance,
    payload.attendance_events,
    payload.events,
  ];

  const rows = possibleLists.find(Array.isArray);
  if (rows) {
    const rawTotal =
      payload.total ??
      payload.total_count ??
      payload.count ??
      payload.pagination?.total;
    const parsedTotal = rawTotal === undefined ? undefined : Number(rawTotal);

    return {
      items: rows,
      total:
        parsedTotal !== undefined && Number.isFinite(parsedTotal)
          ? parsedTotal
          : undefined,
    };
  }

  // Handle APIs that wrap the actual list inside { data: { items: [...] } }.
  for (const nested of [payload.data, payload.results]) {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const result = readAttendancePage(nested);
      if (result.items.length || result.total !== undefined) return result;
    }
  }

  return { items: [], total: 0 };
}

/** Fetch every attendance page so the chart and derived KPIs use the same data. */
async function fetchAllAttendance(): Promise<AttendanceRow[]> {
  const firstResponse = await endpoints.attendance({
    skip: 0,
    limit: ATTENDANCE_PAGE_SIZE,
  });
  const firstPage = readAttendancePage(firstResponse);
  const allRows = [...firstPage.items];

  // The API may return the complete array even when pagination parameters exist.
  if (allRows.length > ATTENDANCE_PAGE_SIZE) return allRows;

  if (firstPage.total !== undefined) {
    const pageOffsets: number[] = [];
    for (
      let skip = allRows.length;
      skip < firstPage.total && pageOffsets.length < MAX_ATTENDANCE_PAGES - 1;
      skip += ATTENDANCE_PAGE_SIZE
    ) {
      pageOffsets.push(skip);
    }

    const remainingPages = await Promise.all(
      pageOffsets.map(async skip =>
        readAttendancePage(
          await endpoints.attendance({
            skip,
            limit: ATTENDANCE_PAGE_SIZE,
          })
        )
      )
    );

    for (const page of remainingPages) allRows.push(...page.items);
    return allRows;
  }

  // If the response has no total field, keep requesting pages until a short
  // page is returned. The page cap protects against a broken/ignored offset.
  let skip = allRows.length;
  let pageCount = 1;

  while (
    firstPage.items.length === ATTENDANCE_PAGE_SIZE &&
    pageCount < MAX_ATTENDANCE_PAGES
  ) {
    const nextPage = readAttendancePage(
      await endpoints.attendance({
        skip,
        limit: ATTENDANCE_PAGE_SIZE,
      })
    );

    if (!nextPage.items.length) break;

    allRows.push(...nextPage.items);
    skip += nextPage.items.length;
    pageCount += 1;

    if (nextPage.items.length < ATTENDANCE_PAGE_SIZE) break;
  }

  return allRows;
}

function normalizeEventType(value: unknown): string {
  return String(value ?? 'OTHER')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function getEventType(row: AttendanceRow): string {
  return normalizeEventType(
    field(row, 'event_type', 'attendance_status', 'status', 'eventType')
  );
}

function countEvents(rows: AttendanceRow[], type: string): number {
  const expected = normalizeEventType(type);
  return rows.reduce(
    (total, row) => total + (getEventType(row) === expected ? 1 : 0),
    0
  );
}

function extractExceptionRows(data: any): AttendanceRow[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  for (const key of [
    'items',
    'results',
    'exceptions',
    'anomalies',
    'cases',
    'detections',
  ]) {
    if (Array.isArray(data[key])) return data[key];
  }

  if (data.results && typeof data.results === 'object') {
    return extractExceptionRows(data.results);
  }
  if (data.data && typeof data.data === 'object') {
    return extractExceptionRows(data.data);
  }

  return [];
}

function formatRefreshTime(timestamp: number): string {
  if (!timestamp) return 'WAITING FOR FIRST UPDATE';

  return `LAST UPDATED ${new Date(timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;
}

export default function Overview() {
  const dash = useQuery({
    queryKey: ['dashboard'],
    queryFn: endpoints.dashboard,
  });

  const attendance = useQuery({
    queryKey: ['attendance', 'overview', 'all'],
    queryFn: fetchAllAttendance,
  });

  const buses = useQuery({
    queryKey: ['buses'],
    queryFn: endpoints.buses,
  });

  const exceptions = useQuery({
    queryKey: ['exceptions'],
    queryFn: endpoints.exceptions,
  });

  if (dash.isLoading) return <Loading />;

  if (dash.isError) {
    return (
      <ErrorState
        message={errorMessage(dash.error)}
        retry={() => void dash.refetch()}
      />
    );
  }

  const dashboardData: any = dash.data ?? {};
  const attendanceRows = attendance.data ?? [];
  const busRows = unwrapList(buses.data).items;
  const exceptionRows = extractExceptionRows(exceptions.data);

  const dashboardCount = (...keys: string[]) =>
    field(dashboardData, ...keys) ?? '—';

  // Derive these values from the full attendance dataset. This avoids relying
  // on dashboard field names that may differ between backend versions.
  const boardedCount = attendance.isSuccess
    ? countEvents(attendanceRows, 'BOARDED')
    : dashboardCount('boarded_events', 'boarded_count', 'total_boarded', 'boarded');

  const missedPickupCount = attendance.isSuccess
    ? countEvents(attendanceRows, 'MISSED_PICKUP')
    : dashboardCount('missed_pickups', 'missed_pickup_count');

  const attendanceTotal = attendance.isSuccess
    ? attendanceRows.length
    : dashboardCount('total_attendance_events', 'attendance_events');

  const attendanceTypes = [
    { key: 'BOARDED', label: 'BOARDED' },
    { key: 'ABSENT', label: 'ABSENT' },
    { key: 'DISRUPTED', label: 'DISRUPTED' },
    { key: 'MISSED_PICKUP', label: 'MISSED PICKUP' },
  ];

  const eventCounts = attendanceTypes.map(type => ({
    name: type.label,
    events: countEvents(attendanceRows, type.key),
  }));

  const otherEvents = attendanceRows.filter(
    (row: AttendanceRow) => !attendanceTypes.some(type => type.key === getEventType(row))
  ).length;

  if (otherEvents > 0) {
    eventCounts.push({ name: 'OTHER', events: otherEvents });
  }

  const refreshAll = () => {
    void Promise.all([
      dash.refetch(),
      attendance.refetch(),
      buses.refetch(),
      exceptions.refetch(),
    ]);
  };

  return (
    <>
      <PageHeading
        eyebrow="NETWORK OVERVIEW · OPERATIONS SNAPSHOT"
        title="Operations command centre"
        description="A clear operational view of your school transportation network."
        action={
          <button
            className="btn btn-primary"
            onClick={refreshAll}
            disabled={dash.isFetching || attendance.isFetching}
          >
            <Activity size={16} />
            {dash.isFetching || attendance.isFetching ? 'Refreshing…' : 'Refresh data'}
          </button>
        }
      />

      <div className="welcome-strip">
        <div className="welcome-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <b>Network intelligence, in one place</b>
          <span>
            Monitor student allocation, fleet records, attendance and safety
            exceptions.
          </span>
        </div>
        <div className="welcome-status">
          <span className="live-dot" /> API connected
        </div>
      </div>

      <div className="section-head">
        <div>
          <h2>Network snapshot</h2>
          <p>Latest operational snapshot from the TransitIQ API</p>
        </div>
        <span className="muted-caption">
          {formatRefreshTime(dash.dataUpdatedAt)}
        </span>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Registered students"
          value={dashboardCount('total_students', 'students_count')}
          icon={GraduationCap}
          tone="blue"
          note="Student records"
        />
        <StatCard
          label="Fleet vehicles"
          value={dashboardCount('total_buses', 'buses_count')}
          icon={BusFront}
          tone="violet"
          note={`${busRows.length || '—'} vehicle records loaded`}
        />
        <StatCard
          label="Active assignments"
          value={dashboardCount('active_assignments', 'assignments_count')}
          icon={Users}
          tone="teal"
          note="Students allocated to routes"
        />
        <StatCard
          label="Routes configured"
          value={dashboardCount('total_routes', 'routes_count')}
          icon={RouteIcon}
          tone="amber"
          note="Transport routes"
        />
      </div>

      <div className="stats-grid stats-grid-secondary">
        <StatCard
          label="Attendance events"
          value={attendanceTotal}
          icon={CalendarCheck}
          tone="blue"
        />
        <StatCard
          label="Students boarded"
          value={boardedCount}
          icon={CheckCircle2}
          tone="teal"
          note="Recorded boarded events"
        />
        <StatCard
          label="Missed pickups"
          value={missedPickupCount}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Notifications sent"
          value={dashboardCount('sent_notifications', 'notifications_sent')}
          icon={Activity}
          tone="violet"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Attendance activity</h3>
              <p>Distribution of all retrieved attendance events</p>
            </div>
            <span className="chart-tag">EVENT BREAKDOWN</span>
          </div>

          {attendance.isLoading ? (
            <Loading />
          ) : attendance.isError ? (
            <ErrorState
              message={errorMessage(attendance.error)}
              retry={() => void attendance.refetch()}
            />
          ) : attendanceRows.length > 0 ? (
            <>
              <div className="chart-summary">
                <strong>{attendanceRows.length.toLocaleString('en-IN')}</strong>
                <span>total attendance events analysed</span>
              </div>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={eventCounts}>
                    <defs>
                      <linearGradient
                        id="attendanceFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#4d83f5" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="#4d83f5" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke="#edf0f5"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#7e899b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#7e899b' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        Number(value ?? 0).toLocaleString('en-IN'),
                        'Events',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stroke="#477df1"
                      strokeWidth={2.5}
                      fill="url(#attendanceFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="chart-empty">
              No attendance events were returned by the API.
            </div>
          )}
        </section>

        <section className="panel side-panel">
          <div className="panel-heading">
            <div>
              <h3>Operations health</h3>
              <p>Current service signals</p>
            </div>
            <div className="health-icon">
              <Activity size={17} />
            </div>
          </div>

          <div className="health-row">
            <div className="health-symbol green">
              <CheckCircle2 size={17} />
            </div>
            <div>
              <b>API service</b>
              <small>Dashboard data received</small>
            </div>
            <StatusPill value="Connected" />
          </div>

          <div className="health-row">
            <div className="health-symbol blue">
              <BusFront size={17} />
            </div>
            <div>
              <b>Fleet records</b>
              <small>
                {buses.isSuccess ? `${busRows.length} records in response` : 'Checking fleet endpoint'}
              </small>
            </div>
            <StatusPill
              value={buses.isLoading ? 'Checking' : buses.isError ? 'Unavailable' : 'Loaded'}
            />
          </div>

          <div className="health-row">
            <div className="health-symbol orange">
              <AlertTriangle size={17} />
            </div>
            <div>
              <b>Safety exceptions</b>
              <small>Latest validation report</small>
            </div>
            <StatusPill
              value={
                exceptions.isLoading
                  ? 'Checking'
                  : exceptions.isError
                    ? 'Unavailable'
                    : `${exceptionRows.length} found`
              }
            />
          </div>

          <div className="panel-foot">
            Health indicators reflect API responses, not live GPS or physical
            vehicle telemetry.
          </div>
        </section>
      </div>

      <div className="bottom-note">
        <div className="note-icon">
          <ShieldCheck size={18} />
        </div>
        <div>
          <b>Designed around student safety</b>
          <span>
            TransitIQ keeps student allocation, attendance events and
            notification records traceable in one operational view.
          </span>
        </div>
        <ArrowUpRight size={17} />
      </div>
    </>
  );
}
