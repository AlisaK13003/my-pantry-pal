import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const configuredRecipeRateLimitMaxRequests = Number(process.env.RECIPE_RATE_LIMIT_MAX_REQUESTS);

export const RECIPE_RATE_LIMIT_MAX_REQUESTS =
  Number.isFinite(configuredRecipeRateLimitMaxRequests) && configuredRecipeRateLimitMaxRequests > 0
    ? configuredRecipeRateLimitMaxRequests
    : 5;

export const RECIPE_RATE_LIMIT_WINDOW: Duration = '10 m';

export const hasUpstashRateLimitConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstashRateLimitConfig ? Redis.fromEnv() : null;

export const recipeRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RECIPE_RATE_LIMIT_MAX_REQUESTS, RECIPE_RATE_LIMIT_WINDOW),
      prefix: 'recipe-generation',
      analytics: true,
    })
  : null;

export const shouldRequireUpstashRateLimit = process.env.NODE_ENV === 'production';
