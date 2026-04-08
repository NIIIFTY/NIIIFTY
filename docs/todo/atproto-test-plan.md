# AT Protocol Publishing: Test Plan

This document details the strategy for verifying the `publishIIIFRecord` functionality in `functions/src/atproto/publishRecord.ts`.

## 1. Automated Unit Testing (Jest)

We utilize Jest to verify the internal logic of the AT Protocol module without requiring network access or valid credentials.

### Objectives
- **Lexicon Mapping**: Verify that `IIIFRecordPayload` is correctly transformed into the Matadisco format (`cx.vmx.matadisco`).
- **Extensions**: Ensure the IIIF extension block (`io.iiif.metadata`) is correctly populated with optional fields (label, summary, provider, etc.).
- **Session Validation**: Confirm the function throws an error if the `AtpAgent` lacks an active session DID.
- **Tag Sanitization**: Verify that the `tags` array always includes `iiif` and handles user-provided duplicates correctly.
- **Preview Blobs**: Test that the `preview` block is conditionally added only when a thumbnail is provided.

### Test Location
`functions/__tests__/publishRecord.test.ts`

### Mocking Strategy
We mock the `AtpAgent` from `@atproto/api` using a structured mock that simulates `agent.com.atproto.repo.createRecord` and `agent.session`.

---

## 2. Manual Integration Harness (CLI)

For end-to-end verification, we use a standalone Node.js script that connects to a live AT Protocol PDS.

### Objectives
- **Authentication**: Verify successful login with a real PDS using App Passwords.
- **Persistence**: Confirm successful record creation and retrieve the global AT URI and CID.
- **Read-Back**: Perform a `getRecord` call immediately after publishing to verify the PDS has indexed the record.
- **Iteration**: Allow for rapid iteration without deploying the full suite of Firebase Functions.

### Test Location
`functions/test-atproto.ts`

### Requirements
- **Environment Variables**: `ATPROTO_SERVICE`, `ATPROTO_IDENTIFIER`, and `ATPROTO_PASSWORD` must be set in `functions/.env`.
- **Execution**: Run via `npx tsx test-atproto.ts` from the `functions` directory.

---

## 3. Verification Workflow

1. **Local Logic**: Run `npm test` to ensure all unit tests pass and logic transforms are correct.
2. **Connectivity**: Run the manual harness to verify authentication and communication with the PDS.
3. **Read-back**: Ensure the manual harness successfully retrieves the record it just created.
4. **Network Discovery**: Copy the resulting AT URI and verify the record's visibility on the network using a PDS explorer or the BlueSky AppView.
