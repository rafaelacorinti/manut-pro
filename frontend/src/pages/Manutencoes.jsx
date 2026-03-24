import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { StatusBadge, PrioridadeBadge, TipoBadge } from '../components/Badges'
import ModalConfirm from '../components/ModalConfirm'
import { useAuth } from '../contexts/AuthContext'

const STATUS_OPTS = [{ v: '', l: 'Todos' }, { v: 'aberto', l: 'Aberto' }, { v: 'em_andamento', l: 'Em Andamento' }, { v: 'concluido', l: 'Concluído' }]
const TIPO_OPTS = [{ v: '', l: 'Todos os tipos' }, { v: 'preventiva', l: 'Preventiva' }, { v: 'corretiva', l: 'Corretiva' }, { v: 'preditiva', l: 'Preditiva' }, { v: 'personalizada', l: 'Personalizada' }]
const PRIO_OPTS = [{ v: '', l: 'Todas' }, { v: 'urgente', l: 'Urgente' }, { v: 'alta', l: 'Alta' }, { v: 'media', l: 'Média' }, { v: 'baixa', l: 'Baixa' }]

export default function Manutencoes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    tipo: '', local: '', prioridade: '', busca: '', data_inicio: '', data_fim: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, limit: 15 }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const res = await api.get('/manutencoes', { params })
      setItems(res.data.data)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async () => {
    setDeleting(confirmId)
    try {
      await api.delete(`/manutencoes/${confirmId}`)
      setConfirmOpen(false)
      fetchData()
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao excluir.')
    } finally {
      setDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / 15)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manutenções</h1>
          <p className="text-slate-500 text-sm">{total} registro(s) encontrado(s)</p>
        </div>
        <button onClick={() => navigate('/manutencoes/nova')} className="btn-primary">+ Nova OS</button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <input className="input col-span-2 md:col-span-4 lg:col-span-2" placeholder="Buscar OS, descrição, local..." value={filters.busca} onChange={e => { setFilters(f => ({ ...f, busca: e.target.value })); setPage(1) }} />
          <select className="input" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}>
            {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select className="input" value={filters.tipo} onChange={e => { setFilters(f => ({ ...f, tipo: e.target.value })); setPage(1) }}>
            {TIPO_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select className="input" value={filters.prioridade} onChange={e => { setFilters(f => ({ ...f, prioridade: e.target.value })); setPage(1) }}>
            {PRIO_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <input type="date" className="input" value={filters.data_inicio} onChange={e => { setFilters(f => ({ ...f, data_inicio: e.target.value })); setPage(1) }} title="Data início" />
          <input type="date" className="input" value={filters.data_fim} onChange={e => { setFilters(f => ({ ...f, data_fim: e.target.value })); setPage(1) }} title="Data fim" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Nº OS</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Data</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Local</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Técnico</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Prioridade</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Anexos</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 text-xs uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">Nenhuma manutenção encontrada.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary-700 text-xs">{item.numero}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{new Date(item.data_hora).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">{item.local}</td>
                  <td className="px-4 py-3"><TipoBadge tipo={item.tipo} tipoPersonalizado={item.tipo_personalizado} /></td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-[120px] truncate">{item.tecnico_nome}</td>
                  <td className="px-4 py-3"><PrioridadeBadge prioridade={item.prioridade} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {item.total_imagens > 0 && <span className="mr-2">🖼 {item.total_imagens}</span>}
                    {item.total_documentos > 0 && <span>📎 {item.total_documentos}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/manutencoes/${item.id}`)} className="btn-secondary text-xs px-2 py-1">Ver</button>
                      <button onClick={() => navigate(`/manutencoes/${item.id}/editar`)} className="btn-secondary text-xs px-2 py-1">Editar</button>
                      {user?.role === 'admin' && (
                        <button onClick={() => { setConfirmId(item.id); setConfirmOpen(true) }} className="btn-danger text-xs px-2 py-1">Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1">Próxima</button>
            </div>
          </div>
        )}
      </div>

      <ModalConfirm
        open={confirmOpen}
        title="Excluir Manutenção"
        message="Esta ação não pode ser desfeita. Todos os anexos e dados relacionados serão removidos."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={!!deleting}
      />
    </div>
  )
}
