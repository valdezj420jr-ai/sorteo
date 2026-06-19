const statusBox = document.getElementById('participation-status');
const ticketInfo = document.getElementById('ticket-info');
const form = document.getElementById('participation-form');

function showStatus(message, isError = false) {
  if (!statusBox) return;
  statusBox.innerHTML = `<p class="${isError ? 'alert' : 'success'}">${message}</p>`;
}

function setTicketInfo(html) {
  if (!ticketInfo) return;
  ticketInfo.innerHTML = html;
}

function getQueryParam(name) {
  const search = window.location.search || window.location.hash.replace(/^.*\?/, '');
  return new URLSearchParams(search).get(name);
}

async function registerTicket(formData) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  return response.json();
}

window.addEventListener('load', async () => {
  const ticket = getQueryParam('ticket');
  const ticketInput = document.querySelector('input[name="ticket"]');
  if (ticketInput && ticket) {
    ticketInput.value = ticket;
  }

  setTicketInfo('<p>Completa el formulario con el código entregado por el administrador y tus datos personales.</p>');
});

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = {
      ticket: document.querySelector('input[name="ticket"]')?.value.trim(),
      nombre: document.querySelector('input[name="nombre"]')?.value.trim(),
      email: document.querySelector('input[name="email"]')?.value.trim(),
      telefono: document.querySelector('input[name="telefono"]')?.value.trim(),
    };

    if (!formData.ticket || !formData.nombre || !formData.email || !formData.telefono) {
      showStatus('Todos los campos son obligatorios.', true);
      return;
    }

    showStatus('Enviando participación...');

    try {
      const result = await registerTicket(formData);
      if (result.error) {
        showStatus(result.error, true);
        return;
      }
      showStatus(result.message || 'Participación registrada correctamente.');
      form.style.display = 'none';
    } catch (error) {
      showStatus('Error al registrar la participación.', true);
    }
  });
}
