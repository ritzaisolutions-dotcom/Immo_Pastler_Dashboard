import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Datenschutz — Internes Dashboard" />

      <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">Verantwortlicher</h2>
          </CardHeader>
          <CardBody>
            <p>
              Immobilienverwaltung Pastler UG (haftungsbeschränkt)
              <br />
              hausverwaltung@pastler.com · 0261 1349 4710
              <br />
              <a
                href="https://pastler.com/datenschutzhinweise/"
                className="text-navy underline hover:text-gold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Datenschutzhinweise der öffentlichen Website
              </a>
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">
              Zweck dieses Systems
            </h2>
          </CardHeader>
          <CardBody>
            <p>
              Das interne Dashboard dient der operativen Immobilienverwaltung:
              Mieter- und Objektdaten, To-Dos aus der E-Mail-Bearbeitung und
              Statusübersichten für Mitarbeiter und berechtigte Eigentümer.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">
              Verarbeitete Daten
            </h2>
          </CardHeader>
          <CardBody>
            <ul className="list-inside list-disc space-y-1">
              <li>Mieter: Name, E-Mail, Telefon, Einheit, Vertragsdaten</li>
              <li>Eigentümer: Name, E-Mail, Objektdaten</li>
              <li>
                E-Mails: Metadaten und Inhalt werden serverseitig verarbeitet;
                Volltext ist im Dashboard nicht sichtbar
              </li>
              <li>
                To-Dos: Titel für alle; Kurzbeschreibung nur für Mitarbeiter
                (Eigentümer sehen keine E-Mail-Extrakte)
              </li>
              <li>
                Partner: Firmendaten, Gewerk, Kontakt — nur für Mitarbeiter
              </li>
              <li>
                Partner-E-Mail-Entwürfe: werden automatisch erzeugt, aber
                erst nach manueller Prüfung durch Mitarbeiter versendet
              </li>
              <li>Anmeldedaten: Supabase Auth (Session-Cookie)</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">Speicherdauer</h2>
          </CardHeader>
          <CardBody>
            <ul className="list-inside list-disc space-y-1">
              <li>Stammdaten: Dauer der Verwaltung + gesetzliche Aufbewahrung</li>
              <li>E-Mail-Volltext: maximal 90 Tage, danach automatische Löschung</li>
              <li>E-Mail-Metadaten: anonymisiert nach 180 Tagen, gelöscht nach 365 Tagen</li>
              <li>Erledigte Todo-Beschreibungen: gelöscht nach 365 Tagen</li>
              <li>Session: bis Abmeldung bzw. Ablauf der Auth-Session</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">
              Auftragsverarbeiter
            </h2>
          </CardHeader>
          <CardBody>
            <p>
              Supabase (Frankfurt), Vercel (Hosting), Mistral (EU, E-Mail-Analyse),
              n8n (Workflow-Automatisierung). Einzelheiten im internen
              Verarbeitungsverzeichnis.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">Ihre Rechte</h2>
          </CardHeader>
          <CardBody>
            <p>
              Betroffene Personen haben Rechte auf Auskunft, Berichtigung,
              Löschung, Einschränkung und Widerspruch gemäß DSGVO. Anfragen
              richten Sie an hausverwaltung@pastler.com.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-medium text-text-primary">Cookies</h2>
          </CardHeader>
          <CardBody>
            <p>
              Es werden ausschließlich technisch notwendige Session-Cookies für
              die Anmeldung verwendet. Es findet kein Marketing-Tracking statt.
            </p>
          </CardBody>
        </Card>

        <p className="text-xs text-text-hint">
          Dokumentation: Verarbeitungsverzeichnis, TOMs und Audit in{" "}
          <code className="text-text-secondary">docs/</code> im Projekt-Repository.
        </p>
      </div>
    </div>
  );
}
