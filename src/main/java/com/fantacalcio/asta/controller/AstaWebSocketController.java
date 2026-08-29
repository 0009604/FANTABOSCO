package com.fantacalcio.asta.controller;

import com.fantacalcio.asta.dto.AdminModificaRosaRequest;
import com.fantacalcio.asta.dto.ChiamataRequest;
import com.fantacalcio.asta.dto.GestioneAttesaRequest;
import com.fantacalcio.asta.dto.JoinRequest;
import com.fantacalcio.asta.dto.PausaRequest;
import com.fantacalcio.asta.dto.RilancioRequest;
import com.fantacalcio.asta.dto.StuzzicaRequest;
import com.fantacalcio.asta.dto.TimerRequest;
import com.fantacalcio.asta.service.StanzaService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class AstaWebSocketController {

    private final StanzaService stanzaService;

    public AstaWebSocketController(StanzaService stanzaService) {
        this.stanzaService = stanzaService;
    }

    /**
     * Identificativo univoco della connessione da usare per tutto (tracciamento interno e
     * consegna dei messaggi privati via convertAndSendToUser). Da quando WebSocketConfig assegna
     * un Principal ad ogni handshake, questo è l'identificativo giusto da usare al posto del
     * semplice id di sessione STOMP.
     */
    private String idConnessione(SimpMessageHeaderAccessor headerAccessor) {
        return headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : headerAccessor.getSessionId();
    }

    @MessageMapping("/stanza/{codice}/join")
    public void join(@DestinationVariable String codice, @Payload JoinRequest req,
                      SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.join(codice, req.getNome(), idConnessione(headerAccessor));
    }

    @MessageMapping("/stanza/{codice}/chiamata")
    public void chiamata(@DestinationVariable String codice, @Payload ChiamataRequest req,
                          SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.chiamata(codice, idConnessione(headerAccessor), req);
    }

    @MessageMapping("/stanza/{codice}/rilancio")
    public void rilancio(@DestinationVariable String codice, @Payload RilancioRequest req,
                          SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.rilancio(codice, idConnessione(headerAccessor), req);
    }

    @MessageMapping("/stanza/{codice}/timer")
    public void timer(@DestinationVariable String codice, @Payload TimerRequest req,
                       SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.aggiornaTimer(codice, idConnessione(headerAccessor), req.getSecondi());
    }

    @MessageMapping("/stanza/{codice}/pausa")
    public void pausa(@DestinationVariable String codice, @Payload PausaRequest req,
                       SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.impostaPausa(codice, idConnessione(headerAccessor), req.isPausa());
    }

    @MessageMapping("/stanza/{codice}/admin/modificaRosa")
    public void modificaRosa(@DestinationVariable String codice, @Payload AdminModificaRosaRequest req,
                              SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.adminModificaRosa(codice, idConnessione(headerAccessor), req);
    }

    @MessageMapping("/stanza/{codice}/stuzzica")
    public void stuzzica(@DestinationVariable String codice, @Payload StuzzicaRequest req,
                         SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.stuzzica(codice, idConnessione(headerAccessor), req);
    }

    @MessageMapping("/stanza/{codice}/admin/attesa")
    public void gestisciAttesa(@DestinationVariable String codice, @Payload GestioneAttesaRequest req,
                               SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.gestisciRichiestaAttesa(codice, idConnessione(headerAccessor), req);
    }

    @MessageMapping("/stanza/{codice}/statistiche")
    public void statistiche(@DestinationVariable String codice, SimpMessageHeaderAccessor headerAccessor) {
        stanzaService.richiediStatistiche(codice, idConnessione(headerAccessor));
    }
}
