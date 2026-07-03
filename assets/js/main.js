/* ═══════════════════════════════════════════════
   ElectroLink — main.js
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── REVEAL AO SCROLL ──────────────────────────
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  // ── MOBILE NAV ────────────────────────────────
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  // ── HEADER SCROLL ─────────────────────────────
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.background = window.scrollY > 40
        ? 'rgba(8,19,43,0.99)'
        : 'rgba(8,19,43,0.97)';
    }, { passive: true });
  }

  // ── MODAL OPORTUNIDADES ───────────────────────
  const modalOp      = document.getElementById('modalOportunidades');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const openBtns     = document.querySelectorAll('.js-open-oportunidades');

  function openModal() {
    if (!modalOp) return;
    modalOp.classList.add('open');
    modalOp.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    if (!modalOp) return;
    modalOp.classList.remove('open');
    modalOp.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  openBtns.forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOp) modalOp.addEventListener('click', (e) => { if (e.target === modalOp) closeModal(); });

  // ── MODAL VÍDEO ───────────────────────────────
  const videoModal      = document.getElementById('videoModal');
  const presentationVid = document.getElementById('presentationVideo');
  const btnPlay         = document.getElementById('btnPlay');
  const videoClose      = document.getElementById('videoModalClose');

  function openVideoModal() {
    if (!videoModal) return;
    videoModal.classList.add('open');
    document.body.classList.add('modal-open');
    if (presentationVid) presentationVid.play().catch(() => {});
  }
  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (presentationVid) { presentationVid.pause(); presentationVid.currentTime = 0; }
  }

  if (btnPlay)     btnPlay.addEventListener('click', openVideoModal);
  if (videoClose)  videoClose.addEventListener('click', closeVideoModal);
  if (videoModal)  videoModal.addEventListener('click', (e) => { if (e.target === videoModal) closeVideoModal(); });

  // ── FAQ ───────────────────────────────────────
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ── FORMULÁRIO DE CONTACTO ────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'A enviar…';
      btn.disabled = true;
      // Integração futura: substituir por fetch para backend ou Formspree
      setTimeout(() => {
        btn.textContent = 'Mensagem enviada ✓';
        btn.style.background = '#1e8f4e';
        contactForm.reset();
        setTimeout(() => { btn.textContent = original; btn.disabled = false; btn.style.background = ''; }, 3000);
      }, 1200);
    });
  }

  // ── VAGAS DO SITE (lidas do localStorage) ────
  renderVagasPublicas();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeVideoModal(); }
  });
});

// ── VAGAS PÚBLICAS (preenchidas pelo admin) ────────
function renderVagasPublicas() {
  const container = document.getElementById('jobs-list-public');
  if (!container) return;

  let db;
  try { db = JSON.parse(localStorage.getItem('electrolink_admin_db')) || {}; }
  catch { db = {}; }

  const vagas = (db.vagas || []).filter(v => v.estado === 'aberta');

  if (!vagas.length) {
    container.innerHTML = `<p class="jobs-empty-note">Não há vagas abertas neste momento. Consulta esta página regularmente.</p>`;
    return;
  }

  container.innerHTML = vagas.map(v => `
    <div class="job-row">
      <div class="job-main">
        <div class="job-top-line">
          <span class="job-org">ElectroLink</span>
          <span class="job-city">📍 ${v.local || 'Maputo'}</span>
          <span class="job-status open">Aberta</span>
        </div>
        <h3>${v.titulo}</h3>
        <p>${v.desc.length > 180 ? v.desc.slice(0,180) + '…' : v.desc}</p>
        ${v.prazo ? `<p class="job-deadline">Prazo: <b>${formatDate(v.prazo)}</b> · ${v.contrato || ''} · ${v.num || 1} vaga(s)</p>` : ''}
      </div>
      <div class="job-side">
        <button class="btn btn-primary job-apply" onclick="abrirCandidatura('${v.id}','${escHtml(v.titulo)}')">
          Candidatar-me
        </button>
      </div>
    </div>
  `).join('');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-MZ', { day:'2-digit', month:'short', year:'numeric' });
}

function escHtml(s) {
  return (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── FORMULÁRIO DE CANDIDATURA ─────────────────────
function abrirCandidatura(vagaId, vagaTitulo) {
  // Abre o formulário de candidatura — implementa um drawer ou redireciona para pages/candidatura.html
  const drawer = document.getElementById('candidaturaDrawer');
  if (drawer) {
    document.getElementById('cand-vaga-id').value    = vagaId;
    document.getElementById('cand-vaga-titulo').value = vagaTitulo;
    document.getElementById('cand-vaga-label').textContent = vagaTitulo;
    drawer.classList.add('open');
    document.body.classList.add('modal-open');
  }
}

function fecharCandidatura() {
  const drawer = document.getElementById('candidaturaDrawer');
  if (drawer) { drawer.classList.remove('open'); document.body.classList.remove('modal-open'); }
}

function submeterCandidatura(e) {
  e.preventDefault();
  const dados = {
    vagaId:     document.getElementById('cand-vaga-id').value,
    vagaTitulo: document.getElementById('cand-vaga-titulo').value,
    nome:       document.getElementById('cand-nome').value.trim(),
    email:      document.getElementById('cand-email').value.trim(),
    tel:        document.getElementById('cand-tel').value.trim(),
    local:      document.getElementById('cand-local').value.trim(),
    carta:      document.getElementById('cand-carta').value.trim(),
  };
  if (!dados.nome || !dados.email) return;

  let db;
  try { db = JSON.parse(localStorage.getItem('electrolink_admin_db')) || { clientes:[], vagas:[], candidaturas:[] }; }
  catch { db = { clientes:[], vagas:[], candidaturas:[] }; }

  db.candidaturas.push({ id: Date.now().toString(36), ...dados, estado:'pendente', data:new Date().toISOString() });
  localStorage.setItem('electrolink_admin_db', JSON.stringify(db));

  fecharCandidatura();
  alert('Candidatura enviada com sucesso! Entraremos em contacto em breve.');
  document.getElementById('formCandidatura').reset();
}
