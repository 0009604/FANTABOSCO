package com.fantacalcio.asta.controller;

import com.fantacalcio.asta.dto.BackupStanzaDTO;
import com.fantacalcio.asta.dto.CreaStanzaRequest;
import com.fantacalcio.asta.dto.CreaStanzaResponse;
import com.fantacalcio.asta.service.StanzaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stanze")
public class StanzaRestController {

    private final StanzaService stanzaService;

    public StanzaRestController(StanzaService stanzaService) {
        this.stanzaService = stanzaService;
    }

    @PostMapping
    public ResponseEntity<CreaStanzaResponse> crea(@Valid @RequestBody CreaStanzaRequest req) {
        String codice = stanzaService.creaStanza(req.getConfigurazione(), req.getNomeAdmin());
        return ResponseEntity.ok(new CreaStanzaResponse(codice));
    }

    @GetMapping("/{codice}/esiste")
    public ResponseEntity<Boolean> esiste(@PathVariable String codice) {
        return ResponseEntity.ok(stanzaService.esisteStanza(codice));
    }

    @PostMapping("/ripristina")
    public ResponseEntity<CreaStanzaResponse> ripristina(@RequestBody BackupStanzaDTO backup) {
        String codice = stanzaService.ripristinaStanza(backup);
        if (codice == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(new CreaStanzaResponse(codice));
    }
}
