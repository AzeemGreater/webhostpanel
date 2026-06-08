import React, { useEffect, useRef, useState } from 'react';
import { Server as ServerIcon, Terminal as TerminalIcon, RotateCw, Play, Square, Trash2, Power, AlertTriangle } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { getWsUrl } from '../lib/api';

// Types
interface ServiceStatus {
  name: string;
  displayName: string;
  status: 'active' | 'inactive' | 'failed' | 'loading' | 'unknown';
}

export default function Server() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'lsws', displayName: 'LiteSpeed / Nginx', status: 'loading' },
    { name: 'mysql', displayName: 'MySQL/MariaDB Database', status: 'loading' },
    { name: 'redis', displayName: 'Redis Memory Cache', status: 'loading' },
    { name: 'postfix', displayName: 'Mail Server (Postfix)', status: 'loading' },
    { name: 'pure-ftpd', displayName: 'FTP Server (Pure-FTPd)', status: 'loading' },
  ]);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'reboot' | 'shutdown' | 'cache' | null }>({ type: null });
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Fetch Service Status
  const fetchServices = async () => {
    try {
      // Set loading state first
      setServices(prev => prev.map(s => ({ ...s, status: 'loading' })));
      const res = await fetch('/api/servers/services');
      if (res.ok) {
        const data = await res.json();
        setServices(prev =>
          prev.map(s => ({
            ...s,
            status: data[s.name] || 'unknown'
          }))
        );
      } else {
        throw new Error('Failed to load services');
      }
    } catch (err) {
      console.error(err);
      setServices(prev => prev.map(s => ({ ...s, status: 'unknown' })));
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Manage Service
  const handleServiceAction = async (serviceName: string, action: 'start' | 'stop' | 'restart') => {
    // Optimistic UI state
    setServices(prev =>
      prev.map(s => (s.name === serviceName ? { ...s, status: 'loading' } : s))
    );

    try {
      const res = await fetch(`/api/servers/services/${serviceName}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh statuses
        await fetchServices();
      } else {
        const data = await res.json();
        alert(data.detail || `Failed to ${action} ${serviceName}`);
        await fetchServices();
      }
    } catch (err) {
      alert(`Network error performing action on ${serviceName}`);
      await fetchServices();
    }
  };

  // Perform Server Actions (Reboot, Shutdown, Clear Cache)
  const performServerAction = async () => {
    if (!confirmAction.type) return;
    const type = confirmAction.type;
    setConfirmAction({ type: null });
    setOperationLoading(true);
    setOperationMessage(null);

    let url = '';
    if (type === 'reboot') url = '/api/servers/reboot';
    else if (type === 'shutdown') url = '/api/servers/shutdown';
    else if (type === 'cache') url = '/api/servers/cache/clear';

    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setOperationMessage(data.message || 'Action executed successfully.');
      } else {
        setOperationMessage(`Error: ${data.detail || 'Failed to complete action'}`);
      }
    } catch (err) {
      setOperationMessage('Network error occurred during action.');
    } finally {
      setOperationLoading(false);
      if (type === 'cache') {
        setTimeout(() => setOperationMessage(null), 5000);
      }
    }
  };

  // Terminal logic
  useEffect(() => {
    if (!terminalOpen || !terminalRef.current) {
      // Cleanup terminal if closed
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Fira Code, Menlo, Monaco, Consolas, Courier New, monospace',
      fontSize: 14,
      theme: {
        background: '#121212',
        foreground: '#F1F3F4',
        cursor: '#4285F4',
        black: '#000000',
        red: '#EA4335',
        green: '#34A853',
        yellow: '#FBBC04',
        blue: '#4285F4',
        magenta: '#AB47BC',
        cyan: '#00ACC1',
        white: '#FFFFFF',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;34mConnecting to server console...\x1b[0m');

    // Setup WebSocket
    const ws = new WebSocket(getWsUrl('/api/servers/ws/terminal'));

    ws.onopen = () => {
      term.writeln('\x1b[1;32mSession established successfully!\x1b[0m\r\n');
      // Send initial dimensions
      ws.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows
      }));
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[1;31mConnection closed by server.\x1b[0m');
    };

    ws.onerror = () => {
      term.writeln('\r\n\x1b[1;31mWebSocket connection error.\x1b[0m');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    wsRef.current = ws;

    // Handle Resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: xtermRef.current.cols,
          rows: xtermRef.current.rows
        }));
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      term.dispose();
    };
  }, [terminalOpen]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">Server Manager</h2>
          <p className="text-g-gray-500 dark:text-g-gray-400 mt-1">Control running services, execute diagnostics, and access the system terminal.</p>
        </div>
        <button
          onClick={fetchServices}
          className="flex items-center space-x-2 px-4 py-2 border border-g-gray-300 rounded-full hover:bg-g-gray-100 transition duration-200 dark:border-g-gray-700 dark:hover:bg-g-gray-800 text-sm font-medium"
        >
          <RotateCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Operation Status Messages */}
      {operationMessage && (
        <div className={`p-4 rounded-xl border ${operationMessage.includes('Error') ? 'bg-g-danger-light border-g-danger text-g-danger' : 'bg-g-success-light border-g-success text-g-success'} flex justify-between items-center`}>
          <span>{operationMessage}</span>
          <button onClick={() => setOperationMessage(null)} className="text-sm font-bold opacity-80 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {operationLoading && (
        <div className="p-4 bg-g-primary-light border border-g-primary text-g-primary rounded-xl flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-g-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Executing system operation, please wait...</span>
        </div>
      )}

      {/* Confirm Modals */}
      {confirmAction.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-g-gray-200 dark:border-g-gray-700">
            <div className="flex items-center space-x-3 text-g-warning mb-4">
              <AlertTriangle size={32} />
              <h3 className="text-xl font-bold dark:text-white capitalize">{confirmAction.type} Server</h3>
            </div>
            <p className="text-g-gray-600 dark:text-g-gray-300 mb-6">
              {confirmAction.type === 'reboot' && 'Are you sure you want to reboot the system? Websites and databases will be temporarily unavailable.'}
              {confirmAction.type === 'shutdown' && 'Are you sure you want to power down the server? You will not be able to reconnect until manual startup.'}
              {confirmAction.type === 'cache' && 'Clear all system cache files and RAM buffers? This is generally safe and releases allocated memory.'}
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setConfirmAction({ type: null })}
                className="px-4 py-2 bg-g-gray-100 dark:bg-g-gray-700 hover:bg-g-gray-200 text-g-gray-800 dark:text-g-gray-200 rounded-full font-medium"
              >
                Cancel
              </button>
              <button
                onClick={performServerAction}
                className={`px-5 py-2 rounded-full font-medium text-white ${confirmAction.type === 'cache' ? 'bg-g-primary hover:bg-g-primary-hover' : 'bg-g-danger hover:bg-red-700'}`}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services and Actions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Services */}
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 shadow-sm border border-g-gray-200 dark:border-g-gray-700 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <ServerIcon className="text-g-primary" size={24} />
            <h3 className="text-lg font-bold">Active System Services</h3>
          </div>
          <div className="space-y-4">
            {services.map(service => (
              <div
                key={service.name}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-g-gray-50 dark:bg-g-gray-900 rounded-xl transition duration-200 hover:shadow-md"
              >
                <div className="mb-3 md:mb-0">
                  <span className="font-semibold text-g-gray-900 dark:text-white block">{service.displayName}</span>
                  <span className="text-xs text-g-gray-500 font-mono">{service.name}.service</span>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Status badge */}
                  <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${
                    service.status === 'active' ? 'bg-g-success-light text-g-success' :
                    service.status === 'loading' ? 'bg-g-warning-light text-g-warning' :
                    'bg-g-danger-light text-g-danger'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      service.status === 'active' ? 'bg-g-success animate-pulse' :
                      service.status === 'loading' ? 'bg-g-warning animate-spin' :
                      'bg-g-danger'
                    }`}></span>
                    <span className="capitalize">{service.status}</span>
                  </span>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleServiceAction(service.name, 'start')}
                      disabled={service.status === 'active' || service.status === 'loading'}
                      className="p-2 bg-white hover:bg-g-success-light text-g-gray-600 hover:text-g-success border border-g-gray-200 dark:bg-g-gray-800 dark:border-g-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Start Service"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => handleServiceAction(service.name, 'stop')}
                      disabled={service.status === 'inactive' || service.status === 'loading'}
                      className="p-2 bg-white hover:bg-g-danger-light text-g-gray-600 hover:text-g-danger border border-g-gray-200 dark:bg-g-gray-800 dark:border-g-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Stop Service"
                    >
                      <Square size={16} />
                    </button>
                    <button
                      onClick={() => handleServiceAction(service.name, 'restart')}
                      disabled={service.status === 'loading'}
                      className="p-2 bg-white hover:bg-g-primary-light text-g-gray-600 hover:text-g-primary border border-g-gray-200 dark:bg-g-gray-800 dark:border-g-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Restart Service"
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Controls */}
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 shadow-sm border border-g-gray-200 dark:border-g-gray-700">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-3">
            <Power className="text-g-danger" />
            <span>Power & System Actions</span>
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => setConfirmAction({ type: 'cache' })}
              className="w-full flex items-center space-x-3 p-4 bg-g-primary-light text-g-primary hover:bg-g-primary hover:text-white rounded-xl transition-all duration-200 text-left font-semibold group"
            >
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
              <div>
                <span className="block">Clear Cache & Temp Logs</span>
                <span className="text-xs opacity-75 font-normal block mt-0.5">Flush memory cache and temporary log assets.</span>
              </div>
            </button>

            <button
              onClick={() => setConfirmAction({ type: 'reboot' })}
              className="w-full flex items-center space-x-3 p-4 bg-g-warning-light text-g-warning hover:bg-g-warning hover:text-white rounded-xl transition-all duration-200 text-left font-semibold group"
            >
              <RotateCw size={20} className="group-hover:rotate-45 transition-transform" />
              <div>
                <span className="block">Reboot Server</span>
                <span className="text-xs opacity-75 font-normal block mt-0.5">Restart host system kernel safely.</span>
              </div>
            </button>

            <button
              onClick={() => setConfirmAction({ type: 'shutdown' })}
              className="w-full flex items-center space-x-3 p-4 bg-g-danger-light text-g-danger hover:bg-g-danger hover:text-white rounded-xl transition-all duration-200 text-left font-semibold group"
            >
              <Power size={20} className="group-hover:scale-95 transition-transform" />
              <div>
                <span className="block">Power Off Server</span>
                <span className="text-xs opacity-75 font-normal block mt-0.5">Completely shutdown the backend server.</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Section */}
      <div className="bg-g-gray-900 text-white rounded-2xl overflow-hidden shadow-xl border border-g-gray-800 mt-6">
        <div className="flex items-center justify-between px-6 py-4 bg-g-gray-950 border-b border-g-gray-800">
          <div className="flex items-center space-x-3">
            <TerminalIcon className="text-g-primary" size={20} />
            <span className="font-semibold text-sm">Interactive Web Terminal Console</span>
          </div>
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition duration-200 ${
              terminalOpen ? 'bg-g-danger hover:bg-red-700 text-white' : 'bg-g-primary hover:bg-g-primary-hover text-white'
            }`}
          >
            {terminalOpen ? 'Terminate Session' : 'Connect Terminal'}
          </button>
        </div>

        {terminalOpen ? (
          <div className="p-4 bg-black min-h-[350px]">
            <div ref={terminalRef} className="w-full h-[350px]" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[350px] bg-black bg-opacity-95 text-g-gray-500 space-y-4">
            <TerminalIcon size={48} className="opacity-40 animate-pulse text-g-primary" />
            <p className="text-sm text-center max-w-md">Connect to the server terminal to execute direct shell operations, monitor process limits, or edit files using Unix command line utilities.</p>
            <button
              onClick={() => setTerminalOpen(true)}
              className="px-6 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full font-semibold transition"
            >
              Establish Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
