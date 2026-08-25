package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.ConfigurazioneAsta;

import java.util.List;

/** Istantanea completa di una stanza, mandata periodicamente al solo admin per fare da backup. */
public class BackupStanzaDTO {

    private String codiceOriginale;
    private long timestampMillis;
    private ConfigurazioneAsta configurazione;
    private String adminNome;
    private List<UtenteDTO> utenti;
    private List<String> log;

    public String getCodiceOriginale() {
        return codiceOriginale;
    }

    public void setCodiceOriginale(String codiceOriginale) {
        this.codiceOriginale = codiceOriginale;
    }

    public long getTimestampMillis() {
        return timestampMillis;
    }

    public void setTimestampMillis(long timestampMillis) {
        this.timestampMillis = timestampMillis;
    }

    public ConfigurazioneAsta getConfigurazione() {
        return configurazione;
    }

    public void setConfigurazione(ConfigurazioneAsta configurazione) {
        this.configurazione = configurazione;
    }

    public String getAdminNome() {
        return adminNome;
    }

    public void setAdminNome(String adminNome) {
        this.adminNome = adminNome;
    }

    public List<UtenteDTO> getUtenti() {
        return utenti;
    }

    public void setUtenti(List<UtenteDTO> utenti) {
        this.utenti = utenti;
    }

    public List<String> getLog() {
        return log;
    }

    public void setLog(List<String> log) {
        this.log = log;
    }
}
