#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Schreibt das Fehlerbuch aus einer JSON-Datei.

    python3 texte/bau-fehlerbuch.py eintraege.json

Warum Python und nicht wie die uebrigen bau-*.cjs mit Node: die Bibliothek
`xlsx` im Projekt schreibt keine Datenpruefung (Klapplisten) und keine
Formate. Beides ist hier der halbe Nutzen, also wird die Datei direkt als
OOXML geschrieben; das Zip dafuer kann Python von Haus aus. Gelesen wird
mit `texte/fehlerbuch-lesen.cjs` -- lesen kann `xlsx` alles, was Excel je
gespeichert hat.

Die bestehende Mappe wird vorher zur Seite gelegt (.bak mit Zeitstempel),
damit ein Fehllauf keine Eintraege kostet.
"""
import os, sys, io, json, shutil, zipfile, datetime

ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                    "SmartVoc-Fehler-und-Aenderungen.xlsx")
ZIEL = os.path.normpath(ZIEL)
if os.path.exists(ZIEL):
    sicherung = ZIEL + "." + datetime.datetime.now().strftime("%Y%m%d-%H%M%S") + ".bak"
    shutil.copy2(ZIEL, sicherung)
    print("Sicherung:", os.path.basename(sicherung))

ZEILEN_GESAMT = 200          # so weit reichen Formate und Klapplisten

def x(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))

def tage(datum):             # Excel zaehlt Tage ab dem 30.12.1899
    return (datetime.date.fromisoformat(datum) - datetime.date(1899, 12, 30)).days

# ----------------------------------------------------------------- Spalten
SPALTEN = [
    ("ID",                  8, "id"),
    ("Erfasst am",         12, "datum"),
    ("Von",                14, "kurz"),
    ("Typ",                18, "kurz"),
    ("Bereich",            22, "kurz"),
    ("Titel",              44, "text"),
    ("Was passiert",       64, "text"),
    ("Was erwartet wäre",  46, "text"),
    ("Gerät und Build",    24, "text"),
    ("Schwere",            12, "kurz"),
    ("Priorität",          15, "kurz"),
    ("Status",             14, "kurz"),
    ("Behoben in Build",   17, "kurz"),
    ("Notiz",              46, "text"),
]
def sp(i):                   # 0 -> A
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s

# ------------------------------------------------------------------ Listen
LISTEN = [
    ("Typ",       ["Fehler", "Änderungswunsch", "Aufgabe", "Frage", "Idee",
                   "Technische Schuld"]),
    ("Bereich",   ["Üben", "Übungsplan", "Wortlisten", "Statistik",
                   "Einstellungen", "Konto und Sync", "Teilen",
                   "Import und Export", "Hilfe und Texte",
                   "Store und Auslieferung", "Plan und Kauf", "Web-Fassung",
                   "Sonstiges"]),
    ("Schwere",   ["Blocker", "Schwer", "Mittel", "Klein", "Kosmetik"]),
    ("Prioritaet",["Sofort", "Vor Release", "Nach Release", "Zurückgestellt"]),
    ("Status",    ["Neu", "Bestätigt", "In Arbeit", "Behoben", "Geprüft",
                   "Zurückgestellt", "Kein Fehler"]),
    ("Von",       ["Martin", "Lilly-Anne", "Beta-Tester", "Apple-Prüfung",
                   "Claude"]),
]
# Spalte im Fehlerbuch -> Name der Liste
PRUEFUNG = {"C": "Von", "D": "Typ", "E": "Bereich", "J": "Schwere",
            "K": "Prioritaet", "L": "Status"}

HINWEIS = [
 ("Wie dieses Buch benutzt wird", "titel"),
 ("", "text"),
 ("Eine Zeile ist eine Sache. Zwei Beobachtungen, die verschiedene Ursachen haben "
  "koennen, sind zwei Zeilen -- auch wenn sie am selben Bildschirm auftreten.", "text"),
 ("Die ID vergibt sich selbst, sobald in der Spalte «Titel» etwas steht.", "text"),
 ("", "text"),
 ("«Was passiert» ist die Beobachtung, nicht die Vermutung. Am meisten wert sind die "
  "Schritte, mit denen man es wieder herbeifuehrt: 1. Ueben oeffnen  2. «brotther» "
  "eintippen  3. Enter. Ohne sie sucht man spaeter das Falsche.", "text"),
 ("", "text"),
 ("Schwere heisst: was es fuer den Benutzer bedeutet.", "titel"),
 ("Blocker -- die App ist unbrauchbar oder Daten gehen verloren.", "text"),
 ("Schwer -- eine wichtige Funktion geht nicht, es gibt keinen Umweg.", "text"),
 ("Mittel -- geht nicht, aber es gibt einen Umweg.", "text"),
 ("Klein -- stoert, hindert aber niemanden.", "text"),
 ("Kosmetik -- sieht schief aus, funktioniert.", "text"),
 ("", "text"),
 ("Prioritaet heisst: wann wir es anfassen. Das ist eine andere Frage. Ein "
  "kosmetischer Fehler auf dem ersten Bildschirm kann «Vor Release» sein, ein "
  "schwerer Fehler in einer Ecke, die niemand aufsucht, «Nach Release».", "text"),
 ("", "text"),
 ("Status laeuft: Neu -> Bestaetigt (nachgestellt) -> In Arbeit -> Behoben "
  "(im Code) -> Geprueft (im Build nachgesehen). «Kein Fehler» braucht immer "
  "eine Notiz, warum.", "text"),
 ("", "text"),
 ("«Behoben in Build» ist die Nummer, in der es nachweislich drin ist, also "
  "z. B. 1.0 (3). Erst wenn die dort steht, darf der Status auf «Geprueft».", "text"),
]

# ------------------------------------------------------------- Eintraege
if len(sys.argv) < 2:
    sys.exit("Aufruf: bau-fehlerbuch.py <eintraege.json>")
E = json.load(io.open(sys.argv[1], encoding="utf-8"))
FELDER = ("datum","von","typ","bereich","titel","ist","soll","geraet",
          "schwere","prio","status","build","notiz")
for i, e in enumerate(E, 1):
    fehlt = [f for f in FELDER if f not in e]
    if fehlt:
        sys.exit("Eintrag %d fehlen Felder: %s" % (i, ", ".join(fehlt)))

# ------------------------------------------------------------------- Bauen
def zelle(ref, stil, wert=None, typ=None, formel=None, cache=None):
    a = ' r="%s" s="%d"' % (ref, stil)
    if formel is not None:
        c = '<c%s t="str"><f>%s</f><v>%s</v></c>' % (a, x(formel), x(cache or ""))
        return c
    if wert is None or wert == "":
        return "<c%s/>" % a
    if typ == "n":
        return '<c%s><v>%s</v></c>' % (a, wert)
    return '<c%s t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>' % (a, x(wert))

STIL = {"kopf": 1, "text": 2, "kurz": 3, "datum": 4, "id": 3,
        "titel": 5, "hinweis": 6, "listenkopf": 7}

def blatt1():
    n = len(SPALTEN)
    o = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
         '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
         '<sheetPr><outlinePr summaryBelow="1" summaryRight="1"/></sheetPr>',
         '<dimension ref="A1:%s%d"/>' % (sp(n-1), ZEILEN_GESAMT),
         '<sheetViews><sheetView tabSelected="1" workbookViewId="0" showGridLines="0">',
         '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>',
         '<selection pane="bottomLeft" activeCell="F2" sqref="F2"/>',
         '</sheetView></sheetViews>',
         '<sheetFormatPr defaultRowHeight="15"/>', '<cols>']
    for i, (_, breite, _) in enumerate(SPALTEN):
        o.append('<col min="%d" max="%d" width="%d" customWidth="1"/>' % (i+1, i+1, breite))
    o.append('</cols><sheetData>')
    o.append('<row r="1" ht="30" customHeight="1">')
    for i, (kopf, _, _) in enumerate(SPALTEN):
        o.append(zelle("%s1" % sp(i), STIL["kopf"], kopf))
    o.append('</row>')
    for r in range(2, ZEILEN_GESAMT + 1):
        d = E[r-2] if r-2 < len(E) else None
        o.append('<row r="%d">' % r)
        for i, (_, _, art) in enumerate(SPALTEN):
            ref = "%s%d" % (sp(i), r)
            s = STIL[art]
            if i == 0:
                f = 'IF($F%d="","","SV-"&TEXT(ROW()-1,"000"))' % r
                o.append(zelle(ref, s, formel=f,
                               cache=("SV-%03d" % (r-1)) if d else ""))
            elif d is None:
                o.append(zelle(ref, s))
            else:
                v = [None, d["datum"], d["von"], d["typ"], d["bereich"], d["titel"],
                     d["ist"], d["soll"], d["geraet"], d["schwere"], d["prio"],
                     d["status"], d["build"], d["notiz"]][i]
                if i == 1:
                    o.append(zelle(ref, s, tage(v), typ="n"))
                else:
                    o.append(zelle(ref, s, v))
        o.append('</row>')
    o.append('</sheetData>')
    o.append('<autoFilter ref="A1:%s%d"/>' % (sp(n-1), ZEILEN_GESAMT))
    o.append('<dataValidations count="%d">' % len(PRUEFUNG))
    for spalte, name in PRUEFUNG.items():
        o.append('<dataValidation type="list" allowBlank="1" showInputMessage="1" '
                 'showErrorMessage="1" sqref="%s2:%s%d"><formula1>%s</formula1>'
                 '</dataValidation>' % (spalte, spalte, ZEILEN_GESAMT, name))
    o.append('</dataValidations>')
    o.append('<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" '
             'header="0.3" footer="0.3"/>')
    o.append('</worksheet>')
    return "".join(o)

def blatt2():
    o = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
         '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
         '<dimension ref="A1:H40"/>',
         '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>',
         '<sheetFormatPr defaultRowHeight="15"/><cols>']
    for i in range(len(LISTEN)):
        o.append('<col min="%d" max="%d" width="22" customWidth="1"/>' % (i+1, i+1))
    o.append('<col min="%d" max="%d" width="110" customWidth="1"/>'
             % (len(LISTEN)+2, len(LISTEN)+2))
    o.append('</cols><sheetData>')
    hoehe = max(len(w) for _, w in LISTEN) + 1
    for r in range(1, max(hoehe, len(HINWEIS) + 1) + 1):
        o.append('<row r="%d">' % r)
        for i, (name, werte) in enumerate(LISTEN):
            ref = "%s%d" % (sp(i), r)
            if r == 1:
                o.append(zelle(ref, STIL["listenkopf"], name))
            elif r - 2 < len(werte):
                o.append(zelle(ref, STIL["kurz"], werte[r-2]))
        j = len(LISTEN) + 1
        if r - 1 < len(HINWEIS):
            txt, art = HINWEIS[r-1]
            if txt:
                o.append(zelle("%s%d" % (sp(j), r),
                               STIL["titel"] if art == "titel" else STIL["hinweis"], txt))
        o.append('</row>')
    o.append('</sheetData><pageMargins left="0.5" right="0.5" top="0.6" '
             'bottom="0.6" header="0.3" footer="0.3"/></worksheet>')
    return "".join(o)

STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="YYYY\\-MM\\-DD"/></numFmts>
<fonts count="5">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF3B352B"/><name val="Calibri"/></font>
<font><sz val="11"/><color rgb="FF5A5346"/><name val="Calibri"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF3B352B"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEFE9DC"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="hair"><color rgb="FFCFC7B6"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
</styleSheet>'''

namen = []
for i, (name, werte) in enumerate(LISTEN):
    namen.append('<definedName name="%s">\'Listen und Anleitung\'!$%s$2:$%s$%d</definedName>'
                 % (name, sp(i), sp(i), len(werte) + 1))
WORKBOOK = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
 '<sheets>'
 '<sheet name="Fehler und Änderungen" sheetId="1" r:id="rId1"/>'
 '<sheet name="Listen und Anleitung" sheetId="2" r:id="rId2"/>'
 '</sheets><definedNames>' + "".join(namen) + '</definedNames></workbook>')

RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
 'relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
WBRELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
 'relationships/worksheet" Target="worksheets/sheet1.xml"/>'
 '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
 'relationships/worksheet" Target="worksheets/sheet2.xml"/>'
 '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
 'relationships/styles" Target="styles.xml"/></Relationships>')
CT = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
 '<Default Extension="xml" ContentType="application/xml"/>'
 '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-'
 'officedocument.spreadsheetml.sheet.main+xml"/>'
 '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.'
 'openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
 '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.'
 'openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
 '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-'
 'officedocument.spreadsheetml.styles+xml"/></Types>')

with zipfile.ZipFile(ZIEL, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", CT)
    z.writestr("_rels/.rels", RELS)
    z.writestr("xl/workbook.xml", WORKBOOK)
    z.writestr("xl/_rels/workbook.xml.rels", WBRELS)
    z.writestr("xl/styles.xml", STYLES)
    z.writestr("xl/worksheets/sheet1.xml", blatt1())
    z.writestr("xl/worksheets/sheet2.xml", blatt2())

print("geschrieben:", ZIEL)
print("Spalten:", len(SPALTEN), "· Zeilen vorbereitet:", ZEILEN_GESAMT,
      "· Eintraege:", len(E))
