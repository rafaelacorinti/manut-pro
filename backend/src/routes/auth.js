const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'manutpro_secret_2024_seguro';

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios.' });

    const user = await get('SELECT * FROM users WHERE email = $1 AND ativo = 1', [email]);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const valid = bcrypt.compareSync(senha, user.senha);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT id, nome, email, role FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    if (!senha_atual || !nova_senha) return res.status(400).json({ error: 'Campos obrigatórios.' });

    const user = await get('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(senha_atual, user.senha)) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }
    const hash = bcrypt.hashSync(nova_senha, 10);
    await run('UPDATE users SET senha = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
