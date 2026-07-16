# Session Progress Log

## Current State

**Last Updated:** 2026-07-15 16:00
**Session ID:** sess-017
**Active Feature:** feat-003 - Rate Limiting Middleware

## Status

### What's Done

- [x] TokenBucket class with configurable rate, burst, and refill interval
- [x] Redis backend for distributed counters (shared across API replicas)
- [x] In-memory backend for dev/testing (no Redis dependency)
- [x] Middleware tests passing (11 tests, in-memory backend)

### What's In Progress

- [ ] Per-endpoint YAML configuration parser
  - Details: Parse `rate_limits.yaml` to map endpoint patterns to rate/burst values
  - Blockers: Need to decide YAML schema — flat map vs nested with defaults

### What's Next

1. Finalize YAML schema and implement config parser
2. Add Redis-backend integration tests (testcontainers-based)
3. Wire middleware into FastAPI app with config hot-reload
4. Test with concurrent requests using locust

## Blockers / Risks

- [ ] **YAML schema design**: Flat `{"/users": {rate: 100, burst: 20}}` vs nested with `default:` block. Flat is simpler but duplicates defaults. Nested reduces repetition but adds complexity.
- [ ] **Redis in CI**: Need to add Redis service to GitHub Actions workflow. testcontainers-python handles this locally but CI needs explicit service definition.

## Decisions Made

- **Token bucket over fixed window**: Chose token bucket for burst tolerance. Fixed window would reject valid bursts at window boundaries.
  - Context: Product requires smooth UX during traffic spikes, not hard cutoffs.
  - Alternatives considered: Fixed window (discarded — boundary spikes), leaky bucket (discarded — no burst support).
- **Redis + in-memory backends**: Two backends sharing same abstract interface. In-memory for dev; Redis for staging/prod.
  - Context: Devs shouldn't need Redis running locally for basic testing.
  - Alternatives considered: Redis-only with mock (discarded — mock surface too large, tests would be brittle).

## Files Modified This Session

- `src/middleware/rate_limiter.py` - TokenBucket class, AbstractBackend, InMemoryBackend, RedisBackend
- `src/middleware/config.py` - RateLimitConfig dataclass (in progress: YAML parser)
- `tests/middleware/test_rate_limiter.py` - 11 tests passing (in-memory backend)
- `pyproject.toml` - Added redis[hiredis] and pyyaml dependencies

## Evidence of Completion

- [x] Tests pass: `python3 -m pytest` — 52 tests passing (scaffold: 23, users: 18, rate_limiter: 11)
- [x] Syntax check: `python3 -m compileall -q -x '(^|/)(\.?venv|env|node_modules|build|dist|__pycache__)(/|$)' .` — clean
- [ ] Manual verification: YAML config parser still in progress

## Notes for Next Session

Config parser is ~1 hour of work once YAML schema is decided.
After parser, Redis integration tests are ~1.5 hours (need testcontainers setup).
Then full app wiring and concurrent load test with locust.
