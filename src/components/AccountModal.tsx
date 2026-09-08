/* Account modal (Phase 3): email/password sign in & sign up, password reset,
 * a free-text username, sync status, sign out. Rendered only when Supabase
 * is configured. */
import { useState, useEffect } from "react";
import { txt } from "../lib/i18n";
import { Icon } from "../ui/Icon";
import { Bestaetigen } from "../ui/Bestaetigen";
import { useAuth } from "../sync/auth";
import { useSync, type SyncStatus } from "../sync/SyncBridge";
import { useToast } from "../ui/Toast";
import { deleteLocalData } from "../lib/accountData";
import { deleteCloudAccount } from "../sync/share";

const STATUS_LABEL: Record<SyncStatus, string> = {
  local: "Nur auf diesem Gerät",
  syncing: "Synchronisiere…",
  synced: "Synchronisiert",
  offline: "Ohne Netz, wird nachgeholt",
  error: "Abgleich fehlgeschlagen, neuer Versuch folgt",
};

type Mode = "in" | "up" | "reset" | "newpw";

export function AccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  const { status } = useSync();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [username, setUsername] = useState("");            // sign-up field
  const [editingName, setEditingName] = useState(false);    // inline username edit (logged-in view)
  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [altesPw, setAltesPw] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // The user followed the "reset password" email link — force the new-password screen.
  useEffect(() => { if (auth.recovering) { setMode("newpw"); setError(""); setInfo(""); } }, [auth.recovering]);

  // The modal never unmounts (App.tsx keeps it mounted, `open` just toggles visibility),
  // so its mode/fields would otherwise leak across sessions — e.g. staying stuck on
  // "newpw" forever after a password reset, hiding the signed-in view and sign-out.
  // Every fresh open (outside an active recovery) starts clean on the sign-in screen.
  useEffect(() => {
    if (open && !auth.recovering) {
      setMode("in");
      setEmail(""); setPassword(""); setPassword2(""); setUsername(""); setAltesPw("");
      setEditingName(false); setNameDraft("");
      setError(""); setInfo("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open && !auth.recovering) return null;

  const switchMode = (m: Mode) => { setMode(m); setError(""); setInfo(""); setPassword(""); setPassword2(""); setAltesPw(""); };

  /* Mindestlaenge statt Zeichenklassen.
   *
   * "Mindestens ein Sonderzeichen" erzeugt "Passwort1!" -- laenger und
   * schwerer zu erraten wird davon nichts. Laenge ist das, was zaehlt, und
   * sie laesst sich auf einer Handytastatur auch eintippen. Acht Zeichen
   * liegen ueber der Supabase-Vorgabe von sechs. */
  const PW_MIN = 8;
  const pwSchwach = password.length > 0 && password.length < PW_MIN;
  const pwUngleich = password2.length > 0 && password !== password2;

  const submit = async () => {
    setBusy(true); setError(""); setInfo("");
    if (mode === "reset") {
      const r = await auth.resetPassword(email.trim());
      setBusy(false);
      if (r.error) { setError(r.error); return; }
      setInfo(txt("Wenn es zu dieser Adresse ein Konto gibt, ist ein Link zum Zurücksetzen unterwegs. Öffne ihn auf diesem Gerät."));
      return;
    }
    if (mode === "newpw") {
      if (password.length < PW_MIN) { setBusy(false); setError(txt("Mindestens {n} Zeichen.", { n: PW_MIN })); return; }
      if (password !== password2) { setBusy(false); setError(txt("Passwörter stimmen nicht überein.")); return; }
      /* Wer angemeldet ist, muss das alte Passwort kennen.
       *
       * Sonst genuegt ein unbeaufsichtigtes Geraet, um jemanden aus seinem
       * eigenen Konto auszusperren. Geprueft wird, indem wir uns mit dem
       * alten Passwort noch einmal anmelden -- schlaegt das fehl, passiert
       * nichts weiter; die bestehende Sitzung bleibt.
       *
       * NICHT verlangt wird es nach dem Link aus der Zuruecksetzen-Mail:
       * dort ist der ganze Sinn, dass man das alte eben nicht mehr weiss.
       * Die Mail selbst ist dann der Nachweis. */
      if (!auth.recovering) {
        const pruefung = await auth.signIn(auth.email || "", altesPw);
        if (pruefung.error) { setBusy(false); setError(txt("Das aktuelle Passwort stimmt nicht.")); return; }
      }
      const r = await auth.updatePassword(password);
      setBusy(false);
      if (r.error) { setError(r.error); return; }
      setPassword(""); setPassword2(""); setAltesPw("");
      toast(txt("Passwort geändert"), "check");
      onClose();
      return;
    }
    if (mode === "up") {
      if (password.length < PW_MIN) { setBusy(false); setError(txt("Mindestens {n} Zeichen.", { n: PW_MIN })); return; }
      if (password !== password2) { setBusy(false); setError(txt("Passwörter stimmen nicht überein.")); return; }
    }
    const r = mode === "in" ? await auth.signIn(email.trim(), password) : await auth.signUp(email.trim(), password, username);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    /* Nach dem Anlegen wechseln wir auf das Anmeldefenster.
     *
     * Vorher blieb die Maske stehen, mit allen Feldern noch gefuellt und
     * einem Satz darunter -- man sah nicht, ob etwas passiert war, und der
     * naechste Schritt (anmelden) war nirgends zu sehen. Die Adresse bleibt
     * stehen, damit sie nach dem Bestaetigen nicht nochmal getippt werden
     * muss; die Passwoerter werden geleert.
     *
     * Der Satz ist bestimmt formuliert, nicht im Konjunktiv: Wenn wir hier
     * landen, gibt es keine Sitzung, und das heisst, die Adresse muss
     * bestaetigt werden. */
    if (mode === "up" && !auth.user) {
      setMode("in");
      setPassword(""); setPassword2(""); setUsername("");
      setError("");
      setInfo(txt("Konto erstellt. Wir haben dir eine E-Mail geschickt: bestätige die Adresse, dann kannst du dich hier anmelden."));
      return;
    }
    onClose();
  };

  /* Das Konto loeschen gehoert hierher, nicht in die Einstellungen.
   *
   * Es stand dort neben "Einstellungen zuruecksetzen" und "Fortschritt
   * zuruecksetzen" -- also zwischen Dingen, die das Geraet betreffen, waehrend
   * es um die Identitaet geht. Wer sein Konto sucht, sucht es im Konto.
   * In den Einstellungen bleibt das Loeschen der Daten AUF DIESEM GERAET;
   * das ist eine andere Handlung und heisst jetzt auch so. */
  const doDelete = async () => {
    if (confirmText.trim().toUpperCase() !== txt("LÖSCHEN").toUpperCase()) return;
    setDelBusy(true); setDelErr("");
    try {
      await deleteCloudAccount();
      deleteLocalData();
      await auth.signOut();
      location.reload();
    } catch (e: any) {
      setDelBusy(false);
      setDelErr(txt("Löschen fehlgeschlagen") + ": " + (e?.message || e));
    }
  };

  const close = () => { if (mode === "newpw") auth.clearRecovery(); onClose(); };

  const startEditName = () => { setNameDraft(auth.username || ""); setEditingName(true); };
  const commitUsername = async () => {
    setEditingName(false);
    const name = nameDraft.trim();
    if (!name || name === auth.username) return;
    const r = await auth.updateUsername(name);
    if (r.error) toast(r.error, "x"); else toast(txt("Anzeigename gespeichert"), "check");
  };

  /* Zwei Bedingungen, zwei Zeilen, jede mit ihrem Zustand.
   *
   * Ein Satz "Mindestens acht Zeichen" sagt nicht, ob man sie schon hat.
   * Deshalb je Bedingung ein Zeichen davor: offen, erfuellt oder verletzt.
   * Erfuellt wird gruen, verletzt rot -- aber erst, wenn im Feld etwas
   * steht. Wer noch nicht getippt hat, hat nichts falsch gemacht. */
  /* Eine Adresse ohne @ oder ohne Punkt dahinter kann keine sein. Die
   * Pruefung bleibt absichtlich grob: sie faengt den Tippfehler ab, sie
   * entscheidet nicht, welche Adressen es gibt. Ohne sie ging "pruef" ans
   * Netz und kam als Serverfehler zurueck -- waehrend das Passwort daneben
   * schon vor dem Absenden sagt, was ihm fehlt. */
  const mailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const Regel = ({ zustand, text }: { zustand: "offen" | "gut" | "schlecht"; text: string }) => (
    <div className="pw-regel" data-zustand={zustand}>
      {zustand === "offen" ? <span className="dot" /> : <Icon name={zustand === "gut" ? "check" : "x"} size={13} />}
      <span>{text}</span>
    </div>
  );

  const titles: Record<Mode, string> = {
    in: txt("Anmelden"), up: txt("Konto erstellen"), reset: txt("Passwort zurücksetzen"), newpw: txt("Neues Passwort setzen"),
  };

  return (
    <>
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div className="modal-title">{auth.user && mode !== "newpw" ? "Dein Account" : titles[mode]}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={close}><Icon name="x" size={16} /></button>
        </div>

        {auth.user && mode !== "newpw" ? (
          <div className="col" style={{ gap: 10 }}>
            <div className="badge slate" style={{ alignSelf: "flex-start" }}><span className="dot" />{txt(STATUS_LABEL[status])}</div>
            <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
              {txt("Deine Wörter, Listen und Fortschritte werden abgeglichen und stehen auf allen deinen Geräten zur Verfügung. Ohne Netz läuft alles weiter und wird beim nächsten Mal nachgeholt.")}
            </div>

            {/* Zeilen wie ueberall sonst in der App: Name links, Wert rechts,
                antippbar. Vorher war der Anzeigename das EINZIGE, was man hier
                aendern konnte, und zwar ueber einen Stift, der die Zeile beim
                Aufklappen umbrach. Wer ein Konto sucht, sucht Zugangsdaten. */}
            <div className="grp">{txt("Dein Konto")}</div>
            {editingName ? (
              <input className="field" autoFocus placeholder={txt("Anzeigename")} value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)} onBlur={commitUsername}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
            ) : (
              <button className="li" onClick={startEditName}>
                <span className="g">{txt("Anzeigename")}</span>
                <span className="lern-wert">{auth.username || txt("nicht gesetzt")}</span>
                <Icon name="edit" size={14} />
              </button>
            )}
            <div className="li" style={{ cursor: "default" }}>
              <span className="g">{txt("E-Mail")}</span>
              <span className="lern-wert">{auth.email}</span>
            </div>
            <button className="li" onClick={() => { setMode("newpw"); setPassword(""); setPassword2(""); setAltesPw(""); setError(""); setInfo(""); }}>
              <span className="g">{txt("Passwort ändern")}</span>
              <Icon name="arrowRight" size={14} />
            </button>

            {/* "Abmelden" gehoert zu den Kontozeilen, nicht zum Loeschen.
                Vorher stand darueber die Ueberschrift "Konto beenden", und
                unter der liest sich Abmelden wie eine Art der Loeschung. Die
                Folge war genau die Verwechslung, die zu erwarten war: die
                beiden Zeilen wirkten wie zwei Loeschvarianten -- eine fuer die
                Wolke, eine fuer alles --, und der Log-out schien zu fehlen,
                obwohl er die ganze Zeit da war. Ohne die Ueberschrift ist
                Abmelden wieder das, was es ist. */}
            <button className="li" onClick={() => auth.signOut()}>
              <span className="g">{txt("Abmelden")}</span>
              <span className="lern-wert">{txt("Deine Wörter bleiben auf diesem Gerät")}</span>
            </button>

            {/* Ohne Beschreibung. Was geloescht wird, steht im
                Bestaetigungsdialog -- dort, wo entschieden wird, und dort
                ausfuehrlicher, als eine Zeile es koennte. Die Unterscheidung
                zwischen Konto und Geraetedaten trug hier nichts: wer sein
                Konto loescht, will es ganz weg. */}
            <button className="li li-gefahr" style={{ marginTop: 16 }}
              onClick={() => { setConfirmText(""); setDelErr(""); setDelOpen(true); }}>
              <span className="g">{txt("Konto löschen")}</span>
            </button>
          </div>
        ) : mode === "newpw" ? (
          <div className="col" style={{ gap: 10 }}>
            <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{txt("Setze ein neues Passwort für {wer}.", { wer: auth.email || txt("dein Konto") })}</div>
            {!auth.recovering && (
              <input className="field" type="password" placeholder={txt("Aktuelles Passwort")} value={altesPw} autoComplete="current-password" autoFocus
                onChange={(e) => setAltesPw(e.target.value)} />
            )}
            <input className="field" type="password" placeholder={txt("Neues Passwort")} value={password} autoComplete="new-password" autoFocus={auth.recovering}
              onChange={(e) => setPassword(e.target.value)} />
            <input className="field" type="password" placeholder={txt("Neues Passwort wiederholen")} value={password2} autoComplete="new-password"
              onChange={(e) => setPassword2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            <div className="pw-regeln">
              <Regel text={txt("Mindestens {n} Zeichen", { n: PW_MIN })}
                zustand={!password ? "offen" : password.length >= PW_MIN ? "gut" : "schlecht"} />
              <Regel text={txt("Beide Eingaben stimmen überein")}
                zustand={!password2 ? "offen" : password === password2 ? "gut" : "schlecht"} />
            </div>
            {error && <div className="badge red" style={{ alignSelf: "flex-start" }}><span className="dot" />{error}</div>}
            <button className="btn btn-primary" onClick={submit}
              disabled={busy || !password || !password2 || password.length < PW_MIN || password !== password2 || (!auth.recovering && !altesPw)}>
              {busy ? <Icon name="refresh" size={15} /> : <Icon name="check" size={15} />} {txt("Passwort speichern")}
            </button>
          </div>
        ) : mode === "reset" ? (
          <div className="col" style={{ gap: 10 }}>
            {/* Zwei Zustaende, nicht einer mit einem Satz mehr.
             *
             * Vorher stand nach dem Senden dieselbe Maske da: Adresse noch im
             * Feld, Knopf noch bereit, nur ein Satz kam dazu. Man sah nicht,
             * ob etwas passiert war, und tippte den Knopf ein zweites Mal.
             * Dasselbe war beim Anlegen eines Kontos schon aufgefallen und
             * dort behoben -- hier war es stehen geblieben.
             *
             * Der Haken auf dem Knopf verschlimmerte es: er stand da, BEVOR
             * etwas gesendet war, und blieb danach unveraendert stehen. Ein
             * Pfeil sagt "das steht noch aus", der Haken gehoert erst in den
             * Zustand danach. */}
            {info ? (
              <>
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{info}</div>
                <button className="btn btn-primary" onClick={() => switchMode("in")}>
                  <Icon name="check" size={15} /> {txt("Zurück zum Anmelden")}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setInfo("")}>{txt("Nochmal senden")}</button>
              </>
            ) : (
              <>
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{txt("Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.")}</div>
                <input className="field" type="email" placeholder={txt("E-Mail")} value={email} autoComplete="email" autoFocus
                  onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
                {error && <div className="badge red" style={{ alignSelf: "flex-start" }}><span className="dot" />{error}</div>}
                <button className="btn btn-primary" onClick={submit} disabled={busy || !mailOk(email)}>
                  {busy ? <Icon name="refresh" size={15} /> : <Icon name="arrowRight" size={15} />} {txt("Link senden")}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => switchMode("in")}>{txt("Zurück zum Anmelden")}</button>
              </>
            )}
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {mode === "up" && (
              <input className="field" type="text" placeholder={txt("Anzeigename")} value={username} autoComplete="nickname"
                onChange={(e) => setUsername(e.target.value)} />
            )}
            <input className="field" type="email" placeholder={txt("E-Mail")} value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" placeholder={txt("Passwort")} value={password} autoComplete={mode === "in" ? "current-password" : "new-password"}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            {/* Beim Anlegen zweimal: ein Tippfehler im Passwort faellt sonst
                erst auf, wenn man sich das naechste Mal anmelden will -- und
                dann hilft nur noch das Zuruecksetzen per E-Mail. */}
            {mode === "up" && (
              <>
                <input className="field" type="password" placeholder={txt("Passwort wiederholen")} value={password2} autoComplete="new-password"
                  onChange={(e) => setPassword2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
                <div className="pw-regeln">
                  <Regel text={txt("Eine gültige E-Mail-Adresse")}
                    zustand={!email.trim() ? "offen" : mailOk(email) ? "gut" : "schlecht"} />
                  <Regel text={txt("Mindestens {n} Zeichen", { n: PW_MIN })}
                    zustand={!password ? "offen" : password.length >= PW_MIN ? "gut" : "schlecht"} />
                  <Regel text={txt("Beide Eingaben stimmen überein")}
                    zustand={!password2 ? "offen" : password === password2 ? "gut" : "schlecht"} />
                </div>
              </>
            )}
            {error && <div className="badge red" style={{ alignSelf: "flex-start" }}><span className="dot" />{error}</div>}
            {info && <div className="muted" style={{ fontSize: 12.5 }}>{info}</div>}
            <button className="btn btn-primary" onClick={submit}
              disabled={busy || !email.trim() || !password || (mode === "up" && (!mailOk(email) || password.length < PW_MIN || password !== password2))}>
              {busy ? <Icon name="refresh" size={15} /> : <Icon name="check" size={15} />} {mode === "in" ? txt("Anmelden") : txt("Registrieren")}
            </button>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => switchMode(mode === "in" ? "up" : "in")}>
                {mode === "in" ? txt("Noch kein Konto? Registrieren") : txt("Schon registriert? Anmelden")}
              </button>
              {mode === "in" && <button className="btn btn-ghost btn-sm" onClick={() => switchMode("reset")}>{txt("Passwort vergessen?")}</button>}
            </div>
          </div>
        )}
      </div>
    </div>

      <Bestaetigen offen={delOpen} titel={txt("Konto löschen")} gefahr
        text={<>
          {txt("Das löscht deine Daten endgültig, auf diesem Gerät und auf dem Server. Danach wirst du abgemeldet.")}
          {" "}{txt("Zum Bestätigen tippe")} <b style={{ color: "var(--ink)" }}>{txt("LÖSCHEN")}</b>.
        </>}
        knopf={txt("Endgültig löschen")} aus={delBusy || confirmText.trim().toUpperCase() !== txt("LÖSCHEN").toUpperCase()}
        onClose={() => !delBusy && setDelOpen(false)} tun={doDelete}>
        <input className="field" style={{ marginTop: 12 }} placeholder={txt("LÖSCHEN")} value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)} autoFocus />
        {delErr && <div className="badge red" style={{ marginTop: 10 }}><span className="dot" />{delErr}</div>}
      </Bestaetigen>
    </>
  );
}