# AGENTS.md - Asta Fantacalcio Live

## Architettura Backend (Spring Boot 3.3.4)
- **WebSocket**: Configurazione STOMP su `/ws` con SockJS fallback
- **Controller Principali**:
  - `AstaWebSocketController`: gestione join/chiamate/rilanci
  - `StanzaRestController`: creazione/verifica stanze
  - `BackupController`: salvataggio/ripristino stato (`backup_asta.json`)
- **Core**: `StanzaService` con:
  - Mappa concorrente delle stanze
  - Lock Reentrant per stanza
  - Timer scheduler per countdown
  - Backup automatico ogni 60s (solo admin)
- **Modelli**: `StanzaAsta`, `Utente`, `AstaCorrente`, `ConfigurazioneAsta`

## Frontend
- **stanza.html**:
  - Layout 3-colonne (partecipanti/asta/rosa)
  - Modalità focus durante l'asta
  - Overlay intro video
- **stanza.js**:
  - Connessione STOMP con `convertAndSendToUser`
  - Gestione stati asta/timer (`secondiRimanenti`)
  - Autocomplete da listino
  - Stepper per rilanci (±1/5 con long-press)
  - Confetti per vincitori
- **style.css**:
  - Animazioni: pop, toast, focus asta
  - Stile mobile-first
  - Barra timer responsive

## Flussi WebSocket
1. `JOIN`: `/app/stanza/{codice}/join` → aggiorna lista partecipanti
2. `CHIAMATA`: Valida slot/ruolo/budget → avvia timer
3. `RILANCIO`: Verifica budget > offerta corrente +1
4. `EVENTI`: AGGIUDICAZIONE/ERRORE/SEI_LENTO via `/user/queue/stato`
5. `BACKUP`: Inviato ogni 60s solo all'admin (`/user/queue/backup`)

## Intro Video
- `assets/introAPP.mp4`:
  - Mostrato solo al primo accesso (sessionStorage)
  - Skippabile con animazione fade-out
  - Overlay fullscreen con z-index massimo

## Connessioni Dipendenze
```mermaid
graph TD
    A[StanzaService] -->|Lock| B[StanzaAsta]
    A -->|Timer| C[ScheduledExecutorService]
    D[StanzaController] -->|Usa| A
    E[WebSocketConfig] -->|STOMP| F[SockJS]
    G[frontend] -->|WebSocket| H[/ws]
```

Pronto per le tue modifiche.