import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Globe, Database, Mail, Shield, Settings, Server } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ cpu: [], ram: [] });

  useEffect(() => {
    // Simulate real-time data
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: [...prev.cpu.slice(-20), { time: new Date().toLocaleTimeString(), value: Math.random() * 100 }],
        ram: [...prev.ram.slice(-20), { time: new Date().toLocaleTimeString(), value: Math.random() * 100 }],
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-10">WebHostPanel</h1>
        <nav className="space-y-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<Globe size={20} />} label="Websites" />
          <NavItem icon={<Database size={20} />} label="Databases" />
          <NavItem icon={<Mail size={20} />} label="Emails" />
          <NavItem icon={<Shield size={20} />} label="Security" />
          <NavItem icon={<Server size={20} />} label="Server" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Server Overview</h2>
          <div className="flex items-center space-x-4">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Server Online</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="CPU Usage" value={`${stats.cpu[stats.cpu.length - 1]?.value.toFixed(1) || 0}%`} color="text-blue-600" />
          <StatCard title="RAM Usage" value={`${stats.ram[stats.ram.length - 1]?.value.toFixed(1) || 0}%`} color="text-purple-600" />
          <StatCard title="Disk Usage" value="45%" color="text-orange-600" />
          <StatCard title="Uptime" value="12d 4h 22m" color="text-green-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle>CPU Performance</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.cpu}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>RAM Performance</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.ram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
    {icon}
    <span className="font-medium">{label}</span>
  </div>
);

const StatCard = ({ title, value, color }) => (
  <Card>
    <CardContent className="pt-6 text-center">
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </CardContent>
  </Card>
);

export default Dashboard;
