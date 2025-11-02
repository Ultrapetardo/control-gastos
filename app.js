const fmtCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Estado por mes
let monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let months = {};
let alertsConfig = {
  percentage: 80, // alerta por defecto al alcanzar 80%
};

function monthKey(month, year) {
  return `${year}-${(month + 1).toString().padStart(2, "0")}`;
}

// Inicializa select mes
const monthSelect = document.getElementById("month-select");
for (let y = currentYear - 1; y <= currentYear; y++) {
  for (let m = 0; m < 12; m++) {
    const mk = monthKey(m, y);
    const opt = document.createElement("option");
    opt.value = mk;
    opt.text = `${monthNames[m]} ${y}`;
    monthSelect.appendChild(opt);
  }
}
monthSelect.value = monthKey(currentMonth, currentYear);
monthSelect.onchange = () => {
  let [year, month] = monthSelect.value.split("-");
  currentMonth = Number(month) - 1;
  currentYear = Number(year);
  render();
};

// Pestañas
document.getElementById("tab-actual").onclick = () => {
  document.getElementById("tab-content-actual").classList.remove("hidden");
  document.getElementById("tab-content-actual").classList.add("visible");
  document.getElementById("tab-content-historial").classList.remove("visible");
  document.getElementById("tab-content-historial").classList.add("hidden");
  document.getElementById("tab-actual").classList.add("active");
  document.getElementById("tab-historial").classList.remove("active");
};
document.getElementById("tab-historial").onclick = () => {
  document.getElementById("tab-content-actual").classList.remove("visible");
  document.getElementById("tab-content-actual").classList.add("hidden");
  document.getElementById("tab-content-historial").classList.remove("hidden");
  document.getElementById("tab-content-historial").classList.add("visible");
  document.getElementById("tab-historial").classList.add("active");
  document.getElementById("tab-actual").classList.remove("active");
};

function getMonthObj() {
  let key = monthKey(currentMonth, currentYear);
  if (!months[key]) {
    months[key] = {
      salary: 0,
      fixedExpenses: [],
      unexpectedExpenses: [],
      alerts: [],
    };
  }
  return months[key];
}

// Guardar salario
document.getElementById("save-salary").onclick = () => {
  let obj = getMonthObj();
  obj.salary = Number(document.getElementById("salary-input").value) || 0;
  render();
};

// Guardar mes (solo refresca)
document.getElementById("save-month").onclick = () => {
  render();
  alert("¡Mes guardado! Puedes consultarlo en 'Meses Anteriores'.");
};

// Importar gastos fijos del mes anterior
document.getElementById("import-prev-month").onclick = () => {
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }
  let prevKey = monthKey(prevMonth, prevYear);
  let currentKey = monthKey(currentMonth, currentYear);
  if (!months[prevKey]) {
    alert("No hay datos del mes anterior para importar.");
    return;
  }
  let current = getMonthObj();
  // Copiar gastos fijos (clonado simple)
  current.fixedExpenses = months[prevKey].fixedExpenses.map(e => ({...e}));
  render();
  alert("Gastos fijos importados del mes anterior.");
};

// Render gastos fijos
document.getElementById("add-fixed").onclick = () => openExpenseDialog("fixed");
function renderFixed() {
  let obj = getMonthObj();
  const list = document.getElementById("fixed-list");
  list.innerHTML = "";
  obj.fixedExpenses.forEach((exp, i) => {
    let fechaLim = exp.date ? ` (limite: ${exp.date})` : "";
    let descripcion = exp.description ? ` | ${exp.description}` : "";
    const clasePagado = exp.paid ? "paid" : "";
    const li = document.createElement("li");
    li.className = clasePagado;
    li.innerHTML = `<span>${exp.name}: ${fmtCOP.format(exp.amount)}${fechaLim}${descripcion}</span>
      <span class="gasto-actions">
        <button onclick="editExpense('fixed',${i})">✏️</button>
        <button onclick="deleteExpense('fixed',${i})">🗑️</button>
        <label><input type="checkbox" onchange="togglePaid('fixed',${i}, this.checked)" ${
          exp.paid ? "checked" : ""
        }> Pagado</label>
      </span>`;
    list.appendChild(li);
  });
  const total = obj.fixedExpenses.reduce((a, e) => a + e.amount, 0);
  document.getElementById("fixed-total").textContent = "Total: " + fmtCOP.format(total);
}

// Toggle pagado
window.togglePaid = (type, index, checked) => {
  let obj = getMonthObj();
  if (type === "fixed") {
    obj.fixedExpenses[index].paid = checked;
  } else {
    obj.unexpectedExpenses[index].paid = checked;
  }
  render();
};

