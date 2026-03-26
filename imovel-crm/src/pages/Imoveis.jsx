import { useState } from 'react';
import { useCRM } from '../context';
import { Plus, Search, Bed, Bath, Car, MapPin, Trash2, X } from 'lucide-react';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const STATUS = {
  disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-700' },
  negociando: { label: 'Negociando', color: 'bg-amber-100 text-amber-700' },
  vendido: { label: 'Vendido', color: 'bg-gray-100 text-gray-600' },
  alugado: { label: 'Alugado', color: 'bg-blue-100 text-blue-700' },
};

const emptyForm = {
  title: '', type: 'apartamento', status: 'disponivel', price: '',
  area: '', bedrooms: '', bathrooms: '', parking: '',
  neighborhood: '', address: '', description: '', image: '',
};

export default function Imoveis() {
  const { properties, addProperty, deleteProperty } = useCRM();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.neighborhood.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type === filterType;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  function handleAdd(e) {
    e.preventDefault();
    addProperty({
      ...form,
      price: Number(form.price), area: Number(form.area),
      bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
      parking: Number(form.parking),
    });
    setForm(emptyForm);
    setShowModal(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
          <p className="text-sm text-gray-500 mt-1">{properties.length} imóveis cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Imóvel
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título ou bairro..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos os tipos</option>
          {['apartamento', 'casa', 'cobertura', 'comercial', 'flat', 'terreno'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelected(p)}>
            {p.image ? (
              <img src={p.image} alt={p.title} className="w-full h-44 object-cover" onError={e => e.target.style.display = 'none'} />
            ) : (
              <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">🏠</div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">{p.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${STATUS[p.status]?.color}`}>
                  {STATUS[p.status]?.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <MapPin size={12} /> {p.neighborhood}
              </div>
              <p className="text-lg font-bold text-primary-700 mb-3">{formatCurrency(p.price)}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <span>{p.area} m²</span>
                {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={12} /> {p.bedrooms}</span>}
                {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={12} /> {p.bathrooms}</span>}
                {p.parking > 0 && <span className="flex items-center gap-1"><Car size={12} /> {p.parking}</span>}
                <button onClick={e => { e.stopPropagation(); deleteProperty(p.id); }} className="ml-auto text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🏗️</p>
          <p>Nenhum imóvel encontrado</p>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-3">{selected.title}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {selected.image && (
              <img src={selected.image} alt={selected.title} className="w-full h-52 object-cover"
                onError={e => e.target.style.display = 'none'} />
            )}
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS[selected.status]?.color}`}>
                  {STATUS[selected.status]?.label}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md capitalize">{selected.type}</span>
              </div>
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(selected.price)}</p>
              <div className="flex items-center gap-1 text-sm text-gray-600"><MapPin size={14} /> {selected.address}</div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-gray-800">{selected.area}</p>
                  <p className="text-xs text-gray-500">m²</p>
                </div>
                {selected.bedrooms > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{selected.bedrooms}</p>
                    <p className="text-xs text-gray-500">Qtos</p>
                  </div>
                )}
                {selected.bathrooms > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{selected.bathrooms}</p>
                    <p className="text-xs text-gray-500">Banhs</p>
                  </div>
                )}
                {selected.parking > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{selected.parking}</p>
                    <p className="text-xs text-gray-500">Vagas</p>
                  </div>
                )}
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Descrição</p>
                  <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo Imóvel</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {['apartamento', 'casa', 'cobertura', 'comercial', 'flat', 'terreno'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input required type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
                  <input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
                  <input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banheiros</label>
                  <input type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vagas</label>
                  <input type="number" value={form.parking} onChange={e => setForm({ ...form, parking: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto</label>
                <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
