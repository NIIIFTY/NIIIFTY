# Reusable Open-Source Node.js Modules

This document outlines the plan for extracting the core identity and publishing logic from the NIIIFTY Firebase backend into standalone, generic, open-source Node.js modules. This satisfies the grant deliverable requiring these modules to be reusable by the broader GLAM community without relying on NIIIFTY's specific infrastructure.

## 1. Current State vs. Goal State

**Current State:**

- The IPNS (`functions/src/ipns`) and AT Protocol (`functions/src/atproto`) logic are tightly coupled within the Firebase Functions directory.
- They are built as internal utility files rather than published packages.

**Goal State:**

- Extract the core logic into two distinct, framework-agnostic NPM packages (e.g., `@niiifty/ipns-publisher` and `@niiifty/atproto-publisher`).
- These packages should have zero dependencies on Firebase, Firestore, or Google Cloud.
- Any developer (or GLAM institution) should be able to `npm install` these packages and use them in their own independent Express, Next.js, or vanilla Node.js applications.

## 2. Extraction Strategy (Monorepo vs. Separate Repos)

**Recommendation:** Utilize NPM Workspaces within the existing GitHub repository (monorepo approach) to manage these separate packages alongside the main NIIIFTY app.

_Alternative:_ Create completely separate GitHub repositories for each module. (Monorepo is usually easier for initial development and synchronized releases).

Let's assume a monorepo approach for this plan:

1. Create a `packages/` directory at the root of the project.
2. Initialize NPM workspaces by adding `"workspaces": ["packages/*"]` to the root `package.json`.

## 3. Module 1: IPNS Publisher (`@niiifty/ipns-publisher`)

**Scope:**

- Implement the `w3name` service logic to generate stable, mutable IPNS pointers.
- Manage IPNS key generation, serialization, and revision publishing.

**Planned Architecture:**

- **Directory:** `packages/ipns-publisher/`
- **Dependencies:** `w3name`
- **Exports:**
  - `generateKeyplate()`: Returns a new IPNS name and private key string.
  - `createRevision(keyRaw, currentRevisionRaw, newCid)`: Returns a new revision pointing to the updated CID.
  - `publishRevision(revision, keyRaw)`: Broadcasts the revision to the IPFS network.

**Decoupling Steps:**

- Move `functions/src/ipns/generateName.ts` and related logic.
- Ensure the module accepts generic base64 strings or Uint8Arrays for keys/revisions, not Firebase `DocumentSnapshot` objects.

## 4. Module 2: AT Protocol IIIF Publisher (`@niiifty/atproto-iiif-publisher`)

**Scope:**

- Build a standalone module that constructs and publishes IIIF content records to an arbitrary AT Protocol account using the `com.matadisco.iiif.manifest` lexicon.

**Planned Architecture:**

- **Directory:** `packages/atproto-iiif-publisher/`
- **Dependencies:** `@atproto/api`
- **Exports:**
  - `authenticate(service, identifier, appPassword)`: Returns an authenticated agent.
  - `publishManifest(agent, payload)`: Validates and publishes the IIIF record to the Matadisco schema.

**Decoupling Steps:**

- Move `functions/src/atproto/auth.ts` and `functions/src/atproto/publishRecord.ts`.
- The generic payload (`IIIFRecordPayload` interface) we just defined in `publishRecord.ts` is perfectly decoupled from Firebase. What remains is ensuring the package setup is clean.

## 5. Implementation Steps

1. **Scaffold Packages:** Create the `packages/ipns-publisher` and `packages/atproto-iiif-publisher` directories with their own `package.json` and `tsconfig.json`.
2. **Migrate Code:** Move the decoupled logic from `functions/src/` into the respective packages.
3. **Local Linking:** Link the Firebase functions backend to use these newly extracted local packages as workspace dependencies.
4. **Publishing Structure:** Add export maps and build scripts (using `tsc` or `tsup`) to generate CommonJS and ESM outputs for the NPM registry.
5. **Documentation:** Add a `README.md` to each package detailing how external developers can install and use them independently.
