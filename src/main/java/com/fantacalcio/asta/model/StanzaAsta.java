package com.fantacalcio.asta.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.locks.ReentrantLock;

/** Aggregato in memoria di una stanza d'asta. Tutto l'accesso mutabile va protetto da {@link #lock}. */
public class StanzaAsta {

    public static final int MAX_LOG = 30;

    private final String codice;
    private final ConfigurazioneAsta configurazione;
    private String adminNome;
    // nome fantasquadra (case-insensitive key) -> Utente
    private final Map<String, Utente> utenti = new LinkedHashMap<>();
    // Spettatori/Ospiti: non occupano slot né influiscono sul quorum, ma ricevono i broadcast.
    private final Map<String, Utente> spettatori = new LinkedHashMap<>();
    private final AstaCorrente astaCorrente = new AstaCorrente();
    private final LinkedList<String> log = new LinkedList<>();

    private final ReentrantLock lock = new ReentrantLock();
    private transient ScheduledFuture<?> timerTask;
    private Instant creata = Instant.now();
    private boolean inPausa = false;

    public StanzaAsta(String codice, ConfigurazioneAsta configurazione, String adminNome) {
        this.codice = codice;
        this.configurazione = configurazione;
        this.adminNome = adminNome;
    }

    public void aggiungiLog(String messaggio) {
        log.addFirst(messaggio);
        while (log.size() > MAX_LOG) {
            log.removeLast();
        }
    }

    public String getCodice() {
        return codice;
    }

    public ConfigurazioneAsta getConfigurazione() {
        return configurazione;
    }

    public String getAdminNome() {
        return adminNome;
    }

    public Map<String, Utente> getUtenti() {
        return utenti;
    }

    public Map<String, Utente> getSpettatori() {
        return spettatori;
    }

    public AstaCorrente getAstaCorrente() {
        return astaCorrente;
    }

    public LinkedList<String> getLog() {
        return log;
    }

    public ReentrantLock getLock() {
        return lock;
    }

    public ScheduledFuture<?> getTimerTask() {
        return timerTask;
    }

    public void setTimerTask(ScheduledFuture<?> timerTask) {
        this.timerTask = timerTask;
    }

    public boolean isInPausa() {
        return inPausa;
    }

    public void setInPausa(boolean inPausa) {
        this.inPausa = inPausa;
    }
}
