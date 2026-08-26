package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.AstaCorrente;
import com.fantacalcio.asta.model.ConfigurazioneAsta;

import java.util.List;

/** Snapshot completo dello stato della stanza, personalizzato per ciascun destinatario. */
public class StatoStanzaDTO {

    private String codiceStanza;
    private ConfigurazioneAsta configurazione;
    private String adminNome;
    private List<UtenteDTO> partecipanti;
    private AstaCorrente astaCorrente;
    private List<String> log;
    private EventoDTO evento; // nullable, one-shot
    private boolean inPausa;
    private List<RichiestaAttesaDTO> richiestePendenti; // visibile solo all'admin

    public String getCodiceStanza() {
        return codiceStanza;
    }

    public void setCodiceStanza(String codiceStanza) {
        this.codiceStanza = codiceStanza;
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

    public List<UtenteDTO> getPartecipanti() {
        return partecipanti;
    }

    public void setPartecipanti(List<UtenteDTO> partecipanti) {
        this.partecipanti = partecipanti;
    }

    public AstaCorrente getAstaCorrente() {
        return astaCorrente;
    }

    public void setAstaCorrente(AstaCorrente astaCorrente) {
        this.astaCorrente = astaCorrente;
    }

    public List<String> getLog() {
        return log;
    }

    public void setLog(List<String> log) {
        this.log = log;
    }

    public EventoDTO getEvento() {
        return evento;
    }

    public void setEvento(EventoDTO evento) {
        this.evento = evento;
    }

    public boolean isInPausa() {
        return inPausa;
    }

    public void setInPausa(boolean inPausa) {
        this.inPausa = inPausa;
    }

    public List<RichiestaAttesaDTO> getRichiestePendenti() {
        return richiestePendenti;
    }

    public void setRichiestePendenti(List<RichiestaAttesaDTO> richiestePendenti) {
        this.richiestePendenti = richiestePendenti;
    }
}
