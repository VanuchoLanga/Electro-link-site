/* ═══════════════════════════════════════════════
   ElectroLink — admin.js (Supabase + Financeiro)
   ═══════════════════════════════════════════════ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://svvtdehfwdghsezafhgx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_mVp27CQVZFWlZqRzSDkgaA_HERxV2r_'
const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

/* ══ CREDENCIAIS ══ */
const CREDENTIALS = { email: 'admin@electrolink.co.mz', password: 'Electro@2026' }
const SESSION_KEY  = 'el_admin_session'

/* ══ HELPERS ══ */
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-MZ', { day:'2-digit', month:'short', year:'numeric' })
}
function fmtMoney(val) {
  return Number(val||0).toLocaleString('pt-MZ', { minimumFractionDigits:2 }) + ' MT'
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

function emptyRow(cols, title, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <strong>${title}</strong><p>${msg}</p></div></td></tr>`
}

function badgeClass(e) {
  return { pendente:'b-gold', 'em-analise':'b-navy', aprovado:'b-green', rejeitado:'b-red', pago:'b-green', emitida:'b-gold', cancelada:'b-red' }[e] || 'b-gray'
}

function showToast(msg, type='success') {
  let t = document.getElementById('toast')
  if (!t) { t = document.createElement('div'); t.id='toast'; document.body.appendChild(t) }
  t.textContent = msg
  t.className = `toast toast-${type} show`
  setTimeout(() => t.classList.remove('show'), 3000)
}

/* ══ LOGIN ══ */
function checkSession() {
  if (sessionStorage.getItem(SESSION_KEY) === 'active') showApp()
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none'
  document.getElementById('adminApp').style.display = 'flex'
  document.getElementById('sessionEmail').textContent = CREDENTIALS.email
  renderAll()
}

window.handleLogin = function(e) {
  e.preventDefault()
  const email    = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const errorEl  = document.getElementById('loginError')
  const btn      = document.getElementById('loginBtn')
  errorEl.classList.remove('visible')
  btn.textContent = 'A entrar…'; btn.disabled = true
  setTimeout(() => {
    if (email === CREDENTIALS.email && password === CREDENTIALS.password) {
      sessionStorage.setItem(SESSION_KEY, 'active'); showApp()
    } else {
      errorEl.classList.add('visible')
      btn.textContent = 'Entrar'; btn.disabled = false
      document.getElementById('loginPassword').value = ''
      document.getElementById('loginPassword').focus()
    }
  }, 500)
}

window.handleLogout = function() {
  if (!confirm('Tens a certeza que queres sair?')) return
  sessionStorage.removeItem(SESSION_KEY)
  document.getElementById('adminApp').style.display = 'none'
  document.getElementById('loginScreen').style.display = 'flex'
  document.getElementById('loginEmail').value = ''
  document.getElementById('loginPassword').value = ''
}

/* ══ SIDEBAR MOBILE ══ */
window.openSidebar  = function() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); document.body.style.overflow='hidden' }
window.closeSidebar = function() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); document.body.style.overflow='' }

/* ══ NAVEGAÇÃO ══ */
const panelTitles = { dashboard:'Visão geral', clientes:'Clientes', vagas:'Vagas', candidaturas:'Candidaturas', financeiro:'Gestão Financeira', facturas:'Facturas' }

window.showPanel = function(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById('panel-' + id).classList.add('active')
  if (btn) btn.classList.add('active')
  document.getElementById('topbarTitle').textContent = panelTitles[id] || id
  closeSidebar(); renderAll()
}

/* ══ DRAWERS ══ */
window.openDrawer  = function(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden' }
window.closeDrawer = function(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow='' }
document.addEventListener('click', e => { if (e.target.classList.contains('drawer-overlay')) closeDrawer(e.target.id) })
document.addEventListener('keydown', e => { if (e.key==='Escape') document.querySelectorAll('.drawer-overlay.open').forEach(el => closeDrawer(el.id)) })

/* ══ CLIENTES ══ */
window.salvarCliente = async function() {
  const nome  = document.getElementById('cli-nome').value.trim()
  const tel   = document.getElementById('cli-tel').value.trim()
  const serv  = document.getElementById('cli-servico').value
  if (!nome||!tel||!serv) { alert('Preenche nome, telefone e serviço.'); return }
  const { error } = await sb.from('clientes').insert({
    nome, tel,
    email:   document.getElementById('cli-email').value.trim(),
    servico: serv,
    local:   document.getElementById('cli-local').value.trim(),
    obs:     document.getElementById('cli-obs').value.trim(),
    estado: 'activo', origem:'Manual'
  })
  if (error) { showToast('Erro ao guardar cliente.','error'); return }
  closeDrawer('drawer-cliente')
  ;['cli-nome','cli-tel','cli-email','cli-local','cli-obs'].forEach(i => document.getElementById(i).value='')
  document.getElementById('cli-servico').value=''
  showToast('Cliente guardado com sucesso.')
  renderAll()
}

window.deleteCliente = async function(id) {
  if (!confirm('Apagar este cliente?')) return
  await sb.from('clientes').delete().eq('id', id)
  showToast('Cliente apagado.'); renderAll()
}

window.filterClientes = function(q) { renderClientes(q.toLowerCase()) }

async function renderClientes(q='') {
  const tbody = document.getElementById('clientes-tbody')
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400);">A carregar…</td></tr>`
  let query = sb.from('clientes').select('*').order('created_at', { ascending:false })
  const { data, error } = await query
  if (error||!data) { tbody.innerHTML = emptyRow(6,'Erro','Não foi possível carregar os clientes.'); return }
  let items = q ? data.filter(c => c.nome.toLowerCase().includes(q)||c.tel.includes(q)||(c.local||'').toLowerCase().includes(q)) : data
  if (!items.length) { tbody.innerHTML = emptyRow(6, q?'Nenhum resultado':'Sem clientes', q?'Tenta outra pesquisa.':'Adiciona o primeiro cliente.'); return }
  tbody.innerHTML = items.map(c => `
    <tr>
      <td><strong>${c.nome}</strong></td>
      <td class="muted">${c.tel}${c.email?'<br><small>'+c.email+'</small>':''}</td>
      <td>${c.servico}</td>
      <td class="muted">${c.local||'—'}</td>
      <td><span class="badge ${c.estado==='activo'?'b-green':'b-gray'}">${c.estado}</span></td>
      <td><div class="actions">
        <button class="btn-a del" onclick="deleteCliente('${c.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>Apagar
        </button>
      </div></td>
    </tr>`).join('')
}

/* ══ VAGAS ══ */
window.salvarVaga = async function() {
  const titulo = document.getElementById('vaga-titulo').value.trim()
  const area   = document.getElementById('vaga-area').value
  const desc   = document.getElementById('vaga-desc').value.trim()
  if (!titulo||!area||!desc) { alert('Preenche título, área e descrição.'); return }
  const { error } = await sb.from('vagas').insert({
    titulo, area,
    local:    document.getElementById('vaga-local').value.trim()||'Maputo',
    contrato: document.getElementById('vaga-contrato').value,
    prazo:    document.getElementById('vaga-prazo').value||null,
    num:      parseInt(document.getElementById('vaga-num').value)||1,
    descricao: desc, estado:'aberta'
  })
  if (error) { showToast('Erro ao publicar vaga.','error'); return }
  closeDrawer('drawer-vaga')
  ;['vaga-titulo','vaga-local','vaga-prazo','vaga-num','vaga-desc'].forEach(i => document.getElementById(i).value='')
  document.getElementById('vaga-area').value=''
  showToast('Vaga publicada com sucesso.')
  renderAll()
}

window.fecharVaga = async function(id) {
  if (!confirm('Encerrar esta vaga?')) return
  await sb.from('vagas').update({ estado:'encerrada' }).eq('id', id)
  showToast('Vaga encerrada.'); renderAll()
}

window.deleteVaga = async function(id) {
  if (!confirm('Apagar esta vaga?')) return
  await sb.from('vagas').delete().eq('id', id)
  showToast('Vaga apagada.'); renderAll()
}

async function renderVagas() {
  const container = document.getElementById('vagas-list')
  container.innerHTML = '<p style="color:var(--gray-400);padding:20px;">A carregar…</p>'
  const { data } = await sb.from('vagas').select('*, candidaturas(count)').order('created_at', { ascending:false })
  if (!data||!data.length) {
    container.innerHTML=`<div class="empty-state" style="background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
      <strong>Sem vagas</strong><p>Abre a primeira vaga com o botão acima.</p></div>`; return
  }
  container.innerHTML = data.map(v => {
    const cands = v.candidaturas?.[0]?.count || 0
    return `<div class="vaga-card">
      <div>
        <div style="display:flex;gap:6px;margin-bottom:7px;flex-wrap:wrap;">
          <span class="badge ${v.estado==='aberta'?'b-green':'b-gray'}">${v.estado}</span>
          <span class="badge b-navy">${v.area}</span>
        </div>
        <h3>${v.titulo}</h3>
        <p style="font-size:13px;color:var(--gray-600);margin-top:5px;">${v.descricao.length>110?v.descricao.slice(0,110)+'…':v.descricao}</p>
        <div class="vaga-meta">
          <span>${v.local}</span><span>${v.contrato}</span>
          ${v.prazo?`<span>Prazo: ${fmtDate(v.prazo)}</span>`:''}
          <span style="color:var(--gold);font-weight:600;">${cands} candidatura${cands!==1?'s':''}</span>
        </div>
      </div>
      <div class="vaga-acts">
        ${v.estado==='aberta'?`<button class="btn-a close-v" onclick="fecharVaga('${v.id}')">Encerrar</button>`:''}
        <button class="btn-a del" onclick="deleteVaga('${v.id}')">Apagar</button>
      </div>
    </div>`
  }).join('')
}

/* ══ CANDIDATURAS ══ */
window.updateEstado = async function(id, estado) {
  await sb.from('candidaturas').update({ estado }).eq('id', id)
  closeDrawer('drawer-cand-detail'); showToast('Estado actualizado.'); renderAll()
}

window.verCandidatura = async function(id) {
  const { data:c } = await sb.from('candidaturas').select('*, vagas(titulo)').eq('id', id).single()
  if (!c) return
  document.getElementById('cand-detail-content').innerHTML = `
    <div class="detail-section"><h4>Candidato</h4>
      <div class="detail-row"><b>Nome</b><span>${c.nome||'—'}</span></div>
      <div class="detail-row"><b>Email</b><span>${c.email||'—'}</span></div>
      <div class="detail-row"><b>Telefone</b><span>${c.tel||'—'}</span></div>
      <div class="detail-row"><b>Localidade</b><span>${c.local||'—'}</span></div>
    </div>
    <div class="detail-section"><h4>Vaga</h4>
      <div class="detail-row"><b>Título</b><span>${c.vagas?.titulo||c.vaga_titulo||'—'}</span></div>
      <div class="detail-row"><b>Data</b><span>${fmtDate(c.created_at)}</span></div>
      <div class="detail-row"><b>Estado</b><span><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></span></div>
    </div>
    ${c.carta?`<div class="detail-section"><h4>Carta de motivação</h4><p style="font-size:13.5px;color:var(--gray-600);line-height:1.7;">${c.carta}</p></div>`:''}`
  document.getElementById('cand-detail-actions').innerHTML = `
    ${c.estado!=='aprovado'?`<button class="btn-t primary" onclick="updateEstado('${c.id}','aprovado')">Aprovar</button>`:''}
    ${c.estado!=='em-analise'?`<button class="btn-t ghost" onclick="updateEstado('${c.id}','em-analise')">Em análise</button>`:''}
    ${c.estado!=='rejeitado'?`<button class="btn-t danger" onclick="updateEstado('${c.id}','rejeitado')">Rejeitar</button>`:''}
    <button class="btn-t ghost" onclick="closeDrawer('drawer-cand-detail')">Fechar</button>`
  openDrawer('drawer-cand-detail')
}

let _cfq='', _cfs=''
window.filterCandidaturas = function(q) { _cfq=q.toLowerCase(); renderCandidaturas() }
window.filterCandByState  = function(s) { _cfs=s; renderCandidaturas() }

async function renderCandidaturas() {
  const tbody = document.getElementById('candidaturas-tbody')
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400);">A carregar…</td></tr>`
  let query = sb.from('candidaturas').select('*, vagas(titulo)').order('created_at', { ascending:false })
  if (_cfs) query = query.eq('estado', _cfs)
  const { data } = await query
  let items = data || []
  if (_cfq) items = items.filter(c => (c.nome||'').toLowerCase().includes(_cfq)||(c.email||'').toLowerCase().includes(_cfq))
  if (!items.length) { tbody.innerHTML = emptyRow(6, _cfq||_cfs?'Nenhum resultado':'Sem candidaturas', 'As candidaturas aparecerão aqui.'); return }
  tbody.innerHTML = items.map(c => `
    <tr>
      <td><strong>${c.nome||'—'}</strong></td>
      <td class="muted">${c.vagas?.titulo||c.vaga_titulo||'—'}</td>
      <td class="muted">${c.tel||c.email||'—'}</td>
      <td class="muted">${fmtDate(c.created_at)}</td>
      <td><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></td>
      <td><div class="actions"><button class="btn-a view" onclick="verCandidatura('${c.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Ver
      </button></div></td>
    </tr>`).join('')

  // dashboard recentes
  const dashTbody = document.getElementById('dash-cand-tbody')
  const recentes = items.slice(0,5)
  dashTbody.innerHTML = recentes.length ? recentes.map(c => `
    <tr>
      <td><strong>${c.nome||'—'}</strong></td>
      <td class="muted">${c.vagas?.titulo||'—'}</td>
      <td class="muted">${fmtDate(c.created_at)}</td>
      <td><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></td>
    </tr>`).join('') : emptyRow(4,'Sem candidaturas','As candidaturas recebidas aparecerão aqui.')
}

