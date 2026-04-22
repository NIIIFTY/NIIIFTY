# NIIIFTY @atcute Migration Plan

This document outlines the strategy for overhauling NIIIFTY's AT Protocol integration by migrating from the monolithic `@atproto/api` to the modular **atcute** ecosystem.

## Goal

To improve backend performance, reduce Cloud Function cold start times, and unify our AT Protocol utility stack with the proposed AppView architecture.

## Why Migrate to atcute?

1.  **Modularity**: `@atproto/api` is an "everything" package that pulls in substantial dependencies. `atcute` is split into granular packages (client, repo, jetstream, etc.), allowing us to only ship the code we actually use.
2.  **Modern Architecture**: `atcute` is ESM-first and optimized for performance-sensitive environments like Cloud Functions and Bun.
3.  **Jetstream Alignment**: Our new AppView relies on `@atcute/jetstream`. Using the same ecosystem for our publishing functions ensures consistent type-safety and shared utilities.
4.  **Performance**: Smaller bundle sizes lead to faster deployments and improved cold start latency in Firebase.

## Proposed Changes

### 1. Dependency Overhaul (`functions/package.json`)

We will replace the heavy official SDK with specific `atcute` modules.

- **Remove**: `@atproto/api`, `@ipld/car`, `ipfs-car`
- **Add**: 
  - `@atcute/client`: Lightweight XRPC client.
  - `@atcute/repo`: For repository manipulation (putRecord, etc.).
  - `@atcute/bluesky`: For core ATProto/Bluesky definitions.
  - `@atcute/lex-cli`: (DevDep) To generate types for `cx.vmx.matadisco`.
  - `@atcute/identity`: For fast handle/DID resolution.

### 2. Lexicon Type Generation

Currently, we use loose typing for our custom lexicon. We will use `lex-cli` to generate strict TypeScript definitions.

```bash
# Example command (to be added to scripts)
npx @atcute/lex-cli generate ./lexicons/cx.vmx.matadisco.json -o ./src/atproto/lexicons.ts
```

### 3. Refactoring Authentication (`functions/src/atproto/auth.ts`)

`atcute` handles sessions slightly differently. We will refactor the auth logic to return a lightweight `Client` or `AtpAgent` from the `@atcute/client` suite.

### 4. Refactoring Publishing (`functions/src/atproto/publishRecord.ts`)

The `publishIIIFRecord` function will be updated to use the `@atcute/client` and the generated lexicon types.

**Old Pattern:**
```typescript
const response = await agent.com.atproto.repo.putRecord({ ... });
```

**New Pattern (conceptual):**
```typescript
import { XRPC } from '@atcute/client';
import type { CxVmxMatadisco } from './lexicons';

const xrpc = new XRPC({ handler: ... });
await xrpc.get('com.atproto.repo.putRecord', {
  data: {
    repo: did,
    collection: 'cx.vmx.matadisco',
    rkey: rkey,
    record: { ... } as CxVmxMatadisco.Record,
  }
});
```

## Verification Plan

### Automated Tests
- Update `functions/__tests__/publishRecord.test.ts` to ensure the logic remains identical post-migration.
- Run `npm run build` in `functions/` to verify type safety with the new definitions.

### Manual Verification
- Deploy a test function to a staging environment and verify that a record is successfully published to a test PDS.
- Observe Cloud Function logs for any decrease in initialization time.
