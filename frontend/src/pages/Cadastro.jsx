import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Cadastro() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.senha !== form.confirmar) return setError('As senhas não coincidem.')
    if (form.senha.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { nome: form.nome, email: form.email, senha: form.senha })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary-800 font-black text-2xl mx-auto mb-4 shadow-xl">M</div>
          <h1 className="text-3xl font-black text-white">Manut-Pro</h1>
          <p className="text-primary-200 text-sm mt-1">Sistema de Gestão de Manutenção Predial</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Criar conta</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input type="text" name="nome" className="input" value={form.nome} onChange={handleChange} required placeholder="Seu nome" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" name="email" className="input" value={form.email} onChange={handleChange} required placeholder="seu@email.com" />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" name="senha" className="input" value={form.senha} onChange={handleChange} required placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="label">Confirmar senha</label>
              <input type="password" name="confirmar" className="input" value={form.confirmar} onChange={handleChange} required placeholder="Repita a senha" />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
