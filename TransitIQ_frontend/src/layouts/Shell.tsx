import { NavLink, Outlet } from 'react-router-dom';
import { Activity, Bell, BusFront, ChevronDown, ClipboardCheck, FileBarChart, Gauge, GraduationCap, MapPinned, Menu, Route, Settings, ShieldAlert, Users, X } from 'lucide-react';
import { useState } from 'react';
const links = [
  { to: '/', label: 'Overview', icon: Gauge },
  { to: '/students', label: 'Students', icon: GraduationCap },
  { to: '/fleet', label: 'Fleet', icon: BusFront },
  { to: '/routes', label: 'Routes & stops', icon: Route },
  { to: '/assignments', label: 'Assignments', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/exceptions', label: 'Safety & exceptions', icon: ShieldAlert },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];
export default function Shell() {
 const [open,setOpen]=useState(false);
 return <div className="app-shell"><aside className={`sidebar ${open?'sidebar-open':''}`}><div className="brand"><div className="brand-mark"><BusFront size={22}/></div><div><strong>transit<span>IQ</span></strong><small>TRANSPORT INTELLIGENCE</small></div><button className="mobile-close" onClick={()=>setOpen(false)}><X/></button></div><div className="workspace-label">WORKSPACE</div><nav>{links.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span>{label==='Safety & exceptions'&&<span className="nav-dot"/>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="system-card"><div className="system-top"><span className="live-dot"/> System status</div><b>Operations workspace</b><small>Operational data console</small></div><div className="profile"><div className="avatar">AD</div><div><b>Transport Admin</b><small>Administrator</small></div><ChevronDown size={15}/></div></div></aside><main className="main-area"><header className="topbar"><button className="menu-btn" onClick={()=>setOpen(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> <b>Operations</b></div><div className="topbar-right"><span className="top-date"><Activity size={15}/> Live operations</span><div className="top-avatar">AD</div></div></header><div className="content"><Outlet/></div><footer className="footer"><span>TransitIQ <b>·</b> School transportation operations</span><span>Built for safer journeys</span></footer></main>{open&&<button className="scrim" onClick={()=>setOpen(false)} aria-label="Close menu"/>}</div>
}
