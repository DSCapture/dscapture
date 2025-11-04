import type { Metadata } from "next";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";

const defaultMetadata: Metadata = {
  title: "Datenschutzerklärung | DS_Capture",
  description: "Informationen zum Datenschutz und zur Verarbeitung personenbezogener Daten bei DS_Capture.",
  openGraph: {
    title: "Datenschutzerklärung | DS_Capture",
    description: "Informationen zum Datenschutz und zur Verarbeitung personenbezogener Daten bei DS_Capture.",
    url: "https://ds-capture.de/datenschutz",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
  alternates: {
    canonical: "https://ds-capture.de/datenschutz",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("datenschutz");
  return applyPageMetadata(defaultMetadata, record);
}

export default function DatenschutzPage() {
  return (
    <section className="legalPage">
      <div className="legalSection">
        <h1>Datenschutzerklärung</h1>
        <p>
          Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre
          personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser
          Datenschutzerklärung.
        </p>
        <p>
          Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren
          Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) erhoben werden, erfolgt
          dies, soweit möglich, stets auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht
          an Dritte weitergegeben.
        </p>
        <p>
          Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail)
          Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht
          möglich.
        </p>
      </div>

      <div className="legalSection">
        <h2>Cookies</h2>
        <p>
          Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an
          und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu
          machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
        </p>
        <p>
          Die meisten der von uns verwendeten Cookies sind so genannte „Session-Cookies“. Sie werden nach Ende Ihres
          Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese
          Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.
        </p>
        <p>
          Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im
          Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische
          Löschen der Cookies beim Schließen des Browser aktivieren. Bei der Deaktivierung von Cookies kann die
          Funktionalität dieser Website eingeschränkt sein.
        </p>
      </div>

      <div className="legalSection">
        <h2>Kontaktformular</h2>
        <p>
          Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive
          der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen
          bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
        </p>
      </div>

      <div className="legalSection">
        <h2>Datenschutzerklärung für die Nutzung von Google Analytics</h2>
        <p>
          Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Inc. 1600
          Amphitheatre Parkway Mountain View, CA 94043, USA. Google Analytics verwendet sog. „Cookies“. Das sind
          Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website durch Sie
          ermöglichen. Die durch den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel
          an einen Server von Google in den USA übertragen und dort gespeichert.
        </p>
        <p>
          Im Falle der Aktivierung der IP-Anonymisierung auf dieser Webseite wird Ihre IP-Adresse von Google jedoch
          innerhalb von Mitgliedstaaten der Europäischen Union oder in anderen Vertragsstaaten des Abkommens über den
          Europäischen Wirtschaftsraum zuvor gekürzt. Nur in Ausnahmefällen wird die volle IP-Adresse an einen Server von
          Google in den USA übertragen und dort gekürzt. Im Auftrag des Betreibers dieser Website wird Google diese
          Informationen benutzen, um Ihre Nutzung der Website auszuwerten, um Reports über die Websiteaktivitäten
          zusammenzustellen und um weitere mit der Websitenutzung und der Internetnutzung verbundene Dienstleistungen
          gegenüber dem Websitebetreiber zu erbringen. Die im Rahmen von Google Analytics von Ihrem Browser übermittelte
          IP-Adresse wird nicht mit anderen Daten von Google zusammengeführt.
        </p>
        <p>
          Sie können die Speicherung der Cookies durch eine entsprechende Einstellung Ihrer Browser-Software verhindern;
          wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website
          vollumfänglich werden nutzen können. Sie können darüber hinaus die Erfassung der durch das Cookie erzeugten und auf
          Ihre Nutzung der Website bezogenen Daten (inkl. Ihrer IP-Adresse) an Google sowie die Verarbeitung dieser Daten
          durch Google verhindern, indem sie das unter dem folgenden Link verfügbare Browser-Plugin herunterladen und
          installieren:
          <a href="http://tools.google.com/dlpage/gaoptout?hl=de">http://tools.google.com/dlpage/gaoptout?hl=de</a>.
        </p>
      </div>

      <div className="legalSection">
        <h2>Datenschutzerklärung für die Nutzung von Instagram</h2>
        <p>
          Auf unseren Seiten sind Funktionen des Dienstes Instagram eingebunden. Diese Funktionen werden angeboten durch die
          Instagram Inc., 1601 Willow Road, Menlo Park, CA, 94025, USA integriert. Wenn Sie in Ihrem Instagram-Account
          eingeloggt sind können Sie durch Anklicken des Instagram-Buttons die Inhalte unserer Seiten mit Ihrem Instagram-
          Profil verlinken. Dadurch kann Instagram den Besuch unserer Seiten Ihrem Benutzerkonto zuordnen. Wir weisen darauf
          hin, dass wir als Anbieter der Seiten keine Kenntnis vom Inhalt der übermittelten Daten sowie deren Nutzung durch
          Instagram erhalten.
        </p>
        <p>
          Weitere Informationen hierzu finden Sie in der Datenschutzerklärung von Instagram: <a href="http://instagram.com/about/legal/privacy/">http://instagram.com/about/legal/privacy/</a>.
        </p>
      </div>

      <div className="legalSection">
        <h2>Rechte der betroffenen Person</h2>

        <h3>a) Recht auf Bestätigung</h3>
        <p>
          Jede betroffene Person hat das vom Europäischen Richtlinien- und Verordnungsgeber eingeräumte Recht, von dem für
          die Verarbeitung Verantwortlichen eine Bestätigung darüber zu verlangen, ob sie betreffende personenbezogene Daten
          verarbeitet werden. Möchte eine betroffene Person dieses Bestätigungsrecht in Anspruch nehmen, kann sie sich hierzu
          jederzeit an einen Mitarbeiter des für die Verarbeitung Verantwortlichen wenden.
        </p>

        <h3>b) Recht auf Auskunft</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, jederzeit von dem für die Verarbeitung Verantwortlichen unentgeltliche Auskunft
          über die zu seiner Person gespeicherten personenbezogenen Daten und eine Kopie dieser Auskunft zu erhalten. Ferner
          hat der Europäische Richtlinien- und Verordnungsgeber der betroffenen Person Auskunft über folgende Informationen
          zugestanden:
        </p>
        <ul>
          <li>die Verarbeitungszwecke</li>
          <li>die Kategorien personenbezogener Daten, die verarbeitet werden</li>
          <li>
            die Empfänger oder Kategorien von Empfängern, gegenüber denen die personenbezogenen Daten offengelegt worden sind
            oder noch offengelegt werden, insbesondere bei Empfängern in Drittländern oder bei internationalen Organisationen
          </li>
          <li>
            falls möglich die geplante Dauer, für die die personenbezogenen Daten gespeichert werden, oder, falls dies nicht
            möglich ist, die Kriterien für die Festlegung dieser Dauer
          </li>
          <li>
            das Bestehen eines Rechts auf Berichtigung oder Löschung der sie betreffenden personenbezogenen Daten oder auf
            Einschränkung der Verarbeitung durch den Verantwortlichen oder eines Widerspruchsrechts gegen diese Verarbeitung
          </li>
          <li>das Bestehen eines Beschwerderechts bei einer Aufsichtsbehörde</li>
          <li>
            wenn die personenbezogenen Daten nicht bei der betroffenen Person erhoben werden: Alle verfügbaren Informationen
            über die Herkunft der Daten
          </li>
          <li>
            das Bestehen einer automatisierten Entscheidungsfindung einschließlich Profiling gemäß Artikel 22 Abs. 1 und 4
            DS-GVO und — zumindest in diesen Fällen — aussagekräftige Informationen über die involvierte Logik sowie die
            Tragweite und die angestrebten Auswirkungen einer derartigen Verarbeitung für die betroffene Person
          </li>
        </ul>
        <p>
          Ferner steht der betroffenen Person ein Auskunftsrecht darüber zu, ob personenbezogene Daten an ein Drittland oder
          an eine internationale Organisation übermittelt wurden. Sofern dies der Fall ist, so steht der betroffenen Person im
          Übrigen das Recht zu, Auskunft über die geeigneten Garantien im Zusammenhang mit der Übermittlung zu erhalten.
        </p>
        <p>
          Möchte eine betroffene Person dieses Auskunftsrecht in Anspruch nehmen, kann sie sich hierzu jederzeit an einen
          Mitarbeiter des für die Verarbeitung Verantwortlichen wenden.
        </p>

        <h3>c) Recht auf Berichtigung</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, die unverzügliche Berichtigung sie betreffender unrichtiger personenbezogener Daten
          zu verlangen. Ferner steht der betroffenen Person das Recht zu, unter Berücksichtigung der Zwecke der Verarbeitung,
          die Vervollständigung unvollständiger personenbezogener Daten — auch mittels einer ergänzenden Erklärung — zu
          verlangen.
        </p>
        <p>
          Möchte eine betroffene Person dieses Berichtigungsrecht in Anspruch nehmen, kann sie sich hierzu jederzeit an einen
          Mitarbeiter des für die Verarbeitung Verantwortlichen wenden.
        </p>

        <h3>d) Recht auf Löschung (Recht auf Vergessen werden)</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, von dem Verantwortlichen zu verlangen, dass die sie betreffenden personenbezogenen
          Daten unverzüglich gelöscht werden, sofern einer der folgenden Gründe zutrifft und soweit die Verarbeitung nicht
          erforderlich ist:
        </p>
        <ul>
          <li>
            Die personenbezogenen Daten wurden für solche Zwecke erhoben oder auf sonstige Weise verarbeitet, für welche sie
            nicht mehr notwendig sind.
          </li>
          <li>
            Die betroffene Person widerruft ihre Einwilligung, auf die sich die Verarbeitung gemäß Art. 6 Abs. 1 Buchstabe a
            DS-GVO oder Art. 9 Abs. 2 Buchstabe a DS-GVO stützte, und es fehlt an einer anderweitigen Rechtsgrundlage für die
            Verarbeitung.
          </li>
          <li>
            Die betroffene Person legt gemäß Art. 21 Abs. 1 DS-GVO Widerspruch gegen die Verarbeitung ein, und es liegen keine
            vorrangigen berechtigten Gründe für die Verarbeitung vor, oder die betroffene Person legt gemäß Art. 21 Abs. 2
            DS-GVO Widerspruch gegen die Verarbeitung ein.
          </li>
          <li>Die personenbezogenen Daten wurden unrechtmäßig verarbeitet.</li>
          <li>
            Die Löschung der personenbezogenen Daten ist zur Erfüllung einer rechtlichen Verpflichtung nach dem Unionsrecht
            oder dem Recht der Mitgliedstaaten erforderlich, dem der Verantwortliche unterliegt.
          </li>
          <li>
            Die personenbezogenen Daten wurden in Bezug auf angebotene Dienste der Informationsgesellschaft gemäß Art. 8 Abs.
            1 DS-GVO erhoben.
          </li>
        </ul>
        <p>
          Sofern einer der oben genannten Gründe zutrifft und eine betroffene Person die Löschung von personenbezogenen
          Daten, die auf unserer Webseite gespeichert sind, veranlassen möchte, kann sie sich hierzu jederzeit an einen
          Mitarbeiter des für die Verarbeitung Verantwortlichen wenden. Der Betreiber der Webseite wird veranlassen, dass dem
          Löschverlangen unverzüglich nachgekommen wird.
        </p>
        <p>
          Wurden die personenbezogenen Daten von unserer Webseite öffentlich gemacht und ist unsere Webseite als
          Verantwortlicher gemäß Art. 17 Abs. 1 DS-GVO zur Löschung der personenbezogenen Daten verpflichtet, so trifft der
          Betreiber der Webseite unter Berücksichtigung der verfügbaren Technologie und der Implementierungskosten angemessene
          Maßnahmen, auch technischer Art, um andere für die Datenverarbeitung Verantwortliche, welche die veröffentlichten
          personenbezogenen Daten verarbeiten, darüber in Kenntnis zu setzen, dass die betroffene Person von diesen anderen
          für die Datenverarbeitung Verantwortlichen die Löschung sämtlicher Links zu diesen personenbezogenen Daten oder von
          Kopien oder Replikationen dieser personenbezogenen Daten verlangt hat, soweit die Verarbeitung nicht erforderlich
          ist. Sebastian Schoppe, als Betreiber dieser Webseite wird im Einzelfall das Notwendige veranlassen.
        </p>

        <h3>e) Recht auf Einschränkung der Verarbeitung</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, von dem Verantwortlichen die Einschränkung der Verarbeitung zu verlangen, wenn eine
          der folgenden Voraussetzungen gegeben ist:
        </p>
        <ul>
          <li>
            Die Richtigkeit der personenbezogenen Daten wird von der betroffenen Person bestritten, und zwar für eine Dauer,
            die es dem Verantwortlichen ermöglicht, die Richtigkeit der personenbezogenen Daten zu überprüfen.
          </li>
          <li>
            Die Verarbeitung ist unrechtmäßig, die betroffene Person lehnt die Löschung der personenbezogenen Daten ab und
            verlangt stattdessen die Einschränkung der Nutzung der personenbezogenen Daten.
          </li>
          <li>
            Der Verantwortliche benötigt die personenbezogenen Daten für die Zwecke der Verarbeitung nicht länger, die
            betroffene Person benötigt sie jedoch zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.
          </li>
          <li>
            Die betroffene Person hat Widerspruch gegen die Verarbeitung gem. Art. 21 Abs. 1 DS-GVO eingelegt und es steht
            noch nicht fest, ob die berechtigten Gründe des Verantwortlichen gegenüber denen der betroffenen Person überwiegen.
          </li>
        </ul>
        <p>
          Sofern eine der oben genannten Voraussetzungen gegeben ist und eine betroffene Person die Einschränkung von
          personenbezogenen Daten, die auf unserer Webseite gespeichert worden, verlangen möchte, kann sie sich hierzu
          jederzeit an einen Mitarbeiter des für die Verarbeitung Verantwortlichen wenden. Der Betreiber der Webseite wird die
          Einschränkung der Verarbeitung veranlassen.
        </p>

        <h3>f) Recht auf Datenübertragbarkeit</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, die sie betreffenden personenbezogenen Daten, welche durch die betroffene Person
          einem Verantwortlichen bereitgestellt wurden, in einem strukturierten, gängigen und maschinenlesbaren Format zu
          erhalten. Sie hat außerdem das Recht, diese Daten einem anderen Verantwortlichen ohne Behinderung durch den
          Verantwortlichen, dem die personenbezogenen Daten bereitgestellt wurden, zu übermitteln, sofern die Verarbeitung auf
          der Einwilligung gemäß Art. 6 Abs. 1 Buchstabe a DS-GVO oder Art. 9 Abs. 2 Buchstabe a DS-GVO oder auf einem Vertrag
          gemäß Art. 6 Abs. 1 Buchstabe b DS-GVO beruht und die Verarbeitung mithilfe automatisierter Verfahren erfolgt,
          sofern die Verarbeitung nicht für die Wahrnehmung einer Aufgabe erforderlich ist, die im öffentlichen Interesse
          liegt oder in Ausübung öffentlicher Gewalt erfolgt, welche dem Verantwortlichen übertragen wurde.
        </p>
        <p>
          Ferner hat die betroffene Person bei der Ausübung ihres Rechts auf Datenübertragbarkeit gemäß Art. 20 Abs. 1 DS-GVO
          das Recht, zu erwirken, dass die personenbezogenen Daten direkt von einem Verantwortlichen an einen anderen
          Verantwortlichen übermittelt werden, soweit dies technisch machbar ist und sofern hiervon nicht die Rechte und
          Freiheiten anderer Personen beeinträchtigt werden.
        </p>
        <p>
          Zur Geltendmachung des Rechts auf Datenübertragbarkeit kann sich die betroffene Person jederzeit an den Betreiber
          der Webseite wenden.
        </p>

        <h3>g) Recht auf Widerspruch</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, aus Gründen, die sich aus ihrer besonderen Situation ergeben, jederzeit gegen die
          Verarbeitung sie betreffender personenbezogener Daten, die aufgrund von Art. 6 Abs. 1 Buchstaben e oder f DS-GVO
          erfolgt, Widerspruch einzulegen. Dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.
        </p>
        <p>
          Unsere Webseite verarbeitet die personenbezogenen Daten im Falle des Widerspruchs nicht mehr, es sei denn, wir
          können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die den Interessen, Rechten und Freiheiten der
          betroffenen Person überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von
          Rechtsansprüchen.
        </p>
        <p>
          Verarbeitet unsere Webseite personenbezogene Daten, um Direktwerbung zu betreiben, so hat die betroffene Person das
          Recht, jederzeit Widerspruch gegen die Verarbeitung der personenbezogenen Daten zum Zwecke derartiger Werbung
          einzulegen. Dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Widerspricht
          die betroffene Person gegenüber unserer Webseite der Verarbeitung für Zwecke der Direktwerbung, so wird der Betreiber
          der Webseite die personenbezogenen Daten nicht mehr für diese Zwecke verarbeiten.
        </p>
        <p>
          Zudem hat die betroffene Person das Recht, aus Gründen, die sich aus ihrer besonderen Situation ergeben, gegen die
          sie betreffende Verarbeitung personenbezogener Daten, die auf unserer Webseite zu wissenschaftlichen oder
          historischen Forschungszwecken oder zu statistischen Zwecken gemäß Art. 89 Abs. 1 DS-GVO erfolgen, Widerspruch
          einzulegen, es sei denn, eine solche Verarbeitung ist zur Erfüllung einer im öffentlichen Interesse liegenden Aufgabe
          erforderlich.
        </p>
        <p>
          Zur Ausübung des Rechts auf Widerspruch kann sich die betroffene Person direkt an den Betreiber der Webseite wenden.
          Der betroffenen Person steht es ferner frei, im Zusammenhang mit der Nutzung von Diensten der Informationsgesellschaft,
          ungeachtet der Richtlinie 2002/58/EG, ihr Widerspruchsrecht mittels automatisierter Verfahren auszuüben, bei denen
          technische Spezifikationen verwendet werden.
        </p>

        <h3>h) Automatisierte Entscheidungen im Einzelfall einschließlich Profiling</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, nicht einer ausschließlich auf einer automatisierten Verarbeitung — einschließlich
          Profiling — beruhenden Entscheidung unterworfen zu werden, die ihr gegenüber rechtliche Wirkung entfaltet oder sie in
          ähnlicher Weise erheblich beeinträchtigt, sofern die Entscheidung (1) nicht für den Abschluss oder die Erfüllung
          eines Vertrags zwischen der betroffenen Person und dem Verantwortlichen erforderlich ist, oder (2) aufgrund von
          Rechtsvorschriften der Union oder der Mitgliedstaaten, denen der Verantwortliche unterliegt, zulässig ist und diese
          Rechtsvorschriften angemessene Maßnahmen zur Wahrung der Rechte und Freiheiten sowie der berechtigten Interessen der
          betroffenen Person enthalten oder (3) mit ausdrücklicher Einwilligung der betroffenen Person erfolgt.
        </p>
        <p>
          Ist die Entscheidung (1) für den Abschluss oder die Erfüllung eines Vertrags zwischen der betroffenen Person und dem
          Verantwortlichen erforderlich oder (2) erfolgt sie mit ausdrücklicher Einwilligung der betroffenen Person, trifft der
          Betreiber der Webseite angemessene Maßnahmen, um die Rechte und Freiheiten sowie die berechtigten Interessen der
          betroffenen Person zu wahren, wozu mindestens das Recht auf Erwirkung des Eingreifens einer Person seitens des
          Verantwortlichen, auf Darlegung des eigenen Standpunkts und auf Anfechtung der Entscheidung gehört.
        </p>
        <p>
          Möchte die betroffene Person Rechte mit Bezug auf automatisierte Entscheidungen geltend machen, kann sie sich hierzu
          jederzeit an einen Mitarbeiter des für die Verarbeitung Verantwortlichen wenden.
        </p>

        <h3>i) Recht auf Widerruf einer datenschutzrechtlichen Einwilligung</h3>
        <p>
          Jede von der Verarbeitung personenbezogener Daten betroffene Person hat das vom Europäischen Richtlinien- und
          Verordnungsgeber gewährte Recht, eine Einwilligung zur Verarbeitung personenbezogener Daten jederzeit zu widerrufen.
        </p>
        <p>
          Möchte die betroffene Person ihr Recht auf Widerruf einer Einwilligung geltend machen, kann sie sich hierzu jederzeit
          an einen Mitarbeiter des für die Verarbeitung Verantwortlichen wenden.
        </p>
      </div>

      <div className="legalSection">
        <h2>Widerspruch gegen Werbe-Mails</h2>
        <p>
          Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich
          angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich
          ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails,
          vor.
        </p>
      </div>
    </section>
  );
}
