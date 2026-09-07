/* Deutsche Hilfetexte. Getrennt von der Bedienung, weil Prosa nicht
 * satzweise uebersetzt werden kann: Deutsch und Englisch bauen ihre Saetze
 * anders, und Hervorhebungen sitzen an anderen Stellen. Deshalb zwei
 * vollstaendige Fassungen statt einer Woerterliste.
 *
 * Aufbau: erst der schnellste Weg zur ersten Karte, dann der Mechanismus,
 * dann ein Kapitel je Bereich (Ueben, Uebungsplan, Wortlisten, Statistik),
 * die Einstellungen, das Konto, zuletzt haeufige Fragen.
 *
 * Die Reihenfolge der Bereichskapitel folgt der Reiterleiste, nicht dem
 * Lernablauf. Ein Review schlug das Gegenteil vor -- Wortlisten zuerst,
 * weil die Schnellanleitung dorthin schicke. Das galt, solange der erste
 * Schritt eine eigene Liste war; jetzt ist er "unten auf Ueben tippen",
 * und damit faellt der Grund weg. Wer die App offen hat und nachschlaegt,
 * sucht das Kapitel zu dem Reiter, den er gerade sieht.
 *
 * Der Mechanismus steht VOR seinen Folgen (Kapitel 2). Vorher tauchte er
 * nur in der FAQ auf, als Antwort auf Beschwerden -- die Anleitung
 * verteidigte damit eine Entscheidung, die sie nie begruendet hatte.
 *
 * Die beiden Farbskalen stehen ausdruecklich nebeneinander (Kapitel 3):
 * fuenf Stufen je Wort, drei Farben je Liste. Sie werden sonst verwechselt,
 * weil sie weit auseinander eingefuehrt wurden.
 *
 * Latein steht NICHT drin, obwohl ein Review es als Luecke meldete. Wer
 * Latein lernt, sieht die Stammformen auf der ersten Karte, und die
 * Einstellung erklaert L2 und L3 an Ort und Stelle. Ein Absatz in der
 * Anleitung haette ihn alle anderen mitlesen lassen, fuer nichts.
 *
 * Jedes Kapitel ist gleich gebaut: ein Satz, worum es geht, dann die
 * Zeichnung, dann die Handgriffe in der Reihenfolge, in der man sie
 * braucht. Fett steht, was auf dem Bildschirm auch so heißt. */
import type { Kapitel, Tipp } from "./help.types";
/* Eine Zeichnung je Kapitel, direkt nach dem Einleitungssatz. Mehr waere
 * Schmuck: die Anleitung soll gelesen werden, nicht durchgeblaettert.
 * `KritzelAntwortarten` steht deshalb nicht mehr darin -- die vier
 * Antwortarten sind eine Aufzaehlung, keine Zeichnung. */
import { KritzelStart, KritzelAbstaende, KritzelBereiche, KritzelKarte,
         KritzelEndspurt, KritzelListe, KritzelLeiste,
         KritzelVergessen, KritzelFenster, KritzelTesteffekt } from "../ui/Kritzel";

export const TIPPS_DE: Tipp[] = [
  { h: "Lieber täglich kurz als selten lang",
    b: "10 bis 15 Minuten jeden Tag bringen mehr als eine Stunde am Wochenende. In den Pausen dazwischen festigt dein Gehirn die Wörter ganz von selbst." },
  { h: "Erst selbst überlegen, dann umdrehen",
    b: "Tippe deine Antwort wirklich ein, bevor du die Lösung ansiehst. Genau dieses Anstrengen beim Erinnern macht ein Wort fest, nicht das bloße Anschauen." },
  { h: "Ein Wort braucht viele Begegnungen",
    b: "Fast niemand kann ein Wort nach einmal Sehen. Dass dir ein Wort über mehrere Tage immer wieder begegnet, ist normal, und genau so soll es sein." },
  { h: "Mach deine Fehler zu Freunden",
    b: "Wörter, die du falsch hattest, sind die wertvollsten. In der Statistik sammelt „Hartnäckig“ genau diese Wörter zum gezielten Üben." },
  { h: "Wenig Neues, dafür richtig",
    b: "8 bis 12 neue Wörter pro Tag reichen völlig. Lieber wenige Wörter wirklich können als fünfzig nur halb." },
  { h: "Misch die Wörter",
    b: "Übe durcheinander statt eine Wortliste nach der anderen am Stück. Das fühlt sich schwerer an, trainiert dein Gedächtnis aber spürbar besser." },
  { h: "Sprich das Wort leise mit",
    b: "Lies das Wort und sprich es dabei lautlos mit. Je mehr Sinne mitmachen, desto besser bleibt es haften." },
  { h: "Lern das Wort im Zusammenhang",
    b: "Bau ein neues Wort in einen kleinen Satz oder ein Bild im Kopf ein. „The dog barks“ merkt man sich besser als „dog“ allein." },
  { h: "Übe in beide Richtungen",
    b: "Erst Englisch nach Deutsch, dann Deutsch nach Englisch. Ein Wort kannst du erst richtig, wenn es in beide Richtungen klappt. SmartVoc hat dafür sogar einen gemischten Zufallsmodus." },
  { h: "Schlaf macht das Lernen fertig",
    b: "Was du abends übst, festigt sich im Schlaf. Eine kurze Wiederholung vor dem Schlafengehen wirkt oft besonders gut." },
];

