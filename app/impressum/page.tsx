import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum | DS_Capture",
  description: "Impressum von DS_Capture mit allen gesetzlich geforderten Angaben.",
};

export default function ImpressumPage() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="legalPage">
      <div className="legalSection">
        <h1>Impressum</h1>
        <p>Verantwortlich für Inhalt und Gestaltung dieser Website:</p>
        <address>
          DS-Capture
          <br />
          Inhaber Dawid Chmielewski
          <br />
          Riebeckstr. 18
          <br />
          04317 Leipzig
        </address>
        <p>
          Steuernummer: 231 211/10563
          <br />
          USt-Id.: DE 302112196
        </p>
        <p>
          <a href="mailto:fotografie@ds-capture.de">fotografie@ds-capture.de</a>
          <br />
          <a href="tel:+491724374609">0172 4374609</a>
        </p>
        <p>
          Sie haben Fragen oder möchten gerne einen Fototermin mit mir vereinbaren? Kontaktieren Sie mich per Email oder
          Telefon, ich melde mich umgehend bei Ihnen.
        </p>
      </div>

      <div className="legalSection">
        <h2>Urheberrechtshinweis</h2>
        <p>© Copyright {currentYear} – Dawid Chmielewski</p>
        <p>
          Die auf der Website verwendeten Texte, Bilder, Grafiken, Dateien usw. unterliegen auch ohne gesonderte
          Kennzeichnung dem Urheberrecht. Vervielfältigung, Verbreitung, Veränderung und Verwendung (auch auszugsweise)
          nur mit ausdrücklicher Genehmigung in Schriftform des Urhebers.
        </p>
      </div>

      <div className="legalSection">
        <h2>Copyright</h2>
        <p>
          Bitte beachten Sie, dass die Inhalte dieser Website urheberrechtlich geschützt sind. Eine Vervielfältigung,
          Verbreitung, Veränderung sowie Speicherung der darin enthaltenen Daten oder Informationen, insbesondere die
          Verwendung von Fotos, Bildmaterial, Texten oder Textteilen, bedarf der vorherigen Zustimmung und schriftlichen
          Genehmigung von Dawid Chmielewski.
        </p>
      </div>

      <div className="legalSection">
        <h2>Haftungsausschluss</h2>
        <p>
          Die Informationen auf diesen Webseiten werden regelmäßig geprüft und aktualisiert. Trotz aller Sorgfalt können
          sich die Daten zwischenzeitlich verändert haben. Eine Haftung oder Garantie für die Aktualität, Richtigkeit oder
          Vollständigkeit der Informationen kann daher nicht übernommen werden.
        </p>
        <p>
          Trotz regelmäßiger und sorgfältiger Prüfung von externen Links übernehme ich keine Haftung für die Inhalte
          externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Alle
          Angaben auf diesen Seiten sind ohne Gewähr.
        </p>
      </div>
    </section>
  );
}
