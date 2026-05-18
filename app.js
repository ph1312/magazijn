let artikelen = [];
let actieveFilter = "alles";
let zoekTimer = null;

const MAX_RESULTATEN_TONEN = 50;
const MIN_TEKENS_ZOEKEN = 2;

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

        resultsContainer.innerHTML = `
            <div class="empty">
                Typ minimaal ${MIN_TEKENS_ZOEKEN} tekens om te zoeken.
            </div>
        `;

    } catch (err) {
        console.error(err);

        resultCount.innerText = "CSV kon niet geladen worden";

        resultsContainer.innerHTML = `
            <div class="empty">
                CSV bestand kon niet geladen worden.
            </div>
        `;
    }
}

function parseCSV(csv) {
    const regels = csv.trim().split(/\r?\n/);
    const headers = regels[0].split(",").map(h => h.trim());

    const uniek = new Set();

    return regels
        .slice(1)
        .map(regel => {
            const waardes = regel.split(",");
            let obj = {};

            headers.forEach((header, index) => {
                obj[header] = waardes[index]?.trim() || "";
            });

            obj.zoektekst = `
                ${obj.Magazijn}
                ${obj.Artikel}
                ${obj.Artikelomschrijving}
                ${obj.Magazijnlocatie}
                ${obj.Vestiging}
                ${obj.Artikelsoort}
                ${obj.Goederengroep}
                ${obj["Goed.groep omschr."]}
            `.toLowerCase();

            obj.filtertekst = `
                ${obj.Artikelomschrijving}
                ${obj.Magazijnlocatie}
                ${obj.Goederengroep}
                ${obj["Goed.groep omschr."]}
            `.toUpperCase();

            return obj;
        })
        .filter(item => {
            const key = `${item.Artikel}-${item.Artikelomschrijving}-${item.Magazijnlocatie}`;

            if (uniek.has(key)) {
                return false;
            }

            uniek.add(key);
            return true;
        });
}

function zoeken() {
    const invoer = searchInput.value.toLowerCase().trim();

    const zoekwoorden = invoer
        .split(/\s+/)
        .filter(Boolean);

    const aantalTekens = zoekwoorden.join("").length;

    if (
        aantalTekens < MIN_TEKENS_ZOEKEN &&
        actieveFilter === "alles"
    ) {
        resultCount.innerText = `${artikelen.length} artikelen geladen`;

        resultsContainer.innerHTML = `
            <div class="empty">
                Typ minimaal ${MIN_TEKENS_ZOEKEN} tekens om te zoeken.
            </div>
        `;

        return;
    }

    let resultaten = artikelen;

    if (actieveFilter !== "alles") {
        resultaten = resultaten.filter(item =>
            item.filtertekst.includes(actieveFilter)
        );
    }

    if (zoekwoorden.length > 0) {
        resultaten = resultaten.filter(item =>
            zoekwoorden.every(woord =>
                item.zoektekst.includes(woord)
            )
        );
    }

    const beperkteResultaten =
        resultaten.slice(0, MAX_RESULTATEN_TONEN);

    toonResultaten(beperkteResultaten);

    if (resultaten.length > MAX_RESULTATEN_TONEN) {
        resultCount.innerText =
            `${resultaten.length} resultaten - eerste ${MAX_RESULTATEN_TONEN} getoond`;
    } else {
        resultCount.innerText =
            `${resultaten.length} resultaat`;
    }
}

function toonResultaten(data) {
    if (data.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty">
                Geen resultaten gevonden.
            </div>
        `;

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

searchInput.addEventListener("input", () => {
    clearTimeout(zoekTimer);

    zoekTimer = setTimeout(() => {
        zoeken();
    }, 200);
});

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    zoeken();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        actieveFilter = button.dataset.filter;

        zoeken();
    });
});

laadCSV();