/* ══ FINANCEIRO ══ */
window.salvarTransacao = async function() {
  const tipo  = document.getElementById('tr-tipo').value
  const desc  = document.getElementById('tr-desc').value.trim()
  const valor = parseFloat(document.getElementById('tr-valor').value)
  if (!tipo||!desc||!valor) { alert('Preenche todos os campos obrigatórios.'); return }
  const { error } = await sb.from('transacoes').insert({
    tipo, descricao: desc, valor,
    categoria:    document.getElementById('tr-categoria').value,
    forma_pag:    document.getElementById('tr-forma').value,
    cliente_nome: document.getElementById('tr-cliente').value.trim(),
    data_transacao: document.getElementById('tr-data').value || new Date().toISOString().split('T')[0],
    notas:        document.getElementById('tr-notas').value.trim(),
  })
  if (error) { showToast('Erro ao guardar transacção.','error'); return }
  closeDrawer('drawer-transacao')
  ;['tr-desc','tr-valor','tr-cliente','tr-notas'].forEach(i => document.getElementById(i).value='')
  document.getElementById('tr-tipo').value=''
  document.getElementById('tr-categoria').value=''
  document.getElementById('tr-forma').value=''
  document.getElementById('tr-data').value=''
  showToast('Transacção registada.')
  renderFinanceiro()
}

