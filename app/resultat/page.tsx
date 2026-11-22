"use client";

import { useCallback, useEffect, useState } from "react";
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
        <h1 className="screen-title">Det stora Saffransbulle-testet</h1>
      </main>
    );
  }

  // ---------- Waiting for reveal ----------
  if (!data.revealed) {
    const max = Math.max(1, data.voters);
    return (
      <main className="screen">
        <Stickers variant="screen" />
        <h1 className="screen-title">
          Det stora
          <br />
          Saffransbulle-testet
        </h1>
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
              <Bun size={48} />
              <span className="waitbar__label">Bulle {i + 1}</span>
              <span className="waitbar__count">{c} röster</span>
            </div>
          ))}
        </div>
        <p className="screen__pulse">Väntar på resultatet…</p>
        {data.storage === "memory" && <p className="warn">Ingen databas kopplad – röster sparas bara tillfälligt.</p>}
      </main>
    );
  }

  // ---------- Reveal ----------
  const ranking = data.ranking;
  const shown = (rankIdx: number) => step >= ranking.length - rankIdx; // last place first
  const showFacit = step >= lastStep;
  const winnerShown = shown(0);
  const title = step === 0 ? "Dags för avslöjandet!" : winnerShown ? "Årets lussebulle är korad!" : "Resultatet";

  return (
    <main className="screen screen--reveal" onClick={next}>
      {step === 0 && <Stickers variant="screen" />}
      <h1 className={`screen-title ${step > 0 ? "screen-title--compact" : ""}`} key={title}>
        {title}
      </h1>

      {winnerShown && <Confetti />}

      <div className={`results ${showFacit ? "results--facit" : ""} ${step === 0 ? "results--intro" : ""}`}>
        <ol className="ranking">
          {ranking.map((r, i) => {
            const visible = shown(i);
            return (
              <li key={r.bun} className={`rank ${visible ? "rank--in" : ""} ${i === 0 && visible ? "rank--winner" : ""}`}>
                <span className="rank__place">{i + 1}</span>
                {visible ? (
                  <>
                    <div className="rank__main">
                      <span className="rank__title">
                        <span className="rank__bun">Bulle {r.bun}</span>
                        {showFacit && <span className="rank__answer">{r.answer ?? "Facit saknas"}</span>}
                      </span>
                      <span className="rank__detail">
                        Utseende {fmt(r.look)} · Smak {fmt(r.taste)} · Konsistens {fmt(r.texture)} · {r.votes} röster
                        {showFacit && r.answer && r.guesses > 0 && (
                          <>
                            {" "}
                            · {r.correctGuesses}/{r.guesses} gissade rätt
                          </>
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
                  const medal = place < 3 && g.correct > 0;
                  return (
                    <li key={g.name + i} className={place === 0 && g.correct > 0 ? "guesser--top" : ""}>
                      <span className="guesser__place">{medal ? MEDALS[place] : `${place + 1}.`}</span>
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

// Deterministic pseudo-random so server/client and re-renders stay stable
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const COLORS = ["#FFCC00", "#FFE066", "#161514", "#FFFFFF", "#E11D48", "#3F9E4D", "#F29B18", "#FFF3DF"];

function Confetti() {
  const rain = Array.from({ length: 220 }, (_, i) => i);
  const burst = Array.from({ length: 160 }, (_, i) => i);
  const buns = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="confetti" aria-hidden>
      <div className="confetti__flash" />
      {/* Two cannons from the bottom corners */}
      {burst.map((i) => {
        const left = i % 2 === 0;
        const shape = i % 3;
        return (
          <span
            key={`b${i}`}
            className={`confetti__piece confetti__piece--burst confetti__shape-${shape}`}
            style={{
              [left ? "left" : "right"]: "-20px",
              background: COLORS[i % COLORS.length],
              ["--bx" as string]: `${(left ? 1 : -1) * (15 + rnd(i, 1) * 55)}vw`,
              ["--by" as string]: `${-(45 + rnd(i, 2) * 55)}vh`,
              ["--rot" as string]: `${(rnd(i, 3) * 1440 - 720).toFixed(0)}deg`,
              ["--s" as string]: `${0.7 + rnd(i, 4) * 1.1}`,
              animationDelay: `${(rnd(i, 5) * 0.35).toFixed(2)}s`,
              animationDuration: `${(2.6 + rnd(i, 6) * 1.6).toFixed(2)}s`,
            }}
          />
        );
      })}
      {/* Flying buns */}
      {buns.map((i) => {
        const left = i % 2 === 0;
        return (
          <img
            key={`bun${i}`}
            src="/lussebulle.png"
            alt=""
            className="confetti__bun"
            style={{
              [left ? "left" : "right"]: "-60px",
              ["--bx" as string]: `${(left ? 1 : -1) * (20 + rnd(i, 7) * 45)}vw`,
              ["--by" as string]: `${-(55 + rnd(i, 8) * 40)}vh`,
              ["--rot" as string]: `${(rnd(i, 9) * 900 - 450).toFixed(0)}deg`,
              animationDelay: `${(0.1 + rnd(i, 10) * 0.5).toFixed(2)}s`,
            }}
          />
        );
      })}
      {/* Endless rain */}
      {rain.map((i) => (
        <span
          key={`r${i}`}
          className={`confetti__piece confetti__piece--rain confetti__shape-${i % 3}`}
          style={{
            left: `${(rnd(i, 11) * 100).toFixed(1)}%`,
            background: COLORS[(i * 3) % COLORS.length],
            ["--sway" as string]: `${(rnd(i, 12) * 160 - 80).toFixed(0)}px`,
            ["--rot" as string]: `${(rnd(i, 13) * 1080).toFixed(0)}deg`,
            ["--s" as string]: `${0.6 + rnd(i, 14) * 1}`,
            animationDelay: `${(0.6 + rnd(i, 15) * 5).toFixed(2)}s`,
            animationDuration: `${(3.5 + rnd(i, 16) * 3.5).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
