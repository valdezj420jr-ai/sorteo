function switchTab(event) {
  const tabs = document.querySelectorAll(".tab-button");
  const sections = document.querySelectorAll(".panel-section");
  const target = event.currentTarget.dataset.target;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.target === target));
  sections.forEach((section) => {
    section.style.display = section.id === target ? "block" : "none";
  });
}

function mostrarError(text) {
  alert(text);
}

async function generarTicket(recibo) {
  const response = await fetch("/generar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recibo })
  });
  const data = await response.json();
  if (!response.ok) {
    mostrarError(data.error || "No se pudo generar el ticket");
    return null;
  }

  const resultArea = document.getElementById("resultado");
  const urlElem = document.getElementById("url");
  const qrElem = document.getElementById("qr");
  const ticketElem = document.getElementById("ticket");

  if (resultArea && urlElem && qrElem && ticketElem) {
    urlElem.textContent = data.url;
    urlElem.href = data.url;
    qrElem.src = data.qr;
    ticketElem.textContent = data.ticket;
    resultArea.style.display = "grid";
  }

  await cargarDashboard();
  return data;
}

async function cargarDashboard() {
  try {
    const [summaryResp, ticketsResp] = await Promise.all([
      fetch("/admin/summary"),
      fetch("/admin/tickets?limit=10")
    ]);

    if (!summaryResp.ok || !ticketsResp.ok) return;

    const summary = await summaryResp.json();
    const tickets = await ticketsResp.json();

    const totalTicketsElem = document.getElementById("total-tickets");
    const usedTicketsElem = document.getElementById("used-tickets");
    const pendingTicketsElem = document.getElementById("pending-tickets");
    const ticketTableBody = document.getElementById("tickets-body");

    if (totalTicketsElem) totalTicketsElem.textContent = summary.total || 0;
    if (usedTicketsElem) usedTicketsElem.textContent = summary.used || 0;
    if (pendingTicketsElem) pendingTicketsElem.textContent = summary.pending || 0;

    if (ticketTableBody) {
      ticketTableBody.innerHTML = tickets
        .map((ticket) => {
          const estado = ticket.usado ? `<span class="status-chip used">Usado</span>` : `<span class="status-chip success">Pendiente</span>`;
          return `
            <tr>
              <td>${ticket.recibo}</td>
              <td>${ticket.id}</td>
              <td>${estado}</td>
              <td>${ticket.fecha_creacion}</td>
            </tr>
          `;
        })
        .join("");
    }
  } catch (error) {
    console.error(error);
  }
}

async function buscarTicket() {
  const searchInput = document.getElementById("search-ticket");
  const searchResult = document.getElementById("search-result");
  const ticket = searchInput.value.trim();
  if (!ticket) return;
  searchResult.textContent = "Buscando...";

  const response = await fetch(`/ticket/${encodeURIComponent(ticket)}`);
  const data = await response.json();
  if (!response.ok) {
    searchResult.textContent = data.error || "Ticket no encontrado.";
    return;
  }

  const estado = data.usado ? "Usado" : "Pendiente";
  searchResult.innerHTML = `
    <div class="ticket-card">
      <p><strong>Recibo:</strong> ${data.recibo}</p>
      <p><strong>Ticket:</strong> ${data.id}</p>
      <p><strong>Nombre:</strong> ${data.nombre || "No registrado"}</p>
      <p><strong>Correo:</strong> ${data.email || "No registrado"}</p>
      <p><strong>Teléfono:</strong> ${data.telefono || "No registrado"}</p>
      <p><strong>Estado:</strong> ${estado}</p>
      <p><strong>Creado:</strong> ${data.fecha_creacion}</p>
    </div>
  `;
}

async function registrarParticipacion(ticket, nombre, correo, telefono) {
  const response = await fetch("/registrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket, nombre, correo, telefono })
  });
  const data = await response.json();
  return { ok: response.ok, data };
}

async function initParticipacion() {
  const params = new URLSearchParams(window.location.search);
  const ticket = params.get("ticket");
  const mensajeElem = document.getElementById("mensaje");
  const reciboInput = document.getElementById("recibo");
  const form = document.getElementById("participar-form");

  if (!ticket) {
    if (mensajeElem) {
      mensajeElem.textContent = "No se encontró ticket en la URL.";
      mensajeElem.style.display = "block";
    }
    if (form) form.style.display = "none";
    return;
  }

  const response = await fetch(`/ticket/${encodeURIComponent(ticket)}`);
  const data = await response.json();

  if (!response.ok) {
    if (mensajeElem) {
      mensajeElem.textContent = data.error || "Ticket no encontrado.";
      mensajeElem.style.display = "block";
    }
    if (form) form.style.display = "none";
    return;
  }

  if (reciboInput) {
    reciboInput.value = data.recibo || "";
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    const { ok, data: result } = await registrarParticipacion(ticket, nombre, correo, telefono);

    if (mensajeElem) {
      mensajeElem.textContent = result.error || result.mensaje || "Error al registrar participación.";
      mensajeElem.style.display = "block";
      if (ok) {
        mensajeElem.classList.add("success");
        mensajeElem.classList.remove("used");
        form.querySelector("button").disabled = true;
      } else {
        mensajeElem.classList.remove("success");
        mensajeElem.classList.add("used");
      }
    }
  });
}

function initAdmin() {
  const tabs = document.querySelectorAll(".tab-button");
  tabs.forEach((tab) => tab.addEventListener("click", switchTab));

  const form = document.getElementById("form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const recibo = document.getElementById("recibo").value.trim();
      if (!recibo) return;
      await generarTicket(recibo);
    });
  }

  const searchButton = document.getElementById("search-button");
  if (searchButton) {
    searchButton.addEventListener("click", buscarTicket);
  }

  cargarDashboard();
}

if (document.body.classList.contains("participar-page")) {
  initParticipacion();
} else if (document.body.classList.contains("admin-page")) {
  initAdmin();
}
