let artikelen = [];

const searchInput = document.getElementById("search");
const clearBtn = document.getElementById("clear-btn");
const resultsContainer = document.getElementById("results");
const resultCount = document.getElementById("result-count");

async function laadCSV() {
    try {
        const response = await fetch("artikelen.csv");
        const text = await response.text();

        parseCSV(text);

        toonResultaten([]);
        resultCount.innerText = `${artikelen.length} artikelen geladen`;

    } catch (err) {
        console.error(err);

        resultsContainer.innerHTML = `
            <div class="card">
                CSV bestand kon niet geladen worden
            </div>
        `;
    }
}

function parseCSV(csv) {

    const regels = csv.trim().split("\n");

    const headers = regels[0]
        .split(",")
        .map(h => h.trim());

    const uniek = new Set();

    artikelen = regels
        .slice(1)
        .map(regel => {

            const waardes = regel.split(",");

            let obj = {};

            headers.forEach((header, index) => {
                obj[header] = waardes[index]?.trim() || "";
            });

            return obj;
        })

        .filter(item => {

            const key =
                item.Artikel +
                item.Artikelomschrijving +
                item.Magazijnlocatie;

            if (uniek.has(key)) return false;

            uniek.add(key);

            return true;
        });
}

function zoeken() {

    const zoektekst =
        searchInput.value
        .toLowerCase()
        .trim();

    if (!zoektekst) {

        toonResultaten([]);

        resultCount.innerText =
            "Klaar om te zoeken";

        return;
    }

    const resultaten =
        artikelen.filter(item => {

            const tekst = `
                ${item.Artikel}
                ${item.Artikelomschrijving}
                ${item.Magazijnlocatie}
                ${item.Magazijn}
                ${item.Vestiging}
                ${item.Artikelsoort}
                ${item.Goederengroep}
                ${item["Goed.groep omschr."]}
            `
            .toLowerCase();

            return tekst.includes(zoektekst);
        });

    toonResultaten(resultaten);

    resultCount.innerText =
        `${resultaten.length} resultaat`;
}

function toonResultaten(data) {

    if (data.length === 0) {

        resultsContainer.innerHTML = `
            <div class="empty">
                Geen resultaten
            </div>
        `;

        return;
    }

    resultsContainer.innerHTML =
        data.map(item => `

        <div class="card">

            <div class="artikelnummer">
                ${item.Artikel}
            </div>

            <div class="omschrijving">
                ${item.Artikelomschrijving}
            </div>

            <div class="info-grid">

                <div class="info-box">
                    <span>MAGAZIJN</span>
                    <strong>
                        ${item.Magazijn}
                    </strong>
                </div>

                <div class="info-box">
                    <span>VESTIGING</span>
                    <strong>
                        ${item.Vestiging}
                    </strong>
                </div>

                <div class="info-box">
                    <span>LOCATIE</span>
                    <strong>
                        ${item.Magazijnlocatie}
                    </strong>
                </div>

                <div class="info-box">
                    <span>SOORT</span>
                    <strong>
                        ${item.Artikelsoort}
                    </strong>
                </div>

                <div class="info-box">
                    <span>GROEP</span>
                    <strong>
                        ${item.Goederengroep}
                    </strong>
                </div>

            </div>

        </div>

    `).join("");
}

searchInput.addEventListener(
    "input",
    zoeken
);

clearBtn.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        toonResultaten([]);

        resultCount.innerText =
            "Klaar om te zoeken";
    }
);

laadCSV();