export const ANLEITUNG_DE: Kapitel[] = [
  {
    titel: "Sofort loslegen",
    text: (
      <>
        <p>Du musst nichts vorbereiten. Für jede Sprache, die eingeschaltet ist, liegen hundert Wörter bereit. Tipp unten auf <b>Üben</b>, wähle eine Liste, und die erste Karte steht da.</p>
        <KritzelStart titel="Von der Heftseite zur ersten Karte" />
        <p>Eigene Wörter kommen dazu, sobald du sie brauchst. Das dauert keine zwei Minuten:</p>
        <ol>
          <li>Unter <b>Wortlisten</b> auf <b>+ Neue Liste</b>, dann <b>Liste einfügen</b>. Die App gibt dir einen fertigen Auftrag zum Kopieren. Den fügst du in deine KI-App ein und hängst ein Foto deiner Heftseite dazu; was sie zurückgibt, kopierst du hierher, samt Beispielsätzen und Lautschrift.</li>
          <li>Steht ein Termin an, gib der Liste ein <b>Zieldatum</b>: den Tag, an dem die Wörter sitzen müssen. Ohne Termin geht es auch.</li>
          <li>Zurück auf <b>Üben</b>, die neue Liste wählen, los.</li>
        </ol>
        <p>Ab jetzt entscheidet die App, welches Wort wann wiederkommt. Warum, steht im nächsten Kapitel.</p>
      </>
    ),
  },
  {
    titel: "Was SmartVoc anders macht",
    text: (
      <>
        <p>Die meisten Vokabelprogramme lassen dich eine Liste durchgehen, bis du sie kannst. SmartVoc führt für jedes Wort einzeln Buch: wie lange es bei dir hält, wie schwer es dir fällt, und wann du kurz davor bist, es zu vergessen. Genau dann kommt es zurück.</p>
        <KritzelAbstaende titel="Jede richtige Antwort schiebt das Wort weiter nach hinten" />
        <p>Das hat zwei Folgen, die anfangs überraschen. Wörter, die sitzen, verschwinden für Wochen aus der Abfrage, dafür brauchst du keine Zeit mehr. Und Wörter, bei denen du gezögert hast, sind morgen schon wieder da. Beides ist der Grund, warum zehn Minuten am Tag mehr bringen als eine Stunde am Samstag.</p>
        <p>Diese Planung kannst du nicht überstimmen. Was du in der Hand hast: welche Wörter dazukommen, wie viele pro Tag, und wie streng die App prüft. Das steht weiter unten unter <b>Einstellungen, die sich lohnen</b>. Wie gerechnet wird, steht im Kapitel <b>Dahinter</b>.</p>
      </>
    ),
  },
  {
    titel: "SmartVoc im Überblick",
    text: (
      <>
        <p>Unten stehen vier Bereiche nebeneinander. Jeder beantwortet eine andere Frage.</p>
        <KritzelBereiche titel="Vier Bereiche, vier Fragen" />
        <ul>
          <li><b>Üben</b>: was soll ich jetzt tun? Hier wird gelernt.</li>
          <li><b>Übungsplan</b>: bin ich rechtzeitig fertig? Deine Termine und wie du dazu stehst.</li>
          <li><b>Wortlisten</b>: woher kommen meine Wörter? Anlegen, füllen, verwalten.</li>
          <li><b>Statistik</b>: wo stehe ich? Was sitzt, was wackelt, und ob es vorwärtsgeht.</li>
        </ul>
        <p>Oben rechts liegen zwei Knöpfe. Hinter dem Zahnrad stehen die <b>Einstellungen</b>, hinter dem Fragezeichen diese Anleitung, die <b>Lerntipps</b> und das Kapitel <b>Dahinter</b>.</p>
        <p><b>Die Farben bedeuten nicht überall dasselbe.</b> SmartVoc färbt an zwei Stellen, und die beiden Skalen messen Verschiedenes. Wer sie verwechselt, liest die App falsch.</p>
        <p>Die <b>fünf Stufen</b> gelten je Wort. Die Leiste liest sich von links nach rechts:</p>
        <ul>
          <li><b>sitzt</b>: hält länger als zwei Wochen und kommt nur noch selten zurück.</li>
          <li><b>fast</b>: hält bis zu zwei Wochen. Ausgeschrieben heißt die Stufe <b>sitzt fast</b>.</li>
          <li><b>wackelt</b>: hält weniger als drei Tage. Ausgeschrieben <b>wackelt noch</b>.</li>
          <li><b>neu</b>: erst ein- oder zweimal geübt.</li>
          <li><b>ungeübt</b>: noch nie abgefragt.</li>
        </ul>
        <p>Diese Leiste findest du überall gleich: unter der Karte, an jeder Liste und in der Statistik. Ein Tipp auf einen Eintrag der Legende öffnet die Wörter dahinter.</p>
        <p>Die <b>Ampel</b> gilt je Liste. Sie zählt nur, wie viele Wörter einer Liste schon auf der Stufe <b>sitzt</b> stehen: ab 95 Prozent gilt die Liste als <b>bereit</b>, ab 70 Prozent als <b>auf Kurs</b>, darunter als <b>im Rückstand</b>. Die Schwellen kannst du verstellen.</p>
      </>
    ),
  },
  {
    titel: "Bereich «Üben»",
    text: (
      <>
        <p>In der Zeile über der Karte wählst du, was abgefragt wird: die Sprache, die Richtung und eine oder mehrere Wortlisten, oder eine der vier <b>Smart Lists</b>, die die App selbst zusammenstellt. Die Auswahl darf Sprachen mischen.</p>
        <KritzelKarte titel="Vorne die Frage, hinten die Lösung" />
        <p>Vier <b>Antwortarten</b> stehen unter der Karte zur Wahl. Du kannst mitten in der Übung umschalten:</p>
        <ul>
          <li><b>Eintippen</b>: du schreibst die Antwort selbst. Am anstrengendsten, bringt am meisten. Im Zweifel diese.</li>
          <li><b>Multiple-Choice</b>: du wählst aus mehreren Möglichkeiten. Leichter, gut für den Anfang oder wenn du müde bist.</li>
          <li><b>Selbstkontrolle</b>: du überlegst, drehst um und beurteilst selbst. Am besten schreibst du die Lösung vorher auf ein Blatt.</li>
          <li><b>Nur durchblättern</b>: zum Überfliegen einer Liste. Zählt für nichts, weder Lernstand noch Statistik.</li>
        </ul>
        <p>Die <b>Richtung</b> ist ebenso umschaltbar: Fremdsprache zu Deutsch, umgekehrt, oder gemischt. Wechsle beides regelmäßig ab, sonst merkt sich dein Gedächtnis das Muster statt das Wort.</p>
        <p><b>Über und unter der Karte steht je ein Balken.</b> Sie messen Verschiedenes. Über der Karte steht der <b>Übungsfortschritt</b>: wie viel von dieser Runde erledigt ist. Jedes Wort braucht dafür eine bestimmte Zahl richtiger Antworten. Ein Fehler setzt seinen Zähler zurück, und der Balken geht ein Stück zurück.</p>
        <p>Unter der Karte steht der <b>Lernstand</b>: wie sich die Wörter dieser Auswahl auf die fünf Stufen verteilen. Der Fortschritt beginnt bei jeder Runde neu, der Lernstand bewegt sich über Wochen. Beim Durchblättern fehlen beide, weil dieser Modus nichts verändert.</p>
        <p><b>Wie deine Antwort bewertet wird.</b> Beim Eintippen vergleicht die App deine Antwort mit der Lösung und fällt eines von drei Urteilen: <b>richtig</b>, <b>fast richtig</b> oder <b>falsch</b>. Fast richtig ist keine Höflichkeit, es zählt anders als falsch. In der Statistik werden richtig und fast richtig zusammen als <b>Treffer</b> gezählt.</p>
        <ul>
          <li>Tippfehler werden erkannt, solange die Antwort der Lösung nahe genug kommt. Sie gelten je nach Ähnlichkeit als fast richtig.</li>
          <li>Akzente und Umlaute sind in der Voreinstellung nachsichtig. Auf streng gestellt zählt „grun“ statt „grün“ als Fehler.</li>
          <li>Der Artikel zählt in der Voreinstellung halb mit. Du kannst ihn freiwillig machen oder voll verlangen. Zählt er nicht, steht er gar nicht erst auf der Karte, dafür steht dort das Geschlecht.</li>
          <li>Groß- und Kleinschreibung zählt in der Voreinstellung. <b>ss</b> und <b>ß</b> gelten immer als gleich.</li>
        </ul>
        <p>Nach jeder Antwort zeigt die App, welche Zeichen fehlten, überflüssig waren oder abwichen. Wenn dich eine Bewertung ärgert, liegt der Hebel in den Einstellungen unter <b>Antwortprüfung</b>.</p>
        <p><b>Wann eine Runde zu Ende ist.</b> Jedes Wort der Auswahl hat in dieser Runde ein Ziel: eine Anzahl richtiger Antworten, die es braucht. Ein wackelndes Wort braucht drei, ein neues zwei, ein fast sitzendes oder fälliges eine. Sind alle Ziele erreicht, ist die Runde fertig. Deshalb siehst du mehr Karten als Wörter, und deshalb kostet ein Fehler etwas: Er setzt den Zähler dieses Wortes zurück.</p>
        <p>Wie groß eine Runde überhaupt wird, begrenzen zwei Zahlen:</p>
        <ul>
          <li>In <b>Heute dran</b> liegen höchstens dreißig Wörter, davon höchstens zehn ganz neue. Beide Zahlen stellst du selbst ein.</li>
          <li>Steht der Termin einer Liste in den nächsten drei Tagen, gelten diese Grenzen für ihre Wörter nicht. Kurz vor einem Termin wäre es unsinnig, Wörter zurückzuhalten.</li>
        </ul>
        <p>Nach vierzig gezeigten Karten fragt die App außerdem, ob du für heute aufhören willst. Weitermachen kannst du trotzdem.</p>
      </>
    ),
  },
  {
    titel: "Bereich «Übungsplan»",
    text: (
      <>
        <p>Der Übungsplan zeigt, wann welche Liste sitzen muss und wie weit du bist, als Kalender oder als Liste. Hier erscheinen nur Listen, denen du ein <b>Zieldatum</b> gegeben hast. Alle anderen werden ganz normal abgefragt, tauchen hier aber nicht auf.</p>
        <KritzelEndspurt titel="Je näher der Termin, desto enger die Wiederholungen" />
        <p><b>Das Zieldatum.</b> Gib einer Liste den Tag, an dem sie sitzen muss. Vergeben wird es unter <b>Wortlisten</b>, an der Liste selbst.</p>
        <p>Von da an rechnet die App rückwärts: Ab etwa drei Wochen vor dem Termin verlangt sie von diesen Wörtern mehr Sicherheit, wodurch sie öfter drankommen. In den letzten Tagen fällt für sie die Tagesgrenze weg. Nach dem Termin ist alles wieder normal.</p>
        <p>Übst du mehrere Listen zusammen, kommen die Wörter der Liste mit dem näheren Termin von selbst häufiger. Dafür musst du nichts einstellen.</p>
        <p>Die Farbe des Tages gibt an, wie bereit die Liste ist. Liegen mehrere Listen auf einem Tag, zeigt die Farbe die schwächste.</p>
        <p>Tipp einen Tag an: Dann siehst du, um welche Listen es geht, wie viele ihrer Wörter am Stichtag voraussichtlich sitzen werden, und du kannst von dort direkt üben.</p>
      </>
    ),
  },
  {
    titel: "Bereich «Wortlisten»",
    text: (
      <>
        <p>Alle deine Wörter liegen in Listen, und jedes Wort gehört zu genau einer Liste. Was eine Liste ist, bestimmst du: eine Heftseite, eine Lektion, der Stoff einer Prüfung.</p>
        <KritzelListe titel="Erst die Liste, dann ihre Wörter" />
        <p>Vier Wege führen hinein. Den richtigen zu wählen erspart dir die meiste Arbeit:</p>
        <ul>
          <li><b>Liste einfügen</b>: für eine ganze Heftseite. Mit dem KI-Prompt lässt du sie dir von deiner KI-App aus einem Foto erstellen.</li>
          <li><b>Einzelnes Wort eintippen</b>: für Nachträge.</li>
          <li><b>Geteilte Liste übernehmen</b>: wenn dir jemand einen Code oder Link geschickt hat.</li>
          <li><b>Tabelle einlesen</b>: Excel oder CSV, nur in der Webversion. Die leere Vorlage gibt es gleich daneben.</li>
        </ul>
        <p><b>Der Weg über die KI.</b> Er funktioniert mit jeder KI, die Bilder lesen kann. In der App auf <b>KI-Prompt kopieren</b> tippen, in deine KI-App wechseln, den Auftrag einfügen und ein Foto deiner Heftseite dazuhängen. Die Antwort kopierst du zurück ins große Feld und gehst auf <b>Weiter zum Prüfen</b>.</p>
        <p><b>Das Prüfen-Fenster.</b> Dort steht jedes Wort einzeln, mit allen Angaben. Schau kurz drüber und korrigiere, was schiefgelaufen ist. Am Schluss wählst du die Liste. Fotos werden gerne einmal falsch gelesen; hier fällt es auf.</p>
        <p><b>Listen und Wörter ändern.</b> Öffnest du eine Liste, siehst du zuerst die Liste selbst: Zieldatum, Lernstand und die Handgriffe. Die Wörter liegen eine Ebene tiefer unter <b>Wörter ansehen und bearbeiten</b>. Dort tippst du eine Zeile an und benutzt <b>Bearbeiten</b> oder <b>Löschen</b>; mehrere auf einmal gehen auch.</p>
        <p>Zwei Listen, die zusammengehören, lassen sich <b>zusammenführen</b>. Löschst du eine Liste, bleiben ihre Wörter erhalten und verlassen nur diese Liste.</p>
        <p><b>Exportieren und Teilen.</b> Über <b>Exportieren</b> bekommst du deine Wörter als Text oder als Excel-Tabelle zurück, im selben Format, das die App auch wieder einliest, ohne Konto. Über <b>Teilen</b> schickst du eine Liste an jemanden; die andere Person bekommt eine eigene Kopie, euer Lernstand bleibt getrennt. Teilen braucht ein Konto.</p>
        <p><b>Die vier Smart Lists.</b> Neben deinen eigenen Listen stehen vier Listen, die die App täglich selbst zusammenstellt, quer über alles, was du hast:</p>
        <ul>
          <li><b>Heute dran</b>: deine Tagesportion aus Fälligem und Neuem.</li>
          <li><b>Fällige Wörter</b>: alles, was jetzt zur Wiederholung ansteht.</li>
          <li><b>Wackeln noch</b>: genau die Wörter auf der Stufe <b>wackelt noch</b>.</li>
          <li><b>Bald fällig</b>: sitzt noch, wäre aber bald wieder dran.</li>
        </ul>
        <p>Ansehen und üben ja, ändern nein. Darunter steht außerdem <b>Alle Wörter</b>. Das ist keine Smart List, sondern dein ganzer Bestand.</p>
      </>
    ),
  },
  {
    titel: "Bereich «Statistik»",
    text: (
      <>
        <p>Die Statistik geht ins Detail. Oben wählst du, ob du alle Sprachen ansiehst oder eine, alle Wörter oder eine bestimmte Liste, und ob es um die letzten 7, 30 oder 90 Tage geht.</p>
        <KritzelLeiste titel="Dieselben fünf Stufen überall" />
        <ul>
          <li><b>Bestand</b>: wie sich deine Wörter auf die fünf Stufen verteilen.</li>
          <li><b>Fortschritt</b>: wie viele Wörter dazugekommen sind, wie viel du geübt hast, an wie vielen Tagen, und wie viele Wörter neu die Stufe <b>sitzt</b> erreicht haben.</li>
          <li><b>Auswertungen</b>: wie deine Antworten ausgehen, woran sie scheitern, wie schnell ein Wort bei dir sitzt, wie lange deine Wörter halten, wie lang deine Sitzungen sind und zu welcher Tageszeit du am besten triffst.</li>
          <li><b>Stolpersteine</b> und <b>Hartnäckig</b>: die Wörter, die dir immer wieder entwischen. Von dort kannst du sie direkt üben.</li>
        </ul>
        <p>Auswertungen, für die zu wenige Daten da sind, zeigt die App gar nicht erst an. Am Anfang ist die Seite deshalb ziemlich leer. Das gibt sich.</p>
      </>
    ),
  },
  {
    titel: "Einstellungen, die sich lohnen",
    text: (
      <>
        <p>Die Voreinstellungen folgen der Lernforschung und passen für die meisten. Drei Schrauben lohnen trotzdem einen Blick:</p>
        <ul>
          <li><b>Lernintensität</b>: wie sicher du ein Wort können sollst, wenn es wiederkommt. Intensiver heißt: häufiger üben, dafür sitzt mehr. Lockerer heißt: weniger Karten, dafür rutscht mehr weg. Ein Richtig gibt es nicht, nur einen Tausch.</li>
          <li><b>Neue Wörter pro Tag</b>: dein einziger Hebel auf die Menge. Weniger neue Wörter heißt weniger Rückstau, nicht langsameres Lernen.</li>
          <li><b>Antwortprüfung</b>: wie streng Akzente, Artikel und Groß- und Kleinschreibung bewertet werden.</li>
        </ul>
        <p>Dazu kommen Kleinigkeiten, die den Alltag angenehmer machen: was auf der Karte zu sehen ist (Lautschrift, Formen, Beispielsätze), womit die App aufmacht, Farbschema und Kartenschrift. Alles lässt sich einzeln zurücksetzen; was du verstellt hast, ist markiert.</p>
        <p>Unter <b>Erweitert</b> kannst du dem Modell beim Rechnen zusehen. Nötig ist das nie.</p>
      </>
    ),
  },
  {
    titel: "Mit oder ohne Konto",
    text: (
      <>
        <p>Die App läuft vollständig ohne Konto und vollständig ohne Netzverbindung. Ohne Anmeldung liegt alles, was du einträgst, auf diesem Gerät, und nur dort.</p>
        <p>Meldest du dich an, kommt dreierlei dazu: derselbe Stand auf allen deinen Geräten, Listen <b>teilen</b>, und deine Wörter überleben, wenn dem Gerät etwas zustößt. Anmelden kannst du dich jederzeit später und deine bisherigen Listen dabei übernehmen.</p>
        <p>Dein Konto löschst du in den Einstellungen unter <b>Konto &amp; Daten</b>. Damit verschwinden auch die Daten auf dem Server. Das lässt sich nicht rückgängig machen.</p>
      </>
    ),
  },
  {
    titel: "Häufige Fragen",
    text: (
      <>
        <p className="help-frage"><b>Warum kommt dasselbe Wort schon wieder?</b></p>
        <p>Weil du zuletzt gezögert hast oder danebenlagst. Die App bringt ein Wort zurück, kurz bevor du es vergisst. Bei einem wackeligen Wort ist das morgen.</p>
        <p className="help-frage"><b>Warum fragt die App Wörter ab, die ich längst kann?</b></p>
        <p>Weil auch sicher sitzende Wörter alle paar Wochen eine Auffrischung brauchen; sonst gehen sie über die Monate doch verloren. Es sind wenige Karten, und sie kosten kaum Zeit.</p>
        <p className="help-frage"><b>Ich war eine Woche weg. Wie schlimm ist es?</b></p>
        <p>Nicht schlimm. Die fälligen Wörter sammeln sich an, aber <b>Heute dran</b> gibt dir nur die Tagesportion. Du bekommst nicht den ganzen Rückstand auf einmal.</p>
        <p className="help-frage"><b>Ein Wort ist falsch geschrieben. Wie ändere ich es?</b></p>
        <p>Liste öffnen, <b>Wörter ansehen und bearbeiten</b>, Zeile antippen, <b>Bearbeiten</b>. Dort lässt sich alles ändern oder nachtragen: Wort, Beispielsatz, Lautschrift, Formen und Geschlecht.</p>
        <p className="help-frage"><b>Mein Lernstand stimmt nicht mehr. Kann ich neu anfangen?</b></p>
        <p>In den Einstellungen unter <b>Konto &amp; Daten</b> lässt sich der Fortschritt zurücksetzen: Punkte, Verlauf und Tagesserie, in allen Sprachen. Deine Wörter bleiben. Rückgängig machen lässt es sich nicht.</p>
        <p className="help-frage"><b>Ich möchte weg von SmartVoc. Bekomme ich meine Wörter mit?</b></p>
        <p>Ja. <b>Exportieren</b> gibt dir jede Liste als Text oder als Excel-Tabelle heraus, ohne Konto und ohne Umweg.</p>
      </>
    ),
  },
];

