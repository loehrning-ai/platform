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
      "Vor dem Merge prüfst du verlangtes Verhalten, vollständigen Diff, Tests, Abhängigkeiten und Sicherheitsgrenzen.",
    ],
    [canonical.hook, "Diff und Protokolle sind Nachweise, keine Freigabe."],
    [canonical.keyConcepts[0], "Prüfliste für Reviews"],
    [canonical.keyConcepts[1], "Zirkuläre Tests"],
    [canonical.keyConcepts[2], "Sicherheitsprüfung"],
    [canonical.keyConcepts[3], "Umgehung der Authentifizierung"],
    [canonical.sections[0].title, "Das Artefakt prüfen, nicht den Urheber"],
    [
      prose(0, 0),
      "Ein Codex-Diff bekommt denselben Review-Maßstab wie jeder andere im Repository. Keine Rabatte. Saubere Formatierung, neue Tests, gemeldete grüne Befehle: Das macht die Prüfung leichter und belegt keine Korrektheit.\n\nFang beim verlangten Verhalten und den Vertrauensgrenzen an. Dann der vollständige Repository-Diff, einschließlich gestagter, nicht gestagter, unversionierter, generierter, Konfigurations- und Abhängigkeitsänderungen. Testcode und Befehlsprotokolle sagen dir, was tatsächlich geprüft wurde.\n\nEine wiederholbare Prüfliste deckt Umfang, Verhalten, Fehlerbehandlung, Sicherheit, Betrieb und Rücknahme ab. Oberflächliche Plausibilität deckt nichts ab.",
    ],
    [
      pullQuote(0, 1),
      "Die Annahme bleibt eine menschliche Entscheidung, gestützt auf Auftrag, vollständigen Diff und unabhängig prüfbare Nachweise.",
    ],
    [canonical.sections[1].title, "Die Prüfliste"],
    [
      prose(1, 0),
      "Sechs Prüfungen als Grundgerüst, dazu was das betroffene System zusätzlich verlangt. Sind Ziel oder Umfang falsch, hör früh auf. Kein späterer Punkt repariert eine unpassende Änderung.",
    ],
    [card(1, 1, 0, "eyebrow"), "Prüfung 01"],
    [card(1, 1, 0, "title"), "Erfüllt der PR den Auftrag?"],
    [
      card(1, 1, 0, "body"),
      "Beobachtbares Verhalten gegen Ziel und Akzeptanzkriterien. Eine benachbarte Lösung lehnst du ab, auch wenn sie in sich sauber ist.",
    ],
    [card(1, 1, 1, "eyebrow"), "Prüfung 02"],
    [card(1, 1, 1, "title"), "Hat die Änderung den richtigen Umfang?"],
    [
      card(1, 1, 1, "body"),
      "Jede geänderte und gelöschte Datei. Alles außerhalb des vereinbarten Umfangs braucht eine Begründung. Die Dateizahl allein sagt nichts über Qualität.",
    ],
    [card(1, 1, 2, "eyebrow"), "Prüfung 03"],
    [card(1, 1, 2, "title"), "Prüfen die neuen Tests tatsächlich Verhalten?"],
    [
      card(1, 1, 2, "body"),
      "Lies neue und geänderte Tests. Assertions, Fixtures, Mocks, Negativfälle, übersprungene Pfade. Und: Fällt der Test durch, wenn das Verhalten fehlt?",
    ],
    [card(1, 1, 3, "eyebrow"), "Prüfung 04"],
    [card(1, 1, 3, "title"), "Gibt es neue Abhängigkeiten?"],
    [
      card(1, 1, 3, "body"),
      "Prüfe Manifest- und Lockfile-Änderungen, Herkunft, Wartungszustand, Lizenz und transitive Risiken. Kann eine vorhandene Abhängigkeit das schon?",
    ],
    [card(1, 1, 4, "eyebrow"), "Prüfung 05"],
    [card(1, 1, 4, "title"), "Was wurde entfernt oder umgangen?"],
    [
      card(1, 1, 4, "body"),
      "Gelöschte Tests, Validierung, Rückfalllogik, Feature Flags, Kommentare mit Einschränkungen, Fehlerbehandlung. Jede Entfernung braucht eine Begründung aus dem Auftrag.",
    ],
    [card(1, 1, 5, "eyebrow"), "Prüfung 06"],
    [card(1, 1, 5, "title"), "Passt die Änderung zum Systemvertrag?"],
    [
      card(1, 1, 5, "body"),
      "Autorisierung, Datenverarbeitung, Fehler, Protokollierung, Nebenläufigkeit, Migrationen, Beobachtbarkeit, Rücknahme, Benennung, Repository-Konventionen. AGENTS.md ergänzt du nur, wenn wirklich eine dauerhafte Regel fehlte.",
    ],
    [canonical.sections[2].title, "Unauffällig falsche Tests"],
    [
      prose(2, 0),
      'Der Auftrag verlangt einen Rate Limiter für `/login`. Der Test ersetzt die Limiter-Entscheidung durch einen Mock. Welches Verhalten deckt er dann noch ab?\n\n```\n# tests/api/test_login_rate_limit.py\n\ndef test_login_maps_denial_to_429(client, mocker):\n    mock_limiter = mocker.patch("api.auth.limiter.is_allowed")\n    mock_limiter.return_value = False\n\n    response = client.post("/login", json={...})\n\n    assert response.status_code == 429\n    mock_limiter.assert_called_once()\n```\n\nDer Test belegt, dass eine abgelehnte Limiter-Entscheidung zu Status 429 wird. Zählung, Grenzwert, Schlüsselbildung, Speicherung, Reset: nichts davon. Behalte ihn, wenn die Zuordnung zählt, und ergänze einen Test über die echte Limiter-Grenze.\n\n```\n# prüft das konfigurierte Limiter-Verhalten\n\ndef test_login_blocks_at_6th_attempt(client):\n    for _ in range(5):\n        response = client.post("/login", json={...})\n        assert response.status_code == 401  # ungültige Daten, Anfrage erlaubt\n\n    response = client.post("/login", json={...})\n    assert response.status_code == 429  # Anfrage blockiert\n```',
    ],
    [canonical.sections[3].title, "Probleme erkennen"],
    [prose(3, 0), "Ein Diff. Finde den Fehler, bevor du zum Quiz scrollst."],
    [canonical.sections[4].title, "Die Sicherheitsprüfung"],
    [
      prose(4, 0),
      "Sicherheitsanforderungen stehen ausdrücklich im Auftrag und im Review. Funktionale Tests decken selten jede Vertrauensgrenze ab. Die Sicherheitsprüfung folgt den geänderten Datenflüssen, Berechtigungen, Abhängigkeiten und dem Deployment-Kontext.",
    ],
    [card(4, 1, 0, "eyebrow"), "Sicherheit 01"],
    [card(4, 1, 0, "title"), "Vertrauensgrenze für Eingaben"],
    [
      card(4, 1, 0, "body"),
      "Verfolge nicht vertrauenswürdige Werte bis in Datenbankabfragen, Dateipfade, Shell-Befehle, Templates, Weiterleitungen und Protokolle. Je nach Ziel Validierung, Parametrisierung, Kanonisierung oder Ausgabekodierung.",
    ],
    [card(4, 1, 1, "eyebrow"), "Sicherheit 02"],
    [card(4, 1, 1, "title"), "Authentifizierung und Autorisierung"],
    [
      card(4, 1, 1, "body"),
      "Prüfe für jede neue oder geänderte Operation Identität, Rolle, Mandant, Ressourcenbesitz und Default Deny. Ein Auth-Guard auf der Route erzwingt nicht automatisch Autorisierung am Objekt.",
    ],
    [card(4, 1, 2, "eyebrow"), "Sicherheit 03"],
    [card(4, 1, 2, "title"), "Geheimnisse im Quellcode"],
    [
      card(4, 1, 2, "body"),
      "Quellcode, Fixtures, Protokolle, generierte Dateien, Konfiguration: überall können Zugangsdaten oder sensible Werte stecken. Lass den Secret-Scanner des Repositorys laufen. Offengelegte Zugangsdaten widerrufst du; aus dem Diff löschen holt sie nicht aus der Historie.",
    ],
    [card(4, 1, 3, "eyebrow"), "Sicherheit 04"],
    [card(4, 1, 3, "title"), "Preisgabe durch Fehlermeldungen"],
    [
      card(4, 1, 3, "body"),
      "Keine rohen Ausnahmen an den Client, keine sensiblen Nutzdaten ins Protokoll. Prüfe sichere Client-Fehler, serverseitigen Diagnosekontext, stabile Statuscodes und Schwärzung an jeder Protokollgrenze.",
    ],
    [callout(4, 2, "title"), "Nimm die Sicherheitsprüfungen des Repositorys:"],
    [
      callout(4, 2, "body"),
      "Lass die konfigurierten Secret-, Abhängigkeits-, Static-Analysis- und Autorisierungstests für den geänderten Stack laufen. Prüfe Umfang, Ausschlüsse und Ausgabe. Eine Textsuche hilft beim Sichten. Ein Sicherheits-Gate ist sie nicht.",
    ],
    [
      prose(4, 3),
      'Vorher und nachher, und warum funktionale Ausgabe nicht reicht. Der Auftrag lautete "Endpunkt `/debug/user` ergänzen" und ließ Autorisierung, Eingabebehandlung und erlaubte Antwortfelder offen.\n\n```\n# unsichere Fassung\n\n@app.route("/debug/user")           # keine Autorisierung\ndef debug_user():\n    user_id = request.args.get("id")  # keine Validierung\n    try:\n        u = db.session.query(User).get(user_id)\n        return jsonify(u.__dict__)       # gibt alle Spalten aus\n    except Exception as e:\n        return str(e), 500              # gibt interne Details aus\n\n# überarbeitete Fassung\n\n@app.route("/debug/user")\n@require_admin                         # ausdrückliche Autorisierung\ndef debug_user():\n    try:\n        user_id = int(request.args["id"])\n    except (KeyError, ValueError):\n        return jsonify({"error": "invalid id"}), 400\n\n    user = db.session.get(User, user_id)\n    if user is None:\n        return jsonify({"error": "not found"}), 404\n    return jsonify(user.to_safe_dict())  # ausdrückliche Feldfreigabe\n```',
    ],
    [prose(5, 0), "Zwei Fragen zur Prüfung von Codex-PRs."],
    [
      widgetString(0, "title"),
      'PR: "Caching für /users/:id ergänzen", was ist falsch?',
    ],
    [
      widgetString(0, "note"),
      "Der Cache lebt in einem Prozess und hat keinen Invalidierungspfad. Nach einer Profiländerung können Worker bis zur Verdrängung oder zum Neustart veraltete Objekte liefern. Prüfe vor der Annahme Cache-Verantwortung, Invalidierung, Prozessmodell und Objektlebenszyklus des Repositorys.",
    ],
    [
      widgetString(1, "question"),
      "Codex liefert einen Diff mit neuen, grünen Tests. Was prüft die Reviewerin an diesen Tests zuerst?",
    ],
    [widgetStrings(1, "options")[0], "Den Tests vertrauen, sie sind ja grün."],
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
      "Direkt zur Implementierung springen, Tests sind Formalität.",
    ],
    [
      widgetString(1, "explanation"),
      "Eine grüne Suite meldet nur, dass ihre Assertions in einer Umgebung durchgelaufen sind. Prüfe pro Test das abgedeckte Verhalten und stell sicher, dass die relevante Assertion bei fehlendem oder falschem Verhalten rot wird.",
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
      "Bedarf, Herkunft, Wartungszustand, Lizenz, Sicherheitslage, transitive Auswirkungen und vorhandene Alternativen vor der Annahme prüfen.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Codex anweisen, sie ohne Prüfung zu entfernen.",
    ],
    [widgetStrings(2, "options")[3], "npm audit laufen lassen und fertig."],
    [
      widgetString(2, "explanation"),
      "Eine Abhängigkeit verschiebt Lieferketten- und Wartungsgrenzen. Prüfe Manifest und Lockfile, bestätige die Herkunft und verlange einen konkreten Grund für die Aufnahme.",
    ],
  ],
  preserve: diffLineText(0),
});
