/* ElectroLink — main.js */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
const sb = createClient('https://svvtdehfwdghsezafhgx.supabase.co','sb_publishable_mVp27CQVZFWlZqRzSDkgaA_HERxV2r_')

document.addEventListener('DOMContentLoaded', () => {

  /* ── REVEAL ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
  }, { threshold:0.1 })
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))

  /* ── MENU MOBILE ── */
  const burger     = document.getElementById('burger')
  const mobileMenu = document.getElementById('mobileMenu')

  function closeMenu() {
    mobileMenu.classList.remove('open')
    burger.setAttribute('aria-expanded','false')
    const s = burger.querySelectorAll('span')
    s[0].style.transform=''; s[1].style.opacity=''; s[2].style.transform=''
  }

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open')
    burger.setAttribute('aria-expanded', isOpen)
    const s = burger.querySelectorAll('span')
    if (isOpen) {
      s[0].style.transform='rotate(45deg) translate(5px,5px)'
      s[1].style.opacity='0'
      s[2].style.transform='rotate(-45deg) translate(5px,-5px)'
    } else { s[0].style.transform=''; s[1].style.opacity=''; s[2].style.transform='' }
  })
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu))
  const mobileCta = document.getElementById('mobileCta')
  if (mobileCta) mobileCta.addEventListener('click', closeMenu)

  /* ── MODAL OPORTUNIDADES ── */
  const modalOp  = document.getElementById('modalOportunidades')
  const closeBtn = document.getElementById('modalCloseBtn')

  async function openOportunidades(e) {
    if (e) e.preventDefault()
    modalOp.classList.add('open')
    document.body.style.overflow = 'hidden'
    await renderVagasPublicas()
  }
  function closeOportunidades() {
    modalOp.classList.remove('open')
    document.body.style.overflow = ''
  }

  document.querySelectorAll('.js-open-oportunidades').forEach(b => b.addEventListener('click', openOportunidades))
  if (closeBtn) closeBtn.addEventListener('click', closeOportunidades)
  if (modalOp)  modalOp.addEventListener('click', e => { if (e.target===modalOp) closeOportunidades() })

  /* ── MODAL VÍDEO ── */
  const videoModal = document.getElementById('videoModal')
  const videoEl    = document.getElementById('presentationVideo')
  const btnPlay    = document.getElementById('btnPlay')
  const closeVid   = document.getElementById('videoModalClose')

  if (btnPlay) btnPlay.addEventListener('click', () => {
    videoModal.classList.add('open')
    document.body.style.overflow = 'hidden'
    if (videoEl) videoEl.play().catch(()=>{})
  })
  function closeVideo() {
    videoModal.classList.remove('open')
    document.body.style.overflow = ''
    if (videoEl) { videoEl.pause(); videoEl.currentTime=0 }
  }
  if (closeVid)   closeVid.addEventListener('click', closeVideo)
  if (videoModal) videoModal.addEventListener('click', e => { if (e.target===videoModal) closeVideo() })

  /* ── FAQ ── */
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item')
      const isOpen = item.classList.contains('open')
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'))
      if (!isOpen) item.classList.add('open')
    })
  })

  /* ── FORMULÁRIO CONTACTO ── */
  const form = document.getElementById('contactForm')
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault()
      const btn = form.querySelector('button[type="submit"]')
      btn.textContent = 'A enviar…'; btn.disabled = true

      const nome     = form.querySelector('input[name="nome"]')?.value.trim() || ''
      const tel      = form.querySelector('input[name="telefone"]')?.value.trim() || ''
      const email    = form.querySelector('input[name="email"]')?.value.trim() || ''
      const servico  = form.querySelector('select[name="servico"]')?.value || ''
      const local    = form.querySelector('input[name="localidade"]')?.value.trim() || ''
      const mensagem = form.querySelector('textarea[name="mensagem"]')?.value.trim() || ''

      try {
        // 1. Enviar para Formspree
        const res = await fetch('https://formspree.io/f/xlgyalaj', {
          method:'POST', body:new FormData(form), headers:{ 'Accept':'application/json' }
        })
        if (!res.ok) throw new Error()

        // 2. Guardar no Supabase
        await sb.from('clientes').insert({
          nome: nome||'Sem nome', tel: tel||'—', email, servico: servico||'Contacto via website',
          local, obs: mensagem, estado:'activo', origem:'Formulário de contacto'
        })

        btn.textContent='Mensagem enviada ✓'; btn.style.background='#1e8f4e'; btn.style.color='#fff'
        form.reset()
        setTimeout(() => { btn.textContent='Enviar pedido'; btn.disabled=false; btn.style.background=''; btn.style.color='' }, 4000)
      } catch(_) {
        btn.textContent='Erro — tenta novamente'; btn.style.background='#c0392b'; btn.style.color='#fff'
        btn.disabled=false
        setTimeout(() => { btn.textContent='Enviar pedido'; btn.style.background=''; btn.style.color='' }, 3000)
      }
    })
  }

  /* ── ESC ── */
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') { closeOportunidades(); closeVideo() }
  })

  renderVagasPublicas()
})

