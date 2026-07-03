# ElectroLink — Site Institucional

## Estrutura do projecto

```
electrolink/
│
├── index.html                  ← Página principal (landing page)
│
├── admin/
│   └── index.html              ← Painel de administração
│
├── assets/
│   ├── css/
│   │   ├── main.css            ← Estilos do site público
│   │   └── admin.css           ← Estilos do painel admin
│   │
│   ├── js/
│   │   ├── main.js             ← Scripts do site público
│   │   └── admin.js            ← Scripts do painel admin
│   │
│   ├── images/
│   │   ├── logo-electrolink.png        ← Logotipo (usar em todos os ecrãs)
│   │   ├── logo-electrolink-dark.png   ← Versão escura (opcional, para footer)
│   │   └── servicos/
│   │       ├── instalacao-electrica.jpg
│   │       ├── projecto-electrico.jpg
│   │       ├── manutencao-electrica.jpg
│   │       └── refrigeracao.jpg
│   │
│   ├── video/
│   │   └── apresentacao.mp4    ← Vídeo de apresentação da empresa
│   │
│   └── fonts/                  ← (reservado para fontes locais, se necessário)
│
└── README.md                   ← Este ficheiro
```

---

## O que preencher antes de publicar

### 1. Logotipo
- Coloca o PNG em `assets/images/logo-electrolink.png`
- Dimensão recomendada: altura entre 38–42px, fundo transparente
- Enquanto não existir, o texto "ElectroLink" aparece automaticamente

### 2. Vídeo de apresentação
- Coloca o ficheiro em `assets/video/apresentacao.mp4`
- Formato MP4, codec H.264 (compatível com todos os browsers)
- O vídeo corre em loop silencioso no fundo do hero
- Ao clicar "Ver apresentação", abre em modal com som e controlos

### 3. Fotos dos serviços
- Coloca as fotos reais em `assets/images/servicos/`
- Nomes exactos: `instalacao-electrica.jpg`, `projecto-electrico.jpg`, `manutencao-electrica.jpg`, `refrigeracao.jpg`
- Dimensão recomendada: 800×450px, formato JPG ou WebP
- Enquanto não existirem, aparece um placeholder cinzento

### 4. Contactos (index.html)
- Linha ~230: número de telefone/WhatsApp
- Linha ~237: endereço de email
- Linha ~244: morada da sede
- Footer: repetir telefone e email

### 5. Depoimentos (index.html)
- Substituir os três blocos "Espaço para depoimento real" por testemunhos reais
- Actualizar as iniciais do avatar (ex: "JS" para João Silva)

### 6. Parceiros (index.html)
- Actualizar os `partner-chip` com os nomes reais dos parceiros

---

## Painel de administração

Acesso: `admin/index.html`

**O painel gere:**
- **Clientes** — registo de clientes e pedidos de orçamento
- **Vagas** — publicar, gerir e encerrar vagas de emprego
- **Candidaturas** — receber, analisar e dar resposta a candidatos

**Dados:** guardados em `localStorage` do browser.
Para uma solução mais robusta (servidor real), o `admin.js` e `main.js` têm
os pontos de integração assinalados com comentários.

---

## Actualizar o site no futuro

- **Novo serviço** → adicionar um `.svc-card` no `index.html` + foto em `assets/images/servicos/`
- **Nova página** → criar ficheiro em `pages/nova-pagina.html` e importar `../assets/css/main.css`
- **Mudar cores** → editar as variáveis CSS em `assets/css/main.css` (bloco `:root`)
- **Nova vaga** → abrir no painel admin — aparece automaticamente no site público