window.deleteTransacao = async function(id) {
  if (!confirm('Apagar esta transacção?')) return
  await sb.from('transacoes').delete().eq('id', id)
  showToast('Transacção apagada.'); renderFinanceiro()
}

let _fTipo='', _fMes=''
window.filterTrByTipo = function(v) { _fTipo=v; renderTransacoes() }
window.filterTrByMes  = function(v) { _fMes=v; renderTransacoes() }

async function renderFinanceiro() {
  // Totais
  const { data: todas } = await sb.from('transacoes').select('tipo,valor,data_transacao')
  const receitas  = (todas||[]).filter(t=>t.tipo==='receita').reduce((s,t)=>s+Number(t.valor),0)
  const despesas  = (todas||[]).filter(t=>t.tipo==='despesa').reduce((s,t)=>s+Number(t.valor),0)
  const saldo     = receitas - despesas

  document.getElementById('fin-receitas').textContent  = fmtMoney(receitas)
  document.getElementById('fin-despesas').textContent  = fmtMoney(despesas)
  document.getElementById('fin-saldo').textContent     = fmtMoney(saldo)
  document.getElementById('fin-saldo').style.color     = saldo >= 0 ? 'var(--green)' : 'var(--red)'

  await renderTransacoes()
}

async function renderTransacoes() {
  const tbody = document.getElementById('transacoes-tbody')
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--gray-400);">A carregar…</td></tr>`
  let query = sb.from('transacoes').select('*').order('data_transacao', { ascending:false })
  if (_fTipo) query = query.eq('tipo', _fTipo)
  const { data } = await query
  let items = data || []
  if (_fMes) items = items.filter(t => t.data_transacao?.startsWith(_fMes))
  if (!items.length) { tbody.innerHTML = emptyRow(7,'Sem transacções','Regista a primeira receita ou despesa.'); return }
  tbody.innerHTML = items.map(t => `
    <tr>
      <td>${fmtDate(t.data_transacao)}</td>
      <td><span class="badge ${t.tipo==='receita'?'b-green':'b-red'}">${t.tipo}</span></td>
      <td><strong>${t.descricao}</strong></td>
      <td class="muted">${t.categoria||'—'}</td>
      <td class="muted">${t.cliente_nome||'—'}</td>
      <td><strong style="color:${t.tipo==='receita'?'var(--green)':'var(--red)'}">${t.tipo==='despesa'?'- ':'+ '}${fmtMoney(t.valor)}</strong></td>
      <td><div class="actions">
        <button class="btn-a del" onclick="deleteTransacao('${t.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div></td>
    </tr>`).join('')
}

