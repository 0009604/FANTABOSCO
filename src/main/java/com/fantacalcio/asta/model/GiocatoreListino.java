package com.fantacalcio.asta.model;

/** Un giocatore del listino ufficiale, caricato dal Google Sheet condiviso dall'admin. */
public class GiocatoreListino {

    private String nome;
    private Ruolo ruolo;
    private String squadra;

    public GiocatoreListino() {
    }

    public GiocatoreListino(String nome, Ruolo ruolo, String squadra) {
        this.nome = nome;
        this.ruolo = ruolo;
        this.squadra = squadra;
    }

    public String getNome() {
        return nome;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public String getSquadra() {
        return squadra;
    }
}
