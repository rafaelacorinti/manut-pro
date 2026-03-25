import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Configuracoes() {
  const { user } = useAuth()
  const [empresa, setEmpresa] = useState({ nome: '', cnpj: '', endereco: '', telefone: '', email: '' })
  const [users, setUsers] = useState([])
  const [pendentes, setPendentes] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ nome: '', email: '', senha: '', role: 'tecnico' })
  const [savingUser, setSavingUser] = useState(false)
  const [tab, setTab] = useState('empresa')
  const logoInputRef = useRef()

  useEffect(() => {
    api.get('/empresa').then(r => setEmpresa(r.data || {}))
    api.get('/users').then(r => setUsers(r.data))
    if (user?.role === 'admin') api.get('/users/pendentes').then(r => setPendentes(r.data))
  }, [])

  const aprovarUser = async (id) => {
    try {
      await api.post(`/users/${id}/aprovar`)
      setPendentes(p => p.filter(u => u.id !== id))
      api.get('/users').then(r => setUsers(r.data))
    } catch (e) { alert('Erro ao aprovar.') }
  }

  const rejeitarUser = async (id) => {
    if (!confirm('Rejeitar e excluir este cadastro?')) return
    try {
      await api.post(`/users/${id}/rejeitar`)
      setPendentes(p => p.filter(u => u.id !== id))
    } catch (e) { alert('Erro ao rejeitar.') }
  }

  const saveEmpresa = async () => {
    setSaving(true)
    try {
      await api.put('/empresa', empresa)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('logo', file)
    try {
      await api.post('/empresa/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Logo atualizada.')
    } catch (e) {
      alert('Erro ao enviar logo.')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setSavingUser(true)
    try {
      await api.post('/users', userForm)
      const res = await api.get('/users')
      setUsers(res.data)
      setShowUserModal(false)
      setUserForm({ nome: '', email: '', senha: '', role: 'tecnico' })
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao criar usuário.')
    } finally {
      setSavingUser(false)
    }
  }

  const handleToggleUser = async (u) => {
    if (u.id === user.id) return alert('Não pode desativar seu próprio usuário.')
    await api.put(`/users/${u.id}`, { ...u, ativo: u.ativo ? 0 : 1 })
    const res = await api.get('/users')
    setUsers(res.data)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Configurações</h1>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {['empresa', 'usuarios', ...(user?.role === 'admin' ? ['aprovacoes'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'empresa' ? 'Dados da Empresa' : t === 'usuarios' ? 'Usuários' : (
              <span className="flex items-center gap-1">
                Aprovações
                {pendentes.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendentes.length}</span>}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'aprovacoes' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">Cadastros Pendentes de Aprovação</h2>
          {pendentes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-4xl mb-2">✓</p>
              <p>Nenhum cadastro pendente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendentes.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-800">{u.nome}</p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                    <p className="text-xs text-slate-400">Solicitado em {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => aprovarUser(u.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Aprovar</button>
                    <button onClick={() => rejeitarUser(u.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'empresa' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-black text-xl">
              {empresa.nome?.[0] || 'E'}
            </div>
            <div>
              <p className="font-bold text-slate-700">{empresa.nome || 'Minha Empresa'}</p>
              <button onClick={() => logoInputRef.current?.click()} className="btn-secondary text-xs mt-1">Alterar Logo</button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome da Empresa *</label>
              <input className="input" value={empresa.nome || ''} onChange={e => setEmpresa(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input className="input" placeholder="00.000.000/0001-00" value={empresa.cnpj || ''} onChange={e => setEmpresa(f => ({ ...f, cnpj: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" placeholder="(11) 99999-9999" value={empresa.telefone || ''} onChange={e => setEmpresa(f => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={empresa.email || ''} onChange={e => setEmpresa(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Endereço</label>
              <input className="input" value={empresa.endereco || ''} onChange={e => setEmpresa(f => ({ ...f, endereco: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveEmpresa} className="btn-primary" disabled={saving}>
              {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowUserModal(true)} className="btn-primary text-xs">+ Novo Usuário</button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Perfil</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">{u.nome}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Técnico'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== user.id && (
                        <button onClick={() => handleToggleUser(u)} className={`text-xs btn ${u.ativo ? 'btn-danger' : 'btn-success'} px-2 py-1`}>
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={userForm.nome} onChange={e => setUserForm(f => ({ ...f, nome: e.target.value }))} required />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input type="email" className="input" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Senha *</label>
                <input type="password" className="input" value={userForm.senha} onChange={e => setUserForm(f => ({ ...f, senha: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label className="label">Perfil</label>
                <select className="input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary" disabled={savingUser}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={savingUser}>{savingUser ? 'Criando...' : 'Criar Usuário'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
