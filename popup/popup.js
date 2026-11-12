/**
 * Pixabay Smart Organizer - Popup Controller
 * Gerencia preferências do usuário, estado do Pixabay e comunicação em tempo real.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elementos do DOM
  const toggleEnabled = document.getElementById("toggle-enabled");
  const siteStatusBadge = document.getElementById("site-status-badge");
  const activeTermDisplay = document.getElementById("active-term-display");
  const btnEditTerm = document.getElementById("btn-edit-term");
  const manualTermContainer = document.getElementById("manual-term-container");
  const manualTermInput = document.getElementById("manual-term-input");
  const btnSaveTerm = document.getElementById("btn-save-term");
  const btnCancelTerm = document.getElementById("btn-cancel-term");
  const presetChips = document.querySelectorAll(".chip");

  // Destino / Pastas
  const baseFolderInput = document.getElementById("base-folder-input");
  const btnSaveFolder = document.getElementById("btn-save-folder");
  const folderChips = document.querySelectorAll(".folder-chip");

  // Ajuda Google Drive
  const toggleGdriveHelp = document.getElementById("toggle-gdrive-help");
  const gdriveHelpContent = document.getElementById("gdrive-help-content");
  const btnCopySymlink = document.getElementById("btn-copy-symlink");
  const symlinkCmd = document.getElementById("symlink-cmd");

  // Configuração de nome
  const namingFormatSelect = document.getElementById("naming-format-select");

  // Histórico Acordeão
  const toggleHistory = document.getElementById("toggle-history");
  const historyContent = document.getElementById("history-content");
  const historyArrow = document.getElementById("history-arrow");
  const historyEmpty = document.getElementById("history-empty");
  const lastDownloadInfo = document.getElementById("last-download-info");
  const lastFileName = document.getElementById("last-file-name");
  const lastFilePath = document.getElementById("last-file-path");

  // Rodapé
  const btnOpenDownloads = document.getElementById("btn-open-downloads");

  /**
   * Carrega preferências salvas no chrome.storage.local
   */
  function loadSettings() {
    chrome.storage.local.get(
      [
        "enabled",
        "baseFolder",
        "namingFormat",
        "activeSearchTerm",
        "lastDownload"
      ],
      (data) => {
        // Ativo/Desativado
        toggleEnabled.checked = data.enabled !== false;

        // Pasta de Destino
        const currentFolder = data.baseFolder || "GoogleDrive-Pixabay";
        baseFolderInput.value = currentFolder;
        highlightMatchingFolderChip(currentFolder);

        // Formato do nome
        if (data.namingFormat) {
          namingFormatSelect.value = data.namingFormat;
        }

        // Termo ativo
        const currentTerm = data.activeSearchTerm || "Geral";
        activeTermDisplay.textContent = currentTerm;
        highlightMatchingPresetChip(currentTerm);

        // Último download
        if (data.lastDownload && data.lastDownload.fileName) {
          historyEmpty.classList.add("hidden");
          lastDownloadInfo.classList.remove("hidden");
          lastFileName.textContent = data.lastDownload.fileName;
          lastFilePath.textContent = data.lastDownload.path;
        } else {
          historyEmpty.classList.remove("hidden");
          lastDownloadInfo.classList.add("hidden");
        }
      }
    );
  }

  /**
   * Consulta a aba ativa para checar se o usuário está navegando no Pixabay
   */
  function checkActiveTab() {
    if (!chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab = tabs[0];

      if (tab.url && tab.url.includes("pixabay.com")) {
        siteStatusBadge.textContent = "Pixabay Conectado";
        siteStatusBadge.className = "badge-status active";

        try {
          chrome.tabs.sendMessage(tab.id, { action: "GET_CURRENT_PAGE_INFO" }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response && response.term) {
              activeTermDisplay.textContent = response.term;
              highlightMatchingPresetChip(response.term);
              chrome.storage.local.set({ activeSearchTerm: response.term });
            }
          });
        } catch (e) {
          // Ignorado
        }
      } else {
        siteStatusBadge.textContent = "Fora do Pixabay";
        siteStatusBadge.className = "badge-status";
      }
    });
  }

  function highlightMatchingFolderChip(folder) {
    const clean = (folder || "").trim().toLowerCase();
    folderChips.forEach((chip) => {
      const target = chip.getAttribute("data-folder").toLowerCase();
      if (target === clean) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  function highlightMatchingPresetChip(term) {
    const clean = (term || "").trim().toLowerCase();
    presetChips.forEach((chip) => {
      const preset = chip.getAttribute("data-preset").toLowerCase();
      if (preset === clean) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  // --- Event Listeners ---

  // Ativar/Desativar
  toggleEnabled.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: toggleEnabled.checked });
  });

  // Salvar Pasta de Destino Manual
  function saveCurrentFolder() {
    let folder = baseFolderInput.value.trim().replace(/[<>:"\\|?*]+/g, "-");
    if (!folder) folder = "Pixabay";
    baseFolderInput.value = folder;
    highlightMatchingFolderChip(folder);
    chrome.storage.local.set({ baseFolder: folder });

    btnSaveFolder.textContent = "✓";
    setTimeout(() => {
      btnSaveFolder.textContent = "OK";
    }, 1200);
  }

  btnSaveFolder.addEventListener("click", saveCurrentFolder);
  baseFolderInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveCurrentFolder();
  });

  // Chips de Pastas Rápidas
  folderChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const folder = chip.getAttribute("data-folder");
      baseFolderInput.value = folder;
      highlightMatchingFolderChip(folder);
      chrome.storage.local.set({ baseFolder: folder });
    });
  });

  // Toggle Ajuda Google Drive
  toggleGdriveHelp.addEventListener("click", () => {
    gdriveHelpContent.classList.toggle("hidden");
  });

  // Copiar comando symlink
  btnCopySymlink.addEventListener("click", () => {
    const code = symlinkCmd.textContent.trim();
    navigator.clipboard.writeText(code).then(() => {
      btnCopySymlink.textContent = "✓ Comando Copiado!";
      setTimeout(() => {
        btnCopySymlink.textContent = "Copiar Comando do Terminal";
      }, 2000);
    });
  });

  // Naming format
  namingFormatSelect.addEventListener("change", () => {
    chrome.storage.local.set({ namingFormat: namingFormatSelect.value });
  });

  // Chips de Categorias
  presetChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selectedPreset = chip.getAttribute("data-preset");
      activeTermDisplay.textContent = selectedPreset;
      highlightMatchingPresetChip(selectedPreset);
      chrome.storage.local.set({ activeSearchTerm: selectedPreset });
    });
  });

  // Edição Manual do Termo
  btnEditTerm.addEventListener("click", () => {
    manualTermInput.value = activeTermDisplay.textContent;
    manualTermContainer.classList.remove("hidden");
    btnEditTerm.classList.add("hidden");
    manualTermInput.focus();
  });

  btnSaveTerm.addEventListener("click", () => {
    const newTerm = manualTermInput.value.trim() || "Geral";
    activeTermDisplay.textContent = newTerm;
    highlightMatchingPresetChip(newTerm);
    chrome.storage.local.set({ activeSearchTerm: newTerm });
    manualTermContainer.classList.add("hidden");
    btnEditTerm.classList.remove("hidden");
  });

  btnCancelTerm.addEventListener("click", () => {
    manualTermContainer.classList.add("hidden");
    btnEditTerm.classList.remove("hidden");
  });

  manualTermInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnSaveTerm.click();
    } else if (e.key === "Escape") {
      btnCancelTerm.click();
    }
  });

  // Acordeão do Histórico
  toggleHistory.addEventListener("click", () => {
    const isHidden = historyContent.classList.toggle("hidden");
    historyArrow.textContent = isHidden ? "▸" : "▾";
  });

  // Abrir pasta de downloads
  btnOpenDownloads.addEventListener("click", () => {
    if (chrome.downloads && chrome.downloads.showDefaultFolder) {
      chrome.downloads.showDefaultFolder();
    } else {
      chrome.tabs.create({ url: "chrome://downloads" });
    }
  });

  // Inicializa
  loadSettings();
  checkActiveTab();
});
