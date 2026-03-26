export const initialData = {
  contacts: [
    { id: 1, name: 'Carlos Mendes', email: 'carlos@email.com', phone: '(11) 99001-2345', type: 'comprador', budget: 850000, neighborhood: 'Moema', status: 'quente', lastContact: '2026-03-20', notes: 'Procura ap 3 quartos com varanda' },
    { id: 2, name: 'Ana Paula Lima', email: 'ana@email.com', phone: '(11) 98765-4321', type: 'comprador', budget: 1200000, neighborhood: 'Vila Olímpia', status: 'morno', lastContact: '2026-03-18', notes: 'Prefere cobertura ou andar alto' },
    { id: 3, name: 'Ricardo Sousa', email: 'ricardo@email.com', phone: '(11) 97654-3210', type: 'investidor', budget: 3000000, neighborhood: 'Pinheiros', status: 'quente', lastContact: '2026-03-22', notes: 'Quer imóvel comercial para renda' },
    { id: 4, name: 'Fernanda Costa', email: 'fernanda@email.com', phone: '(11) 96543-2109', type: 'vendedor', budget: 0, neighborhood: 'Itaim Bibi', status: 'frio', lastContact: '2026-03-10', notes: 'Quer vender casa de 4 quartos' },
    { id: 5, name: 'Marcos Oliveira', email: 'marcos@email.com', phone: '(11) 95432-1098', type: 'comprador', budget: 450000, neighborhood: 'Santo André', status: 'quente', lastContact: '2026-03-23', notes: 'Primeiro imóvel, financiamento FGTS' },
    { id: 6, name: 'Juliana Ramos', email: 'juliana@email.com', phone: '(11) 94321-0987', type: 'comprador', budget: 600000, neighborhood: 'Brooklin', status: 'morno', lastContact: '2026-03-15', notes: 'Família com 2 filhos, precisa de área de lazer' },
  ],
  properties: [
    { id: 1, title: 'Apartamento 3 Quartos – Moema', type: 'apartamento', status: 'disponivel', price: 920000, area: 95, bedrooms: 3, bathrooms: 2, parking: 2, neighborhood: 'Moema', address: 'Av. Ibirapuera, 1200', description: 'Apto com varanda gourmet, lazer completo', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80' },
    { id: 2, title: 'Cobertura Duplex – Vila Olímpia', type: 'cobertura', status: 'disponivel', price: 2150000, area: 220, bedrooms: 4, bathrooms: 4, parking: 4, neighborhood: 'Vila Olímpia', address: 'Rua Funchal, 500', description: 'Cobertura com piscina privativa e vista panorâmica', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80' },
    { id: 3, title: 'Sala Comercial – Pinheiros', type: 'comercial', status: 'disponivel', price: 780000, area: 65, bedrooms: 0, bathrooms: 2, parking: 1, neighborhood: 'Pinheiros', address: 'Rua dos Pinheiros, 340', description: 'Sala em andar alto, acabamento premium', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' },
    { id: 4, title: 'Casa 4 Quartos – Itaim Bibi', type: 'casa', status: 'negociando', price: 3800000, area: 380, bedrooms: 4, bathrooms: 5, parking: 4, neighborhood: 'Itaim Bibi', address: 'Rua Pedroso Alvarenga, 80', description: 'Casa de alto padrão com piscina e jardim', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80' },
    { id: 5, title: 'Apartamento 2 Quartos – Santo André', type: 'apartamento', status: 'disponivel', price: 420000, area: 68, bedrooms: 2, bathrooms: 1, parking: 1, neighborhood: 'Santo André', address: 'Av. Industrial, 550', description: 'Ótimo custo-benefício, próximo ao metrô', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80' },
    { id: 6, title: 'Flat 1 Quarto – Brooklin', type: 'flat', status: 'vendido', price: 580000, area: 45, bedrooms: 1, bathrooms: 1, parking: 1, neighborhood: 'Brooklin', address: 'Av. Santo Amaro, 1100', description: 'Flat com serviços de hotel, mobiliado', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80' },
  ],
  pipeline: [
    { id: 1, contactId: 1, propertyId: 1, stage: 'prospeccao', value: 920000, createdAt: '2026-03-10', updatedAt: '2026-03-20' },
    { id: 2, contactId: 2, propertyId: 2, stage: 'visita', value: 2150000, createdAt: '2026-03-05', updatedAt: '2026-03-18' },
    { id: 3, contactId: 3, propertyId: 3, stage: 'proposta', value: 780000, createdAt: '2026-03-01', updatedAt: '2026-03-22' },
    { id: 4, contactId: 4, propertyId: 4, stage: 'negociacao', value: 3800000, createdAt: '2026-02-20', updatedAt: '2026-03-15' },
    { id: 5, contactId: 5, propertyId: 5, stage: 'prospeccao', value: 420000, createdAt: '2026-03-18', updatedAt: '2026-03-23' },
    { id: 6, contactId: 6, propertyId: 6, stage: 'fechamento', value: 580000, createdAt: '2026-02-10', updatedAt: '2026-03-20' },
  ],
  followups: [
    { id: 1, contactId: 1, dealId: 1, title: 'Ligar para confirmar visita', date: '2026-03-26', time: '10:00', type: 'ligacao', done: false, notes: '' },
    { id: 2, contactId: 2, dealId: 2, title: 'Enviar fotos do novo andar', date: '2026-03-26', time: '14:00', type: 'email', done: false, notes: '' },
    { id: 3, contactId: 3, dealId: 3, title: 'Reunião para proposta final', date: '2026-03-27', time: '09:30', type: 'reuniao', done: false, notes: 'Preparar simulação de retorno' },
    { id: 4, contactId: 5, dealId: 5, title: 'Enviar documentação FGTS', date: '2026-03-28', time: '11:00', type: 'whatsapp', done: false, notes: '' },
    { id: 5, contactId: 1, dealId: 1, title: 'Visita ao imóvel realizada', date: '2026-03-19', time: '15:00', type: 'visita', done: true, notes: 'Cliente gostou muito da varanda' },
    { id: 6, contactId: 6, dealId: 6, title: 'Assinatura do contrato', date: '2026-03-25', time: '16:00', type: 'reuniao', done: true, notes: 'Venda concluída com sucesso' },
  ],
  interactions: [
    { id: 1, contactId: 1, type: 'ligacao', date: '2026-03-20', summary: 'Cliente confirmou interesse, quer visitar fim de semana' },
    { id: 2, contactId: 2, type: 'email', date: '2026-03-18', summary: 'Enviadas fotos da cobertura, aguardando retorno' },
    { id: 3, contactId: 3, type: 'reuniao', date: '2026-03-22', summary: 'Apresentou proposta de R$ 750.000, aguardamos contraproposta' },
    { id: 4, contactId: 5, type: 'whatsapp', date: '2026-03-23', summary: 'Enviou documentos para análise de crédito' },
  ],
};

export const STAGES = [
  { id: 'prospeccao', label: 'Prospecção', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { id: 'qualificacao', label: 'Qualificação', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  { id: 'visita', label: 'Visita', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  { id: 'proposta', label: 'Proposta', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  { id: 'fechamento', label: 'Fechamento', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
];

export const STATUS_COLORS = {
  quente: 'bg-red-100 text-red-700',
  morno: 'bg-amber-100 text-amber-700',
  frio: 'bg-blue-100 text-blue-700',
};

export const FOLLOWUP_TYPES = {
  ligacao: { label: 'Ligação', icon: '📞', color: 'bg-green-100 text-green-700' },
  email: { label: 'E-mail', icon: '📧', color: 'bg-blue-100 text-blue-700' },
  whatsapp: { label: 'WhatsApp', icon: '💬', color: 'bg-emerald-100 text-emerald-700' },
  visita: { label: 'Visita', icon: '🏠', color: 'bg-purple-100 text-purple-700' },
  reuniao: { label: 'Reunião', icon: '🤝', color: 'bg-orange-100 text-orange-700' },
};
