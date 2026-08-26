// ---------------------------------------------------------------- SETUP

const params = new URLSearchParams(window.location.search);
var savedCodice = ''; try { savedCodice = localStorage.getItem('fanta_codice') || ''; } catch (e) {}
var savedNome = ''; try { savedNome = localStorage.getItem('fanta_nome') || ''; } catch (e) {}
const codiceStanza = (params.get('codice') || savedCodice || '').toUpperCase();
let mioNome = params.get('nome') || savedNome || '';
let isSpettatore = mioNome.trim().toLowerCase().includes('ospite');

let approvato = false; // false finché l'utente è ancora in attesa di approvazione

if (!codiceStanza || !mioNome) {
  window.location.href = 'index.html';
}

try { localStorage.setItem('fanta_codice', codiceStanza); } catch (e) {}
try { localStorage.setItem('fanta_nome', mioNome); } catch (e) {}

document.getElementById('codiceStanzaLabel').textContent = codiceStanza;
document.getElementById('nomeLabel').textContent = mioNome;

// ---------------------------------------------------------------- MODALITÀ SPETTATORE (UI)

if (isSpettatore) {
  document.getElementById('formChiamata').style.display = 'none';
  document.getElementById('badgeSpettatore').classList.remove('hidden');
  document.getElementById('pannelloRosa').classList.add('hidden');
  document.getElementById('pannelloSpettatore').classList.remove('hidden');
  document.getElementById('budgetLabel').textContent = '👁️';
}

// ---------------------------------------------------------------- SPLASH INTRO
(function gestisciIntro() {
  const chiudiIntro = () => {
    const overlay = document.getElementById('splashIntro');
    if (!overlay || overlay.style.display === 'none') return;
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      // Subito dopo il video, se l'utente non è ancora approvato, mostra l'overlay di attesa.
      if (!approvato) mostraOverlayAttesa('⏳', 'In attesa di approvazione da parte dell\'Admin...', true);
    }, 400);
  };

  if (sessionStorage.getItem('introGiocata_' + codiceStanza) === 'true') {
    const overlay = document.getElementById('splashIntro');
    if (overlay) overlay.style.display = 'none';
    if (!approvato) mostraOverlayAttesa('⏳', 'In attesa di approvazione da parte dell\'Admin...', true);
  } else {
    const video = document.getElementById('introVideo');
    const skipBtn = document.getElementById('skipIntroBtn');
    const overlay = document.getElementById('splashIntro');
    overlay.style.display = 'flex';
    video.play().catch(() => {});
    video.addEventListener('ended', chiudiIntro);
    skipBtn.addEventListener('click', chiudiIntro);
    video.addEventListener('ended', () => sessionStorage.setItem('introGiocata_' + codiceStanza, 'true'));
    skipBtn.addEventListener('click', () => sessionStorage.setItem('introGiocata_' + codiceStanza, 'true'));
  }
})();

function mostraOverlayAttesa(icona, testo, mostraSpinner) {
  const overlay = document.getElementById('overlayAttesa');
  document.getElementById('overlayAttesaIcon').textContent = icona;
  document.getElementById('overlayAttesaTesto').textContent = testo;
  document.getElementById('overlayAttesaSpinner').style.display = mostraSpinner ? '' : 'none';
  document.getElementById('btnRifiutatoEsci').classList.add('hidden');
  overlay.classList.remove('hidden');
}

function nascondiOverlayAttesa() {
  const overlay = document.getElementById('overlayAttesa');
  overlay.classList.add('hidden');
  approvato = true;
}

function mostraRifiutato() {
  const overlay = document.getElementById('overlayAttesa');
  document.getElementById('overlayAttesaIcon').textContent = '🚫';
  document.getElementById('overlayAttesaTesto').textContent = 'La tua richiesta di accesso è stata rifiutata dall\'Admin.';
  document.getElementById('overlayAttesaSpinner').style.display = 'none';
  document.getElementById('btnRifiutatoEsci').classList.remove('hidden');
  overlay.classList.remove('hidden');
}

const RUOLI = [
  { key: 'PORTIERE', label: 'Portieri', short: 'P', color: 'bg-amber-500/20 text-amber-300' },
  { key: 'DIFENSORE', label: 'Difensori', short: 'D', color: 'bg-sky-500/20 text-sky-300' },
  { key: 'CENTROCAMPISTA', label: 'Centrocampisti', short: 'C', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'ATTACCANTE', label: 'Attaccanti', short: 'A', color: 'bg-rose-500/20 text-rose-300' },
];
const RUOLO_INFO = Object.fromEntries(RUOLI.map(r => [r.key, r]));
const SLOT_CONFIG_KEY = { PORTIERE: 'slotPortieri', DIFENSORE: 'slotDifensori', CENTROCAMPISTA: 'slotCentrocampisti', ATTACCANTE: 'slotAttaccanti' };

let ultimoStato = null;
let listinoSelezionato = null; // { nome, ruolo, squadra } se l'utente ha scelto un suggerimento
let valoreStaged = null;       // valore attualmente impostato sullo slider di rilancio
let ultimaOffertaVista = null; // per capire quando resettare lo slider (nuova offerta altrui)
let ultimoSecondoVibrato = null; // per non far vibrare più volte lo stesso secondo
let ultimoEventoAggiudicazioneVincitore = null; // per triggerare confetti solo al vincitore
let userHasSelectedValue = false; // lock: true quando l'utente ha impostato manualmente il dial
let stuzzicaCooldownUntil = 0; // timestamp fino a cui il pulsante stuzzica è disabilitato

let steppMin = 1, steppMax = 100;
let astaAttivaPrecedente = false;

let top5Acquisti = []; // { nome, prezzo, acquirente }
let top5Timer = null;
let watchlistTimeout = null;

// Reset totale dello stato stepper a ogni nuova chiamata
function resetDialState() {
  valoreStaged = 0;
  ultimaOffertaVista = null;
  userHasSelectedValue = null;
  ultimoSecondoVibrato = null;
  var sv = document.getElementById('stepperValueDisplay');
  if (sv) sv.textContent = '1';
  var pp = document.getElementById('prezzoAttualeDisplay');
  if (pp) { pp.textContent = '-'; pp.className = ''; }
  var ld = document.getElementById('leaderDisplay');
  if (ld) { ld.textContent = ''; ld.className = ''; }
  var btnConf = document.getElementById('btnConfermaDial');
  if (btnConf) btnConf.textContent = 'INVIA';
}

// ---------------------------------------------------------------- AUDIO (beep locale, solo su azione propria)

let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.35);
  } catch (e) { /* audio non disponibile, ignora */ }
}

// ---------------------------------------------------------------- AUDIO CASH (rilancio pesante)

const cashAudio = new Audio('/audio/cash.mp3');
cashAudio.volume = 0.45;
let cashInRiproduzione = false;
function playCash() {
  if (cashInRiproduzione) return;
  cashInRiproduzione = true;
  cashAudio.currentTime = 0;
  cashAudio.play().catch(() => {}).finally(() => { cashInRiproduzione = false; });
}

// ---------------------------------------------------------------- CONFETTI WINNER

function lanciaConfetti() {
  const overlay = document.getElementById('confettiOverlay');
  overlay.innerHTML = '';
  overlay.classList.remove('active', 'hidden');
  void overlay.offsetWidth; // force reflow per riattivare l'animazione
  overlay.classList.add('active');

  const emoji = ['🏆', '🎉', '⚽', '🍾', '✨', '🎊', '🥇', '🎆'];
  const count = 40;
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'confetti-particle';
    span.textContent = emoji[Math.floor(Math.random() * emoji.length)];
    span.style.left = Math.random() * 100 + '%';
    span.style.setProperty('--fall-duration', (2 + Math.random() * 1.5) + 's');
    span.style.setProperty('--fall-delay', (Math.random() * 0.8) + 's');
    span.style.setProperty('--fall-spin', (360 + Math.random() * 720) + 'deg');
    span.style.fontSize = (1.2 + Math.random() * 1.8) + 'rem';
    overlay.appendChild(span);
  }

  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  }, 3800);
}

