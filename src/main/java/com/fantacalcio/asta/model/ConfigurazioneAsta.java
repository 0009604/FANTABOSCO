package com.fantacalcio.asta.model;

/** Parametri impostati dall'admin alla creazione della stanza (in parte modificabili dopo). */
public class ConfigurazioneAsta {

    private int numPartecipanti = 8;
    private int budgetIniziale = 500;
    private int slotPortieri = 3;
    private int slotDifensori = 8;
    private int slotCentrocampisti = 8;
    private int slotAttaccanti = 6;
    private int timerSecondi = 10;

    public int getNumPartecipanti() {
        return numPartecipanti;
    }

    public void setNumPartecipanti(int numPartecipanti) {
        this.numPartecipanti = numPartecipanti;
    }

    public int getBudgetIniziale() {
        return budgetIniziale;
    }

    public void setBudgetIniziale(int budgetIniziale) {
        this.budgetIniziale = budgetIniziale;
    }

    public int getSlotPortieri() {
        return slotPortieri;
    }

    public void setSlotPortieri(int slotPortieri) {
        this.slotPortieri = slotPortieri;
    }

    public int getSlotDifensori() {
        return slotDifensori;
    }

    public void setSlotDifensori(int slotDifensori) {
        this.slotDifensori = slotDifensori;
    }

    public int getSlotCentrocampisti() {
        return slotCentrocampisti;
    }

    public void setSlotCentrocampisti(int slotCentrocampisti) {
        this.slotCentrocampisti = slotCentrocampisti;
    }

    public int getSlotAttaccanti() {
        return slotAttaccanti;
    }

    public void setSlotAttaccanti(int slotAttaccanti) {
        this.slotAttaccanti = slotAttaccanti;
    }

    public int getTimerSecondi() {
        return timerSecondi;
    }

    public void setTimerSecondi(int timerSecondi) {
        this.timerSecondi = timerSecondi;
    }

    public int slotPerRuolo(Ruolo ruolo) {
        return switch (ruolo) {
            case PORTIERE -> slotPortieri;
            case DIFENSORE -> slotDifensori;
            case CENTROCAMPISTA -> slotCentrocampisti;
            case ATTACCANTE -> slotAttaccanti;
        };
    }

    public int slotTotali() {
        return slotPortieri + slotDifensori + slotCentrocampisti + slotAttaccanti;
    }
}
