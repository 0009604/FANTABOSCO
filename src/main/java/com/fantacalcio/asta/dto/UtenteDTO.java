package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.Calciatore;
import com.fantacalcio.asta.model.Ruolo;
import com.fantacalcio.asta.model.Utente;

import java.util.List;
import java.util.Map;

public class UtenteDTO {

    private String nome;
    private boolean admin;
    private boolean connesso;
    private boolean spettatore;
    private Integer budgetResiduo; // null se il destinatario non ha diritto a vederlo
    private Map<Ruolo, List<Calciatore>> rosa; // vuota se il destinatario non ha diritto a vederla

    /**
     * @param mostraDettagli true se il destinatario del messaggio è il proprietario di questa
     *                       fantasquadra oppure l'admin della stanza: solo in quel caso budget
     *                       residuo e rosa vengono valorizzati. Per chiunque altro restano nascosti,
     *                       per evitare che i crediti residui di un allenatore siano visibili agli
     *                       altri partecipanti (rischio di "aggiustare" i rilanci a fine asta).
     */
    public static UtenteDTO from(Utente u, boolean mostraDettagli) {
        UtenteDTO dto = new UtenteDTO();
        dto.nome = u.getNome();
        dto.admin = u.isAdmin();
        dto.connesso = u.isConnesso();
        dto.spettatore = u.isSpettatore();
        if (mostraDettagli) {
            dto.budgetResiduo = u.getBudgetResiduo();
            dto.rosa = u.getRosa();
        } else {
            dto.budgetResiduo = null;
            dto.rosa = Map.of();
        }
        return dto;
    }

    public String getNome() {
        return nome;
    }

    public boolean isAdmin() {
        return admin;
    }

    public boolean isConnesso() {
        return connesso;
    }

    public boolean isSpettatore() {
        return spettatore;
    }

    public Integer getBudgetResiduo() {
        return budgetResiduo;
    }

    public Map<Ruolo, List<Calciatore>> getRosa() {
        return rosa;
    }
}
