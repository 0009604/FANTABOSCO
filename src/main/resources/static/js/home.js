const tabJoin = document.getElementById('tabJoin');
const tabCreate = document.getElementById('tabCreate');
const formJoin = document.getElementById('formJoin');
const formCreate = document.getElementById('formCreate');

function attivaTab(join) {
  formJoin.classList.toggle('hidden', !join);
  formCreate.classList.toggle('hidden', join);
  tabJoin.classList.toggle('bg-slate-800', join);
  tabJoin.classList.toggle('text-white', join);
  tabJoin.classList.toggle('text-slate-400', !join);
  tabCreate.classList.toggle('bg-slate-800', !join);
  tabCreate.classList.toggle('text-white', !join);
  tabCreate.classList.toggle('text-slate-400', join);
}
tabJoin.addEventListener('click', () => attivaTab(true));
tabCreate.addEventListener('click', () => attivaTab(false));

// Se si arriva da un QR code (link con ?codice=ASTA26), precompila e mostra subito "Entra"
const paramsIniziali = new URLSearchParams(window.location.search);
const codiceDaQr = paramsIniziali.get('codice');
if (codiceDaQr) {
  document.getElementById('joinCodice').value = codiceDaQr.toUpperCase();
  attivaTab(true);
  document.getElementById('joinNome').focus();
}

function mostraErrore(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ---------------- ENTRA ----------------
formJoin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errore = document.getElementById('joinErrore');
  errore.classList.add('hidden');

  const nome = document.getElementById('joinNome').value.trim();
  const codice = document.getElementById('joinCodice').value.trim().toUpperCase();

  if (!nome || !codice) return;

  try {
    const res = await fetch(`/api/stanze/${encodeURIComponent(codice)}/esiste`);
    const esiste = await res.json();
    if (!esiste) {
      mostraErrore(errore, 'Codice stanza non trovato. Controlla e riprova.');
      return;
    }
    try { localStorage.setItem('fanta_nome', nome); } catch (e) {}
    try { localStorage.setItem('fanta_codice', codice); } catch (e) {}
    window.location.href = `stanza.html?codice=${encodeURIComponent(codice)}&nome=${encodeURIComponent(nome)}`;
  } catch (err) {
    mostraErrore(errore, 'Errore di connessione al server. Riprova.');
  }
});

// ---------------- CREA ----------------
formCreate.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errore = document.getElementById('createErrore');
  errore.classList.add('hidden');

  const nomeAdmin = document.getElementById('createNomeAdmin').value.trim();
  const body = {
    nomeAdmin,
    configurazione: {
      numPartecipanti: parseInt(document.getElementById('createNumPartecipanti').value, 10),
      budgetIniziale: parseInt(document.getElementById('createBudget').value, 10),
      slotPortieri: parseInt(document.getElementById('slotP').value, 10),
      slotDifensori: parseInt(document.getElementById('slotD').value, 10),
      slotCentrocampisti: parseInt(document.getElementById('slotC').value, 10),
      slotAttaccanti: parseInt(document.getElementById('slotA').value, 10),
      timerSecondi: parseInt(document.getElementById('createTimer').value, 10),
    }
  };

  try {
    const res = await fetch('/api/stanze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      mostraErrore(errore, 'Controlla i dati inseriti e riprova.');
      return;
    }
    const data = await res.json();
    try { localStorage.setItem('fanta_nome', nomeAdmin); } catch (e) {}
    try { localStorage.setItem('fanta_codice', data.codiceStanza); } catch (e) {}
    window.location.href = `stanza.html?codice=${encodeURIComponent(data.codiceStanza)}&nome=${encodeURIComponent(nomeAdmin)}`;
  } catch (err) {
    mostraErrore(errore, 'Errore di connessione al server. Riprova.');
  }
});

// ---------------- RIPRISTINA DA BACKUP ----------------
document.getElementById('btnMostraRipristino').addEventListener('click', () => {
  document.getElementById('blocRipristino').classList.toggle('hidden');
});

document.getElementById('inputBackupFile').addEventListener('change', async (e) => {
  const erroreEl = document.getElementById('ripristinoErrore');
  const infoEl = document.getElementById('ripristinoInfo');
  erroreEl.classList.add('hidden');
  infoEl.classList.add('hidden');

  const file = e.target.files[0];
  if (!file) return;

  try {
    const testo = await file.text();
    const backup = JSON.parse(testo);

    if (!backup.adminNome || !backup.configurazione) {
      mostraErrore(erroreEl, 'Questo file non sembra un backup valido.');
      return;
    }

    infoEl.textContent = 'Ripristino in corso...';
    infoEl.classList.remove('hidden');

    const res = await fetch('/api/stanze/ripristina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: testo
    });
    if (!res.ok) {
      infoEl.classList.add('hidden');
      mostraErrore(erroreEl, 'Il server non è riuscito a ripristinare la stanza.');
      return;
    }
    const data = await res.json();
    try { localStorage.setItem('fanta_nome', backup.adminNome); } catch (e) {}
    try { localStorage.setItem('fanta_codice', data.codiceStanza); } catch (e) {}
    window.location.href = `stanza.html?codice=${encodeURIComponent(data.codiceStanza)}&nome=${encodeURIComponent(backup.adminNome)}`;
  } catch (err) {
    mostraErrore(erroreEl, 'File non leggibile: assicurati di aver scelto il file di backup .json corretto.');
  }
});
