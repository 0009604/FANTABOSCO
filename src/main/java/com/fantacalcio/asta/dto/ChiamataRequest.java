package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.Ruolo;

public class ChiamataRequest {

    private String nomeCalciatore;
    private Ruolo ruolo;
    private Integer prezzoBase; // opzionale, default 1

    public String getNomeCalciatore() {
        return nomeCalciatore;
    }

    public void setNomeCalciatore(String nomeCalciatore) {
        this.nomeCalciatore = nomeCalciatore;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public void setRuolo(Ruolo ruolo) {
        this.ruolo = ruolo;
    }

    public Integer getPrezzoBase() {
        return prezzoBase;
    }

    public void setPrezzoBase(Integer prezzoBase) {
        this.prezzoBase = prezzoBase;
    }
}
