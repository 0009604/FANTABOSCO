package com.fantacalcio.asta.model;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Un partecipante alla stanza (fantasquadra). */
public class Utente {

    private String nome;
    private String sessionId;
    private boolean admin;
    private boolean connesso = true;
    private boolean spettatore = false;
    private int budgetResiduo;
    private final Map<Ruolo, List<Calciatore>> rosa = new EnumMap<>(Ruolo.class);

    public Utente() {
        for (Ruolo r : Ruolo.values()) {
            rosa.put(r, new ArrayList<>());
        }
    }

    public Utente(String nome, int budgetIniziale, boolean admin) {
        this();
        this.nome = nome;
        this.budgetResiduo = budgetIniziale;
        this.admin = admin;
        this.spettatore = isNomeSpettatore(nome);
    }

    /** Un utente è "Spettatore/Ospite" se il nome della fantasquadra contiene "ospite" (case-insensitive). */
    public static boolean isNomeSpettatore(String nome) {
        return nome != null && nome.trim().toLowerCase().contains("ospite");
    }

    /** Slot ancora liberi per un ruolo specifico. */
    public int slotLiberi(Ruolo ruolo, ConfigurazioneAsta config) {
        return config.slotPerRuolo(ruolo) - rosa.get(ruolo).size();
    }

    /** Totale slot ancora liberi in tutta la rosa. */
    public int slotLiberiTotali(ConfigurazioneAsta config) {
        int totale = 0;
        for (Ruolo r : Ruolo.values()) {
            totale += slotLiberi(r, config);
        }
        return totale;
    }

    /**
     * Offerta massima che l'utente può fare ORA per il giocatore sul piatto,
     * garantendo almeno 1 credito per ciascuno degli altri slot ancora da riempire.
     */
    public int offertaMassima(ConfigurazioneAsta config) {
        int slotLiberiTotali = slotLiberiTotali(config);
        if (slotLiberiTotali <= 0) {
            return 0;
        }
        // -1 perché lo slot che sto per riempire con questa offerta non richiede il credito "di riserva"
        return budgetResiduo - (slotLiberiTotali - 1);
    }

    public void aggiudicaCalciatore(String nomeCalciatore, Ruolo ruolo, int prezzo) {
        rosa.get(ruolo).add(new Calciatore(nomeCalciatore, ruolo, prezzo));
        budgetResiduo -= prezzo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public boolean isConnesso() {
        return connesso;
    }

    public void setConnesso(boolean connesso) {
        this.connesso = connesso;
    }

    public boolean isSpettatore() {
        return spettatore;
    }

    public void setSpettatore(boolean spettatore) {
        this.spettatore = spettatore;
    }

    public int getBudgetResiduo() {
        return budgetResiduo;
    }

    public void setBudgetResiduo(int budgetResiduo) {
        this.budgetResiduo = budgetResiduo;
    }

    public Map<Ruolo, List<Calciatore>> getRosa() {
        return rosa;
    }
}
