package com.fantacalcio.asta.controller;

import com.fantacalcio.asta.dto.BackupStanzaDTO;
import com.fantacalcio.asta.dto.StatoStanzaDTO;
import com.fantacalcio.asta.service.StanzaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private static final String BACKUP_FILE = "backup_asta.json";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StanzaService stanzaService;

    public BackupController(StanzaService stanzaService) {
        this.stanzaService = stanzaService;
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> salva(@RequestBody StatoStanzaDTO stato) {
        try {
            BackupStanzaDTO backup = new BackupStanzaDTO();
            backup.setCodiceOriginale(stato.getCodiceStanza());
            backup.setTimestampMillis(System.currentTimeMillis());
            backup.setConfigurazione(stato.getConfigurazione());
            backup.setAdminNome(stato.getAdminNome());
            backup.setUtenti(stato.getPartecipanti());
            backup.setLog(stato.getLog());

            objectMapper.writerWithDefaultPrettyPrinter().writeValue(new File(BACKUP_FILE), backup);
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", true);
            return ResponseEntity.ok(resp);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/restore")
    public ResponseEntity<Map<String, Object>> ripristina() {
        try {
            Path path = Paths.get(BACKUP_FILE);
            if (!Files.exists(path)) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("nuovoCodice", null);
                return ResponseEntity.ok(resp);
            }
            BackupStanzaDTO backup = objectMapper.readValue(path.toFile(), BackupStanzaDTO.class);
            String nuovoCodice = stanzaService.ripristinaStanza(backup);
            Map<String, Object> resp = new HashMap<>();
            resp.put("nuovoCodice", nuovoCodice);
            return ResponseEntity.ok(resp);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
