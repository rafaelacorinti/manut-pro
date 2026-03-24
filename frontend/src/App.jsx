import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Manutencoes from './pages/Manutencoes'
import ManutencaoForm from './pages/ManutencaoForm'
import ManutencaoDetalhe from './pages/ManutencaoDetalhe'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="manutencoes" element={<Manutencoes />} />
            <Route path="manutencoes/nova" element={<ManutencaoForm />} />
            <Route path="manutencoes/:id/editar" element={<ManutencaoForm />} />
            <Route path="manutencoes/:id" element={<ManutencaoDetalhe />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<AdminRoute><Configuracoes /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
