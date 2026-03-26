import { useState } from 'react';
import { useCRM } from '../context';
import { STATUS_COLORS } from '../data';
import { Plus, Search, Phone, Mail, Trash2, X, MessageCircle } from 'lucide-react';

const formatCurrency = (v) =>
  v > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : '–';

const TYPE_LABELS = { comprador: 'Comprador', vendedor: 'Vendedor', investidor: 'Investidor' };
const STATUS_LABELS = { quente: 'Quente', morno: 'Morno', frio: 'Frio' };

const emptyForm = { name: '', email: '', phone: '', type: 'comprador', budget: '', neighborhood: '', status: 'morno', notes: '' };

export default function Contatos() {
  const { contacts, addContact, deleteContact, interactions, addInteraction } = useCRM();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || c.type === filterType;
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  function handleAdd(e) {
    e.preventDefault();
    addContact({ ...form, budget: Number(form.budget) || 0, lastContact: new Date().toISOString().split('T')[0] });
    setForm(emptyForm);
    setShowModal(false);
  }

  const contactInteractions = selected ? interactions.filter(i => i.contactId === selected.id) : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-sm text-gray-500 mt-1">{contacts.length} contatos cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Contato
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, bairro..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos os tipos</option>
          <option value="comprador">Comprador</option>
          <option value="vendedor">Vendedor</option>
          <option value="investidor">Investidor</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos os status</option>
          <option value="quente">Quente</option>
          <option value="morno">Morno</option>
          <option value="frio">Frio</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contato</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Orçamento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Bairro</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Último contato</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(contact => (
              <tr key={contact.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelected(contact)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{TYPE_LABELS[contact.type]}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_COLORS[contact.status]}`}>
                    {STATUS_LABELS[contact.status]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-700">{formatCurrency(contact.budget)}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{contact.neighborhood || '–'}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{contact.lastContact || '–'}</td>
                <td className="px-4 py-3">
                  <button onClick={e => { e.stopPropagation(); deleteContact(contact.id); }}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>Nenhum contato encontrado</p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex gap-3">
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{TYPE_LABELS[selected.type]}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} /> {selected.phone}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={14} /> {selected.email}</div>
              {selected.neighborhood && <div className="text-sm text-gray-600">Bairro: {selected.neighborhood}</div>}
              {selected.budget > 0 && <div className="text-sm text-gray-600">Orçamento: {formatCurrency(selected.budget)}</div>}
            </div>
            {selected.notes && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-700 mb-1">Anotações</p>
                <p className="text-sm text-amber-900">{selected.notes}</p>
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2"><MessageCircle size={15} /> Histórico</h3>
              <div className="space-y-2">
                {contactInteractions.length > 0 ? contactInteractions.map(i => (
                  <div key={i.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500 capitalize">{i.type}</span>
                      <span className="text-xs text-gray-400">{i.date}</span>
                    </div>
                    <p className="text-sm text-gray-700">{i.summary}</p>
                  </div>
                )) : <p className="text-sm text-gray-400">Sem interações registradas</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo Contato</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="comprador">Comprador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="investidor">Investidor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="quente">Quente</option>
                    <option value="morno">Morno</option>
                    <option value="frio">Frio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                    placeholder="Ex: 850000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro de interesse</label>
                  <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
