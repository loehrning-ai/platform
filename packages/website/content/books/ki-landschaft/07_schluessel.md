# Wem der Schlüssel gehört

::ticker{ref="h09-field.cert_n" tail="Zertifikate, die Firmenwebsites ausliefern, und die Frage, wer sie ausgestellt hat."}

Von {{h09-field.cert_n}} Zertifikaten stellt in {{h09-field.cert_us_hq}} der Fälle eine Stelle mit Sitz in den USA aus, europäisch geführte Stellen kommen auf {{h09-field.cert_eu_strict}} (Intervall {{h09-field.cert_eu_strict.range}}).

Hinter jeder Website stehen Anbieter, vom Zertifikat für die verschlüsselte Verbindung über eingebundene Dienste bis, manchmal, zu einem KI-Anbieter. Ich habe fünf Fragen gestellt, jede mit eigener Basis. Gezählt habe ich Zertifikate, geladene Dienste, genannte KI-Anbieter, Plattformen in Stellentiteln und Partnerlisten von Beratungen. Der Sitz eines Anbieters sagt dabei nichts über den Standort des Servers, und ein Zertifikat ist meist die Voreinstellung des Hosters, also des Unternehmens, bei dem die Website liegt.

Allein Let's Encrypt kommt auf {{h09-field.cert_letsencrypt}}. Zählt man Anbieter mit Firmensitz in Europa dazu, sind es {{h09-field.cert_eu_incl}}. Von {{h09-field.services_n}} Websites laden {{h09-field.services_google}} einen Google-Dienst, und mit allen US-Diensten sind es bei breiter Zählweise {{h09-field.services_us_broad}}.

::figure{id="h09-field"}

Von {{h09-field.ai_pages}} Seiten mit KI-Wort nennen {{h09-field.ai_named_pages}} einen Anbieter, und {{h09-field.ai_none_share}} nennen keinen. Von diesen {{h09-field.ai_named_pages}} sind bei enger Zählung über {{h09-field.ai_us_share_strict_floor}} amerikanisch, bei einer breiteren Anbieterliste, die {{h09-field.ai_named_broad}} Seiten erfasst, {{h09-field.ai_us_share_broad}}.

In Stellentiteln nennen {{h09-field.jobs_us_employers}} Arbeitgeber eine US-Plattform, davon {{h09-field.jobs_azure_employers}} Azure gegen {{h09-field.jobs_aws_employers}} für AWS, und {{h09-field.jobs_eu_employers}} nennen eine europäische. Von {{h09-field.partner_n}} Beratungen mit Partnerliste nennen {{h09-field.partner_microsoft}} Microsoft, eine europäische Cloud oder KI nennen je {{h09-field.partner_eu_cloud}}. Die Partnerlisten sind Selbstauskunft und wurden mit KI ausgelesen. Die Erkennungslisten sind für US-Anbieter länger als für europäische.

## Schutz-Header und Server gehen zusammen

Die Kopfzeilen, die eine Website dem Browser zum Schutz mitgibt, die Schutz-Header, hängen in meinen Daten eng mit der Server-Software zusammen, und ich vermute, dass der Hoster hier viel vorgibt. Von {{h08-field.firms_headers}} Websites mit gespeicherten Kopfzeilen senden {{h08-field.zero_all}} keinen von sechs Schutz-Headern, auf Apache sind es {{h08-field.zero_apache}}, hinter Cloudflare {{h08-field.zero_cloudflare}}. Die AUC für die Frage, ob eine Seite HSTS sendet, also die Regel, nur noch verschlüsselt zu verbinden, liegt mit Kenntnis der Plattform bei {{h08-field.auc_platform}} (Intervall {{h08-field.auc_platform.range}}), mit den Merkmalen der Firma bei {{h08-field.auc_firm}}, und 0,5 wäre ein Münzwurf. Firmenmerkmale hängen an der Zuordnung von Firma zu Website, die nur bei {{h05-waterfall.audit_own}} stimmte, und werden mit geprüften Websites neu gerechnet.

::stage{id="h08-field"}

{{h08-field.banner_sites}} Websites ({{h08-field.banner_share}}) melden Wort für Wort dieselbe Serverversion. Von ihnen erzwingen {{h08-field.banner_enforced}} die Mail-Schutzregel DMARC, bei den übrigen sind es {{h08-field.other_enforced}}. Zusammen stellen sie {{h08-field.enforced_share_banner}} der {{h08-field.enforced_all}} erzwungenen Richtlinien. Das passt zu gemeinsamen Voreinstellungen, belegt sie aber nicht.

{{h08-field.php_sites}} Websites zeigen ihre PHP-Version, und nur solche Seiten stehen in dieser Zahl. Bei {{h08-field.php_eol}} davon ist die Version über das Ende der Herstellerpflege hinaus im Einsatz, im Median seit {{h08-field.php_years_past}} Jahren. Eine alte Version kann trotzdem gepatcht sein, weil Anbieter Fehler oft ohne neue Versionsnummer beheben.

Je nach Bundesland laufen {{rand-kap7.https_laender_min}} bis {{rand-kap7.https_laender_max}} der Startseiten mit HTTPS. Bei den kürzesten Seiten fehlt HTTPS in {{rand-kap7.thin_no_https}} der Fälle.

> **Was du tun kannst:** Stell deinem Hoster drei Fragen. Wer stellt dein Zertifikat aus? Welche Schutz-Header sendet er für deine Seite? Welche Mail-Richtlinie gilt für deine Domain? Die Antwort ist vermutlich seine Voreinstellung, und dann entscheidest du, ob du sie so willst, und hältst das Datum der Antwort fest.
