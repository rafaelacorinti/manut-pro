import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: '⬡', label: 'Dashboard', exact: true },
  { to: '/manutencoes', icon: '🔧', label: 'Manutenções' },
  { to: '/relatorios', icon: '📄', label: 'Relatórios' },
]

const adminItems = [
  { to: '/configuracoes', icon: '⚙', label: 'Config.' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Sidebar desktop */}
      <aside className={`hidden md:flex ${sidebarOpen ? 'w-56' : 'w-16'} bg-primary-900 flex-col transition-all duration-200 shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-primary-800">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">M</div>
          {sidebarOpen && <span className="text-white font-bold text-sm truncate">Manut-Pro</span>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="pt-3 pb-1 px-1">
                {sidebarOpen && <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Admin</span>}
              </div>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="p-2 border-t border-primary-800">
          {sidebarOpen ? (
            <div className="px-3 py-2">
              <p className="text-white text-xs font-semibold truncate">{user?.nome}</p>
              <p className="text-primary-400 text-xs">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</p>
              <button onClick={logout} className="mt-2 text-xs text-primary-400 hover:text-white">Sair</button>
            </div>
          ) : (
            <button onClick={logout} title="Sair" className="w-full flex justify-center p-2 text-primary-400 hover:text-white text-base">↩</button>
          )}
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 safe-top">
          {/* Toggle sidebar no desktop */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block text-slate-500 hover:text-slate-700 text-xl">☰</button>

          {/* Logo mobile */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 bg-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-slate-800 text-sm">Manut-Pro</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-slate-600">Olá, <strong>{user?.nome?.split(' ')[0]}</strong></span>
            <button onClick={() => navigate('/manutencoes/nova')} className="btn-primary text-xs py-1.5 px-3">
              + Nova OS
            </button>
            {/* Botão sair mobile */}
            <button onClick={logout} className="md:hidden text-slate-500 hover:text-red-500 text-sm px-2 py-1" title="Sair">↩</button>
          </div>
        </header>

        {/* Conteúdo com scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Navegação inferior mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around safe-bottom z-40">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-medium transition-colors ${isActive ? 'text-primary-700' : 'text-slate-400'}`
              }
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && adminItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-medium transition-colors ${isActive ? 'text-primary-700' : 'text-slate-400'}`
              }
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
