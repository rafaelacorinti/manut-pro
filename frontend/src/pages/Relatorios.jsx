import { useState } from 'react'
import api from '../services/api'

const STATUS_OPTS = [{ v: '', l: 'Todos' }, { v: 'aberto', l: 'Aberto' }, { v: 'em_andamento', l: 'Em Andamento' }, { v: 'concluido', l: 'Concluído' }]
const TIPO_OPTS = [{ v: '', l: 'Todos os tipos' }, { v: 'preventiva', l: 'Preventiva' }, { v: 'corretiva', l: 'Corretiva' }, { v: 'preditiva', l: 'Preditiva' }, { v: 'personalizada', l: 'Personalizada' }]

export default function Relatorios() {
  const [filters, setFilters] = useState({ status: '', tipo: '', local: '', data_inicio: '', data_fim: '' })
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingListaPDF, setLoadingListaPDF] = useState(false)

  const buildParams = () => {
    const p = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) p.append(k, v) })
    return p.toString()
  }

  const downloadFile = async (endpoint, filename, setLoading) => {
    setLoading(true)
    try {
      const params = buildParams()
      const res = await api.get(`${endpoint}${params ? '?' + params : ''}`, { responseType: 'blob' })
      const objectUrl = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(objectUrl)
    } catch (e) {
      alert('Erro ao gerar arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Relatórios</h1>
        <p className="text-slate-500 text-sm">Gere relatórios filtrados em PDF ou Excel</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-700 border-b pb-2">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Manutenção</label>
            <select className="input" value={filters.tipo} onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}>
              {TIPO_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Local</label>
            <input className="input" placeholder="Filtrar por local..." value={filters.local} onChange={e => setFilters(f => ({ ...f, local: e.target.value }))} />
          </div>
          <div>
            <label className="label">Técnico</label>
            <input className="input" placeholder="Filtrar por técnico..." value={filters.tecnico_nome} onChange={e => setFilters(f => ({ ...f, tecnico_nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data Início</label>
            <input type="date" className="input" value={filters.data_inicio} onChange={e => setFilters(f => ({ ...f, data_inicio: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data Fim</label>
            <input type="date" className="input" value={filters.data_fim} onChange={e => setFilters(f => ({ ...f, data_fim: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <button
            onClick={() => downloadFile('/relatorios/pdf-lista', `relatorio-manutencoes-${Date.now()}.pdf`, setLoadingListaPDF)}
            className="btn-primary"
            disabled={loadingListaPDF}
          >
            {loadingListaPDF ? 'Gerando...' : '📄 Baixar PDF (Lista)'}
          </button>
          <button
            onClick={() => downloadFile('/relatorios/excel', `manutencoes-${Date.now()}.xlsx`, setLoadingExcel)}
            className="btn-success"
            disabled={loadingExcel}
          >
            {loadingExcel ? 'Gerando...' : '📊 Exportar Excel'}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-700 border-b pb-2 mb-4">Relatório Individual por OS</h2>
        <p className="text-sm text-slate-600 mb-4">Para gerar o relatório completo de uma OS específica (com imagens, materiais e assinatura), acesse a OS desejada e clique em <strong>"Baixar PDF"</strong>.</p>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800">
          <p className="font-semibold mb-1">O relatório individual inclui:</p>
          <ul className="list-disc list-inside space-y-0.5 text-primary-700">
            <li>Cabeçalho com nome da empresa</li>
            <li>Dados completos da OS</li>
            <li>Lista de materiais com custos</li>
            <li>Todas as imagens anexadas</li>
            <li>Assinatura digital do responsável</li>
            <li>Data e hora de emissão</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
