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
      setToast(`Bulle ${active} sparad! ✨`);
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
        <div className="card center">
          <p className="big-emoji">🕯️</p>
          <h2>Resultatet är avslöjat!</h2>
          <p className="muted">Spana in den stora skärmen.</p>
          <a className="btn btn--primary" href="/resultat">
            Visa resultatet
          </a>
        </div>
      </main>
    );
  }

  if (!name || editingName) {
    return (
      <main className="page">
        <Header subtitle="Betygsätt 8 lussebullar och gissa vilken som är vilken" />
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <label className="label" htmlFor="name">
            Vad heter du?
          </label>
          <input
            id="name"
            className="input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Ditt namn"
            autoComplete="given-name"
            maxLength={40}
            autoFocus
          />
          <p className="hint">Namnet syns på topplistan över bästa gissare.</p>
          <button className="btn btn--primary btn--block" disabled={!nameDraft.trim()}>
            {editingName ? "Spara namn" : "Börja rösta"}
          </button>
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
      <main className="page">
        <div className="topbar">
          <button className="link" onClick={() => setActive(null)}>
            ← Alla bullar
          </button>
          <span className="pill">
            {done}/{NUM_BUNS} klara
          </span>
        </div>

        <div className="bun-hero">
          <Bun size={84} />
          <div>
            <p className="eyebrow">Bulle nummer</p>
            <p className="bun-hero__num">{active}</p>
          </div>
          <div className="bun-hero__sum">
            <span>{ready ? sum : "–"}</span>
            <small>/ 30</small>
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

        <section className="card">
          <label className="label" htmlFor="guess">
            🕵️ Vilken bulle tror du det är?
          </label>
          <select
            id="guess"
            className="input select"
            value={draft.guess ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, guess: e.target.value === "" ? null : Number(e.target.value) }))}
          >
            <option value="">Vet inte / hoppa över</option>
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
        </section>

        {error && <p className="error">{error}</p>}

        <div className="sticky-actions">
          <button className="btn btn--primary btn--block" onClick={save} disabled={!ready || saving}>
            {saving ? "Sparar…" : ready ? "Spara betyg" : "Sätt betyg på alla tre"}
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="page">
      <Header subtitle={`Hej ${name}! Tryck på en bulle för att betygsätta den.`} />

      <div className="progress">
        <div className="progress__bar" style={{ width: `${(done / NUM_BUNS) * 100}%` }} />
      </div>
      <p className="muted small center">
        {done === NUM_BUNS ? "Alla bullar betygsatta – bra jobbat! Du kan ändra fram till avslöjandet." : `${done} av ${NUM_BUNS} bullar betygsatta`}
      </p>

      <div className="grid">
        {Array.from({ length: NUM_BUNS }, (_, i) => i + 1).map((n) => {
          const v = votes[String(n)];
          const complete = isComplete(v);
          const total = complete ? v!.look! + v!.taste! + v!.texture! : null;
          return (
            <button key={n} className={`tile ${complete ? "tile--done" : ""}`} onClick={() => openBun(n)}>
              <span className="tile__num">{n}</span>
              <Bun size={56} />
              <span className="tile__meta">{complete ? `${total}/30 ✓` : "Betygsätt"}</span>
            </button>
          );
        })}
      </div>

      <p className="center small">
        <button className="link" onClick={() => setEditingName(true)}>
          Inte {name}? Byt namn
        </button>
      </p>
      {toast && <div className="toast">{toast}</div>}
    </main>
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
    <section className="card">
      <div className="score-head">
        <span className="label">
          {emoji} {label}
        </span>
        <span className="score-val">{value ?? "–"}</span>
      </div>
      <div className="scores" role="radiogroup" aria-label={label}>
        {Array.from({ length: MAX_SCORE }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            className={`score ${value === n ? "score--on" : ""} ${value != null && n < value ? "score--below" : ""}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  );
}
