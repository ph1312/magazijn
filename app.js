let artikelen = [];
let actieveFilter = "alles";

const searchInput = document.getElementById("search");
const clearBtn = document.getElementById("clear-btn");
const resultsContainer = document.getElementById("results");
const resultCount = document.getElementById("result-count");
const filterButtons = document.querySelectorAll(".filter-btn");

async function laadCSV() {
    try {
        const response = await fetch("artikelen.csv");
        const text = await response.text();

        artikelen = parseCSV(text);

        resultCount.innerText = `${artikelen.length} artikelen geladen`;
        resultsContainer.innerHTML = `<div class="empty">Typ hierboven om te zoeken.</div>`;

    } catch (err) {
        console.error(err);
        resultCount.innerText = "CSV kon niet geladen worden";
        resultsContainer.innerHTML = `<div class="empty">CSV bestand kon niet geladen worden.</div>`;
    }
}

function parseCSV(csv) {
    const regels = csv.trim().split(/\r?\n/);
    const headers = regels[0].split(",").map(h => h.trim());

    const uniek = new Set();

    return regels.slice(1).map(regel => {
        const waardes = regel.split(",");
        let obj = {};

        headers.forEach((header, index) => {
            obj[header] = waardes[index]?.trim() || "";
        });

        return obj;
    }).filter(item => {
        const key = `${item.Artikel}-${item.Artikelomschrijving}-${item.Magazijnlocatie}`;

        if (uniek.has(key)) return false;

        uniek.add(key);
        return true;
    });
}

function zoeken() {
    const zoektekst = searchInput.value.toLowerCase().trim();

    let resultaten = artikelen;

    if (actieveFilter !== "alles") {
        resultaten = resultaten.filter(item => {
            const tekst = `
                ${item.Artikelomschrijving}
                ${item.Magazijnlocatie}
                ${item.Goederengroep}
                ${item["Goed.groep omschr."]}
            `.toUpperCase();

            return tekst.includes(actieveFilter);
        });
    }

    if (zoektekst) {
        resultaten = resultaten.filter(item => {
            const tekst = `
                ${item.Magazijn}
                ${item.Artikel}
                ${item.Artikelomschrijving}
                ${item.Magazijnlocatie}
                ${item.Vestiging}
                ${item.Artikelsoort}
                ${item.Goederengroep}
                ${item["Goed.groep omschr."]}
            `.toLowerCase();

            return tekst.includes(zoektekst);
        });
    }

    toonResultaten(resultaten);

    resultCount.innerText = `${resultaten.length} resultaat`;
}

function toonResultaten(data) {
    if (data.length === 0) {
        resultsContainer.innerHTML = `<div class="empty">Geen resultaten gevonden.</div>`;
        return;
    }

    resultsContainer.innerHTML = data.map(item => `
        <div class="card">

            <div class="artikelnummer">
                ${item.Artikel || "-"}
            </div>

            <div class="omschrijving">
                ${item.Artikelomschrijving || "-"}
            </div>

            <div class="info-grid">

                <div class="info-box">
                    <span>MAGAZIJN</span>
                    <strong>${item.Magazijn || "-"}</strong>
                </div>

                <div class="info-box">
                    <span>VESTIGING</span>
                    <strong>${item.Vestiging || "-"}</strong>
                </div>

                <div class="info-box">
                    <span>LOCATIE</span>
                    <strong>${item.Magazijnlocatie || "-"}</strong>
                </div>

                <div class="info-box">
                    <span>SOORT</span>
                    <strong>${item.Artikelsoort || "-"}</strong>
                </div>

                <div class="info-box">
                    <span>GROEP</span>
                    <strong>${item.Goederengroep || "-"}</strong>
                </div>

            </div>

        </div>
    `).join("");
}

searchInput.addEventListener("input", zoeken);

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    zoeken();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        actieveFilter = button.dataset.filter;
        zoeken();
    });
});

laadCSV();
