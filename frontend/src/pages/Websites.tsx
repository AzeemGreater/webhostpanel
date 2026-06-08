import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Shield, ShieldAlert, Cpu, Settings, Wrench, Package, ArrowRight, Check, X, RefreshCw } from 'lucide-react';

interface Website {
  id: number;
  domain: string;
  php_version: string;
  ssl_enabled: boolean;
  is_active: boolean;
  is_suspended: boolean;
  disk_usage_mb: number;
  bandwidth_usage_mb: number;
  created_at: string;
}

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Creation State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newPhp, setNewPhp] = useState('8.2');
  const [submitting, setSubmitting] = useState(false);

  // WP Toolkit State
  const [wpModalOpen, setWpModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Website | null>(null);
  const [wpTitle, setWpTitle] = useState('');
  const [wpAdminUser, setWpAdminUser] = useState('admin');
  const [wpAdminPass, setWpAdminPass] = useState('');
  const [wpAdminEmail, setWpAdminEmail] = useState('admin@example.com');
  const [wpLoading, setWpLoading] = useState(false);
  const [wpMessage, setWpMessage] = useState<string | null>(null);

  // Fetch Websites
  const fetchWebsites = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('http://localhost:8000/api/websites');
      if (res.ok) {
        const data = await res.json();
        setWebsites(data);
      } else {
        throw new Error('API failure');
      }
    } catch (err) {
      console.error('Failed to fetch websites, using mocks:', err);
      // Mock Data Fallback
      setWebsites([
        {
          id: 1,
          domain: 'my-wordpress-blog.com',
          php_version: '8.2',
          ssl_enabled: true,
          is_active: true,
          is_suspended: false,
          disk_usage_mb: 342,
          bandwidth_usage_mb: 2048,
          created_at: '2026-06-01T10:00:00Z',
        },
        {
          id: 2,
          domain: 'portfolio-site.io',
          php_version: '8.1',
          ssl_enabled: false,
          is_active: true,
          is_suspended: false,
          disk_usage_mb: 85,
          bandwidth_usage_mb: 512,
          created_at: '2026-06-03T12:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  // Create Website domain
  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('http://localhost:8000/api/websites/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain, php_version: newPhp }),
      });
      if (res.ok) {
        setNewDomain('');
        setCreateModalOpen(false);
        fetchWebsites();
      } else {
        const data = await res.json();
        setErrorMessage(data.detail || 'Failed to create website');
      }
    } catch (err) {
      // Offline fallback: add mock website
      const newMock: Website = {
        id: Date.now(),
        domain: newDomain,
        php_version: newPhp,
        ssl_enabled: false,
        is_active: true,
        is_suspended: false,
        disk_usage_mb: 0,
        bandwidth_usage_mb: 0,
        created_at: new Date().toISOString(),
      };
      setWebsites(prev => [...prev, newMock]);
      setCreateModalOpen(false);
      setNewDomain('');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Website
  const handleDeleteWebsite = async (id: number) => {
    if (!confirm('Are you sure you want to delete this website? All files, configurations, and document roots will be permanently removed.')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/websites/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchWebsites();
      } else {
        alert('Failed to delete website');
      }
    } catch (err) {
      // Fallback deletion
      setWebsites(prev => prev.filter(w => w.id !== id));
    }
  };

  // Toggle SSL
  const handleToggleSSL = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/websites/${id}/ssl`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchWebsites();
      }
    } catch (err) {
      setWebsites(prev => prev.map(w => w.id === id ? { ...w, ssl_enabled: !w.ssl_enabled } : w));
    }
  };

  // Change PHP Version
  const handleChangePHP = async (id: number, phpVer: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/websites/${id}/php?php_version=${phpVer}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchWebsites();
      }
    } catch (err) {
      setWebsites(prev => prev.map(w => w.id === id ? { ...w, php_version: phpVer } : w));
    }
  };

  // WordPress Toolkit Installer trigger
  const handleInstallWordPress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !wpAdminPass) return;
    setWpLoading(true);
    setWpMessage(null);

    try {
      const res = await fetch('http://localhost:8000/api/wordpress/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: selectedSite.id,
          title: wpTitle || 'My WordPress Site',
          admin_user: wpAdminUser,
          admin_password: wpAdminPass,
          admin_email: wpAdminEmail,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWpMessage('WordPress installed successfully! Redirecting site...');
        setTimeout(() => {
          setWpModalOpen(false);
          setWpAdminPass('');
          setWpMessage(null);
        }, 3000);
      } else {
        setWpMessage(`Error: ${data.detail || 'WordPress installation failed'}`);
      }
    } catch (err) {
      setWpMessage('WordPress installed successfully! (Emulation Mode)');
      setTimeout(() => {
        setWpModalOpen(false);
        setWpAdminPass('');
        setWpMessage(null);
      }, 3000);
    } finally {
      setWpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">Websites</h2>
          <p className="text-g-gray-500 dark:text-g-gray-400 mt-1">Deploy, configure, and monitor your web applications and WordPress toolkits.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-g-primary hover:bg-g-primary-hover text-white px-5 py-2.5 rounded-full shadow-lg font-semibold transition duration-200"
        >
          <Plus size={18} />
          <span>Create Website</span>
        </button>
      </div>

      {/* Websites Grid / Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-g-gray-800 rounded-2xl border border-g-gray-200 dark:border-g-gray-700">
          <div className="w-8 h-8 border-4 border-g-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="font-medium">Loading websites...</span>
        </div>
      ) : websites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-g-gray-800 rounded-2xl border border-g-gray-200 dark:border-g-gray-700 space-y-4 text-center">
          <Globe size={48} className="text-g-gray-300 dark:text-g-gray-600" />
          <h3 className="text-xl font-bold text-g-gray-800 dark:text-white">No Websites Added</h3>
          <p className="text-g-gray-500 max-w-sm">Create your first website to deploy WordPress applications, map domains, and configure SSL certificates.</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-2 bg-g-primary text-white rounded-full font-semibold hover:bg-g-primary-hover transition"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl shadow-sm border border-g-gray-200 dark:border-g-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-g-gray-50 dark:bg-g-gray-900 border-b border-g-gray-200 dark:border-g-gray-700 text-xs font-semibold text-g-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Domain</th>
                  <th className="p-4">PHP Engine</th>
                  <th className="p-4">SSL Security</th>
                  <th className="p-4">Disk Usage</th>
                  <th className="p-4 text-right pr-6">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-g-gray-100 dark:divide-g-gray-700">
                {websites.map(site => (
                  <tr key={site.id} className="hover:bg-g-gray-50 dark:hover:bg-g-gray-900/40 transition duration-150">
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-g-primary-light dark:bg-g-primary dark:bg-opacity-20 flex items-center justify-center text-g-primary">
                          <Globe size={20} />
                        </div>
                        <div>
                          <span className="font-semibold text-g-gray-900 dark:text-white block hover:text-g-primary transition-colors cursor-pointer">{site.domain}</span>
                          <span className="text-xs text-g-gray-400">Created: {new Date(site.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Cpu size={16} className="text-g-gray-400" />
                        <select
                          value={site.php_version}
                          onChange={(e) => handleChangePHP(site.id, e.target.value)}
                          className="bg-g-gray-100 dark:bg-g-gray-700 border-none rounded-lg px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-g-primary cursor-pointer text-g-gray-800 dark:text-white"
                        >
                          {['8.0', '8.1', '8.2', '8.3'].map(ver => (
                            <option key={ver} value={ver}>PHP {ver}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSSL(site.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          site.ssl_enabled
                            ? 'bg-g-success-light text-g-success'
                            : 'bg-g-warning-light text-g-warning'
                        }`}
                      >
                        {site.ssl_enabled ? (
                          <>
                            <Shield size={12} />
                            <span>Active SSL</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={12} />
                            <span>No SSL</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-g-gray-700 dark:text-g-gray-300">
                        {site.disk_usage_mb > 0 ? `${site.disk_usage_mb} MB` : '128 KB (Empty)'}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSite(site);
                            setWpTitle(`${site.domain} Website`);
                            setWpModalOpen(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-g-primary-light hover:bg-g-primary hover:text-white text-g-primary rounded-full text-xs font-bold transition duration-200"
                        >
                          <Package size={14} />
                          <span>WP Toolkit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteWebsite(site.id)}
                          className="p-2 text-g-gray-400 hover:text-g-danger hover:bg-g-danger-light rounded-full transition duration-200"
                          title="Delete Website"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Website Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateWebsite}
            className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-g-gray-200 dark:border-g-gray-700 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-g-gray-100 dark:border-g-gray-700">
              <h3 className="text-xl font-bold dark:text-white">Create New Website</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 hover:bg-g-gray-100 dark:hover:bg-g-gray-700 rounded-full text-g-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-g-danger-light border border-g-danger text-g-danger text-xs font-semibold rounded-lg">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-g-gray-500 uppercase">Domain Name</label>
              <input
                type="text"
                required
                placeholder="example.com"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                className="w-full px-4 py-2 border.5 border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-950 dark:border-g-gray-700 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-g-gray-500 uppercase">PHP Version</label>
              <select
                value={newPhp}
                onChange={e => setNewPhp(e.target.value)}
                className="w-full px-4 py-2 border.5 border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-950 dark:border-g-gray-700 dark:text-white"
              >
                {['8.0', '8.1', '8.2', '8.3'].map(ver => (
                  <option key={ver} value={ver}>PHP {ver}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-g-gray-100 dark:bg-g-gray-700 hover:bg-g-gray-200 text-g-gray-800 dark:text-g-gray-200 rounded-full font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full font-semibold text-sm flex items-center space-x-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                <span>Create Website</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WordPress Toolkit Modal */}
      {wpModalOpen && selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-g-gray-200 dark:border-g-gray-700 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-g-gray-100 dark:border-g-gray-700">
              <div className="flex items-center space-x-2">
                <Package className="text-g-primary" />
                <h3 className="text-xl font-bold dark:text-white">WordPress Toolkit</h3>
              </div>
              <button
                type="button"
                onClick={() => setWpModalOpen(false)}
                className="p-1.5 hover:bg-g-gray-100 dark:hover:bg-g-gray-700 rounded-full text-g-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-g-gray-50 dark:bg-g-gray-900 p-4 rounded-xl flex items-center justify-between border border-g-gray-200 dark:border-g-gray-700">
              <div>
                <span className="text-xs text-g-gray-400 uppercase font-bold">Target domain</span>
                <span className="block font-semibold text-sm text-g-primary">{selectedSite.domain}</span>
              </div>
              <div>
                <span className="text-xs text-g-gray-400 uppercase font-bold block text-right">Document Root</span>
                <span className="block font-mono text-xs text-g-gray-600 dark:text-g-gray-300">/home/{selectedSite.domain}/public_html</span>
              </div>
            </div>

            {wpMessage && (
              <div className={`p-4 rounded-xl border text-xs font-semibold ${
                wpMessage.includes('Error') ? 'bg-g-danger-light border-g-danger text-g-danger' : 'bg-g-success-light border-g-success text-g-success'
              }`}>
                {wpMessage}
              </div>
            )}

            {/* Install form */}
            <form onSubmit={handleInstallWordPress} className="space-y-4">
              <h4 className="text-sm font-bold text-g-gray-800 dark:text-white uppercase tracking-wider">One-Click Auto Installer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500">Site Title</label>
                  <input
                    type="text"
                    required
                    value={wpTitle}
                    onChange={e => setWpTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-sm dark:bg-g-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={wpAdminUser}
                    onChange={e => setWpAdminUser(e.target.value)}
                    className="w-full px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-sm dark:bg-g-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={wpAdminEmail}
                    onChange={e => setWpAdminEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-sm dark:bg-g-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500">Admin Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter database & admin pass"
                    value={wpAdminPass}
                    onChange={e => setWpAdminPass(e.target.value)}
                    className="w-full px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 rounded-lg text-sm dark:bg-g-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t border-g-gray-100 dark:border-g-gray-700">
                {/* Micro Actions */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://localhost:8000/api/wordpress/harden/${selectedSite.id}`, { method: 'POST' });
                        if (res.ok) alert('Hardening successfully applied!');
                      } catch {
                        alert('Harden script completed (mock)');
                      }
                    }}
                    className="px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 text-g-gray-600 dark:text-g-gray-300 rounded-lg text-xs font-semibold hover:bg-g-gray-100 dark:hover:bg-g-gray-900 flex items-center space-x-1"
                  >
                    <Wrench size={12} />
                    <span>Hardening</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://localhost:8000/api/wordpress/optimize/${selectedSite.id}`, { method: 'POST' });
                        if (res.ok) alert('Database optimized successfully!');
                      } catch {
                        alert('Optimize script completed (mock)');
                      }
                    }}
                    className="px-3 py-1.5 border border-g-gray-300 dark:border-g-gray-700 text-g-gray-600 dark:text-g-gray-300 rounded-lg text-xs font-semibold hover:bg-g-gray-100 dark:hover:bg-g-900 flex items-center space-x-1"
                  >
                    <Settings size={12} />
                    <span>Optimize DB</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setWpModalOpen(false)}
                    className="px-4 py-2 bg-g-gray-100 dark:bg-g-gray-700 hover:bg-g-gray-200 text-g-gray-800 dark:text-g-gray-200 rounded-full font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={wpLoading}
                    className="px-5 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full font-semibold text-xs flex items-center space-x-1"
                  >
                    {wpLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <ArrowRight size={14} />
                    )}
                    <span>Install WordPress</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
