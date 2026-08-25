package com.fantacalcio.asta.dto;

public class CreaStanzaResponse {

    private String codiceStanza;

    public CreaStanzaResponse(String codiceStanza) {
        this.codiceStanza = codiceStanza;
    }

    public String getCodiceStanza() {
        return codiceStanza;
    }

    public void setCodiceStanza(String codiceStanza) {
        this.codiceStanza = codiceStanza;
    }
}
