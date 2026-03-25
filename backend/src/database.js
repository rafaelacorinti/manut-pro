const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

// Helper: executa query e retorna resultado completo
async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

// Helper: retorna primeira linha
async function get(text, params = []) {
  const res = await query(text, params);
  return res.rows[0];
}

// Helper: retorna todas as linhas
async function all(text, params = []) {
  const res = await query(text, params);
  return res.rows;
}

// Helper: executa sem retornar linhas (INSERT/UPDATE/DELETE)
async function run(text, params = []) {
  const res = await query(text, params);
  return { rowCount: res.rowCount, id: res.rows[0]?.id ?? null };
}

// Helper: monta filtros dinâmicos com $1, $2...
function buildFilters(filtersObj) {
  const conditions = [];
  const params = [];
  for (const [cond, val] of Object.entries(filtersObj)) {
    if (val !== undefined && val !== null && val !== '') {
      params.push(val);
      conditions.push(cond.replace('?', `$${params.length}`));
    }
  }
  return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      role TEXT DEFAULT 'tecnico',
      ativo INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS locais (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS manutencoes (
      id BIGSERIAL PRIMARY KEY,
      numero TEXT UNIQUE NOT NULL,
      data_hora TIMESTAMPTZ NOT NULL,
      data_fim TIMESTAMPTZ,
      local TEXT NOT NULL,
      tipo TEXT NOT NULL,
      tipo_personalizado TEXT,
      descricao TEXT NOT NULL,
      tecnico_id BIGINT,
      tecnico_nome TEXT NOT NULL,
      status TEXT DEFAULT 'aberto',
      prioridade TEXT DEFAULT 'media',
      observacoes TEXT,
      custo NUMERIC DEFAULT 0,
      custo_mao_obra NUMERIC DEFAULT 0,
      tempo_gasto NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS materiais (
      id BIGSERIAL PRIMARY KEY,
      manutencao_id BIGINT NOT NULL,
      nome TEXT NOT NULL,
      quantidade NUMERIC DEFAULT 1,
      unidade TEXT DEFAULT 'un',
      custo_unitario NUMERIC DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS anexos (
      id BIGSERIAL PRIMARY KEY,
      manutencao_id BIGINT NOT NULL,
      tipo TEXT NOT NULL,
      nome TEXT NOT NULL,
      caminho TEXT NOT NULL,
      tamanho BIGINT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assinaturas (
      id BIGSERIAL PRIMARY KEY,
      manutencao_id BIGINT UNIQUE,
      dados TEXT NOT NULL,
      responsavel TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS empresa (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL DEFAULT 'Minha Empresa',
      cnpj TEXT,
      endereco TEXT,
      telefone TEXT,
      email TEXT,
      logo_path TEXT,
      logo_base64 TEXT
    );
  `);

  const admin = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  // Migração: adicionar colunas novas se não existirem
  await query(`ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS custo_mao_obra NUMERIC DEFAULT 0`).catch(() => {});
  await query(`ALTER TABLE empresa ADD COLUMN IF NOT EXISTS logo_base64 TEXT`).catch(() => {});
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await run('INSERT INTO users (nome, email, senha, role) VALUES ($1,$2,$3,$4)', ['Administrador', 'admin@manutpro.com', hash, 'admin']);
    console.log('Admin padrão criado: admin@manutpro.com / admin123');
  }

  const empresa = await get('SELECT id FROM empresa LIMIT 1');
  if (!empresa) {
    await run("INSERT INTO empresa (nome) VALUES ($1)", ['Minha Empresa']);
  }

  const locaisCount = await get('SELECT COUNT(*) as c FROM locais');
  if (parseInt(locaisCount?.c) === 0) {
    const locaisPadrao = ['Térreo', '1º Andar', '2º Andar', 'Cobertura', 'Subsolo', 'Área Externa', 'Casa de Máquinas', 'Garagem'];
    for (const l of locaisPadrao) {
      await run('INSERT INTO locais (nome) VALUES ($1) ON CONFLICT DO NOTHING', [l]);
    }
  }

  console.log('Banco de dados PostgreSQL inicializado.');
}

module.exports = { query, get, all, run, buildFilters, initDB };
