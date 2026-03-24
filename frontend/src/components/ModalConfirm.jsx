export default function ModalConfirm({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary" disabled={loading}>Cancelar</button>
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? 'Aguarde...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
