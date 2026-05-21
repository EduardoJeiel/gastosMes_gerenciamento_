const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testConnection() {
  try {
    console.log('Tentando conexão com o postgreSQL');
    await client.connect();
    console.log('Conexão com sucesso');

    const result = await client.query('SELECT NOW()');
    console.log('Horario:', result.rows[0].now);

    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'global_infos'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('Tabela existe!');
      const count = await client.query('SELECT COUNT(*) FROM global_infos');
      console.log(`Total de registros: ${count.rows[0].count}`);
    } else {
      console.log('Tabela não existe ainda');
    }

    await client.end();
    console.log('Teste concluído!');
  } catch (error) {
    console.error('Erro na conexão:', error.message);
    process.exit(1);
  }
}

testConnection();
