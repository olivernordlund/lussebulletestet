"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Bun from "@/components/Bun";
import { BunVote, CRITERIA, Criterion, MAX_SCORE, NUM_BUNS, PublicState, Voter } from "@/lib/types";

const ID_KEY = "lusse.voterId";
const NAME_KEY = "lusse.name";

const emptyVote = (): BunVote => ({ look: null, taste: null, texture: null, guess: null });
const isComplete = (v?: BunVote) => !!v && v.look != null && v.taste != null && v.texture != null;

function readLS(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export default function VotePage() {
  const [state, setState] = useState<PublicState | null>(null);
  const [voterId, setVoterId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [votes, setVotes] = useState<Record<string, BunVote>>({});
  const [active, setActive] = useState<number | null>(null);
  const [draft, setDraft] = useState<BunVote>(emptyVote());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Init voter identity + load existing votes
  useEffect(() => {
    let id = readLS(ID_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      writeLS(ID_KEY, id);
    }
    setVoterId(id);
    const storedName = readLS(NAME_KEY) ?? "";
    setName(storedName);
    setNameDraft(storedName);

    fetch(`/api/vote?voterId=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((v: Voter | null) => {
        if (v?.buns) setVotes(v.buns);
        if (v?.name && !storedName) {
          setName(v.name);
          setNameDraft(v.name);
        }
      })
      .catch(() => {});
  }, []);

  // Poll public state (candidates + reveal)
  useEffect(() => {
    const load = () =>
      fetch("/api/state")
        .then((r) => r.json())
        .then(setState)
        .catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const openBun = useCallback(
    (n: number) => {
      setActive(n);
      setDraft({ ...emptyVote(), ...(votes[String(n)] ?? {}) });
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [votes]
  );

  const saveName = () => {
    const n = nameDraft.trim().slice(0, 40);
    if (!n) return;
    setName(n);
    writeLS(NAME_KEY, n);
    setEditingName(false);
    if (voterId && Object.keys(votes).length) {
      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, name: n }),
      }).catch(() => {});
    }
  };

  const save = async () => {
    if (!voterId || active == null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, name, bun: active, ...draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Något gick fel");
      setVotes((data as Voter).buns);
      setToast(`Bulle ${active} sparad`);
      // Next unrated bun, else back to overview
      const next = Array.from({ length: NUM_BUNS }, (_, i) => i + 1).find(
        (n) => n !== active && !isComplete((data as Voter).buns[String(n)])
      );
      if (next) {
        setActive(next);
        setDraft({ ...emptyVote(), ...((data as Voter).buns[String(next)] ?? {}) });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setActive(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Render ----------

  if (state?.revealed) {
    return (
      <main className="page">
        <Header subtitle="Röstningen är stängd" />
        <section className="group">
          <div className="empty">
            <p className="big-emoji">🕯️</p>
            <h2>Resultatet är avslöjat!</h2>
            <p className="muted">Spana in den stora skärmen.</p>
            <a className="btn btn--primary" href="/resultat">
              Visa resultatet
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (!name || editingName) {
    return (
      <main className="page">
        <Header subtitle="Betygsätt 8 lussebullar och gissa vilken som är vilken." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <p className="group-title">Ditt namn</p>
          <section className="group">
            <input
              id="name"
              className="field"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Namn"
              autoComplete="given-name"
              maxLength={40}
              autoFocus
            />
          </section>
          <p className="group-footer">Namnet syns på topplistan över bästa gissare.</p>
          <button className="btn btn--primary btn--block" disabled={!nameDraft.trim()}>
            {editingName ? "Spara" : "Börja rösta"}
          </button>
          {editingName && (
            <button type="button" className="btn btn--plain btn--block" onClick={() => setEditingName(false)}>
              Avbryt
            </button>
          )}
        </form>
      </main>
    );
  }

  const done = Array.from({ length: NUM_BUNS }, (_, i) => i + 1).filter((n) => isComplete(votes[String(n)])).length;

  if (active != null) {
    const candidates = state?.candidates ?? [];
    const usedBy = (idx: number) =>
      Object.entries(votes)
        .filter(([b, v]) => Number(b) !== active && v.guess === idx)
        .map(([b]) => b);
    const ready = isComplete(draft);
    const sum = (draft.look ?? 0) + (draft.taste ?? 0) + (draft.texture ?? 0);

    return (
      <main className="page page--nav">
        <nav className="navbar">
          <button className="navbar__back" onClick={() => setActive(null)}>
            <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden>
              <path d="M10 2 2 10l8 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Bullar
          </button>
          <span className="navbar__title">Bulle {active}</span>
          <span className="navbar__right">
            {done}/{NUM_BUNS}
          </span>
        </nav>

        <div className="bun-hero">
          <Bun size={72} />
          <div className="bun-hero__text">
            <h1 className="large-title">Bulle {active}</h1>
            <p className="muted">Betygsätt från 1 till 10</p>
          </div>
          <div className="bun-hero__sum">
            <span>{ready ? sum : "–"}</span>
            <small>av 30</small>
          </div>
        </div>

        {CRITERIA.map((c) => (
          <ScoreRow
            key={c.key}
            label={c.label}
            emoji={c.emoji}
            value={draft[c.key]}
            onChange={(v) => setDraft((d) => ({ ...d, [c.key as Criterion]: v }))}
          />
        ))}

        <p className="group-title">Gissning</p>
        <section className="group">
          <label className="row row--select">
            <span className="row__label">🕵️ Vilken bulle är det?</span>
            <span className="row__value">
              {draft.guess != null ? candidates[draft.guess] ?? "Välj" : "Välj"}
              <Chevron />
            </span>
            <select
              aria-label="Vilken bulle tror du det är?"
              value={draft.guess ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, guess: e.target.value === "" ? null : Number(e.target.value) }))}
            >
              <option value="">Vet inte</option>
              {candidates.map((c, i) => {
                const used = usedBy(i);
                return (
                  <option key={i} value={i}>
                    {c}
                    {used.length ? ` (gissat på bulle ${used.join(", ")})` : ""}
                  </option>
                );
              })}
            </select>
          </label>
        </section>
        <p className="group-footer">Valfritt – rätt gissningar ger poäng på gissartopplistan.</p>

        {error && <p className="error">{error}</p>}

        <div className="bottom-bar">
          <button className="btn btn--primary btn--block" onClick={save} disabled={!ready || saving}>
            {saving ? "Sparar…" : ready ? "Spara" : "Sätt betyg på alla tre"}
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="page">
      <Header subtitle={`Hej ${name}! Välj en bulle att betygsätta.`} />

      <div className="progress-wrap">
        <div className="progress">
          <div className="progress__bar" style={{ width: `${(done / NUM_BUNS) * 100}%` }} />
        </div>
        <span className="muted small">
          {done}/{NUM_BUNS}
        </span>
      </div>

      <p className="group-title">Bullar</p>
      <section className="group">
        {Array.from({ length: NUM_BUNS }, (_, i) => i + 1).map((n) => {
          const v = votes[String(n)];
          const complete = isComplete(v);
          const total = complete ? v!.look! + v!.taste! + v!.texture! : null;
          return (
            <button key={n} className="row row--link" onClick={() => openBun(n)}>
              <span className="row__icon">
                <Bun size={34} />
              </span>
              <span className="row__label">Bulle {n}</span>
              <span className={`row__value ${complete ? "row__value--done" : ""}`}>
                {complete ? (
                  <>
                    <Check /> {total}/30
                  </>
                ) : (
                  "Ej betygsatt"
                )}
                <Chevron />
              </span>
            </button>
          );
        })}
      </section>
      <p className="group-footer">
        {done === NUM_BUNS
          ? "Alla bullar betygsatta – snyggt! Du kan ändra fram till avslöjandet."
          : "Du kan ändra dina betyg ända fram till avslöjandet."}
      </p>

      <section className="group">
        <button className="row row--link" onClick={() => setEditingName(true)}>
          <span className="row__label">Namn</span>
          <span className="row__value">
            {name}
            <Chevron />
          </span>
        </button>
      </section>
      {toast && <div className="toast">{toast}</div>}
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

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden className="check">
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path d="m5.8 10.3 2.8 2.8 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreRow({
  label,
  emoji,
  value,
  onChange,
}: {
  label: string;
  emoji: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <p className="group-title">
        {emoji} {label}
      </p>
      <section className="group group--pad">
        <div className="scores" role="radiogroup" aria-label={label}>
          {Array.from({ length: MAX_SCORE }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={value === n}
              className={`score ${value === n ? "score--on" : ""}`}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
