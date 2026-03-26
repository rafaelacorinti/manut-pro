import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, GitBranch,
  Bell, BarChart2, Menu, X, Home
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/contatos', icon: Users, label: 'Contatos' },
  { to: '/imoveis', icon: Building2, label: 'Imóveis' },
  { to: '/followups', icon: Bell, label: 'Follow-ups' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Home size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-800 text-sm">ImóvelCRM</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 ml-auto"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                C
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">Corretor</p>
                <p className="text-xs text-gray-500 truncate">corretor@imovel.com</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