/* ══ FACTURAS ══ */
let facturaItens = [{ desc:'', qty:1, preco:0 }]

window.adicionarItem = function() {
  facturaItens.push({ desc:'', qty:1, preco:0 })
  renderItensFactura()
}

window.removerItem = function(idx) {
  facturaItens.splice(idx,1)
  if (!facturaItens.length) facturaItens = [{ desc:'', qty:1, preco:0 }]
  renderItensFactura()
}

function renderItensFactura() {
  const container = document.getElementById('factura-itens')
  container.innerHTML = facturaItens.map((item,i) => `
    <div class="factura-item-row">
      <input type="text" placeholder="Descrição do serviço" value="${item.desc}"
             oninput="facturaItens[${i}].desc=this.value;calcTotal()" style="flex:2;">
      <input type="number" placeholder="Qtd" value="${item.qty}" min="1"
             oninput="facturaItens[${i}].qty=Number(this.value);calcTotal()" style="width:70px;">
      <input type="number" placeholder="Preço (MT)" value="${item.preco||''}" min="0" step="0.01"
             oninput="facturaItens[${i}].preco=Number(this.value);calcTotal()" style="width:130px;">
      <span style="width:110px;text-align:right;font-weight:700;font-size:13px;">${fmtMoney(item.qty*(item.preco||0))}</span>
      ${facturaItens.length>1?`<button class="btn-a del" onclick="removerItem(${i})" style="padding:4px 8px;">✕</button>`:'<span style="width:36px;"></span>'}
    </div>`).join('')
  calcTotal()
}

