import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, HardDrive, Cpu, MemoryStick, Globe, Database, Mail } from 'lucide-react';
import { getWsUrl } from '../lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    cpu: Array(20).fill({ time: '', value: 0 }),
    ram: Array(20).fill({ time: '', value: 0 }),
    current: { cpu: 0, ram: 0, disk: 0, network_sent: 0, network_recv: 0 }
  });
  const [summary, setSummary] = useState({ websites: 0, databases: 0, emails: 0 });
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch system summary
    fetch('/api/system/summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(() => setSummary({ websites: 2, databases: 2, emails: 2 }));

    // Connect to WebSocket
    ws.current = new WebSocket(getWsUrl('/api/system/ws/stats'));
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setStats(prev => {
        const newCpu = [...prev.cpu.slice(1), { time, value: data.cpu.overall }];
        const newRam = [...prev.ram.slice(1), { time, value: data.memory.percent }];
        return {
          cpu: newCpu,
          ram: newRam,
          current: {
            cpu: data.cpu.overall,
            ram: data.memory.percent,
            disk: data.disk.percent,
            network_sent: data.network.bytes_sent,
            network_recv: data.network.bytes_recv,
          }
        };
      });
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">Server Overview</h2>
          <p className="text-g-gray-500 mt-1 text-sm font-medium">Real-time resource monitoring and status.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm font-medium">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-g-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-g-success"></span>
            </span>
            <span className="text-g-gray-600 dark:text-g-gray-300">Live Connection</span>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CPU Usage" 
          value={`${stats.current.cpu.toFixed(1)}%`} 
          icon={<Cpu size={24} className="text-g-primary" />} 
          trend="+2.5%"
          trendUp={true}
        />
        <StatCard 
          title="RAM Usage" 
          value={`${stats.current.ram.toFixed(1)}%`} 
          icon={<MemoryStick size={24} className="text-g-success" />} 
          trend="-1.2%"
          trendUp={false}
        />
        <StatCard 
          title="Disk Space" 
          value={`${stats.current.disk.toFixed(1)}%`} 
          icon={<HardDrive size={24} className="text-g-warning" />} 
          trend="+0.1%"
          trendUp={true}
        />
        <StatCard 
          title="Network I/O" 
          value={`${(stats.current.network_sent / 1024 / 1024).toFixed(2)} MB/s`} 
          icon={<Activity size={24} className="text-g-danger" />} 
          trend="Active"
          trendUp={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard title="CPU History" data={stats.cpu} color="var(--g-primary)" gradientId="colorCpu" />
        <ChartCard title="Memory History" data={stats.ram} color="var(--g-success)" gradientId="colorRam" />
      </div>
      
      {/* Services Overview */}
      <div>
         <h3 className="text-lg font-bold mb-4 text-g-gray-900 dark:text-white">Active Resources</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResourceCard icon={<Globe className="text-g-primary" size={24} />} name="Websites" count={summary.websites} status="Running smoothly" />
            <ResourceCard icon={<Database className="text-g-primary" size={24} />} name="Databases" count={summary.databases} status="Optimized" />
            <ResourceCard icon={<Mail className="text-g-primary" size={24} />} name="Emails" count={summary.emails} status="Secured" />
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendUp }: any) => (
  <div className="bg-white dark:bg-g-gray-800 rounded-2xl shadow-sm border border-g-gray-100 dark:border-g-gray-700 p-6 flex flex-col hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-g-gray-50 dark:bg-g-gray-700 rounded-xl">
        {icon}
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trendUp ? 'bg-g-success-light text-g-success dark:bg-opacity-20' : 'bg-g-danger-light text-g-danger dark:bg-opacity-20'}`}>
        {trend}
      </span>
    </div>
    <div>
      <h3 className="text-g-gray-500 dark:text-g-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-g-gray-900 dark:text-white tracking-tight">{value}</p>
    </div>
  </div>
);

const ChartCard = ({ title, data, color, gradientId }: any) => (
  <div className="bg-white dark:bg-g-gray-800 rounded-2xl shadow-sm border border-g-gray-100 dark:border-g-gray-700 overflow-hidden">
    <div className="p-6 border-b border-g-gray-100 dark:border-g-gray-700">
      <h3 className="text-lg font-bold text-g-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-6 h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--g-gray-200)" opacity={0.5} />
          <XAxis dataKey="time" hide />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--g-gray-500)', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--g-white)' }}
            itemStyle={{ color: 'var(--g-gray-900)', fontWeight: 'bold' }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#${gradientId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ResourceCard = ({ icon, name, count, status }: any) => (
    <div className="bg-white dark:bg-g-gray-800 rounded-2xl shadow-sm border border-g-gray-100 dark:border-g-gray-700 p-5 flex items-center hover:shadow-md transition-shadow cursor-pointer">
        <div className="p-4 bg-g-primary-light dark:bg-g-primary dark:bg-opacity-20 rounded-xl mr-4">
            {icon}
        </div>
        <div>
            <h4 className="text-g-gray-900 dark:text-white font-bold text-lg">{count} {name}</h4>
            <p className="text-g-gray-500 text-sm">{status}</p>
        </div>
    </div>
)

export default Dashboard;
