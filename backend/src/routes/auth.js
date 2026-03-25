const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'manutpro_secret_2024_seguro';

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    if (senha.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });

    const existing = await get('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const hash = bcrypt.hashSync(senha, 10);
    await run(
      'INSERT INTO users (nome, email, senha, role, ativo) VALUES ($1, $2, $3, $4, $5)',
      [nome, email, hash, 'tecnico', 0]
    );

    res.status(201).json({ message: 'Cadastro realizado! Aguarde a aprovação do administrador para acessar o sistema.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios.' });

    const user = await get('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });
    if (!user.ativo) return res.status(403).json({ error: 'Cadastro aguardando aprovação do administrador.' });

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
