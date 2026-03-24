const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, get, all, run } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const dir = path.join(__dirname, '../../uploads', isImage ? 'imagens' : 'documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Tipo não permitido.'));
  }
});

async function gerarNumeroOS() {
  const ano = new Date().getFullYear();
  const ultimo = await get(
    `SELECT numero FROM manutencoes WHERE numero LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`OS-${ano}-%`]
  );
  if (!ultimo) return `OS-${ano}-0001`;
  const seq = parseInt(ultimo.numero.split('-')[2]) + 1;
  return `OS-${ano}-${String(seq).padStart(4, '0')}`;
}

router.get('/', async (req, res) => {
  try {
    const { status, tipo, local, tecnico_id, prioridade, data_inicio, data_fim, busca, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];

    const add = (cond, val) => { params.push(val); conditions.push(cond.replace('?', `$${params.length}`)); };

    if (status) add('m.status = ?', status);
    if (tipo) add('m.tipo = ?', tipo);
    if (local) add('m.local ILIKE ?', `%${local}%`);
    if (tecnico_id) add('m.tecnico_id = ?', tecnico_id);
    if (prioridade) add('m.prioridade = ?', prioridade);
    if (data_inicio) add('DATE(m.data_hora) >= ?', data_inicio);
    if (data_fim) add('DATE(m.data_hora) <= ?', data_fim);
    if (busca) {
      params.push(`%${busca}%`);
      const i = params.length;
      conditions.push(`(m.numero ILIKE $${i} OR m.descricao ILIKE $${i} OR m.local ILIKE $${i} OR m.tecnico_nome ILIKE $${i})`);
    }
    if (req.user.role === 'tecnico') add('m.tecnico_id = ?', req.user.id);

    const whereStr = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countRes = await get(`SELECT COUNT(*) as c FROM manutencoes m ${whereStr}`, params);
    const total = parseInt(countRes.c);

    params.push(parseInt(limit), offset);
    const rows = await all(`
      SELECT m.*,
        (SELECT COUNT(*) FROM anexos a WHERE a.manutencao_id = m.id AND a.tipo = 'imagem') as total_imagens,
        (SELECT COUNT(*) FROM anexos a WHERE a.manutencao_id = m.id AND a.tipo = 'documento') as total_documentos
      FROM manutencoes m ${whereStr} ORDER BY m.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/locais', async (req, res) => {
  try {
    const rows = await all('SELECT nome FROM locais ORDER BY nome');
    res.json(rows.map(r => r.nome));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/locais', async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório.' });
    await run('INSERT INTO locais (nome) VALUES ($1) ON CONFLICT DO NOTHING', [nome.trim()]);
    res.status(201).json({ nome: nome.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const m = await get('SELECT * FROM manutencoes WHERE id = $1', [req.params.id]);
    if (!m) return res.status(404).json({ error: 'Manutenção não encontrada.' });
    if (req.user.role === 'tecnico' && String(m.tecnico_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    const materiais = await all('SELECT * FROM materiais WHERE manutencao_id = $1', [m.id]);
    const anexos = await all('SELECT * FROM anexos WHERE manutencao_id = $1', [m.id]);
    const assinatura = await get('SELECT * FROM assinaturas WHERE manutencao_id = $1', [m.id]);
    res.json({ ...m, materiais, anexos, assinatura });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { data_hora, data_fim, local, tipo, tipo_personalizado, descricao, tecnico_nome, tecnico_id, status, prioridade, observacoes, custo, tempo_gasto, materiais } = req.body;
    if (!data_hora || !local || !tipo || !descricao || !tecnico_nome) {
      return res.status(400).json({ error: 'Campos obrigatórios: data_hora, local, tipo, descricao, tecnico_nome.' });
    }
    const numero = await gerarNumeroOS();
    const result = await run(`
      INSERT INTO manutencoes (numero, data_hora, data_fim, local, tipo, tipo_personalizado, descricao, tecnico_id, tecnico_nome, status, prioridade, observacoes, custo, tempo_gasto)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [numero, data_hora, data_fim || null, local, tipo, tipo_personalizado || null, descricao,
        tecnico_id || req.user.id, tecnico_nome, status || 'aberto',
        prioridade || 'media', observacoes || null, custo || 0, tempo_gasto || 0]
    );
    const manutencaoId = result.id;
    if (materiais?.length) {
      for (const mat of materiais) {
        if (mat.nome) await run(
          'INSERT INTO materiais (manutencao_id, nome, quantidade, unidade, custo_unitario) VALUES ($1,$2,$3,$4,$5)',
          [manutencaoId, mat.nome, mat.quantidade || 1, mat.unidade || 'un', mat.custo_unitario || 0]
        );
      }
    }
    res.status(201).json({ id: manutencaoId, numero });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { data_hora, data_fim, local, tipo, tipo_personalizado, descricao, tecnico_nome, tecnico_id, status, prioridade, observacoes, custo, tempo_gasto, materiais } = req.body;
    const existing = await get('SELECT * FROM manutencoes WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Não encontrada.' });
    if (req.user.role === 'tecnico' && String(existing.tecnico_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    await run(`
      UPDATE manutencoes SET data_hora=$1, data_fim=$2, local=$3, tipo=$4, tipo_personalizado=$5, descricao=$6,
        tecnico_id=$7, tecnico_nome=$8, status=$9, prioridade=$10, observacoes=$11, custo=$12, tempo_gasto=$13,
        updated_at=NOW() WHERE id=$14`,
      [data_hora, data_fim || null, local, tipo, tipo_personalizado || null, descricao,
        tecnico_id || existing.tecnico_id, tecnico_nome, status, prioridade,
        observacoes || null, custo || 0, tempo_gasto || 0, req.params.id]
    );
    if (materiais) {
      await run('DELETE FROM materiais WHERE manutencao_id = $1', [req.params.id]);
      for (const mat of materiais) {
        if (mat.nome) await run(
          'INSERT INTO materiais (manutencao_id, nome, quantidade, unidade, custo_unitario) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, mat.nome, mat.quantidade || 1, mat.unidade || 'un', mat.custo_unitario || 0]
        );
      }
    }
    res.json({ message: 'Atualizado com sucesso.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem excluir.' });
    const m = await get('SELECT * FROM manutencoes WHERE id = $1', [req.params.id]);
    if (!m) return res.status(404).json({ error: 'Não encontrada.' });
    const anexos = await all('SELECT caminho FROM anexos WHERE manutencao_id = $1', [req.params.id]);
    anexos.forEach(a => { if (fs.existsSync(a.caminho)) fs.unlinkSync(a.caminho); });
    await run('DELETE FROM manutencoes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Excluído.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/anexos', upload.array('arquivos', 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    const inseridos = [];
    for (const f of req.files) {
      const tipo = f.mimetype.startsWith('image/') ? 'imagem' : 'documento';
      const result = await run(
        'INSERT INTO anexos (manutencao_id, tipo, nome, caminho, tamanho) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [req.params.id, tipo, f.originalname, f.path, f.size]
      );
      inseridos.push({ id: result.id, tipo, nome: f.originalname, caminho: f.path, tamanho: f.size });
    }
    res.status(201).json(inseridos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/anexos/:anexoId', async (req, res) => {
  try {
    const anexo = await get('SELECT * FROM anexos WHERE id = $1 AND manutencao_id = $2', [req.params.anexoId, req.params.id]);
    if (!anexo) return res.status(404).json({ error: 'Anexo não encontrado.' });
    if (fs.existsSync(anexo.caminho)) fs.unlinkSync(anexo.caminho);
    await run('DELETE FROM anexos WHERE id = $1', [req.params.anexoId]);
    res.json({ message: 'Anexo removido.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/assinatura', async (req, res) => {
  try {
    const { dados, responsavel } = req.body;
    if (!dados) return res.status(400).json({ error: 'Dados obrigatórios.' });
    const existing = await get('SELECT id FROM assinaturas WHERE manutencao_id = $1', [req.params.id]);
    if (existing) {
      await run('UPDATE assinaturas SET dados=$1, responsavel=$2 WHERE manutencao_id=$3', [dados, responsavel, req.params.id]);
    } else {
      await run('INSERT INTO assinaturas (manutencao_id, dados, responsavel) VALUES ($1,$2,$3)', [req.params.id, dados, responsavel]);
    }
    res.json({ message: 'Assinatura salva.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
