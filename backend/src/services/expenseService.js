const db = require('../config/database');

class ExpenseService {

  async getByMonth(ano, mes) {
    const { rows } = await db.query(
      'SELECT * FROM global_infos WHERE ano_data = $1 AND mes_data = $2 ORDER BY user_id ASC',
      [parseInt(ano), parseInt(mes)]
    );
    return rows;
  }

  async delete(id) {
    const { rowCount } = await db.query(
      'DELETE FROM global_infos WHERE user_id = $1',
      [id]
    );
    return rowCount > 0;
  }

  async batchSave({ criar, atualizar, excluir }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const data of criar) {
        const { username, salario, valor_conta, tipo_conta, prestacao,
                ja_pago, pagamento_ate, classificacao_da_conta, ano_data, mes_data } = data;
        await client.query(
          `INSERT INTO global_infos
            (username, salario, valor_conta, tipo_conta, prestacao, ja_pago, pagamento_ate, classificacao_da_conta, ano_data, mes_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [username, salario, valor_conta, tipo_conta, prestacao, ja_pago, pagamento_ate, classificacao_da_conta, ano_data, mes_data]
        );
      }

      for (const data of atualizar) {
        const { username, salario, valor_conta, tipo_conta, prestacao,
                ja_pago, pagamento_ate, classificacao_da_conta, ano_data, mes_data, user_id } = data;
        await client.query(
          `UPDATE global_infos SET
            username = $1, salario = $2, valor_conta = $3, tipo_conta = $4,
            prestacao = $5, ja_pago = $6, pagamento_ate = $7,
            classificacao_da_conta = $8, ano_data = $9, mes_data = $10
           WHERE user_id = $11`,
          [username, salario, valor_conta, tipo_conta, prestacao, ja_pago, pagamento_ate, classificacao_da_conta, ano_data, mes_data, user_id]
        );
      }

      for (const id of excluir) {
        await client.query('DELETE FROM global_infos WHERE user_id = $1', [id]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateSalario(ano, mes, salario) {
    const { rowCount } = await db.query(
      'UPDATE global_infos SET salario = $1 WHERE ano_data = $2 AND mes_data = $3',
      [parseFloat(salario), parseInt(ano), parseInt(mes)]
    );
    return rowCount;
  }

  async updateEmail(ano, mes, email) {
    const { rowCount } = await db.query(
      'UPDATE global_infos SET email = $1 WHERE ano_data = $2 AND mes_data = $3',
      [email, parseInt(ano), parseInt(mes)]
    );
    return rowCount;
  }

}

module.exports = new ExpenseService();