// ---------------------------------------------------------------- AUTOCOMPLETE LISTINO

let timeoutRicerca = null;
const inputNome = document.getElementById('inputNomeCalciatore');
const listaSuggerimenti = document.getElementById('listaSuggerimenti');

inputNome.addEventListener('input', () => {
  listinoSelezionato = null; // l'utente sta digitando di nuovo, il suggerimento precedente non è più valido
  const query = inputNome.value.trim();
  clearTimeout(timeoutRicerca);
  if (query.length < 2) {
    nascondiSuggerimenti();
    return;
  }
  timeoutRicerca = setTimeout(() => cercaListino(query), 250);
});

inputNome.addEventListener('blur', () => {
  // piccolo ritardo per permettere al click sul suggerimento di registrarsi prima di nascondere
  setTimeout(nascondiSuggerimenti, 150);
});

async function cercaListino(query) {
  try {
    const res = await fetch(`/api/listino/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return;
    const risultati = await res.json();
    mostraSuggerimenti(risultati);
  } catch (e) { /* listino non raggiungibile, l'utente può comunque scrivere a mano */ }
}

function mostraSuggerimenti(risultati) {
  if (!risultati || risultati.length === 0) {
    nascondiSuggerimenti();
    return;
  }
  listaSuggerimenti.innerHTML = '';
  risultati.forEach(g => {
    const info = RUOLO_INFO[g.ruolo];
    const li = document.createElement('li');
    li.className = 'px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm flex items-center justify-between gap-2';
    li.innerHTML = `
      <span class="truncate">${escapeHtml(g.nome)}</span>
      <span class="flex items-center gap-1.5 shrink-0">
        <span class="text-[10px] text-slate-500">${escapeHtml(g.squadra || '')}</span>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${info.color}">${info.short}</span>
      </span>
    `;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault(); // evita che il blur dell'input scatti prima del click
      inputNome.value = g.nome;
      document.getElementById('selectRuolo').value = g.ruolo;
      listinoSelezionato = g;
      nascondiSuggerimenti();
    });
    listaSuggerimenti.appendChild(li);
  });
  listaSuggerimenti.classList.remove('hidden');
}

function nascondiSuggerimenti() {
  listaSuggerimenti.classList.add('hidden');
}

async function aggiornaStatoListino() {
  const el = document.getElementById('listinoStato');
  if (!el) return;
  try {
    const res = await fetch('/api/listino/stato');
    const stato = await res.json();
    if (stato.errore) {
      el.textContent = '⚠️ ' + stato.errore;
      el.className = 'text-xs text-rose-400 mb-2';
    } else {
      el.textContent = '✅ ' + stato.numeroGiocatori + ' giocatori caricati';
      el.className = 'text-xs text-emerald-400 mb-2';
    }
  } catch (e) {
    el.textContent = '⚠️ impossibile contattare il server';
    el.className = 'text-xs text-rose-400 mb-2';
  }
}
aggiornaStatoListino();

document.getElementById('btnRicaricaListino').addEventListener('click', async () => {
  const el = document.getElementById('listinoStato');
  el.textContent = 'ricarico...';
  el.className = 'text-xs text-slate-400 mb-2';
  try {
    await fetch('/api/listino/ricarica', { method: 'POST' });
  } catch (e) { /* ignora, aggiornaStatoListino mostrerà l'errore */ }
  aggiornaStatoListino();
});

// ---------------------------------------------------------------- WATCHLIST / LISTA DESIDERI

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem('fanta_watchlist_' + codiceStanza)) || [];
  } catch (e) { return []; }
}

function saveWatchlist(list) {
  localStorage.setItem('fanta_watchlist_' + codiceStanza, JSON.stringify(list));
}

function isInWatchlist(nome) {
  return getWatchlist().some(w => w.nome.toLowerCase() === nome.toLowerCase());
}

function toggleWatchlist(calciatore) {
  var list = getWatchlist();
  var idx = list.findIndex(w => w.nome.toLowerCase() === calciatore.nome.toLowerCase());
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(calciatore);
  }
  saveWatchlist(list);
  renderWatchlistItems();
}

function renderWatchlistItems() {
  var list = getWatchlist();
  var container = document.getElementById('watchlistItems');
  if (!container) return;
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p class="watchlist-empty">Nessun calciatore in lista desideri.<br>Cercane uno e cliccalo per aggiungerlo.</p>';
    return;
  }
  list.forEach(function (c) {
    var div = document.createElement('div');
    div.className = 'watchlist-item';
    var info = (RUOLO_INFO[c.ruolo] || {}).short || '?';
    div.innerHTML = '<span>' + escapeHtml(c.nome) + ' <span style="font-size:0.65rem;color:rgba(148,163,184,0.5)">' + info + '</span></span>';
    var btn = document.createElement('button');
    btn.className = 'watchlist-item-remove';
    btn.textContent = '✕';
    btn.addEventListener('click', function () { toggleWatchlist(c); });
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function openWatchlistDrawer() {
  document.getElementById('watchlistBackdrop').style.display = '';
  document.getElementById('watchlistDrawer').style.display = '';
  setTimeout(function () {
    document.getElementById('watchlistBackdrop').classList.remove('fade');
    document.getElementById('watchlistDrawer').classList.add('open');
  }, 10);
  document.getElementById('watchlistSearch').value = '';
  document.getElementById('watchlistSuggestions').classList.add('hidden');
  renderWatchlistItems();
}

function closeWatchlistDrawer() {
  document.getElementById('watchlistBackdrop').classList.add('fade');
  document.getElementById('watchlistDrawer').classList.remove('open');
  setTimeout(function () {
    document.getElementById('watchlistBackdrop').style.display = 'none';
    document.getElementById('watchlistDrawer').style.display = 'none';
  }, 300);
}

document.getElementById('btnWatchlist').addEventListener('click', openWatchlistDrawer);
document.getElementById('btnCloseWatchlist').addEventListener('click', closeWatchlistDrawer);
document.getElementById('watchlistBackdrop').addEventListener('click', closeWatchlistDrawer);

document.getElementById('watchlistSearch').addEventListener('input', function () {
  clearTimeout(watchlistTimeout);
  var q = this.value.trim();
  if (q.length < 2) {
    document.getElementById('watchlistSuggestions').classList.add('hidden');
    return;
  }
  watchlistTimeout = setTimeout(function () { cercaPerWatchlist(q); }, 250);
});

document.getElementById('watchlistSearch').addEventListener('blur', function () {
  setTimeout(function () {
    document.getElementById('watchlistSuggestions').classList.add('hidden');
  }, 150);
});

async function cercaPerWatchlist(query) {
  try {
    var res = await fetch('/api/listino/search?query=' + encodeURIComponent(query));
    if (!res.ok) return;
    var risultati = await res.json();
    if (!risultati || risultati.length === 0) {
      document.getElementById('watchlistSuggestions').classList.add('hidden');
      return;
    }
    var ul = document.getElementById('watchlistSuggestions');
    ul.innerHTML = '';
    risultati.forEach(function (g) {
      var li = document.createElement('li');
      var added = isInWatchlist(g.nome);
      if (added) li.classList.add('added');
      li.innerHTML = '<span>' + escapeHtml(g.nome) + '</span><span style="font-size:0.65rem;color:rgba(148,163,184,0.5)">' + escapeHtml(g.squadra || '') + '</span>';
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        toggleWatchlist({ nome: g.nome, ruolo: g.ruolo, squadra: g.squadra });
        document.getElementById('watchlistSuggestions').classList.add('hidden');
        if (!added) {
          document.getElementById('watchlistSearch').value = '';
        }
      });
      ul.appendChild(li);
    });
    ul.classList.remove('hidden');
  } catch (e) {}
}

// ---------------------------------------------------------------- TOP 5 SPENDERS

function registraAcquisto(nomeGiocatore, prezzo, nomeAcquirente) {
  top5Acquisti.push({ nome: nomeGiocatore, prezzo: prezzo, acquirente: nomeAcquirente });
  top5Acquisti.sort(function (a, b) { return b.prezzo - a.prezzo; });
  top5Acquisti = top5Acquisti.slice(0, 5);
  mostraTop5();
}

function mostraTop5() {
  if (top5Acquisti.length === 0) return;
  var ol = document.getElementById('top5List');
  ol.innerHTML = '';
  top5Acquisti.forEach(function (a, i) {
    var li = document.createElement('li');
    li.innerHTML = '<span class="top5-rank">' + (i + 1) + '</span><span class="top5-name">' + escapeHtml(a.nome) + '</span><span class="top5-buyer">' + escapeHtml(a.acquirente) + '</span><span class="top5-price">' + a.prezzo + '</span>';
    ol.appendChild(li);
  });
  var overlay = document.getElementById('top5Overlay');
  overlay.style.display = '';
  if (top5Timer) clearTimeout(top5Timer);
  setTimeout(function () { overlay.classList.add('show'); }, 10);
  top5Timer = setTimeout(function () {
    overlay.classList.remove('show');
    top5Timer = setTimeout(function () {
      overlay.style.display = 'none';
    }, 300);
  }, 2000);
}

// ---------------------------------------------------------------- TOAST EVENTI

function mostraToast(evento) {
  const area = document.getElementById('toastArea');
  const div = document.createElement('div');
  let stile = 'bg-slate-800 border-slate-700 text-slate-100';
  let durata = 2200;

  if (evento.tipo === 'SEI_LENTO') {
    stile = 'bg-rose-600 border-rose-500 text-white text-xl font-black';
    durata = 700;
  } else if (evento.tipo === 'ERRORE') {
    stile = 'bg-rose-900/90 border-rose-700 text-rose-100';
    durata = 2500;
  } else if (evento.tipo === 'AGGIUDICAZIONE') {
    stile = 'bg-emerald-600 border-emerald-500 text-white font-bold';
    durata = 3200;
  } else if (evento.tipo === 'SIMILE') {
    stile = 'bg-amber-500 border-amber-400 text-slate-950 font-semibold';
    durata = 2000;
  } else if (evento.tipo === 'STUZZICA') {
    stile = 'toast-stuzzica';
    durata = 4000;
  }

  div.className = `animate-toast pointer-events-auto border rounded-xl px-4 py-2.5 shadow-lg ${stile}`;
  let testoMostrato = evento.messaggio;
  if (evento.tipo === 'STUZZICA' && testoMostrato) {
    testoMostrato = testoMostrato.replace(/^💬\s*Messaggio da [^:]+:\s*/, '');
  }
  div.textContent = testoMostrato;
  area.appendChild(div);
  setTimeout(() => div.remove(), durata);
}

// ---------------------------------------------------------------- BACKUP AUTOMATICO

function salvaBackupRicevuto(backup) {
  try {
    localStorage.setItem('fanta_backup_' + codiceStanza, JSON.stringify(backup));
    const el = document.getElementById('backupStatoLabel');
    if (el) {
      const ora = new Date(backup.timestampMillis || Date.now());
      const hh = String(ora.getHours()).padStart(2, '0');
      const mm = String(ora.getMinutes()).padStart(2, '0');
      const ss = String(ora.getSeconds()).padStart(2, '0');
      el.textContent = '✅ ultimo backup: ' + hh + ':' + mm + ':' + ss;
      el.className = 'text-xs text-emerald-400 mb-2';
    }
  } catch (e) { /* storage pieno o non disponibile, non è grave */ }
}

document.getElementById('btnScaricaBackup').addEventListener('click', () => {
  var grezzo = null;
  try { grezzo = localStorage.getItem('fanta_backup_' + codiceStanza); } catch (e) {}
  if (!grezzo) {
    alert('Nessun backup ancora disponibile: il primo arriva entro 60 secondi dall\'apertura della stanza.');
    return;
  }
  const blob = new Blob([grezzo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const adesso = new Date();
  const timestamp = adesso.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `backup-${codiceStanza}-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---------------------------------------------------------------- AUTO-SAVE + RESTORE

function inviaBackupAlServer() {
  if (!ultimoStato) return;
  try {
    fetch('/api/backup/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ultimoStato)
    }).catch(() => {});
  } catch (e) { /* ignora */ }
}

setInterval(inviaBackupAlServer, 60000);

document.getElementById('btnRipristinaBackup').addEventListener('click', async () => {
  if (!confirm('Ripristinare lo stato dal backup del server? La stanza attuale verrà sovrascritta.')) return;
  try {
    const res = await fetch('/api/backup/restore', { method: 'POST' });
    const data = await res.json();
    if (data.nuovoCodice) {
      alert('Backup ripristinato! Nuovo codice stanza: ' + data.nuovoCodice);
      window.location.href = 'stanza.html?codice=' + data.nuovoCodice + '&nome=' + encodeURIComponent(mioNome);
    } else {
      alert('Nessun backup trovato sul server.');
    }
  } catch (e) {
    alert('Errore durante il ripristino del backup.');
  }
});

document.getElementById('btnRifiutatoEsci').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// ---------------------------------------------------------------- QR CODE

document.getElementById('btnMostraQr').addEventListener('click', () => {
  const bloc = document.getElementById('blocQr');
  const giaVisibile = !bloc.classList.contains('hidden');
  if (giaVisibile) {
    bloc.classList.add('hidden');
    return;
  }
  bloc.classList.remove('hidden');

  const link = `${window.location.origin}/index.html?codice=${codiceStanza}`;
  document.getElementById('qrLinkTesto').textContent = link;

  const wrap = document.getElementById('qrCanvasWrap');
  wrap.innerHTML = '';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  if (window.QRCode) {
    QRCode.toCanvas(canvas, link, { width: 200, margin: 1 }, (err) => {
      if (err) wrap.textContent = 'Impossibile generare il QR, usa il link qui sotto.';
    });
  } else {
    wrap.textContent = 'QR non disponibile, usa il link qui sotto.';
  }
});

// ---------------------------------------------------------------- STOMP

const stompClient = new StompJs.Client({
  webSocketFactory: () => new SockJS('/ws'),
  reconnectDelay: 3000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
});

stompClient.onConnect = () => {
  document.getElementById('dotConnessione').className = 'dot-status online ml-1';
  // coda privata: qui arriva solo lo stato personalizzato per questo utente
  // (budget e rose degli altri partecipanti non ci vengono nemmeno inviati)
  stompClient.subscribe('/user/queue/stato', (msg) => {
    const dto = JSON.parse(msg.body);
    renderStato(dto);
  });
  // backup automatico ogni 60s, arriva solo se sei l'admin della stanza
  stompClient.subscribe('/user/queue/backup', (msg) => {
    const backup = JSON.parse(msg.body);
    salvaBackupRicevuto(backup);
  });
  stompClient.publish({
    destination: `/app/stanza/${codiceStanza}/join`,
    body: JSON.stringify({ nome: mioNome })
  });
};

stompClient.onDisconnect = () => {
  document.getElementById('dotConnessione').className = 'dot-status connecting ml-1';
};

stompClient.onWebSocketClose = () => {
  document.getElementById('dotConnessione').className = 'dot-status offline ml-1';
};

stompClient.activate();

// ---------------------------------------------------------------- RENDER

function renderStato(dto) {
  ultimoStato = dto;

  const me = dto.partecipanti.find(u => u.nome.toLowerCase() === mioNome.toLowerCase());
  const sonoAdmin = !!(me && me.admin) || (dto.adminNome && dto.adminNome.toLowerCase() === mioNome.toLowerCase());

  // Approvazione: se ricevo uno stato senza IN_ATTESA/RIFIUTATO, sono dentro
  const evt = dto.evento;
  if (!approvato && evt && evt.tipo === 'IN_ATTESA') {
    mostraOverlayAttesa('⏳', evt.messaggio || 'In attesa di approvazione da parte dell\'Admin...', true);
  } else if (!approvato && evt && evt.tipo === 'RIFIUTATO') {
    mostraRifiutato();
  } else if (!approvato && evt && evt.tipo === 'SUBENTRATO') {
    nascondiOverlayAttesa();
  } else if (me) {
    nascondiOverlayAttesa();
  }

  if (me) {
    document.getElementById('budgetLabel').textContent = me.budgetResiduo;
    renderRosa(me.rosa, dto.configurazione);
    renderSlotProgress(me.rosa, dto.configurazione);
    document.getElementById('pannelloAdmin').classList.toggle('hidden', !sonoAdmin);
    if (sonoAdmin) {
      document.getElementById('timerInput').value = dto.configurazione.timerSecondi;
    }
  }

  renderPartecipanti(dto.partecipanti, dto.adminNome, dto.astaCorrente);
  renderLog(dto.log);
  renderPiatto(dto.astaCorrente, dto.configurazione, me);
  renderPausa(dto.inPausa, sonoAdmin);

  // Sala d'Attesa: visibile solo all'admin, aggiornata a ogni broadcast
  if (sonoAdmin) {
    renderSalaAttesa(dto.richiestePendenti || [], dto.partecipanti);
  }

  if (isSpettatore) {
    renderDashboardSpettatore(dto);
  }

  if (sonoAdmin && dto.inPausa) {
    renderGestioneRose(dto.partecipanti);
    document.getElementById('pannelloGestioneRose').classList.remove('hidden');
  } else {
    document.getElementById('pannelloGestioneRose').classList.add('hidden');
  }

  if (dto.evento && (dto.evento.targetNome == null || dto.evento.targetNome.toLowerCase() === mioNome.toLowerCase())) {
    if (dto.evento.tipo === 'AUDIO_CASH') {
      playCash();
    } else if (dto.evento.tipo === 'SUBENTRATO' && dto.evento.messaggio) {
      var subMatch = dto.evento.messaggio.match(/^SUBENTRATO:(.+?):(-?\d+)$/);
      if (subMatch) {
        var nuovoMioNome = subMatch[1];
        var nuovoBudget = subMatch[2];
        mioNome = nuovoMioNome;
        isSpettatore = nuovoMioNome.trim().toLowerCase().includes('ospite');
        try { localStorage.setItem('fanta_nome', nuovoMioNome); } catch (e) {}
        document.getElementById('nomeLabel').textContent = nuovoMioNome;
        document.getElementById('budgetLabel').textContent = nuovoBudget;
        if (isSpettatore) {
          document.getElementById('badgeSpettatore').classList.remove('hidden');
          document.getElementById('pannelloRosa').classList.add('hidden');
          document.getElementById('pannelloSpettatore').classList.remove('hidden');
        } else {
          document.getElementById('badgeSpettatore').classList.add('hidden');
          document.getElementById('pannelloRosa').classList.remove('hidden');
          document.getElementById('pannelloSpettatore').classList.add('hidden');
        }
        mostraToast({ tipo: 'AGGIUDICAZIONE', messaggio: 'Sei subentrato alla squadra ' + nuovoMioNome + '!' });
      }
    } else {
      mostraToast(dto.evento);
    }

    if (dto.evento.tipo === 'AGGIUDICAZIONE' && dto.evento.messaggio) {
      var match = dto.evento.messaggio.match(/^(.+?) si aggiudica (.+?) per (\d+) crediti!$/);
      if (match) {
        registraAcquisto(match[2], parseInt(match[3], 10), match[1]);
      }
      const nomeVincitore = dto.evento.messaggio.split(' ')[0];
      if (nomeVincitore && nomeVincitore.toLowerCase() === mioNome.toLowerCase()) {
        lanciaConfetti();
      }
      resetDialState();
      inviaBackupAlServer();
    }
  }
}

function renderPausa(inPausa, sonoAdmin) {
  document.getElementById('bannerPausa').classList.toggle('hidden', !inPausa);

  const btn = document.getElementById('btnTogglePausa');
  if (sonoAdmin) {
    btn.textContent = inPausa ? '▶ Riprendi asta' : '⏸ Metti in pausa';
    btn.className = inPausa
      ? 'w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-sm mb-3'
      : 'w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-sm mb-3';
  }

  // durante la pausa, blocca chiamate e rilanci per tutti
  const formChiamata = document.getElementById('formChiamata');
  formChiamata.querySelectorAll('input, select, button').forEach(el => el.disabled = inPausa);
  formChiamata.classList.toggle('opacity-50', inPausa);

  ['btnRilancioRapido', 'btnConfermaDial', 'btnStepperMinus', 'btnStepperPlus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = inPausa;
      el.classList.toggle('opacity-40', inPausa);
      el.classList.toggle('cursor-not-allowed', inPausa);
    }
  });
}

