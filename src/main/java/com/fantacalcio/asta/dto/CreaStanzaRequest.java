package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.ConfigurazioneAsta;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreaStanzaRequest {

    @NotBlank
    private String nomeAdmin;

    @NotNull
    @Valid
    private ConfigurazioneAsta configurazione;

    public String getNomeAdmin() {
        return nomeAdmin;
    }

    public void setNomeAdmin(String nomeAdmin) {
        this.nomeAdmin = nomeAdmin;
    }

    public ConfigurazioneAsta getConfigurazione() {
        return configurazione;
    }

    public void setConfigurazione(ConfigurazioneAsta configurazione) {
        this.configurazione = configurazione;
    }
}
