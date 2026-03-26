import { useCRM } from '../context';
import { STAGES, STATUS_COLORS } from '../data';
import {
  Users, Building2, TrendingUp, DollarSign,
  Bell, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const monthlyData = [
  { mes: 'Out', leads: 8, vendas: 2, receita: 1200000 },
  { mes: 'Nov', leads: 12, vendas: 3, receita: 1850000 },
  { mes: 'Dez', leads: 9, vendas: 2, receita: 980000 },
  { mes: 'Jan', leads: 15, vendas: 4, receita: 2400000 },
  { mes: 'Fev', leads: 11, vendas: 3, receita: 1620000 },
  { mes: 'Mar', leads: 18, vendas: 5, receita: 3100000 },
];

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function Dashboard() {
  const { contacts, properties, pipeline, followups } = useCRM();

  const pendingFollowups = followups.filter(f => !f.done);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFollowups = pendingFollowups.filter(f => f.date === todayStr);
  const overdueFollowups = pendingFollowups.filter(f => f.date < todayStr);

  const totalPipelineValue = pipeline.reduce((sum, d) => sum + d.value, 0);
  const closedDeals = pipeline.filter(d => d.stage === 'fechamento');
  const closedValue = closedDeals.reduce((sum, d) => sum + d.value, 0);

  const stageCounts = STAGES.map(s => ({
    name: s.label,
    value: pipeline.filter(d => d.stage === s.id).length,
  })).filter(s => s.value > 0);

  const propertyTypes = ['apartamento', 'casa', 'cobertura', 'comercial', 'flat'];
  const propByType = propertyTypes.map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    value: properties.filter(p => p.type === t).length,
  })).filter(p => p.value > 0);

  const hotLeads = contacts.filter(c => c.status === 'quente');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do seu negócio imobiliário</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Users size={20} />} label="Contatos" value={contacts.length} sub={`${hotLeads.length} leads quentes`} color="blue" />
        <KPICard icon={<Building2 size={20} />} label="Imóveis" value={properties.length} sub={`${properties.filter(p => p.status === 'disponivel').length} disponíveis`} color="purple" />
        <KPICard icon={<TrendingUp size={20} />} label="Pipeline" value={pipeline.length} sub={formatCurrency(totalPipelineValue)} color="amber" />
        <KPICard icon={<DollarSign size={20} />} label="Fechamentos" value={closedDeals.length} sub={formatCurrency(closedValue)} color="green" />
      </div>

      {/* Alertas */}
      {(todayFollowups.length > 0 || overdueFollowups.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {overdueFollowups.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              <AlertCircle size={16} />
              <span><strong>{overdueFollowups.length}</strong> follow-up(s) atrasado(s)</span>
            </div>
          )}
          {todayFollowups.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700">
              <Clock size={16} />
              <span><strong>{todayFollowups.length}</strong> follow-up(s) para hoje</span>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Leads e Vendas (últimos 6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#colorLeads)" strokeWidth={2} />
              <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#10b981" fill="url(#colorVendas)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Funil de Vendas</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stageCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {stageCounts.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads quentes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Leads Quentes</h2>
          <div className="space-y-3">
            {hotLeads.slice(0, 4).map(contact => (
              <div key={contact.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.neighborhood}</p>
                  </div>
                </div>
                {contact.budget > 0 && (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md">
                    {formatCurrency(contact.budget)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Próximos follow-ups */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Próximos Follow-ups</h2>
          <div className="space-y-3">
            {pendingFollowups.slice(0, 4).map(f => (
              <div key={f.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.date < todayStr ? 'bg-red-500' : f.date === todayStr ? 'bg-amber-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.date} às {f.time}</p>
                </div>
                {f.done ? (
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                ) : (
                  <Bell size={16} className="text-amber-500 flex-shrink-0" />
                )}
              </div>
            ))}
            {pendingFollowups.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum follow-up pendente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
