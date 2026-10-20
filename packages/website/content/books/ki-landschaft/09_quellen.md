# Quellen, Stand, Grenzen

Datenstand Oktober 2026, gescannt von Februar bis August. Bei {{h05-waterfall.audit_own}} der geprüften Zuordnungen von Firma zu Website stimmte die Firma. Kreise, Länder und den Schätzer habe ich deshalb ohne die Websites neu gerechnet, deren Impressum eine andere Firma nennt; für die übrigen Befunde mit Firmenmerkmalen steht das noch aus. Kein Befund gilt für Deutschland insgesamt.

| Befund | Umfang und Zeitraum | Basis | Stand der Prüfung |
|---|---|---|---|
| Zwei Messungen, zwei Bilder (Kapitel 1) | {{h05-dots.pairs}} · März bis April 2026 | Websites mit eigener Domain, zweimal gescannt |  |
| Rohwert und Gewichtung (Kapitel 1) | {{h05-waterfall.reachable_sites}} · März bis Mai 2026 | erreichbare Firmenwebsites | Rescan fertig, noch nicht eingerechnet |
| Textmenge (Kapitel 2) | {{h01-bars.pages}} · März bis Mai 2026 | Startseiten mit eigener Domain und Text |  |
| Sagen und zeigen (Kapitel 3) | {{c3.read_sample}} · März bis Mai 2026 | gelesene Startseiten |  |
| Berater und Firmen, Souveränität (Kapitel 3) | {{h04-dumbbell.firm_pages}} · März bis Mai 2026 | Firmenstartseiten, dazu {{h04-dumbbell.consult_pages}} Beraterseiten | Souveränität ohne falsche Zuordnungen nachgerechnet |
| Datum der Startseite (Kapitel 3) | {{h07-curve.pages_dated}} · April 2026 | Startseiten mit ausdrücklichem Datum |  |
| Stellenanzeigen (Kapitel 4) | {{h02-blocks.raw_ads}} · Februar bis Juni 2026 | Anzeigen mit KI-Wort oder Data Scientist im Titel |  |
| Namen im Schaufenster (Kapitel 4) | {{h03-strip.firm_pages}} · März bis Juni 2026 | Firmenseiten, dazu Beraterseiten, Stellen und Meldungen |  |
| Kreise (Kapitel 5) | {{h06-slope.firms}} · März bis Mai 2026 | Firmen in Kreisen mit genug Firmen | neu gerechnet, ohne falsche Zuordnungen |
| Länder (Kapitel 5) | {{h10-tiles.firms_land}} · März bis Mai 2026 | Firmen mit bekanntem Land | neu gerechnet, ohne falsche Zuordnungen |
| Lobbyregister (Kapitel 6) | {{h12-null.register_firms}} · März bis Mai 2026 | eingetragene Firmen mit Startseite |  |
| Polizei und Feuerwehr (Kapitel 6) | {{h11-field.releases}} · Februar bis August 2026 | Pressemeldungen |  |
| Zertifikate und Dienste (Kapitel 7) | {{h09-field.cert_n}} · März bis Juni 2026 | Zertifikate, dazu kleinere Teilmengen |  |
| Server und Kopfzeilen (Kapitel 7) | {{h08-field.firms_headers}} · März bis Mai 2026 | Websites mit gespeicherten Kopfzeilen |  |

## Was sich nicht sagen lässt

Ein KI-Assistent hat {{h05-waterfall.audit_pairs}} Zuordnungen von Firma zu Website geprüft, keine Person, und bei {{h05-waterfall.audit_own}} der Fälle (Intervall {{h05-waterfall.audit_own.range}}) gehörte die Adresse nach seinem Urteil zur Firma. Auch ob die Textmuster richtig treffen, hat ein KI-Assistent beurteilt, ohne menschliche Gegenprüfung.

Der Rescan, ein erneuter Durchgang über alle Seiten, hat jede Website gegen ihr Impressum geprüft. Bei {{h05-waterfall.rescan_match}} von {{h05-waterfall.rescan_read}} erreichbaren Websites nennt das Impressum die Firma, bei {{h05-waterfall.rescan_no_match}} eine andere, und weil das alle Websites zählt, auch die, bei denen das Impressum nichts entscheidet, ist es eine andere Messung als die Prüfung oben. Kreise, Länder und der Schätzer stehen auf den {{h05-waterfall.rescan_base}} gelesenen Websites ohne die falschen, die übrigen Befunde mit Firmenmerkmalen wie der Größe noch nicht. Nur mit den ausdrücklich passenden schlösse Bayerns Intervall die 1 ein und die Ostlücke fiele nicht mehr auf; ich nehme trotzdem die breitere Grundlage, weil ein offenes Impressum keine falsche Zuordnung ist und die strenge Auswahl nur gut ein Drittel der Websites behält. Die Stellenanzeigen und Pressemeldungen berührt der Rescan nicht, dafür wäre ein zweiter Abruf im Januar 2027 nötig.

Stellenanzeigen und Pressemeldungen sind eigene Stichproben mit eigener Auswahl. Gemessen wird, was auf Websites steht, Kleinstbetriebe ohne Website fehlen. Was Firmen einsetzen, ist damit nicht erfasst. Alle Zusammenhänge sind explorativ. Sie beschreiben, was in dieser Stichprobe zusammen vorkommt, und sagen nichts über Ursachen. Ein Intervall von 95 Prozent zeigt nur, wie weit ein Wert allein durch die Auswahl der Seiten schwanken kann, und weder die Fehler der Zuordnung noch die Fehler der Textmuster stecken darin. Das Intervall im Schätzer von Kapitel 8 stammt aus vielfach neu berechneten Modellläufen und ist breiter als bei einer Zählung, weil Branche, Land, Größe und Textmenge zusammen geschätzt werden; „Grundlage“ ist die Zahl der Firmen in der kleinsten deiner vier Angaben. Treffer-Zahlen unter 5 erscheinen nie, auch nicht, wenn man sie aus Rate und Basis zurückrechnen könnte. Das Gewicht der Länder folgt dem Unternehmensregister 2024 des Statistischen Bundesamts.

Die Auswertung verwendet nur Zähler und Markierungen je Website, keine Namen, Adressen oder Telefonnummern. Im Buch erscheinen weder Firmen noch Ranglisten einzelner Firmen. Wie der Scanner vorgeht, steht auf der Seite [loehrning.ai/bot](/bot).

Rechtsgrundlage: Verordnung (EU) 2024/1689, geändert durch (EU) 2026/1744 (CELEX 32026R1744). Siehe Kapitel 8.
