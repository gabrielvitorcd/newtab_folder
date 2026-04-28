# FolderTab
 
> Substitua sua nova aba por um painel de pastas inteligente. Abra conjuntos inteiros de sites com um clique.

<img width="1920" height="1045" alt="image" src="https://github.com/user-attachments/assets/c48dc090-3bc1-47d8-88aa-ba8352e7f9ff" />

 
---
 
## O problema
 
Todo desenvolvedor tem aquela rotina: abre o navegador, e começa a abrir site por site manualmente.
 
No meu caso eram dois contextos completamente diferentes dependendo do dia:
 
- **Modo faculdade** → portal da faculdade, Google Classroom, Drive, email institucional
- **Modo desenvolvimento** → GitHub, Jira, localhost:3000, Figma, documentações
Toda manhã, a mesma sequência repetitiva de cliques. Pequeno, mas irritante.
 
O FolderTab nasceu disso.
 
---
 
## O que é
 
Uma extensão Chrome que substitui a página de nova aba por um painel organizado em **pastas hierárquicas**. Cada pasta agrupa sites relacionados. Um clique abre todos de uma vez.
 
---
## Features
 
- 📂 **Pastas hierárquicas** — organize sites em contextos (Faculdade, Dev, Utils...)
- ⚡ **Abrir tudo** — abre todas as abas de uma pasta com um clique
- 🔍 **Busca rápida** — encontra qualquer site ou pasta instantaneamente
- ⭐ **Acesso rápido** — fixe os sites mais usados no topo
- 🕐 **Relógio** — exibe hora atual na interface
- 💾 **Persistência local** — tudo salvo via `chrome.storage.sync`, sincroniza entre dispositivos
- 🎨 **Tema escuro** — interface limpa, sem distrações

---

## Stack
 
- **HTML + CSS + JavaScript puro** — sem frameworks, sem build tools
- **Chrome Extension Manifest V3**
- **`chrome.storage.sync`** — persistência nativa do Chrome
- **Google Favicons API** — ícones automáticos para cada site
> Decisão intencional: zero dependências. A extensão instala em segundos e nunca vai quebrar por causa de um `npm install` mal feito.

---
 
## Instalação

### Via Chrome Web Store
*(em breve)*
 
### Manual (Developer Mode)
 
```bash
git clone https://github.com/gabrielvitorcd/newtab_folder
```
 
1. Acesse `chrome://extensions/`
2. Ative o **Modo desenvolvedor** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta do projeto
Pronto. Abra uma nova aba.
 
---
 
## Como usar
 
### Criar uma pasta
Clique no `+` no painel lateral → dê um nome → adicione sites.
 
### Abrir todos os sites de uma pasta
Duas formas:
- Selecione os sites desejados e clique em **"Abrir todas"** no canto da pasta
- Clique na pasta com o **botão do scroll do mouse** para abrir tudo de uma vez
 
### Acesso rápido
Fixe qualquer site no topo para acessar sem navegar nas pastas.
 
### Busca
Clique na barra de busca → digite o nome do site ou pasta.

---

 
## Features Futuras Planejadas
 
### 🔒 Pasta Segura
Pastas protegidas com senha e criptografia via **Web Crypto API (AES-GCM)** — ideal para links sensíveis como internet banking, documentos fiscais ou ambientes de trabalho privados. Os dados são criptografados localmente no próprio browser, sem nenhum servidor envolvido.
 
### 📸 Captura de Janela
Um botão na extensão captura todas as abas abertas na janela atual (exceto a própria extensão) e cria automaticamente uma nova pasta com todos esses sites. Ideal para salvar um contexto de trabalho em andamento sem perder nenhuma aba.
 
 
---
## Licença
 
MIT — use, modifique, distribua.
 
---
 
*Feito por [Gabriel Vitor](https://github.com/gabrielvitorcd) — um problema do meu dia a dia virou um projeto de portfólio.*
 