/* ── VAGAS PÚBLICAS ── */
async function renderVagasPublicas() {
  const container = document.getElementById('jobs-list-public')
  if (!container) return
  container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">A carregar…</p>'
  const { data } = await sb.from('vagas').select('*').eq('estado','aberta').order('created_at',{ascending:false})
  if (!data||!data.length) {
    container.innerHTML='<p class="jobs-empty-note">Não há vagas abertas neste momento. Consulta esta página regularmente.</p>'
    return
  }
  container.innerHTML = data.map(v => `
    <div class="job-row">
      <div>
        <div class="job-top-line">
          <span class="job-org">ElectroLink</span>
          <span class="job-city">📍 ${v.local||'Maputo'}</span>
          <span class="job-status open">Aberta</span>
        </div>
        <h3>${v.titulo}</h3>
        <p>${v.descricao.length>180?v.descricao.slice(0,180)+'…':v.descricao}</p>
        ${v.prazo?`<p class="job-deadline">Prazo: <b>${new Date(v.prazo).toLocaleDateString('pt-MZ',{day:'2-digit',month:'short',year:'numeric'})}</b></p>`:''}
      </div>
      <div class="job-side">
        <button class="btn btn-gold" style="padding:10px 20px;font-size:14px;" onclick="abrirCandidatura('${v.id}','${(v.titulo||'').replace(/'/g,"\\'")}')">
          Candidatar-me
        </button>
      </div>
    </div>`).join('')
}

window.abrirCandidatura = function(vagaId, vagaTitulo) {
  document.getElementById('cand-vaga-id').value          = vagaId
  document.getElementById('cand-vaga-titulo').value       = vagaTitulo
  document.getElementById('cand-vaga-label').textContent  = vagaTitulo
  document.getElementById('candidaturaDrawer').classList.add('open')
  document.body.style.overflow = 'hidden'
}

window.fecharCandidatura = function() {
  document.getElementById('candidaturaDrawer').classList.remove('open')
  document.body.style.overflow = ''
}

window.submeterCandidatura = async function(e) {
  e.preventDefault()
  const btn = e.target.querySelector('button[type="submit"]')
  btn.textContent='A enviar…'; btn.disabled=true

  const dados = {
    vaga_id:     document.getElementById('cand-vaga-id').value || null,
    vaga_titulo: document.getElementById('cand-vaga-titulo').value,
    nome:        document.getElementById('cand-nome').value.trim(),
    email:       document.getElementById('cand-email').value.trim(),
    tel:         document.getElementById('cand-tel').value.trim(),
    local:       document.getElementById('cand-local').value.trim(),
    carta:       document.getElementById('cand-carta').value.trim(),
    estado:      'pendente'
  }

  if (!dados.nome||!dados.email) { btn.textContent='Enviar candidatura'; btn.disabled=false; return }

  const { error } = await sb.from('candidaturas').insert(dados)
  if (error) {
    btn.textContent='Erro — tenta novamente'; btn.disabled=false; return
  }

  window.fecharCandidatura()
  alert('Candidatura enviada com sucesso! Entraremos em contacto em breve.')
  document.getElementById('formCandidatura').reset()
  btn.textContent='Enviar candidatura'; btn.disabled=false
}
