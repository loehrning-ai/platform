import canonical from "../l07-review";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L07 translation expected a prose block.");
  return block.markdown;
}

function pullQuote(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "pull-quote")
    throw new Error("Codex L07 translation expected a pull quote.");
  return block.text;
}

function card(
  sectionIndex: number,
  blockIndex: number,
  cardIndex: number,
  field: "eyebrow" | "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "card-grid")
    throw new Error("Codex L07 translation expected a card grid.");
  const value = block.cards[cardIndex]?.[field];
  if (!value) throw new Error("Codex L07 translation expected a card value.");
  return value;
}

function callout(
  sectionIndex: number,
  blockIndex: number,
  field: "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "callout")
    throw new Error("Codex L07 translation expected a callout.");
  const value = block[field];
  if (!value)
    throw new Error("Codex L07 translation expected a callout value.");
  return value;
}

function widgetProps(index: number): Readonly<Record<string, unknown>> {
  const widget = canonical.widgets?.[index];
  if (!widget) throw new Error("Codex L07 translation expected a widget.");
  return widget.props as Readonly<Record<string, unknown>>;
}

function widgetString(index: number, key: string): string {
  const value = widgetProps(index)[key];
  if (typeof value !== "string")
    throw new Error(`Codex L07 translation expected ${key}.`);
  return value;
}

