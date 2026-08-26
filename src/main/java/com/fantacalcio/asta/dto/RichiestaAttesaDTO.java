package com.fantacalcio.asta.dto;

/** Una richiesta di ingresso in attesa di approvazione da parte dell'Admin. */
public class RichiestaAttesaDTO {

    private String sessionId;
    private String nome;
    private boolean spettatore;

    public RichiestaAttesaDTO() {
    }

    public RichiestaAttesaDTO(String sessionId, String nome, boolean spettatore) {
        this.sessionId = sessionId;
        this.nome = nome;
        this.spettatore = spettatore;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public boolean isSpettatore() {
        return spettatore;
    }

    public void setSpettatore(boolean spettatore) {
        this.spettatore = spettatore;
    }
}