window.calcTotal = function() {
  const sub = facturaItens.reduce((s,i)=>s+i.qty*(i.preco||0),0)
  const iva  = document.getElementById('factura-iva')?.checked ? sub*0.17 : 0
  document.getElementById('factura-subtotal').textContent = fmtMoney(sub)
  document.getElementById('factura-iva-val').textContent  = fmtMoney(iva)
  document.getElementById('factura-total').textContent    = fmtMoney(sub+iva)
}

window.emitirFactura = async function() {
  const clienteNome = document.getElementById('fac-cliente-nome').value.trim()
  if (!clienteNome) { alert('Preenche o nome do cliente.'); return }
  if (facturaItens.every(i=>!i.desc)) { alert('Adiciona pelo menos um item.'); return }

  const sub    = facturaItens.reduce((s,i)=>s+i.qty*(i.preco||0),0)
  const comIva = document.getElementById('factura-iva').checked
  const iva    = comIva ? sub*0.17 : 0
  const total  = sub+iva

  // Gerar número sequencial
  const { count } = await sb.from('facturas').select('*', { count:'exact', head:true })
  const numero = `EL-${new Date().getFullYear()}-${String((count||0)+1).padStart(4,'0')}`

  const { data, error } = await sb.from('facturas').insert({
    numero, cliente_nome: clienteNome,
    cliente_tel:   document.getElementById('fac-cliente-tel').value.trim(),
    cliente_email: document.getElementById('fac-cliente-email').value.trim(),
    cliente_nuit:  document.getElementById('fac-cliente-nuit').value.trim(),
    itens: JSON.stringify(facturaItens),
    subtotal: sub, iva, total,
    forma_pag: document.getElementById('fac-forma').value,
    notas:     document.getElementById('fac-notas').value.trim(),
    estado: 'emitida'
  }).select().single()

  if (error) { showToast('Erro ao emitir factura.','error'); return }
  closeDrawer('drawer-factura')
  showToast(`Factura ${numero} emitida com sucesso.`)
  facturaItens = [{ desc:'', qty:1, preco:0 }]
  renderFacturas()
}

