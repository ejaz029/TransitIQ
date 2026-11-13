import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './layouts/Shell';
import Overview from './pages/Overview';
import { DataPage, ReportsPage, SettingsPage } from './pages/DataPages';
function NotFound(){return <div className="not-found"><h1>Page not found</h1><p>The page you're looking for doesn't exist.</p><a className="btn btn-primary" href="/">Back to overview</a></div>}
export default function App(){return <Routes><Route element={<Shell/>}><Route index element={<Overview/>}/><Route path="students" element={<DataPage kind="students"/>}/><Route path="fleet" element={<DataPage kind="fleet"/>}/><Route path="routes" element={<DataPage kind="routes"/>}/><Route path="assignments" element={<DataPage kind="assignments"/>}/><Route path="attendance" element={<DataPage kind="attendance"/>}/><Route path="notifications" element={<DataPage kind="notifications"/>}/><Route path="exceptions" element={<DataPage kind="exceptions"/>}/><Route path="reports" element={<ReportsPage/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="*" element={<NotFound/>}/></Route></Routes>}
