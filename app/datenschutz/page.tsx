import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | DS_Capture",
  description: "Transparente Informationen zum Umgang mit personenbezogenen Daten bei DS_Capture.",
};

export default function DatenschutzPage() {
  return (
    <section className="legalPage">
      <div className="legalSection">
        <h1>Datenschutzerklärung</h1>
        <p>
          Wir freuen uns über Ihr Interesse an unserem Online-Angebot. Der Schutz Ihrer Privatsphäre ist für uns sehr
          wichtig. Nachstehend informieren wir Sie ausführlich über den Umgang mit Ihren Daten.
        </p>
      </div>

      <div className="legalSection">
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung ist Dawid Szymanski, DS_Capture, Musterstraße 12, 12345 Berlin,
          E-Mail: <a href="mailto:info@dscapture.de">info@dscapture.de</a>.
        </p>
      </div>

      <div className="legalSection">
        <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
        <p>
          Wir verarbeiten personenbezogene Daten, die Sie uns freiwillig mitteilen, beispielsweise über das
          Kontaktformular oder per E-Mail. Hierzu zählen insbesondere Name, E-Mail-Adresse, Telefonnummer sowie
          Informationen zu Ihrem Anliegen.
        </p>
      </div>

      <div className="legalSection">
        <h2>3. Zwecke der Datenverarbeitung</h2>
        <p>
          Wir verwenden Ihre Daten, um Ihre Anfragen zu beantworten, Verträge zu erfüllen und unsere Dienstleistungen zu
          verbessern. Eine Weitergabe Ihrer Daten an Dritte erfolgt nur, sofern wir hierzu gesetzlich verpflichtet sind
          oder Sie ausdrücklich eingewilligt haben.
        </p>
      </div>

      <div className="legalSection">
        <h2>4. Rechtsgrundlagen</h2>
        <p>
          Die Verarbeitung Ihrer Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), Art. 6 Abs. 1
          lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
        </p>
      </div>

      <div className="legalSection">
        <h2>5. Ihre Rechte</h2>
        <p>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer
          personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit und Widerspruch. Bitte wenden Sie sich hierfür
          an <a href="mailto:info@dscapture.de">info@dscapture.de</a>.
        </p>
      </div>

      <div className="legalSection">
        <h2>6. Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder wie
          wir gesetzlich dazu verpflichtet sind.
        </p>
      </div>

      <div className="legalSection">
        <h2>7. SSL- bzw. TLS-Verschlüsselung</h2>
        <p>
          Unsere Website nutzt aus Sicherheitsgründen eine SSL-bzw. TLS-Verschlüsselung, um die Übertragung vertraulicher
          Inhalte zu schützen, etwa bei Anfragen über das Kontaktformular.
        </p>
      </div>

      <div className="legalSection">
        <h2>8. Aktualität und Änderung dieser Datenschutzerklärung</h2>
        <p>
          Diese Datenschutzerklärung ist aktuell gültig und hat den Stand April 2024. Wir behalten uns vor, sie anzupassen,
          um sie an geänderte Rechtslagen oder bei Änderungen des Dienstes anzupassen.
        </p>
      </div>
    </section>
  );
}
