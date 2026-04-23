# TODO: Multi-Platform Deletion Cleanup

Currently, deleting a file in NIIIFTY only removes the Firestore record and its associated files in GCS. It leaves orphaned records in the AT Protocol network and orphaned CAR files in Filebase (IPFS).

## Goal
Ensure that when a file is deleted from the NIIIFTY admin dashboard, it is also removed from:
- [ ] **AT Protocol**: Delete the corresponding `cx.vmx.matadisco` record.
- [ ] **Filebase**: Delete the `.car` file from the S3 bucket.
- [ ] **GCS**: (Already implemented) Delete the files in the `files/{fileId}/` prefix.

## Proposed Implementation

### 1. Functions Backend

#### Filebase Utility (`functions/src/filebase.ts`)
- **Fix Existing Key Generation**: Currently, `uploadTempFilesToFilebase` uses `path.basename(tempDirPath)` as the base for the `.car` filename, which evaluates to a random timestamp (`Date.now()`). This must be refactored to accept `fileId` and name the upload `${fileId}.car`.
- Add `deleteFilebaseFiles(fileId: string)`:
    - Use `DeleteObjectCommand` from `@aws-sdk/client-s3`.
    - Targets `${fileId}.car` in the `niiifty` bucket.
    - *Note: Existing files uploaded with timestamp keys will remain orphaned unless listed and matched by CID, but this covers all future uploads.*

#### AT Protocol Utility (`functions/src/atproto/publishRecord.ts`)
- Add `deleteIIIFRecord(agent: AtpAgent, rkey: string)`:
    - Use `agent.com.atproto.repo.deleteRecord`.
    - Targets the `cx.vmx.matadisco` collection.
    - Use the `rkey` (which is `fileId`) to execute the deletion.

#### Cloud Functions Entry (`functions/src/index.ts`)
- Update `fileDeleted` trigger:
    - **Crucial**: Add the required secrets to the `runWith` block (`ATPROTO_SERVICE`, `ATPROTO_IDENTIFIER`, `ATPROTO_PASSWORD`, `FILEBASE_ACCESS_TOKEN`, `FILEBASE_SECRET_KEY`) or the function will crash.
    - Extract `atDid` and `cid` from the deleted document snapshot (`snap.data()`).
    - Wrap AT Protocol and Filebase deletions in `try/catch` blocks so a failure in one doesn't block GCS cleanup.
    - If `atDid` exists:
        - Authenticate with AT Protocol.
        - `await deleteIIIFRecord(agent, fileId)`
    - If `cid` exists:
        - `await deleteFilebaseFiles(fileId)`
    - Continue with `deleteGCSFiles`.

## Verification
- Verify deletion via AT Protocol browser (`atproto-browser.vercel.app`).
- Verify deletion via Filebase dashboard.
- Verify GCS bucket is clean.
