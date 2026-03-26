import { useState } from 'react';
import { useCRM } from '../context';
import { STAGES } from '../data';
import { Plus, Trash2, ArrowRight, X } from 'lucide-react';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function Pipeline() {
  const { pipeline, contacts, properties, addDeal, moveDeal, deleteDeal } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ contactId: '', propertyId: '', stage: 'prospeccao', value: '' });

  function getContact(id) { return contacts.find(c => c.id === Number(id)); }
  function getProperty(id) { return properties.find(p => p.id === Number(id)); }

  function handleAdd(e) {
    e.preventDefault();
    addDeal({ ...form, contactId: Number(form.contactId), propertyId: Number(form.propertyId), value: Number(form.value) });
    setForm({ contactId: '', propertyId: '', stage: 'prospeccao', value: '' });
    setShowModal(false);
  }

  const totalByStage = (stageId) => pipeline
    .filter(d => d.stage === stageId)
    .reduce((s, d) => s + d.value, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie cada negócio pelo funil</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Negócio
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const deals = pipeline.filter(d => d.stage === stage.id);
          return (
            <div key={stage.id} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{deals.length}</span>
                </div>
              </div>
              {deals.length > 0 && (
                <p className="text-xs text-gray-400 mb-2">{formatCurrency(totalByStage(stage.id))}</p>
              )}
              <div className="space-y-3">
                {deals.map(deal => {
                  const contact = getContact(deal.contactId);
                  const property = getProperty(deal.propertyId);
                  const stageIdx = STAGES.findIndex(s => s.id === deal.stage);
                  const nextStage = STAGES[stageIdx + 1];
                  return (
                    <div key={deal.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {contact?.name?.charAt(0) || '?'}
                          </div>
                          <p className="text-sm font-medium text-gray-800 leading-tight">{contact?.name || 'Sem contato'}</p>
                        </div>
                        <button onClick={() => deleteDeal(deal.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">{property?.title || 'Sem imóvel'}</p>
                      <p className="text-sm font-bold text-green-700 mb-3">{formatCurrency(deal.value)}</p>
                      {nextStage && (
                        <button
                          onClick={() => moveDeal(deal.id, nextStage.id)}
                          className="w-full flex items-center justify-center gap-1 text-xs text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 rounded-md py-1.5 transition-colors"
                        >
                          Mover para {nextStage.label} <ArrowRight size={12} />
                        </button>
                      )}
                      {!nextStage && (
                        <span className="w-full flex items-center justify-center text-xs text-green-600 bg-green-50 rounded-md py-1.5">
                          Negócio Fechado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {deals.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-xs text-gray-400">Sem negócios</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo Negócio</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                <select required value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Selecione...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imóvel</label>
                <select required value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Selecione...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input required type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder="Ex: 850000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