function renderPartecipanti(partecipanti, adminNome, astaCorrente) {
  const ul = document.getElementById('listaPartecipanti');
  ul.innerHTML = '';
  const astaAttiva = !!(astaCorrente && astaCorrente.attiva);
  partecipanti.forEach(u => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2';
    const isMe = u.nome.toLowerCase() === mioNome.toLowerCase();
    li.innerHTML = `
      <span class="flex items-center gap-1.5 truncate">
        <span class="w-1.5 h-1.5 rounded-full ${u.connesso ? 'bg-emerald-400' : 'bg-slate-600'}"></span>
        <span class="truncate ${isMe ? 'font-bold text-emerald-400' : ''}">${escapeHtml(u.nome)}</span>
        ${u.admin ? '<span class="text-[10px] text-amber-400">★</span>' : ''}
        ${u.spettatore ? '<span class="text-[10px] text-sky-400 ml-0.5">👁️</span>' : ''}
      </span>
      <span class="flex items-center gap-2">
        <span class="text-slate-400 font-mono text-xs">${u.spettatore ? '👁️' : (u.budgetResiduo === null || u.budgetResiduo === undefined ? '🔒' : u.budgetResiduo)}</span>
        ${!isMe && u.connesso && !u.spettatore ? `<button class="btn-stuzzica" data-target="${escapeAttr(u.nome)}" title="Stuzzica!" ${astaAttiva ? 'disabled' : ''}>💬</button>` : ''}
      </span>
    `;
    ul.appendChild(li);
  });

  ul.querySelectorAll('.btn-stuzzica').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (!target || btn.disabled) return;
      if (Date.now() < stuzzicaCooldownUntil) {
        const secRimanenti = Math.ceil((stuzzicaCooldownUntil - Date.now()) / 1000);
        btn.title = 'Aspetta ' + secRimanenti + 's...';
        return;
      }
      beep();
      stompClient.publish({
        destination: `/app/stanza/${codiceStanza}/stuzzica`,
        body: JSON.stringify({ nomeDestinatario: target })
      });
      stuzzicaCooldownUntil = Date.now() + 30000;
      btn.disabled = true;
      const origText = btn.textContent;
      const countdownId = 'cd_' + Math.random();
      btn.dataset.cdId = countdownId;
      function tickCooldown() {
        if (btn.dataset.cdId !== countdownId) return;
        const rim = Math.ceil((stuzzicaCooldownUntil - Date.now()) / 1000);
        if (rim > 0) {
          btn.textContent = rim + 's';
          setTimeout(tickCooldown, 500);
        } else {
          btn.textContent = origText;
          btn.disabled = false;
          btn.title = 'Stuzzica!';
        }
      }
      setTimeout(tickCooldown, 200);
    });
  });
}

