package com.fantacalcio.asta.dto;

/**
 * Comando dell'Admin su una richiesta nella Sala d'Attesa.
 * - azione = ACCETTA | RINOMINA | SUBENTRA | RIFIUTA
 */
public class GestioneAttesaRequest {

    public static final String AZIONE_ACCETTA = "ACCETTA";
    public static final String AZIONE_RINOMINA = "RINOMINA";
    public static final String AZIONE_SUBENTRA = "SUBENTRA";
    public static final String AZIONE_RIFIUTA = "RIFIUTA";

    private String sessionId;      // identificativo della connessione in attesa
    private String azione;
    private String nuovoNome;      // per RINOMINA
    private String squadraTarget;  // per SUBENTRA: nome della fantasquadra da rilevare

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getAzione() {
        return azione;
    }

    public void setAzione(String azione) {
        this.azione = azione;
    }

    public String getNuovoNome() {
        return nuovoNome;
    }

    public void setNuovoNome(String nuovoNome) {
        this.nuovoNome = nuovoNome;
    }

    public String getSquadraTarget() {
        return squadraTarget;
    }

    public void setSquadraTarget(String squadraTarget) {
        this.squadraTarget = squadraTarget;
    }
}
