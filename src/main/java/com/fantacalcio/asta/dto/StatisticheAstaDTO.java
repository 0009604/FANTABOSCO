package com.fantacalcio.asta.dto;

import com.fantacalcio.asta.model.Ruolo;
import com.fantacalcio.asta.model.StanzaAsta;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StatisticheAstaDTO {

    private List<AcquistoStat> top5PiuPagati;
    private List<AcquistoStat> top3AstePiuLunghe;
    private List<AcquistoStat> top3AstePiuVeloci;
    private Map<Ruolo, List<AcquistoStat>> top3PerRuolo;

    public List<AcquistoStat> getTop5PiuPagati() { return top5PiuPagati; }
    public void setTop5PiuPagati(List<AcquistoStat> top5PiuPagati) { this.top5PiuPagati = top5PiuPagati; }
    public List<AcquistoStat> getTop3AstePiuLunghe() { return top3AstePiuLunghe; }
    public void setTop3AstePiuLunghe(List<AcquistoStat> top3AstePiuLunghe) { this.top3AstePiuLunghe = top3AstePiuLunghe; }
    public List<AcquistoStat> getTop3AstePiuVeloci() { return top3AstePiuVeloci; }
    public void setTop3AstePiuVeloci(List<AcquistoStat> top3AstePiuVeloci) { this.top3AstePiuVeloci = top3AstePiuVeloci; }
    public Map<Ruolo, List<AcquistoStat>> getTop3PerRuolo() { return top3PerRuolo; }
    public void setTop3PerRuolo(Map<Ruolo, List<AcquistoStat>> top3PerRuolo) { this.top3PerRuolo = top3PerRuolo; }

    public static StatisticheAstaDTO from(List<StanzaAsta.AcquistoCompletato> acquisti) {
        StatisticheAstaDTO dto = new StatisticheAstaDTO();
        // Top 5 più pagati
        dto.top5PiuPagati = acquisti.stream()
                .sorted((a, b) -> Integer.compare(b.getPrezzo(), a.getPrezzo()))
                .limit(5)
                .map(StatisticheAstaDTO::toAcquistoStat)
                .toList();
        // Top 3 aste più lunghe (escludendo acquisti a 1 CR)
        dto.top3AstePiuLunghe = acquisti.stream()
                .filter(a -> a.getPrezzo() > 1)
                .sorted((a, b) -> Integer.compare(b.getDurataSecondi(), a.getDurataSecondi()))
                .limit(3)
                .map(StatisticheAstaDTO::toAcquistoStat)
                .toList();
        // Top 3 aste più veloci (escludendo acquisti a 1 CR)
        dto.top3AstePiuVeloci = acquisti.stream()
                .filter(a -> a.getPrezzo() > 1)
                .sorted((a, b) -> Integer.compare(a.getDurataSecondi(), b.getDurataSecondi()))
                .limit(3)
                .map(StatisticheAstaDTO::toAcquistoStat)
                .toList();
        // Top 3 per ruolo
        dto.top3PerRuolo = new HashMap<>();
        for (Ruolo r : Ruolo.values()) {
            dto.top3PerRuolo.put(r, acquisti.stream()
                    .filter(a -> a.getRuolo() == r)
                    .sorted((a, b) -> Integer.compare(b.getPrezzo(), a.getPrezzo()))
                    .limit(3)
                    .map(StatisticheAstaDTO::toAcquistoStat)
                    .toList());
        }
        return dto;
    }

    private static AcquistoStat toAcquistoStat(StanzaAsta.AcquistoCompletato a) {
        return new AcquistoStat(a.getNomeCalciatore(), a.getRuolo(), a.getPrezzo(),
                a.getSquadraAcquirente(), a.getDurataSecondi());
    }

    public static class AcquistoStat {
        private String nomeCalciatore;
        private Ruolo ruolo;
        private int prezzo;
        private String squadraAcquirente;
        private int durataSecondi;

        public AcquistoStat() {}

        public AcquistoStat(String nomeCalciatore, Ruolo ruolo, int prezzo, String squadraAcquirente, int durataSecondi) {
            this.nomeCalciatore = nomeCalciatore;
            this.ruolo = ruolo;
            this.prezzo = prezzo;
            this.squadraAcquirente = squadraAcquirente;
            this.durataSecondi = durataSecondi;
        }

        public String getNomeCalciatore() { return nomeCalciatore; }
        public void setNomeCalciatore(String nomeCalciatore) { this.nomeCalciatore = nomeCalciatore; }
        public Ruolo getRuolo() { return ruolo; }
        public void setRuolo(Ruolo ruolo) { this.ruolo = ruolo; }
        public int getPrezzo() { return prezzo; }
        public void setPrezzo(int prezzo) { this.prezzo = prezzo; }
        public String getSquadraAcquirente() { return squadraAcquirente; }
        public void setSquadraAcquirente(String squadraAcquirente) { this.squadraAcquirente = squadraAcquirente; }
        public int getDurataSecondi() { return durataSecondi; }
        public void setDurataSecondi(int durataSecondi) { this.durataSecondi = durataSecondi; }
    }
}