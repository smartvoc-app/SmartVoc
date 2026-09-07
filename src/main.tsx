import { createRoot } from "react-dom/client";
// Self-hosted fonts (Phase 8) — offline + no external request. Family names
// match the CSS tokens ("Hanken Grotesk", "Source Serif 4", "Patrick Hand").
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "@fontsource/hanken-grotesk/700.css";
import "@fontsource/hanken-grotesk/800.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/patrick-hand/400.css";
import "./index.css";
import "./schemes.css";
import { ToastHost } from "./ui/Toast";
import { StoreProvider } from "./store/StoreProvider";
import { ScreenHeadProvider } from "./ui/ScreenHead";
import { AuthProvider } from "./sync/auth";
import { SyncBridge } from "./sync/SyncBridge";
import { App } from "./App";
import { hydrateFromNative, entferneAltesProtokoll } from "./lib/storage";

/* Auf iOS zuerst die native Sicherung in den Arbeitsspeicher zurueckholen --
 * vor dem ersten Rendern, weil der Laden seine Anfangswerte synchron aus
 * localStorage liest. Im Browser kehrt das sofort zurueck. */
hydrateFromNative().then(entferneAltesProtokoll).finally(() => {
  createRoot(document.getElementById("root")!).render(
    <ToastHost>
      <AuthProvider>
        <StoreProvider>
          <SyncBridge>
            <ScreenHeadProvider>
              <App />
            </ScreenHeadProvider>
          </SyncBridge>
        </StoreProvider>
      </AuthProvider>
    </ToastHost>
  );
});

/* Nach neuen Fassungen sehen, ohne dass jemand neu laden muss.
 *
 * `registerType: "autoUpdate"` prueft nur beim Laden der Seite. Wer den Tab
 * offen laesst -- und das tut man bei einer Lern-App -- bleibt beliebig lange
 * auf der alten Fassung und wundert sich, dass Korrekturen nicht ankommen.
 * Genau das ist in der Erprobung mehrfach passiert.
 *
 * Deshalb zusaetzlich nachfragen, wenn der Tab wieder in den Vordergrund
 * kommt, und einmal pro Stunde. Findet der Browser eine neue Fassung,
 * uebernimmt sie der Dienst-Arbeiter (skipWaiting) und laedt die Seite neu.
 * Auf iOS gibt es keinen Dienst-Arbeiter; dort faellt das leise aus. */
if ("serviceWorker" in navigator) {
  const nachsehen = () => navigator.serviceWorker.getRegistration()
    .then((r) => r?.update())
    .catch(() => {});
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") nachsehen();
  });
  setInterval(nachsehen, 60 * 60 * 1000);
}
