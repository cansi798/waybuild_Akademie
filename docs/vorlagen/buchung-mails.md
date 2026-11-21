# E-Mail-Vorlagen Buchung (Stand 21.11.2026, ENTWURF – vor Livegang anwaltlich prüfen)

Ablauf (Teilnahmebedingungen Nr. 2, Website `/teilnahmebedingungen/#vertragsschluss`):

1. **Buchungsanfrage** über das Formular („Unverbindlich anfragen“) → automatische Eingangsbestätigung (`public/api/anmeldung.php`). Kein Vertrag.
2. **Vorlage A – Buchungsangebot** (diese Datei): schickt das Team **von Hand** aus dem Postfach `anmeldung@` an die Ansprechperson. Enthält alle Pflichtinformationen (Art. 246a § 1 EGBGB) auf einem dauerhaften Datenträger.
3. **Zusage** der Person per Antwort-Mail (= ihr Angebot; bis zu unserer Bestätigung frei zurückziehbar).
4. **Vorlage B – Buchungsbestätigung** (= unsere Annahme, Vertragsschluss; zugleich Vertragsbestätigung nach § 312f Abs. 2 BGB). Danach Rechnung.

Warum von Hand und einzeln: Der Vertrag soll ausschließlich durch individuelle Kommunikation zustande kommen (§ 312j Abs. 5 BGB) –
dann braucht es keine Schaltfläche „zahlungspflichtig bestellen“. Ein automatischer Versand von Vorlage A oder B würde diese
Begründung schwächen. Grauzone, Anwalt prüft (offene Frage im Prüfbericht).

Platzhalter in `{{…}}` vor dem Versand ersetzen. Anhänge immer als PDF mit ASCII-sicherem Dateinamen und im Text nennen.

---

## Vorlage A – Buchungsangebot

**Betreff:** Dein Buchungsangebot: {{Kurs}} ab {{Startdatum}} ({{Vorgangsnummer}})

> Hallo {{Vorname}},
>
> danke für deine Anfrage. Für dich ist ein Platz frei – hier ist unser Buchungsangebot.
>
> **Kurs:** {{Kurs}}
> **Termine:** {{Startdatum}} bis {{Enddatum}}, jeweils {{Wochentage}}, {{Uhrzeit, z. B. 17:00–20:00 Uhr}}, live online über unsere eigene Videokonferenz (Jitsi Meet, Anmeldung über unsere Nextcloud, keine Aufzeichnung)
> **Umfang:** {{UE}} Unterrichtseinheiten
> **Teilnehmende:** {{Anzahl}} ({{Namen}})
> **Endpreis:** {{Betrag}} € – alles inklusive (Unterlagen, Zugang zum Live-Unterricht); {{bei Gruppenrabatt: „darin 10 % Gruppenrabatt“}}
> **Zahlung:** per Rechnung nach der Buchungsbestätigung, fällig 14 Tage nach Erhalt, spätestens vor Kursbeginn. Keine Online-Zahlung. Keine Ratenzahlung.
> {{bei Lehrgängen in Abschnitten: „**Abschnitt:** {{Nr.}} von {{Anzahl}} ({{Abende}} Abende, {{Startdatum}} bis {{Enddatum}}) – dieses Angebot gilt nur für diesen Abschnitt; jeden weiteren Abschnitt buchst und bezahlst du einzeln.“}}
> **Rechnung an:** {{Person/Firma}}
> **Prüfungsgebühr der IHK:** nicht enthalten.
>
> Es gelten unsere Teilnahmebedingungen (Fassung {{Stand}}). Teilnahmebedingungen, Widerrufsbelehrung und
> Muster-Widerrufsformular findest du im Anhang (`Teilnahmebedingungen.pdf`, `Widerrufsbelehrung-und-Formular.pdf`) und unter
> https://waybuild-akademie.de/teilnahmebedingungen/ und https://waybuild-akademie.de/widerruf/.
>
> **So buchst du verbindlich:** Antworte auf diese E-Mail mit
> „Ich buche verbindlich {{Kurs}} ab {{Startdatum}} zum Endpreis von {{Betrag}} €.“
> Verbindlich wird die Buchung erst mit unserer Buchungsbestätigung per E-Mail. Bis dahin kannst du deine Zusage jederzeit formlos zurückziehen.
>
> {{NUR wenn Kursstart weniger als 15 Tage nach unserer voraussichtlichen Bestätigung liegt – Baustein „Beginn vor Ablauf der Widerrufsfrist“:}}
> Dein Kurs beginnt innerhalb der 14-tägigen Widerrufsfrist. Damit wir dich aufnehmen können, ergänze bitte in deiner Antwort:
> „Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist mit dem Unterricht beginnt. Mir ist bekannt, dass ich bei
> einem Widerruf Wertersatz für den bis dahin erbrachten Unterricht schulde und dass mein Widerrufsrecht mit vollständiger
> Vertragserfüllung erlischt.“
>
> {{NUR bei Minderjährigen:}} Bitte schick uns mit deiner Zusage die Einwilligung deiner Eltern (z. B. eine kurze E-Mail oder ein Foto der unterschriebenen Erklärung).
>
> Viele Grüße
> {{Name}}, waybuild Akademie
>
> --
> waybuild Akademie – ein Angebot der Waybuild UG (haftungsbeschränkt)
> Kuno-Liesenberg-Kehre 32a, 22844 Norderstedt · Telefon {{Telefon}} · info@waybuild-akademie.de
> Sitz: Norderstedt · Registergericht: Amtsgericht Kiel, HRB 29883 KI · Geschäftsführer: Can Siebert

