const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { get, all } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function buildQuery(q, role, userId) {
  const conditions = [];
  const params = [];
  const add = (cond, val) => { params.push(val); conditions.push(cond.replace('?', `$${params.length}`)); };

  if (q.status) add('m.status = ?', q.status);
  if (q.tipo) add('m.tipo = ?', q.tipo);
  if (q.local) add('m.local ILIKE ?', `%${q.local}%`);
  if (q.tecnico_id) add('m.tecnico_id = ?', q.tecnico_id);
  if (q.prioridade) add('m.prioridade = ?', q.prioridade);
  if (q.data_inicio) add('DATE(m.data_hora) >= ?', q.data_inicio);
  if (q.data_fim) add('DATE(m.data_hora) <= ?', q.data_fim);
  if (role === 'tecnico') add('m.tecnico_id = ?', userId);

  return { whereStr: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

function fmtData(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
const labelTipo = (t, c) => ({ preventiva: 'Preventiva', corretiva: 'Corretiva', preditiva: 'Preditiva', personalizada: c || 'Personalizada' })[t] || t;
const labelStatus = s => ({ aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluído' })[s] || s;
const labelPrioridade = p => ({ baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' })[p] || p;

router.get('/pdf/:id', async (req, res) => {
  try {
    const m = await get('SELECT * FROM manutencoes WHERE id = $1', [req.params.id]);
    if (!m) return res.status(404).json({ error: 'Não encontrada.' });

    const [materiais, anexos, assinatura, empresa] = await Promise.all([
      all('SELECT * FROM materiais WHERE manutencao_id = $1', [m.id]),
      all('SELECT * FROM anexos WHERE manutencao_id = $1', [m.id]),
      get('SELECT * FROM assinaturas WHERE manutencao_id = $1', [m.id]),
      get('SELECT * FROM empresa LIMIT 1'),
    ]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OS-${m.numero}.pdf"`);
    doc.pipe(res);

    const azul = '#1e40af';
    const cinzaClaro = '#f1f5f9';
    const pageWidth = doc.page.width - 100;

    doc.rect(50, 40, pageWidth, 80).fill(azul);
    if (empresa?.logo_path && fs.existsSync(empresa.logo_path)) {
      doc.image(empresa.logo_path, 60, 48, { height: 64 });
    }
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text(empresa?.nome || 'Minha Empresa', 130, 55, { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('RELATÓRIO DE MANUTENÇÃO PREDIAL', 130, 80, { align: 'center' });

    doc.y = 135;
    doc.rect(50, 130, pageWidth, 22).fill(cinzaClaro);
    doc.fillColor(azul).fontSize(11).font('Helvetica-Bold').text('IDENTIFICAÇÃO DA ORDEM DE SERVIÇO', 55, 135);

    const col1 = 55, col2 = 310;
    let y = 162;
    const campo = (label, valor, x, yPos, largura) => {
      doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold').text(label, x, yPos, { width: largura });
      doc.fontSize(10).fillColor('#1e293b').font('Helvetica').text(String(valor || '-'), x, yPos + 12, { width: largura });
    };

    campo('Nº da OS', m.numero, col1, y, 200);
    campo('Data / Hora Início', fmtData(m.data_hora), col2, y, 200); y += 38;
    campo('Data / Hora Término', m.data_fim ? fmtData(m.data_fim) : 'Não informado', col1, y, 200);
    campo('Local', m.local, col2, y, 200); y += 38;
    campo('Tipo de Manutenção', labelTipo(m.tipo, m.tipo_personalizado), col1, y, 200);
    campo('Técnico Responsável', m.tecnico_nome, col2, y, 200); y += 38;
    campo('Prioridade', labelPrioridade(m.prioridade), col1, y, 200);
    campo('Status', labelStatus(m.status), col2, y, 200); y += 38;
    campo('Custo Total', `R$ ${parseFloat(m.custo || 0).toFixed(2)}`, col1, y, 200);
    campo('Tempo Gasto', m.tempo_gasto ? `${m.tempo_gasto}h` : '-', col2, y, 200); y += 38;

    doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke(); y += 12;
    doc.rect(50, y, pageWidth, 22).fill(cinzaClaro);
    doc.fillColor(azul).fontSize(11).font('Helvetica-Bold').text('DESCRIÇÃO DO SERVIÇO', 55, y + 5); y += 30;
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(m.descricao || '-', 55, y, { width: pageWidth - 10 });
    y = doc.y + 12;

    if (m.observacoes) {
      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke(); y += 12;
      doc.rect(50, y, pageWidth, 22).fill(cinzaClaro);
      doc.fillColor(azul).fontSize(11).font('Helvetica-Bold').text('OBSERVAÇÕES', 55, y + 5); y += 30;
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(m.observacoes, 55, y, { width: pageWidth - 10 });
      y = doc.y + 12;
    }

    if (materiais?.length) {
      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke(); y += 12;
      doc.rect(50, y, pageWidth, 22).fill(cinzaClaro);
      doc.fillColor(azul).fontSize(11).font('Helvetica-Bold').text('MATERIAIS UTILIZADOS', 55, y + 5); y += 30;
      doc.rect(50, y, pageWidth, 18).fill('#e2e8f0');
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
      doc.text('Material', 55, y + 4, { width: 180 });
      doc.text('Qtd', 240, y + 4, { width: 60 });
      doc.text('Unid.', 305, y + 4, { width: 60 });
      doc.text('Custo Unit.', 368, y + 4, { width: 80 });
      doc.text('Subtotal', 450, y + 4, { width: 80 }); y += 18;
      let totalMat = 0;
      materiais.forEach((mat, i) => {
        if (i % 2 === 1) doc.rect(50, y, pageWidth, 18).fill('#f8fafc');
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica');
        doc.text(mat.nome, 55, y + 4, { width: 180 });
        doc.text(String(mat.quantidade), 240, y + 4, { width: 60 });
        doc.text(mat.unidade || 'un', 305, y + 4, { width: 60 });
        doc.text(`R$ ${parseFloat(mat.custo_unitario || 0).toFixed(2)}`, 368, y + 4, { width: 80 });
        const sub = (mat.quantidade || 1) * (mat.custo_unitario || 0);
        totalMat += sub;
        doc.text(`R$ ${sub.toFixed(2)}`, 450, y + 4, { width: 80 }); y += 18;
      });
      doc.rect(50, y, pageWidth, 20).fill('#dbeafe');
      doc.fillColor(azul).fontSize(10).font('Helvetica-Bold').text(`Total em Materiais: R$ ${totalMat.toFixed(2)}`, 55, y + 5, { align: 'right', width: pageWidth - 10 }); y += 28;
    }

    const imagens = (anexos || []).filter(a => a.tipo === 'imagem' && fs.existsSync(a.caminho));
    if (imagens.length) {
      if (y > doc.page.height - 200) { doc.addPage(); y = 50; }
      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke(); y += 12;
      doc.rect(50, y, pageWidth, 22).fill(cinzaClaro);
      doc.fillColor(azul).fontSize(11).font('Helvetica-Bold').text('IMAGENS ANEXADAS', 55, y + 5); y += 30;
      for (let i = 0; i < imagens.length; i++) {
        if (y > doc.page.height - 250) { doc.addPage(); y = 50; }
        try {
          doc.image(imagens[i].caminho, 55, y, { width: 220, height: 180 });
          doc.fontSize(8).fillColor('#64748b').text(imagens[i].nome, 55, y + 185, { width: 220 });
          if (i % 2 === 0 && i + 1 < imagens.length && fs.existsSync(imagens[i + 1].caminho)) {
            doc.image(imagens[i + 1].caminho, 290, y, { width: 220, height: 180 });
            doc.fontSize(8).fillColor('#64748b').text(imagens[i + 1].nome, 290, y + 185, { width: 220 });
            i++;
          }
          y += 210;
        } catch (e) { doc.fontSize(9).fillColor('#ef4444').text(`[Imagem indisponível: ${imagens[i].nome}]`, 55, y); y += 20; }
      }
    }

    if (y > doc.page.height - 180) { doc.addPage(); y = 50; }
    y += 10;
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke(); y += 15;
    doc.rect(50, y, pageWidth, 22).fill(cinzaClaro);
    doc.fillColor(azul).fontSize(11).font('Helvetica-Bold').text('ASSINATURA DO RESPONSÁVEL', 55, y + 5); y += 35;

    if (assinatura?.dados) {
      try {
        const buf = Buffer.from(assinatura.dados.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        doc.image(buf, 55, y, { width: 200, height: 70 });
        y += 78;
      } catch (e) { doc.rect(55, y, 220, 70).strokeColor('#94a3b8').lineWidth(1).stroke(); y += 78; }
    } else {
      doc.rect(55, y, 220, 70).strokeColor('#94a3b8').lineWidth(1).stroke(); y += 78;
    }
    doc.moveTo(55, y).lineTo(275, y).strokeColor('#334155').lineWidth(1).stroke();
    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(assinatura?.responsavel || m.tecnico_nome, 55, y + 4, { width: 220, align: 'center' }); y += 25;
    doc.fillColor('#64748b').fontSize(9).text(`Data de Emissão: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 50, y, { width: pageWidth, align: 'right' });
    doc.fillColor('#94a3b8').fontSize(8).text(`Gerado pelo Manut-Pro`, 50, doc.page.height - 40, { width: pageWidth, align: 'center' });
    doc.end();
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

router.get('/excel', async (req, res) => {
  try {
    const { whereStr, params } = buildQuery(req.query, req.user.role, req.user.id);
    params.push(200);
    const manutencoes = await all(`SELECT * FROM manutencoes m ${whereStr} ORDER BY m.data_hora DESC LIMIT $${params.length}`, params);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Manutenções');
    ws.mergeCells('A1:M1');
    ws.getCell('A1').value = 'RELATÓRIO DE MANUTENÇÕES PREDIAIS';
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    const headers = ['Nº OS', 'Início', 'Término', 'Local', 'Tipo', 'Descrição', 'Técnico', 'Status', 'Prioridade', 'Custo (R$)', 'Tempo (h)', 'Observações'];
    const hr = ws.addRow(headers);
    hr.eachCell(cell => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    ws.getRow(2).height = 20;

    const sMap = { aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluído' };
    const pMap = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
    const tMap = { preventiva: 'Preventiva', corretiva: 'Corretiva', preditiva: 'Preditiva', personalizada: 'Personalizada' };

    manutencoes.forEach((m, idx) => {
      const row = ws.addRow([
        m.numero,
        m.data_hora ? new Date(m.data_hora).toLocaleString('pt-BR') : '-',
        m.data_fim ? new Date(m.data_fim).toLocaleString('pt-BR') : '-',
        m.local, tMap[m.tipo] || m.tipo, m.descricao, m.tecnico_nome,
        sMap[m.status] || m.status, pMap[m.prioridade] || m.prioridade,
        parseFloat(m.custo || 0).toFixed(2), m.tempo_gasto || 0, m.observacoes || ''
      ]);
      if (idx % 2 === 1) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; });
      const sColors = { 'Aberto': 'FFFBBF24', 'Em Andamento': 'FF60A5FA', 'Concluído': 'FF4ADE80' };
      const pColors = { 'Urgente': 'FFEF4444', 'Alta': 'FFFB923C', 'Média': 'FFFBBF24', 'Baixa': 'FF86EFAC' };
      const sc = row.getCell(8); if (sColors[sc.value]) { sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sColors[sc.value] } }; sc.font = { bold: true }; }
      const pc = row.getCell(9); if (pColors[pc.value]) { pc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pColors[pc.value] } }; pc.font = { bold: true }; }
    });
    ws.columns = [{ width: 16 }, { width: 18 }, { width: 18 }, { width: 20 }, { width: 14 }, { width: 40 }, { width: 22 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 30 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="manutencoes-${Date.now()}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/pdf-lista', async (req, res) => {
  try {
    const { whereStr, params } = buildQuery(req.query, req.user.role, req.user.id);
    params.push(200);
    const manutencoes = await all(`SELECT * FROM manutencoes m ${whereStr} ORDER BY m.data_hora DESC LIMIT $${params.length}`, params);
    const empresa = await get('SELECT * FROM empresa LIMIT 1');

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-manutencoes.pdf"`);
    doc.pipe(res);

    const azul = '#1e40af';
    const pageWidth = doc.page.width - 80;
    doc.rect(40, 30, pageWidth, 60).fill(azul);
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text(empresa?.nome || 'Minha Empresa', 50, 40, { align: 'center', width: pageWidth });
    doc.fontSize(10).font('Helvetica').text('RELATÓRIO DE MANUTENÇÕES PREDIAIS', 50, 62, { align: 'center', width: pageWidth });
    doc.fillColor('#334155').fontSize(8).text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 50, 98, { align: 'right', width: pageWidth });

    let y = 112;
    const cols = [{ x: 40, w: 80, label: 'Nº OS' }, { x: 124, w: 70, label: 'Data Início' }, { x: 198, w: 90, label: 'Local' }, { x: 292, w: 70, label: 'Tipo' }, { x: 366, w: 70, label: 'Técnico' }, { x: 440, w: 60, label: 'Status' }, { x: 504, w: 55, label: 'Prioridade' }, { x: 563, w: 55, label: 'Custo' }];
    doc.rect(40, y, pageWidth, 18).fill('#334155');
    cols.forEach(c => doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(c.label, c.x + 3, y + 4, { width: c.w - 4 }));
    y += 18;

    manutencoes.forEach((m, i) => {
      if (y > doc.page.height - 60) { doc.addPage({ layout: 'landscape' }); y = 40; }
      if (i % 2 === 0) doc.rect(40, y, pageWidth, 16).fill('#f8fafc');
      doc.fillColor('#1e293b').fontSize(8).font('Helvetica');
      const row = [m.numero, m.data_hora ? new Date(m.data_hora).toLocaleDateString('pt-BR') : '-', m.local, m.tipo, m.tecnico_nome, labelStatus(m.status), labelPrioridade(m.prioridade), `R$ ${parseFloat(m.custo || 0).toFixed(2)}`];
      cols.forEach((c, ci) => doc.text(String(row[ci] || '-'), c.x + 3, y + 3, { width: c.w - 4 }));
      y += 16;
    });
    doc.fillColor('#94a3b8').fontSize(7).text(`Total: ${manutencoes.length} registros • Manut-Pro`, 40, doc.page.height - 30, { width: pageWidth, align: 'center' });
    doc.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
