const express = require('express');
const bcrypt = require('bcryptjs');
const { get, all, run } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/pendentes', adminMiddleware, async (req, res) => {
  try {
    const users = await all('SELECT id, nome, email, role, created_at FROM users WHERE ativo = 0 ORDER BY created_at DESC');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/aprovar', adminMiddleware, async (req, res) => {
  try {
    await run('UPDATE users SET ativo = 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Usuário aprovado com sucesso.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/rejeitar', adminMiddleware, async (req, res) => {
  try {
    await run('DELETE FROM users WHERE id = $1 AND ativo = 0', [req.params.id]);
    res.json({ message: 'Cadastro rejeitado.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const users = await all('SELECT id, nome, email, role, ativo, created_at FROM users ORDER BY nome');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios.' });
    const exists = await get('SELECT id FROM users WHERE email = $1', [email]);
    if (exists) return res.status(400).json({ error: 'Email já cadastrado.' });
    const hash = bcrypt.hashSync(senha, 10);
    const result = await run(
      'INSERT INTO users (nome, email, senha, role) VALUES ($1,$2,$3,$4) RETURNING id',
      [nome, email, hash, role || 'tecnico']
    );
    res.status(201).json({ id: result.id, nome, email, role: role || 'tecnico' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { nome, email, role, ativo, senha } = req.body;
    if (senha) {
      const hash = bcrypt.hashSync(senha, 10);
      await run('UPDATE users SET nome=$1, email=$2, role=$3, ativo=$4, senha=$5 WHERE id=$6',
        [nome, email, role, ativo ?? 1, hash, req.params.id]);
    } else {
      await run('UPDATE users SET nome=$1, email=$2, role=$3, ativo=$4 WHERE id=$5',
        [nome, email, role, ativo ?? 1, req.params.id]);
    }
    res.json({ message: 'Usuário atualizado.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário.' });
    }
    await run('UPDATE users SET ativo = 0 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Usuário desativado.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
