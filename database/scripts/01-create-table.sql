DROP TABLE IF EXISTS global_infos;

CREATE TABLE global_infos (
    user_id SERIAL PRIMARY KEY,
    username TEXT,
    salario DECIMAL(10, 2),
    valor_conta DECIMAL(10, 2),
    tipo_conta VARCHAR(30),
    prestacao VARCHAR(15),
    ja_pago TEXT,
    pagamento_ate VARCHAR(10),
    classificacao_da_conta TEXT,
    criado_em DATE DEFAULT CURRENT_DATE,
    ano_data SMALLINT NOT NULL,
    mes_data SMALLINT NOT NULL,
    CONSTRAINT chk_mes_valido CHECK (mes_data BETWEEN 1 AND 12),
    CONSTRAINT chk_ano_valido CHECK (ano_data BETWEEN 2000 AND 2099)
);

CREATE INDEX idx_ano_mes ON global_infos(ano_data, mes_data);
CREATE INDEX idx_tipo_conta ON global_infos(tipo_conta);
CREATE INDEX idx_ja_pago ON global_infos(ja_pago);