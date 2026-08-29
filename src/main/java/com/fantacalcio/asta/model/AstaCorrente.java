package com.fantacalcio.asta.model;

/** Stato del calciatore attualmente "sul piatto", se presente. */
public class AstaCorrente {

    private boolean attiva = false;
    private String calciatoreNome;
    private Ruolo ruolo;
    private String squadra;
    private String offerenteNome;
    private int offertaCorrente;
    private int secondiRimanenti;
    private String chiamataDaNome;
    private long tempoInizioAsta;

    public boolean isAttiva() {
        return attiva;
    }

    public void setAttiva(boolean attiva) {
        this.attiva = attiva;
    }

    public String getCalciatoreNome() {
        return calciatoreNome;
    }

    public void setCalciatoreNome(String calciatoreNome) {
        this.calciatoreNome = calciatoreNome;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public void setRuolo(Ruolo ruolo) {
        this.ruolo = ruolo;
    }

    public String getSquadra() {
        return squadra;
    }

    public void setSquadra(String squadra) {
        this.squadra = squadra;
    }

    public String getOfferenteNome() {
        return offerenteNome;
    }

    public void setOfferenteNome(String offerenteNome) {
        this.offerenteNome = offerenteNome;
    }

    public int getOffertaCorrente() {
        return offertaCorrente;
    }

    public void setOffertaCorrente(int offertaCorrente) {
        this.offertaCorrente = offertaCorrente;
    }

    public int getSecondiRimanenti() {
        return secondiRimanenti;
    }

    public void setSecondiRimanenti(int secondiRimanenti) {
        this.secondiRimanenti = secondiRimanenti;
    }

    public String getChiamataDaNome() {
        return chiamataDaNome;
    }

    public void setChiamataDaNome(String chiamataDaNome) {
        this.chiamataDaNome = chiamataDaNome;
    }

    public long getTempoInizioAsta() {
        return tempoInizioAsta;
    }

    public void setTempoInizioAsta(long tempoInizioAsta) {
        this.tempoInizioAsta = tempoInizioAsta;
    }

    public void reset() {
        this.attiva = false;
        this.calciatoreNome = null;
        this.ruolo = null;
        this.squadra = null;
        this.offerenteNome = null;
        this.offertaCorrente = 0;
        this.secondiRimanenti = 0;
        this.chiamataDaNome = null;
        this.tempoInizioAsta = 0;
    }
}
