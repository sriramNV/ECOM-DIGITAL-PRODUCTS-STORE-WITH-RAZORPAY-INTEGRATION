# Task 5.1 Report: Create Printify API client + types

**Status:** Done

## Files created
- `apps/web/lib/printify/client.ts` — Printify API client with `PrintifyError` class, rate-limit handling (429 retry), and `printifyClient.request<T>()`
- `apps/web/lib/printify/types.ts` — `PrintifyShop`, `PrintifyBlueprint`, `PrintifyPrintProvider`, `PrintifyVariant`, `PrintifyProduct`, `PrintifyOrderInput`, `PrintifyOrder`
- `apps/web/lib/printify/__tests__/client.test.ts` — Unit test for `PrintifyError`

## Test result
```
✓ apps/web/lib/printify/__tests__/client.test.ts (1 test) 1ms
Test Files  1 passed (1)
     Tests  1 passed (1)
```

## Commit
`eb81394` — `feat: add Printify API client with rate limiting`