function renderLog(log) {
  const ul = document.getElementById('listaLog');
  ul.innerHTML = '';
  log.forEach(riga => {
    const li = document.createElement('li');
    li.textContent = riga;
    ul.appendChild(li);
  });
}

function renderRosa(rosa, config) {
  const container = document.getElementById('rosaContainer');
  container.innerHTML = '';
  RUOLI.forEach(r => {
    const giocatori = rosa[r.key] || [];
    const slotTotali = config[SLOT_CONFIG_KEY[r.key]];
    const spesa = giocatori.reduce((sum, g) => sum + (g.prezzoPagato || 0), 0);
    const block = document.createElement('div');
    block.innerHTML = `
      <h3 class="text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        <span class="px-1.5 py-0.5 rounded ${r.color}">${r.short}</span>
        <span class="text-slate-400">${r.label}</span>
        <span class="text-slate-600 ml-auto">${giocatori.length}/${slotTotali} <span class="text-slate-500">(${spesa} cr.)</span></span>
      </h3>
      <ul class="space-y-1 text-sm mb-3"></ul>
    `;
    const ul = block.querySelector('ul');
    for (let i = 0; i < slotTotali; i++) {
      const g = giocatori[i];
      const li = document.createElement('li');
      if (g) {
        li.className = 'flex justify-between bg-slate-800/60 rounded-lg px-2 py-1';
        li.innerHTML = `<span class="truncate">${escapeHtml(g.nome)}</span><span class="text-emerald-400 font-mono">${g.prezzoPagato}</span>`;
      } else {
        li.className = 'flex justify-between border border-dashed border-slate-800 rounded-lg px-2 py-1 text-slate-700';
        li.innerHTML = `<span>slot libero</span>`;
      }
      ul.appendChild(li);
    }
    container.appendChild(block);
  });
}

