const CSV_FILE = "dag 19-01 tm 23-01.csv";

const DAG_NAMEN = {
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag"
};

let slides = [];
let currentSlide = 0;

function getVandaagDagNummer() {
  const vandaag = new Date().getDay();

  if (vandaag === 0 || vandaag === 6) {
    return null; // weekend
  }

  return vandaag; // maandag=1 t/m vrijdag=5
}

// NIEUW: datum omzetten naar dagnummer (1-5)
function parseDatum(datumString) {
  const str = String(datumString);

  const jaar = parseInt(str.substring(0, 4));
  const maand = parseInt(str.substring(4, 6)) - 1; // JS maand = 0-11
  const dag = parseInt(str.substring(6, 8));

  return new Date(jaar, maand, dag);
}

function formatDatum(datum) {
  const maanden = [
    "januari", "februari", "maart", "april",
    "mei", "juni", "juli", "augustus",
    "september", "oktober", "november", "december"
  ];

  return `${datum.getDate()} ${maanden[datum.getMonth()]}`;
}

async function loadCSV() {
  const response = await fetch(CSV_FILE);
  const csvText = await response.text();

  const workbook = XLSX.read(csvText, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // GEEN headers → array van arrays
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  return rows;
}

function mapBasisRooster(rows) {
  return rows.map(r => {
    const datumObj = parseDatum(r[0]);

    return {
      datum: datumObj,
      datumFormatted: formatDatum(datumObj),
      dag: datumObj.getDay(), // 1-5
      klas: r[2] || "",
      docent: r[3] || "",
      vak: r[4] || "",
      lokaal: r[5] || "",
      lesuur: Number(r[6])
    };
  });
}

function groepeerRooster(data) {
  const groepen = {};

  data.forEach(item => {
    if (!groepen[item.dag]) {
      groepen[item.dag] = {};
    }

    if (!groepen[item.dag][item.lesuur]) {
      groepen[item.dag][item.lesuur] = [];
    }

    groepen[item.dag][item.lesuur].push(item);
  });

  return groepen;
}

function maakSlides(groepen) {

  slides = [];

  Object.keys(groepen)
    .sort((a, b) => a - b)
    .forEach(dag => {

      slides.push({
        dag: dag,
        data: groepen[dag] // bevat alle lesuren
      });

    });

}

function renderSlide() {

  const container = document.getElementById("tables-container");
  container.innerHTML = "";

  if (slides.length === 0) return;

  const slide = slides[currentSlide];

  // alle data plat maken
  let allData = [];

  Object.keys(slide.data)
    .sort((a, b) => a - b)
    .forEach(lesuur => {
      slide.data[lesuur].forEach(item => {
        allData.push(item);
      });
    });

  const kolommen = 5;
  const perKolom = Math.ceil(allData.length / kolommen);

  const datumText = allData[0]?.datumFormatted || "";

  for (let i = 0; i < kolommen; i++) {

    const start = i * perKolom;
    const subset = allData.slice(start, start + perKolom);

    if (subset.length === 0) continue;

    const table = document.createElement("table");
    table.classList.add("rooster-tabel");

    table.innerHTML = `
      <thead>
        <tr>
          <th colspan="5" style="font-size:14px;">
            ${DAG_NAMEN[slide.dag]} ${datumText}
          </th>
        </tr>
        <tr>
          <th>Klas</th>
          <th>Lesuur</th>
          <th>Vak</th>
          <th>Docent</th>
          <th>Lokaal</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    subset.forEach(item => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${item.klas}</td>
        <td>${item.lesuur}</td>
        <td>${item.vak}</td>
        <td>${item.docent}</td>
        <td>${item.lokaal}</td>
      `;

      tbody.appendChild(tr);
    });

    container.appendChild(table);
  }
}

function startSlideshow() {
  renderSlide();

  setInterval(() => {
    currentSlide++;

    if (currentSlide >= slides.length) {
      currentSlide = 0;
    }

    renderSlide();
  }, 10000);
}

async function init() {
  const rows = await loadCSV();
  const rooster = mapBasisRooster(rows);

  const groepen = groepeerRooster(rooster);

  maakSlides(groepen);

  startSlideshow();
}

document.addEventListener("DOMContentLoaded", init);