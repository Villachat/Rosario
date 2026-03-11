'use strict';

// ========================================================
// STATE
// ========================================================
const state = {
  vestAnswers: { q2: null, q6: null },
  portfolio: [
    { ticker: 'GOOGL', company: 'Alphabet Inc. - Class A', buyPrice: 0, shares: 0, currentPrice: 329.77, change: 0.73, changePct: 0.22 },
    { ticker: 'AAPL', company: 'Apple, Inc.', buyPrice: 0, shares: 0, currentPrice: 0.98, change: 0.00, changePct: 0.37 },
    { ticker: 'NVDA', company: 'NVIDIA Corporation', buyPrice: 0, shares: 0, currentPrice: 21.53, change: 0.25, changePct: 1.16 },
    { ticker: 'TSLA', company: 'Tesla, Inc.', buyPrice: 0, shares: 0, currentPrice: 31.02, change: 0.04, changePct: 0.14 },
  ],
  vestScore: 0,
};

// ========================================================
// NAVIGATION
// ========================================================
const sectionTitles = {
  dashboard: 'Dashboard',
  portfolio: 'Mi Cartera',
  'vest-analysis': 'Análisis Vest',
  copilot: 'Copiloto Financiero',
  calculator: 'Calculadoras',
  education: 'Educación Financiera',
};

function navigateTo(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));

  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');

  const navLink = document.querySelector(`[data-section="${sectionId}"]`);
  if (navLink) navLink.classList.add('active');

  document.getElementById('pageTitle').textContent = sectionTitles[sectionId] || sectionId;

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.querySelector('.overlay')?.classList.remove('active');

  window.scrollTo(0, 0);
}

// Setup nav links
document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const section = link.dataset.section;
    navigateTo(section);
  });
});

// Mobile menu
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  overlay.classList.toggle('active');
});

// Create overlay
const overlay = document.createElement('div');
overlay.className = 'overlay';
overlay.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  overlay.classList.remove('active');
});
document.body.appendChild(overlay);

// Set date
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', {
  day: 'numeric', month: 'short', year: 'numeric'
});

