package com.fantacalcio.asta.controller;

import com.fantacalcio.asta.dto.UtenteDTO;
import com.fantacalcio.asta.model.Calciatore;
import com.fantacalcio.asta.model.Ruolo;
import com.fantacalcio.asta.service.StanzaService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/stanze")
public class RosaExportController {

    private final StanzaService stanzaService;

    public RosaExportController(StanzaService stanzaService) {
        this.stanzaService = stanzaService;
    }

    // ---------------------------------------------------------------- LA MIA ROSA

    @GetMapping("/{codice}/rosa")
    public ResponseEntity<?> scaricaMiaRosa(@PathVariable String codice,
                                             @RequestParam String nome,
                                             @RequestParam(defaultValue = "json") String formato) {
        UtenteDTO utente = stanzaService.getRosaUtente(codice, nome);
        if (utente == null) {
            return ResponseEntity.notFound().build();
        }

        String nomeFile = "rosa-" + slug(utente.getNome());
        if ("txt".equalsIgnoreCase(formato)) {
            String testo = formattaTesto(List.of(utente));
            return fileTxt(testo, nomeFile);
        }
        return fileJson(utente, nomeFile);
    }

    // ---------------------------------------------------------------- TUTTE LE ROSE (SOLO ADMIN)

    @GetMapping("/{codice}/rosa-tutte")
    public ResponseEntity<?> scaricaTutteLeRose(@PathVariable String codice,
                                                 @RequestParam String nomeRichiedente,
                                                 @RequestParam(defaultValue = "json") String formato) {
        if (!stanzaService.isAdmin(codice, nomeRichiedente)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Solo l'admin della stanza può scaricare tutte le rose.");
        }

        List<UtenteDTO> tutte = stanzaService.getTutteLeRose(codice);
        if (tutte == null) {
            return ResponseEntity.notFound().build();
        }

        String nomeFile = "rose-complete-" + codice.toUpperCase();
        if ("txt".equalsIgnoreCase(formato)) {
            return fileTxt(formattaTesto(tutte), nomeFile);
        }
        return fileJson(tutte, nomeFile);
    }

    // ---------------------------------------------------------------- HELPERS

    private ResponseEntity<byte[]> fileTxt(String testo, String nomeFileSenzaEstensione) {
        byte[] bytes = testo.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/plain; charset=UTF-8"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(nomeFileSenzaEstensione + ".txt").build());
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    private ResponseEntity<Object> fileJson(Object corpo, String nomeFileSenzaEstensione) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment().filename(nomeFileSenzaEstensione + ".json").build());
        return new ResponseEntity<>(corpo, headers, HttpStatus.OK);
    }

    private String slug(String nome) {
        return nome.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private String formattaTesto(List<UtenteDTO> utenti) {
        StringBuilder sb = new StringBuilder();
        for (UtenteDTO u : utenti) {
            sb.append("=== ").append(u.getNome()).append(" ===\n");
            sb.append("Budget residuo: ").append(u.getBudgetResiduo()).append(" crediti\n\n");
            int totaleSpeso = 0;
            for (Ruolo ruolo : Ruolo.values()) {
                List<Calciatore> lista = u.getRosa().get(ruolo);
                sb.append(etichettaRuolo(ruolo)).append(":\n");
                if (lista == null || lista.isEmpty()) {
                    sb.append("  (nessuno)\n");
                } else {
                    for (Calciatore c : lista) {
                        sb.append("  - ").append(c.getNome()).append(" — ").append(c.getPrezzoPagato()).append(" crediti\n");
                        totaleSpeso += c.getPrezzoPagato();
                    }
                }
            }
            sb.append("\nTotale speso: ").append(totaleSpeso).append(" crediti\n");
            sb.append("\n--------------------------------\n\n");
        }
        return sb.toString();
    }

    private String etichettaRuolo(Ruolo ruolo) {
        return switch (ruolo) {
            case PORTIERE -> "Portieri";
            case DIFENSORE -> "Difensori";
            case CENTROCAMPISTA -> "Centrocampisti";
            case ATTACCANTE -> "Attaccanti";
        };
    }
}
