import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const TIPOS = ['preventiva', 'corretiva', 'preditiva', 'personalizada']
const TIPO_LABELS = { preventiva: 'Preventiva', corretiva: 'Corretiva', preditiva: 'Preditiva', personalizada: 'Personalizada' }
const STATUS_OPTS = [{ v: 'aberto', l: 'Aberto' }, { v: 'em_andamento', l: 'Em Andamento' }, { v: 'concluido', l: 'Concluído' }]
const PRIO_OPTS = [{ v: 'baixa', l: 'Baixa' }, { v: 'media', l: 'Média' }, { v: 'alta', l: 'Alta' }, { v: 'urgente', l: 'Urgente' }]

export default function ManutencaoForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [locais, setLocais] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [novoLocal, setNovoLocal] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [anexos, setAnexos] = useState([])
  const fileInputRef = useRef()

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      data_hora: new Date().toISOString().slice(0, 16),
      status: 'aberto',
      prioridade: 'media',
      tipo: 'corretiva',
      custo: 0,
      tempo_gasto: 0,
      materiais: []
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'materiais' })
  const tipoSelecionado = watch('tipo')
  const watchMateriais = watch('materiais')
  const watchCustoMaoDeObra = watch('custo_mao_obra')
  const manutencaoId = useRef(null)

  const custoMateriais = (watchMateriais || []).reduce((acc, m) => {
    const qtd = parseFloat(m?.quantidade) || 0
    const unit = parseFloat(m?.custo_unitario) || 0
    return acc + qtd * unit
  }, 0)
  const custoTotal = (parseFloat(watchCustoMaoDeObra) || 0) + custoMateriais

  useEffect(() => {
    api.get('/manutencoes/locais').then(r => setLocais(r.data))
    if (user?.role === 'admin') {
      api.get('/users').then(r => setTecnicos(r.data.filter(u => u.ativo)))
    }
    if (isEdit) {
      setLoading(true)
      api.get(`/manutencoes/${id}`).then(r => {
        const m = r.data
        manutencaoId.current = m.id
        setValue('data_hora', m.data_hora?.slice(0, 16))
        setValue('local', m.local)
        setValue('tipo', m.tipo)
        setValue('tipo_personalizado', m.tipo_personalizado || '')
        setValue('descricao', m.descricao)
        setValue('tecnico_nome', m.tecnico_nome)
        setValue('tecnico_id', m.tecnico_id)
        setValue('status', m.status)
        setValue('prioridade', m.prioridade)
        setValue('observacoes', m.observacoes || '')
        setValue('custo_mao_obra', m.custo_mao_obra || 0)
        setValue('tempo_gasto', m.tempo_gasto || 0)
        setValue('data_fim', m.data_fim?.slice(0, 16) || '')
        setValue('materiais', m.materiais || [])
        setAnexos(m.anexos || [])
      }).finally(() => setLoading(false))
    } else {
      setValue('tecnico_nome', user?.nome)
      setValue('tecnico_id', user?.id)
    }
  }, [id])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/manutencoes/${id}`, data)
        navigate(`/manutencoes/${id}`)
      } else {
        const res = await api.post('/manutencoes', data)
        navigate(`/manutencoes/${res.data.id}`)
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e) => {
    const targetId = id || manutencaoId.current
    if (!targetId) {
      alert('Salve a OS primeiro para adicionar anexos.')
      return
    }
    const files = e.target.files
    if (!files?.length) return
    setUploadingFiles(true)
    const form = new FormData()
    Array.from(files).forEach(f => form.append('arquivos', f))
    try {
      const res = await api.post(`/manutencoes/${targetId}/anexos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAnexos(prev => [...prev, ...res.data])
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao fazer upload.')
    } finally {
      setUploadingFiles(false)
      e.target.value = ''
    }
  }

  const handleRemoveAnexo = async (anexoId) => {
    const targetId = id || manutencaoId.current
    if (!targetId) return
    if (!confirm('Remover este anexo?')) return
    await api.delete(`/manutencoes/${targetId}/anexos/${anexoId}`)
    setAnexos(prev => prev.filter(a => a.id !== anexoId))
  }

  const adicionarLocal = async () => {
    if (!novoLocal.trim()) return
    try {
      await api.post('/manutencoes/locais', { nome: novoLocal.trim() })
      const res = await api.get('/manutencoes/locais')
      setLocais(res.data)
      setValue('local', novoLocal.trim())
      setNovoLocal('')
    } catch (e) {
      alert('Erro ao adicionar local.')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary text-xs">← Voltar</button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">{isEdit ? 'Editar Manutenção' : 'Nova Ordem de Serviço'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">Identificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Data e Hora de Início *</label>
              <input type="datetime-local" className="input" {...register('data_hora', { required: true })} />
            </div>
            <div>
              <label className="label">Data e Hora de Término</label>
              <input type="datetime-local" className="input" {...register('data_fim')} />
              <p className="text-xs text-slate-400 mt-1">Deixe em branco se ainda não concluída</p>
            </div>
            <div>
              <label className="label">Local *</label>
              <div className="flex gap-2">
                <select className="input flex-1" {...register('local', { required: true })}>
                  <option value="">Selecione ou adicione...</option>
                  {locais.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input className="input w-32" placeholder="Novo local" value={novoLocal} onChange={e => setNovoLocal(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarLocal())} />
                <button type="button" onClick={adicionarLocal} className="btn-secondary text-xs px-3">+</button>
              </div>
              {errors.local && <p className="text-xs text-red-500 mt-1">Campo obrigatório</p>}
            </div>
            <div>
              <label className="label">Tipo de Manutenção *</label>
              <select className="input" {...register('tipo', { required: true })}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
              </select>
            </div>
            {tipoSelecionado === 'personalizada' && (
              <div>
                <label className="label">Tipo Personalizado</label>
                <input className="input" placeholder="Descreva o tipo..." {...register('tipo_personalizado')} />
              </div>
            )}
            <div>
              <label className="label">Prioridade</label>
              <select className="input" {...register('prioridade')}>
                {PRIO_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...register('status')}>
                {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Técnico Responsável *</label>
              {user?.role === 'admin' && tecnicos.length > 0 ? (
                <select className="input" {...register('tecnico_nome', { required: true })} onChange={e => {
                  const tec = tecnicos.find(t => t.nome === e.target.value)
                  setValue('tecnico_id', tec?.id)
                  setValue('tecnico_nome', e.target.value)
                }}>
                  <option value="">Selecione...</option>
                  {tecnicos.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                </select>
              ) : (
                <input className="input" {...register('tecnico_nome', { required: true })} readOnly={user?.role === 'tecnico'} />
              )}
            </div>
            <div>
              <label className="label">Custo Mão de Obra (R$)</label>
              <input type="number" step="0.01" min="0" className="input" {...register('custo_mao_obra')} />
            </div>
            <div>
              <label className="label">Tempo Gasto (horas)</label>
              <input type="number" step="0.5" min="0" className="input" {...register('tempo_gasto')} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Custo Mão de Obra</p>
              <p className="font-bold text-slate-700">R$ {(parseFloat(watchCustoMaoDeObra) || 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Custo Materiais</p>
              <p className="font-bold text-slate-700">R$ {custoMateriais.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Custo Total</p>
              <p className="font-black text-primary-700 text-lg">R$ {custoTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="font-bold text-slate-700 border-b pb-2">Descrição do Serviço</h2>
          <div>
            <label className="label">Descrição Detalhada *</label>
            <textarea rows={4} className="input resize-none" placeholder="Descreva detalhadamente o serviço executado..." {...register('descricao', { required: true })} />
            {errors.descricao && <p className="text-xs text-red-500 mt-1">Campo obrigatório</p>}
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea rows={3} className="input resize-none" placeholder="Observações adicionais..." {...register('observacoes')} />
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-slate-700">Materiais Utilizados</h2>
            <button type="button" onClick={() => append({ nome: '', quantidade: 1, unidade: 'un', custo_unitario: 0 })} className="btn-secondary text-xs">+ Adicionar Material</button>
          </div>
          {fields.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Nenhum material adicionado.</p>}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-5 gap-2 items-center">
                <input className="input col-span-2" placeholder="Nome do material" {...register(`materiais.${index}.nome`)} />
                <input type="number" step="0.1" min="0" className="input" placeholder="Qtd" {...register(`materiais.${index}.quantidade`)} />
                <input className="input" placeholder="Unid." {...register(`materiais.${index}.unidade`)} />
                <div className="flex gap-1">
                  <input type="number" step="0.01" min="0" className="input flex-1" placeholder="Custo unit." {...register(`materiais.${index}.custo_unitario`)} />
                  <button type="button" onClick={() => remove(index)} className="btn-danger px-2 py-1 text-xs">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isEdit && (
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-slate-700">Anexos</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs" disabled={uploadingFiles}>
                  {uploadingFiles ? 'Enviando...' : '+ Anexar Arquivo'}
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
            {anexos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum anexo. Clique em "+ Anexar Arquivo".</p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {anexos.map(a => (
                  <div key={a.id} className="relative group">
                    {a.tipo === 'imagem' ? (
                      <img src={`/uploads/imagens/${a.caminho.split(/[/\\]/).pop()}`} alt={a.nome} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-3xl">📄</div>
                    )}
                    <p className="text-xs text-slate-500 mt-1 truncate">{a.nome}</p>
                    <button type="button" onClick={() => handleRemoveAnexo(a.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary px-8" disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
          </button>
        </div>
      </form>
    </div>
  )
}
