import { Redis } from "@upstash/redis";
import { Config, Voter, defaultConfig } from "./types";

const CONFIG_KEY = "lusse:config";
const VOTES_KEY = "lusse:votes";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export const storageKind: "redis" | "memory" = redis ? "redis" : "memory";

// In-memory fallback for local development without Redis.
// NOTE: On Vercel this is NOT shared between requests – connect Upstash Redis.
const g = globalThis as unknown as {
  __lusseMem?: { config: Config; votes: Record<string, Voter> };
};
const mem = (g.__lusseMem ??= { config: defaultConfig(), votes: {} });

export async function getConfig(): Promise<Config> {
  if (!redis) return mem.config;
  const c = await redis.get<Config>(CONFIG_KEY);
  return { ...defaultConfig(), ...(c ?? {}) };
}

export async function setConfig(config: Config): Promise<void> {
  if (!redis) {
    mem.config = config;
    return;
  }
  await redis.set(CONFIG_KEY, config);
}

export async function getVoter(id: string): Promise<Voter | null> {
  if (!redis) return mem.votes[id] ?? null;
  return (await redis.hget<Voter>(VOTES_KEY, id)) ?? null;
}

export async function saveVoter(voter: Voter): Promise<void> {
  if (!redis) {
    mem.votes[voter.id] = voter;
    return;
  }
  await redis.hset(VOTES_KEY, { [voter.id]: voter });
}

export async function getAllVoters(): Promise<Voter[]> {
  if (!redis) return Object.values(mem.votes);
  const all = await redis.hgetall<Record<string, Voter>>(VOTES_KEY);
  return all ? Object.values(all) : [];
}

export async function deleteVoter(id: string): Promise<void> {
  if (!redis) {
    delete mem.votes[id];
    return;
  }
  await redis.hdel(VOTES_KEY, id);
}

export async function clearVotes(): Promise<void> {
  if (!redis) {
    mem.votes = {};
    return;
  }
  await redis.del(VOTES_KEY);
}
