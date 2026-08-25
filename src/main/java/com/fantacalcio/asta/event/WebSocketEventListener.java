package com.fantacalcio.asta.event;

import com.fantacalcio.asta.service.StanzaService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    private final StanzaService stanzaService;

    public WebSocketEventListener(StanzaService stanzaService) {
        this.stanzaService = stanzaService;
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String id = event.getUser() != null ? event.getUser().getName() : event.getSessionId();
        stanzaService.disconnetti(id);
    }
}
