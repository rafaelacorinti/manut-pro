const statusMap = {
  aberto: { label: 'Aberto', cls: 'bg-amber-100 text-amber-800' },
  em_andamento: { label: 'Em Andamento', cls: 'bg-blue-100 text-blue-800' },
  concluido: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-800' },
}

const prioridadeMap = {
  baixa: { label: 'Baixa', cls: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', cls: 'bg-yellow-100 text-yellow-700' },
  alta: { label: 'Alta', cls: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }) {
  const s = statusMap[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export function PrioridadeBadge({ prioridade }) {
  const p = prioridadeMap[prioridade] || { label: prioridade, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`badge ${p.cls}`}>{p.label}</span>
}

export function TipoBadge({ tipo, tipoPersonalizado }) {
  const map = { preventiva: 'bg-teal-100 text-teal-700', corretiva: 'bg-red-100 text-red-700', preditiva: 'bg-purple-100 text-purple-700', personalizada: 'bg-indigo-100 text-indigo-700' }
  const labels = { preventiva: 'Preventiva', corretiva: 'Corretiva', preditiva: 'Preditiva', personalizada: tipoPersonalizado || 'Personalizada' }
  return <span className={`badge ${map[tipo] || 'bg-slate-100 text-slate-600'}`}>{labels[tipo] || tipo}</span>
}
