import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Websites from './pages/Websites'
import Databases from './pages/Databases'
import Files from './pages/Files'
import Emails from './pages/Emails'
import Ftp from './pages/Ftp'
import Security from './pages/Security'
import Server from './pages/Server'
import Settings from './pages/Settings'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/websites" element={<Websites />} />
          <Route path="/databases" element={<Databases />} />
          <Route path="/files" element={<Files />} />
          <Route path="/emails" element={<Emails />} />
          <Route path="/ftp" element={<Ftp />} />
          <Route path="/security" element={<Security />} />
          <Route path="/server" element={<Server />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