function renderSlotProgress(rosa, config) {
  var c = document.getElementById('slotProgressContainer');
  if (!c) return;
  var labels = { PORTIERE: 'P', DIFENSORE: 'D', CENTROCAMPISTA: 'C', ATTACCANTE: 'A' };
  var fillClasses = { PORTIERE: 'p-fill', DIFENSORE: 'd-fill', CENTROCAMPISTA: 'c-fill', ATTACCANTE: 'a-fill' };
  var labelClasses = { PORTIERE: 'p-label', DIFENSORE: 'd-label', CENTROCAMPISTA: 'c-label', ATTACCANTE: 'a-label' };
  var html = '';
  RUOLI.forEach(function (r) {
    var giocatori = (rosa[r.key] || []).length;
    var totali = config[SLOT_CONFIG_KEY[r.key]];
    var pct = totali > 0 ? Math.min(100, (giocatori / totali) * 100) : 0;
    html += '<div class="slot-progress-item">' +
      '<span class="slot-progress-label ' + (labelClasses[r.key] || '') + '">' + (labels[r.key] || r.short) + '</span>' +
      '<div class="slot-progress-bar-wrap"><div class="slot-progress-bar-fill ' + (fillClasses[r.key] || '') + '" style="width:' + pct + '%"></div></div>' +
      '<span class="slot-progress-count">' + giocatori + '/' + totali + '</span>' +
    '</div>';
  });
  c.innerHTML = html;
}

// ---------------------------------------------------------------- DASHBOARD SPETTATORE

function renderDashboardSpettatore(dto) {
  const partecipanti = dto.partecipanti || [];
  const config = dto.configurazione || {};

  // Tabella comparativa di tutte le squadre
  const tabella = document.getElementById('tabellaSquadre');
  if (!tabella) return;
  let html = '<table class="spectator-table"><thead><tr>' +
    '<th>Squadra</th><th>Budget</th><th>P</th><th>D</th><th>C</th><th>A</th><th>Cr/slot</th>' +
    '</tr></thead><tbody>';
  partecipanti.forEach(function (u) {
    const p = (u.rosa && u.rosa.PORTIERE) ? u.rosa.PORTIERE.length : 0;
    const d = (u.rosa && u.rosa.DIFENSORE) ? u.rosa.DIFENSORE.length : 0;
    const c = (u.rosa && u.rosa.CENTROCAMPISTA) ? u.rosa.CENTROCAMPISTA.length : 0;
    const a = (u.rosa && u.rosa.ATTACCANTE) ? u.rosa.ATTACCANTE.length : 0;
    const slotLiberiTotali =
      Math.max(0, (config.slotPortieri || 0) - p) +
      Math.max(0, (config.slotDifensori || 0) - d) +
      Math.max(0, (config.slotCentrocampisti || 0) - c) +
      Math.max(0, (config.slotAttaccanti || 0) - a);
    const budget = (u.budgetResiduo === null || u.budgetResiduo === undefined) ? '—' : u.budgetResiduo;
    const credPerSlot = (slotLiberiTotali > 0 && typeof budget === 'number') ? Math.floor(budget / slotLiberiTotali) : '—';
    html += '<tr>' +
      '<td>' + escapeHtml(u.nome) + (u.admin ? ' ★' : '') + '</td>' +
      '<td class="spectator-budget">' + budget + '</td>' +
      '<td>' + p + '/' + (config.slotPortieri || 0) + '</td>' +
      '<td>' + d + '/' + (config.slotDifensori || 0) + '</td>' +
      '<td>' + c + '/' + (config.slotCentrocampisti || 0) + '</td>' +
      '<td>' + a + '/' + (config.slotAttaccanti || 0) + '</td>' +
      '<td>' + credPerSlot + '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  tabella.innerHTML = html;

  // Selettore squadra per la rosa dettagliata
  const select = document.getElementById('selectSquadraSpettatore');
  const selezionatoPrima = select.value;
  select.innerHTML = '';
  partecipanti.forEach(function (u) {
    const opt = document.createElement('option');
    opt.value = u.nome;
    opt.textContent = u.nome;
    select.appendChild(opt);
  });
  if (selezionatoPrima && partecipanti.some(function (u) { return u.nome === selezionatoPrima; })) {
    select.value = selezionatoPrima;
  }

  renderRosaSquadraSpettatore(partecipanti);
  select.onchange = function () { renderRosaSquadraSpettatore(partecipanti); };
}

function renderRosaSquadraSpettatore(partecipanti) {
  const select = document.getElementById('selectSquadraSpettatore');
  const container = document.getElementById('rosaSquadraSpettatore');
  if (!select || !container) return;
  const nomeSelezionato = select.value;
  const utente = partecipanti.find(function (u) { return u.nome === nomeSelezionato; });
  container.innerHTML = '';
  if (!utente) return;

  RUOLI.forEach(function (r) {
    const giocatori = (utente.rosa && utente.rosa[r.key]) ? utente.rosa[r.key] : [];
    const block = document.createElement('div');
    block.innerHTML = '<h3 class="text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">' +
      '<span class="px-1.5 py-0.5 rounded ' + r.color + '">' + r.short + '</span>' +
      '<span class="text-slate-400">' + r.label + '</span>' +
      '<span class="text-slate-600 ml-auto">' + giocatori.length + '</span></h3>';
    const ul = document.createElement('ul');
    ul.className = 'space-y-1 text-sm mb-3';
    if (giocatori.length === 0) {
      const li = document.createElement('li');
      li.className = 'text-slate-600 text-xs';
      li.textContent = 'Nessun acquisto';
      ul.appendChild(li);
    } else {
      giocatori.forEach(function (g) {
        const li = document.createElement('li');
        li.className = 'flex justify-between bg-slate-800/60 rounded-lg px-2 py-1';
        li.innerHTML = '<span class="truncate">' + escapeHtml(g.nome) + '</span><span class="text-emerald-400 font-mono">' + g.prezzoPagato + '</span>';
        ul.appendChild(li);
      });
    }
    block.appendChild(ul);
    container.appendChild(block);
  });
}

// ---------------------------------------------------------------- SALA D'ATTESA ADMIN

function renderSalaAttesa(richieste, partecipanti) {
  const panel = document.getElementById('pannelloAttesa');
  const lista = document.getElementById('listaAttesa');
  const titolo = document.getElementById('titoloAttesa');

  if (!richieste || richieste.length === 0) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  titolo.textContent = '📌 Sala d\'Attesa (' + richieste.length + ')';
  lista.innerHTML = '';

  richieste.forEach(function (r) {
    const card = document.createElement('div');
    card.className = 'waiting-user-card waiting-user-pulse';
    const tipo = r.spettatore ? ' [Ospite]' : ' [Partecipante]';
    card.innerHTML = '<div class="text-slate-300 font-semibold mb-1.5 truncate">' + escapeHtml(r.nome) + '<span class="text-sky-400 text-[10px] ml-1">' + tipo + '</span></div>' +
      '<div class="flex flex-wrap gap-1">' +
        '<button class="attesa-btn-green" onclick="azioneAttesa(\'' + codeStr(r.sessionId) + '\', \'' + escapeAttr(r.nome) + '\', \'ACCETTA\')">✅</button>' +
        '<input type="text" class="attesa-rename-input w-20" id="rename_' + codeStr(r.sessionId) + '" placeholder="nuovo nome" maxlength="24">' +
        '<button class="attesa-btn-rename" onclick="azioneRinomina(\'' + codeStr(r.sessionId) + '\', \'' + escapeAttr(r.nome) + '\')">🔄</button>' +
        '<button class="attesa-btn-red" onclick="azioneAttesa(\'' + codeStr(r.sessionId) + '\', \'' + escapeAttr(r.nome) + '\', \'RIFIUTA\')">❌</button>' +
      '</div>' +
      '<div class="flex flex-wrap gap-1 mt-1.5 items-center">' +
        '<select class="attesa-select w-28" id="sub_' + codeStr(r.sessionId) + '"></select>' +
        '<button class="attesa-btn-subentra" onclick="azioneSubentra(\'' + codeStr(r.sessionId) + '\', \'' + escapeAttr(r.nome) + '\')">Subentra</button>' +
      '</div>';
    card.setAttribute('data-sid', r.sessionId);
    lista.appendChild(card);

    // Popola il selettore squadre per subentro
    setTimeout(function () {
      var sel = document.getElementById('sub_' + r.sessionId);
      if (!sel) return;
      sel.innerHTML = '';
      partecipanti.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.nome;
        opt.textContent = p.nome;
        sel.appendChild(opt);
      });
    }, 10);
  });
}

