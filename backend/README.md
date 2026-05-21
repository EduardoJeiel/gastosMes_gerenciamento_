# Backend - Controle de Gastos Mensais

API REST em Node.js + Express + PostgreSQL.

## Como rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env` com suas credenciais do PostgreSQL.

### 3. Criar a tabela no banco
```bash
psql -h localhost -U postgres -d projects_dudu -f ../database/scripts/01-create-table.sql
```

### 4. Inserir dados de exemplo (opcional)
```bash
psql -h localhost -U postgres -d projects_dudu -f ../database/scripts/02-populando-dados.sql
```

### 5. Iniciar o servidor
```bash
npm run dev
```

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/expenses?ano=2026&mes=5` | Lista despesas do mês |
| POST | `/api/expenses/batch` | Cria, atualiza e remove despesas em uma transação |
| PUT | `/api/expenses/salary` | Atualiza salário do mês |
| DELETE | `/api/expenses/:id` | Remove uma despesa |
| GET | `/health` | Status da API |

## Exemplo de corpo para POST /api/expenses/batch

```json
{
  "criar": [
    {
      "username": "user_demo",
      "salario": 5304.00,
      "valor_conta": 100.00,
      "tipo_conta": "NETFLIX",
      "prestacao": "",
      "ja_pago": "NÃO",
      "pagamento_ate": "NÃO",
      "classificacao_da_conta": "MORADIA",
      "ano_data": 2026,
      "mes_data": 5
    }
  ],
  "atualizar": [
    {
      "user_id": 3,
      "username": "user_demo",
      "salario": 5304.00,
      "valor_conta": 218.00,
      "tipo_conta": "LUZ",
      "prestacao": "",
      "ja_pago": "SIM",
      "pagamento_ate": "SIM",
      "classificacao_da_conta": "MORADIA",
      "ano_data": 2026,
      "mes_data": 5
    }
  ],
  "excluir": [7, 12]
}
```
