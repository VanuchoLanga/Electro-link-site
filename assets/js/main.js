/* ElectroLink — main.js */

document.addEventListener('DOMContentLoaded', () => {

  /* ── REVEAL AO SCROLL ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ── MENU MOBILE ── */
  const burger     = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  function openMenu() {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
    const s = burger.querySelectorAll('span');
    s[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    s[1].style.opacity   = '0';
    s[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');
    const s = burger.querySelectorAll('span');
    s[0].style.transform = '';
    s[1].style.opacity   = '';
    s[2].style.transform = '';
  }

  burger.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Fechar ao clicar num link
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      closeMenu();
      // pequeno delay para o scroll funcionar
      setTimeout(() => {}, 100);
    });
  });

  /* ── MODAL OPORTUNIDADES ── */
  const modalOp  = document.getElementById('modalOportunidades');
  const closeBtn = document.getElementById('modalCloseBtn');

  function openOportunidades(e) {
    if (e) e.preventDefault();
    modalOp.classList.add('open');
    modalOp.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    renderVagasPublicas();
  }
  function closeOportunidades() {
    modalOp.classList.remove('open');
    modalOp.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('.js-open-oportunidades').forEach(b => b.addEventListener('click', openOportunidades));
  closeBtn.addEventListener('click', closeOportunidades);
  modalOp.addEventListener('click', e => { if (e.target === modalOp) closeOportunidades(); });

  /* ── MODAL VÍDEO ── */
  const videoModal = document.getElementById('videoModal');
  const videoEl    = document.getElementById('presentationVideo');
  const btnPlay    = document.getElementById('btnPlay');
  const closeVid   = document.getElementById('videoModalClose');

  btnPlay.addEventListener('click', () => {
    videoModal.classList.add('open');
    document.body.classList.add('modal-open');
    videoEl.play().catch(() => {});
  });
  function closeVideo() {
    videoModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    videoEl.pause();
    videoEl.currentTime = 0;
  }
  closeVid.addEventListener('click', closeVideo);
  videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideo(); });

  /* ── FAQ ── */
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item   = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── FORMULÁRIO CONTACTO ── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'A enviar…'; btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Enviado ✓'; btn.style.background = '#1e8f4e';
        form.reset();
        setTimeout(() => { btn.textContent = 'Enviar pedido'; btn.disabled = false; btn.style.background = ''; }, 3000);
      }, 1200);
    });
  }

  /* ── ESC fecha tudo ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeOportunidades(); closeVideo(); closeMenu(); }
  });

  /* ── VAGAS PÚBLICAS ── */
  renderVagasPublicas();
});

/* ── VAGAS (lidas do localStorage preenchido pelo admin) ── */
function renderVagasPublicas() {
  const container = document.getElementById('jobs-list-public');
  if (!container) return;
  let db;
  try { db = JSON.parse(localStorage.getItem('electrolink_admin_db')) || {}; }
  catch { db = {}; }
  const vagas = (db.vagas || []).filter(v => v.estado === 'aberta');
  if (!vagas.length) {
    container.innerHTML = '<p class="jobs-empty-note">Não há vagas abertas neste momento. Consulta esta página regularmente.</p>';
    return;
  }
  container.innerHTML = vagas.map(v => `
    <div class="job-row">
      <div>
        <div class="job-top-line">
          <span class="job-org">ElectroLink</span>
          <span class="job-city">📍 ${v.local || 'Maputo'}</span>
          <span class="job-status open">Aberta</span>
        </div>
        <h3>${v.titulo}</h3>
        <p>${v.desc.length > 180 ? v.desc.slice(0,180) + '…' : v.desc}</p>
        ${v.prazo ? `<p class="job-deadline">Prazo: <b>${new Date(v.prazo).toLocaleDateString('pt-MZ',{day:'2-digit',month:'short',year:'numeric'})}</b></p>` : ''}
      </div>
      <div class="job-side">
        <button class="btn btn-gold" style="padding:10px 20px;font-size:14px;" onclick="abrirCandidatura('${v.id}','${(v.titulo||'').replace(/'/g,"\\'")}')">
          Candidatar-me
        </button>
      </div>
    </div>
  `).join('');
}

function abrirCandidatura(vagaId, vagaTitulo) {
  document.getElementById('cand-vaga-id').value     = vagaId;
  document.getElementById('cand-vaga-titulo').value  = vagaTitulo;
  document.getElementById('cand-vaga-label').textContent = vagaTitulo;
  document.getElementById('candidaturaDrawer').classList.add('open');
  document.body.classList.add('modal-open');
}

function fecharCandidatura() {
  document.getElementById('candidaturaDrawer').classList.remove('open');
  document.body.classList.remove('modal-open');
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
  db.candidaturas.push({ id: Date.now().toString(36), ...dados, estado:'pendente', data: new Date().toISOString() });
  localStorage.setItem('electrolink_admin_db', JSON.stringify(db));
  fecharCandidatura();
  alert('Candidatura enviada com sucesso! Entraremos em contacto em breve.');
  document.getElementById('formCandidatura').reset();
}
