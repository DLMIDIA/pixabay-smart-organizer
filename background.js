/**
 * Pixabay Smart Organizer - Background Service Worker (Manifest V3)
 * Intercepta downloads, higieniza caminhos e organiza em subpastas inteligentes.
 */

// Cache em memória do último intent de download disparado pelo content script
let recentIntent = null;
const INTENT_TTL_MS = 45 * 1000; // 45 segundos de validade

/**
 * Inicialização e valores padrão ao instalar ou atualizar a extensão.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    ["enabled", "baseFolder", "namingFormat", "autoCapitalize", "downloadHistory", "savedFolders"],
    (result) => {
      const defaults = {};
      if (result.enabled === undefined) defaults.enabled = true;
      if (!result.baseFolder) defaults.baseFolder = "GoogleDrive-Pixabay";
      if (!result.namingFormat) defaults.namingFormat = "term_name";
      if (result.autoCapitalize === undefined) defaults.autoCapitalize = true;
      if (!result.downloadHistory) defaults.downloadHistory = [];
      if (!result.savedFolders) {
        defaults.savedFolders = [
          "GoogleDrive-Pixabay",
          "Pixabay",
          "Trilhas Comerciais",
          "Efeitos Sonoros"
        ];
      }

      if (Object.keys(defaults).length > 0) {
        chrome.storage.local.set(defaults);
      }
    }
  );
  console.log("Pixabay Smart Organizer pronto.");
});

/**
 * Escuta intenções de download enviadas pelo Content Script.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "REGISTER_DOWNLOAD_INTENT") {
    recentIntent = {
      ...message.intent,
      receivedAt: Date.now()
    };
    sendResponse({ status: "intent_registered" });
  }
  return true;
});

/**
 * Higieniza um caminho de pasta, preservando subpastas (barras /) mas limpando caracteres proibidos.
 */
function sanitizeFolderPath(pathStr) {
  if (!pathStr) return "";
  return pathStr
    .split("/")
    .map((segment) =>
      segment
        .replace(/[<>:"\\|?*\x00-\x1F]+/g, "-")
        .replace(/\.{2,}/g, "") // previne ../
        .replace(/[\s-]+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("/");
}

/**
 * Higieniza estritamente um nome de arquivo (sem barras).
 */
function sanitizeFilename(nameStr) {
  if (!nameStr) return "";
  return nameStr
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/[\s-]+/g, " ")
    .trim();
}

/**
 * Capitaliza as palavras para deixar a pasta elegante (ex: "comercial radio" -> "Comercial Radio").
 */
function capitalizeWords(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Retorna data atual formatada como AAAA-MM-DD.
 */
function getFormattedDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Listener principal registrado de forma síncrona no escopo global.
 */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  // Verifica se o download tem relação com o Pixabay
  const urlMatchesPixabay =
    (item.url && item.url.includes("pixabay.com")) ||
    (item.referrer && item.referrer.includes("pixabay.com")) ||
    (item.finalUrl && item.finalUrl.includes("pixabay.com"));

  const hasFreshIntent =
    recentIntent && Date.now() - recentIntent.receivedAt < INTENT_TTL_MS;

  if (!urlMatchesPixabay && !hasFreshIntent) {
    suggest();
    return false;
  }

  // Carrega configurações salvas
  chrome.storage.local.get(
    ["enabled", "baseFolder", "namingFormat", "activeSearchTerm", "autoCapitalize", "downloadHistory"],
    (settings) => {
      if (settings.enabled === false) {
        suggest();
        return;
      }

      const baseFolder = sanitizeFolderPath(settings.baseFolder || "Pixabay");
      const autoCapitalize = settings.autoCapitalize !== false;
      const namingFormat = settings.namingFormat || "term_name";

      // Determina termo da pasta
      let rawTerm = "Geral";
      if (hasFreshIntent && recentIntent.term) {
        rawTerm = recentIntent.term;
      } else if (settings.activeSearchTerm) {
        rawTerm = settings.activeSearchTerm;
      }

      let folderTerm = sanitizeFilename(rawTerm);
      if (autoCapitalize) {
        folderTerm = capitalizeWords(folderTerm);
      }
      if (!folderTerm) folderTerm = "Geral";

      // Nome original e extensão
      const rawOriginalFilename = item.filename.split(/[/\\]/).pop() || "download";
      const dotIndex = rawOriginalFilename.lastIndexOf(".");
      const extension = dotIndex !== -1 ? rawOriginalFilename.slice(dotIndex) : "";
      const baseNameWithoutExt = dotIndex !== -1 ? rawOriginalFilename.slice(0, dotIndex) : rawOriginalFilename;

      let titlePart = baseNameWithoutExt;
      if (hasFreshIntent && recentIntent.trackTitle) {
        titlePart = recentIntent.trackTitle;
      }
      titlePart = sanitizeFilename(titlePart) || "audio";

      // Formatação do nome
      let finalFileName = "";
      if (namingFormat === "name_only") {
        finalFileName = `${titlePart}${extension}`;
      } else if (namingFormat === "date_term_name") {
        const dateFolder = getFormattedDate();
        finalFileName = `${folderTerm} - ${titlePart}${extension}`;
        folderTerm = `${dateFolder}/${folderTerm}`;
      } else {
        if (titlePart.toLowerCase().startsWith(folderTerm.toLowerCase())) {
          finalFileName = `${titlePart}${extension}`;
        } else {
          finalFileName = `${folderTerm} - ${titlePart}${extension}`;
        }
      }

      // Caminho relativo final
      const targetPath = `${baseFolder}/${folderTerm}/${finalFileName}`
        .replace(/\/+/g, "/")
        .replace(/^\//, "");

      const historyEntry = {
        id: item.id || Date.now(),
        path: targetPath,
        term: folderTerm,
        fileName: finalFileName,
        originalName: rawOriginalFilename,
        timestamp: Date.now()
      };

      const history = settings.downloadHistory || [];
      history.unshift(historyEntry);
      if (history.length > 15) history.pop();

      chrome.storage.local.set({
        lastDownload: historyEntry,
        downloadHistory: history
      });

      recentIntent = null;

      suggest({
        filename: targetPath,
        conflictAction: "uniquify"
      });
    }
  );

  return true;
});
