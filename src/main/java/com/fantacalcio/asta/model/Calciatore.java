package com.fantacalcio.asta.model;

/** Un calciatore assegnato ad una rosa (dopo aggiudicazione). */
public class Calciatore {

    private String nome;
    private Ruolo ruolo;
    private int prezzoPagato;

    public Calciatore() {
    }

    public Calciatore(String nome, Ruolo ruolo, int prezzoPagato) {
        this.nome = nome;
        this.ruolo = ruolo;
        this.prezzoPagato = prezzoPagato;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public void setRuolo(Ruolo ruolo) {
        this.ruolo = ruolo;
    }

    public int getPrezzoPagato() {
        return prezzoPagato;
    }

    public void setPrezzoPagato(int prezzoPagato) {
        this.prezzoPagato = prezzoPagato;
    }
}
