"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import { Config, NUM_BUNS, Results } from "@/lib/types";

type Snapshot = {
  config: Config;
  storage: "redis" | "memory";
  defaultPassword: boolean;
  voters: { id: string; name: string; bunsVoted: number; updatedAt: number }[];
};

const PW_KEY = "lusse.adminpw";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [preview, setPreview] = useState<Results | null>(null);

  const apply = useCallback((s: Snapshot, resetForm: boolean) => {
    setSnap(s);
    if (resetForm) {
      setCandidates(s.config.candidates);
      setAnswers(s.config.answers ?? {});
      setDirty(false);
    }
  }, []);

  const call = useCallback(
    async (method: "GET" | "POST", body?: object, password = pw) => {
      const res = await fetch("/api/admin", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fel");
      return data as Snapshot;
    },
    [pw]
  );

  const login = async (password: string) => {
    try {
      const s = await call("GET", undefined, password);
      setAuthed(true);
      setErr(null);
      try {
        sessionStorage.setItem(PW_KEY, password);
      } catch {}
      apply(s, true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fel");
    }
  };

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(PW_KEY);
    } catch {}
    if (saved) {
      setPw(saved);
      login(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh voter list periodically (without overwriting unsaved form edits)
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => {
      call("GET")
        .then((s) => apply(s, false))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [authed, call, apply]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  const act = async (body: object, okMsg: string, resetForm = false) => {
    try {
      const s = await call("POST", body);
      apply(s, resetForm);
      setMsg(okMsg);
      setErr(null);
      setConfirm(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fel");
    }
  };

  const loadPreview = async () => {
    const res = await fetch("/api/results?preview=1", { headers: { "x-admin-password": pw } });
    setPreview(await res.json());
  };

  if (!authed) {
    return (
      <main className="page">
        <Header subtitle="Admin" />
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            login(pw);
          }}
        >
          <label className="label" htmlFor="pw">
            Lösenord
          </label>
          <input id="pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          {err && <p className="error">{err}</p>}
          <button className="btn btn--primary btn--block">Logga in</button>
        </form>
      </main>
    );
  }

  const revealed = snap?.config.revealed;

  return (
    <main className="page page--wide">
      <Header subtitle="Admin" />

      {snap?.storage === "memory" && (
        <p className="warn">
          ⚠️ Ingen Redis-databas är kopplad. Röster sparas bara i minnet och fungerar inte på Vercel. Se README.
        </p>
      )}
      {snap?.defaultPassword && (
        <p className="warn">⚠️ Standardlösenordet används. Sätt miljövariabeln ADMIN_PASSWORD i Vercel.</p>
      )}

      <section className="card">
        <h2>Status</h2>
        <p>
          Röstningen är <strong>{revealed ? "stängd – resultatet visas" : "öppen"}</strong>. {snap?.voters.length ?? 0}{" "}
          deltagare.
        </p>
        <div className="row">
          {revealed ? (
            <button className="btn" onClick={() => act({ action: "hide" }, "Resultatet dolt, röstningen öppen igen")}>
              Dölj resultat & öppna röstningen
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => act({ action: "reveal" }, "Avslöjat! 🎉")}>
              🎉 Avslöja resultatet
            </button>
          )}
          <a className="btn" href="/resultat" target="_blank">
            Öppna resultatskärm ↗
          </a>
          <a className="btn" href="/" target="_blank">
            Öppna röstning ↗
          </a>
        </div>
        <p className="hint">När du avslöjar stängs röstningen och resultatskärmen går att stega igenom (klick / mellanslag).</p>
      </section>

      <section className="card">
        <h2>Alternativ att gissa på</h2>
        <p className="hint">Fyll i innan testet startar – deltagarna väljer bland dessa. Ändra inte ordningen när folk börjat rösta.</p>
        {candidates.map((c, i) => (
          <div className="row" key={i}>
            <span className="idx">{i + 1}</span>
            <input
              className="input"
              value={c}
              maxLength={50}
              onChange={(e) => {
                const next = [...candidates];
                next[i] = e.target.value;
                setCandidates(next);
                setDirty(true);
              }}
            />
            <button
              className="btn btn--ghost"
              aria-label="Ta bort"
              onClick={() => {
                setCandidates(candidates.filter((_, j) => j !== i));
                setDirty(true);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn btn--ghost"
          onClick={() => {
            setCandidates([...candidates, ""]);
            setDirty(true);
          }}
        >
          + Lägg till alternativ
        </button>
      </section>

      <section className="card">
        <h2>Facit</h2>
        <p className="hint">Vilken är vilken? Kan fyllas i när som helst innan avslöjandet.</p>
        <div className="facit">
          {Array.from({ length: NUM_BUNS }, (_, i) => String(i + 1)).map((n) => (
            <label key={n} className="facit__row">
              <span>Bulle {n}</span>
              <select
                className="input select"
                value={answers[n] ?? ""}
                onChange={(e) => {
                  setAnswers({ ...answers, [n]: e.target.value === "" ? null : Number(e.target.value) });
                  setDirty(true);
                }}
              >
                <option value="">– Ej angivet –</option>
                {candidates.map((c, i) => (
                  <option key={i} value={i}>
                    {c || `(tomt ${i + 1})`}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <div className="sticky-actions">
        <button
          className="btn btn--primary btn--block"
          disabled={!dirty}
          onClick={() => act({ action: "saveConfig", candidates, answers }, "Sparat ✓", true)}
        >
          {dirty ? "Spara alternativ & facit" : "Allt sparat ✓"}
        </button>
      </div>

      <section className="card">
        <h2>Deltagare ({snap?.voters.length ?? 0})</h2>
        {snap?.voters.length ? (
          <ul className="voters">
            {snap.voters.map((v) => (
              <li key={v.id}>
                <span>{v.name}</span>
                <span className="muted">
                  {v.bunsVoted}/{NUM_BUNS} bullar
                </span>
                <button
                  className="btn btn--ghost btn--small"
                  onClick={() =>
                    confirm === v.id
                      ? act({ action: "deleteVoter", voterId: v.id }, `${v.name} borttagen`)
                      : setConfirm(v.id)
                  }
                >
                  {confirm === v.id ? "Säker?" : "Ta bort"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Inga röster än.</p>
        )}
      </section>

      <section className="card">
        <h2>Förhandsgranska</h2>
        <p className="hint">Bara för dig – tjuvkika på ställningen innan avslöjandet.</p>
        <button className="btn" onClick={loadPreview}>
          Visa nuvarande ställning
        </button>
        {preview?.revealed && (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bulle</th>
                <th>Totalt</th>
                <th>Röster</th>
                <th>Facit</th>
              </tr>
            </thead>
            <tbody>
              {preview.ranking.map((r, i) => (
                <tr key={r.bun}>
                  <td>{i + 1}</td>
                  <td>{r.bun}</td>
                  <td>{r.total.toFixed(1)}</td>
                  <td>{r.votes}</td>
                  <td>{r.answer ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card card--danger">
        <h2>Nollställ</h2>
        <p className="hint">Raderar alla röster och öppnar röstningen igen. Alternativ och facit behålls.</p>
        <button
          className="btn btn--danger"
          onClick={() =>
            confirm === "clear" ? act({ action: "clearVotes" }, "Alla röster raderade") : setConfirm("clear")
          }
        >
          {confirm === "clear" ? "Tryck igen för att radera allt" : "Radera alla röster"}
        </button>
      </section>

      {err && <p className="error">{err}</p>}
      {msg && <div className="toast">{msg}</div>}
    </main>
  );
}
