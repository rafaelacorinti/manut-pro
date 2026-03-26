import { useState } from 'react';
import { useCRM } from '../context';
import { FOLLOWUP_TYPES } from '../data';
import { Plus, CheckCircle2, Circle, Trash2, X, Bell } from 'lucide-react';

const emptyForm = { contactId: '', dealId: '', title: '', date: '', time: '09:00', type: 'ligacao', notes: '' };

export default function Followups() {
  const { followups, contacts, pipeline, addFollowup, toggleFollowup, deleteFollowup } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('pendente');

  const todayStr = new Date().toISOString().split('T')[0];

  const pending = followups.filter(f => !f.done);
  const done = followups.filter(f => f.done);

  const overdue = pending.filter(f => f.date < todayStr);
  const today = pending.filter(f => f.date === todayStr);
  const upcoming = pending.filter(f => f.date > todayStr);

  function getContact(id) { return contacts.find(c => c.id === Number(id)); }

  function handleAdd(e) {
    e.preventDefault();
    addFollowup({ ...form, contactId: Number(form.contactId), dealId: form.dealId ? Number(form.dealId) : null, done: false });
    setForm(emptyForm);
    setShowModal(false);
  }

  const renderList = (list, label) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{label}</h3>
        <div className="space-y-2">
          {list.map(f => {
            const contact = getContact(f.contactId);
            const ftype = FOLLOWUP_TYPES[f.type] || {};
            return (
              <div key={f.id} className={`bg-white rounded-xl border ${f.date < todayStr && !f.done ? 'border-red-200' : 'border-gray-200'} p-4 flex items-start gap-3`}>
                <button onClick={() => toggleFollowup(f.id)} className="mt-0.5 flex-shrink-0">
                  {f.done
                    ? <CheckCircle2 size={20} className="text-green-500" />
                    : <Circle size={20} className="text-gray-300 hover:text-primary-500 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-sm font-medium ${f.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{f.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${ftype.color}`}>{ftype.icon} {ftype.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {contact && <span>{contact.name}</span>}
                    <span>{f.date} {f.time && `às ${f.time}`}</span>
                  </div>
                  {f.notes && <p className="text-xs text-gray-500 mt-1">{f.notes}</p>}
                </div>
                <button onClick={() => deleteFollowup(f.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-1">{pending.length} pendentes · {done.length} concluídos</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Follow-up
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {[['pendente', 'Pendentes', pending.length], ['concluido', 'Concluídos', done.length]].map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label} <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5">{count}</span>
          </button>
        ))}
      </div>

      {tab === 'pendente' ? (
        <div>
          {overdue.length > 0 && renderList(overdue, `Atrasados (${overdue.length})`)}
          {today.length > 0 && renderList(today, `Hoje (${today.length})`)}
          {upcoming.length > 0 && renderList(upcoming, 'Próximos')}
          {pending.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum follow-up pendente</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {done.length > 0 ? renderList(done, `Concluídos`) : (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum follow-up concluído ainda</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo Follow-up</h2>
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
                    {Object.entries(FOLLOWUP_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                  <select value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Nenhum</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
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
