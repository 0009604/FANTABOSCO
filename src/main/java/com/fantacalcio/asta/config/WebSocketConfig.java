package com.fantacalcio.asta.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * Configurazione STOMP su WebSocket (con fallback SockJS per reti/browser
 * che non supportano WebSocket nativo, utile su 4G/5G con proxy aggressivi).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic non più usato per lo stato stanza (sostituito da /queue privata per utente),
        // lo lasciamo abilitato per eventuali usi futuri. /queue serve per i messaggi
        // "solo per me" (stato personalizzato: budget e rose visibili solo al proprietario e all'admin).
        registry.enableSimpleBroker("/topic", "/queue");
        // I client inviano comandi su /app/**
        registry.setApplicationDestinationPrefixes("/app");
        // Prefisso standard per i messaggi utente-specifici (es. /user/queue/stato)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // permette connessioni da qualsiasi rete/dominio
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                                        Map<String, Object> attributes) {
                        // Non c'è login: assegniamo comunque un'identità unica ad ogni connessione,
                        // necessaria a Spring per recapitare messaggi "solo per questo utente"
                        // (convertAndSendToUser). Senza questo, i messaggi privati non arrivano a nessuno.
                        return new ConnessionePrincipal(UUID.randomUUID().toString());
                    }
                })
                .withSockJS();
    }

    /** Identità minimale (senza autenticazione): un id univoco per ogni connessione WebSocket. */
    private static class ConnessionePrincipal implements Principal {
        private final String nome;

        ConnessionePrincipal(String nome) {
            this.nome = nome;
        }

        @Override
        public String getName() {
            return nome;
        }
    }
}
