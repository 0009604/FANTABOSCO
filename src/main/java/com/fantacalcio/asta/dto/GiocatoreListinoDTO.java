package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.GiocatoreListino;
import com.fantacalcio.asta.model.Ruolo;

public class GiocatoreListinoDTO {

    private String nome;
    private Ruolo ruolo;
    private String squadra;

    public static GiocatoreListinoDTO from(GiocatoreListino g) {
        GiocatoreListinoDTO dto = new GiocatoreListinoDTO();
        dto.nome = g.getNome();
        dto.ruolo = g.getRuolo();
        dto.squadra = g.getSquadra();
        return dto;
    }

    public String getNome() {
        return nome;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public String getSquadra() {
        return squadra;
    }
}
