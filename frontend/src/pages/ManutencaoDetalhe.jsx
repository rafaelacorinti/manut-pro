import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import api from '../services/api'
import { StatusBadge, PrioridadeBadge, TipoBadge } from '../components/Badges'
import { useAuth } from '../contexts/AuthContext'

export default function ManutencaoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignModal, setShowSignModal] = useState(false)
  const [signResponsavel, setSignResponsavel] = useState('')
  const [savingSign, setSavingSign] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const sigCanvasRef = useRef()
  const fileInputRef = useRef()

  const fetchData = () => {
    setLoading(true)
    api.get(`/manutencoes/${id}`).then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id])

  const handlePDF = () => {
    window.open(`/api/relatorios/pdf/${id}?token=${localStorage.getItem('token')}`, '_blank')
  }

  const downloadPDF = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/relatorios/pdf/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `OS-${data.numero}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSaveSignature = async () => {
    if (sigCanvasRef.current?.isEmpty()) { alert('Desenhe a assinatura.'); return }
    setSavingSign(true)
    try {
      const dados = sigCanvasRef.current.toDataURL('image/png')
      await api.post(`/manutencoes/${id}/assinatura`, { dados, responsavel: signResponsavel || data.tecnico_nome })
      setShowSignModal(false)
      fetchData()
    } catch (e) {
      alert('Erro ao salvar assinatura.')
    } finally {
      setSavingSign(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadingFiles(true)
    const form = new FormData()
    Array.from(files).forEach(f => form.append('arquivos', f))
    try {
      const res = await api.post(`/manutencoes/${id}/anexos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setData(prev => ({ ...prev, anexos: [...(prev.anexos || []), ...res.data] }))
    } catch (e) {
      alert(e.response?.data?.error || 'Erro no upload.')
    } finally {
      setUploadingFiles(false)
      e.target.value = ''
    }
  }

  const handleRemoveAnexo = async (anexoId) => {
    if (!confirm('Remover este anexo?')) return
    await api.delete(`/manutencoes/${id}/anexos/${anexoId}`)
    setData(prev => ({ ...prev, anexos: prev.anexos.filter(a => a.id !== anexoId) }))
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>
  if (!data) return <div className="text-center text-slate-400">Manutenção não encontrada.</div>

  const imagens = (data.anexos || []).filter(a => a.tipo === 'imagem')
  const documentos = (data.anexos || []).filter(a => a.tipo === 'documento')
  const totalMateriais = (data.materiais || []).reduce((s, m) => s + (m.quantidade * (m.custo_unitario || 0)), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manutencoes')} className="btn-secondary text-xs">← Voltar</button>
          <div>
            <h1 className="text-xl font-black text-slate-800 font-mono">{data.numero}</h1>
            <p className="text-slate-500 text-xs">Criado em {new Date(data.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate(`/manutencoes/${id}/editar`)} className="btn-secondary text-xs">Editar</button>
          <button onClick={() => setShowSignModal(true)} className="btn-secondary text-xs">Assinar</button>
          <button onClick={downloadPDF} className="btn-primary text-xs">Baixar PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Status</p>
          <StatusBadge status={data.status} />
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Prioridade</p>
          <PrioridadeBadge prioridade={data.prioridade} />
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Tipo</p>
          <TipoBadge tipo={data.tipo} tipoPersonalizado={data.tipo_personalizado} />
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Custo Total</p>
          <p className="font-bold text-slate-800">R$ {Number(data.custo || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-700 border-b pb-2 mb-4">Dados da OS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            ['Início', new Date(data.data_hora).toLocaleString('pt-BR')],
            ['Término', data.data_fim ? new Date(data.data_fim).toLocaleString('pt-BR') : '—'],
            ['Local', data.local],
            ['Técnico', data.tecnico_nome],
            ['Tempo Gasto', data.tempo_gasto ? `${data.tempo_gasto}h` : '-'],
          ].map(([l, v]) => (
            <div key={l}>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{l}</span>
              <p className="text-slate-800 font-medium mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Descrição</p>
          <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg">{data.descricao}</p>
        </div>
        {data.observacoes && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-slate-700 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">{data.observacoes}</p>
          </div>
        )}
      </div>

      {data.materiais?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-700 border-b pb-2 mb-4">Materiais Utilizados</h2>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Material</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Qtd</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Unid.</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Custo Unit.</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Subtotal</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.materiais.map(m => (
                <tr key={m.id}>
                  <td className="px-3 py-2">{m.nome}</td>
                  <td className="px-3 py-2 text-right">{m.quantidade}</td>
                  <td className="px-3 py-2">{m.unidade}</td>
                  <td className="px-3 py-2 text-right">R$ {Number(m.custo_unitario || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">R$ {(m.quantidade * (m.custo_unitario || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-primary-50">
              <td colSpan={4} className="px-3 py-2 text-right font-bold text-primary-700 text-sm">Total em Materiais:</td>
              <td className="px-3 py-2 text-right font-bold text-primary-700">R$ {totalMateriais.toFixed(2)}</td>
            </tr></tfoot>
          </table>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <h2 className="font-bold text-slate-700">Anexos ({(data.anexos || []).length})</h2>
          <div>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs" disabled={uploadingFiles}>
              {uploadingFiles ? 'Enviando...' : '+ Anexar'}
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        {imagens.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Imagens ({imagens.length})</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {imagens.map(a => (
                <div key={a.id} className="relative group">
                  <a href={`/uploads/imagens/${a.caminho.split(/[/\\]/).pop()}`} target="_blank" rel="noreferrer">
                    <img src={`/uploads/imagens/${a.caminho.split(/[/\\]/).pop()}`} alt={a.nome} className="w-full h-24 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
                  </a>
                  <p className="text-xs text-slate-500 mt-1 truncate">{a.nome}</p>
                  <button onClick={() => handleRemoveAnexo(a.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {documentos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Documentos ({documentos.length})</p>
            <div className="space-y-2">
              {documentos.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{a.nome}</p>
                      <p className="text-xs text-slate-400">{a.tamanho ? `${(a.tamanho / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/uploads/documentos/${a.caminho.split(/[/\\]/).pop()}`} target="_blank" rel="noreferrer" className="btn-secondary text-xs px-2 py-1">Ver</a>
                    <button onClick={() => handleRemoveAnexo(a.id)} className="btn-danger text-xs px-2 py-1">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(data.anexos || []).length === 0 && <p className="text-sm text-slate-400 text-center py-4">Nenhum anexo.</p>}
      </div>

      {data.assinatura && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-700 border-b pb-2 mb-4">Assinatura Digital</h2>
          <div className="flex items-start gap-6">
            <div>
              <img src={data.assinatura.dados} alt="Assinatura" className="border border-slate-200 rounded-lg max-w-xs bg-white" />
              <p className="text-xs text-slate-500 mt-2 text-center">{data.assinatura.responsavel || data.tecnico_nome}</p>
            </div>
            <div className="text-sm text-slate-600">
              <p><strong>Responsável:</strong> {data.assinatura.responsavel || '-'}</p>
              <p className="mt-1"><strong>Assinado em:</strong> {new Date(data.assinatura.created_at).toLocaleString('pt-BR')}</p>
              <button onClick={() => setShowSignModal(true)} className="btn-secondary text-xs mt-3">Reasinar</button>
            </div>
          </div>
        </div>
      )}

      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Assinatura Digital</h3>
            <div>
              <label className="label">Responsável</label>
              <input className="input mb-4" value={signResponsavel || data.tecnico_nome} onChange={e => setSignResponsavel(e.target.value)} />
            </div>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
              <SignatureCanvas ref={sigCanvasRef} canvasProps={{ width: 460, height: 180, className: 'w-full' }} backgroundColor="white" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Assine acima com o mouse ou toque</p>
            <div className="flex justify-between mt-4">
              <button onClick={() => sigCanvasRef.current?.clear()} className="btn-secondary text-xs">Limpar</button>
              <div className="flex gap-2">
                <button onClick={() => setShowSignModal(false)} className="btn-secondary" disabled={savingSign}>Cancelar</button>
                <button onClick={handleSaveSignature} className="btn-primary" disabled={savingSign}>
                  {savingSign ? 'Salvando...' : 'Salvar Assinatura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
