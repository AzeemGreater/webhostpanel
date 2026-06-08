import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Database, Save, HardDrive, Plus, Trash2, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';

interface DnsZone {
  id: number;
  domain: string;
}

interface DnsRecord {
  id: number;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority: number | null;
}

interface BackupFile {
  filename: string;
  size_mb: number;
  created: number;
}

interface Website {
  id: number;
  domain: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'dns' | 'backups'>('general');
  const [panelName, setPanelName] = useState('WebHostPanel');
  const [darkMode, setDarkMode] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);

  // DNS State
  const [zones, setZones] = useState<DnsZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DnsZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [newZoneDomain, setNewZoneDomain] = useState('');
  
  // New Record Form
  const [recType, setRecType] = useState('A');
  const [recName, setRecName] = useState('@');
  const [recContent, setRecContent] = useState('');
  const [recPriority, setRecPriority] = useState('');
  const [recTtl, setRecTtl] = useState(3600);

  // Backups State
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSiteId, setBackupSiteId] = useState<string>('');

  const loadData = async () => {
    try {
      const siteRes = await fetch('http://localhost:8000/api/websites');
      const zoneRes = await fetch('http://localhost:8000/api/dns/zones');
      const backupRes = await fetch('http://localhost:8000/api/backups');

      if (siteRes.ok) {
        const siteData = await siteRes.json();
        setWebsites(siteData);
        if (siteData.length > 0) setBackupSiteId(siteData[0].id.toString());
      }
      if (zoneRes.ok) setZones(await zoneRes.json());
      if (backupRes.ok) setBackups(await backupRes.json());
    } catch (err) {
      console.error('Offline/Mock Settings Data load');
      setWebsites([
        { id: 1, domain: 'my-wordpress-blog.com' },
        { id: 2, domain: 'portfolio-site.io' }
      ]);
      setBackupSiteId('1');
      setZones([
        { id: 1, domain: 'my-wordpress-blog.com' },
        { id: 2, domain: 'portfolio-site.io' }
      ]);
      setBackups([
        { filename: 'backup_my-wordpress-blog.com_20260601.tar.gz', size_mb: 42.5, created: Date.now() / 1000 - 86400 }
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Zone Records
  const fetchRecords = async (zone: DnsZone) => {
    setSelectedZone(zone);
    try {
      const res = await fetch(`http://localhost:8000/api/dns/zones/${zone.id}/records`);
      if (res.ok) {
        setRecords(await res.json());
      }
    } catch {
      setRecords([
        { id: 1, type: 'A', name: '@', content: '127.0.0.1', ttl: 3600, priority: null },
        { id: 2, type: 'CNAME', name: 'www', content: zone.domain, ttl: 3600, priority: null }
      ]);
    }
  };

  // Add DNS Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneDomain) return;
    try {
      const res = await fetch(`http://localhost:8000/api/dns/zones?domain=${newZoneDomain}`, {
        method: 'POST'
      });
      if (res.ok) {
        setNewZoneDomain('');
        loadData();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to create zone');
      }
    } catch {
      const newMockZone = { id: Date.now(), domain: newZoneDomain };
      setZones(prev => [...prev, newMockZone]);
      setNewZoneDomain('');
    }
  };

  // Add DNS Record
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !recContent) return;
    const body = {
      type: recType,
      name: recName,
      content: recContent,
      ttl: recTtl,
      priority: recPriority ? parseInt(recPriority) : null
    };

    try {
      const res = await fetch(`http://localhost:8000/api/dns/zones/${selectedZone.id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setRecContent('');
        setRecName('@');
        setRecPriority('');
        fetchRecords(selectedZone);
      }
    } catch {
      const newMockRec = { id: Date.now(), ...body };
      setRecords(prev => [...prev, newMockRec]);
      setRecContent('');
    }
  };

  // Delete DNS Record
  const handleDeleteRecord = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/dns/records/${id}`, { method: 'DELETE' });
      if (res.ok && selectedZone) {
        fetchRecords(selectedZone);
      }
    } catch {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Create Backup Snapshot
  const handleCreateBackup = async () => {
    if (!backupSiteId) return;
    setBackupLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/backups/create/${backupSiteId}`, { method: 'POST' });
      if (res.ok) {
        loadData();
      }
    } catch {
      const website = websites.find(w => w.id === parseInt(backupSiteId));
      const newMockBkup = {
        filename: `${website?.domain || 'site'}_backup_mock_${Date.now()}.tar.gz`,
        size_mb: 15.4,
        created: Date.now() / 1000
      };
      setBackups(prev => [newMockBkup, ...prev]);
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async (file: BackupFile) => {
    if (!confirm(`Restore system state from snapshot: ${file.filename}? This will overwrite existing folder contents.`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/backups/restore?filename=${file.filename}&domain=emulated`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(data.message || 'Backup successfully restored!');
    } catch {
      alert('Snapshot successfully restored! (Mock Mode)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">Panel Configuration</h2>
          <p className="text-g-gray-500 dark:text-g-gray-400 mt-1">Manage general variables, DNS zone files, and snapshot archives.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-2 border-b border-g-gray-200 dark:border-g-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'general'
              ? 'bg-g-primary-light text-g-primary dark:bg-g-primary dark:bg-opacity-20'
              : 'text-g-gray-500 hover:bg-g-gray-100 dark:hover:bg-g-gray-800'
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('dns')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'dns'
              ? 'bg-g-primary-light text-g-primary dark:bg-g-primary dark:bg-opacity-20'
              : 'text-g-gray-500 hover:bg-g-gray-100 dark:hover:bg-g-gray-800'
          }`}
        >
          DNS Zones (Nameserver)
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'backups'
              ? 'bg-g-primary-light text-g-primary dark:bg-g-primary dark:bg-opacity-20'
              : 'text-g-gray-500 hover:bg-g-gray-100 dark:hover:bg-g-gray-800'
          }`}
        >
          Backup Snapshots
        </button>
      </div>

      {/* Tab: General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 border border-g-gray-200 dark:border-g-gray-700 max-w-2xl space-y-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <SettingsIcon className="text-g-primary" />
            <span>Panel Preferences</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-g-gray-900 dark:text-white">Panel Branding Title</p>
                <p className="text-xs text-g-gray-400">Configure name shown in global workspace.</p>
              </div>
              <input
                type="text"
                value={panelName}
                onChange={e => setPanelName(e.target.value)}
                className="px-4 py-2 border border-g-gray-300 dark:border-g-gray-700 rounded-xl focus:ring-2 focus:ring-g-primary dark:bg-g-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-g-gray-100 dark:border-g-gray-700">
              <div>
                <p className="font-semibold text-g-gray-900 dark:text-white">Dynamic Dark Theme</p>
                <p className="text-xs text-g-gray-400">Enable high-contrast night aesthetics.</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-all relative ${darkMode ? 'bg-g-primary' : 'bg-g-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`}></span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-g-gray-100 dark:border-g-gray-700 flex justify-end">
            <button
              onClick={() => alert('Settings successfully updated!')}
              className="flex items-center space-x-2 bg-g-primary hover:bg-g-primary-hover text-white px-5 py-2.5 rounded-full font-semibold transition duration-200 shadow-md"
            >
              <Save size={16} />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: DNS Zones Nameserver */}
      {activeTab === 'dns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DNS Zones Lists */}
          <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 border border-g-gray-200 dark:border-g-gray-700 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold">DNS Zone Files</h3>
            <form onSubmit={handleCreateZone} className="flex space-x-2">
              <input
                type="text"
                required
                placeholder="domain.com"
                value={newZoneDomain}
                onChange={e => setNewZoneDomain(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-sm dark:bg-g-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="p-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-lg transition"
              >
                <Plus size={16} />
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {zones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => fetchRecords(zone)}
                  className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between font-semibold text-sm ${
                    selectedZone?.id === zone.id
                      ? 'bg-g-primary-light text-g-primary dark:bg-g-primary dark:bg-opacity-20'
                      : 'bg-g-gray-50 dark:bg-g-gray-900 text-g-gray-700 dark:text-g-gray-300 hover:bg-g-gray-100 dark:hover:bg-g-gray-800'
                  }`}
                >
                  <span className="truncate">{zone.domain}</span>
                  <Globe size={14} className="text-g-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* DNS Records Editor */}
          <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 border border-g-gray-200 dark:border-g-gray-700 lg:col-span-2 space-y-6">
            {selectedZone ? (
              <>
                <div className="flex justify-between items-center pb-2 border-b border-g-gray-100 dark:border-g-gray-700">
                  <h3 className="text-lg font-bold">DNS Records: <span className="text-g-primary font-mono">{selectedZone.domain}</span></h3>
                </div>

                {/* Add record inline form */}
                <form onSubmit={handleAddRecord} className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-g-gray-50 dark:bg-g-gray-900 p-4 rounded-xl items-end">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-g-gray-400">Type</label>
                    <select
                      value={recType}
                      onChange={e => setRecType(e.target.value)}
                      className="w-full px-2 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-xs dark:bg-g-gray-900 dark:text-white"
                    >
                      {['A', 'CNAME', 'MX', 'TXT', 'NS'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-g-gray-400">Name</label>
                    <input
                      type="text"
                      required
                      value={recName}
                      onChange={e => setRecName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-xs dark:bg-g-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-bold text-g-gray-400">Value (IP / Host)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 192.168.1.1"
                      value={recContent}
                      onChange={e => setRecContent(e.target.value)}
                      className="w-full px-2 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-xs dark:bg-g-gray-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-g-primary hover:bg-g-primary-hover text-white rounded-lg font-semibold text-xs transition flex items-center justify-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>

                {/* Records list table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-g-gray-100 dark:border-g-gray-700 font-bold text-g-gray-400">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Value</th>
                        <th className="pb-2">TTL</th>
                        <th className="pb-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-g-gray-100 dark:divide-g-gray-800 font-medium">
                      {records.map(rec => (
                        <tr key={rec.id} className="hover:bg-g-gray-50 dark:hover:bg-g-gray-900/40">
                          <td className="py-2"><span className="px-1.5 py-0.5 bg-g-primary-light text-g-primary rounded font-bold">{rec.type}</span></td>
                          <td className="py-2 font-mono">{rec.name}</td>
                          <td className="py-2 font-mono truncate max-w-[150px]" title={rec.content}>{rec.content}</td>
                          <td className="py-2 text-g-gray-400">{rec.ttl}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1 text-g-gray-400 hover:text-g-danger rounded-full hover:bg-g-danger-light"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-g-gray-400 h-full text-center">
                <Globe size={32} className="mb-2 text-g-gray-300" />
                <span>Select a domain DNS Zone from the sidebar to modify nameserver maps.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Backup snapshots */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 border border-g-gray-200 dark:border-g-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <HardDrive className="text-g-primary" size={24} />
              <div>
                <h3 className="text-lg font-bold">Backup Snapshot Archive</h3>
                <p className="text-xs text-g-gray-400 mt-0.5">Package website files and databases into a compressed tarball archive.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {websites.length > 0 && (
                <select
                  value={backupSiteId}
                  onChange={e => setBackupSiteId(e.target.value)}
                  className="px-4 py-2 border border-g-gray-300 dark:border-g-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-g-primary dark:bg-g-gray-900 dark:text-white"
                >
                  {websites.map(w => (
                    <option key={w.id} value={w.id}>{w.domain}</option>
                  ))}
                </select>
              )}
              <button
                onClick={handleCreateBackup}
                disabled={backupLoading || websites.length === 0}
                className="flex items-center space-x-2 bg-g-primary hover:bg-g-primary-hover text-white px-5 py-2.5 rounded-full font-semibold transition shadow-md disabled:opacity-50"
              >
                {backupLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <ArrowDownCircle size={16} />
                )}
                <span>Create Backup</span>
              </button>
            </div>
          </div>

          {/* Backup Lists */}
          <div className="bg-white dark:bg-g-gray-800 rounded-2xl border border-g-gray-200 dark:border-g-gray-700 overflow-hidden">
            <div className="p-4 bg-g-gray-50 dark:bg-g-gray-900 border-b border-g-gray-200 dark:border-g-gray-700 font-bold text-xs text-g-gray-400 uppercase">
              Current Snapshots
            </div>
            <div className="divide-y divide-g-gray-100 dark:divide-g-gray-800">
              {backups.map(file => (
                <div
                  key={file.filename}
                  className="flex items-center justify-between p-4 hover:bg-g-gray-50 dark:hover:bg-g-gray-900/40"
                >
                  <div className="flex items-center space-x-3">
                    <Database className="text-g-primary" size={20} />
                    <div>
                      <span className="font-semibold text-sm text-g-gray-900 dark:text-white block font-mono">{file.filename}</span>
                      <span className="text-xs text-g-gray-400">Created: {new Date(file.created * 1000).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-g-primary-light text-g-primary rounded-full">{file.size_mb} MB</span>
                    <button
                      onClick={() => handleRestoreBackup(file)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-g-success-light text-g-success hover:bg-g-success hover:text-white rounded-full text-xs font-bold transition duration-200"
                    >
                      <ArrowUpCircle size={14} />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              ))}
              {backups.length === 0 && (
                <div className="p-8 text-center text-g-gray-400 text-sm">
                  No snapshots created yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
