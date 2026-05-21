import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './ControleGastosMensais.css';

const API = process.env.REACT_APP_API_URL;
const DEFAULT_USERNAME = 'user_demo';

const CATEGORY_COLORS = {
  MORADIA:     '#6366f1',
  ALIMENTAÇÃO: '#f59e0b',
  TRANSPORTE:  '#3b82f6',
  SAÚDE:       '#10b981',
  ANIMAIS:     '#8b5cf6',
  IGREJA:      '#ec4899',
  IMPREVISTO:  '#ef4444',
  Sobra:       '#d1d5db',
};

const _ano  = new Date().getFullYear();
const _mes  = String(new Date().getMonth() + 1).padStart(2, '0');
const ANOS  = Array.from({ length: 5 }, (_, i) => String(_ano - 1 + i));
const MESES = [
  { value: '01', label: 'Janeiro'   }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março'     }, { value: '04', label: 'Abril'     },
  { value: '05', label: 'Maio'      }, { value: '06', label: 'Junho'     },
  { value: '07', label: 'Julho'     }, { value: '08', label: 'Agosto'    },
  { value: '09', label: 'Setembro'  }, { value: '10', label: 'Outubro'   },
  { value: '11', label: 'Novembro'  }, { value: '12', label: 'Dezembro'  },
];

