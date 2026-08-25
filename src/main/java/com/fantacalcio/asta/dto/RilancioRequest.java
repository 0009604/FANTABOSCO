package com.fantacalcio.asta.dto;

public class RilancioRequest {

    private Integer importo; // se null -> rilancio rapido "+1"

    public Integer getImporto() {
        return importo;
    }

    public void setImporto(Integer importo) {
        this.importo = importo;
    }
}