function codeStr(s) {
  return s.replace(/['"\\<>]/g, '');
}

window.azioneAttesa = function (sessionId, nome, azione) {
  stompClient.publish({
    destination: '/app/stanza/' + codiceStanza + '/admin/attesa',
    body: JSON.stringify({ sessionId: sessionId, azione: azione })
  });
};

window.azioneRinomina = function (sessionId, nome) {
  var input = document.getElementById('rename_' + sessionId);
  var nuovoNome = (input ? input.value.trim() : '');
  if (!nuovoNome) { alert('Inserisci un nuovo nome.'); return; }
  stompClient.publish({
    destination: '/app/stanza/' + codiceStanza + '/admin/attesa',
    body: JSON.stringify({ sessionId: sessionId, azione: 'RINOMINA', nuovoNome: nuovoNome })
  });
  if (input) input.value = '';
};

window.azioneSubentra = function (sessionId, nome) {
  var sel = document.getElementById('sub_' + sessionId);
  var squadraTarget = sel ? sel.value : '';
  if (!squadraTarget) { alert('Seleziona una squadra a cui subentrare.'); return; }
  stompClient.publish({
    destination: '/app/stanza/' + codiceStanza + '/admin/attesa',
    body: JSON.stringify({ sessionId: sessionId, azione: 'SUBENTRA', squadraTarget: squadraTarget })
  });
};

// ----------------------------------------------------------------
function renderGestioneRose(partecipanti) {
  const select = document.getElementById('selectSquadraGestione');
  const selezionatoPrima = select.value;
  select.innerHTML = '';
  partecipanti.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.nome;
    opt.textContent = u.nome;
    select.appendChild(opt);
  });
  if (selezionatoPrima && partecipanti.some(u => u.nome === selezionatoPrima)) {
    select.value = selezionatoPrima;
  }

  disegnaGestioneRosaSquadra(partecipanti);
  select.onchange = () => disegnaGestioneRosaSquadra(partecipanti);
}

