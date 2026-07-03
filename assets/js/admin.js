/* ═══════════════════════════════════════════════
   ElectroLink — admin.js
   ═══════════════════════════════════════════════ */

// ── BASE DE DADOS (localStorage) ─────────────────
const DB_KEY = 'electrolink_admin_db';

function getDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || { clientes:[], vagas:[], candidaturas:[] }; }
  catch { return { clientes:[], vagas:[], candidaturas:[] }; }
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-MZ', { day:'2-digit', month:'short', year:'numeric' });
}

// ── NAVEGAÇÃO ─────────────────────────────────────
const panelTitles = { dashboard:'Visão geral', clientes:'Clientes', vagas:'Vagas', candidaturas:'Candidaturas' };

window.showPanel = function(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbarTitle').textContent = panelTitles[id] || id;
  renderAll();
};

// ── DRAWERS ───────────────────────────────────────
window.openDrawer = function(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeDrawer = function(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.drawer-overlay').forEach(el => {
    el.addEventListener('click', (e) => { if (e.target === el) closeDrawer(el.id); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.drawer-overlay.open').forEach(el => closeDrawer(el.id));
  });
  if (window.innerWidth <= 860) document.getElementById('sidebarToggle').style.display = 'flex';
  renderAll();
});

// ── CLIENTES ──────────────────────────────────────
window.salvarCliente = function() {
  const nome  = document.getElementById('cli-nome').value.trim();
  const tel   = document.getElementById('cli-tel').value.trim();
  const serv  = document.getElementById('cli-servico').value;
  if (!nome || !tel || !serv) { alert('Preenche nome, telefone e serviço.'); return; }
  const db = getDB();
  db.clientes.push({
    id:      genId(), nome, tel,
    email:   document.getElementById('cli-email').value.trim(),
    servico: serv,
    local:   document.getElementById('cli-local').value.trim(),
    obs:     document.getElementById('cli-obs').value.trim(),
    estado:  'activo', data: new Date().toISOString(),
  });
  saveDB(db);
  closeDrawer('drawer-cliente');
  ['cli-nome','cli-tel','cli-email','cli-local','cli-obs'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cli-servico').value = '';
  renderAll();
};

window.editCliente = function(id) {
  const db = getDB();
  const c = db.clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cli-nome').value    = c.nome;
  document.getElementById('cli-tel').value     = c.tel;
  document.getElementById('cli-email').value   = c.email || '';
  document.getElementById('cli-servico').value = c.servico;
  document.getElementById('cli-local').value   = c.local || '';
  document.getElementById('cli-obs').value     = c.obs || '';
  db.clientes = db.clientes.filter(x => x.id !== id);
  saveDB(db);
  openDrawer('drawer-cliente');
  renderAll();
};

window.deleteCliente = function(id) {
  if (!confirm('Apagar este cliente?')) return;
  const db = getDB();
  db.clientes = db.clientes.filter(c => c.id !== id);
  saveDB(db);
  renderAll();
};

window.filterClientes = function(q) { renderClientes(q.toLowerCase()); };

function renderClientes(q = '') {
  const db    = getDB();
  const tbody = document.getElementById('clientes-tbody');
  const items = q ? db.clientes.filter(c =>
    c.nome.toLowerCase().includes(q) || c.tel.includes(q) || (c.local||'').toLowerCase().includes(q)
  ) : db.clientes;

  if (!items.length) {
    tbody.innerHTML = emptyRow(6, q ? 'Nenhum resultado' : 'Sem clientes', q ? 'Tenta outra pesquisa.' : 'Adiciona o primeiro cliente.');
    return;
  }
  tbody.innerHTML = items.map(c => `
    <tr>
      <td><strong>${c.nome}</strong></td>
      <td class="muted">${c.tel}${c.email ? '<br><small>' + c.email + '</small>' : ''}</td>
      <td>${c.servico}</td>
      <td class="muted">${c.local || '—'}</td>
      <td><span class="badge ${c.estado === 'activo' ? 'b-green' : 'b-gray'}">${c.estado}</span></td>
      <td>
        <div class="actions">
          <button class="btn-a edit" onclick="editCliente('${c.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg> Editar
          </button>
          <button class="btn-a del" onclick="deleteCliente('${c.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg> Apagar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── VAGAS ─────────────────────────────────────────
window.salvarVaga = function() {
  const titulo = document.getElementById('vaga-titulo').value.trim();
  const area   = document.getElementById('vaga-area').value;
  const desc   = document.getElementById('vaga-desc').value.trim();
  if (!titulo || !area || !desc) { alert('Preenche título, área e descrição.'); return; }
  const db = getDB();
  db.vagas.push({
    id: genId(), titulo, area,
    local:    document.getElementById('vaga-local').value.trim() || 'Maputo',
    contrato: document.getElementById('vaga-contrato').value,
    prazo:    document.getElementById('vaga-prazo').value,
    num:      document.getElementById('vaga-num').value || '1',
    desc, estado:'aberta', data: new Date().toISOString(),
  });
  saveDB(db);
  closeDrawer('drawer-vaga');
  ['vaga-titulo','vaga-local','vaga-prazo','vaga-num','vaga-desc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('vaga-area').value = '';
  renderAll();
};

window.fecharVaga = function(id) {
  if (!confirm('Encerrar esta vaga?')) return;
  const db = getDB();
  const v  = db.vagas.find(x => x.id === id);
  if (v) v.estado = 'encerrada';
  saveDB(db); renderAll();
};

window.deleteVaga = function(id) {
  if (!confirm('Apagar esta vaga?')) return;
  const db = getDB();
  db.vagas = db.vagas.filter(v => v.id !== id);
  saveDB(db); renderAll();
};

function renderVagas() {
  const db        = getDB();
  const container = document.getElementById('vagas-list');
  if (!db.vagas.length) {
    container.innerHTML = `<div class="empty-state" style="background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
      <strong>Sem vagas</strong><p>Abre a primeira vaga com o botão acima.</p>
    </div>`; return;
  }
  container.innerHTML = db.vagas.map(v => {
    const cands = db.candidaturas.filter(c => c.vagaId === v.id).length;
    return `
    <div class="vaga-card">
      <div>
        <div style="display:flex;gap:8px;margin-bottom:7px;">
          <span class="badge ${v.estado === 'aberta' ? 'b-green' : 'b-gray'}">${v.estado}</span>
          <span class="badge b-navy">${v.area}</span>
        </div>
        <h3>${v.titulo}</h3>
        <p style="font-size:13px;color:var(--gray-600);margin-top:5px;max-width:540px;">${v.desc.length > 110 ? v.desc.slice(0,110) + '…' : v.desc}</p>
        <div class="vaga-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.4 7-12.5A7 7 0 105 9.5C5 14.6 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.5"/></svg>${v.local}</span>
          <span>${v.contrato}</span>
          ${v.prazo ? `<span>Prazo: ${fmtDate(v.prazo)}</span>` : ''}
          <span style="color:var(--gold);font-weight:600;">${cands} candidatura${cands !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="vaga-acts">
        ${v.estado === 'aberta' ? `<button class="btn-a close-v" onclick="fecharVaga('${v.id}')">Encerrar</button>` : ''}
        <button class="btn-a del" onclick="deleteVaga('${v.id}')">Apagar</button>
      </div>
    </div>`;
  }).join('');
}

// ── CANDIDATURAS ──────────────────────────────────
window.updateEstado = function(id, estado) {
  const db = getDB();
  const c  = db.candidaturas.find(x => x.id === id);
  if (c) c.estado = estado;
  saveDB(db); closeDrawer('drawer-cand-detail'); renderAll();
};

window.verCandidatura = function(id) {
  const db   = getDB();
  const c    = db.candidaturas.find(x => x.id === id);
  if (!c) return;
  const vaga = db.vagas.find(v => v.id === c.vagaId);
  document.getElementById('cand-detail-content').innerHTML = `
    <div class="detail-section">
      <h4>Candidato</h4>
      <div class="detail-row"><b>Nome</b><span>${c.nome || '—'}</span></div>
      <div class="detail-row"><b>Email</b><span>${c.email || '—'}</span></div>
      <div class="detail-row"><b>Telefone</b><span>${c.tel || '—'}</span></div>
      <div class="detail-row"><b>Localidade</b><span>${c.local || '—'}</span></div>
    </div>
    <div class="detail-section">
      <h4>Vaga</h4>
      <div class="detail-row"><b>Título</b><span>${vaga ? vaga.titulo : c.vagaTitulo || '—'}</span></div>
      <div class="detail-row"><b>Data</b><span>${fmtDate(c.data)}</span></div>
      <div class="detail-row"><b>Estado</b><span><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></span></div>
    </div>
    ${c.carta ? `<div class="detail-section"><h4>Carta de motivação</h4><p style="font-size:13.5px;color:var(--gray-600);line-height:1.7;">${c.carta}</p></div>` : ''}
  `;
  document.getElementById('cand-detail-actions').innerHTML = `
    ${c.estado !== 'aprovado'   ? `<button class="btn-t primary" onclick="updateEstado('${c.id}','aprovado')">Aprovar</button>` : ''}
    ${c.estado !== 'em-analise' ? `<button class="btn-t ghost" onclick="updateEstado('${c.id}','em-analise')">Em análise</button>` : ''}
    ${c.estado !== 'rejeitado'  ? `<button class="btn-t danger" onclick="updateEstado('${c.id}','rejeitado')">Rejeitar</button>` : ''}
    <button class="btn-t ghost" onclick="closeDrawer('drawer-cand-detail')">Fechar</button>
  `;
  openDrawer('drawer-cand-detail');
};

function badgeClass(estado) {
  return { pendente:'b-gold', 'em-analise':'b-navy', aprovado:'b-green', rejeitado:'b-red' }[estado] || 'b-gray';
}

let _cfq = '', _cfs = '';
window.filterCandidaturas = function(q) { _cfq = q.toLowerCase(); renderCandidaturas(); };
window.filterCandByState  = function(s) { _cfs = s; renderCandidaturas(); };

function renderCandidaturas() {
  const db = getDB();
  let items = db.candidaturas;
  if (_cfq) items = items.filter(c => (c.nome||'').toLowerCase().includes(_cfq) || (c.email||'').toLowerCase().includes(_cfq));
  if (_cfs) items = items.filter(c => c.estado === _cfs);

  const tbody = document.getElementById('candidaturas-tbody');
  if (!items.length) {
    tbody.innerHTML = emptyRow(6, _cfq || _cfs ? 'Nenhum resultado' : 'Sem candidaturas', 'As candidaturas submetidas aparecerão aqui.');
    return;
  }
  const vagaMap = Object.fromEntries(db.vagas.map(v => [v.id, v.titulo]));
  tbody.innerHTML = items.map(c => `
    <tr>
      <td><strong>${c.nome || '—'}</strong></td>
      <td class="muted">${vagaMap[c.vagaId] || c.vagaTitulo || '—'}</td>
      <td class="muted">${c.tel || c.email || '—'}</td>
      <td class="muted">${fmtDate(c.data)}</td>
      <td><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></td>
      <td>
        <div class="actions">
          <button class="btn-a view" onclick="verCandidatura('${c.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // dashboard — últimas 5
  const dashTbody = document.getElementById('dash-cand-tbody');
  const recentes  = [...db.candidaturas].sort((a,b) => b.data.localeCompare(a.data)).slice(0,5);
  dashTbody.innerHTML = recentes.length ? recentes.map(c => `
    <tr>
      <td><strong>${c.nome || '—'}</strong></td>
      <td class="muted">${vagaMap[c.vagaId] || '—'}</td>
      <td class="muted">${fmtDate(c.data)}</td>
      <td><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></td>
    </tr>
  `).join('') : emptyRow(4, 'Sem candidaturas', 'As candidaturas recebidas aparecerão aqui.');
}

// ── BADGES + STATS ────────────────────────────────
function updateStats() {
  const db = getDB();
  document.getElementById('badge-clientes').textContent      = db.clientes.length;
  document.getElementById('badge-vagas').textContent         = db.vagas.filter(v => v.estado === 'aberta').length;
  document.getElementById('badge-candidaturas').textContent  = db.candidaturas.filter(c => c.estado === 'pendente').length;
  document.getElementById('stat-clientes').textContent       = db.clientes.length;
  document.getElementById('stat-vagas').textContent          = db.vagas.filter(v => v.estado === 'aberta').length;
  document.getElementById('stat-candidaturas').textContent   = db.candidaturas.length;
}

// ── UTILITÁRIOS ───────────────────────────────────
function emptyRow(cols, title, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <strong>${title}</strong><p>${msg}</p>
  </div></td></tr>`;
}

function renderAll() {
  renderClientes();
  renderVagas();
  renderCandidaturas();
  updateStats();
}

window.handleLogout = function(e) {
  e.preventDefault();
  if (confirm('Sair do painel?')) window.location.href = '../index.html';
};
