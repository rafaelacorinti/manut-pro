import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../services/api'

const COLORS_TIPO = { preventiva: '#10b981', corretiva: '#ef4444', preditiva: '#8b5cf6', personalizada: '#6366f1' }
const COLORS_PRIO = { baixa: '#94a3b8', media: '#fbbf24', alta: '#f97316', urgente: '#ef4444' }
const STATUS_COLORS = { aberto: '#fbbf24', em_andamento: '#60a5fa', concluido: '#34d399' }

function StatCard({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} className={`card p-5 cursor-pointer hover:shadow-md transition-all ${onClick ? 'hover:-translate-y-0.5' : ''}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-4xl font-black mt-1 ${color || 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando dashboard...</div>
  if (!data) return null

  const tipoChartData = data.porTipo.map(t => ({
    name: { preventiva: 'Preventiva', corretiva: 'Corretiva', preditiva: 'Preditiva', personalizada: 'Personalizada' }[t.tipo] || t.tipo,
    value: t.total,
    color: COLORS_TIPO[t.tipo] || '#6366f1'
  }))

  const statusData = [
    { name: 'Aberto', value: data.abertos, color: STATUS_COLORS.aberto },
    { name: 'Em Andamento', value: data.emAndamento, color: STATUS_COLORS.em_andamento },
    { name: 'Concluído', value: data.concluidos, color: STATUS_COLORS.concluido },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm">Visão geral das manutenções</p>
        </div>
        <button onClick={() => navigate('/manutencoes/nova')} className="btn-primary">+ Nova OS</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Manutenções no Mês" value={data.totalMes} sub="mês atual" color="text-primary-700" onClick={() => navigate('/manutencoes')} />
        <StatCard label="Em Aberto" value={data.abertos} color="text-amber-500" onClick={() => navigate('/manutencoes?status=aberto')} />
        <StatCard label="Em Andamento" value={data.emAndamento} color="text-blue-500" onClick={() => navigate('/manutencoes?status=em_andamento')} />
        <StatCard label="Concluídas" value={data.concluidos} color="text-emerald-500" onClick={() => navigate('/manutencoes?status=concluido')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Total Geral" value={data.totalGeral} sub="todas as OS" />
        <StatCard label="Custo no Mês" value={`R$ ${Number(data.custoMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub="mês atual" color="text-indigo-600" />
        <StatCard label="Urgentes em Aberto" value={data.urgentes?.length || 0} color={data.urgentes?.length > 0 ? 'text-red-600' : 'text-slate-800'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-slate-700 mb-4">Manutenções por Mês</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.ultimosMeses}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-700 mb-4">Por Tipo de Manutenção</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tipoChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {tipoChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.urgentes?.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-red-500">⚠</span> OS Urgentes em Aberto
            </h3>
            <div className="space-y-2">
              {data.urgentes.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{u.numero}</p>
                    <p className="text-xs text-slate-500">{u.local} • {u.tecnico_nome}</p>
                  </div>
                  <span className="badge bg-red-100 text-red-700">{u.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recentesConcluidos?.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Recentemente Concluídas
            </h3>
            <div className="space-y-2">
              {data.recentesConcluidos.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{u.numero}</p>
                    <p className="text-xs text-slate-500">{u.local} • {u.tecnico_nome}</p>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-700">{u.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
