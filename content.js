/**
 * Pixabay Smart Organizer - Content Script
 * Detecta termos de busca, escuta cliques de download e extrai títulos de faixas no Pixabay.
 */

(function () {
  "use strict";

  let lastKnownSearch = "";
  let toastTimeout = null;

  /**
   * Sanitiza strings para nomes de pastas seguros no macOS, Windows e Linux.
   */
  function sanitizeForPath(str) {
    if (!str) return "";
    return str
      .replace(/[<>:"/\\|?*\x00-\x1F]+/g, " ") // Caracteres inválidos
      .replace(/\s+/g, " ")                   // Espaços duplicados
      .trim();
  }

  /**
   * Detecta o termo de busca ou categoria da página atual do Pixabay.
   */
  function detectSearchTerm() {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    let term = "";

    // 1. Pelo padrão de busca da URL: /music/search/termo/ ou /sound-effects/search/termo/
    const searchMatch = pathname.match(/\/(?:music|sound-effects|images|photos|videos|vectors|illustrations)?\/?search\/([^\/]+)/i);
    if (searchMatch && searchMatch[1]) {
      term = decodeURIComponent(searchMatch[1]).replace(/-/g, " ");
    }

    // 2. Por categorias ou gêneros na URL: /music/genre/cinematic/ ou /sound-effects/category/transition/
    if (!term) {
      const genreMatch = pathname.match(/\/(?:genre|category)\/([^\/]+)/i);
      if (genreMatch && genreMatch[1]) {
        term = decodeURIComponent(genreMatch[1]).replace(/-/g, " ");
      }
    }

    // 3. Pelo parâmetro ?q= ou &q= na query string
    if (!term && searchParams.has("q")) {
      const qVal = searchParams.get("q");
      if (qVal && qVal.trim()) {
        term = qVal.trim();
      }
    }

    // 4. Fallback pelo campo de busca presente na página
    if (!term) {
      const searchInput = document.querySelector('input[type="search"], input[name="search"], input[placeholder*="Search" i], input[placeholder*="Buscar" i]');
      if (searchInput && searchInput.value && searchInput.value.trim()) {
        term = searchInput.value.trim();
      }
    }

    // 5. Se estiver em uma seção sem busca específica (ex: /music/ ou /sound-effects/)
    if (!term) {
      if (pathname.includes("/music")) {
        term = "Musicas";
      } else if (pathname.includes("/sound-effects")) {
        term = "Efeitos Sonoros";
      } else if (pathname.includes("/videos")) {
        term = "Videos";
      }
    }

    const cleanTerm = sanitizeForPath(term);

    if (cleanTerm && cleanTerm !== lastKnownSearch) {
      lastKnownSearch = cleanTerm;
      try {
        chrome.storage.local.set({
          activeSearchTerm: cleanTerm,
          lastDetectedUrl: window.location.href,
          lastDetectedTime: Date.now()
        });
      } catch (err) {
        // Contexto da extensão pode ter sido recarregado
      }
    }

    return cleanTerm || "Geral";
  }

  /**
   * Procura o título e detalhes da faixa a partir do elemento clicado.
   */
  function extractTrackDetails(clickedElement) {
    let current = clickedElement;
    let trackTitle = "";
    let artistName = "";

    // Sobe na árvore do DOM procurando o container do item/card
    for (let i = 0; i < 8 && current && current !== document.body; i++) {
      // Procura por links de faixas ou títulos dentro do container
      const titleEl = current.querySelector(
        'a[href*="/music/"], a[href*="/sound-effects/"], h2, h3, [data-track-title], span[class*="title" i], div[class*="title" i]'
      );
      if (titleEl && titleEl.textContent && titleEl.textContent.trim()) {
        const text = titleEl.textContent.trim();
        // Evita botões genéricos como "Download" ou "Free Download"
        if (!/^(download|baixar|free|grátis|play|pause)$/i.test(text)) {
          trackTitle = text;
        }
      }

      // Procura pelo artista / usuário
      const artistEl = current.querySelector('a[href*="/users/"], [class*="artist" i], [class*="author" i]');
      if (artistEl && artistEl.textContent && artistEl.textContent.trim()) {
        artistName = artistEl.textContent.trim();
      }

      if (trackTitle) break;
      current = current.parentElement;
    }

    // Se não encontrou no card, verifica o título da página
    if (!trackTitle && document.title) {
      const pageTitleMatch = document.title.split("|")[0].split("-")[0].trim();
      if (pageTitleMatch && !pageTitleMatch.toLowerCase().includes("pixabay")) {
        trackTitle = pageTitleMatch;
      }
    }

    return {
      title: sanitizeForPath(trackTitle),
      artist: sanitizeForPath(artistName)
    };
  }

  /**
   * Exibe um Toast sutil de notificação na tela do Pixabay.
   */
  function showToast(title, body) {
    let toast = document.getElementById("pixabay-smart-organizer-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pixabay-smart-organizer-toast";
      toast.innerHTML = `
        <div class="toast-icon">
          <svg viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
        </div>
        <div class="toast-content">
          <div class="toast-title"></div>
          <div class="toast-body"></div>
        </div>
      `;
      document.body.appendChild(toast);
    }

    toast.querySelector(".toast-title").textContent = title;
    toast.querySelector(".toast-body").innerHTML = body;

    toast.classList.add("show");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3800);
  }

  /**
   * Escuta cliques globais para capturar botões de download.
   */
  document.addEventListener("click", function (event) {
    const target = event.target;
    if (!target) return;

    // Verifica se o clique foi em um botão/link de download ou filho dele
    const downloadTrigger = target.closest(
      'a[href*="/download/"], a[download], button[aria-label*="download" i], button[title*="download" i], [class*="download" i], [data-testid*="download" i]'
    );

    if (downloadTrigger) {
      const term = detectSearchTerm();
      const { title, artist } = extractTrackDetails(downloadTrigger);

      // Envia intenção para o background
      try {
        chrome.runtime.sendMessage({
          action: "REGISTER_DOWNLOAD_INTENT",
          intent: {
            term: term || "Geral",
            trackTitle: title || "",
            artist: artist || "",
            timestamp: Date.now()
          }
        });

        // Mostra o Toast na tela
        chrome.storage.local.get(["baseFolder"], (res) => {
          const baseFolder = res.baseFolder || "Pixabay";
          const displayTitle = title ? `<strong>${title}</strong>` : "Arquivo";
          showToast(
            "⚡ Pixabay Smart Organizer",
            `${displayTitle} será salvo em: <span class="toast-badge">${baseFolder}/${term}</span>`
          );
        });
      } catch (e) {
        // Ignora caso a extensão esteja sendo recarregada
      }
    } else {
      // Apenas atualiza a detecção de busca em outros cliques
      detectSearchTerm();
    }
  }, true);

  // Monitora alterações na URL (Pixabay é um SPA com navegação assíncrona)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      detectSearchTerm();
    }
  }, 1000);

  // Executa detecção inicial
  detectSearchTerm();

  // Responde a mensagens vindas do Popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "GET_CURRENT_PAGE_INFO") {
      const term = detectSearchTerm();
      sendResponse({
        term: term,
        url: window.location.href,
        title: document.title
      });
    }
    return true;
  });
})();