// Render gastos inesperados
document.getElementById("add-unexpected").onclick = () => openExpenseDialog("unexpected");
function renderUnexpected() {
  let obj = getMonthObj();
  const list = document.getElementById("unexpected-list");
  list.innerHTML = "";
  obj.unexpectedExpenses.forEach((exp, i) => {
    const clasePagado = exp.paid ? "paid" : "";
    const li = document.createElement("li");
    li.className = clasePagado;
    let descripcion = exp.description ? ` | ${exp.description}` : "";
    li.innerHTML = `<span>${exp.name}: ${fmtCOP.format(exp.amount)}${descripcion}</span>
      <span class="gasto-actions">
        <button onclick="editExpense('unexpected',${i})">✏️</button>
        <button onclick="deleteExpense('unexpected',${i})">🗑️</button>
        <label><input type="checkbox" onchange="togglePaid('unexpected',${i}, this.checked)" ${
          exp.paid ? "checked" : ""
        }> Pagado</label>
      </span>`;
    list.appendChild(li);
  });
  const total = obj.unexpectedExpenses.reduce((a, e) => a + e.amount, 0);
  document.getElementById("unexpected-total").textContent = "Total: " + fmtCOP.format(total);
}

// Editar y eliminar gastos
window.editExpense = function (type, idx) {
  let obj = getMonthObj();
  let exp = type === "fixed" ? obj.fixedExpenses[idx] : obj.unexpectedExpenses[idx];
  openExpenseDialog(type, exp, idx);
};
window.deleteExpense = function (type, idx) {
  let obj = getMonthObj();
  if (confirm("¿Eliminar este gasto?")) {
    if (type === "fixed") obj.fixedExpenses.splice(idx, 1);
    else obj.unexpectedExpenses.splice(idx, 1);
    render();
  }
};

// Saldo disponible
function renderBalance() {
  let obj = getMonthObj();
  const totalFixed = obj.fixedExpenses.reduce((a, e) => a + e.amount, 0);
  const totalUnexpected = obj.unexpectedExpenses.reduce((a, e) => a + e.amount, 0);
  const balance = obj.salary - totalFixed - totalUnexpected;
  document.getElementById("balance-display").textContent = fmtCOP.format(balance);
}

// Salario mostrado
function renderSalary() {
  let obj = getMonthObj();
  document.getElementById("salary-input").value = obj.salary > 0 ? obj.salary : "";
  document.getElementById("salary-display").textContent = obj.salary > 0 ? fmtCOP.format(obj.salary) : "";
}

