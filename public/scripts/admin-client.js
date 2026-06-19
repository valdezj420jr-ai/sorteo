const form = document.getElementById('ticket-form');
const result = document.getElementById('generate-result');
const summaryList = document.getElementById('summary-list');
const entriesList = document.getElementById('entries-list');
const drawButton = document.getElementById('draw-button');
const drawResult = document.getElementById('draw-result');

function renderSummary(data) {
  if (!summaryList) return;
  summaryList.innerHTML = `
    <div>
      <strong>Participantes registrados</strong>
      <span>${data.total ?? 0}</span>
    </div>
    <div>
      <strong>Último registro</strong>
      <span>${data.lastRegistered || 'N/A'}</span>
    </div>
  `;
}

function renderEntries(entries) {
  if (!entriesList) return;
  if (!entries.length) {
    entriesList.innerHTML = '<p>No hay participaciones registradas todavía.</p>';
    return;
  }

  entriesList.innerHTML = entries
    .map(
      (entry) => `
      <article class="ticket-card">
        <div><strong>Código:</strong> ${entry.recibo}</div>
        <div><strong>Nombre:</strong> ${entry.nombre || '—'}</div>
        <div><strong>Email:</strong> ${entry.email || '—'}</div>
        <div><strong>Teléfono:</strong> ${entry.telefono || '—'}</div>
        <div><strong>Fecha:</strong> ${entry.fecha_creacion}</div>
        <button class="button button-secondary delete-entry" data-id="${entry.id}">Eliminar</button>
      </article>`
    )
    .join('');
}

function renderWinner(winner) {
  if (!drawResult) return;
  if (!winner) {
    drawResult.innerHTML = '<p class="alert">No hay participantes registrados para el sorteo.</p>';
    return;
  }

  drawResult.innerHTML = `
    <div class="result-block">
      <p><strong>Ganador:</strong> ${winner.nombre || 'Sin nombre'}</p>
      <p><strong>Email:</strong> ${winner.email || '—'}</p>
      <p><strong>Teléfono:</strong> ${winner.telefono || '—'}</p>
      <p><strong>Código:</strong> ${winner.recibo}</p>
    </div>
  `;
}

function renderAdminError(message) {
  if (entriesList) entriesList.innerHTML = `<p class="alert">${message}</p>`;
  if (summaryList) summaryList.innerHTML = `<div class="summary-error"><p class="alert">${message}</p></div>`;
}

async function fetchSummary() {
  try {
    const response = await fetch('/api/admin/summary');
    const payload = await response.json();
    if (payload.success) {
      renderSummary(payload.summary);
      return;
    }
    renderAdminError(payload.error || 'Error al obtener el resumen');
  } catch (error) {
    renderAdminError('No se pudo conectar con el servidor de admin');
  }
}

async function fetchEntries() {
  try {
    const response = await fetch('/api/admin/entries');
    const payload = await response.json();
    if (payload.success) {
      renderEntries(payload.entries || []);
      return;
    }
    renderAdminError(payload.error || 'Error al obtener las participaciones');
  } catch (error) {
    renderAdminError('No se pudo conectar con el servidor de admin');
  }
}

async function refreshData() {
  await Promise.all([fetchSummary(), fetchEntries()]);
}

async function drawWinner() {
  const response = await fetch('/api/admin/draw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
}

async function generateParticipationQr(label) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  return response.json();
}

function createResultHtml(resultData) {
  return `
    <div class="result-block print-target">
      <p><strong>${resultData.label}</strong></p>
      <p><strong>Código:</strong> ${resultData.code || '—'}</p>
      <p><strong>URL de participación:</strong></p>
      <p>${resultData.link}</p>
      <div class="qr-container">
        <img src="${resultData.qr}" alt="QR de participación" />
      </div>
    </div>
    <button id="print-ticket" class="button button-secondary">Imprimir ticket</button>
  `;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!result) return;

    const labelInput = document.getElementById('label');
    const label = labelInput?.value.trim();

    result.innerHTML = '<p>Cargando...</p>';

    try {
      const payload = await generateParticipationQr(label);
      if (payload.error) {
        result.innerHTML = `<p class="alert">${payload.error}</p>`;
        return;
      }
      result.innerHTML = createResultHtml(payload);
      await fetchSummary();
      await fetchEntries();
      setTimeout(() => window.print(), 100);
    } catch (error) {
      result.innerHTML = `<p class="alert">Error al generar el QR.</p>`;
    }
  });
}

if (result) {
  result.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.id === 'print-ticket') {
      window.print();
    }
  });
}

window.addEventListener('load', async () => {
  await refreshData();

  if (entriesList) {
    entriesList.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains('delete-entry')) return;
      const id = target.dataset.id;
      if (!id) return;
      if (!confirm('¿Eliminar este registro?')) return;

      target.disabled = true;
      const response = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.success) {
        await refreshData();
      } else {
        alert(result.error || 'No se pudo eliminar el registro.');
        target.disabled = false;
      }
    });
  }

  if (drawButton) {
    drawButton.addEventListener('click', async () => {
      drawButton.disabled = true;
      drawButton.textContent = 'Eligiendo ganador...';
      const response = await drawWinner();
      drawButton.disabled = false;
      drawButton.textContent = 'Realizar sorteo';
      if (response.success) {
        renderWinner(response.winner);
      } else {
        if (drawResult) drawResult.innerHTML = `<p class="alert">${response.error || 'No se pudo realizar el sorteo.'}</p>`;
      }
    });
  }

  const refreshButton = document.getElementById('refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Actualizando...';
      await refreshData();
      refreshButton.disabled = false;
      refreshButton.textContent = 'Actualizar';
    });
  }

  setInterval(refreshData, 15000);
});
