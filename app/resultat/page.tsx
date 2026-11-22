"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Stickers from "@/components/Stickers";
import Bun from "@/components/Bun";
import { NUM_BUNS, Results } from "@/lib/types";

const fmt = (n: number | null, d = 1) =>
  n == null ? "–" : n.toLocaleString("sv-SE", { minimumFractionDigits: d, maximumFractionDigits: d });

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ResultsPage() {
  const [data, setData] = useState<Results | null>(null);
  // step 0: intro, 1..NUM_BUNS: reveal places from last to first, NUM_BUNS+1: facit + guessers
  const [step, setStep] = useState(0);
  const lastStep = NUM_BUNS + 1;

  useEffect(() => {
    const load = () =>
      fetch("/api/results")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  // Reset reveal if admin hides results again
  useEffect(() => {
    if (data && !data.revealed) setStep(0);
  }, [data]);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, lastStep)), [lastStep]);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!data?.revealed) return;
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data?.revealed, next, prev]);

  if (!data) {
    return (
      <main className="screen">
        <Header big />
      </main>
    );
  }

  // ---------- Waiting for reveal ----------
  if (!data.revealed) {
    const max = Math.max(1, data.voters);
    return (
      <main className="screen">
        <Stickers variant="screen" />
        <Header big subtitle="Röstningen pågår – betygsätt i mobilen." />
        <div className="screen__stat">
          <span className="screen__count">{data.voters}</span>
          <span>{data.voters === 1 ? "person har röstat" : "personer har röstat"}</span>
        </div>
        <div className="waitbars">
          {data.votesPerBun.map((c, i) => (
            <div key={i} className="waitbar">
              <div className="waitbar__track">
                <div className="waitbar__fill" style={{ height: `${(c / max) * 100}%` }} />
              </div>
              <Bun size={54} />
              <span className="waitbar__label">Bulle {i + 1}</span>
              <span className="waitbar__count">{c} röster</span>
            </div>
          ))}
        </div>
        <p className="screen__pulse">🕯️ Väntar på avslöjandet…</p>
        {data.storage === "memory" && <p className="warn">Ingen databas kopplad – röster sparas bara tillfälligt.</p>}
      </main>
    );
  }

  // ---------- Reveal ----------
  const ranking = data.ranking;
  const shown = (rankIdx: number) => step >= ranking.length - rankIdx; // last place first
  const showFacit = step >= lastStep;
  const winnerShown = shown(0);

  return (
    <main className="screen screen--reveal" onClick={next}>
      {step === 0 && <Stickers variant="screen" />}
      <Header big compact={step > 0} subtitle={step === 0 ? "Dags för avslöjandet!" : winnerShown ? "Årets lussebulle är korad!" : "Resultatet"} />

      {winnerShown && <Confetti />}

      <div className={`results ${showFacit ? "results--facit" : ""}`}>
        <ol className="ranking">
          {ranking.map((r, i) => {
            const visible = shown(i);
            return (
              <li key={r.bun} className={`rank ${visible ? "rank--in" : ""} ${i === 0 && visible ? "rank--winner" : ""}`}>
                <span className="rank__place">{i < 3 ? MEDALS[i] : `${i + 1}.`}</span>
                {visible ? (
                  <>
                    <Bun size={i === 0 ? 70 : 52} />
                    <div className="rank__main">
                      <span className="rank__bun">
                        Bulle {r.bun}
                        {showFacit && (
                          <span className="rank__answer">{r.answer ? <> – {r.answer}</> : <em> – facit saknas</em>}</span>
                        )}
                      </span>
                      <span className="rank__detail">
                        Utseende {fmt(r.look)} · Smak {fmt(r.taste)} · Konsistens {fmt(r.texture)}
                        <span className="rank__votes"> · {r.votes} röster</span>
                        {showFacit && r.answer && r.guesses > 0 && (
                          <span className="rank__correct">
                            {" "}
                            · {r.correctGuesses}/{r.guesses} gissade rätt
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="rank__total">
                      {fmt(r.total)}
                      <small>/30</small>
                    </span>
                  </>
                ) : (
                  <span className="rank__hidden">?</span>
                )}
              </li>
            );
          })}
        </ol>

        {showFacit && (
          <aside className="guessers">
            <h2>🕵️ Bästa gissare</h2>
            {!data.hasAnswers ? (
              <p className="muted">Inget facit inlagt ännu.</p>
            ) : data.guessers.length === 0 ? (
              <p className="muted">Ingen har gissat.</p>
            ) : (
              <ol>
                {data.guessers.slice(0, 10).map((g, i, all) => {
                  // Shared placement for ties (1, 1, 3, …)
                  const place = all.findIndex((x) => x.correct === g.correct);
                  return (
                  <li key={g.name + i} className={place === 0 && g.correct > 0 ? "guesser--top" : ""}>
                    <span>{place < 3 && g.correct > 0 ? MEDALS[place] : `${place + 1}.`}</span>
                    <span className="guesser__name">{g.name}</span>
                    <span className="guesser__score">
                      {g.correct}/{NUM_BUNS}
                    </span>
                  </li>
                  );
                })}
              </ol>
            )}
          </aside>
        )}
      </div>

      <nav className="controls" onClick={(e) => e.stopPropagation()}>
        <button onClick={prev} disabled={step === 0}>
          ◀
        </button>
        <span>
          {step === 0 ? "Tryck för att börja" : step <= NUM_BUNS ? `Plats ${NUM_BUNS - step + 1}` : "Facit"}
        </span>
        <button onClick={next} disabled={step === lastStep}>
          ▶
        </button>
        <button onClick={() => setStep(lastStep)} className="controls__all">
          Visa allt
        </button>
      </nav>
    </main>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = ["#FFC94A", "#F59E1B", "#FFF3C4", "#C2410C", "#E11D48", "#FDE68A"];
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 12) * 0.25}s`,
            animationDuration: `${3 + (i % 5) * 0.6}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}
