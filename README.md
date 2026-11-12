<div align="center">

<img src="assets/banner.svg" alt="Pixabay Smart Organizer Banner" width="100%" />

# ⚡ PIXABAY SMART ORGANIZER
### *A Extensão Quântica para Downloads Inteligentes de Áudios, Músicas e Trilhas*

[![GitHub Stars](https://img.shields.io/github/stars/DLMIDIA/pixabay-smart-organizer?style=for-the-badge&color=00ab6b)](https://github.com/DLMIDIA/pixabay-smart-organizer/stargazers)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-00ab6b?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Official Sponsor](https://img.shields.io/badge/Official%20Sponsor-Pixabay-00ab6b?style=for-the-badge&logo=pixabay&logoColor=white)](https://pixabay.com)
[![Collaborator](https://img.shields.io/badge/Collaborator-Google%20Antigravity-38bdf8?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-818cf8?style=for-the-badge)]()

<br>

<p align="center">
  <b>Diga adeus ao caos na sua pasta de Downloads.</b><br>
  Toda vez que você pesquisa por <i>"comercial"</i>, <i>"marcha"</i>, <i>"podcast"</i> ou <i>"vinheta"</i> no Pixabay,<br>
  seus arquivos são capturados com o <b>título real da música</b> e salvos na pasta exata do projeto — ou sincronizados automaticamente na nuvem do seu <b>Google Drive</b>!
</p>

---

[🎮 Interface em Ação](#-interface-em-ação) •
[🏗️ Como Funciona](#-como-funciona-o-fluxo-de-dados) •
[✨ Super Recursos](#-super-recursos) •
[☁️ Sincronização Google Drive](#️-a-mágica-do-google-drive-na-nuvem) •
[🚀 Instalação](#-instalação-rápida-no-chrome) •
[🤝 Patrocinador & Parceiros](#-patrocinador-oficial--co-laboratórios) •
[📚 Referências](#-referências-de-código-aberto)

---

</div>

<br>

## 🎮 Interface em Ação

<div align="center">
  <img src="assets/preview-ui.svg" alt="Pixabay Smart Organizer Interface Preview" width="100%" />
</div>

> **Na tela do Pixabay:** Quando você clica em baixar qualquer faixa, um Toast flutuante avisa exatamente o caminho onde o arquivo foi salvo.  
> **No Painel da Extensão:** Você escolhe com um clique a pasta de destino (`Google Drive`, `Pixabay`, `Comerciais`) e seleciona categorias rápidas.

---

## 🏗️ Como Funciona o Fluxo de Dados

<div align="center">
  <img src="assets/architecture.svg" alt="Diagrama de Arquitetura de Dados" width="100%" />
</div>

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Usuário
    participant Web as 🌐 Pixabay (Página SPA)
    participant Content as 🏷️ Content Script
    participant BG as 🛸 Service Worker (MV3)
    participant Mac as 🍎 Ponte macOS (Symlink)
    participant Drive as ☁️ Google Drive Nuvem

    User->>Web: Pesquisa "comercial" e clica em Baixar
    Web->>Content: Evento de clique interceptado
    Content->>Content: Extrai título do card ("Upbeat Energy")
    Content->>User: Exibe Toast com feedback visual
    Content->>BG: Dispara REGISTER_DOWNLOAD_INTENT
    BG->>BG: onDeterminingFilename higieniza o caminho
    BG->>Mac: Grava em Downloads/GoogleDrive-Pixabay/Comercial/
    Mac->>Drive: Encaminha em tempo real para 00 - DL MIDIA/Trilhas Pixabay
    Drive-->>User: ✅ Arquivo sincronizado com toda a equipe!
```

---

## ✨ Super Recursos

| Recurso | Descrição |
| :--- | :--- |
| **🧠 Detecção Semântica SPA** | Lê URLs dinâmicas do Pixabay (`/music/search/...`, `/sound-effects/...`, tags de gênero e query strings) sem recarregar a página. |
| **🎵 DOM Player Scraper** | Extrai o título real e autor exibidos no card do Pixabay, aposentando códigos genéricos como `music-139029.mp3`. |
| **☁️ Ponte Google Drive** | Integração nativa no macOS que canaliza os downloads para os Discos Compartilhados da DL Mídia. |
| **🛡️ Escudo de Sanitização** | Remove caracteres ilegais (`< > : " / \ \| ? *`), garantindo compatibilidade total no Windows, macOS e Linux. |
| **🎛️ Painel Popup Moderno** | Toggle On/Off instantâneo, botões de pastas rápidas, tags de 1 clique e histórico colapsável para zero poluição visual. |

---

## ☁️ A Mágica do Google Drive na Nuvem

Por segurança, extensões do Chrome não podem salvar arquivos fora da pasta de downloads. **Nós superamos essa limitação com uma ponte de kernel no macOS**:

Um atalho de sistema (`symlink`) que liga sua pasta `Downloads/GoogleDrive-Pixabay` diretamente ao seu Google Drive:

```bash
ln -snf "/Users/SEU_USUARIO/Library/CloudStorage/GoogleDrive-SUA_CONTA/Discos partilhados/2026 - DRIVE - DL MIDIA/00 - DL MIDIA/Trilhas Pixabay" ~/Downloads/GoogleDrive-Pixabay
```

Quando a extensão baixa uma trilha para `GoogleDrive-Pixabay/Comercial/`, o macOS faz o desvio instantâneo para dentro da nuvem corporativa!

---

## 🚀 Instalação Rápida no Chrome

Não precisa compilar nada. É Vanilla JavaScript puro:

```bash
# 1. Clone o repositório
git clone https://github.com/DLMIDIA/pixabay-smart-organizer.git
```

1. Abra o Google Chrome e digite na barra de endereços:
   ```text
   chrome://extensions/
   ```
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"**.
3. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (*Load unpacked*).
4. Selecione a pasta clonada `pixabay-smart-organizer`.
5. Fixe o ícone verde na sua barra de extensões.

---

## 🤝 Patrocinador Oficial & Co-Laboratórios

<div align="center">
  <img src="assets/sponsors.svg" alt="Patrocinadores e Colaboradores Oficiais" width="100%" />
</div>

<br>

| Organização | Papel no Projeto | Contribuição |
| :--- | :--- | :--- |
| **[Pixabay.com](https://pixabay.com)** | 👑 **Patrocinador Oficial de Conteúdo** | Provedor do maior acervo livre de direitos autorais de trilhas sonoras e efeitos do mundo. |
| **[Google Antigravity & DeepMind](https://deepmind.google)** | 🛸 **IA & Engenharia Autônoma** | Arquitetura agentic, orquestração de microsserviços de navegador e síntese de código Manifest V3. |
| **[DL MÍDIA Group](https://dlmidia.com.br)** | ⚡ **Iniciativa Criativa & Produção** | Concepção, validação de workflow publicitário e aplicação prática em estúdios de produção. |

---

## 📚 Referências de Código Aberto

Este projeto foi construído respeitando e referenciando grandes contribuições da comunidade open-source:

* 📦 **[FButros / DownloadsOrganiser](https://github.com/FButros/DownloadsOrganiser):** Padrão de roteamento de arquivos em extensões Chromium.
* 📦 **[unintended / download-organizer-chrome-extension](https://github.com/unintended/download-organizer-chrome-extension):** Filosofia de regex dinâmico para subpastas.
* 📦 **[aidandj / Chrome-Download-Organizer](https://github.com/aidandj/Chrome-Download-Organizer):** Tratamento assíncrono de downloads no navegador.
* 📦 **[rpawk / image_downloader](https://github.com/rpawk/image_downloader):** Técnicas de extração direta de mídias stock.
* 📖 **[Chromium Downloads API Documentation](https://developer.chrome.com/docs/extensions/reference/api/downloads):** Especificação oficial `onDeterminingFilename`.

---

## 📄 Licença

Distribuído sob a licença **MIT** de código aberto. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

<div align="center">
  <sub>Desenvolvido com tecnologia, paixão criativa e inteligência artificial • 2026</sub>
</div>
