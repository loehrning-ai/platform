import canonical from "../l07-review";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L07 translation expected a prose block.");
  return block.markdown;
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
      "Vor dem Merge prüfst du Verhalten, vollständigen Diff, Tests, Abhängigkeiten und Sicherheitsgrenzen.",
    ],
    [canonical.hook, "Diff und Protokolle lesen, bevor du freigibst."],
    [canonical.keyConcepts[0], "Prüfliste für Reviews"],
    [canonical.keyConcepts[1], "Zirkuläre Tests"],
    [canonical.keyConcepts[2], "Sicherheitsprüfung"],
    [canonical.keyConcepts[3], "Umgehung der Authentifizierung"],
    [canonical.sections[0].title, "Das Artefakt prüfen, nicht den Urheber"],
    [
      prose(0, 0),
      "Ein Codex-Diff bekommt dasselbe Review wie jeder andere Pull Request. Saubere Formatierung, Tests und grüne Protokolle belegen keine Korrektheit.\n\nFang beim verlangten Verhalten und den Vertrauensgrenzen an. Lies den vollständigen Diff (gestagte, nicht gestagte, unversionierte, generierte, Konfigurations- und Abhängigkeitsänderungen) samt Testcode und Befehlsprotokollen und arbeite dann die Prüfliste unten ab.",
    ],
    [canonical.sections[1].title, "Die Prüfliste"],
    [
      prose(1, 0),
      "Sechs Grundprüfungen und dazu, was das betroffene System verlangt. Sind Ziel oder Umfang falsch, hör früh auf; spätere Punkte reparieren das nicht.",
    ],
    [card(1, 1, 0, "eyebrow"), "Prüfung 01"],
    [card(1, 1, 0, "title"), "Erfüllt der PR den Auftrag?"],
    [
      card(1, 1, 0, "body"),
      "Vergleiche das Verhalten mit Ziel und Akzeptanzkriterien. Lehne eine Lösung für ein Nachbarproblem ab, auch wenn sie in sich stimmig ist.",
    ],
    [card(1, 1, 1, "eyebrow"), "Prüfung 02"],
    [card(1, 1, 1, "title"), "Hat die Änderung den richtigen Umfang?"],
    [
      card(1, 1, 1, "body"),
      "Lies jede geänderte und gelöschte Datei. Änderungen außerhalb des vereinbarten Umfangs brauchen eine Begründung.",
    ],
    [card(1, 1, 2, "eyebrow"), "Prüfung 03"],
    [card(1, 1, 2, "title"), "Prüfen die neuen Tests tatsächlich Verhalten?"],
    [
      card(1, 1, 2, "body"),
      "Lies Assertions, Fixtures, Mocks, Negativfälle und übersprungene Pfade. Fällt der Test durch, wenn das Verhalten fehlt?",
    ],
    [card(1, 1, 3, "eyebrow"), "Prüfung 04"],
    [card(1, 1, 3, "title"), "Gibt es neue Abhängigkeiten?"],
    [
      card(1, 1, 3, "body"),
      "Prüfe Lockfile, Herkunft, Wartung, Lizenz und transitive Risiken. Kann eine vorhandene Abhängigkeit das schon?",
    ],
    [card(1, 1, 4, "eyebrow"), "Prüfung 05"],
    [card(1, 1, 4, "title"), "Was wurde entfernt oder umgangen?"],
    [
      card(1, 1, 4, "body"),
      "Entfernte Tests, Validierungen, Rückfalllogik, Feature Flags, einschränkende Kommentare und Fehlerbehandlung brauchen jeweils einen Grund im Auftrag.",
    ],
    [card(1, 1, 5, "eyebrow"), "Prüfung 06"],
    [card(1, 1, 5, "title"), "Passt die Änderung zum Systemvertrag?"],
    [
      card(1, 1, 5, "body"),
      "Prüfe Autorisierung, Datenverarbeitung, Fehler, Protokollierung, Nebenläufigkeit, Migrationen, Beobachtbarkeit, Rücknahme und Konventionen. Fehlte eine dauerhafte Regel, ergänze sie in AGENTS.md.",
    ],
    [canonical.sections[2].title, "Unauffällig falsche Tests"],
    [
      prose(2, 0),
      "Der Auftrag verlangt einen Rate Limiter für `/login`. Dieser Test mockt die Limiter-Entscheidung. Was deckt er noch ab?\n\n```\n# tests/api/test_login_rate_limit.py\n\ndef test_login_maps_denial_to_429(client, mocker):\n    mock_limiter = mocker.patch(\"api.auth.limiter.is_allowed\")\n    mock_limiter.return_value = False\n\n    response = client.post(\"/login\", json={...})\n\n    assert response.status_code == 429\n    mock_limiter.assert_called_once()\n```\n\nEr belegt nur, dass eine abgelehnte Limiter-Entscheidung zu Status 429 wird. Zählung, Grenzwert, Schlüsselbildung, Speicherung und Reset bleiben ungeprüft. Behalte ihn, wenn diese Zuordnung zählt, und ergänze einen Test über den echten Limiter:\n\n```\n# prüft das konfigurierte Limiter-Verhalten\n\ndef test_login_blocks_at_6th_attempt(client):\n    for _ in range(5):\n        response = client.post(\"/login\", json={...})\n        assert response.status_code == 401  # ungültige Daten, Anfrage erlaubt\n\n    response = client.post(\"/login\", json={...})\n    assert response.status_code == 429  # Anfrage blockiert\n```",
    ],
    [canonical.sections[3].title, "Den Fehler erkennen"],
    [prose(3, 0), "Bevor du die Erklärung unter dem Caching-Diff oben liest, benenne den Fehler selbst."],
    [canonical.sections[4].title, "Die Sicherheitsprüfung"],
    [
      prose(4, 0),
      "Nenn Sicherheitsanforderungen im Auftrag und prüf sie im Review, denn funktionale Tests decken selten jede Vertrauensgrenze ab.",
    ],
    [card(4, 1, 0, "eyebrow"), "Sicherheit 01"],
    [card(4, 1, 0, "title"), "Vertrauensgrenze für Eingaben"],
    [
      card(4, 1, 0, "body"),
      "Verfolge nicht vertrauenswürdige Werte bis in Abfragen, Dateipfade, Shell-Befehle, Templates, Weiterleitungen und Protokolle. Validiere, parametrisiere, kanonisiere oder kodiere je nach Ziel.",
    ],
    [card(4, 1, 1, "eyebrow"), "Sicherheit 02"],
    [card(4, 1, 1, "title"), "Authentifizierung und Autorisierung"],
    [
      card(4, 1, 1, "body"),
      "Prüfe für jede geänderte Operation Identität, Rolle, Mandant, Besitz und Default Deny. Ein Guard auf der Route erzwingt nicht automatisch Autorisierung am Objekt.",
    ],
    [card(4, 1, 2, "eyebrow"), "Sicherheit 03"],
    [card(4, 1, 2, "title"), "Geheimnisse im Quellcode"],
    [
      card(4, 1, 2, "body"),
      "Durchsuche Quellcode, Fixtures, Protokolle, generierte Dateien und Konfiguration nach Zugangsdaten. Widerrufe offengelegte Zugangsdaten. Nur aus dem Diff gelöscht, bleiben sie in der Git-Historie.",
    ],
    [card(4, 1, 3, "eyebrow"), "Sicherheit 04"],
    [card(4, 1, 3, "title"), "Preisgabe durch Fehlermeldungen"],
    [
      card(4, 1, 3, "body"),
      "Gib keine rohen Ausnahmen an Clients und protokolliere keine sensiblen Nutzdaten. Diagnosedaten bleiben auf dem Server, Statuscodes bleiben stabil. Schwärze sensible Daten an jeder Protokollgrenze.",
    ],
    [callout(4, 2, "title"), "Nutze die Sicherheitsprüfungen des Repositorys."],
    [
      callout(4, 2, "body"),
      "Lass die konfigurierten Secret-, Abhängigkeits-, Static-Analysis- und Autorisierungsprüfungen laufen und lies Umfang, Ausschlüsse und Ausgabe. Eine Textsuche hilft beim Sichten, ersetzt diese Prüfungen aber nicht.",
    ],
    [
      prose(4, 3),
      "Der Auftrag lautete \"Endpunkt `/debug/user` ergänzen\" und ließ Autorisierung, Eingabebehandlung und erlaubte Antwortfelder offen. Die erste Fassung unten funktioniert, ist aber unsicher.\n\n```\n# unsichere Fassung\n\n@app.route(\"/debug/user\")           # keine Autorisierung\ndef debug_user():\n    user_id = request.args.get(\"id\")  # keine Validierung\n    try:\n        u = db.session.query(User).get(user_id)\n        return jsonify(u.__dict__)       # gibt alle Spalten aus\n    except Exception as e:\n        return str(e), 500              # gibt interne Details aus\n\n# überarbeitete Fassung\n\n@app.route(\"/debug/user\")\n@require_admin                         # ausdrückliche Autorisierung\ndef debug_user():\n    try:\n        user_id = int(request.args[\"id\"])\n    except (KeyError, ValueError):\n        return jsonify({\"error\": \"invalid id\"}), 400\n\n    user = db.session.get(User, user_id)\n    if user is None:\n        return jsonify({\"error\": \"not found\"}), 404\n    return jsonify(user.to_safe_dict())  # ausdrückliche Feldfreigabe\n```",
    ],
    [prose(5, 0), "Fragen am Ende der Lektion."],
    [
      widgetString(0, "title"),
      'PR: "Caching für /users/:id ergänzen", was ist falsch?',
    ],
    [
      widgetString(0, "note"),
      "Der Cache lebt in einem Prozess und wird nie invalidiert. Nach einer Profiländerung liefern Worker bis zur Verdrängung oder zum Neustart veraltete Objekte. Prüfe vorher die Cache- und Prozessregeln des Repositorys.",
    ],
    [
      widgetString(1, "question"),
      "Codex liefert einen Diff mit neuen, grünen Tests. Was machst du mit diesen Tests zuerst?",
    ],
    [widgetStrings(1, "options")[0], "Den Tests vertrauen, sie sind ja grün."],
    [
      widgetStrings(1, "options")[1],
      "Jeden Test lesen und prüfen, ob er bei falschem Code fehlschlägt.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Alle Tests löschen und selbst neu schreiben.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Direkt zur Implementierung springen, Tests sind Formalität.",
    ],
    [
      widgetString(1, "explanation"),
      "Eine grüne Suite sagt nur, dass ihre Assertions in einer Umgebung durchliefen. Prüfe, welches Verhalten jeder Test ausübt und ob die Assertion rot wird, wenn es fehlt oder falsch ist.",
    ],
    [
      widgetString(2, "question"),
      'Der PR ergänzt oben "from some-new-lib import magic". Wie reagierst du?',
    ],
    [
      widgetStrings(2, "options")[0],
      "Die Abhängigkeit durchwinken, der Import kompiliert ja.",
    ],
    [
      widgetStrings(2, "options")[1],
      "Vorher Bedarf, Herkunft, Wartung, Lizenz, Sicherheit, transitive Folgen und Alternativen prüfen.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Codex anweisen, sie ohne Prüfung zu entfernen.",
    ],
    [widgetStrings(2, "options")[3], "npm audit laufen lassen und fertig."],
    [
      widgetString(2, "explanation"),
      "Eine neue Abhängigkeit verschiebt Lieferketten- und Wartungsgrenzen. Prüfe Manifest und Lockfile, bestätige die Herkunft und verlange einen Grund für die Aufnahme.",
    ],
  ],
  preserve: diffLineText(0),
});
