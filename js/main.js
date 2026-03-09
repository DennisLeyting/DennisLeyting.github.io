const CSV_FILE = "basis 12-12.csv";

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

async function loadCSV() {
  const response = await fetch(CSV_FILE);
  const csvText = await response.text();

  const workbook = XLSX.read(csvText, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  let rows = XLSX.utils.sheet_to_json(sheet);

  // headers opschonen
  rows = rows.map(row => {
    const cleaned = {};
    Object.keys(row).forEach(key => {
      cleaned[key.trim()] = row[key];
    });
    return cleaned;
  });

  return rows;
}

function mapBasisRooster(rows) {
  return rows.map(r => ({
    klas: r.Klas || "",
    docent: r.Docent || "",
    vak: r.Vak || "",
    lokaal: r.Lokaal || "",
    dag: Number(r.Dag),
    lesuur: Number(r.Lesuur)
  }));
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
    .sort((a,b) => a-b)
    .forEach(dag => {

      Object.keys(groepen[dag])
        .sort((a,b) => a-b)
        .forEach(lesuur => {

          slides.push({
            dag: dag,
            lesuur: lesuur,
            data: groepen[dag][lesuur]
          });

        });

    });

}

function renderSlide() {

  const tbody = document.getElementById("tabel-body");
  tbody.innerHTML = "";

  if (slides.length === 0) return;

  const slide = slides[currentSlide];

  const titel = document.createElement("tr");
  titel.innerHTML = `
    <td colspan="6" style="font-size:22px; font-weight:bold; padding:15px;">
      ${DAG_NAMEN[slide.dag]} — Lesuur ${slide.lesuur}
    </td>
  `;
  tbody.appendChild(titel);

  slide.data.forEach(item => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.klas}</td>
      <td>${item.lesuur}</td>
      <td>${item.vak}</td>
      <td>${item.docent}</td>
      <td>${item.lokaal}</td>
      <td>${DAG_NAMEN[item.dag]}</td>
    `;

    tbody.appendChild(tr);

  });

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

  const vandaag = getVandaagDagNummer();

  if (!vandaag) {
    console.log("Weekend - geen rooster");
    return;
  }

  const vandaagRooster = rooster.filter(r => r.dag === vandaag);

  const groepen = groepeerRooster(vandaagRooster);

  maakSlides(groepen);

  startSlideshow();

}

document.addEventListener("DOMContentLoaded", init);