// Tabla mensual historial
function renderHistoryTable() {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  Object.keys(months)
    .sort()
    .forEach((k) => {
      const mObj = months[k];
      const [year, monthRaw] = k.split("-");
      const month = Number(monthRaw) - 1;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${monthNames[month]} ${year}</td>
      <td>${fmtCOP.format(mObj.salary)}</td>
      <td>${fmtCOP.format(mObj.fixedExpenses.reduce((a, e) => a + e.amount, 0))}</td>
      <td>${fmtCOP.format(mObj.unexpectedExpenses.reduce((a, e) => a + e.amount, 0))}</td>
      <td>${fmtCOP.format(
        mObj.salary -
          mObj.fixedExpenses.reduce((a, e) => a + e.amount, 0) -
          mObj.unexpectedExpenses.reduce((a, e) => a + e.amount, 0)
      )}</td>`;
      tbody.appendChild(tr);
    });
}

// Alertas activas
function renderAlerts() {
  let obj = getMonthObj();
  const ul = document.getElementById("alerts-list");
  ul.innerHTML = "";
  obj.fixedExpenses.forEach((exp) => {
    let vencida = exp.date && !exp.paid && new Date(exp.date) < new Date();
    if (vencida) {
      const li = document.createElement("li");
      li.textContent = `🔔 Gasto fijo "${exp.name}" venció el plazo de pago (${exp.date})`;
      ul.appendChild(li);
    }
    let pct = exp.alertPct;
    if (pct && obj.salary > 0 && exp.amount >= (obj.salary * pct) / 100) {
      const li = document.createElement("li");
      li.textContent = `⚠️ Gasto fijo "${exp.name}" supera el ${pct}% del salario`;
      ul.appendChild(li);
    }
  });
  let totalGasto = obj.fixedExpenses.reduce((a, e) => a + e.amount, 0) + obj.unexpectedExpenses.reduce((a, e) => a + e.amount, 0);
  if (obj.salary > 0 && totalGasto >= (obj.salary * alertsConfig.percentage) / 100) {
    const li = document.createElement("li");
    li.textContent = `⚠️ Has gastado más del ${alertsConfig.percentage}% de tu salario`;
    ul.appendChild(li);
  }
}

// Gráfica resumen
let summaryChart;
function renderGraph() {
  let obj = getMonthObj();
  const ctx = document.getElementById("summaryChart").getContext("2d");
  const totalFixed = obj.fixedExpenses.reduce((a, e) => a + e.amount, 0);
  const totalUnexpected = obj.unexpectedExpenses.reduce((a, e) => a + e.amount, 0);
  const balance = obj.salary - totalFixed - totalUnexpected;
  const data = {
    labels: ["Gastos Fijos", "Gastos Inesperados", "Saldo"],
    datasets: [
      {
        data: [totalFixed, totalUnexpected, Math.max(balance, 0)],
        backgroundColor: ["#3498db", "#e67e22", "#16a085"],
      },
    ],
  };
  if (summaryChart) summaryChart.destroy();
  summaryChart = new Chart(ctx, {
    type: "pie",
    data: data,
    options: { responsive: false },
  });
}

// Render global
function render() {
  renderSalary();
  renderFixed();
  renderUnexpected();
  renderBalance();
  renderAlerts();
  renderHistoryTable();
  renderGraph();
}
render();

// Modal gastos
const dlg = document.getElementById("expenseDialog");
const form = document.getElementById("expenseForm");
const btnSave = document.getElementById("btnSave");
const btnCancel = document.getElementById("btnCancel");
const expDateLabel = document.getElementById("expDateLabel");
const expPaidLabel = document.getElementById("expPaidLabel");
let currentType = "fixed",
  editIdx = null;

function openExpenseDialog(type, gasto = null, idx = null) {
  currentType = type;
  editIdx = idx;
  form.reset();
  document.getElementById("form-title").textContent = type === "fixed" ? "Gasto fijo" : "Gasto inesperado";
  expDateLabel.style.display = type === "fixed" ? "block" : "none";
  expPaidLabel.style.display = type === "fixed" ? "block" : "none";
  if (gasto) {
    document.getElementById("expName").value = gasto.name || "";
    document.getElementById("expAmount").value = gasto.amount || "";
    document.getElementById("expDescription").value = gasto.description || "";
    document.getElementById("expDate").value = gasto.date || "";
    document.getElementById("expAlertPct").value = gasto.alertPct || "";
    document.getElementById("expPaid").checked = gasto.paid || false;
  }
  dlg.showModal();
  document.getElementById("expName").focus();
}

form.onsubmit = function (e) {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const name = document.getElementById("expName").value.trim();
  const amount = Number(document.getElementById("expAmount").value);
  const description = document.getElementById("expDescription").value.trim();
  const date = document.getElementById("expDate").value;
  const alertPct = Number(document.getElementById("expAlertPct").value) || null;
  const paid = document.getElementById("expPaid").checked;
  let obj = getMonthObj();
  const nuevo = { name, amount, description, date, alertPct, paid };
  if (currentType === "fixed") {
    if (editIdx != null) obj.fixedExpenses[editIdx] = nuevo;
    else obj.fixedExpenses.push(nuevo);
  } else {
    if (editIdx != null) obj.unexpectedExpenses[editIdx] = nuevo;
    else obj.unexpectedExpenses.push(nuevo);
  }
  dlg.close("saved");
  render();
  editIdx = null;
};

btnCancel.onclick = function () {
  dlg.close("canceled");
};
dlg.addEventListener("close", function () {
  if (dlg.returnValue !== "saved") form.reset();
});
dlg.addEventListener("click", function (ev) {
  const r = dlg.getBoundingClientRect();
  const inside =
    ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  if (!inside) dlg.close("canceled");
});

// CSV export
document.getElementById("download-csv").onclick = () => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Mes,Tipo,Gasto,Descripcion,Monto,Fecha limite,Pagado\n";
  Object.keys(months)
    .sort()
    .forEach((k) => {
      const mObj = months[k];
      ["fixedExpenses", "unexpectedExpenses"].forEach((tipo) => {
        mObj[tipo].forEach((exp) => {
          csvContent += `${k},${tipo === "fixedExpenses" ? "Fijo" : "Inesperado"},${exp.name},${exp.description || ""},${
            exp.amount
          },${exp.date || ""},${exp.paid ? "Sí" : "No"}\n`;
        });
      });
    });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "historial_gastos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