window.verFactura = async function(id) {
  const { data:f } = await sb.from('facturas').select('*').eq('id',id).single()
  if (!f) return
  const itens = typeof f.itens==='string' ? JSON.parse(f.itens) : f.itens
  const win = window.open('','_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Factura ${f.numero}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:720px;margin:0 auto;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:3px solid #c9a227;padding-bottom:20px;}
      .logo{font-size:24px;font-weight:900;} .logo span{color:#c9a227;}
      .tagline{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em;}
      .num{font-size:28px;font-weight:900;color:#c9a227;}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}
      .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:6px;}
      table{width:100%;border-collapse:collapse;margin-bottom:20px;}
      th{background:#08132b;color:#f0c24b;padding:9px 12px;text-align:left;font-size:12px;text-transform:uppercase;}
      td{padding:9px 12px;border-bottom:1px solid #e2e7f0;font-size:13px;}
      .totals{width:280px;margin-left:auto;}
      .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;}
      .total-final{font-size:18px;font-weight:900;border-top:2px solid #c9a227;padding-top:8px;margin-top:4px;}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e7f0;font-size:11px;color:#888;text-align:center;}
      @media print{body{padding:20px;}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="logo">Electro<span>Link</span></div>
        <div class="tagline">Energia · Redes · Confiança</div>
        <div style="margin-top:10px;font-size:12px;color:#555;">[Morada da empresa]<br>[Telefone] · [Email]<br>NUIT: [NUIT]</div>
      </div>
      <div style="text-align:right;">
        <div class="num">${f.numero}</div>
        <div style="font-size:12px;color:#555;margin-top:4px;">Data: ${fmtDate(f.data_emissao)}<br>Estado: <strong>${f.estado}</strong></div>
      </div>
    </div>
    <div class="grid2">
      <div><div class="section-label">Facturado a</div>
        <strong>${f.cliente_nome}</strong><br>
        ${f.cliente_tel?f.cliente_tel+'<br>':''}
        ${f.cliente_email?f.cliente_email+'<br>':''}
        ${f.cliente_nuit?'NUIT: '+f.cliente_nuit:''}
      </div>
      <div><div class="section-label">Forma de pagamento</div>
        <strong>${f.forma_pag||'—'}</strong>
      </div>
    </div>
    <table>
      <thead><tr><th>Descrição</th><th>Qtd</th><th>Preço unit.</th><th>Total</th></tr></thead>
      <tbody>
        ${itens.map(i=>`<tr><td>${i.desc}</td><td>${i.qty}</td><td>${fmtMoney(i.preco)}</td><td><strong>${fmtMoney(i.qty*i.preco)}</strong></td></tr>`).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${fmtMoney(f.subtotal)}</span></div>
      ${f.iva>0?`<div class="total-row"><span>IVA (17%)</span><span>${fmtMoney(f.iva)}</span></div>`:''}
      <div class="total-row total-final"><span>TOTAL</span><span style="color:#c9a227;">${fmtMoney(f.total)}</span></div>
    </div>
    ${f.notas?`<div style="margin-top:20px;padding:12px;background:#f6f8fc;border-radius:8px;font-size:13px;"><strong>Notas:</strong> ${f.notas}</div>`:''}
    <div class="footer">ElectroLink Mozambique · Maputo, Moçambique · © ${new Date().getFullYear()}</div>
    <div style="margin-top:30px;text-align:center;"><button onclick="window.print()" style="background:#c9a227;border:none;padding:10px 24px;border-radius:6px;font-weight:700;cursor:pointer;">Imprimir / Guardar PDF</button></div>
  </body></html>`)
  win.document.close()
}

window.marcarPago = async function(id) {
  await sb.from('facturas').update({ estado:'pago' }).eq('id',id)
  showToast('Factura marcada como paga.'); renderFacturas()
}

async function renderFacturas() {
  const tbody = document.getElementById('facturas-tbody')
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--gray-400);">A carregar…</td></tr>`
  const { data } = await sb.from('facturas').select('*').order('created_at', { ascending:false })
  if (!data||!data.length) { tbody.innerHTML = emptyRow(7,'Sem facturas','Emite a primeira factura com o botão acima.'); return }
  tbody.innerHTML = data.map(f => `
    <tr>
      <td><strong>${f.numero}</strong></td>
      <td>${f.cliente_nome}</td>
      <td class="muted">${fmtDate(f.data_emissao)}</td>
      <td class="muted">${f.forma_pag||'—'}</td>
      <td><strong style="color:var(--gold);">${fmtMoney(f.total)}</strong></td>
      <td><span class="badge ${badgeClass(f.estado)}">${f.estado}</span></td>
      <td><div class="actions">
        <button class="btn-a view" onclick="verFactura('${f.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Ver
        </button>
        ${f.estado!=='pago'?`<button class="btn-a approve" onclick="marcarPago('${f.id}')">✓ Pago</button>`:''}
      </div></td>
    </tr>`).join('')
}

/* ══ EXPORTAR EXCEL ══ */
window.exportarExcel = async function() {
  const { data } = await sb.from('transacoes').select('*').order('data_transacao', { ascending:false })
  if (!data||!data.length) { showToast('Sem transacções para exportar.','error'); return }

  const rows = [['Data','Tipo','Descrição','Categoria','Cliente','Forma Pagamento','Valor (MT)','Notas']]
  data.forEach(t => rows.push([
    t.data_transacao, t.tipo, t.descricao, t.categoria||'', t.cliente_nome||'',
    t.forma_pag||'', Number(t.valor).toFixed(2), t.notas||''
  ]))

  // Calcular totais
  const receitas = data.filter(t=>t.tipo==='receita').reduce((s,t)=>s+Number(t.valor),0)
  const despesas = data.filter(t=>t.tipo==='despesa').reduce((s,t)=>s+Number(t.valor),0)
  rows.push([])
  rows.push(['','','','','','TOTAL RECEITAS','',receitas.toFixed(2)])
  rows.push(['','','','','','TOTAL DESPESAS','',despesas.toFixed(2)])
  rows.push(['','','','','','SALDO','', (receitas-despesas).toFixed(2)])

  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `electrolink-financeiro-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
  showToast('Relatório exportado com sucesso.')
}

/* ══ STATS DASHBOARD ══ */
async function updateStats() {
  const [{ count:nc }, { count:nv }, { count:ncand }] = await Promise.all([
    sb.from('clientes').select('*',{count:'exact',head:true}),
    sb.from('vagas').select('*',{count:'exact',head:true}).eq('estado','aberta'),
    sb.from('candidaturas').select('*',{count:'exact',head:true}).eq('estado','pendente'),
  ])
  document.getElementById('badge-clientes').textContent     = nc||0
  document.getElementById('badge-vagas').textContent        = nv||0
  document.getElementById('badge-candidaturas').textContent = ncand||0
  document.getElementById('stat-clientes').textContent      = nc||0
  document.getElementById('stat-vagas').textContent         = nv||0
  document.getElementById('stat-candidaturas').textContent  = ncand||0
}

/* ══ MAIN SITE — Candidatura via Supabase ══ */
window.submeterCandidatura = async function(vagaId, vagaTitulo, dados) {
  await sb.from('candidaturas').insert({ vaga_id:vagaId, vaga_titulo:vagaTitulo, ...dados, estado:'pendente' })
}

/* ══ RENDER ALL ══ */
async function renderAll() {
  const active = document.querySelector('.panel.active')?.id?.replace('panel-','')
  await updateStats()
  if (active==='dashboard')    { await renderCandidaturas() }
  if (active==='clientes')     { await renderClientes() }
  if (active==='vagas')        { await renderVagas() }
  if (active==='candidaturas') { await renderCandidaturas() }
  if (active==='financeiro')   { await renderFinanceiro() }
  if (active==='facturas')     { await renderFacturas() }
}

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', () => {
  checkSession()

  // Toggle password
  const toggle  = document.getElementById('pwToggle')
  const pwInput = document.getElementById('loginPassword')
  if (toggle && pwInput) {
    toggle.addEventListener('click', () => {
      const show = pwInput.type==='password'
      pwInput.type = show ? 'text' : 'password'
    })
  }

  // Inicializar itens da factura
  renderItensFactura()

  // Mês actual no filtro
  const mesInput = document.getElementById('tr-mes-filtro')
  if (mesInput) mesInput.value = new Date().toISOString().slice(0,7)
})