function disegnaGestioneRosaSquadra(partecipanti) {
  const nomeSelezionato = document.getElementById('selectSquadraGestione').value;
  const utente = partecipanti.find(u => u.nome === nomeSelezionato);
  const container = document.getElementById('listaGestioneRosa');
  container.innerHTML = '';
  if (!utente) return;

  RUOLI.forEach(r => {
    const giocatori = utente.rosa[r.key] || [];
    if (giocatori.length === 0) return;

    const titolo = document.createElement('div');
    titolo.className = 'font-bold text-slate-400 uppercase mt-2';
    titolo.textContent = r.label;
    container.appendChild(titolo);

    giocatori.forEach((g, indice) => {
      const riga = document.createElement('div');
      riga.className = 'flex items-center gap-1 bg-slate-800/60 rounded-lg p-1.5';
      riga.innerHTML = `
        <input type="text" value="${escapeAttr(g.nome)}" class="gr-nome flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs">
        <input type="number" value="${g.prezzoPagato}" min="1" class="gr-prezzo w-14 bg-slate-900 border border-slate-700 rounded px-1 py-1 text-xs text-center">
        <button class="gr-salva bg-emerald-600 hover:bg-emerald-500 text-white rounded px-1.5 py-1 text-[10px] font-bold">OK</button>
        <button class="gr-elimina bg-rose-700 hover:bg-rose-600 text-white rounded px-1.5 py-1 text-[10px] font-bold">✕</button>
      `;

      riga.querySelector('.gr-salva').addEventListener('click', () => {
        const nuovoNome = riga.querySelector('.gr-nome').value.trim();
        const nuovoPrezzo = parseInt(riga.querySelector('.gr-prezzo').value, 10);
        stompClient.publish({
          destination: `/app/stanza/${codiceStanza}/admin/modificaRosa`,
          body: JSON.stringify({
            nomeSquadra: nomeSelezionato, ruolo: r.key, indice,
            rimuovi: false, nuovoNome, nuovoPrezzo
          })
        });
      });

      riga.querySelector('.gr-elimina').addEventListener('click', () => {
        if (!confirm(`Eliminare ${g.nome} dalla rosa di ${nomeSelezionato}? Il prezzo verrà rimborsato.`)) return;
        stompClient.publish({
          destination: `/app/stanza/${codiceStanza}/admin/modificaRosa`,
          body: JSON.stringify({ nomeSquadra: nomeSelezionato, ruolo: r.key, indice, rimuovi: true })
        });
      });

      container.appendChild(riga);
    });
  });

  if (container.innerHTML === '') {
    container.innerHTML = '<p class="text-slate-600">Rosa ancora vuota.</p>';
  }
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

function renderPiatto(asta, config, me) {
  const piatto = document.getElementById('piattoAsta');
  const btnChiama = document.getElementById('btnChiama');

  if (!asta || !asta.attiva) {
    piatto.style.display = 'none';
    piatto.classList.remove('target-locked');
    var tb = document.getElementById('targetBadge');
    if (tb) tb.style.display = 'none';
    btnChiama.disabled = false;
    btnChiama.classList.remove('opacity-40', 'cursor-not-allowed');
    ultimoSecondoVibrato = null;
    if (astaAttivaPrecedente) {
      document.body.classList.remove('focus-asta');
      astaAttivaPrecedente = false;
    }
    return;
  }

  piatto.style.display = '';
  btnChiama.disabled = true;
  btnChiama.classList.add('opacity-40', 'cursor-not-allowed');

  // enter focus mode on transition
  if (!astaAttivaPrecedente) {
    astaAttivaPrecedente = true;
    resetDialState();
    document.body.classList.add('focus-asta');
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  const info = RUOLO_INFO[asta.ruolo];
  const badge = document.getElementById('badgeRuolo');
  badge.textContent = info.short + ' · ' + capitalize(asta.ruolo);
  badge.className = 'badge-ruolo';
  badge.setAttribute('data-ruolo', asta.ruolo);

  document.getElementById('nomeCalciatoreCorrente').textContent = asta.calciatoreNome;
  document.getElementById('squadraCalciatore').textContent = asta.squadra ? '(' + asta.squadra + ')' : '';

  var isTarget = isInWatchlist(asta.calciatoreNome);
  piatto.classList.toggle('target-locked', isTarget);
  var targetBadge = document.getElementById('targetBadge');
  if (!targetBadge) {
    targetBadge = document.createElement('div');
    targetBadge.id = 'targetBadge';
    targetBadge.className = 'target-badge';
    var bidSection = document.getElementById('biddingControls');
    if (bidSection) bidSection.parentNode.insertBefore(targetBadge, bidSection);
  }
  targetBadge.textContent = '🎯 OBIETTIVO D\'ASTA';
  targetBadge.style.display = isTarget ? '' : 'none';

  const totale = Math.max(config.timerSecondi, 1);
  const frazione = Math.max(0, Math.min(1, asta.secondiRimanenti / totale));
  let coloreTimer;
  if (frazione > 0.5) {
    coloreTimer = '#10b981'; // verde: >50%
  } else if (frazione > 0.25) {
    coloreTimer = '#f59e0b'; // arancione: 25%-50%
  } else {
    coloreTimer = '#dc2626'; // rosso: <25%
  }

  const secondiLabel = document.getElementById('secondiLabel');
  secondiLabel.textContent = asta.secondiRimanenti + ' s';
  secondiLabel.style.color = coloreTimer;
  const critical = asta.secondiRimanenti <= 3;
  secondiLabel.classList.toggle('timer-critical', critical);

  const barra = document.getElementById('barraTimer');
  barra.style.width = (frazione * 100).toFixed(1) + '%';
  barra.style.background = coloreTimer;
  barra.classList.toggle('critical-bar', critical);

  const timerWrap = document.getElementById('timerStickyWrap');
  timerWrap.classList.toggle('timer-critical-wrap', critical);

  // vibrazione negli ultimi 3 secondi (solo Android/Chrome: iOS Safari non supporta l'API)
  if (asta.secondiRimanenti <= 3 && asta.secondiRimanenti >= 1) {
    if (asta.secondiRimanenti !== ultimoSecondoVibrato) {
      ultimoSecondoVibrato = asta.secondiRimanenti;
      if (navigator.vibrate) navigator.vibrate(150);
    }
  } else {
    ultimoSecondoVibrato = null;
  }

  const sonoIoInTesta = me && asta.offerenteNome && asta.offerenteNome.toLowerCase() === mioNome.toLowerCase();

  aggiornaStepper(asta, config, me, sonoIoInTesta);
}

function calcolaOffertaMassima(me, config) {
  if (!me) return 0;
  let slotLiberiTotali = 0;
  RUOLI.forEach(r => {
    const usati = (me.rosa[r.key] || []).length;
    const totaliRuolo = config[SLOT_CONFIG_KEY[r.key]];
    slotLiberiTotali += Math.max(0, totaliRuolo - usati);
  });
  if (slotLiberiTotali <= 0) return 0;
  return me.budgetResiduo - (slotLiberiTotali - 1);
}

function aggiornaStepper(asta, config, me, sonoIoInTesta) {
  // Modalità spettatore: nessun controllo di puntata, solo visione del piatto.
  if (isSpettatore) {
    const ppSpett = document.getElementById('prezzoAttualeDisplay');
    const ldSpett = document.getElementById('leaderDisplay');
    document.getElementById('biddingControls').style.display = 'none';
    ppSpett.textContent = asta.offertaCorrente;
    ppSpett.className = 'text-emerald-400';
    ldSpett.textContent = asta.offerenteNome ? ('In testa: ' + asta.offerenteNome) : '';
    ldSpett.className = asta.offerenteNome ? 'leader-green' : '';
    return;
  }

  const min = asta.offertaCorrente + 1;
  const max = calcolaOffertaMassima(me, config);
  steppMin = min;
  steppMax = max;

  const slotUsatiRuolo = (me && me.rosa[asta.ruolo]) ? me.rosa[asta.ruolo].length : 0;
  const slotTotaliRuolo = config[SLOT_CONFIG_KEY[asta.ruolo]];
  const haSlotLiberi = slotTotaliRuolo - slotUsatiRuolo > 0;

  const svEl = document.getElementById('stepperValueDisplay');
  const ppEl = document.getElementById('prezzoAttualeDisplay');
  const ldEl = document.getElementById('leaderDisplay');
  const btnConf = document.getElementById('btnConfermaDial');
  const btnRapido = document.getElementById('btnRilancioRapido');
  const btnMinus = document.getElementById('btnStepperMinus');
  const btnPlus = document.getElementById('btnStepperPlus');
  const biddingBox = document.getElementById('biddingControls');

  // --- SEI IN TESTA: nascondi controlli, mostra solo leader grande ---
  if (sonoIoInTesta) {
    biddingBox.style.display = 'none';
    ppEl.textContent = asta.offertaCorrente;
    ppEl.className = '';
    ppEl.classList.add('text-emerald-400');
    ldEl.textContent = 'Sei in testa! \uD83C\uDF89';
    ldEl.className = 'self-lead';
    return;
  }

  // --- NON sei in testa: mostra controlli ---
  biddingBox.style.display = '';

  const disabilitato = !haSlotLiberi || max < min;

  if (disabilitato) {
    btnConf.disabled = true;
    btnConf.classList.add('opacity-40', 'cursor-not-allowed');
    btnRapido.disabled = true;
    btnRapido.classList.add('opacity-40', 'cursor-not-allowed');
    btnMinus.disabled = true;
    btnMinus.classList.add('opacity-40', 'cursor-not-allowed');
    btnPlus.disabled = true;
    btnPlus.classList.add('opacity-40', 'cursor-not-allowed');
    svEl.textContent = '—';
    svEl.className = 'text-4xl font-black text-slate-500 font-mono min-w-[80px] leading-none';
    ppEl.textContent = asta.offertaCorrente || '—';
    ppEl.className = '';
    if (!haSlotLiberi) {
      ldEl.textContent = 'ruolo pieno';
      ldEl.className = 'text-sm font-bold text-rose-400';
    } else if (max < min) {
      ldEl.textContent = 'budget insufficiente';
      ldEl.className = 'text-sm font-bold text-rose-400';
    } else {
      ldEl.textContent = '';
    }
    return;
  }

  btnConf.disabled = false;
  btnConf.classList.remove('opacity-40', 'cursor-not-allowed');
  btnRapido.disabled = false;
  btnRapido.classList.remove('opacity-40', 'cursor-not-allowed');
  btnMinus.disabled = false;
  btnMinus.classList.remove('opacity-40', 'cursor-not-allowed');
  btnPlus.disabled = false;
  btnPlus.classList.remove('opacity-40', 'cursor-not-allowed');

  if (rilancioDebouncing) {
    btnConf.disabled = true;
    btnConf.classList.add('opacity-40', 'cursor-not-allowed');
    btnRapido.disabled = true;
    btnRapido.classList.add('opacity-40', 'cursor-not-allowed');
  }

  ppEl.textContent = asta.offertaCorrente;
  ppEl.className = '';
  ldEl.textContent = asta.offerenteNome ? ('In testa: ' + asta.offerenteNome) : '';
  ldEl.className = asta.offerenteNome ? 'leader-green' : '';

  // Persistenza: blocca sovrascrittura finché l'utente non conferma
  // o finché l'offerta al tavolo non supera il valore selezionato
  if (ultimaOffertaVista !== asta.offertaCorrente) {
    ultimaOffertaVista = asta.offertaCorrente;
    if (!userHasSelectedValue || asta.offertaCorrente >= valoreStaged) {
      valoreStaged = min;
      userHasSelectedValue = false;
    }
  }
  valoreStaged = Math.min(Math.max(valoreStaged, min), max);

  svEl.textContent = valoreStaged;
  svEl.className = 'text-4xl font-black text-white font-mono min-w-[80px] leading-none';
  btnConf.textContent = 'INVIA';

  btnMinus.disabled = valoreStaged <= min;
  btnMinus.classList.toggle('opacity-40', valoreStaged <= min);
  btnPlus.disabled = valoreStaged >= max;
  btnPlus.classList.toggle('opacity-40', valoreStaged >= max);
}

// ---------------------------------------------------------------- AZIONI

document.getElementById('formChiamata').addEventListener('submit', (e) => {
  e.preventDefault();
  const nomeCalciatore = document.getElementById('inputNomeCalciatore').value.trim();
  const ruolo = document.getElementById('selectRuolo').value;
  const prezzoBase = parseInt(document.getElementById('inputPrezzoBase').value || '1', 10);
  if (!nomeCalciatore) return;

  beep();
  stompClient.publish({
    destination: `/app/stanza/${codiceStanza}/chiamata`,
    body: JSON.stringify({ nomeCalciatore, ruolo, prezzoBase })
  });
  document.getElementById('inputNomeCalciatore').value = '';
  document.getElementById('inputPrezzoBase').value = 1;
  listinoSelezionato = null;
  nascondiSuggerimenti();
});

let rilancioDebouncing = false;

document.getElementById('btnRilancioRapido').addEventListener('click', () => {
  if (rilancioDebouncing) return;
  beep();
  userHasSelectedValue = false;
  valoreStaged = null;
  rilancioDebouncing = true;
  setTimeout(function () { rilancioDebouncing = false; }, 400);
  setTimeout(function () { rilancioDebouncing = false; }, 800);
  var offertaAttuale = (ultimoStato && ultimoStato.astaCorrente && ultimoStato.astaCorrente.offertaCorrente) || 0;
  var importo = offertaAttuale + 1;
  stompClient.publish({
    destination: '/app/stanza/' + codiceStanza + '/rilancio',
    body: JSON.stringify({ importo: importo })
  });
});

// ---------------------------------------------------------------- STEPPER INTERACTION

function applyStepperDelta(delta) {
  const min = steppMin, max = steppMax;
  if (max < min) return;
  valoreStaged = Math.min(Math.max(valoreStaged + delta, min), max);
  userHasSelectedValue = true;
  document.getElementById('stepperValueDisplay').textContent = valoreStaged;
  document.getElementById('btnConfermaDial').textContent = 'INVIA';
  document.getElementById('btnStepperMinus').disabled = valoreStaged <= min;
  document.getElementById('btnStepperMinus').classList.toggle('opacity-40', valoreStaged <= min);
  document.getElementById('btnStepperPlus').disabled = valoreStaged >= max;
  document.getElementById('btnStepperPlus').classList.toggle('opacity-40', valoreStaged >= max);
}

function startLongPress(delta) {
  applyStepperDelta(delta);
  longPressInterval = setInterval(() => applyStepperDelta(delta), 80);
}

function stopLongPress() {
  if (longPressInterval) { clearInterval(longPressInterval); longPressInterval = null; }
}

let longPressInterval = null;

(function initStepperLongPress() {
  const btnMinus = document.getElementById('btnStepperMinus');
  const btnPlus = document.getElementById('btnStepperPlus');

  btnMinus.addEventListener('mousedown', () => { if (!btnMinus.disabled) startLongPress(-1); });
  btnMinus.addEventListener('mouseup', stopLongPress);
  btnMinus.addEventListener('mouseleave', stopLongPress);
  btnMinus.addEventListener('touchstart', (e) => { if (!btnMinus.disabled) { e.preventDefault(); startLongPress(-1); } }, { passive: false });
  btnMinus.addEventListener('touchend', stopLongPress);
  btnMinus.addEventListener('touchcancel', stopLongPress);

  btnPlus.addEventListener('mousedown', () => { if (!btnPlus.disabled) startLongPress(1); });
  btnPlus.addEventListener('mouseup', stopLongPress);
  btnPlus.addEventListener('mouseleave', stopLongPress);
  btnPlus.addEventListener('touchstart', (e) => { if (!btnPlus.disabled) { e.preventDefault(); startLongPress(1); } }, { passive: false });
  btnPlus.addEventListener('touchend', stopLongPress);
  btnPlus.addEventListener('touchcancel', stopLongPress);
})();

document.getElementById('btnConfermaDial').addEventListener('click', () => {
  if (rilancioDebouncing || !valoreStaged) return;
  beep();
  userHasSelectedValue = false;
  rilancioDebouncing = true;
  setTimeout(function () { rilancioDebouncing = false; }, 400);
  setTimeout(function () { rilancioDebouncing = false; }, 800);
  stompClient.publish({
    destination: '/app/stanza/' + codiceStanza + '/rilancio',
    body: JSON.stringify({ importo: valoreStaged })
  });
});

document.getElementById('btnTimerSalva').addEventListener('click', () => {
  const secondi = parseInt(document.getElementById('timerInput').value, 10);
  if (!secondi) return;
  stompClient.publish({
    destination: `/app/stanza/${codiceStanza}/timer`,
    body: JSON.stringify({ secondi })
  });
});

document.getElementById('btnTogglePausa').addEventListener('click', () => {
  const inPausaOra = ultimoStato && ultimoStato.inPausa;
  stompClient.publish({
    destination: `/app/stanza/${codiceStanza}/pausa`,
    body: JSON.stringify({ pausa: !inPausaOra })
  });
});

document.getElementById('btnScaricaMiaJson').addEventListener('click', () => {
  window.location.href = `/api/stanze/${codiceStanza}/rosa?nome=${encodeURIComponent(mioNome)}&formato=json`;
});
document.getElementById('btnScaricaMiaTxt').addEventListener('click', () => {
  window.location.href = `/api/stanze/${codiceStanza}/rosa?nome=${encodeURIComponent(mioNome)}&formato=txt`;
});
document.getElementById('btnScaricaTutteJson').addEventListener('click', () => {
  window.location.href = `/api/stanze/${codiceStanza}/rosa-tutte?nomeRichiedente=${encodeURIComponent(mioNome)}&formato=json`;
});
document.getElementById('btnScaricaTutteTxt').addEventListener('click', () => {
  window.location.href = `/api/stanze/${codiceStanza}/rosa-tutte?nomeRichiedente=${encodeURIComponent(mioNome)}&formato=txt`;
});

// ---------------------------------------------------------------- UTIL

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function capitalize(str) {
  return str.charAt(0) + str.slice(1).toLowerCase();
}
