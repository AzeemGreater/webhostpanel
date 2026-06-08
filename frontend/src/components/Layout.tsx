import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Globe, Database, FolderOpen, FolderUp, Mail, Shield, Server, Settings, LogOut, Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', section: 'Main' },
  { icon: <Globe size={20} />, label: 'Websites', path: '/websites', section: 'Features' },
  { icon: <Database size={20} />, label: 'Databases', path: '/databases', section: 'Features' },
  { icon: <FolderOpen size={20} />, label: 'File Manager', path: '/files', section: 'Features' },
  { icon: <FolderUp size={20} />, label: 'FTP Accounts', path: '/ftp', section: 'Features' },
  { icon: <Mail size={20} />, label: 'Emails', path: '/emails', section: 'Features' },
  { icon: <Shield size={20} />, label: 'Security', path: '/security', section: 'System' },
  { icon: <Server size={20} />, label: 'Server Status', path: '/server', section: 'System' },
  { icon: <Settings size={20} />, label: 'Settings', path: '/settings', section: 'System' },
];

export const Layout = () => {
  return (
    <div className="flex h-screen bg-g-gray-50 dark:bg-g-gray-900 overflow-hidden font-sans text-g-gray-900 dark:text-g-gray-100">
      {/* Sidebar - Material Design 3 */}
      <aside className="w-[260px] bg-g-white dark:bg-g-gray-900 flex flex-col transition-all duration-300 border-r border-g-gray-200 dark:border-g-gray-700 z-20">
        <div className="h-16 flex items-center px-6">
          <div className="w-8 h-8 rounded-lg bg-g-primary flex items-center justify-center mr-3">
             <span className="text-white font-bold">W</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            WebHostPanel
          </h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-4 py-3 rounded-full transition-all duration-200 font-medium text-sm",
                isActive 
                  ? "bg-g-primary-light text-g-primary dark:bg-g-primary dark:bg-opacity-20 dark:text-g-primary" 
                  : "text-g-gray-700 hover:bg-g-gray-100 dark:text-g-gray-300 dark:hover:bg-g-gray-700"
              )}
            >
              <div className={cn("transition-colors")}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-g-gray-200 dark:border-g-gray-700">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-g-gray-200 flex items-center justify-center text-g-gray-700 font-bold mr-3">
                A
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Admin</p>
                <p className="text-xs text-g-gray-500">admin@panel.com</p>
              </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-g-white dark:bg-g-gray-900 flex items-center justify-between px-6 z-10 border-b border-g-gray-200 dark:border-g-gray-700">
          <div className="flex items-center w-full max-w-md">
             <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-g-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-g-gray-300 rounded-full leading-5 bg-g-gray-50 placeholder-g-gray-500 focus:outline-none focus:placeholder-g-gray-400 focus:ring-1 focus:ring-g-primary focus:border-g-primary sm:text-sm transition duration-150 ease-in-out dark:bg-g-gray-800 dark:border-g-gray-700 dark:text-white"
                  placeholder="Search resources, settings..."
                />
              </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-g-gray-500 hover:text-g-gray-700 hover:bg-g-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-g-danger ring-2 ring-white"></span>
            </button>
            <button className="flex items-center space-x-2 p-2 text-g-gray-500 hover:text-g-gray-700 hover:bg-g-gray-100 rounded-full transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
