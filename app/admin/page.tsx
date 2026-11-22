"use client";

import { useCallback, useEffect, useState } from "react";
import Header, { Brand } from "@/components/Header";
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
        <Brand />
        <Header title="Admin" subtitle="Alternativ, facit och avslöjande." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(pw);
          }}
        >
          <p className="group-title">Lösenord</p>
          <section className="group">
            <input
              id="pw"
              type="password"
              className="field"
              placeholder="Lösenord"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
          </section>
          {err && <p className="error">{err}</p>}
          <button className="btn btn--primary btn--block">Logga in</button>
        </form>
      </main>
    );
  }

  const revealed = snap?.config.revealed;

  return (
    <main className="page page--wide">
      <Brand />
      <Header title="Admin" subtitle="Alternativ, facit och avslöjande." />

      {snap?.storage === "memory" && (
        <p className="warn">Ingen Redis-databas är kopplad. Röster sparas bara i minnet och fungerar inte på Vercel. Se README.</p>
      )}
      {snap?.defaultPassword && (
        <p className="warn">Standardlösenordet används. Sätt miljövariabeln ADMIN_PASSWORD i Vercel.</p>
      )}

      <p className="group-title">Status</p>
      <section className="group">
        <div className="row">
          <span className="row__label">Röstning</span>
          <span className={`status ${revealed ? "status--closed" : "status--open"}`}>
            {revealed ? "Stängd – resultat visas" : "Öppen"}
          </span>
        </div>
        <div className="row">
          <span className="row__label">Deltagare</span>
          <span className="row__value">{snap?.voters.length ?? 0}</span>
        </div>
        <a className="row row--link" href="/resultat" target="_blank">
          <span className="row__label row__label--accent">Öppna resultatskärm</span>
          <span className="row__value">
            <Arrow />
          </span>
        </a>
        <a className="row row--link" href="/" target="_blank">
          <span className="row__label row__label--accent">Öppna röstning</span>
          <span className="row__value">
            <Arrow />
          </span>
        </a>
      </section>
      {revealed ? (
        <button className="btn btn--tinted btn--block" onClick={() => act({ action: "hide" }, "Röstningen är öppen igen")}>
          Dölj resultat och öppna röstningen
        </button>
      ) : (
        <button className="btn btn--primary btn--block" onClick={() => act({ action: "reveal" }, "Avslöjat 🎉")}>
          Avslöja resultatet
        </button>
      )}
      <p className="group-footer">
        När du avslöjar stängs röstningen. Stega igenom resultatskärmen med klick, mellanslag eller piltangenterna.
      </p>

      <p className="group-title">Alternativ att gissa på</p>
      <section className="group">
        {candidates.map((c, i) => (
          <div className="row row--input" key={i}>
            <span className="row__index">{i + 1}</span>
            <input
              className="field field--inline"
              value={c}
              placeholder={`Alternativ ${i + 1}`}
              maxLength={50}
              onChange={(e) => {
                const next = [...candidates];
                next[i] = e.target.value;
                setCandidates(next);
                setDirty(true);
              }}
            />
            <button
              className="remove"
              aria-label={`Ta bort ${c || "alternativ"}`}
              onClick={() => {
                setCandidates(candidates.filter((_, j) => j !== i));
                setDirty(true);
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                <circle cx="11" cy="11" r="11" fill="currentColor" />
                <path d="M6.5 11h9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
        <button
          className="row row--link"
          onClick={() => {
            setCandidates([...candidates, ""]);
            setDirty(true);
          }}
        >
          <span className="row__label row__label--accent">Lägg till alternativ</span>
        </button>
      </section>
      <p className="group-footer">Fyll i innan testet startar. Ändra inte ordningen när folk har börjat rösta.</p>

      <p className="group-title">Facit</p>
      <section className="group">
        {Array.from({ length: NUM_BUNS }, (_, i) => String(i + 1)).map((n) => (
          <label key={n} className="row row--select">
            <span className="row__label">Bulle {n}</span>
            <span className="row__value">
              {answers[n] != null ? candidates[answers[n]!] || `Alternativ ${answers[n]! + 1}` : "Ej angivet"}
              <Chevron />
            </span>
            <select
              aria-label={`Facit bulle ${n}`}
              value={answers[n] ?? ""}
              onChange={(e) => {
                setAnswers({ ...answers, [n]: e.target.value === "" ? null : Number(e.target.value) });
                setDirty(true);
              }}
            >
              <option value="">Ej angivet</option>
              {candidates.map((c, i) => (
                <option key={i} value={i}>
                  {c || `Alternativ ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      <p className="group-footer">Kan fyllas i när som helst före avslöjandet.</p>

      {dirty && (
        <div className="bottom-bar">
          <button
            className="btn btn--primary btn--block"
            onClick={() => act({ action: "saveConfig", candidates, answers }, "Sparat", true)}
          >
            Spara alternativ och facit
          </button>
        </div>
      )}

      <p className="group-title">Deltagare</p>
      <section className="group">
        {snap?.voters.length ? (
          snap.voters.map((v) => (
            <div className="row" key={v.id}>
              <span className="row__label">{v.name}</span>
              <span className="row__value">
                {v.bunsVoted}/{NUM_BUNS}
              </span>
              <button
                className={`btn btn--small ${confirm === v.id ? "btn--destructive" : "btn--tinted-red"}`}
                onClick={() =>
                  confirm === v.id
                    ? act({ action: "deleteVoter", voterId: v.id }, `${v.name} borttagen`)
                    : setConfirm(v.id)
                }
              >
                {confirm === v.id ? "Ta bort" : "Radera"}
              </button>
            </div>
          ))
        ) : (
          <div className="row">
            <span className="row__label muted">Inga röster än</span>
          </div>
        )}
      </section>

      <p className="group-title">Förhandsgranska</p>
      <section className="group">
        <button className="row row--link" onClick={loadPreview}>
          <span className="row__label row__label--accent">Visa nuvarande ställning</span>
        </button>
        {preview?.revealed &&
          preview.ranking.map((r, i) => (
            <div className="row" key={r.bun}>
              <span className="row__index">{i + 1}</span>
              <span className="row__label">
                Bulle {r.bun}
                {r.answer && <span className="muted"> · {r.answer}</span>}
              </span>
              <span className="row__value">
                {r.total.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} p · {r.votes} röster
              </span>
            </div>
          ))}
      </section>
      <p className="group-footer">Bara för dig – tjuvkika på ställningen innan avslöjandet.</p>

      <section className="group">
        <button
          className="row row--link row--center"
          onClick={() => (confirm === "clear" ? act({ action: "clearVotes" }, "Alla röster raderade") : setConfirm("clear"))}
        >
          <span className="row__label row__label--destructive">
            {confirm === "clear" ? "Tryck igen för att radera allt" : "Radera alla röster"}
          </span>
        </button>
      </section>
      <p className="group-footer">Alternativ och facit behålls. Röstningen öppnas igen.</p>

      {err && <p className="error">{err}</p>}
      {msg && <div className="toast">{msg}</div>}
    </main>
  );
}

function Chevron() {
  return (
    <svg className="chevron" width="8" height="13" viewBox="0 0 8 13" aria-hidden>
      <path d="M1.5 1.5 6.5 6.5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg className="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
