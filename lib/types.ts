export const NUM_BUNS = 8;
export const MIN_SCORE = 1;
export const MAX_SCORE = 10;

export type Criterion = "look" | "taste" | "texture";

export const CRITERIA: { key: Criterion; label: string; emoji: string }[] = [
  { key: "look", label: "Utseende", emoji: "👀" },
  { key: "taste", label: "Smak", emoji: "😋" },
  { key: "texture", label: "Konsistens", emoji: "🤏" },
];

export type BunVote = {
  look: number | null;
  taste: number | null;
  texture: number | null;
  guess: number | null; // index in config.candidates
};

export type Voter = {
  id: string;
  name: string;
  buns: Record<string, BunVote>; // key = bun number "1".."8"
  updatedAt: number;
};

export type ScreenMode = "qr" | "voting";

export type Config = {
  candidates: string[];
  answers: Record<string, number | null>; // bun number -> candidate index
  revealed: boolean;
  screen: ScreenMode; // what the big screen shows before the reveal
};

export const defaultConfig = (): Config => ({
  candidates: Array.from({ length: NUM_BUNS }, (_, i) => `Alternativ ${i + 1}`),
  answers: {},
  revealed: false,
  screen: "qr",
});

export type PublicState = {
  candidates: string[];
  revealed: boolean;
  numBuns: number;
};

export type BunResult = {
  bun: number;
  votes: number;
  look: number | null;
  taste: number | null;
  texture: number | null;
  total: number; // sum of the three averages, max 30
  answer: string | null;
  correctGuesses: number;
  guesses: number;
  topGuess: string | null;
};

export type GuesserResult = {
  name: string;
  correct: number;
  guessed: number;
};

export type Results =
  | {
      revealed: false;
      screen: ScreenMode;
      voters: number;
      votesPerBun: number[];
      storage: "redis" | "memory";
    }
  | {
      revealed: true;
      voters: number;
      votesPerBun: number[];
      storage: "redis" | "memory";
      ranking: BunResult[];
      guessers: GuesserResult[];
      hasAnswers: boolean;
    };
