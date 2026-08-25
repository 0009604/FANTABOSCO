package com.fantacalcio.asta.controller;

import com.fantacalcio.asta.dto.GiocatoreListinoDTO;
import com.fantacalcio.asta.service.ListinoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/listino")
public class ListinoController {

    private final ListinoService listinoService;

    public ListinoController(ListinoService listinoService) {
        this.listinoService = listinoService;
    }

    @GetMapping("/search")
    public List<GiocatoreListinoDTO> cerca(@RequestParam String query) {
        return listinoService.cerca(query).stream()
                .map(GiocatoreListinoDTO::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/stato")
    public Map<String, Object> stato() {
        return Map.of(
                "numeroGiocatori", listinoService.numeroGiocatori(),
                "errore", listinoService.getUltimoErrore() == null ? "" : listinoService.getUltimoErrore()
        );
    }

    @PostMapping("/ricarica")
    public Map<String, Object> ricarica() {
        listinoService.ricarica();
        return stato();
    }
}
