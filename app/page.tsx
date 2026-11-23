"use client";

import { useCallback, useEffect, useState } from "react";
import Header, { Brand } from "@/components/Header";
import Stickers from "@/components/Stickers";
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
  const [home, setHome] = useState(false);

  // Opened via the brand link from another page (/?start) → show the start screen
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("start")) {
      setHome(true);
      window.history.replaceState(null, "", "/");
    }
  }, []);

  const goHome = () => {
    setActive(null);
    setEditingName(false);
    setNameDraft(name);
    setHome(true);
    window.scrollTo({ top: 0 });
  };

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
    setHome(false);
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

  // Once the results are revealed, go straight to the results screen
  useEffect(() => {
    if (state?.revealed) window.location.replace("/resultat");
  }, [state?.revealed]);

  // ---------- Render ----------

  if (state?.revealed) return <main className="page" />;

  if (!name || editingName || home) {
    return (
      <main className="page page--start">
        {editingName ? (
          <Header title="Byt namn" />
        ) : (
          <>
            <h1 className="start-title">
              Det stora
              <br />
              saffransbulle
              <br />
              -testet
            </h1>
            <Stickers />
            <p className="start-sub">Betygsätt bullarna på utseende, smak och konsistens – och gissa vilken som är vilken.</p>
          </>
        )}
        <form
          className="name-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <input
            id="name"
            className="input input--white"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Ditt namn"
            aria-label="Ditt namn"
            autoComplete="given-name"
            maxLength={40}
          />
          <button className="btn btn--dark btn--block" disabled={!nameDraft.trim()}>
            {editingName ? "Spara" : name ? "Fortsätt rösta" : "Börja rösta"}
          </button>
          {editingName && (
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setEditingName(false)}>
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
      <main className="page">
        <nav className="topbar">
          <button className="chip" onClick={() => setActive(null)}>
            ← Bullar
          </button>
          <span className="chip chip--plain">
            {done}/{NUM_BUNS} betygsatta
          </span>
        </nav>

        <div className="bun-hero">
          <span className="bun-hero__art">
            <Bun size={104} />
          </span>
          <h1 className="bulle-title">Bulle {active}</h1>
          <span className={`sum-sticker ${ready ? "sum-sticker--on" : ""}`}>{ready ? `${sum}/30` : "–/30"}</span>
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

        <section className="block">
          <div className="block__head">
            <span>🕵️ Vilken bulle är det?</span>
          </div>
          <div className="select-wrap">
            <select
              className="input select"
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
          </div>
        </section>

        {error && <p className="error">{error}</p>}

        <div className="bottom-bar">
          <button className="btn btn--dark btn--block" onClick={save} disabled={!ready || saving}>
            {saving ? "Sparar…" : ready ? "Spara betyg" : "Sätt betyg på alla tre"}
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="page">
      <Brand onClick={goHome} />
      <p className="hero__sub hero__sub--solo">Betygsätt bullarna!</p>

      <div className="progress-wrap">
        <div className="progress">
          <div className="progress__bar" style={{ width: `${(done / NUM_BUNS) * 100}%` }} />
        </div>
        <span className="muted small">
          {done}/{NUM_BUNS}
        </span>
      </div>

      <div className="grid">
        {Array.from({ length: NUM_BUNS }, (_, i) => i + 1).map((n) => {
          const v = votes[String(n)];
          const complete = isComplete(v);
          const total = complete ? v!.look! + v!.taste! + v!.texture! : null;
          return (
            <button key={n} className={`tile ${complete ? "tile--done" : ""}`} onClick={() => openBun(n)}>
              {complete ? (
                <>
                  <span className="tile__num">{n}</span>
                  <Bun size={44} />
                  <span className="tile__meta">{total}/30</span>
                  <span className="tile__badge">Klar ✓</span>
                </>
              ) : (
                <>
                  <Bun size={58} />
                  <span className="tile__bignum">{n}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <p className="note center">
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
    <section className="block">
      <div className="block__head">
        <span>
          {emoji} {label}
        </span>
      </div>
      <div className="scores" role="radiogroup" aria-label={label}>
        {Array.from({ length: MAX_SCORE }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            className={`score ${value === n ? "score--on" : ""}`}
            style={{ ["--tilt" as string]: `${n % 2 ? -4 : 4}deg` }}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  );
}
