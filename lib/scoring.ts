import { BunResult, Config, GuesserResult, NUM_BUNS, Voter } from "./types";

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function votesPerBun(voters: Voter[]): number[] {
  return Array.from({ length: NUM_BUNS }, (_, i) => {
    const key = String(i + 1);
    return voters.filter((v) => {
      const b = v.buns?.[key];
      return b && (b.look != null || b.taste != null || b.texture != null);
    }).length;
  });
}

export function computeRanking(voters: Voter[], config: Config): BunResult[] {
  const results: BunResult[] = [];
  for (let n = 1; n <= NUM_BUNS; n++) {
    const key = String(n);
    const votes = voters.map((v) => v.buns?.[key]).filter(Boolean);
    const look = avg(votes.map((b) => b!.look).filter((x): x is number => x != null));
    const taste = avg(votes.map((b) => b!.taste).filter((x): x is number => x != null));
    const texture = avg(votes.map((b) => b!.texture).filter((x): x is number => x != null));

    const answerIdx = config.answers?.[key];
    const answer = answerIdx != null ? config.candidates[answerIdx] ?? null : null;

    const guessList = votes.map((b) => b!.guess).filter((x): x is number => x != null);
    const counts = new Map<number, number>();
    guessList.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
    let topGuess: string | null = null;
    let topCount = 0;
    counts.forEach((c, g) => {
      if (c > topCount) {
        topCount = c;
        topGuess = config.candidates[g] ?? null;
      }
    });

    results.push({
      bun: n,
      votes: votes.filter((b) => b!.look != null || b!.taste != null || b!.texture != null).length,
      look,
      taste,
      texture,
      total: (look ?? 0) + (taste ?? 0) + (texture ?? 0),
      answer,
      guesses: guessList.length,
      correctGuesses: answerIdx != null ? guessList.filter((g) => g === answerIdx).length : 0,
      topGuess,
    });
  }
  // Highest total first; tie-break on taste, then bun number
  return results.sort((a, b) => b.total - a.total || (b.taste ?? 0) - (a.taste ?? 0) || a.bun - b.bun);
}

export function computeGuessers(voters: Voter[], config: Config): GuesserResult[] {
  return voters
    .map((v) => {
      let correct = 0;
      let guessed = 0;
      for (let n = 1; n <= NUM_BUNS; n++) {
        const key = String(n);
        const g = v.buns?.[key]?.guess;
        if (g == null) continue;
        guessed++;
        if (config.answers?.[key] != null && config.answers[key] === g) correct++;
      }
      return { name: v.name || "Anonym", correct, guessed };
    })
    .filter((g) => g.guessed > 0)
    .sort((a, b) => b.correct - a.correct || a.name.localeCompare(b.name, "sv"));
}
