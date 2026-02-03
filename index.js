// index.js

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);

function setActive(groupButtons, activeBtn) {
  groupButtons.forEach(b => b.classList.remove("active"));
  activeBtn.classList.add("active");
}

function sum(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s;
}

function formatNumber(n) {
  return n.toLocaleString();
}

function animateNumber(el, from, to, duration = 700) {
  const start = performance.now();
  const diff = to - from;

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const value = Math.round(from + diff * eased);
    el.textContent = formatNumber(value);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------- Data ----------
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let views = [1200, 1600, 1400, 2200, 2600, 2400, 3100, 2900, 3400, 3900, 3600, 4200];

let chartType = "area"; // "area" or "bar"
let timer = null;

// Colors (default + from CSS variables)
const lineInput = $("#lineColor");
const fillInput = $("#fillColor");

function readCSSVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function applyAccentToCSS(lineColor, fillColor) {
  document.documentElement.style.setProperty("--accent", lineColor);
  document.documentElement.style.setProperty("--accent2", fillColor);
}

// ---------- Theme ----------
const themeBtn = $("#themeBtn");

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light");
    themeBtn.textContent = "☀️";
  } else {
    document.body.classList.remove("light");
    themeBtn.textContent = "🌙";
  }
  localStorage.setItem("theme", theme);

  // after theme changes, update chart colors to match (grid labels etc.)
  updateChartTheme();
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light");
  applyTheme(isLight ? "dark" : "light");
}

// ---------- Chart ----------
const chartEl = $(".chart-area");
const totalEl = $("#totalViews");

const baseOptions = () => {
  const isLight = document.body.classList.contains("light");
  const fg = readCSSVar("--muted");
  const text = readCSSVar("--text");
  const grid = readCSSVar("--border");
  const accent = readCSSVar("--accent");
  const accent2 = readCSSVar("--accent2");

  return {
    chart: {
      type: chartType,
      height: "100%",
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: fg,
      fontFamily: "Poppins, sans-serif",
      animations: { enabled: true, easing: "easeinout", speed: 800 }
    },

    series: [{ name: "Views", data: views }],

    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px" } }
    },

    yaxis: {
      labels: {
        style: { fontSize: "11px" },
        formatter: (val) => {
          if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + "k";
          return Math.round(val);
        }
      }
    },

    grid: {
      borderColor: grid,
      strokeDashArray: 4,
      padding: { left: 8, right: 10, top: 6, bottom: 0 }
    },

    dataLabels: { enabled: false },

    stroke: {
      curve: "smooth",
      width: chartType === "bar" ? 0 : 3
    },

    markers: {
      size: chartType === "bar" ? 0 : 0,
      hover: { size: 5 }
    },

    colors: [accent],

    fill: chartType === "bar"
      ? { opacity: 0.9 }
      : {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.35,
            opacityTo: 0.06,
            stops: [0, 90, 100],
            colorStops: [
              { offset: 0, color: accent, opacity: 0.35 },
              { offset: 100, color: accent2, opacity: 0.06 }
            ]
          }
        },

    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "52%"
      }
    },

    tooltip: {
      theme: isLight ? "light" : "dark",
      y: { formatter: (val) => `${val.toLocaleString()} views` }
    },

    title: {
      text: "",
      style: { color: text }
    }
  };
};

let chart = new ApexCharts(chartEl, baseOptions());
chart.render();

// ---------- Counter ----------
let lastTotal = 0;
function updateTotalCounter() {
  const total = sum(views);
  animateNumber(totalEl, lastTotal, total, 650);
  lastTotal = total;
}
updateTotalCounter();

// ---------- Update chart theme/colors ----------
function updateChartTheme() {
  // Update tooltip theme + grid/labels auto (foreColor comes from options)
  chart.updateOptions(baseOptions(), false, true);
}

// ---------- Simulation ----------
function nextValue(v) {
  // small realistic-ish fluctuation
  const change = Math.round((Math.random() - 0.45) * 500);
  return Math.max(200, v + change);
}

function tickSimulation() {
  views = views.map(nextValue);
  chart.updateSeries([{ name: "Views", data: views }], true);
  updateTotalCounter();
}

function startSimulation() {
  if (timer) return;
  timer = setInterval(tickSimulation, 2500);
  $(".pulse").style.opacity = "1";
}

function stopSimulation() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  $(".pulse").style.opacity = "0.35";
}

// ---------- Chart type toggle ----------
const btnArea = $("#btnArea");
const btnBar = $("#btnBar");

function setChartType(type) {
  chartType = type;
  chart.updateOptions(baseOptions(), true, true);
}

// ---------- Control buttons ----------
const btnStart = $("#btnStart");
const btnStop = $("#btnStop");

btnArea.addEventListener("click", () => {
  setActive([btnArea, btnBar], btnArea);
  setChartType("area");
});

btnBar.addEventListener("click", () => {
  setActive([btnArea, btnBar], btnBar);
  setChartType("bar");
});

btnStart.addEventListener("click", () => {
  setActive([btnStart, btnStop], btnStart);
  startSimulation();
});

btnStop.addEventListener("click", () => {
  setActive([btnStart, btnStop], btnStop);
  stopSimulation();
});

// ---------- Color pickers ----------
function applyColorsFromInputs() {
  const line = lineInput.value;
  const fill = fillInput.value;

  applyAccentToCSS(line, fill);
  chart.updateOptions(baseOptions(), false, true);
}

lineInput.addEventListener("input", applyColorsFromInputs);
fillInput.addEventListener("input", applyColorsFromInputs);

// ---------- Theme button ----------
themeBtn.addEventListener("click", toggleTheme);

// ---------- Load saved theme ----------
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

// Set initial pulse dim if stopped
stopSimulation();

// Ensure CSS vars match initial inputs on first load
applyAccentToCSS(lineInput.value, fillInput.value);
chart.updateOptions(baseOptions(), false, true);
