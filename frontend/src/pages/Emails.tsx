import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Key, Globe, Shield, X, HardDrive } from 'lucide-react';

interface EmailAccount {
  id: number;
  email: string;
  quota_mb: number;
  created_at: string;
}

interface Website {
  id: number;
  domain: string;
}

export default function Emails() {
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [mailboxName, setMailboxName] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [quota, setQuota] = useState(1024);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Emails & Domains
  const fetchData = async () => {
    setLoading(true);
    try {
      const emailRes = await fetch('/api/emails');
      const webRes = await fetch('/api/websites');
      
      if (emailRes.ok && webRes.ok) {
        const emailData = await emailRes.json();
        const webData = await webRes.json();
        setEmails(emailData);
        setWebsites(webData);
        if (webData.length > 0) {
          setSelectedDomain(webData[0].domain);
        }
      } else {
        throw new Error('API failure');
      }
    } catch (err) {
      console.error('Failed to load email data, using mocks:', err);
      // Mocks
      setEmails([
        { id: 1, email: 'info@my-wordpress-blog.com', quota_mb: 1024, created_at: '2026-06-01T10:00:00Z' },
        { id: 2, email: 'contact@portfolio-site.io', quota_mb: 2048, created_at: '2026-06-03T12:00:00Z' }
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

  // Create Email
  const handleCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailboxName || !selectedDomain || !emailPass) return;
    setSubmitting(true);
    setErrorMsg(null);

    const fullEmail = `${mailboxName.trim()}@${selectedDomain}`;

    try {
      const res = await fetch('/api/emails/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail, password: emailPass, quota_mb: quota })
      });
      if (res.ok) {
        setMailboxName('');
        setEmailPass('');
        setModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Failed to create email account');
      }
    } catch (err) {
      // Offline mock fallback
      const newMock: EmailAccount = {
        id: Date.now(),
        email: fullEmail,
        quota_mb: quota,
        created_at: new Date().toISOString()
      };
      setEmails(prev => [...prev, newMock]);
      setModalOpen(false);
      setMailboxName('');
      setEmailPass('');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Email
  const handleDeleteEmail = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email account? This will permanently delete all messages stored in the mailbox!')) return;
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete email account');
      }
    } catch (err) {
      setEmails(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">Emails</h2>
          <p className="text-g-gray-500 dark:text-g-gray-400 mt-1">Configure professional virtual mailboxes, SMTP access, and spam policies.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 bg-g-primary hover:bg-g-primary-hover text-white px-5 py-2.5 rounded-full shadow-lg font-semibold transition duration-200"
        >
          <Plus size={18} />
          <span>New Email Address</span>
        </button>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-g-gray-800 rounded-2xl border border-g-gray-200 dark:border-g-gray-700">
          <div className="w-8 h-8 border-4 border-g-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="font-medium">Loading email accounts...</span>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-12 shadow-sm border border-g-gray-200 dark:border-g-gray-700 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-g-primary-light dark:bg-g-primary dark:bg-opacity-20 text-g-primary rounded-2xl flex items-center justify-center mx-auto">
            <Mail size={32} />
          </div>
          <h3 className="text-xl font-bold text-g-gray-800 dark:text-white">No Email Accounts</h3>
          <p className="text-g-gray-500 max-w-sm mx-auto">Deploy professional name@yourdomain.com mail accounts. Make sure you map DNS MX records to route mails to this hosting node.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-g-primary font-semibold hover:underline"
          >
            Create your first email account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emails.map(email => (
            <div
              key={email.id}
              className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 shadow-sm border border-g-gray-200 dark:border-g-gray-700 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-g-primary">
                    <Mail size={20} />
                    <span className="font-bold text-g-gray-900 dark:text-white truncate max-w-[180px]" title={email.email}>{email.email}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteEmail(email.id)}
                    className="p-1.5 text-g-gray-400 hover:text-g-danger hover:bg-g-danger-light rounded-full transition duration-200 opacity-0 group-hover:opacity-100"
                    title="Delete Account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 font-medium text-sm text-g-gray-600 dark:text-g-gray-300">
                  <div className="flex items-center space-x-2">
                    <HardDrive size={14} className="text-g-gray-400" />
                    <span>Quota Limit: <strong className="text-g-gray-800 dark:text-white">{email.quota_mb} MB</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe size={14} className="text-g-gray-400" />
                    <span>Server: <code className="text-xs bg-g-gray-100 dark:bg-g-gray-900 px-1 py-0.5 rounded">mail.webhostpanel.com</code></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-g-gray-100 dark:border-g-gray-700 flex items-center justify-between text-xs text-g-gray-400">
                <span>Created: {new Date(email.created_at).toLocaleDateString()}</span>
                <span className="text-g-success flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-g-success mr-1"></span>
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Email Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateEmail}
            className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-g-gray-200 dark:border-g-gray-700 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-g-gray-100 dark:border-g-gray-700">
              <h3 className="text-xl font-bold dark:text-white">New Mail Account</h3>
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
                You must create a website domain first before creating an email address!
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">Email Address</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="info"
                      value={mailboxName}
                      onChange={e => setMailboxName(e.target.value)}
                      className="w-1/2 px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white text-right"
                    />
                    <span className="text-g-gray-400 font-bold">@</span>
                    <select
                      value={selectedDomain}
                      onChange={e => setSelectedDomain(e.target.value)}
                      className="w-1/2 px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white"
                    >
                      {websites.map(site => (
                        <option key={site.id} value={site.domain}>{site.domain}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">Mail Password</label>
                  <input
                    type="password"
                    required
                    placeholder="MailAccountPassword123!"
                    value={emailPass}
                    onChange={e => setEmailPass(e.target.value)}
                    className="w-full px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-g-gray-500 uppercase">Mailbox Quota (MB)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={quota}
                    onChange={e => setQuota(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-955 dark:border-g-gray-700 dark:text-white"
                  />
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
                <span>Create Mailbox</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
