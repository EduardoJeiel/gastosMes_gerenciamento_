# Controle de Gastos Mensais

Aplicação fullstack para controle de despesas mensais com visualização gráfica, edição inline e envio de relatório em `.xlsx` por e-mail.

## Funcionalidades

- Cadastro e edição de despesas por mês/ano
- Controle de salário e cálculo automático de sobra
- Filtros por mês e ano
- Gráfico de distribuição por classificação (pizza/donut)
- Marcação de contas pagas e contas com vencimento no dia 10
- Envio de relatório `.xlsx` por e-mail diretamente pela interface

## Tecnologias

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 18, Recharts |
| Backend | Node.js, Express 4 |
| Banco de dados | PostgreSQL |
| E-mail | Nodemailer (SMTP) |
| Relatório | ExcelJS (.xlsx) |

## Estrutura do projeto

```
├── backend/
│   ├── src/
│   │   ├── app.js                  # Entrada do servidor Express
│   │   ├── config/database.js      # Pool de conexão PostgreSQL
│   │   ├── controllers/
│   │   │   └── expenseController.js
│   │   ├── routes/
│   │   │   └── expenseRoutes.js
│   │   ├── services/
│   │   │   └── expenseService.js
│   │   └── utils/response.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       ├── ControleGastosMensais.jsx
│   │       └── ControleGastosMensais.css
│   ├── .env.example
│   └── package.json
└── database/
    └── scripts/
        ├── 01-create-table.sql
        ├── 02-populando-dados.sql
        └── 03-update-tabela.sql
```

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente
- Conta Gmail com [Senha de App](https://myaccount.google.com/apppasswords) gerada (para envio de e-mail)

### 1. Banco de dados

```bash
psql -h localhost -U postgres -d projects_dudu -f database/scripts/01-create-table.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
NODE_ENV=development
PORT=5000

DB_HOST=db_host_aqui
DB_PORT=db_port_aqui
DB_NAME=db_name_aqui
DB_USER=db_user_aqui
DB_PASSWORD=db_senha_aqui

FRONTEND_URL=http://localhost:3000

# Conta Gmail que envia os relatórios (use Senha de App, não a senha normal)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Controle de Gastos <seu_email@gmail.com>
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # REACT_APP_API_URL=http://localhost:5000/api
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

## API — Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/expenses?ano=&mes=` | Busca despesas do mês/ano |
| POST | `/api/expenses/batch` | Cria, atualiza e exclui despesas em lote |
| PUT | `/api/expenses/salary` | Atualiza o salário do mês |
| POST | `/api/expenses/send-report` | Gera `.xlsx` e envia por e-mail |
| DELETE | `/api/expenses/:id` | Remove uma despesa |
| GET | `/health` | Health check do servidor |

## Envio de relatório por e-mail

Na interface, abaixo do gráfico, existe um campo para digitar qualquer e-mail e clicar em **Enviar**. O backend gera um arquivo `.xlsx` com todas as despesas do mês selecionado (incluindo resumo de salário, total, já pago e sobra) e envia como anexo para o endereço informado.

O e-mail digitado é salvo no banco de dados e fica pré-preenchido nas próximas visitas.

## Banco de dados — Tabela principal

```sql
CREATE TABLE global_infos (
    user_id    SERIAL PRIMARY KEY,
    username   TEXT,
    salario    DECIMAL(10, 2),
    valor_conta DECIMAL(10, 2),
    tipo_conta  VARCHAR(30),
    prestacao   VARCHAR(15),
    ja_pago     TEXT,                   -- 'SIM' ou 'NÃO'
    pagamento_ate VARCHAR(10),          -- 'SIM' ou 'NÃO'
    classificacao_da_conta TEXT,
    email       TEXT,
    criado_em   DATE DEFAULT CURRENT_DATE,
    ano_data    SMALLINT NOT NULL,
    mes_data    SMALLINT NOT NULL
);
```

## Testar conexão com o banco

```bash
cd database
npm install
npm run test-connection
```
