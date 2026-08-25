package com.fantacalcio.asta.service;

import com.fantacalcio.asta.model.GiocatoreListino;
import com.fantacalcio.asta.model.Ruolo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Carica il listino ufficiale calciatori da un Google Sheet pubblico (esportato come CSV),
 * con 3 colonne senza intestazione: A=ruolo (P/D/C/A), B=nome, C=squadra.
 * Usato per l'autocomplete in fase di chiamata e per il controllo di corrispondenza del ruolo.
 */
@Service
public class ListinoService implements ApplicationRunner {

    @Value("${fantacalcio.listino.sheet-url:}")
    private String sheetUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final ScheduledExecutorService retryScheduler = Executors.newSingleThreadScheduledExecutor();

    private volatile List<GiocatoreListino> listino = new ArrayList<>();
    private volatile String ultimoErrore = null;

    @Override
    public void run(ApplicationArguments args) {
        // caricamento all'avvio, senza bloccare lo startup dell'app in caso di errore/assenza rete.
        // Subito dopo un "risveglio" da sonno (es. Render free tier) la rete in uscita del
        // container a volte non è ancora pronta: se il primo tentativo fallisce, ne pianifichiamo
        // altri in automatico invece di lasciare l'admin a dover cliccare "Ricarica" a mano.
        ricaricaConRetry(0);
    }

    private void ricaricaConRetry(int tentativo) {
        ricarica();
        if (ultimoErrore != null && tentativo < 4) {
            long attesaSecondi = 10L * (tentativo + 1); // 10s, 20s, 30s, 40s
            System.out.println("[ListinoService] Caricamento fallito, riprovo tra " + attesaSecondi
                    + "s (tentativo " + (tentativo + 2) + " di 5)...");
            retryScheduler.schedule(() -> ricaricaConRetry(tentativo + 1), attesaSecondi, TimeUnit.SECONDS);
        }
    }

    public synchronized void ricarica() {
        if (sheetUrl == null || sheetUrl.isBlank()) {
            ultimoErrore = "Nessun URL del listino configurato.";
            return;
        }
        try {
            String csvUrl = trasformaInCsvUrl(sheetUrl);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(csvUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", "Mozilla/5.0 (compatible; FantacalcioAsta/1.0)")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                ultimoErrore = "Google Sheet non raggiungibile (HTTP " + response.statusCode()
                        + "). Verifica che il foglio sia condiviso come 'chiunque abbia il link può visualizzare'.";
                System.out.println("[ListinoService] " + ultimoErrore + " url=" + csvUrl);
                return;
            }

            List<GiocatoreListino> parsed = parseCsv(response.body());
            this.listino = new CopyOnWriteArrayList<>(parsed);
            this.ultimoErrore = parsed.isEmpty() ? "Il foglio è stato letto ma non contiene righe valide." : null;
            System.out.println("[ListinoService] Listino caricato: " + parsed.size() + " giocatori.");
        } catch (Exception e) {
            ultimoErrore = "Errore nel caricamento del listino: " + e.getMessage();
            System.out.println("[ListinoService] " + ultimoErrore);
        }
    }

    private String trasformaInCsvUrl(String url) {
        // Accetta sia il link di condivisione (.../edit?usp=sharing) sia un url già export=csv
        if (url.contains("export?format=csv") || url.contains("output=csv")) {
            return url;
        }
        int idx = url.indexOf("/d/");
        if (idx == -1) {
            return url; // non è un url standard di Google Sheets, ci proviamo comunque
        }
        String dopoId = url.substring(idx + 3);
        String sheetId = dopoId.split("/")[0];
        return "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=csv";
    }

    private List<GiocatoreListino> parseCsv(String csv) {
        if (csv.startsWith("\uFEFF")) {
            csv = csv.substring(1);
        }
        List<GiocatoreListino> risultato = new ArrayList<>();
        String[] righe = csv.split("\\r?\\n");
        for (String riga : righe) {
            if (riga.isBlank()) continue;
            List<String> colonne = parseRigaCsv(riga);
            if (colonne.size() < 3) continue;

            Ruolo ruolo = mappaRuolo(colonne.get(0));
            String nome = colonne.get(1).trim();
            String squadra = colonne.get(2).trim();
            if (ruolo == null || nome.isEmpty()) continue;

            risultato.add(new GiocatoreListino(nome, ruolo, squadra));
        }
        return risultato;
    }

    /** Parser CSV minimale, gestisce campi tra virgolette con eventuali virgole interne. */
    private List<String> parseRigaCsv(String riga) {
        List<String> campi = new ArrayList<>();
        StringBuilder corrente = new StringBuilder();
        boolean dentroVirgolette = false;

        for (int i = 0; i < riga.length(); i++) {
            char c = riga.charAt(i);
            if (c == '"') {
                dentroVirgolette = !dentroVirgolette;
            } else if (c == ',' && !dentroVirgolette) {
                campi.add(corrente.toString());
                corrente.setLength(0);
            } else {
                corrente.append(c);
            }
        }
        campi.add(corrente.toString());
        return campi;
    }

    private Ruolo mappaRuolo(String sigla) {
        if (sigla == null) return null;
        return switch (sigla.trim().toUpperCase()) {
            case "P" -> Ruolo.PORTIERE;
            case "D" -> Ruolo.DIFENSORE;
            case "C" -> Ruolo.CENTROCAMPISTA;
            case "A" -> Ruolo.ATTACCANTE;
            default -> null;
        };
    }

    public List<GiocatoreListino> cerca(String query) {
        if (query == null || query.isBlank()) return List.of();
        String q = query.trim().toLowerCase();
        return listino.stream()
                .filter(g -> g.getNome().toLowerCase().contains(q))
                .sorted(Comparator.comparing(g -> !g.getNome().toLowerCase().startsWith(q)))
                .limit(8)
                .collect(Collectors.toList());
    }

    public GiocatoreListino trovaEsatto(String nome) {
        if (nome == null) return null;
        String n = nome.trim().toLowerCase();
        return listino.stream()
                .filter(g -> g.getNome().toLowerCase().equals(n))
                .findFirst()
                .orElse(null);
    }

    public int numeroGiocatori() {
        return listino.size();
    }

    public String getUltimoErrore() {
        return ultimoErrore;
    }
}