export const THEORIE_LEAD_DE =
  "SmartVoc rät nicht, wann ein Wort wiederkommt. Es rechnet es aus, mit einem Modell, an dem seit über hundert Jahren geforscht wird. Wer wissen will, warum ein Wort erst in drei Wochen wieder auftaucht, findet die Antwort hier.";

export const THEORIE_DE: Kapitel[] = [
  {
    titel: "Vergessen ist kein Fehler",
    text: (
      <>
        <p>Hermann Ebbinghaus hat sich Ende des 19. Jahrhunderts selbst sinnlose Silben beigebracht und gemessen, wie viel davon nach einer Stunde, einem Tag, einer Woche noch da war. Heraus kam die <b>Vergessenskurve</b>: Frisch Gelerntes fällt zuerst steil ab und dann immer flacher.</p>
        <KritzelVergessen titel="Jede Wiederholung macht die Kurve flacher" />
        <p>Das Entscheidende ist nicht der Verlust, sondern was danach passiert. Nach jeder Wiederholung fällt die Kurve flacher ab als vorher. Das Wort hält länger.</p>
        <p>Vergessen ist also kein Versagen, sondern der Normalfall. Und der Hebel, an dem man ansetzen kann.</p>
      </>
    ),
  },
  {
    titel: "Der beste Zeitpunkt ist kurz vor dem Vergessen",
    text: (
      <>
        <p>Wiederholst du zu früh, ist das Wort noch präsent und die Wiederholung bringt wenig. Wiederholst du zu spät, ist es weg und du lernst es neu.</p>
        <KritzelFenster titel="Dazwischen liegt das Fenster, das die App sucht" />
        <p>Dazwischen liegt ein Fenster, in dem eine Wiederholung am meisten bewirkt: wenn das Erinnern gerade noch gelingt, aber Anstrengung kostet. Man nennt das <b>verteiltes Lernen</b>, und der Effekt gehört zu den am besten belegten der Lernpsychologie.</p>
        <p>Genau dieses Fenster sucht die App für jedes einzelne Wort. Deshalb kommt ein Wort, das du sicher kannst, erst in drei Wochen wieder, und eines, bei dem du gezögert hast, schon morgen.</p>
      </>
    ),
  },
  {
    titel: "Abrufen ist stärker als Nachlesen",
    text: (
      <>
        <p>Sich an etwas zu <b>erinnern</b> festigt stärker, als dasselbe noch einmal zu <b>lesen</b>. Der Fachbegriff ist <b>Testeffekt</b>.</p>
        <KritzelTesteffekt titel="Fünfmal lesen bringt weniger als viermal abfragen" />
        <p>Wer eine Vokabelliste fünfmal durchliest, hat weniger davon als wer sie einmal liest und sich viermal selbst abfragt. Obwohl sich das Durchlesen deutlich sicherer anfühlt.</p>
        <p>Deshalb ist <b>Eintippen</b> die empfohlene Antwortart, und deshalb ist <b>Nur durchblättern</b> ausdrücklich als „zählt nicht“ gekennzeichnet. Und deshalb lohnt es sich, vor dem Umdrehen wirklich zu überlegen, auch wenn es unbequem ist.</p>
      </>
    ),
  },
  {
    titel: "Was die App über jedes Wort weiß",
    text: (
      <>
        <p>Im Hintergrund läuft <b>FSRS</b>, ein modernes Gedächtnismodell. Es hält für jedes Wort drei Zahlen fest:</p>
        <ul>
          <li><b>Wie lange es hält.</b> Nach jeder richtigen Antwort wächst dieser Wert. Das ist die flacher werdende Kurve von oben.</li>
          <li><b>Wie zäh es ist.</b> Manche Wörter sind störrisch, egal wie oft man sie übt. Die kommen häufiger zurück und werden als „hartnäckig“ gekennzeichnet.</li>
          <li><b>Wie sicher du es jetzt noch kannst.</b> Sinkt dieser Wert unter dein Ziel, ist das Wort fällig.</li>
        </ul>
        <p>Dieses Ziel kannst du in den Einstellungen verschieben. Ein höheres Ziel heißt: häufiger üben, dafür sitzt mehr. Ein niedrigeres: weniger Karten pro Tag, dafür vergisst du mehr. Es gibt hier kein Richtig, nur einen Tausch, den du selbst machst.</p>
        <p>Was die App <b>nicht</b> tut: sie passt das Modell nicht an dich persönlich an und zeichnet dafür auch nichts auf. Die Zahlen des Modells sind für alle gleich.</p>
      </>
    ),
  },
  {
    titel: "Warum es vor einer Prüfung anders läuft",
    text: (
      <>
        <p>Setzt du einer Wortliste ein Zieldatum, hebt die App das Ziel für diese Wörter an, je näher der Termin rückt.</p>
        <p>Das ist keine zweite Rechnung, sondern dieselbe mit einem strengeren Ziel. Ein höheres Behaltensziel bedeutet kürzere Abstände, also kommen die Wörter öfter. Nach dem Termin fällt alles auf dein normales Ziel zurück.</p>
        <p>In den letzten Tagen vor dem Termin hebt die App außerdem die Tagesgrenze für diese Wörter auf. Es hilft niemandem, wenn ausgerechnet die Prüfungswörter an der Obergrenze hängen bleiben.</p>
      </>
    ),
  },
  {
    titel: "Warum sich Lernen anstrengend anfühlen darf",
    text: (
      <>
        <p>Die Lernforschung kennt einen Begriff, der zuerst wie ein Widerspruch klingt: <b>wünschenswerte Erschwernisse</b>. Gemeint sind Hürden, die das Üben im Moment mühsamer machen und gerade deshalb mehr bringen.</p>
        <p>Verteiltes Üben ist eine davon. Selbst abrufen statt nachlesen ist die zweite. Die dritte ist <b>Mischen</b>: Wörter durcheinander üben statt eine Liste nach der anderen am Stück.</p>
        <p>Alle drei haben denselben Haken. Sie fühlen sich schlechter an, als sie sind. Wer eine Liste fünfmal am Stück durchgeht, erlebt sich als sicher und ist es eine Woche später nicht. Wer gemischt und verteilt übt, macht unterwegs mehr Fehler und behält am Ende mehr.</p>
        <p>Deshalb ist das Gefühl beim Üben ein schlechter Ratgeber, und deshalb nimmt die App dir die Reihenfolge ab.</p>
      </>
    ),
  },
  {
    titel: "Was die Zahlen bedeuten, die du siehst",
    text: (
      <>
        <p>Der <b>Übungsfortschritt</b> über der Karte gilt nur für die laufende Runde: wie viel von dem, was du dir für jetzt vorgenommen hast, erledigt ist. Er beginnt bei jeder Runde neu.</p>
        <p>Der <b>Beherrschungsstand</b> ist etwas anderes. Er zeigt, wie sich alle Wörter dieser Übung auf die fünf Stufen verteilen, verändert sich langsam über Wochen, und ist dieselbe Zahl, die im Übungsplan als Ampel und in der Statistik als Leiste auftaucht.</p>
        <p>Es ist überall dieselbe Rechnung: der Anteil der Wörter, die sitzen oder fast sitzen.</p>
      </>
    ),
  },
  {
    titel: "Was du selbst in der Hand hast",
    text: (
      <>
        <ul>
          <li><b>Regelmäßigkeit.</b> Zehn Minuten täglich schlagen eine Stunde am Samstag, weil das Modell auf Abstände baut und nicht auf Menge.</li>
          <li><b>Ehrlichkeit.</b> Bei der Selbstkontrolle bringt Schummeln nur dich selbst um die Wiederholung.</li>
          <li><b>Wenig Neues.</b> Acht bis zwölf neue Wörter am Tag reichen. Jedes neue Wort erzeugt künftige Wiederholungen.</li>
        </ul>
      </>
    ),
  },
  {
    titel: "Zum Weiterlesen",
    text: (
      <ul className="help-links">
        <li><a href="https://de.wikipedia.org/wiki/Vergessenskurve" target="_blank" rel="noreferrer">Vergessenskurve (Wikipedia)</a>: Ebbinghaus’ Messung und was daraus folgt</li>
        <li><a href="https://de.wikipedia.org/wiki/Verteiltes_Lernen" target="_blank" rel="noreferrer">Verteiltes Lernen (Wikipedia)</a>: warum Abstände wirken</li>
        <li><a href="https://en.wikipedia.org/wiki/Testing_effect" target="_blank" rel="noreferrer">Testing effect (englisch)</a>: Abrufen schlägt Nachlesen</li>
        <li><a href="https://github.com/open-spaced-repetition/fsrs4anki/wiki" target="_blank" rel="noreferrer">FSRS (englisch)</a>: das Modell, mit dem diese App rechnet</li>
      </ul>
    ),
  },
];
