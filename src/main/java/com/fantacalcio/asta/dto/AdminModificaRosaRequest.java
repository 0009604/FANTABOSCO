package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.Ruolo;

/** Richiesta dell'admin per correggere la rosa di una squadra (rinominare, ricalcolare prezzo, o rimuovere un giocatore). */
public class AdminModificaRosaRequest {

    private String nomeSquadra;
    private Ruolo ruolo;
    private int indice;          // posizione del giocatore nella lista di quel ruolo
    private boolean rimuovi;     // true = elimina il giocatore (rimborsa il prezzo pagato)
    private String nuovoNome;    // opzionale, se valorizzato rinomina il giocatore
    private Integer nuovoPrezzo; // opzionale, se valorizzato ricalcola prezzo e budget

    public String getNomeSquadra() {
        return nomeSquadra;
    }

    public void setNomeSquadra(String nomeSquadra) {
        this.nomeSquadra = nomeSquadra;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public void setRuolo(Ruolo ruolo) {
        this.ruolo = ruolo;
    }

    public int getIndice() {
        return indice;
    }

    public void setIndice(int indice) {
        this.indice = indice;
    }

    public boolean isRimuovi() {
        return rimuovi;
    }

    public void setRimuovi(boolean rimuovi) {
        this.rimuovi = rimuovi;
    }

    public String getNuovoNome() {
        return nuovoNome;
    }

    public void setNuovoNome(String nuovoNome) {
        this.nuovoNome = nuovoNome;
    }

    public Integer getNuovoPrezzo() {
        return nuovoPrezzo;
    }

    public void setNuovoPrezzo(Integer nuovoPrezzo) {
        this.nuovoPrezzo = nuovoPrezzo;
    }
}
