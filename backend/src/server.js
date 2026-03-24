const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

require('dotenv').config();

const { initDB, get, run } = require('./database');
const authRoutes = require('./routes/auth');
const manutencoesRoutes = require('./routes/manutencoes');
const relatoriosRoutes = require('./routes/relatorios');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(null, true); // permissivo por padrão — restrinja em produção se necessário
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/logo');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `logo${path.extname(file.originalname)}`)
});
const logoUpload = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use('/api/auth', authRoutes);
app.use('/api/manutencoes', manutencoesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/empresa', authMiddleware, async (req, res) => {
  try { res.json(await get('SELECT * FROM empresa LIMIT 1') || {}); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/empresa', authMiddleware, async (req, res) => {
  try {
    const { nome, cnpj, endereco, telefone, email } = req.body;
    const existing = await get('SELECT id FROM empresa LIMIT 1');
    if (existing) {
      await run('UPDATE empresa SET nome=$1, cnpj=$2, endereco=$3, telefone=$4, email=$5 WHERE id=$6',
        [nome, cnpj, endereco, telefone, email, existing.id]);
    } else {
      await run('INSERT INTO empresa (nome, cnpj, endereco, telefone, email) VALUES ($1,$2,$3,$4,$5)',
        [nome, cnpj, endereco, telefone, email]);
    }
    res.json({ message: 'Dados atualizados.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/empresa/logo', authMiddleware, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
    await run('UPDATE empresa SET logo_path = $1', [req.file.path]);
    res.json({ url: `/uploads/logo/${req.file.filename}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(500).json({ error: err.message || 'Erro interno.' });
});

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  Manut-Pro Backend rodando na porta ${PORT}`);
      console.log(`  http://localhost:${PORT}/api/health`);
      console.log(`  Admin: admin@manutpro.com / admin123`);
      console.log(`========================================\n`);
    });
  } catch (err) {
    console.error('Falha ao inicializar:', err);
    process.exit(1);
  }
}

start();
