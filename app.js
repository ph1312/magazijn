const CSV_FILE = "artikelen.csv";
const CACHE_NAME = "magazijn-zoeker-v1";

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const resultsEl = document.getElementById("results");
const statusText = document.getElementById("statusText");
const countText = document.getElementById("countText");
const template = document.getElementById("resultTemplate");
const installBtn = document.getElementById("installBtn");

let allRows = [];
let currentFilter = "";
let deferredPrompt = null;

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  }[char]));
}

function highlight(value, query) {
  const safe = escapeHTML(value || "-");
  if (!query) return safe;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
}

function rowsToObjects(rows) {
  const header = rows.shift();
  const keys = header.map(h => h.trim());
  const seen = new Set();

  return rows.map(row => Object.fromEntries(keys.map((key, index) => [key, row[index] || ""])))
    .filter(item => {
      const uniqueKey = `${item.Artikel}|${item.Artikelomschrijving}|${item.Magazijnlocatie}|${item.Magazijn}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });
}

async function loadCSV() {
  try {
    const response = await fetch(`${CSV_FILE}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("CSV niet gevonden");
    const text = await response.text();
    allRows = rowsToObjects(parseCSV(text));
    statusText.textContent = "Klaar om te zoeken";
    countText.textContent = `${allRows.length} unieke regels`;
    render();
  } catch (error) {
    statusText.textContent = "Kon CSV niet laden. Controleer of artikelen.csv naast index.html staat.";
    countText.textContent = "";
  }
}

function render() {
  const query = normalize(searchInput.value.trim());
  const filter = normalize(currentFilter);

  let matches = allRows;

  if (filter) {
    matches = matches.filter(item => normalize(Object.values(item).join(" ")).includes(filter));
  }

  if (query) {
    const words = query.split(/\s+/).filter(Boolean);
    matches = matches.filter(item => {
      const haystack = normalize([
        item.Artikel,
        item.Artikelomschrijving,
        item.Magazijnlocatie,
        item.Magazijn,
        item.Vestiging,
        item.Artikelsoort,
        item.Goederengroep,
        item["Goed.groep omschr."]
      ].join(" "));
      return words.every(word => haystack.includes(word));
    });
  } else if (!filter) {
    matches = allRows.slice(0, 25);
  }

  resultsEl.innerHTML = "";
  countText.textContent = `${matches.length} resultaat${matches.length === 1 ? "" : "en"}`;

  if (!matches.length) {
    resultsEl.innerHTML = `<div class="empty">Geen resultaten gevonden.</div>`;
    return;
  }

  matches.slice(0, 200).forEach(item => {
    const node = template.content.cloneNode(true);
    node.querySelector(".article-number").innerHTML = highlight(item.Artikel, searchInput.value.trim());
    node.querySelector(".description").innerHTML = highlight(item.Artikelomschrijving, searchInput.value.trim());
    node.querySelector(".location-pill").innerHTML = highlight(item.Magazijnlocatie || "Geen locatie", searchInput.value.trim());
    node.querySelector(".magazijn").textContent = item.Magazijn || "-";
    node.querySelector(".vestiging").textContent = item.Vestiging || "-";
    node.querySelector(".soort").textContent = item.Artikelsoort || "-";
    node.querySelector(".groep").textContent = item.Goederengroep || "-";
    resultsEl.appendChild(node);
  });

  if (matches.length > 200) {
    resultsEl.insertAdjacentHTML("beforeend", `<div class="empty">Eerste 200 resultaten getoond. Maak je zoekopdracht specifieker.</div>`);
  }
}

searchInput.addEventListener("input", render);
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  render();
});

document.querySelectorAll(".quick-filters button").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter || "";
    document.querySelectorAll(".quick-filters button").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

loadCSV();
