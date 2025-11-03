import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum | DS_Capture",
  description: "Impressum von DS_Capture mit allen gesetzlich geforderten Angaben.",
};

export default function ImpressumPage() {
  return (
    <section className="legalPage">
      <div className="legalSection">
        <h1>Impressum</h1>
        <p>Angaben gemäß § 5 TMG</p>
        <address>
          Dawid Szymanski
          <br />
          DS_Capture
          <br />
          Musterstraße 12
          <br />
          12345 Berlin
        </address>
      </div>

      <div className="legalSection">
        <h2>Kontakt</h2>
        <p>
          Telefon: <a href="tel:+491701234567">+49 170 1234567</a>
          <br />
          E-Mail: <a href="mailto:info@dscapture.de">info@dscapture.de</a>
        </p>
      </div>

      <div className="legalSection">
        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE999999999</p>
      </div>

      <div className="legalSection">
        <h2>Berufshaftpflichtversicherung</h2>
        <p>
          HDI Versicherung AG
          <br />
          HDI-Platz 1
          <br />
          30659 Hannover
        </p>
        <p>Geltungsraum der Versicherung: Deutschland</p>
      </div>

      <div className="legalSection">
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
          Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
          rechtswidrige Tätigkeit hinweisen.
        </p>
      </div>

      <div className="legalSection">
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb
          können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist
          stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </div>

      <div className="legalSection">
        <h2>Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
          Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen
          des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </div>
    </section>
  );
}
