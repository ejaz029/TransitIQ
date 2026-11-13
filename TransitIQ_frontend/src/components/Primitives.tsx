import { Search, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="heading-action">{action}</div>}</div>;
}
export function StatCard({ label, value, note, icon: Icon, tone = 'blue' }: { label: string; value: string | number; note?: string; icon: any; tone?: string }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{note && <div className="stat-note">{note}</div>}</article>;
}
export function Loading() { return <div className="state-card"><RefreshCw className="spin"/><span>Loading live data…</span></div>; }
export function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="state-card error-state"><AlertCircle/><div><b>Couldn't load this data</b><p>{message}</p><button className="btn btn-light" onClick={retry}>Try again</button></div></div>; }
export function EmptyState({ title = 'Nothing to show yet', detail = 'Data will appear here when it is available.' }: { title?: string; detail?: string }) { return <div className="empty-state"><Inbox size={26}/><b>{title}</b><span>{detail}</span></div>; }
export function DataTable({ columns, rows, rowKey }: { columns: { key: string; label: string; render?: (row: any) => ReactNode }[]; rows: any[]; rowKey: string }) {
  if (!rows.length) return <EmptyState/>;
  return <div className="table-wrap"><table><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={String(row?.[rowKey] ?? i)}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row) : String(row?.[c.key] ?? '—')}</td>)}</tr>)}</tbody></table></div>;
}
export function SearchBox({ value, onChange, placeholder = 'Search records…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) { return <label className="search-box"><Search size={16}/><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/></label>; }
export function StatusPill({ value }: { value: any }) { const s = String(value ?? 'unknown').toLowerCase().replaceAll('_', ' '); const tone = /active|sent|boarded|approved|completed|valid/.test(s) ? 'good' : /pending|flag|missed|absent|disrupted|warning/.test(s) ? 'warn' : /reject|block|critical|failed|invalid/.test(s) ? 'bad' : 'neutral'; return <span className={`pill ${tone}`}><i/>{s}</span>; }
