export function WerkzeugeCheckliste() {
  return (
    <>
      <section className="section" id="werkzeuge">
        <div className="kicker">
          <span className="kicker__num">01</span>Drei Werkzeuge
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          Rückwärtssuche, <span className="em">WeVerify,</span> Hive.
        </h2>
        <p className="dek">
          Drei kostenlose Werkzeuge, die du in weniger als zwei Minuten einsetzen kannst.
          Kein Account erforderlich, kein Download nötig.
        </p>

        <div className="premise">
          <div className="premise__body dropcap">
            <p>
              <b style={{ color: "var(--kupfer)", fontWeight: 700 }}>
                (a) Google Rückwärtsbildersuche und TinEye
              </b>
            </p>
            <p>
              Lade ein Bild auf images.google.com hoch (Kamera-Symbol in der Suchleiste)
              oder gib die Bild-URL ein. Google zeigt dir, wo dieses Bild im Internet noch
              erscheint. TinEye (tineye.com) verwendet einen anderen Index und ist eine
              sinnvolle Ergänzung. Beide Werkzeuge brauchen unter 30 Sekunden.
            </p>
            <p>
              Wofür es gut ist: Bilder, die als aktuell verbreitet werden, aber tatsächlich
              alt sind oder aus einem anderen Kontext stammen. Ein Foto soll einen aktuellen
              Protest zeigen, taucht aber in der Suche aus 2019 auf.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)", fontWeight: 700 }}>
                (b) InVID/WeVerify Browser-Erweiterung
              </b>
            </p>
            <p>
              WeVerify (weverify.eu) ist eine kostenlose Browser-Erweiterung für Chrome
              und Firefox, finanziert durch EU Horizon 2020. Sie analysiert Videos auf
              Metadaten, Geolokation und bietet Schlüsselframe-Rückwärtssuche.
              Rechtsklick auf ein Video, WeVerify-Funktion auswählen, fertig.
            </p>
            <p>
              Besonders geeignet für: Nachrichtenvideos und viral geteilte Clips.
              WeVerify ist das einzige kostenlose Werkzeug, das speziell für Videos
              entwickelt wurde und nicht nur Bilder prüft.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)", fontWeight: 700 }}>
                (c) Hive Moderation Demo
              </b>
            </p>
            <p>
              Das öffentliche Demo unter hivemoderation.com/demo prüft Bilder auf KI-Generierung
              und gibt einen Wahrscheinlichkeitswert aus. Es erfordert keinen Account und
              ist kostenlos nutzbar. Wichtige Einschränkung: Ein niedrigerer Wert bedeutet
              nicht Echtheit, sondern kein bekanntes KI-Muster gefunden.
              (Quelle: Hive Moderation, 2024)
            </p>
          </div>
          <aside className="premise__stats">
            <div className="margin-note">
              <b>Drei Schritte, zwei Minuten</b>
              1. Rückwärtsbildersuche: Kontext prüfen<br />
              2. WeVerify: Video-Metadaten<br />
              3. Hive Demo: KI-Signal<br />
              Kein Tool ist 100 Prozent sicher.
            </div>
            <div className="margin-note">
              <b>WeVerify</b>
              weverify.eu, EU Horizon 2020-finanziert,
              für Chrome und Firefox,
              kostenlos, kein Account nötig.
            </div>
          </aside>
        </div>
      </section>

      <aside className="pull reveal">
        <div className="pull__dotgrid" />
        <p className="pull__body">
          Kein Werkzeug erkennt <span className="em">jeden</span> Deepfake.
          <br />
          Aber drei Schritte senken das Risiko <span className="em">erheblich.</span>
        </p>
        <div className="pull__attr">
          § Citizen-Praxis · loehrning.ai
        </div>
      </aside>

      <section className="section" id="checkliste">
        <div className="kicker">
          <span className="kicker__num">02</span>Visuelle Prüfung
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          Was dein Auge <span className="em">prüfen kann.</span>
        </h2>
        <p className="dek">
          Zehn visuelle Indikatoren, die bei Deepfakes häufig auftreten.
          Kein Expertenwissen nötig.
        </p>

        <div className="premise">
          <div className="premise__body">
            <p>
              <b style={{ color: "var(--kupfer)" }}>1. Haare am Rand des Gesichts:</b>{" "}
              Oft unscharf, verwaschen oder seltsam abgeschnitten. Einzelne Strähnen wirken manchmal wie gemalt.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>2. Ohren und Schmuck:</b>{" "}
              Häufig asymmetrisch oder unlogisch platziert. Ohrringe können fehlen oder an der falschen Stelle sitzen.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>3. Augen und Blinzeln:</b>{" "}
              Menschen blinzeln regelmäßig. Deepfake-Personen blinzeln oft zu selten oder synchron auf unnatürliche Weise.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>4. Hintergrund bei Bewegungen:</b>{" "}
              Bei schnellen Bewegungen entstehen Artefakte. Die Kanten der Person bluten in den Hintergrund.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>5. Beleuchtung:</b>{" "}
              Schatten auf Hals und Kinn stimmen oft nicht mit der Lichtquelle im Bild überein.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>6. Zähne:</b>{" "}
              Manchmal verwaschen, mit falscher Anzahl oder unnatürlich glatt.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>7. Fingerzahl:</b>{" "}
              Generative KI-Modelle halluzinieren Finger. Zähle Finger bei Bildern mit Händen.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>8. Textur:</b>{" "}
              Haut sieht manchmal unnatürlich glatt aus. Keine sichtbaren Poren bei Nahaufnahmen.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>9. Bild-Metadaten:</b>{" "}
              EXIF-Daten fehlen oder sind inkonsistent. exif.tools zeigt die Metadaten eines hochgeladenen Fotos kostenlos.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>10. Kontext und Quelle:</b>{" "}
              Wer hat das Video geteilt? Wann? Gibt es andere seriöse Quellen, die dasselbe zeigen?
            </p>
          </div>
          <aside className="premise__stats">
            <div className="margin-note">
              <b>Fazit</b>
              Keiner dieser Indikatoren ist ein Beweis allein. Eine Kombination von drei
              oder mehr Indikatoren ist ein starkes Warnsignal.
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
