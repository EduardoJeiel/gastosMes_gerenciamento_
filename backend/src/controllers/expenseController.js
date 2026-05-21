const expenseService = require('../services/expenseService');
const { successResponse, errorResponse } = require('../utils/response');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

async function buildXlsx(expenses, ano, mes) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Eduardo - Envio de Relatórios';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Despesas');

  const mesNome = MONTH_NAMES[parseInt(mes)] || mes;

  // Title
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Relatório de ${mesNome}/${ano}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Header
  const headerRow = sheet.addRow([
    'Tipo de Conta', 'Valor (R$)', 'Prestações', 'Pago', 'Vence dia 10', 'Classificação',
  ]);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
    cell.alignment = { horizontal: 'center' };
  });

  sheet.columns = [
    { key: 'tipo_conta',              width: 28 },
    { key: 'valor_conta',             width: 16 },
    { key: 'prestacao',               width: 14 },
    { key: 'ja_pago',                 width: 10 },
    { key: 'pagamento_ate',           width: 14 },
    { key: 'classificacao_da_conta',  width: 20 },
  ];

  let salario = 0;
  let total = 0;
  let totalPago = 0;

  expenses.forEach((e, idx) => {
    const valor = parseFloat(e.valor_conta || 0);
    total += valor;
    if (e.ja_pago === 'SIM') totalPago += valor;
    if (idx === 0) salario = parseFloat(e.salario || 0);

    const row = sheet.addRow([
      e.tipo_conta,
      valor,
      e.prestacao || '—',
      e.ja_pago,
      e.pagamento_ate || '—',
      e.classificacao_da_conta || '—',
    ]);

    row.getCell(2).numFmt = 'R$ #,##0.00';
    if (e.ja_pago === 'SIM') {
      row.getCell(4).font = { color: { argb: 'FF15803D' } };
    }
    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F4F5' } };
      });
    }
  });

  // Summary
  sheet.addRow([]);
  const addSummary = (label, value, colorArgb) => {
    const r = sheet.addRow([label, value]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).numFmt = 'R$ #,##0.00';
    if (colorArgb) r.getCell(2).font = { bold: true, color: { argb: colorArgb } };
    else r.getCell(2).font = { bold: true };
  };

  const sobra = salario - total;
  addSummary('Salário', salario);
  addSummary('Total do mês', total);
  addSummary('Já pago', totalPago, 'FF15803D');
  addSummary('Restante a pagar', total - totalPago);
  addSummary('Sobra do salário', sobra, sobra >= 0 ? 'FF15803D' : 'FFB91C1C');

  return workbook.xlsx.writeBuffer();
}

function validateExpense(data) {
  const { valor_conta, tipo_conta, salario, ano_data, mes_data } = data;
  if (!tipo_conta || String(tipo_conta).trim() === '')
    return 'tipo_conta é obrigatório';
  if (isNaN(parseFloat(valor_conta)) || parseFloat(valor_conta) <= 0)
    return 'valor_conta deve ser um número positivo';
  if (salario !== undefined && (isNaN(parseFloat(salario)) || parseFloat(salario) < 0))
    return 'salario deve ser um número não negativo';
  if (!Number.isInteger(Number(ano_data)) || Number(ano_data) < 2000 || Number(ano_data) > 2099)
    return 'ano_data inválido';
  if (!Number.isInteger(Number(mes_data)) || Number(mes_data) < 1 || Number(mes_data) > 12)
    return 'mes_data inválido';
  return null;
}

class ExpenseController {
  
  // GET /api/expenses?ano=2026&mes=5
  async getExpensesByMonth(req, res) {
    try {
      const { ano, mes } = req.query;
      
      if (!ano || !mes) {
        return errorResponse(res, 'Ano e mês são obrigatórios', 400);
      }

      const expenses = await expenseService.getByMonth(ano, mes);
      return successResponse(res, expenses);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      return errorResponse(res, 'Erro ao buscar despesas', 500);
    }
  }

  // POST /api/expenses/batch
  async batchSave(req, res) {
    try {
      const { criar = [], atualizar = [], excluir = [] } = req.body;

      for (const item of criar) {
        const err = validateExpense(item);
        if (err) return errorResponse(res, err, 400);
      }
      for (const item of atualizar) {
        const err = validateExpense(item);
        if (err) return errorResponse(res, err, 400);
      }

      await expenseService.batchSave({ criar, atualizar, excluir });
      return successResponse(res, { ok: true });
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
      return errorResponse(res, 'Erro ao salvar despesas', 500);
    }
  }

  // DELETE /api/expenses/:id
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      const deleted = await expenseService.delete(id);
      
      if (!deleted) {
        return errorResponse(res, 'Despesa não encontrada', 404);
      }
      
      return successResponse(res, { message: 'Despesa excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      return errorResponse(res, 'Erro ao excluir despesa', 500);
    }
  }

  // POST /api/expenses/send-report
  async sendReport(req, res) {
    try {
      const { email, ano, mes } = req.body;

      if (!email || !ano || !mes) {
        return errorResponse(res, 'email, ano e mes são obrigatórios', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, 'E-mail inválido', 400);
      }

      const expenses = await expenseService.getByMonth(ano, mes);
      if (expenses.length === 0) {
        return errorResponse(res, 'Nenhuma despesa encontrada para o período', 404);
      }

      const xlsxBuffer = await buildXlsx(expenses, ano, mes);
      const mesNome = MONTH_NAMES[parseInt(mes)] || mes;
      const filename = `gastos_${mesNome.toLowerCase()}_${ano}.xlsx`;

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Relatório de Gastos — ${mesNome}/${ano}`,
        html: `
          <p>Olá!</p>
          <p>Segue em anexo o relatório de gastos de <strong>${mesNome}/${ano}</strong>.</p>
          <p>Gerado automaticamente pelo <em>Controle de Gastos Mensais</em>.</p>
        `,
        attachments: [{ filename, content: xlsxBuffer }],
      });

      expenseService.updateEmail(ano, mes, email).catch(err =>
        console.warn('Aviso: não foi possível salvar o e-mail no banco:', err.message)
      );

      return successResponse(res, { ok: true });
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      return errorResponse(res, 'Erro ao enviar relatório por e-mail', 500);
    }
  }

  // PUT /api/expenses/salary
  async updateSalary(req, res) {
    try {
      const { ano, mes, salario } = req.body;
      if (!ano || !mes || salario === undefined) {
        return errorResponse(res, 'Parâmetros obrigatórios: ano, mes, salario', 400);
      }
      const rowCount = await expenseService.updateSalario(ano, mes, salario);
      return successResponse(res, { rowCount });
    } catch (error) {
      console.error('Erro ao atualizar salário:', error);
      return errorResponse(res, 'Erro ao atualizar salário', 500);
    }
  }

}

module.exports = new ExpenseController();