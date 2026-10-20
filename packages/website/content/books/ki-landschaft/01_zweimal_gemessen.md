# Zwei Messungen, zwei Bilder

Ich habe {{h05-dots.pairs}} Firmenwebsites zweimal gelesen. Bei {{h05-dots.rescan_lost}} der KI-Treffer fehlte das Wort beim zweiten Mal.

Dazwischen lagen im Median {{h05-dots.rescan_days}} Tage, gelesen wurde auf zwei verschiedenen Wegen, die ich Kameras nenne, und die Frage war beide Male, ob auf der Startseite das Wort KI steht. Beim ersten Durchgang stand es auf {{h05-dots.first_hits}} Startseiten, beim zweiten fehlte es bei {{h05-dots.lost_hits}} davon, während nur {{h05-dots.new_hits}} neu hinzukamen. Die Quote lag bei der zweiten Kamera bei {{h05-dots.rescan_second}} statt bei {{h05-dots.rescan_first}}. Der Faktor beträgt {{h05-dots.rescan_ratio}}, und das Intervall ({{h05-dots.rescan_ratio.range}}) zeigt, wie weit er allein durch die Auswahl der Seiten schwanken kann.

::stage{id="h05-dots"}

Welche Kamera näher an der Wahrheit liegt, weiß ich nicht. Beim ersten Durchgang war bei {{h05-dots.text_missing_first}} der Seiten (Intervall {{h05-dots.text_missing_first.range}}) kein Seitentext gespeichert, das KI-Wort wurde beim Abruf erkannt. Beim zweiten Durchgang lag bei allen Text vor. Und weil die Seiten keine Zufallsauswahl sind, übertrage ich den Faktor nicht auf alle Firmen, zumal die Messung selbst unsicher bleibt.

## Eine Frage, mehrere Zahlen

Dieselbe Frage ergibt vier Werte: roh {{h05-waterfall.raw_share}}, ohne geteilte Adressen {{h05-waterfall.own_share}}, nach Ländern gewichtet {{h05-waterfall.weighted_share}} und nach den Anteilen meiner Ausgangsliste gewichtet {{h05-waterfall.weighted_pool}}. Der Rohwert bezieht sich auf {{h05-waterfall.reachable_sites}} erreichbare Websites, und auf {{h05-waterfall.shared_hosts_share}} davon teilen sich mehrere Firmen eine Adresse. Ein KI-Assistent hat {{h05-waterfall.audit_pairs}} Zuordnungen von Firma zu Website geprüft, keine Person, und nach seinem Urteil gehörte die Adresse nur bei {{h05-waterfall.audit_own}} der Fälle (Intervall {{h05-waterfall.audit_own.range}}) zur Firma. Das gilt für jede Zahl, die an Firmenwebsites hängt.

Ohne die geteilten Adressen bleiben {{h05-waterfall.base_sites}} Startseiten mit eigener Domain. Bayern stellt {{h05-waterfall.bayern_sample_share}} meiner Stichprobe, aber nur {{h05-waterfall.bayern_pool_share}} der Ausgangsliste, aus der ich sie gezogen habe. Damit Bayern das Bild nicht dominiert, zählt jedes Land mit seinem Anteil im Unternehmensregister des Statistischen Bundesamts, und dann bleiben {{h05-waterfall.weighted_share}} (Intervall {{h05-waterfall.weighted_share.range}}). Die Gewichtung gleicht die Länderanteile aus, nicht die unbekannte Auswahl der Firmen innerhalb eines Landes. Mit diesem gewichteten Wert rechne ich weiter, auch wenn sein Intervall die unsichere Zuordnung nicht abdeckt.

::figure{id="h05-waterfall"}

Umfragen kommen auf {{h05-waterfall.published_low}} bis {{h05-waterfall.published_high}}, zum Beispiel bei der [KfW](https://www.kfw.de/PDF/Download-Center/Konzernthemen/Research/PDF-Dokumente-Fokus-Volkswirtschaft/Fokus-2026/Fokus-Nr.-554-Juli-2026-KI_Mittelstand.pdf) und bei [Bitkom](https://www.bitkom.org/Presse/Presseinformation/Erstmals-nutzt-die-Mehrheit-der-Unternehmen-KI). Sie fragen nach dem Einsatz in den Firmen. Meine Zahl beschreibt, was man von außen auf einer Startseite lesen kann, bei Firmen mit auffindbarer Website, und lässt sich mit diesen Umfragen nicht vergleichen.

## Die zweite Kamera

Auch die Technik hinter den Seiten sieht je nach Kamera anders aus. Bei {{h05-ladder.pairs}} Websites, die beide Kameras gelesen haben, fand die zweite WordPress in {{h05-ladder.wordpress_refound}} der Fälle wieder, den Cookie-Hinweis von Borlabs in {{h05-ladder.borlabs_refound}}, Google Maps in {{h05-ladder.maps_refound}} und den Tag Manager nur in {{h05-ladder.gtm_refound}}.

Mein früherer Punktwert für Firmen hat dasselbe gezeigt. Ich habe ihn gestrichen. Er ging eng damit einher, wie oft nachgesehen wurde: Wo Prüfungen liefen, lag er bei {{h05-ladder.score_measured.num}}, wo keine liefen, bei {{h05-ladder.score_not_measured.num}}.

::figure{id="h05-ladder"}

Parallel läuft ein Rescan, ein erneuter Durchgang über alle Seiten, der jede Website gegen ihr Impressum prüft. Seine Neuberechnung ersetzt die Zahlen dieser Ausgabe, soweit sie an Websites hängen, und bis dahin gelten sie mit Stand Oktober 2026.

> **Was du tun kannst:** Frag bei jeder KI-Zahl nach drei Dingen: womit gemessen wurde, an wie vielen Fällen und wann. Das gilt auch für meine. Schreib die drei Angaben neben die Zahl, bevor du sie weitergibst, und nimm die Zahl nur als Beispiel, wenn eine fehlt. Miss auch im eigenen Haus zweimal, bevor du einer Zahl glaubst.