// ========================================================
// PORTFOLIO
// ========================================================
function renderPortfolioTable() {
  const tbody = document.getElementById('portfolioTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.portfolio.forEach((stock, i) => {
    const value = stock.currentPrice * Math.max(stock.shares, 1);
    const pl = stock.buyPrice > 0
      ? ((stock.currentPrice - stock.buyPrice) * stock.shares)
      : null;
    const plPct = stock.buyPrice > 0
      ? (((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100)
      : null;

    const plHtml = pl !== null
      ? `<span class="${pl >= 0 ? 'positive' : 'negative'}">${pl >= 0 ? '+' : ''}$${pl.toFixed(2)} (${plPct.toFixed(2)}%)</span>`
      : '<span class="text-muted">—</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${stock.ticker}</strong></td>
      <td>${stock.company}</td>
      <td>$${stock.currentPrice.toFixed(2)}</td>
      <td class="positive">+$${stock.change.toFixed(2)} (${stock.changePct.toFixed(2)}%)</td>
      <td>$${value.toFixed(2)}</td>
      <td>${stock.buyPrice > 0 ? '$' + stock.buyPrice.toFixed(2) : '—'}</td>
      <td>${plHtml}</td>
      <td><button class="delete-btn" onclick="deleteStock(${i})">✕ Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteStock(index) {
  if (confirm(`¿Eliminar ${state.portfolio[index].ticker} de tu cartera?`)) {
    state.portfolio.splice(index, 1);
    renderPortfolioTable();
    renderDashboardHoldings();
  }
}

function openAddStockModal() {
  document.getElementById('addStockModal').classList.add('active');
}

function closeAddStockModal() {
  document.getElementById('addStockModal').classList.remove('active');
  ['newTicker', 'newCompany', 'newBuyPrice', 'newShares', 'newCurrentPrice'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

function addStock() {
  const ticker = document.getElementById('newTicker').value.trim().toUpperCase();
  const company = document.getElementById('newCompany').value.trim();
  const buyPrice = parseFloat(document.getElementById('newBuyPrice').value) || 0;
  const shares = parseFloat(document.getElementById('newShares').value) || 0;
  const currentPrice = parseFloat(document.getElementById('newCurrentPrice').value) || 0;

  if (!ticker || !currentPrice) {
    alert('El ticker y precio actual son obligatorios.');
    return;
  }

  state.portfolio.push({
    ticker, company: company || ticker,
    buyPrice, shares, currentPrice,
    change: 0, changePct: 0
  });

  closeAddStockModal();
  renderPortfolioTable();
  renderDashboardHoldings();
}

function exportPortfolio() {
  const rows = [['Ticker', 'Empresa', 'Precio Actual', 'Precio Compra', 'Acciones', 'Valor', 'P&L']];
  state.portfolio.forEach(s => {
    const value = s.currentPrice * Math.max(s.shares, 1);
    const pl = s.buyPrice > 0 ? ((s.currentPrice - s.buyPrice) * s.shares).toFixed(2) : '—';
    rows.push([s.ticker, s.company, s.currentPrice, s.buyPrice || '—', s.shares || '—', value.toFixed(2), pl]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mi_cartera_vest.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function saveNotes() {
  const notes = document.getElementById('portfolioNotes').value;
  localStorage.setItem('portfolioNotes', notes);
  const btn = document.querySelector('#portfolio .btn-primary');
  const orig = btn.textContent;
  btn.textContent = '✓ Guardado';
  btn.style.background = 'var(--green)';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
}

function renderDashboardHoldings() {
  const list = document.querySelector('.holdings-list');
  if (!list) return;
  const logos = { GOOGL: 'googl', AAPL: 'aapl', NVDA: 'nvda', TSLA: 'tsla' };
  const letters = { GOOGL: 'G', AAPL: 'A', NVDA: 'N', TSLA: 'T' };
  list.innerHTML = state.portfolio.map(s => `
    <div class="holding-item">
      <div class="holding-logo ${logos[s.ticker] || ''}">${letters[s.ticker] || s.ticker[0]}</div>
      <div class="holding-info">
        <span class="holding-name">${s.company}</span>
        <span class="holding-ticker">${s.ticker}</span>
      </div>
      <div class="holding-values">
        <span class="holding-price">$${s.currentPrice.toFixed(2)}</span>
        <span class="holding-change positive">+$${s.change.toFixed(2)} (${s.changePct.toFixed(2)}%)</span>
      </div>
    </div>
  `).join('');
}

// ========================================================
// VEST ANALYSIS SCORING
// ========================================================
function updateVestScore() {
  let score = 0;
  const details = [];

  // Q1: All 3 checkboxes
  const q1a = document.getElementById('q1a').checked;
  const q1b = document.getElementById('q1b').checked;
  const q1c = document.getElementById('q1c').checked;
  const q1Score = [q1a, q1b, q1c].filter(Boolean).length;
  if (q1Score === 3) {
    score++;
    document.getElementById('q1-status').textContent = '✅';
    document.getElementById('q1').className = 'question-card completed';
    details.push({ type: 'good', text: 'Conoces todas las comisiones de Vest.' });
  } else if (q1Score > 0) {
    document.getElementById('q1-status').textContent = '⚠️';
    document.getElementById('q1').className = 'question-card warning-card';
    details.push({ type: 'warn', text: `Comisiones: solo conoces ${q1Score}/3. Revisa el contrato de valores.` });
  } else {
    document.getElementById('q1-status').textContent = '';
    document.getElementById('q1').className = 'question-card';
  }

  // Q2: Option selection
  const q2 = state.vestAnswers.q2;
  if (q2 === 'yes') {
    score++;
    document.getElementById('q2-status').textContent = '✅';
    document.getElementById('q2').className = 'question-card completed';
    details.push({ type: 'good', text: 'Puedes operar directamente en USD. Excelente.' });
  } else if (q2 === 'partial') {
    document.getElementById('q2-status').textContent = '⚠️';
    document.getElementById('q2').className = 'question-card warning-card';
    details.push({ type: 'warn', text: 'Conversión automática de divisa: revisa el coste por tipo de cambio en cada operación.' });
  } else if (q2 === 'no') {
    document.getElementById('q2-status').textContent = '❌';
    document.getElementById('q2').className = 'question-card failed-card';
    details.push({ type: 'bad', text: 'No puedes operar en USD: estás perdiendo dinero en cada conversión automática.' });
  }

  // Q3: Warning checkboxes (INVERTED — if checked = bad)
  const q3a = document.getElementById('q3a').checked;
  const q3b = document.getElementById('q3b').checked;
  const q3c = document.getElementById('q3c').checked;
  const q3Bad = [q3a, q3b, q3c].filter(Boolean).length;
  if (q3Bad === 0 && (q3a !== undefined)) {
    // Only score if user has interacted (we can check if any was checked at any time)
    score++;
    document.getElementById('q3-status').textContent = '✅';
    document.getElementById('q3').className = 'question-card completed';
    details.push({ type: 'good', text: 'Vest no te impone productos estructurados obligatorios. Puedes tomar tus propias decisiones.' });
  } else if (q3Bad > 0) {
    document.getElementById('q3-status').textContent = '⚠️';
    document.getElementById('q3').className = 'question-card warning-card';
    details.push({ type: 'warn', text: `${q3Bad} señal(es) de alerta sobre productos estructurados en Vest. Evalúa si son obligatorios o solo sugerencias.` });
  }

  // Q4: All 3 checkboxes
  const q4a = document.getElementById('q4a').checked;
  const q4b = document.getElementById('q4b').checked;
  const q4c = document.getElementById('q4c').checked;
  const q4Score = [q4a, q4b, q4c].filter(Boolean).length;
  if (q4Score === 3) {
    score++;
    document.getElementById('q4-status').textContent = '✅';
    document.getElementById('q4').className = 'question-card completed';
    details.push({ type: 'good', text: 'Tienes clara la fiscalidad de tus inversiones en Vest.' });
  } else if (q4Score > 0) {
    document.getElementById('q4-status').textContent = '⚠️';
    document.getElementById('q4').className = 'question-card warning-card';
    details.push({ type: 'warn', text: `Fiscalidad: ${q4Score}/3 puntos cubiertos. Asegúrate de declarar correctamente tus ganancias.` });
  } else {
    document.getElementById('q4-status').textContent = '';
    document.getElementById('q4').className = 'question-card';
  }

  // Q5: All 3 checkboxes
  const q5a = document.getElementById('q5a').checked;
  const q5b = document.getElementById('q5b').checked;
  const q5c = document.getElementById('q5c').checked;
  const q5Score = [q5a, q5b, q5c].filter(Boolean).length;
  if (q5Score === 3) {
    score++;
    document.getElementById('q5-status').textContent = '✅';
    document.getElementById('q5').className = 'question-card completed';
    details.push({ type: 'good', text: 'Tienes definidos tus límites de riesgo operativos.' });
  } else if (q5Score > 0) {
    document.getElementById('q5-status').textContent = '⚠️';
    document.getElementById('q5').className = 'question-card warning-card';
    details.push({ type: 'warn', text: `Gestión de riesgo: ${q5Score}/3 puntos. Define tus límites antes de operar más.` });
  } else {
    document.getElementById('q5-status').textContent = '';
    document.getElementById('q5').className = 'question-card';
  }

  // Q6: Option selection
  const q6 = state.vestAnswers.q6;
  if (q6 === 'yes') {
    score++;
    document.getElementById('q6-status').textContent = '✅';
    document.getElementById('q6').className = 'question-card completed';
    details.push({ type: 'good', text: 'Vest realizó una evaluación de idoneidad. Esto indica que está regulado correctamente.' });
  } else if (q6 === 'partial') {
    document.getElementById('q6-status').textContent = '⚠️';
    document.getElementById('q6').className = 'question-card warning-card';
    details.push({ type: 'warn', text: 'Evaluación insuficiente: Vest debería hacer un test MiFID o equivalente completo.' });
  } else if (q6 === 'no') {
    document.getElementById('q6-status').textContent = '❌';
    document.getElementById('q6').className = 'question-card failed-card';
    details.push({ type: 'bad', text: 'Sin evaluación financiera: esto puede indicar falta de regulación adecuada. Investiga si Vest está regulado en tu país.' });
  }

  // Update score display
  state.vestScore = score;
  document.getElementById('vestScoreNumber').textContent = `${score}/6`;
  document.getElementById('vestScoreDash').textContent = `${score}/6`;

  const pct = Math.round((score / 6) * 100);
  document.getElementById('vestProgressBar').style.width = `${pct}%`;

  let progressMsg = '';
  if (pct === 0) progressMsg = 'Responde las preguntas para evaluar Vest';
  else if (pct < 50) progressMsg = 'Análisis en curso — hay aspectos importantes a revisar';
  else if (pct < 84) progressMsg = 'Buen progreso — revisa los puntos pendientes';
  else progressMsg = '¡Excelente! Vest cumple los criterios fundamentales';
  document.getElementById('vestProgressText').textContent = progressMsg;

  // Score circle color
  const circle = document.getElementById('vestScoreCircle');
  let color = score <= 2 ? '#ff5f73' : score <= 4 ? '#fbbf24' : '#4cde87';
  circle.style.borderColor = color;
  document.getElementById('vestScoreNumber').style.color = color;

  // Score summary
  const summaryEl = document.getElementById('vestScoreSummary');
  const recsEl = document.getElementById('vestRecommendations');

  if (details.length > 0) {
    summaryEl.innerHTML = `
      <p style="margin-bottom:12px;color:var(--text-secondary);font-size:14px;">
        Puntuación: <strong style="color:${color}">${score}/6 (${pct}%)</strong> —
        ${pct >= 84 ? 'Vest cumple los criterios fundamentales de un broker confiable.' :
          pct >= 50 ? 'Vest cumple parcialmente. Hay aspectos que debes verificar antes de operar más capital.' :
          'Vest presenta señales de alerta importantes. Investiga a fondo antes de invertir más.'}
      </p>
    `;

    recsEl.innerHTML = details.map(d => `
      <div class="rec-item rec-${d.type === 'good' ? 'good' : d.type === 'warn' ? 'warn' : 'bad'}">
        <span>${d.type === 'good' ? '✅' : d.type === 'warn' ? '⚠️' : '❌'}</span>
        <span>${d.text}</span>
      </div>
    `).join('');
  }
}

function selectOption(question, value) {
  // Clear previous selection
  ['yes', 'partial', 'no'].forEach(v => {
    const btn = document.getElementById(`${question}-${v}`);
    if (btn) btn.className = 'option-btn';
  });

  // Set new selection
  const btn = document.getElementById(`${question}-${value}`);
  if (btn) btn.className = `option-btn selected-${value}`;

  state.vestAnswers[question] = value;
  updateVestScore();
}

function updateRangeDisplay(rangeId, displayId) {
  const val = document.getElementById(rangeId).value;
  document.getElementById(displayId).textContent = `${val}%`;
}

function downloadReport() {
  const lines = [
    'INFORME DE ANÁLISIS - BROKER VEST',
    '=' .repeat(40),
    `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
    `Puntuación: ${state.vestScore}/6`,
    '',
    '--- RESULTADOS POR CRITERIO ---',
    '',
    `1. Comisiones: ${document.getElementById('q1-status').textContent || 'No evaluado'}`,
    `   Notas: ${document.getElementById('q1-notes').value || '(sin notas)'}`,
    '',
    `2. Cuenta en USD: ${state.vestAnswers.q2 || 'No evaluado'}`,
    '',
    `3. Productos estructurados: ${document.getElementById('q3-status').textContent || 'No evaluado'}`,
    '',
    `4. Fiscalidad: ${document.getElementById('q4-status').textContent || 'No evaluado'}`,
    '',
    `5. Límites de riesgo: ${document.getElementById('q5-status').textContent || 'No evaluado'}`,
    `   Pérdida máxima aceptable: ${document.getElementById('maxLossDisplay').textContent}`,
    `   Objetivo de ganancia anual: ${document.getElementById('targetReturnDisplay').textContent}`,
    '',
    `6. Evaluación MiFID: ${state.vestAnswers.q6 || 'No evaluado'}`,
    '',
    '--- CARTERA ACTUAL ---',
    '',
    ...state.portfolio.map(s => `${s.ticker}: $${s.currentPrice.toFixed(2)} (+${s.changePct.toFixed(2)}%)`),
    '',
    '--- NOTAS DE INVERSIÓN ---',
    document.getElementById('portfolioNotes').value || '(sin notas)',
    '',
    'Generado por FinCopilot - Mi Copiloto Financiero',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'informe_analisis_vest.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function shareReport() {
  const text = `Mi análisis del broker Vest: ${state.vestScore}/6 puntos en los criterios fundamentales. FinCopilot - Mi Copiloto Financiero.`;
  if (navigator.share) {
    navigator.share({ title: 'Análisis Broker Vest', text });
  } else {
    navigator.clipboard?.writeText(text);
    alert('Texto copiado al portapapeles: ' + text);
  }
}

// ========================================================
// COPILOT / CHAT
// ========================================================
const knowledgeBase = {
  comisiones: {
    keywords: ['comisión', 'comisiones', 'fee', 'fees', 'cobra', 'coste', 'gasto'],
    response: `**Comisiones en Vest**

Las comisiones son uno de los factores más importantes al invertir. Con Vest, debes verificar:

- **Comisión por operación**: precio por cada compra o venta de acciones.
- **Comisión del bróker corresponsal**: si inviertes en mercados americanos (NASDAQ, NYSE), puede existir una comisión adicional de la entidad que ejecuta la orden en EEUU.
- **Comisión de custodia**: cargo periódico por mantener tus acciones en custodia.

**Impacto real**: Si tienes $383 en cartera (como en tu screenshot) y pagas $5 por operación, esa comisión ya representa el 1.3% de tu inversión total. Necesitas que la acción suba ese porcentaje solo para cubrir costes.

**Consejo**: Solicita a Vest el "contrato de valores" o tabla de tarifas completa antes de operar más.`
  },
  divisa: {
    keywords: ['dólar', 'dolares', 'usd', 'divisa', 'cambio', 'moneda', 'euro', 'tipo de cambio'],
    response: `**Operar en USD vs Moneda Local**

Este es uno de los puntos más críticos al invertir en bolsa americana con un broker como Vest.

**Problema**: Si cada vez que compras o vendes acciones americanas, Vest convierte automáticamente a tu moneda local, pagas el "spread" de cambio de divisa en cada operación.

**Ejemplo**: Con un spread del 0.5% en tipo de cambio, en 10 operaciones has perdido un 5% extra solo en conversiones de divisa.

**Lo ideal**: Tu broker debe permitirte mantener un "pool de inversión" en dólares. Tú compras y vendes en USD, y solo conviertes a tu moneda local cuando el tipo de cambio te favorece.

**Acción**: Pregunta directamente a Vest si puedes mantener saldo en USD sin conversión automática.`
  },
  tsla: {
    keywords: ['tsla', 'tesla'],
    response: `**Análisis Tesla (TSLA)**

Tu posición actual en TSLA: **$31.02** (+$0.04, +0.14% hoy).

**Consideraciones de riesgo**:
- Tesla es una de las acciones más volátiles del mercado. Su precio puede moverse un 10-15% en un solo día.
- Depende en gran medida de las declaraciones y acciones de Elon Musk.
- Factores clave: entregas de vehículos trimestrales, márgenes de beneficio, competencia en EVs.

**Para tu cartera**: Con $31.02 de valor, TSLA representa aproximadamente el 8% de tu cartera total. Una posición pequeña que limita el riesgo.

**Estrategia recomendada**: Define un stop-loss (ej: -15% desde tu precio de compra) para proteger tu capital si hay caídas bruscas.

⚠️ *Esto es información educativa, no asesoramiento financiero.*`
  },
  nvda: {
    keywords: ['nvda', 'nvidia'],
    response: `**Análisis NVIDIA (NVDA)**

Tu posición actual en NVDA: **$21.53** (+$0.25, +1.16% hoy).

**Contexto fundamental**:
- NVIDIA es el líder en GPUs para inteligencia artificial. Ha experimentado un crecimiento extraordinario.
- Sus chips H100 y A100 son la columna vertebral de los grandes modelos de IA.

**Consideraciones**:
- Cotiza con valoraciones elevadas (P/E muy alto). El mercado descuenta un crecimiento enorme.
- Si el crecimiento de la IA se desacelera, la valoración podría sufrir.
- Competencia creciente de AMD, Intel y chips propios de las big tech.

**Para tu cartera**: Con $21.53, NVDA representa el 5.6% de tu cartera. La exposición a IA es alta pero la posición es pequeña.

⚠️ *Esto es información educativa, no asesoramiento financiero.*`
  },
  googl: {
    keywords: ['googl', 'google', 'alphabet'],
    response: `**Análisis Alphabet/Google (GOOGL)**

Tu posición: **$329.77** (+$0.73, +0.22% hoy) — tu **mayor posición** con el 86% del valor total de tu cartera.

**Concentración de riesgo**: Tener el 86% en un solo valor es alta concentración. Si GOOGL cae un 20%, tu cartera pierde ~17%.

**Fundamental**:
- Google domina el 90%+ del mercado de búsqueda y tiene YouTube, Google Cloud en crecimiento.
- Exposición a IA con Gemini/Bard.
- Riesgos regulatorios antimonopolio en EEUU y Europa.

**Recomendación de diversificación**: Considera si quieres mantener esta concentración o distribuir mejor el capital.

⚠️ *Esto es información educativa, no asesoramiento financiero.*`
  },
  aapl: {
    keywords: ['aapl', 'apple'],
    response: `**Análisis Apple (AAPL)**

Tu posición: **$0.98** (+$0.00, +0.37% hoy) — posición muy pequeña, probablemente una fracción de acción.

**Sobre Apple**:
- La empresa con mayor capitalización del mundo históricamente.
- Ecosistema cerrado (iPhone, Mac, iPad, servicios) genera ingresos recurrentes.
- Márgenes muy altos en el segmento servicios (App Store, Apple Music, iCloud).

**Tu posición**: Con $0.98 es una posición simbólica. Si quieres exposición real a Apple, considera aumentar gradualmente.

**Riesgos**: Dependencia del iPhone, mercado chino (40% de producción), regulación de la App Store.

⚠️ *Esto es información educativa, no asesoramiento financiero.*`
  },
  diversificacion: {
    keywords: ['diversific', 'riesgo', 'cartera', 'portafolio'],
    response: `**Diversificación de tu Cartera**

Tu cartera actual tiene un **problema de concentración importante**:

| Ticker | Valor | % Cartera |
|--------|-------|-----------|
| GOOGL | $329.77 | ~86% |
| TSLA | $31.02 | ~8% |
| NVDA | $21.53 | ~6% |
| AAPL | $0.98 | ~0.3% |

**El problema**: El 86% en un solo activo (GOOGL) es concentración muy alta.

**Principios de diversificación**:
1. Ninguna posición individual debería superar el 20-25% del portafolio.
2. Diversifica por sectores: tech, salud, consumo, finanzas, energía.
3. Considera ETFs indexados (SPY, QQQ) para diversificación automática.
4. Diversifica geográficamente: no solo EEUU.

**Acción sugerida**: Si tienes capital adicional, considera distribuirlo para reducir la concentración en GOOGL.`
  },
  fiscal: {
    keywords: ['fiscal', 'impuesto', 'declarar', 'hacienda', 'agencia tributaria', 'irpf'],
    response: `**Fiscalidad de Inversiones en el Extranjero**

Al invertir en bolsa americana desde Europa/Latinoamérica, debes considerar:

**Retención en origen (EEUU)**:
- Dividendos de empresas americanas: 30% de retención en EEUU (puede reducirse al 15% con tratado de doble imposición).
- Plusvalías por venta de acciones: generalmente NO hay retención en EEUU para no residentes.

**Declaración en tu país**:
- Debes declarar **todas** las ganancias y dividendos, aunque el broker no lo reporte automáticamente.
- Si hay retención en EEUU, generalmente puedes deducirla en tu declaración local (para evitar doble imposición).

**Qué necesitas del broker**:
- Informe anual de operaciones (equivalente al 1099-DIV y 1099-B en EEUU).
- Resumen de dividendos cobrados.

**Acción**: Verifica si Vest proporciona un informe fiscal anual y consulta con un asesor fiscal local para tu caso específico.`
  },
  stoploss: {
    keywords: ['stop-loss', 'stop loss', 'stoploss', 'proteger', 'pérdida'],
    response: `**¿Qué es un Stop-Loss?**

Un stop-loss es una orden automática que vende tus acciones cuando el precio cae hasta un nivel que tú defines, para limitar tus pérdidas.

**Ejemplo con tu cartera**:
- TSLA en $31.02. Si defines un stop-loss al 15%, se vendería automáticamente a $26.37.
- Esto te protege de caídas mayores del 15%.

**Tipos de stop-loss**:
1. **Stop-loss fijo**: Precio fijo (ej: vende si cae a $26).
2. **Stop-loss porcentual**: Se activa si cae X% desde el precio de compra.
3. **Trailing stop**: Se ajusta automáticamente al alza cuando la acción sube.

**Guía general para definir tu stop-loss**:
- Acciones volátiles (TSLA, NVDA): 15-20% puede ser razonable para no vender por volatilidad normal.
- Acciones estables (AAPL, GOOGL): 8-12%.

**Verifica en Vest**: ¿Ofrece órdenes de stop-loss? Si no, tendrás que monitorear manualmente.`
  },
  vest: {
    keywords: ['vest', 'broker', 'seguro', 'regulad', 'confiable', 'fiable'],
    response: `**¿Es Vest un Broker Seguro?**

Para evaluar la seguridad y regulación de Vest, debes verificar:

**1. Regulación**:
- ¿Está registrado ante la SEC (EEUU), CNMV (España), o el regulador financiero de tu país?
- ¿Tiene licencia como intermediario de valores?
- Visita: https://vest.investments/es/about/ para encontrar información regulatoria.

**2. Seguro de depósito**:
- En EEUU, brokers registrados tienen el SIPC que protege hasta $500,000.
- En Europa, esquemas como el FGD protegen hasta €20,000.

**3. Segregación de fondos**:
- Tus activos deben estar segregados de los activos del broker.

**4. Transparencia**:
- El score del análisis que estás completando te da una buena guía.

**Señales de alerta en tu screenshot de Vest**:
- Se ve la opción "Invest in Conservative portfolio" de SmartVest — evalúa si es solo una sugerencia o si te dificultan comprar acciones individuales.

**Recomendación**: Completa el análisis de las 6 preguntas para obtener tu evaluación personalizada.`
  },
  default: {
    response: `Gracias por tu pregunta. Como Copiloto Financiero, puedo ayudarte con:

- **Análisis de tu cartera** (GOOGL, AAPL, NVDA, TSLA)
- **Evaluación del broker Vest**
- **Conceptos de inversión**: comisiones, diversificación, stop-loss
- **Fiscalidad** de inversiones internacionales
- **Estrategias de inversión** a largo plazo

Algunas preguntas que puedes hacerme:
- "¿Cuáles son los riesgos de mi cartera actual?"
- "¿Cómo funciona un stop-loss?"
- "¿Cómo declaro mis ganancias?"

⚠️ Recuerda: soy un asistente educativo, no un asesor financiero certificado.`
  }
};

function generateCopilotResponse(question) {
  const q = question.toLowerCase();

  for (const [key, data] of Object.entries(knowledgeBase)) {
    if (key === 'default') continue;
    if (data.keywords && data.keywords.some(kw => q.includes(kw))) {
      return data.response;
    }
  }

  return knowledgeBase.default.response;
}

function formatCopilotMessage(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\|(.+)\|/g, '<div style="font-family:monospace;font-size:12px;padding:4px 0">$1</div>')
    .split('\n\n')
    .map(p => p.trim() ? `<p>${p}</p>` : '')
    .join('');
}

function addMessage(content, isUser = false) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

  const avatar = isUser ? 'DV' : '🤖';
  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-bubble">${isUser ? `<p>${content}</p>` : formatCopilotMessage(content)}</div>
  `;

  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message bot-message';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, true);
  input.value = '';

  const typing = addTypingIndicator();
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

  typing.remove();
  const response = generateCopilotResponse(text);
  addMessage(response, false);
}

function askCopilot(question) {
  document.getElementById('chatInput').value = question;
  navigateTo('copilot');
  setTimeout(() => sendMessage(), 200);
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ========================================================
// CALCULATORS
// ========================================================
function switchCalc(id) {
  document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`calc-${id}`).classList.add('active');
  event.target.classList.add('active');
}

function calcROI() {
  const buy = parseFloat(document.getElementById('roi-buy').value) || 0;
  const sell = parseFloat(document.getElementById('roi-sell').value) || 0;
  const shares = parseFloat(document.getElementById('roi-shares').value) || 1;
  const commission = parseFloat(document.getElementById('roi-commission').value) || 0;

  if (!buy || !sell) return;

  const grossProfit = (sell - buy) * shares;
  const netProfit = grossProfit - commission;
  const roi = ((netProfit / (buy * shares)) * 100);
  const totalInvested = buy * shares;

  const el = document.getElementById('roi-results');
  el.className = 'calc-results visible';
  el.innerHTML = `
    <div class="result-row"><span class="result-label">Inversión total</span><span class="result-value">$${totalInvested.toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Valor de venta</span><span class="result-value">$${(sell * shares).toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Ganancia bruta</span><span class="result-value ${grossProfit >= 0 ? 'positive' : 'negative'}">$${grossProfit.toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Comisiones</span><span class="result-value negative">-$${commission.toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Ganancia neta</span><span class="result-value ${netProfit >= 0 ? 'positive' : 'negative'}"><strong>$${netProfit.toFixed(2)}</strong></span></div>
    <div class="result-row"><span class="result-label">ROI neto</span><span class="result-value ${roi >= 0 ? 'positive' : 'negative'}"><strong>${roi.toFixed(2)}%</strong></span></div>
  `;
}

function calcCompound() {
  const principal = parseFloat(document.getElementById('ci-principal').value) || 0;
  const monthly = parseFloat(document.getElementById('ci-monthly').value) || 0;
  const rate = (parseFloat(document.getElementById('ci-rate').value) || 0) / 100;
  const years = parseInt(document.getElementById('ci-years').value) || 0;

  if (!principal && !monthly) return;

  const monthlyRate = rate / 12;
  const months = years * 12;

  let balance = principal;
  for (let i = 0; i < months; i++) {
    balance = balance * (1 + monthlyRate) + monthly;
  }

  const totalContributions = principal + monthly * months;
  const totalInterest = balance - totalContributions;

  const el = document.getElementById('compound-results');
  el.className = 'calc-results visible';
  el.innerHTML = `
    <div class="result-row"><span class="result-label">Capital inicial</span><span class="result-value">$${principal.toLocaleString('es-ES', {minimumFractionDigits:2})}</span></div>
    <div class="result-row"><span class="result-label">Total aportado (mensual × años)</span><span class="result-value">$${(monthly * months).toLocaleString('es-ES', {minimumFractionDigits:2})}</span></div>
    <div class="result-row"><span class="result-label">Total contribuciones</span><span class="result-value">$${totalContributions.toLocaleString('es-ES', {minimumFractionDigits:2})}</span></div>
    <div class="result-row"><span class="result-label">Intereses generados</span><span class="result-value positive">+$${totalInterest.toLocaleString('es-ES', {minimumFractionDigits:2})}</span></div>
    <div class="result-row"><span class="result-label">Valor final en ${years} años</span><span class="result-value positive"><strong>$${balance.toLocaleString('es-ES', {minimumFractionDigits:2})}</strong></span></div>
    <div class="result-row"><span class="result-label">Multiplicador del capital</span><span class="result-value positive"><strong>x${(balance / totalContributions).toFixed(2)}</strong></span></div>
  `;
}

function calcCommissions() {
  const capital = parseFloat(document.getElementById('comm-capital').value) || 0;
  const fee = parseFloat(document.getElementById('comm-fee').value) || 0;
  const ops = parseInt(document.getElementById('comm-ops').value) || 0;
  const ret = (parseFloat(document.getElementById('comm-return').value) || 0) / 100;

  if (!capital) return;

  const totalFees = fee * ops * 2; // buy + sell
  const grossReturn = capital * ret;
  const netReturn = grossReturn - totalFees;
  const feeImpact = (totalFees / capital) * 100;
  const breakEven = (totalFees / capital) * 100;

  const el = document.getElementById('commissions-results');
  el.className = 'calc-results visible';
  el.innerHTML = `
    <div class="result-row"><span class="result-label">Capital invertido</span><span class="result-value">$${capital.toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Total comisiones anuales (ida+vuelta)</span><span class="result-value negative">-$${totalFees.toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Impacto de comisiones sobre capital</span><span class="result-value negative">${feeImpact.toFixed(2)}%</span></div>
    <div class="result-row"><span class="result-label">Rendimiento bruto esperado</span><span class="result-value positive">+$${grossReturn.toFixed(2)}</span></div>
    <div class="result-row"><span class="result-label">Rendimiento neto (tras comisiones)</span><span class="result-value ${netReturn >= 0 ? 'positive' : 'negative'}"><strong>${netReturn >= 0 ? '+' : ''}$${netReturn.toFixed(2)}</strong></span></div>
    <div class="result-row"><span class="result-label">Rentabilidad mínima para cubrir comisiones</span><span class="result-value"><strong>${breakEven.toFixed(2)}%</strong></span></div>
  `;
}

function calcCurrency() {
  const usd = parseFloat(document.getElementById('fx-usd').value) || 0;
  const realRate = parseFloat(document.getElementById('fx-real').value) || 0;
  const brokerRate = parseFloat(document.getElementById('fx-broker').value) || 0;
  const ops = parseInt(document.getElementById('fx-ops').value) || 1;

  if (!usd || !realRate || !brokerRate) return;

  const withRealRate = usd * realRate;
  const withBrokerRate = usd * brokerRate;
  const lossPerOp = withRealRate - withBrokerRate;
  const totalLoss = lossPerOp * ops;
  const lossPercent = ((lossPerOp / withRealRate) * 100);

  const el = document.getElementById('currency-results');
  el.className = 'calc-results visible';
  el.innerHTML = `
    <div class="result-row"><span class="result-label">Valor con tipo de cambio real</span><span class="result-value">${withRealRate.toFixed(2)} (local)</span></div>
    <div class="result-row"><span class="result-label">Valor con tipo de cambio del broker</span><span class="result-value">${withBrokerRate.toFixed(2)} (local)</span></div>
    <div class="result-row"><span class="result-label">Pérdida por operación</span><span class="result-value negative">-${lossPerOp.toFixed(2)} (${lossPercent.toFixed(2)}%)</span></div>
    <div class="result-row"><span class="result-label">Pérdida total en ${ops} operaciones</span><span class="result-value negative"><strong>-${totalLoss.toFixed(2)}</strong></span></div>
    <div class="result-row"><span class="result-label">Equivalente en USD perdido</span><span class="result-value negative"><strong>-$${(totalLoss / ((realRate + brokerRate) / 2)).toFixed(2)}</strong></span></div>
  `;
}

// ========================================================
// EDUCATION MODALS
// ========================================================
const eduContent = {
  mifid: {
    title: '📋 Test MiFID — Evaluación de Idoneidad',
    content: `
      <div class="edu-content">
        <p>El test MiFID (Markets in Financial Instruments Directive) es un cuestionario <strong>obligatorio por ley en la Unión Europea</strong> que los brokers deben aplicar antes de permitirte operar.</p>
        <h4>¿Qué evalúa?</h4>
        <ul>
          <li>Tus conocimientos y experiencia financiera</li>
          <li>Tu situación financiera (ingresos, patrimonio)</li>
          <li>Tus objetivos de inversión (horizonte temporal, tolerancia al riesgo)</li>
        </ul>
        <h4>¿Para qué sirve?</h4>
        <p>Permite clasificarte como <strong>cliente minorista, profesional o contraparte elegible</strong>, determinando qué productos financieros puedes contratar y con qué nivel de protección.</p>
        <h4>Si tu broker no te hizo el test MiFID...</h4>
        <ul>
          <li>Puede estar operando fuera de la regulación europea</li>
          <li>Podría no tener licencia en tu país</li>
          <li>Tienes menos protecciones legales en caso de disputa</li>
        </ul>
        <div class="warn-box">⚠️ <strong>Acción recomendada</strong>: Verifica si Vest está registrado ante el regulador financiero de tu país (CNMV en España, CNBV en México, CMF en Chile, etc.)</div>
        <div class="tip-box">✅ <strong>Nota</strong>: Fuera de la UE, pueden existir regulaciones equivalentes. Lo importante es que el broker evalúe tu perfil de inversor antes de dejarte operar con productos de riesgo.</div>
      </div>
    `
  },
  diversification: {
    title: '🎯 Diversificación de Cartera',
    content: `
      <div class="edu-content">
        <p>La diversificación es la estrategia de distribuir tu inversión entre diferentes activos para reducir el riesgo total de la cartera.</p>
        <h4>El problema con tu cartera actual</h4>
        <p>Según el screenshot, tienes:</p>
        <ul>
          <li>GOOGL: ~$329.77 (≈86% del total) ← <strong>Concentración muy alta</strong></li>
          <li>TSLA: ~$31.02 (≈8%)</li>
          <li>NVDA: ~$21.53 (≈6%)</li>
          <li>AAPL: ~$0.98 (≈0.3%)</li>
        </ul>
        <h4>Principios de diversificación</h4>
        <ul>
          <li><strong>Por activo</strong>: Ninguna posición > 20-25% del portafolio</li>
          <li><strong>Por sector</strong>: Tecnología, salud, consumo, finanzas, energía</li>
          <li><strong>Por geografía</strong>: No solo EEUU — Europa, Asia emergente</li>
          <li><strong>Por tipo de activo</strong>: Acciones, ETFs, bonos, REITs</li>
        </ul>
        <h4>Opciones para diversificar</h4>
        <ul>
          <li><strong>ETF S&P 500 (SPY/VOO)</strong>: Exposición a las 500 mayores empresas de EEUU</li>
          <li><strong>ETF NASDAQ (QQQ)</strong>: Top 100 tecnológicas</li>
          <li><strong>ETF mundial (VT)</strong>: Exposición global en un solo instrumento</li>
        </ul>
        <div class="tip-box">✅ Warren Buffett recomienda a los inversores individuales: "Compra un fondo indexado del S&P 500 y mantén para siempre."</div>
      </div>
    `
  },
  dividends: {
    title: '💰 Dividendos — Cómo Funcionan',
    content: `
      <div class="edu-content">
        <p>Los dividendos son pagos periódicos que las empresas hacen a sus accionistas, como una parte de sus ganancias.</p>
        <h4>¿Tus acciones pagan dividendos?</h4>
        <ul>
          <li><strong>GOOGL</strong>: Sí, comenzó a pagar dividendos en 2024. Rendimiento bajo (~0.5%)</li>
          <li><strong>AAPL</strong>: Sí, paga dividendo trimestral. Rendimiento ~0.5%</li>
          <li><strong>NVDA</strong>: Sí, paga dividendo aunque muy pequeño (~0.03%)</li>
          <li><strong>TSLA</strong>: No paga dividendos actualmente</li>
        </ul>
        <h4>Fiscalidad de dividendos internacionales</h4>
        <ul>
          <li>EEUU retiene un 30% en origen (reducible al 15% con convenio de doble imposición)</li>
          <li>Recibes el dividendo "neto" ya con la retención aplicada</li>
          <li>Debes declararlo en tu país y puedes deducir la retención extranjera</li>
        </ul>
        <h4>¿Cómo cobro los dividendos en Vest?</h4>
        <p>Verifica con Vest si los dividendos se depositan automáticamente en tu cuenta o si necesitas configurar algo específico.</p>
        <div class="warn-box">⚠️ Con posiciones muy pequeñas (como tu $0.98 en AAPL), los dividendos serán prácticamente simbólicos. El dividendo anual de AAPL con $0.98 sería menos de $0.01.</div>
      </div>
    `
  },
  stoploss: {
    title: '🛑 Stop-Loss — Protege tu Capital',
    content: `
      <div class="edu-content">
        <p>Un stop-loss es una orden que vende automáticamente tus acciones cuando el precio baja hasta un nivel predefinido, limitando tus pérdidas.</p>
        <h4>Tipos de stop-loss</h4>
        <ul>
          <li><strong>Stop-loss fijo</strong>: Se activa cuando el precio cae a un valor específico (ej: vende TSLA si baja a $25)</li>
          <li><strong>Stop-loss porcentual</strong>: Se activa cuando el precio cae X% desde tu precio de compra</li>
          <li><strong>Trailing stop</strong>: Se ajusta automáticamente al alza. Si la acción sube, tu stop-loss también sube.</li>
        </ul>
        <h4>¿Dónde poner el stop-loss?</h4>
        <ul>
          <li>Muy ajustado (5%): riesgo de vender por volatilidad normal</li>
          <li>Moderado (10-15%): equilibrio entre protección y margen de movimiento</li>
          <li>Amplio (20%+): para acciones muy volátiles o posiciones a largo plazo</li>
        </ul>
        <h4>Aplicado a tu cartera</h4>
        <ul>
          <li>GOOGL ($329.77): Stop-loss a $280 aprox. (-15%)</li>
          <li>TSLA ($31.02): Stop-loss a $26 aprox. (-16%)</li>
          <li>NVDA ($21.53): Stop-loss a $18 aprox. (-16%)</li>
        </ul>
        <div class="warn-box">⚠️ Verifica si Vest permite configurar órdenes stop-loss. Si no, necesitarás monitorear manualmente los precios.</div>
        <div class="tip-box">✅ Regla de oro: nunca pierdas más de lo que puedes permitirte perder. Define tu límite ANTES de invertir.</div>
      </div>
    `
  },
  taxes: {
    title: '🏛️ Fiscalidad de Inversiones Internacionales',
    content: `
      <div class="edu-content">
        <p>Invertir en bolsa americana desde otro país implica obligaciones fiscales en dos países: donde se origina la ganancia (EEUU) y donde resides tú.</p>
        <h4>Impuestos en EEUU (para no residentes)</h4>
        <ul>
          <li><strong>Dividendos</strong>: Retención del 30% en origen (puede reducirse al 15% con tratado)</li>
          <li><strong>Plusvalías (ganancias por venta)</strong>: Generalmente exentas para no residentes fiscales en EEUU</li>
          <li><strong>Intereses</strong>: Generalmente exentos para no residentes</li>
        </ul>
        <h4>Documentos que necesitas de Vest</h4>
        <ul>
          <li>Informe anual de operaciones de compra/venta</li>
          <li>Resumen de dividendos cobrados y retenciones aplicadas</li>
          <li>Form 1042-S (certificado de retenciones de dividendos en EEUU)</li>
        </ul>
        <h4>En tu declaración local</h4>
        <ul>
          <li>Declara todas las plusvalías como "ganancias patrimoniales"</li>
          <li>Declara todos los dividendos como "rendimientos del capital mobiliario"</li>
          <li>Aplica la deducción por doble imposición internacional para recuperar la retención de EEUU</li>
        </ul>
        <div class="warn-box">⚠️ <strong>IMPORTANTE</strong>: No declarar ganancias de inversión en el extranjero puede resultar en sanciones graves. Consulta un asesor fiscal especializado en inversiones internacionales.</div>
        <div class="tip-box">✅ <strong>Consejo práctico</strong>: Guarda todos los comprobantes de operaciones durante mínimo 5 años.</div>
      </div>
    `
  },
  brokers: {
    title: '🏦 Cómo Elegir un Broker Seguro',
    content: `
      <div class="edu-content">
        <p>Elegir el broker adecuado es una de las decisiones más importantes para un inversor. Aquí tienes la guía completa.</p>
        <h4>Criterios fundamentales (los 6 del análisis)</h4>
        <ul>
          <li>✅ Comisiones transparentes y documentadas</li>
          <li>✅ Permite operar en USD (para bolsa americana)</li>
          <li>✅ No obliga a productos estructurados propios</li>
          <li>✅ Reporte fiscal automático</li>
          <li>✅ Límites de riesgo configurables</li>
          <li>✅ Evaluación MiFID o equivalente</li>
        </ul>
        <h4>Señales de alerta (Red Flags)</h4>
        <ul>
          <li>❌ "Rendimientos garantizados" o "sin riesgo"</li>
          <li>❌ Presión para invertir rápido</li>
          <li>❌ No está registrado ante el regulador nacional</li>
          <li>❌ Dificultad para retirar fondos</li>
          <li>❌ Comisiones ocultas o no documentadas</li>
          <li>❌ Sin atención al cliente en tu idioma/país</li>
        </ul>
        <h4>Brokers alternativos bien regulados</h4>
        <ul>
          <li><strong>Interactive Brokers</strong>: El más completo para inversores internacionales</li>
          <li><strong>DEGIRO</strong>: Popular en Europa, comisiones bajas</li>
          <li><strong>Fidelity / Charles Schwab</strong>: Brokers americanos de referencia</li>
          <li><strong>eToro</strong>: Más orientado a trading social</li>
        </ul>
        <div class="tip-box">✅ Antes de elegir: verifica siempre en el registro oficial de entidades de tu regulador financiero local que el broker está autorizado.</div>
      </div>
    `
  }
};

function openEduModal(id) {
  const data = eduContent[id];
  if (!data) return;
  document.getElementById('eduModalTitle').textContent = data.title;
  document.getElementById('eduModalContent').innerHTML = data.content;
  document.getElementById('eduModal').classList.add('active');
}

function closeEduModal() {
  document.getElementById('eduModal').classList.remove('active');
}

// ========================================================
// INIT
// ========================================================
function init() {
  renderPortfolioTable();
  renderDashboardHoldings();

  // Load saved notes
  const saved = localStorage.getItem('portfolioNotes');
  if (saved) document.getElementById('portfolioNotes').value = saved;

  // Set default calc values and trigger
  document.getElementById('ci-principal').value = '1000';
  document.getElementById('ci-monthly').value = '100';
  document.getElementById('ci-rate').value = '10';
  document.getElementById('ci-years').value = '10';
}

init();
