# ⚽ Asta Fantacalcio Live

App web real-time per gestire l'asta del Fantacalcio dal vivo: un Admin crea la
stanza, i partecipanti entrano da PC o smartphone (Wi-Fi o 4G/5G) con un
codice a 6 caratteri, e l'asta si svolge con rilanci e countdown sincronizzati
via WebSocket (STOMP/SockJS).

## Stack
- Backend: Java 17 + Spring Boot 3 (WebSocket/STOMP)
- Frontend: HTML + TailwindCSS (CDN) + JS vanilla, SockJS + stomp.js
- Nessun database: stato in memoria (ok per un uso "one-shot" tipo un'asta live).
  Se il server riavvia, le stanze si perdono — per questo esiste il backup
  automatico descritto più sotto.

## Funzionalità principali
- Asta live con chiamata, rilanci (rapido +1, stepper -5/-1/+5/+10, slider di
  trascinamento), countdown sincronizzato, validazione budget/slot lato server.
- Layout compatto: barra timer orizzontale, riquadro offerta, stato "in testa".
- Pausa admin: congela il countdown, blocca chiamate/rilanci per tutti, e
  permette all'admin di correggere nome/prezzo o eliminare giocatori dalle
  rose di chiunque (solo mentre in pausa).
- Blocco chiamate duplicate (case-insensitive) e alert se il nome chiamato
  somiglia (prime 4 lettere) a un giocatore già assegnato.
- Autocomplete e controllo di corrispondenza ruolo da un listino Google Sheet.
- Privacy: budget residuo e rosa di ogni partecipante sono visibili solo al
  proprietario e all'admin — mai agli altri partecipanti (vedi sotto).
- Export rosa personale (JSON/TXT) e, per l'admin, di tutte le rose.
- **Backup automatico**: ogni 60 secondi il server manda all'admin (e solo a
  lui) un'istantanea completa della stanza, salvata in locale nel browser.
  L'admin può scaricarla in ogni momento e, se necessario, usarla per
  ripristinare una nuova stanza con stessa configurazione, budget e rose.
- QR code per invitare i partecipanti senza far digitare il codice stanza.
- Vibrazione negli ultimi 3 secondi di countdown (solo Android/Chrome: iOS
  Safari non permette alle pagine web di far vibrare il telefono).

## Come funziona la privacy dei dati
Il server manda a ciascun partecipante un messaggio "privato" (via WebSocket,
coda utente dedicata) contenente solo i propri dati sensibili: budget residuo
e rosa altrui non vengono nemmeno inviati al browser degli altri, a differenza
di una prima versione in cui erano semplicemente nascosti dall'interfaccia ma
comunque presenti nel traffico di rete. L'admin, invece, riceve sempre lo
stato completo di tutti (necessario per il pannello di correzione rose e per
gli export).

## Eseguirlo in locale

Serve Java 17+ e Maven.

```bash
mvn spring-boot:run
```

Poi apri `http://localhost:8080` da più schede/browser per simulare più
partecipanti.

## Listino ufficiale (Google Sheet)

Il foglio deve avere 3 colonne **senza riga di intestazione**: colonna A =
ruolo (`P`/`D`/`C`/`A`), colonna B = nome, colonna C = squadra. Deve essere
condiviso come "Chiunque abbia il link può visualizzare".

L'URL è configurato in `src/main/resources/application.properties`:
```
fantacalcio.listino.sheet-url=https://docs.google.com/spreadsheets/d/IL_TUO_ID/edit?usp=sharing
```

Se il foglio non è raggiungibile all'avvio, l'app riprova automaticamente
alcune volte nei minuti successivi (utile contro i "risvegli a freddo" di
hosting gratuiti come Render). Il pannello Admin mostra sempre lo stato
corrente del listino, con un pulsante per ricaricarlo manualmente.

## Backup e ripristino, in pratica

1. Mentre l'admin ha la stanza aperta, ogni 60 secondi arriva un backup
   automatico (visibile nel pannello Admin: "ultimo backup: HH:MM:SS").
2. In qualsiasi momento, l'admin può premere "Scarica ultimo backup" per
   ottenere un file `.json`.
3. Se la stanza dovesse andare persa (riavvio del server), l'admin va sulla
   home page → "Crea Stanza" → "Hai un backup di una stanza precedente?
   Ripristinalo" → carica il file: si ottiene un **nuovo codice stanza** con
   budget e rose di tutti esattamente come li avevano lasciati.
4. I partecipanti rientrano nella nuova stanza usando **lo stesso nome
   fantasquadra di prima**: il sistema li riconosce e recuperano
   automaticamente il proprio budget e la propria rosa.

## Caricarlo su GitHub

```bash
cd fantacalcio-asta
git init
git add .
git commit -m "Prima versione: asta fantacalcio live"
git branch -M main
git remote add origin https://github.com/<TUO_USERNAME>/<NOME_REPO>.git
git push -u origin main
```

## Deploy gratuito (Render.com, consigliato)

1. [render.com](https://render.com) → Sign up with GitHub.
2. **New +** → **Web Service** → collega il repository.
3. Render rileva il `Dockerfile` incluso nel progetto.
4. Piano: **Free**. Nessuna variabile d'ambiente necessaria (la porta è letta
   da `PORT` automaticamente).
5. **Create Web Service** e attendi il build.

⚠️ Il piano gratuito Render "dorme" dopo ~15 minuti di inattività e si
risveglia in circa un minuto alla prima richiesta. Apri il link qualche
minuto prima dell'inizio dell'asta per "svegliarlo" in anticipo.

## Limiti noti

- Stato in RAM: nessuna persistenza automatica tra riavvii — da qui il backup
  manuale/automatico descritto sopra.
- Nessuna autenticazione reale oltre al nome fantasquadra: va bene per un uso
  privato tra amici, non è una sicurezza vera e propria.
- Un solo "piatto" alla volta per stanza (nessuna asta parallela).
