# Task: AT Protocol UI Integration (Manual Publishing & Deterministic Links)

Surfacing published Matadisco records in the NIIIFTY Authoring UI using deterministic record keys and a manual "Publish" workflow to prevent record duplication.

## Specification
- **Publishing Workflow**: Manual. Records are NOT published automatically on creation. 
- **Deterministic Keys (rkey)**: MUST use the Firestore `fileId` to ensure updates overwrite existing records (idempotency).
- **Data Persistence**: 
  - Store **`atDid`** in Firestore. It acts as both the "Published" proof and the repository identifier.
  - The **`atUri`** is derived on-the-fly: `at://${atDid}/cx.vmx.matadisco/${fileId}`.
- **UI States**:
  - **Draft**: Show "Not Published" badge and "Publish to Bluesky" button.
  - **Pending**: Button shows "Broadcasting..." and is disabled while `atprotoPublishRequested` is true.
  - **Published**: Show "Live on Matadisco" badge, an "Update" button, and a link to `https://atproto-browser.vercel.app/${atDid}/at://${atDid}/cx.vmx.matadisco/${fileId}`.

## Technical Tasks

### Backend
- [ ] **atproto/publishRecord.ts**: Update `publishIIIFRecord` to accept `rkey` and use `putRecord`.
- [ ] **index.ts (Cloud Functions)**: 
  - Remove auto-publish from `fileCreated`.
  - In `fileUpdated`, trigger publish when `atprotoPublishRequested` is true.
  - Update doc with **`atDid`** and reset the request flag.
  - Add logic to the "ignore list" to prevent recursive function loops.

### Schema & UI
- [ ] **Types.ts**: Add `atDid` and `atprotoPublishRequested` to the `File` interface.
- [ ] **EditFile.tsx**:
  - Implement the multi-state publishing button.
  - Implement real-time status feedback (Badges + Derived Browser links).

## URI Construction
- **AT URI (Derived)**: `at://[DID]/cx.vmx.matadisco/[FILE_ID]`
- **Deep Link**: `https://atproto-browser.vercel.app/[DID]/at://[DID]/cx.vmx.matadisco/[FILE_ID]`