Pflichtinhalte, die Vorlage A abdeckt (Art. 246a § 1 Abs. 1 und 2 EGBGB): wesentliche Eigenschaften (Nr. 1), Identität und
Anschrift (Nr. 2), Telefon und E-Mail (Nr. 3), Gesamtpreis (Nr. 5), Zahlungs- und Leistungsbedingungen, Termin (Nr. 10),
Laufzeit (Nr. 14), Widerrufsbelehrung + Muster-Formular + Hinweis Online-Widerruf (Abs. 2 Nr. 1), Wertersatz (Abs. 2 Nr. 3),
vorzeitiges Erlöschen (Abs. 3 Nr. 2). **Telefonnummer fehlt noch** – ohne sie ist die Information unvollständig.

---

## Vorlage B – Buchungsbestätigung (Annahme)

**Betreff:** Buchungsbestätigung: {{Kurs}} ab {{Startdatum}} ({{Vorgangsnummer}})

> Hallo {{Vorname}},
>
> wir nehmen deine Zusage vom {{Datum der Zusage}} an. **Deine Buchung ist damit verbindlich.**
>
> **Vertragsinhalt**
> Kurs: {{Kurs}} · Termine: {{Startdatum}} bis {{Enddatum}}, {{Wochentage}}, {{Uhrzeit}}, live online
> Umfang: {{UE}} Unterrichtseinheiten · Teilnehmende: {{Namen}}
> Endpreis: {{Betrag}} € – alles inklusive · Zahlung per Rechnung (folgt gesondert), fällig 14 Tage nach Erhalt, spätestens vor Kursbeginn
> {{falls verlangt: „Du hast ausdrücklich verlangt, dass wir vor Ablauf der Widerrufsfrist beginnen; dir ist bekannt, dass du bei einem Widerruf Wertersatz schuldest und dein Widerrufsrecht mit vollständiger Vertragserfüllung erlischt.“}}
>
> Es gelten die Teilnahmebedingungen in der Fassung vom {{Stand}} (Anhang `Teilnahmebedingungen.pdf`).
>
> **Widerrufsrecht:** Als Verbraucher kannst du diesen Vertrag binnen 14 Tagen ab dem Tag des Vertragsabschlusses (heute) ohne Angabe von Gründen widerrufen.
> Die vollständige Widerrufsbelehrung und das Muster-Widerrufsformular liegen bei (`Widerrufsbelehrung-und-Formular.pdf`).
> Online widerrufen: https://waybuild-akademie.de/widerruf/#widerrufsformular („Vertrag widerrufen“).
>
> Den Zugang zum Live-Unterricht bekommt jede teilnehmende Person vor Kursstart per E-Mail: einen persönlichen Nextcloud-Zugang und den Link zum Live-Raum (https://nextcloud.waybuild.de/meeting/{{raum}}). Der Unterricht läuft über unsere eigene Videokonferenz (Jitsi Meet) im Browser.
>
> Viele Grüße
> {{Name}}, waybuild Akademie
>
> --
> (Firmenzeilen wie in Vorlage A)

Anhänge zu A und B: `Teilnahmebedingungen.pdf` und `Widerrufsbelehrung-und-Formular.pdf` – jeweils als Druck (PDF) der
Seiten `/teilnahmebedingungen/` und `/widerruf/` in der aktuellen Fassung (die Druckansicht blendet Menü und Fuß aus).
Die verschickte Fassung je Buchung im Postfach aufbewahren (Nachweis, welche AGB-Fassung gilt).
