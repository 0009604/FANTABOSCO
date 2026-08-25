package com.fantacalcio.asta.dto;

public class EventoDTO {

    private String tipo;          // SEI_LENTO | ERRORE | AGGIUDICAZIONE | SIMILE | INFO
    private String targetNome;    // se valorizzato, evento visibile solo a quell'utente
    private String messaggio;

    public EventoDTO() {
    }

    public EventoDTO(String tipo, String targetNome, String messaggio) {
        this.tipo = tipo;
        this.targetNome = targetNome;
        this.messaggio = messaggio;
    }

    public String getTipo() {
        return tipo;
    }

    public String getTargetNome() {
        return targetNome;
    }

    public String getMessaggio() {
        return messaggio;
    }
}