export default function ControleGastosMensais() {
  const [anoSelecionado, setAnoSelecionado] = useState(String(_ano));
  const [mesSelecionado, setMesSelecionado] = useState(_mes);
  const [dados, setDados]                   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [salvando, setSalvando]             = useState(false);
  const [modoEdicao, setModoEdicao]         = useState(false);
  const [dadosEditados, setDadosEditados]   = useState([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [salarios, setSalarios]             = useState(['']);
  const [salarioSujo, setSalarioSujo]       = useState(false);
  const [emailRelatorio, setEmailRelatorio] = useState('');
  const [enviandoEmail, setEnviandoEmail]   = useState(false);
  const [emailStatus, setEmailStatus]       = useState(null); // 'ok' | 'erro' | null
  const mesNome = MESES.find(m => m.value === mesSelecionado)?.label || '';

  const buscarDados = useCallback(async () => {
    setModoEdicao(false);
    setDadosEditados([]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/expenses?ano=${anoSelecionado}&mes=${parseInt(mesSelecionado)}`);
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const result = await res.json();
      if (result.success) {
        setDados(result.data);
        const sal = result.data.length > 0 ? String(result.data[0].salario || '') : '';
        setSalarios([sal]);
        setSalarioSujo(false);
        const emailSalvo = result.data.length > 0 ? (result.data[0].email || '') : '';
        setEmailRelatorio(emailSalvo);
        setEmailStatus(null);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setDados([]);
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado, mesSelecionado]);

  useEffect(() => { buscarDados(); }, [buscarDados]);

  // --- Salário ---

  const salarioTotal = salarios.reduce((a, s) => a + parseFloat(s || 0), 0);

  const salvarSalario = async () => {
    setSalvando(true);
    try {
      const res = await fetch(`${API}/expenses/salary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano: anoSelecionado, mes: parseInt(mesSelecionado), salario: salarioTotal }),
      });
      if (!res.ok) throw new Error('Erro ao salvar salário');
      setSalarioSujo(false);
      await buscarDados();
    } catch (err) {
      setError(err.message);
    } finally {
      setSalvando(false);
    }
  };

  // --- Edição ---

  const entrarEdicao = () => {
    setDadosEditados(dados.map(d => ({ ...d })));
    setModoEdicao(true);
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setDadosEditados([]);
  };

  const adicionarLinha = () => {
    setDadosEditados(prev => [...prev, {
      _isNew: true,
      user_id: null,
      username: dados[0]?.username ?? DEFAULT_USERNAME,
      salario: salarioTotal,
      valor_conta: '',
      tipo_conta: '',
      prestacao: '',
      ja_pago: 'NÃO',
      pagamento_ate: 'NÃO',
      classificacao_da_conta: 'MORADIA',
      ano_data: parseInt(anoSelecionado),
      mes_data: parseInt(mesSelecionado),
    }]);
  };

  const atualizarCampo = (index, campo, valor) => {
    setDadosEditados(prev =>
      prev.map((item, i) => i === index ? { ...item, [campo]: valor } : item)
    );
  };

  const removerLinha = (index) => {
    setDadosEditados(prev => prev.filter((_, i) => i !== index));
  };

  const salvar = async () => {
    setSalvando(true);
    setError(null);
    try {
      const criar = dadosEditados
        .filter(d => d._isNew)
        .map(({ _isNew, user_id, ...body }) => body);

      const atualizar = dadosEditados.filter(d => !d._isNew);

      const idsEditados = atualizar.map(d => d.user_id);
      const excluir = dados
        .filter(d => !idsEditados.includes(d.user_id))
        .map(d => d.user_id);

      const res = await fetch(`${API}/expenses/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criar, atualizar, excluir }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Erro ao salvar despesas');
      }
      setModoEdicao(false);
      setDadosEditados([]);
      await buscarDados();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSalvando(false);
    }
  };

  // --- Cálculos ---

  const fonte = modoEdicao ? dadosEditados : dados;
  const total         = fonte.reduce((acc, item) => acc + parseFloat(item.valor_conta || 0), 0);
  const totalPago     = fonte.filter(e => e.ja_pago === 'SIM').reduce((acc, item) => acc + parseFloat(item.valor_conta || 0), 0);
  const totalRestante = total - totalPago;
  const sobra         = salarioTotal - total;

  // --- Dados do gráfico ---

  const byCategory = fonte.reduce((acc, item) => {
    const cat = item.classificacao_da_conta || 'Outros';
    acc[cat] = (acc[cat] || 0) + parseFloat(item.valor_conta || 0);
    return acc;
  }, {});

  const chartData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
    pct: salarioTotal > 0 ? ((value / salarioTotal) * 100).toFixed(1) : '0',
  }));

  if (salarioTotal > 0 && sobra > 0) {
    chartData.push({
      name: 'Sobra',
      value: parseFloat(sobra.toFixed(2)),
      pct: ((sobra / salarioTotal) * 100).toFixed(1),
    });
  }

  const enviarRelatorio = async () => {
    setEnviandoEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch(`${API}/expenses/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRelatorio, ano: anoSelecionado, mes: parseInt(mesSelecionado) }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Erro ao enviar');
      }
      setEmailStatus('ok');
      setEmailRelatorio('');
    } catch (err) {
      console.error(err);
      setEmailStatus('erro');
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="page">
      <div className="container">

        <div className="header">
          <div className="headerTop">
            <h1 className="title">Controle de Gastos Mensais</h1>
            <button
              className="hamburger"
              onClick={() => setFiltrosAbertos(a => !a)}
              aria-label="Abrir filtros"
            >
              <span /><span /><span />
            </button>
          </div>
          <div className={`filters${filtrosAbertos ? ' filtersOpen' : ''}`}>
            <div className="filterGroup">
              <label className="label">Ano</label>
              <select className="select" value={anoSelecionado} onChange={e => setAnoSelecionado(e.target.value)}>
                {ANOS.map(ano => <option key={ano} value={ano}>{ano}</option>)}
              </select>
            </div>
            <div className="filterGroup">
              <label className="label">Mês</label>
              <select className="select" value={mesSelecionado} onChange={e => setMesSelecionado(e.target.value)}>
                {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="filterGroup">
              <label className="label">Salário</label>
              <div className="salarioInputs">
                {salarios.map((sal, i) => (
                  <div key={i} className="salarioRow">
                    <input
                      className="input salarioInput"
                      type="number"
                      placeholder="0.00"
                      value={sal}
                      onChange={e => {
                        const next = [...salarios];
                        next[i] = e.target.value;
                        setSalarios(next);
                        setSalarioSujo(true);
                      }}
                    />
                    {i === 0 && salarios.length < 2 && (
                      <button className="btnSalarioAdd" onClick={() => setSalarios(prev => [...prev, ''])}>+</button>
                    )}
                    {i > 0 && (
                      <button className="btnSalarioRemover" onClick={() => {
                        setSalarios(prev => prev.filter((_, j) => j !== i));
                        setSalarioSujo(true);
                      }}>×</button>
                    )}
                  </div>
                ))}
                {salarioSujo && dados.length > 0 && (
                  <button className="btnSalvarSalario" onClick={salvarSalario} disabled={salvando}>
                    Salvar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="errorBox">Erro: {error}</div>}

        <div className="card">
          <div className="cardHeader">
            <span className="cardTitle">Despesas — {mesNome} {anoSelecionado}</span>
            <div className="cardActions">
              {modoEdicao
                ? <button onClick={adicionarLinha} className="btnOutline">Adicionar</button>
                : <button onClick={entrarEdicao}   className="btnOutline">Editar</button>
              }
              <span className="count">{fonte.length} registros</span>
            </div>
          </div>

          <div className="tableWrapper">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Valor</th>
                  <th>Tipo de conta</th>
                  <th>Prestações</th>
                  <th>Pago</th>
                  <th>Vence dia 10</th>
                  <th>Classificação</th>
                  {modoEdicao && <th />}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="emptyRow">
                    <td colSpan={modoEdicao ? 7 : 6} className="emptyCell">Carregando...</td>
                  </tr>
                ) : fonte.length === 0 ? (
                  <tr className="emptyRow">
                    <td colSpan={modoEdicao ? 7 : 6} className="emptyCell">
                      Nenhuma despesa encontrada para {mesNome}/{anoSelecionado}
                    </td>
                  </tr>
                ) : (
                  fonte.map((item, index) => (
                    <tr key={item.user_id ?? `new-${index}`}>
                      <td data-label="Valor">
                        {modoEdicao
                          ? <input className="input" type="number" value={item.valor_conta}
                              onChange={e => atualizarCampo(index, 'valor_conta', e.target.value)} />
                          : `R$ ${parseFloat(item.valor_conta).toFixed(2)}`
                        }
                      </td>
                      <td data-label="Tipo de conta" className="tdBold">
                        {modoEdicao
                          ? <input className="input" type="text" value={item.tipo_conta}
                              onChange={e => atualizarCampo(index, 'tipo_conta', e.target.value)} />
                          : item.tipo_conta
                        }
                      </td>
                      <td data-label="Prestações" className="tdMuted">
                        {modoEdicao
                          ? <input className="inputSmall" type="text" value={item.prestacao}
                              onChange={e => atualizarCampo(index, 'prestacao', e.target.value)} />
                          : item.prestacao || '—'
                        }
                      </td>
                      <td data-label="Pago">
                        {modoEdicao
                          ? <select className="selectSmall" value={item.ja_pago}
                              onChange={e => atualizarCampo(index, 'ja_pago', e.target.value)}>
                              <option>SIM</option>
                              <option>NÃO</option>
                            </select>
                          : <span className="badge" style={{
                              color: item.ja_pago === 'SIM' ? '#15803d' : '#71717a',
                              background: item.ja_pago === 'SIM' ? '#f0fdf4' : '#f4f4f5',
                            }}>
                              {item.ja_pago}
                            </span>
                        }
                      </td>
                      <td data-label="Vence dia 10">
                        {modoEdicao
                          ? <select className="selectSmall" value={item.pagamento_ate}
                              onChange={e => atualizarCampo(index, 'pagamento_ate', e.target.value)}>
                              <option>SIM</option>
                              <option>NÃO</option>
                            </select>
                          : <span className="badge" style={{
                              color: item.pagamento_ate === 'SIM' ? '#b91c1c' : '#71717a',
                              background: item.pagamento_ate === 'SIM' ? '#fef2f2' : '#f4f4f5',
                            }}>
                              {item.pagamento_ate || '—'}
                            </span>
                        }
                      </td>
                      <td data-label="Classificação">
                        {modoEdicao
                          ? <select className="selectSmall" value={item.classificacao_da_conta || ''}
                              onChange={e => atualizarCampo(index, 'classificacao_da_conta', e.target.value)}>
                              <option value="MORADIA">MORADIA</option>
                              <option value="ALIMENTAÇÃO">ALIMENTAÇÃO</option>
                              <option value="TRANSPORTE">TRANSPORTE</option>
                              <option value="SAÚDE">SAÚDE</option>
                              <option value="ANIMAIS">ANIMAIS</option>
                              <option value="IGREJA">IGREJA</option>
                              <option value="IMPREVISTO">IMPREVISTO</option>
                            </select>
                          : <span className="badge" style={{ background: '#f4f4f5', color: '#3f3f46' }}>
                              {item.classificacao_da_conta || '—'}
                            </span>
                        }
                      </td>
                      {modoEdicao && (
                        <td data-label="">
                          <button className="btnRemover" onClick={() => removerLinha(index)}>&times;</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="summary">
            {[
              ['Salário',          salarioTotal,  ''                          ],
              ['Total do mês',     total,         ''                          ],
              ['Já pago',          totalPago,     'green'                     ],
              ['Restante a pagar', totalRestante, ''                          ],
              ['Sobra do salário', sobra,         sobra >= 0 ? 'green' : 'red'],
            ].map(([label, value, cls]) => (
              <div key={label} className="summaryItem">
                <span className="summaryLabel">{label}</span>
                <span className={`summaryValue ${cls}`}>R$ {value.toFixed(2)}</span>
              </div>
            ))}
            {modoEdicao && (
              <div className="summaryActions">
                <button className="btnCancelar" onClick={cancelarEdicao} disabled={salvando}>
                  Cancelar
                </button>
                <button className="btnSalvar" onClick={salvar} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {fonte.length > 0 && salarioTotal > 0 && (
          <div className="chartsSection">
            <span className="chartTitle">Distribuição por classificação</span>
            <div className="chartLayout">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx={105}
                    cy={105}
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#a1a1aa'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [`R$ ${Number(v).toFixed(2)}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chartLegend">
                {chartData.map((entry, i) => (
                  <div key={i} className="legendItem">
                    <span className="legendDot" style={{ background: CATEGORY_COLORS[entry.name] || '#a1a1aa' }} />
                    <span className="legendName">{entry.name}</span>
                    <span className="legendPct">{entry.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {dados.length > 0 && (
          <div className="emailSection">
            <span className="emailSectionTitle">Enviar relatório por e-mail</span>
            <div className="emailBar">
              <input
                className="emailInput"
                type="email"
                placeholder="Digite o e-mail para receber o relatório (.xlsx)"
                value={emailRelatorio}
                onChange={e => { setEmailRelatorio(e.target.value); setEmailStatus(null); }}
                disabled={enviandoEmail}
              />
              <button
                className="btnEnviar"
                onClick={enviarRelatorio}
                disabled={enviandoEmail || !emailRelatorio.trim()}
              >
                {enviandoEmail ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
            {emailStatus === 'ok' && (
              <p className="emailMsg emailMsgOk">Relatório enviado com sucesso!</p>
            )}
            {emailStatus === 'erro' && (
              <p className="emailMsg emailMsgErro">Erro ao enviar. Verifique o e-mail e tente novamente.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
