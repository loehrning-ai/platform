import { PostHead } from "../../_components/post-head";

export function Hero() {
  return (
    <>
      <PostHead
        slug="eu-ai-act-grundlagen"
        title="Der EU AI Act: was er bedeutet, wenn du keine Juristin bist."
        byline={["Tim Löhr", "28. Juli 2026", "11 Min."]}
        lede={
          <>
            Der EU AI Act gilt in Stufen: Teile seit Februar 2025, weitere ab
            2. August 2026, die Hochrisiko-Regeln später. Hier steht ohne
            Fachjargon, was gilt und welche Rechte du bekommst. Stand: 28. Juli
            2026, jede Angabe mit Primärquelle.
          </>
        }
      />

      <section className="scene" id="einstieg">
        <div className="scene__dateline">
          EU AI Act · Verordnung (EU) 2024/1689, geändert durch 2026/1744 ·
          Stand: 28. Juli 2026
        </div>
        <div className="scene__body">
          <p>
            Ein Chatbot beantwortet deine Frage an die Versicherung. Eine
            Software sortiert deine Bewerbung, bevor ein Mensch sie sieht. Ein
            Video zeigt eine Politikerin, die den gezeigten Satz nie gesagt hat.
            Für alle drei Fälle hat der EU AI Act Regeln, einige davon gelten
            ab dem 2. August 2026.
          </p>
          <p>
            Im Juni 2026 hat die EU zudem beschlossen, die Regeln für
            Hochrisiko-Systeme zu verschieben. Seitdem kursieren zwei
            Erzählungen: <em>alles gilt ab August</em> und{" "}
            <em>alles ist verschoben</em>. Beide sind falsch.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        Für KI-Kompetenz nach Artikel 4 ist kein Zertifikat nötig. Das stellt
        die Europäische Kommission in ihrem Q&amp;A ausdrücklich fest.
      </div>
    </>
  );
}
