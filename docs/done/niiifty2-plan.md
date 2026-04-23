# NIIIFTY 2 Implementation Plan

The first NIIIFTY grant successfully delivered robust IPFS Storage for IIIF content. NIIIFTY 2 is a foundational project to address the critical remaining challenges for full decentralization: **Stable Identity** and **Global Discovery**.

This implementation plan details the steps to build open-source, reusable Node.js modules for IPNS (Storacha's w3name) and AT Protocol publishing within the existing NIIIFTY project structure. This will enable IIIF content to have stable identifiers and to be globally discoverable through a decentralized push model (Firehose).

## Proposed Changes

We will implement the new features securely on the backend within the existing Firebase Functions environment, creating reusable scripts inside `functions/src/ipns` and `functions/src/atproto`.

---

### Milestone 1: Setup & Architecture

#### Architecture Planning & Scaffolding

- Define the API for the reusable IPNS module and AT Protocol module inside the existing NIIIFTY project's Firebase functions directory.
- Create the structural foundation for the modules:
  - `functions/src/ipns/index.ts`: Entry point for IPNS logic (utilizing Storacha, the evolution of Web3.Storage).
  - `functions/src/atproto/index.ts`: Entry point for AT Protocol publishing logic.
  - Integration with existing backend files: Ensure the Manifest creation flow in Firebase Functions directly triggers these new modules.

---

### Milestone 2: Core Functionality Implementation

#### IPNS Module (Mutable Data Layer)

_Path: `functions/src/ipns/`_

- Update `functions/package.json` to install `@storacha/client` (for IPFS uploads) AND `w3name` (for IPNS name generation and revisions). Notice that the existing codebase currently uses `@web3-storage/w3up-client` in `functions/src/storacha.ts`; Storacha is the evolution of this for storage, but `w3name` remains the dedicated package for the name records.
- Create `generateName.ts`: Logic to provision an IPNS name keypair natively using the `w3name` package's `Name.create()`.
- Create `createNameRevision.ts`: Logic to implement signing for IPNS name revisions via `Name.v0()` and `Name.increment()`, enabling an updated Manifest CID to be pointed to without breaking the stable address.
- Create `publishRevision.ts`: Logic to broadcast the new record to the w3name service using `Name.publish()`.
- Create a unified export inside `functions/src/ipns/index.ts` to make the module easily reusable elsewhere in the codebase.

#### NIIIFTY AT Protocol Publisher Module

_Path: `functions/src/atproto/`_

- Install `@atproto/api` dependency to `functions/package.json`.
- Create `auth.ts`: Handle authentication with an arbitrary AT Protocol account (e.g., Bluesky) via app passwords.
- Create `publishRecord.ts`: Build the reusable Node.js logic to construct and publish IIIF content records to the authenticated AT Protocol account.
- Schema alignment: Design the payload in `publishRecord.ts` to collaborate with emerging standards (e.g., Matadisco schema) to ensure accurate parsing by Firehose indexers.
- Export the AT Protocol logic via `functions/src/atproto/index.ts`.

#### Manifest Logic Integration

_Path: Firebase Functions Handlers_

- Hook up the creation process in the Firebase functions: When a new project is created and pinned, utilize the `ipns` module to generate a stable IPNS URL.
- Update the backend NIIIFTY IIIF Manifest generator to ensure the `@id` field uses the newly generated stable IPNS URL (e.g., `ipns://k51...`) instead of the mutable CID.
- Hook up the update process: Whenever a manifest is edited and re-pinned via the functions, use the `ipns` module to update the w3name revision to the new CID.
- Trigger the AT Protocol publisher module after successful publish from the Firebase Function, announcing the IPNS URL to the network.

---

### Milestone 3: Demo, Docs & Handover

#### "Global Search" Demo & Integration Test Site

- Create a dedicated route in the NIIIFTY app (e.g., `src/app/test-harness/page.tsx`) specifically designed to act as a robust integration proving ground.
- This test site will feature UI controls to manually trigger the new Firebase functions (e.g., "Generate IPNS Name", "Publish IIIF Revision", "Broadcast to ATProto").
- It will also query an existing AT Protocol indexer or the public Firehose to definitively show the content traversing the network successfully over time.
- Ensure the demo renders the results natively in the browser, demonstrating that the IPNS URLs resolve flawlessly to the underlying Manifests.

#### Documentation

- Update `README.md` to explain the NIIIFTY 2 additions.
- Add comprehensive documentation inside `docs/` or directly in the new `functions/src/ipns` and `functions/src/atproto` folders on how to utilize these exports independently.

## Verification Plan

### Automated Tests

- Scaffold Unit and Integration tests using `jest` or `mocha`/`chai` within the `functions/` directory to exhaustively test the isolated backend modules.
- **IPNS Logic Tests:** Test IPNS key generation (`Name.create()`), w3name pointer updates (`Name.increment`), and payload signing offline using mocked dependencies to ensure correct cryptographic behavior without hitting network limits.
- **AT Protocol Tests:** Test AT protocol payload generation and authentication against a sandbox PDS (Personal Data Server).
- **Emulation Tests:** Ensure all new functions integrate correctly with the Firebase Local Emulator Suite. Write tests that mimic a Manifest upload, verifying the emulator properly triggers the IPNS and ATProto flows.
- Ensure the Github CI/CD pipeline requires 100% passing results on these tests before allowing any merges to the main branch.

### Manual Verification via the Robust Test Site

1. **End-to-End Test Harness**: Navigate to the newly created `src/app/test-harness/page.tsx` while running the local `npm run dev` and emulator suite.
2. **Stable ID Test**: Utilize the test UI to simulate creating a new NIIIFTY project. Observe the logs and confirm the generated Manifest has an `ipns://` address in its `@id`.
3. **Mutability Test**: Edit the project via the test interface. Confirm the underlying IPFS CID changes but the `ipns://` Manifest `@id` remains identical and still resolves to the updated content.
4. **Discovery Test**: Use the test site's indexer UI to verify the AT Protocol catches the new and updated metadata via Firehose and displays the correct Manifest via its stable IPNS URL.
