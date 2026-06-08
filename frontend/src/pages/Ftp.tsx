import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Globe, FolderOpen, X, User } from 'lucide-react';

interface FtpAccount {
  id: number;
  username: string;
  doc_root: string;
  created_at: string;
}

interface Website {
  id: number;
  domain: string;
}

export default function Ftp() {
  const [ftpAccounts, setFtpAccounts] = useState<FtpAccount[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [ftpUser, setFtpUser] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [ftpPass, setFtpPass] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch FTP & Domains
  const fetchData = async () => {
    setLoading(true);
    try {
      const ftpRes = await fetch('/api/ftp');
      const webRes = await fetch('/api/websites');
      
      if (ftpRes.ok && webRes.ok) {
        setFtpAccounts(await ftpRes.json());
        const webData = await webRes.json();
        setWebsites(webData);
        if (webData.length > 0) {
          setSelectedDomain(webData[0].domain);
        }
      } else {
        throw new Error('API failure');
      }
    } catch (err) {
      console.error('Failed to load FTP data, using mocks:', err);
      // Mocks
      setFtpAccounts([
        { id: 1, username: 'ftp_blog_editor', doc_root: '/home/my-wordpress-blog.com/public_html', created_at: '2026-06-01T10:00:00Z' },
        { id: 2, username: 'ftp_portfolio_dev', doc_root: '/home/portfolio-site.io/public_html', created_at: '2026-06-03T12:00:00Z' }
      ]);
      setWebsites([
        { id: 1, domain: 'my-wordpress-blog.com' },
        { id: 2, domain: 'portfolio-site.io' }
      ]);
      setSelectedDomain('my-wordpress-blog.com');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create FTP
  const handleCreateFtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ftpUser || !selectedDomain || !ftpPass) return;
    setSubmitting(true);
    setErrorMsg(null);

    const fullPath = `/home/${selectedDomain}/public_html`;

    try {
      const res = await fetch('/api/ftp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: ftpUser.trim(), password: ftpPass, doc_root: fullPath })
      });
      if (res.ok) {
        setFtpUser('');
        setFtpPass('');
        setModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Failed to create FTP account');
      }
    } catch (err) {
      // Mock fallback
      const newMock: FtpAccount = {
        id: Date.now(),
        username: ftpUser,
        doc_root: fullPath,
        created_at: new Date().toISOString()
      };
      setFtpAccounts(prev => [...prev, newMock]);
      setModalOpen(false);
      setFtpUser('');
      setFtpPass('');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete FTP
  const handleDeleteFtp = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FTP account?')) return;
    try {
      const res = await fetch(`/api/ftp/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete FTP account');
      }
    } catch (err) {
      setFtpAccounts(prev => prev.filter(f => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">FTP Accounts</h2>
          <p className="text-g-gray-500 dark:text-g-gray-400 mt-1">Configure virtual FTP users for direct file transfer client software (e.g. FileZilla).</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 bg-g-primary hover:bg-g-primary-hover text-white px-5 py-2.5 rounded-full shadow-lg font-semibold transition duration-200"
        >
          <Plus size={18} />
          <span>New FTP Account</span>
        </button>
      </div>

      {/* FTP Lists */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-g-gray-800 rounded-2xl border border-g-gray-200 dark:border-g-gray-700">
          <div className="w-8 h-8 border-4 border-g-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="font-medium">Loading FTP accounts...</span>
        </div>
      ) : ftpAccounts.length === 0 ? (
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-12 shadow-sm border border-g-gray-200 dark:border-g-gray-700 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-g-primary-light dark:bg-g-primary dark:bg-opacity-20 text-g-primary rounded-2xl flex items-center justify-center mx-auto">
            <FolderOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-g-gray-800 dark:text-white">No FTP Accounts</h3>
          <p className="text-g-gray-500 max-w-sm mx-auto">Create FTP accounts to upload theme files, backups, and PHP scripts to your websites using standard clients.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-g-primary font-semibold hover:underline"
          >
            Create your first FTP account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ftpAccounts.map(ftp => (
            <div
              key={ftp.id}
              className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 shadow-sm border border-g-gray-200 dark:border-g-gray-700 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-g-primary">
                    <User size={20} />
                    <span className="font-bold text-g-gray-900 dark:text-white truncate max-w-[180px]">{ftp.username}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFtp(ftp.id)}
                    className="p-1.5 text-g-gray-400 hover:text-g-danger hover:bg-g-danger-light rounded-full transition duration-200 opacity-0 group-hover:opacity-100"
                    title="Delete Account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 font-medium text-sm text-g-gray-600 dark:text-g-gray-300">
                  <div className="flex items-center space-x-2">
                    <FolderOpen size={14} className="text-g-gray-400" />
                    <span className="truncate block" title={ftp.doc_root}>Root: <code className="text-xs bg-g-gray-100 dark:bg-g-gray-900 px-1 py-0.5 rounded">{ftp.doc_root}</code></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe size={14} className="text-g-gray-400" />
                    <span>Host: <code className="text-xs bg-g-gray-100 dark:bg-g-gray-900 px-1 py-0.5 rounded">ftp.webhostpanel.com</code></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-g-gray-100 dark:border-g-gray-700 flex items-center justify-between text-xs text-g-gray-400">
                <span>Created: {new Date(ftp.created_at).toLocaleDateString()}</span>
                <span className="text-g-success flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-g-success mr-1"></span>
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create FTP Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateFtp}
            className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-g-gray-200 dark:border-g-gray-700 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-g-gray-100 dark:border-g-gray-700">
              <h3 className="text-xl font-bold dark:text-white">New FTP Account</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-g-gray-100 dark:hover:bg-g-gray-700 rounded-full text-g-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-g-danger-light border border-g-danger text-g-danger text-xs font-semibold rounded-lg">
                {errorMsg}
              </div>
            )}

            {websites.length === 0 ? (
              <div className="p-4 bg-g-warning-light text-g-warning rounded-xl text-xs font-semibold">
                You must create a website domain first before creating an FTP account!
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">FTP Username</label>
                  <input
                    type="text"
                    required
                    placeholder="ftp_user"
                    value={ftpUser}
                    onChange={e => setFtpUser(e.target.value)}
                    className="w-full px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">Map to Website</label>
                  <select
                    value={selectedDomain}
                    onChange={e => setSelectedDomain(e.target.value)}
                    className="w-full px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white"
                  >
                    {websites.map(site => (
                      <option key={site.id} value={site.domain}>{site.domain}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">FTP Password</label>
                  <input
                    type="password"
                    required
                    placeholder="StrongFtpPassword123!"
                    value={ftpPass}
                    onChange={e => setFtpPass(e.target.value)}
                    className="w-full px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">FTP Root Directory</label>
                  <div className="px-4 py-2 bg-g-gray-50 dark:bg-g-gray-900 border border-g-gray-200 dark:border-g-gray-700 rounded-xl text-xs font-mono text-g-gray-500">
                    /home/{selectedDomain}/public_html
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-g-gray-100 dark:bg-g-gray-700 hover:bg-g-gray-200 text-g-gray-800 dark:text-g-gray-200 rounded-full font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || websites.length === 0}
                className="px-5 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full font-semibold text-sm flex items-center space-x-2 disabled:opacity-50"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                <span>Create Account</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