function widgetStrings(index: number, key: string): readonly string[] {
  const value = widgetProps(index)[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Codex L07 translation expected ${key}.`);
  }
  return value;
}

function diffLineText(index: number): readonly string[] {
  const lines = widgetProps(index).lines;
  if (!Array.isArray(lines))
    throw new Error("Codex L07 translation expected diff lines.");
  return lines.map((line) => {
    if (
      line === null ||
      typeof line !== "object" ||
      !("text" in line) ||
      typeof line.text !== "string"
    ) {
      throw new Error("Codex L07 translation expected diff line text.");
    }
    return line.text;
  });
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "Einen Codex-PR prüfen"],
    [
      canonical.subtitle,
      "Prüfe vor dem Merge das verlangte Verhalten, den vollständigen Diff, Tests, Abhängigkeiten und Sicherheitsgrenzen.",
    ],
    [canonical.hook, "Diff und Protokolle sind Nachweise, keine Freigabe."],
    [canonical.keyConcepts[0], "Prüfliste für Reviews"],
    [canonical.keyConcepts[1], "Zirkuläre Tests"],
    [canonical.keyConcepts[2], "Sicherheitsprüfung"],
    [canonical.keyConcepts[3], "Umgehung der Authentifizierung"],
    [canonical.sections[0].title, "Das Artefakt prüfen, nicht den Urheber"],
    [
      prose(0, 0),
      "Wende auf Codex-Ausgaben den normalen Review-Maßstab des Repositorys an. Ein sauber formatierter Diff, neue Tests oder gemeldete erfolgreiche Befehle erleichtern die Prüfung, belegen aber keine Korrektheit.\n\nBeginne mit dem verlangten Verhalten und den Vertrauensgrenzen. Prüfe anschließend den vollständigen Repository-Diff einschließlich gestagter, nicht gestagter, unversionierter, generierter, konfigurations- und abhängigkeitsbezogener Änderungen. Lies Testcode und Befehlsprotokolle, um den tatsächlich geprüften Umfang zu bestimmen.\n\nEine wiederholbare Prüfliste deckt Umfang, Verhalten, Fehlerbehandlung, Sicherheit, Betrieb und Rücknahme ab, statt sich auf oberflächliche Plausibilität zu verlassen.",
    ],
    [
      pullQuote(0, 1),
      "Die Annahme bleibt eine menschliche Entscheidung auf Grundlage von Auftrag, vollständigem Diff und unabhängig prüfbaren Nachweisen.",
    ],
    [canonical.sections[1].title, "Die Prüfliste"],
    [
      prose(1, 0),
      "Nutze diese sechs Prüfungen als Grundgerüst und ergänze fachgebietsspezifische Kontrollen. Beende die Prüfung früh, wenn Ziel oder Umfang falsch sind; spätere Details reparieren keinen unpassenden Auftrag.",
    ],
    [card(1, 1, 0, "eyebrow"), "Prüfung 01"],
    [card(1, 1, 0, "title"), "Erfüllt der PR den Auftrag?"],
    [
      card(1, 1, 0, "body"),
      "Vergleiche das beobachtbare Verhalten mit Ziel und Akzeptanzkriterien. Lehne eine benachbarte Lösung auch dann ab, wenn sie intern konsistent umgesetzt ist.",
    ],
    [card(1, 1, 1, "eyebrow"), "Prüfung 02"],
    [card(1, 1, 1, "title"), "Hat die Änderung den richtigen Umfang?"],
    [
      card(1, 1, 1, "body"),
      "Prüfe jede geänderte und gelöschte Datei. Verlange eine Begründung für Änderungen außerhalb des vereinbarten Umfangs; die Dateizahl allein ist kein Qualitätsmaß.",
    ],
    [card(1, 1, 2, "eyebrow"), "Prüfung 03"],
    [card(1, 1, 2, "title"), "Prüfen die neuen Tests tatsächlich Verhalten?"],
    [
      card(1, 1, 2, "body"),
      "Lies neue und geänderte Tests. Prüfe Assertions, Fixtures, Mocks, Negativfälle, übersprungene Pfade und ob der Test ohne das relevante Verhalten fehlschlägt.",
    ],
    [card(1, 1, 3, "eyebrow"), "Prüfung 04"],
    [card(1, 1, 3, "title"), "Gibt es neue Abhängigkeiten?"],
    [
      card(1, 1, 3, "body"),
      "Prüfe Manifest- und Lockfile-Änderungen, Herkunft, Wartungszustand, Lizenz, transitive Risiken und ob eine vorhandene Abhängigkeit die Funktion bereits bereitstellt.",
    ],
    [card(1, 1, 4, "eyebrow"), "Prüfung 05"],
    [card(1, 1, 4, "title"), "Was wurde entfernt oder umgangen?"],
    [
      card(1, 1, 4, "body"),
      "Prüfe gelöschte Tests, Validierung, Rückfalllogik, Feature Flags, constraint-tragende Kommentare und Fehlerbehandlung. Jede Entfernung muss durch den Auftrag begründet sein.",
    ],
    [card(1, 1, 5, "eyebrow"), "Prüfung 06"],
    [card(1, 1, 5, "title"), "Passt die Änderung zum Systemvertrag?"],
    [
      card(1, 1, 5, "body"),
      "Prüfe Autorisierung, Datenverarbeitung, Fehler, Protokollierung, Nebenläufigkeit, Migrationen, Beobachtbarkeit, Rücknahme, Benennung und Repository-Konventionen. Ergänze AGENTS.md nur, wenn tatsächlich eine dauerhafte Regel fehlte.",
    ],
    [canonical.sections[2].title, "Unauffällig falsche Tests"],
    [
      prose(2, 0),
      'Dieses Beispiel verlangt einen Rate Limiter für `/login`, ersetzt die Limiter-Entscheidung im Test jedoch durch einen Mock. Entscheidend ist, welches Verhalten der Test tatsächlich abdeckt.\n\n```\n# tests/api/test_login_rate_limit.py\n\ndef test_login_maps_denial_to_429(client, mocker):\n    mock_limiter = mocker.patch("api.auth.limiter.is_allowed")\n    mock_limiter.return_value = False\n\n    response = client.post("/login", json={...})\n\n    assert response.status_code == 429\n    mock_limiter.assert_called_once()\n```\n\nDer Test belegt die Zuordnung einer abgelehnten Limiter-Entscheidung zu Status 429. Er prüft weder Zählung noch Grenzwert, Schlüsselbildung, Speicherung oder Reset-Verhalten. Behalte ihn, wenn diese Zuordnung relevant ist, und ergänze einen Test über die echte Limiter-Grenze.\n\n```\n# prüft das konfigurierte Limiter-Verhalten\n\ndef test_login_blocks_at_6th_attempt(client):\n    for _ in range(5):\n        response = client.post("/login", json={...})\n        assert response.status_code == 401  # ungültige Daten, Anfrage erlaubt\n\n    response = client.post("/login", json={...})\n    assert response.status_code == 429  # Anfrage blockiert\n```',
    ],
    [canonical.sections[3].title, "Probleme erkennen"],
    [prose(3, 0), "Prüfe den folgenden Diff. Finde den Fehler vor dem Quiz."],
    [canonical.sections[4].title, "Die Sicherheitsprüfung"],
    [
      prose(4, 0),
      "Sicherheitsanforderungen müssen in Auftrag und Review ausdrücklich sein. Funktionale Tests decken selten jede Vertrauensgrenze ab. Richte die Sicherheitsprüfung nach geänderten Datenflüssen, Berechtigungen, Abhängigkeiten und dem Deployment-Kontext aus.",
    ],
    [card(4, 1, 0, "eyebrow"), "Sicherheit 01"],
    [card(4, 1, 0, "title"), "Vertrauensgrenze für Eingaben"],
    [
      card(4, 1, 0, "body"),
      "Verfolge nicht vertrauenswürdige Werte bis zu Datenbankabfragen, Dateipfaden, Shell-Befehlen, Templates, Weiterleitungen und Protokollen. Nutze je nach Ziel Validierung, Parametrisierung, Kanonisierung oder Ausgabekodierung.",
    ],
    [card(4, 1, 1, "eyebrow"), "Sicherheit 02"],
    [card(4, 1, 1, "title"), "Authentifizierung und Autorisierung"],
    [
      card(4, 1, 1, "body"),
      "Prüfe für jede neue oder geänderte Operation Identität, Rolle, Mandant, Ressourcenbesitz und Default-Deny-Verhalten. Ein Authentifizierungs-Guard auf Routenebene erzwingt nicht zwingend objektbezogene Autorisierung.",
    ],
    [card(4, 1, 2, "eyebrow"), "Sicherheit 03"],
    [card(4, 1, 2, "title"), "Geheimnisse im Quellcode"],
    [
      card(4, 1, 2, "body"),
      "Prüfe Quellcode, Fixtures, Protokolle, generierte Dateien und Konfiguration auf Zugangsdaten oder sensible Werte. Nutze den Secret-Scanner des Repositorys und widerrufe offengelegte Zugangsdaten; das Löschen aus dem aktuellen Diff entfernt sie nicht aus der Historie.",
    ],
    [card(4, 1, 3, "eyebrow"), "Sicherheit 04"],
    [card(4, 1, 3, "title"), "Preisgabe durch Fehlermeldungen"],
    [
      card(4, 1, 3, "body"),
      "Gib keine rohen Ausnahmen zurück und protokolliere keine sensiblen Nutzdaten. Prüfe sichere Client-Fehler, serverseitigen Diagnosekontext, stabile Statuscodes und Schwärzung an jeder Protokollgrenze.",
    ],
    [
      callout(4, 2, "title"),
      "Repository-spezifische Sicherheitsprüfungen verwenden:",
    ],
    [
      callout(4, 2, "body"),
      "Führe die konfigurierten Secret-, Abhängigkeits-, statischen Analyse- und Autorisierungstests für den geänderten Stack aus. Prüfe Umfang, Ausschlüsse und Ausgabe. Eine Textsuche kann die Sichtung unterstützen, ist aber kein Sicherheits-Gate.",
    ],
    [
      prose(4, 3),
      'Dieses Vorher-Nachher-Beispiel zeigt, weshalb funktionale Ausgabe nicht genügt. Der Auftrag lautete: "Endpunkt `/debug/user` ergänzen", ließ aber Autorisierung, Eingabebehandlung und erlaubte Antwortfelder offen.\n\n```\n# unsichere Fassung\n\n@app.route("/debug/user")           # keine Autorisierung\ndef debug_user():\n    user_id = request.args.get("id")  # keine Validierung\n    try:\n        u = db.session.query(User).get(user_id)\n        return jsonify(u.__dict__)       # gibt alle Spalten aus\n    except Exception as e:\n        return str(e), 500              # gibt interne Details aus\n\n# überarbeitete Fassung\n\n@app.route("/debug/user")\n@require_admin                         # ausdrückliche Autorisierung\ndef debug_user():\n    try:\n        user_id = int(request.args["id"])\n    except (KeyError, ValueError):\n        return jsonify({"error": "invalid id"}), 400\n\n    user = db.session.get(User, user_id)\n    if user is None:\n        return jsonify({"error": "not found"}), 404\n    return jsonify(user.to_safe_dict())  # ausdrückliche Feldfreigabe\n```',
    ],
    [prose(5, 0), "Zwei Fragen zur Prüfung von Codex-PRs."],
    [
      widgetString(0, "title"),
      'PR: "Caching für /users/:id ergänzen", was ist falsch?',
    ],
    [
      widgetString(0, "note"),
      "Der Cache gilt nur innerhalb eines Prozesses und besitzt keinen Invalidierungspfad. Nach einer Profiländerung können Worker bis zur Verdrängung oder zum Neustart veraltete Objekte liefern. Prüfe Cache-Verantwortung, Invalidierung, Prozessmodell und Objektlebenszyklus des Repositorys vor der Annahme.",
    ],
    [
      widgetString(1, "question"),
      "Codex liefert einen Diff mit neuen bestandenen Tests. Was prüft der Reviewer bei diesen Tests zuerst?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Den Tests vertrauen, weil sie erfolgreich sind.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Jeden Test lesen und prüfen, welches Verhalten er ausübt und ob die relevante Assertion ohne dieses Verhalten fehlschlägt.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Alle Tests löschen und selbst neu schreiben.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Direkt zur Implementierung springen; Tests sind nur Formalität.",
    ],
    [
      widgetString(1, "explanation"),
      "Eine bestandene Suite meldet, dass ihre Assertions in einer Umgebung abgeschlossen wurden. Prüfe bei jedem Test das abgedeckte Verhalten und bestätige, dass die relevante Assertion bei fehlendem oder falschem Verhalten fehlschlägt.",
    ],
    [
      widgetString(2, "question"),
      'Der PR ergänzt oben "from some-new-lib import magic". Wie reagierst du?',
    ],
    [
      widgetStrings(2, "options")[0],
      "Die Abhängigkeit akzeptieren, weil der Import kompiliert.",
    ],
    [
      widgetStrings(2, "options")[1],
      "Bedarf, Herkunft, Wartungszustand, Lizenz, Sicherheitslage, transitive Auswirkungen und vorhandene Alternativen vor der Annahme prüfen.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Codex anweisen, sie ohne Prüfung zu entfernen.",
    ],
    [
      widgetStrings(2, "options")[3],
      "npm audit ausführen und die Prüfung beenden.",
    ],
    [
      widgetString(2, "explanation"),
      "Eine Abhängigkeit verändert Lieferketten- und Wartungsgrenzen. Prüfe Manifest und Lockfile, bestätige die Herkunft und verlange einen konkreten Grund für die Aufnahme.",
    ],
  ],
  preserve: diffLineText(0),
});
