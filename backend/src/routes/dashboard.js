const express = require('express');
const { get, all } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const hoje = new Date();
    const mesStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const [totalMes, abertos, emAndamento, concluidos, totalGeral, custoMes] = await Promise.all([
      get(`SELECT COUNT(*) as c FROM manutencoes WHERE TO_CHAR(data_hora,'YYYY-MM') = $1`, [mesStr]),
      get(`SELECT COUNT(*) as c FROM manutencoes WHERE status = 'aberto'`),
      get(`SELECT COUNT(*) as c FROM manutencoes WHERE status = 'em_andamento'`),
      get(`SELECT COUNT(*) as c FROM manutencoes WHERE status = 'concluido'`),
      get(`SELECT COUNT(*) as c FROM manutencoes`),
      get(`SELECT COALESCE(SUM(custo),0) as total FROM manutencoes WHERE TO_CHAR(data_hora,'YYYY-MM') = $1`, [mesStr]),
    ]);

    const porTipo = await all(`SELECT tipo, COUNT(*) as total FROM manutencoes GROUP BY tipo ORDER BY total DESC`);

    const ultimosMeses = [];
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = await get(`SELECT COUNT(*) as c FROM manutencoes WHERE TO_CHAR(data_hora,'YYYY-MM') = $1`, [str]);
      ultimosMeses.push({ mes: `${nomes[d.getMonth()]}/${d.getFullYear()}`, total: parseInt(row.c) });
    }

    const recentesConcluidos = await all(`SELECT numero, local, tipo, tecnico_nome, updated_at FROM manutencoes WHERE status = 'concluido' ORDER BY updated_at DESC LIMIT 5`);
    const urgentes = await all(`SELECT numero, local, tipo, descricao, tecnico_nome FROM manutencoes WHERE prioridade = 'urgente' AND status != 'concluido' ORDER BY created_at DESC LIMIT 5`);

    res.json({
      totalMes: parseInt(totalMes.c),
      totalGeral: parseInt(totalGeral.c),
      abertos: parseInt(abertos.c),
      emAndamento: parseInt(emAndamento.c),
      concluidos: parseInt(concluidos.c),
      custoMes: parseFloat(custoMes.total),
      porTipo,
      ultimosMeses,
      recentesConcluidos,
      urgentes
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
