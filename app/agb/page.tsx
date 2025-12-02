import type { Metadata } from "next";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";

const defaultMetadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen | DS_Capture",
  description:
    "Allgemeine Geschäftsbedingungen von DS_Capture mit Informationen zu Urheberrecht, Nutzungsrechten und Zahlungsmodalitäten.",
  openGraph: {
    title: "Allgemeine Geschäftsbedingungen | DS_Capture",
    description:
      "Allgemeine Geschäftsbedingungen von DS_Capture mit Informationen zu Urheberrecht, Nutzungsrechten und Zahlungsmodalitäten.",
    url: "https://ds-capture.de/agb",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
  alternates: {
    canonical: "https://ds-capture.de/agb",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("agb");
  return applyPageMetadata(defaultMetadata, record);
}

export default function AgbPage() {
  return (
    <section className="legalPage">
      <div className="legalSection">
        <h1>Allgemeine Geschäftsbedingungen</h1>
      </div>

      <div className="legalSection">
        <h2>1. Geltungsbereich</h2>
        <p>
          1.1. Die nachfolgenden Allgemeinen Geschäftsbedingungen (AGB) gelten für alle erteilten Aufträge, Angebote, wie
          auch Lieferungen und Leistungen durch DS-Capture Inhaber Dawid Chmielewski oder dessen Vertreter. Sie gelten als
          ausdrücklich vereinbart und anerkannt, wenn der Auftrag durch den Auftraggeber erteilt wird.
        </p>
        <p>
          1.2. Fotoaufnahmen im Sinne dieser AGB sind alle des Fotografen hergestellten Produkte, gleich in welcher
          technischen Form oder in welchem Medium sie erstellt wurden oder vorliegen.
        </p>
      </div>

      <div className="legalSection">
        <h2>2. Urheberrecht</h2>
        <p>2.1. Dem Fotografen steht das Urheberrecht an den Fotoaufnahmen nach Maßgabe des Urheberrechtsgesetzes zu.</p>
        <p>2.2. Die von dem Fotografen hergestellten Fotoaufnahmen sind grundsätzlich nur für den eigenen Gebrauch des Auftragsgebers bestimmt.</p>
        <p>2.3. Überträgt der Fotograf Nutzungsrechte an seinen Werken, ist (sofern nicht ausdrücklich etwas anderes vereinbart wurde) jeweils nur das einfache Nutzungsrecht übertragen.</p>
        <p>2.4. Die Nutzungsrechte werden erst nach der vollständigen Bezahlung, des Honorars an den Fotografen, übertragen.</p>
        <p>
          2.5. Bei jeder Bildveröffentlichung ist der Fotografin als Urheber zu benennen, sofern möglich. Die Benennung muss beim Bild erfolgen. Der Fotograf übernimmt keine Haftung für die Art der Nutzung seiner Bilder. Der Auftraggeber ist dafür verantwortlich, dass durch die Art der Nutzung keine Persönlichkeitsrechte, Urheberrechte oder sonstige Rechte Dritter verletzt werden. Eine Verletzung des Rechts auf Namensnennung berechtigt den Fotografen zum Schadensersatz.
        </p>
        <p>2.6. Veröffentlichungen sind nur ohne Filter oder andere Änderungen am Bild gestattet. Eigenmächtige Bildveränderungen sind ausdrücklich nicht gestattet.</p>
      </div>

      <div className="legalSection">
        <h2>3. Honorare, Nebenkosten und Eigentumsvorbehalt</h2>
        <p>
          3.1. Für die Herstellung der Fotoaufnahmen wird ein Paketpreis angeboten zzgl. aller Nebenkosten wie z.B. Reisekosten, Übernachtungskosten, Gebühren, Auslagen und Eintritte. Der Fotograf führt die für den Kunden entstehenden Nebenkosten im Honorarangebot auf. Für weitere Bilddateien wird ein separater Preis des Fotografen berechnet, welcher ebenfalls im Honorarangebot aufgeführt ist. Gegenüber Endverbrauchern und Gewerbekunden weist der Fotograf das Honorar ohne Umsatzsteuer aus.
        </p>
        <p>3.2 Der Kunde erhält ein für ihn kostenfreies Honorarangebot über die zu erbringenden Leistungen.</p>
        <p>3.3 Eine Auftragserteilung gilt erst als verbindlich, wenn die Auftragserteilung des Kunden in schriftlicher Form z.B. per E-Mail, vom Fotografen bestätigt wurde.</p>
        <p>
          3.4 Der Fotograf kann den Auftrag zum Teil durch Dritte (z.B. Labore) ausführen lassen. Sofern der Kunde keine schriftlichen Anweisungen trifft, ist dem Fotografen die Art der Durchführung des Auftrags frei. Dies gilt insbesondere für die Bildauffassung, den Aufnahmeort und die angewendeten optisch technischen (fotografischen) Mittel.
        </p>
        <p>
          3.5. Sofern vertraglich keine anderen Zahlungsbedingungen angegeben sind, ist der ausgewiesene Paketpreis bei Buchung fällig und mit Eingang der Zahlung ist die Buchung des Shootingtermins als verbindlich bestätigt. Eventuell später ausgewählte Fotoprodukte werden in Rechnung gestellt und sind spätestens nach 7 Tagen zu zahlen.
        </p>
        <p>
          3.6. Bis zur vollständigen Bezahlung des Honorars, der ggf. anfallenden Nebenkosten und Fotoprodukte bleiben die gelieferten Fotoaufnahmen sowie Fotoprodukte Eigentum des Fotografen, des Weiteren erfolgt bis zur vollständigen Bezahlung keine Übertragung der einfachen Nutzungsrechte unter Punkt 5.
        </p>
        <p>3.7. Reklamation bezüglich der Bildauffassung, sowie der künstlerisch-technischen Gestaltung sind ausgeschlossen. Sollte der Auftraggeber während des Shootings Sonderwünsche oder Änderungen äußern, werden diese gesondert berechnet werden.</p>
        <p>3.8. Während eines Fototermins ist das Fotografieren durch den Auftraggeber selbst bzw. dessen Gästen oder Mitarbeitern nicht gestattet, sofern nichts Anderweitiges vereinbart wurde.</p>
        <p>3.9. Die Rechnung für ausgewählte Bilder ist direkt nach der Auswahl fällig. Sobald der Zahlungseingang verzeichnet ist beginnt die Bearbeitungszeit die je nach Auftragslage variiert.</p>
      </div>

      <div className="legalSection">
        <h2>4. Haftung</h2>
        <p>4.1. Für die Verletzung von Pflichten, die nicht in unmittelbarem Zusammenhang mit wesentlichen Vertragspflichten stehen, haftet der Fotograf für sich und dessen Erfüllungsgehilfen nur bei Vorsatz und grober Fahrlässigkeit.</p>
        <p>4.2. Für Schäden an Aufnahmeobjekten, Vorlagen, Filmen, Displays, Layouts, Negativen oder Daten haftet der Fotograf nur bei Vorsatz und grober Fahrlässigkeit.</p>
        <p>4.3. Übergebene Vorlagen oder Gegenstände müssen vom Auftraggeber gegen Beschädigung, Verlust, Diebstahl und Feuer versichert sein.</p>
        <p>4.4. Sollten Aufnahmen vor Übergabe an den Auftraggeber aus irgendwelchen Gründen verloren gehen, wird das Shooting kostenfrei zu gleichen Bedingungen wiederholt. Weitere Ansprüche sind ausdrücklich ausgeschlossen.</p>
        <p>4.5. Der Auftraggeber kann in vollem Umfang für Schäden an Kamera und Objektiv haftbar gemacht werden, wenn diese durch mutwillige Einwirkungen des Kunden stattgefunden haben. Bitte beachten Sie bei Shootings mit Hunden, hat der Kunde sicher zu stellen, dass sein/e Tier/e versichert ist/ sind und ebenfalls an Schäden durch das/die Tier/e haftbar gemacht werden kann.</p>
      </div>

      <div className="legalSection">
        <h2>5. Nutzungsrechte/ Persönlichkeitsrechte</h2>
        <p>5.1. Der Auftraggeber erwirbt an den Bildern nur die Nutzungsrechte für den privaten Gebrauch. Die Vervielfältigung und die Weitergabe an Dritte werden für private Zwecke eingeräumt. Eine kommerzielle Nutzung sowie eine kommerzielle und/ oder öffentliche, nicht private Wiedergabe ist nicht gestattet (ausgenommen gewerbliche Nutzung durch eine schriftliche Genehmigung). Eigentumsrechte werden nicht übertragen. Eigentumsrechte werden nur gegen ein angemessenes Honorar übertragen.</p>
        <p>5.2. Der Auftraggeber erklärt sich mit der Auftragserteilung einverstanden, dass die entstandenen Fotos zur Eigenwerbung des Fotografen auf der Internetseite, in Printmedien oder in Veröffentlichungen verwendet werden dürfen. Der Kunde tritt hierfür das Recht am eigenen Bild ab. Er darf die Bilddateien ohne Einschränkung für seine Internetpräsentation, Werbeunterlagen, Musteralben, für Ausstellungen, für Veröffentlichungen in der Fachpresse, für Fotowettbewerbe oder auf Messen verwenden. Dem Fotograf wird das Recht eingeräumt, eine Best-of-Auswahl der Bilddateien als Präsentation der eigenen Arbeit zu nutzen, um sie so potentiellen Kunden oder Geschäftspartnern in verschiedenen Formen zu zeigen. Andere Vereinbarungen bedürfen der Schriftform und müssen von beiden Vertragspartnern unterzeichnet werden.</p>
      </div>

      <div className="legalSection">
        <h2>6. Mitwirkungspflicht des Kunden</h2>
        <p>6.1. Der Kunde/ Auftraggeber hat dafür Sorge zu tragen, dass der Fotograf alle für die Ausführung des Auftrages erforderlichen Informationen bis spätestens 5 Tage vor Shooting beginn vorliegen. Dazu gehört die Datenschutzerklärung, die Allgemeinen Geschäftsbedingungen und eventuell den Hund betreffende und das Shooting beeinflussende Faktoren damit das Shooting problemfrei und zügig stattfinden kann und sich der Fotograf auf evtl. Einflüsse dem Hund oder Auftraggebers gegenüber einstellen kann.</p>
      </div>

      <div className="legalSection">
        <h2>7. Leistungsstörungen und Ausfallhonorar</h2>
        <p>7.1. Wird die für die Durchführung des Auftrages vorgesehene Zeit aus Gründen, die der Fotograf nicht zu vertreten hat, wesentlich überschritten, kann der Fotograf das Honorar entsprechend erhöhen. Die Erhöhung muss dem Auftraggeber verkündet werden, damit dieser die Wahl zur Annahme hat. Liegt es am Verzug durch den Auftraggeber (Unpünktlichkeit &lt; 30 Minuten Wartezeit für den Fotografen), so wird eine Pauschale von 50,00€ veranlasst.</p>
        <p>7.2. Liefertermine für die Bilddateien bzw. Fotoprodukte sind nur dann verbindlich, wenn sie ausdrücklich vom Fotografen bestätigt worden sind. Die Im Vertrag enthaltene Angabe des Lieferzeitraumes sind lediglich circa Angaben und nicht verbindlich.</p>
        <p>7.3. Stornierungen werden bis 4 Tage nach der Auswahl des Termins für das Fotoshooting in schriftlicher Form anerkannt. Wird der vereinbarte Termin bis 4 Tage vor dem Shootingtermin abgesagt, wird die Anzahlung i.H.v. 50% des Gesamtbetrags als Ausfallhonorar einbehalten. Geschieht die Stornierung ab 2 Tagen vor dem vereinbarten Termin des Shootings, muss der Auftraggeber den Paketpreis voll bezahlen. Es ist keine Rückerstattung mehr möglich. Für den Fotograf ist es nicht zumutbar den Termin aufgrund der Kurzfristigkeit anderweitig zu vergeben.</p>
        <p>7.4. Bei Krankheit, Trauerfall, plötzlichem Verenden des Tieres oder Umständen, für die weder Auftraggeber noch der Fotograf etwas können (Höheregewalt der Natur), kann der vereinbarte Termin verschoben werden. Es fallen hierbei keine weiteren Kosten an. Eine Erstattung der Anzahlung ist nicht möglich und wird nicht zurückbezahlt.</p>
      </div>

      <div className="legalSection">
        <h2>8. Datenschutz</h2>
        <p>8.1. Zum Geschäftsverkehr erforderliche personenbezogene Daten des Auftraggebers können gespeichert werden. Der Fotograf verpflichtet sich, alle im Rahmen des Auftrages bekannt gewordenen Informationen vertraulich zu behandeln. Sie haben das Recht jederzeit Ihre Daten einsehen zu können oder die Löschung dieser zu veranlassen.</p>
      </div>

      <div className="legalSection">
        <h2>9. Digitale Fotografie</h2>
        <p>9.1. Bei der Vervielfältigung der Fotoaufnahmen in digitaler Form, ist der Urheber stets zu vermerken.</p>
        <p>9.2. Für die Datenspeicherung werden USB-Sticks, Externe Festplatten oder CD-R oder Daten-DVD verwendet, für die nur innerhalb der Garantie des Herstellers als einwandfrei deklariert sind. Für Schäden, die durch das Übertragen von gelieferten Daten in einem Computer oder andere Medien entstehen, leistet der Fotograf keinen Ersatz.</p>
      </div>

      <div className="legalSection">
        <h2>10. Vertragsstrafe und Schadenersatz</h2>
        <p>10.1. Bei jeglicher unberechtigter Nutzung, Verwendung, Veränderung (wie z.B durch Filter von Instagram und Co.), Wiedergabe oder Weitergabe des Bildmaterials oder zu kommerziellen Zwecken ist für jeden Einzelfall eine Vertragsstrafe von mindestens 350,00€ pro Bild und Einzelfall zu zahlen. Dies gilt vorbehaltlich, es können weitergehende Schadensersatzansprüche entstehen.</p>
      </div>

      <div className="legalSection">
        <h2>11. Auslieferung, Nachbestellung, Fotoprodukte</h2>
        <p>11.1. Es besteht für den Fotografen keine grundsätzliche Verpflichtung zur Archivierung der Bilder oder Auswahlgalerien. Freigegebene Bilddateien können bis zu 24 Monate nach einem Shooting nachbestellt werden. Des Weiteren können Nachbestellungen, wo eine Auswahlgalerie vorliegt, ebenfalls im gleichen Zeitraum erfolgen.</p>
        <p>11.2. Die Kosten für die zusätzliche Nachbestellung wird vom Auftraggeber getragen und entsprechend Punkt 3 oder per Sondervereinbarung honoriert.</p>
        <p>11.3. Beanstandungen, gleich welcher Art, müssen schriftlich innerhalb von 7 Tagen nach Auslieferung der Bilder beim Fotografen eingegangen sein. Nach dieser Frist gelten die Bilder als vertragsgemäß und mängelfrei abgenommen.</p>
        <p>11.4. Bei der Auslieferung des Bildmaterials durch Versendung eventueller Fotoprodukte ist eine Haftung für den Versand ausgeschlossen.</p>
      </div>

      <div className="legalSection">
        <h2>12. Schlussbestimmungen</h2>
        <p>12.1. Es gilt das Recht der Bundesrepublik Deutschland als vereinbart, auch bei Lieferungen ins Ausland.</p>
        <p>12.2. Die etwaige Nichtwirksamkeit oder Unwirksamkeit einzelner Bestimmungen dieser AGB berührt die Gültigkeit der übrigen Bestimmungen nicht.</p>
        <p>12.3. Für den Fall, dass der Kunde keinen Gerichtsstand in Deutschland hat oder seinen Sitz oder gewöhnlichen Aufenthalt nach Vertragsabschluss ins Ausland verlegt, wird der Wohnsitz der Fotografin als Gerichtsstand vereinbart.</p>
        <p>12.4. Erfüllungsort und Gerichtsstand ist der Sitz des Fotografen DS-Capture Leipzig.</p>
      </div>
    </section>
  );
}

