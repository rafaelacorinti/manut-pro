import { useCRM } from '../context';
import { STAGES } from '../data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

const monthlyRevenue = [
  { mes: 'Out', receita: 1200000, meta: 1500000 },
  { mes: 'Nov', receita: 1850000, meta: 1500000 },
  { mes: 'Dez', receita: 980000, meta: 1500000 },
  { mes: 'Jan', receita: 2400000, meta: 2000000 },
  { mes: 'Fev', receita: 1620000, meta: 2000000 },
  { mes: 'Mar', receita: 3100000, meta: 2000000 },
];

export default function Relatorios() {
  const { contacts, properties, pipeline, followups } = useCRM();

  const stageData = STAGES.map(s => ({
    name: s.label,
    negocios: pipeline.filter(d => d.stage === s.id).length,
    valor: pipeline.filter(d => d.stage === s.id).reduce((sum, d) => sum + d.value, 0),
  }));

  const statusData = [
    { name: 'Quente', value: contacts.filter(c => c.status === 'quente').length },
    { name: 'Morno', value: contacts.filter(c => c.status === 'morno').length },
    { name: 'Frio', value: contacts.filter(c => c.status === 'frio').length },
  ];

  const propStatusData = [
    { name: 'Disponível', value: properties.filter(p => p.status === 'disponivel').length },
    { name: 'Negociando', value: properties.filter(p => p.status === 'negociando').length },
    { name: 'Vendido', value: properties.filter(p => p.status === 'vendido').length },
  ];

  const typeMap = {};
  contacts.forEach(c => { typeMap[c.type] = (typeMap[c.type] || 0) + 1; });
  const typeData = Object.entries(typeMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
  }));

  const totalPipeline = pipeline.reduce((s, d) => s + d.value, 0);
  const closedValue = pipeline.filter(d => d.stage === 'fechamento').reduce((s, d) => s + d.value, 0);
  const convRate = pipeline.length > 0
    ? ((pipeline.filter(d => d.stage === 'fechamento').length / pipeline.length) * 100).toFixed(0)
    : 0;
  const doneFollowups = followups.filter(f => f.done).length;
  const followupRate = followups.length > 0
    ? ((doneFollowups / followups.length) * 100).toFixed(0)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Análise de desempenho e métricas do negócio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Volume no Pipeline" value={formatCurrency(totalPipeline)} sub="todos os negócios" />
        <SummaryCard label="Receita Fechada" value={formatCurrency(closedValue)} sub="negócios no fechamento" />
        <SummaryCard label="Taxa de Conversão" value={`${convRate}%`} sub="leads → fechamentos" />
        <SummaryCard label="Taxa de Follow-up" value={`${followupRate}%`} sub={`${doneFollowups}/${followups.length} concluídos`} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Receita vs Meta (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Area type="monotone" dataKey="receita" name="Receita" stroke="#3b82f6" fill="url(#gradReceita)" strokeWidth={2} />
            <Area type="monotone" dataKey="meta" name="Meta" stroke="#10b981" fill="none" strokeDasharray="5 5" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline por Estágio */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Negócios por Estágio</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="negocios" name="Negócios" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status de Contatos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Status dos Leads</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#3b82f6'][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Imóveis por status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Status dos Imóveis</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={propStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {propStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tipo de contato */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Tipo de Contato</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Contatos" radius={[4, 4, 0, 0]}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
