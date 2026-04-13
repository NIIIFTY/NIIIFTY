# Unified NIIIFTY Migration & Publishing Architecture

This plan consolidates the migration of backend storage to **Filebase**, the implementation of deterministic **IPFS Version Pinning**, and the integration of **AT Protocol Manual Publishing**. These three efforts represent a complete, end-to-end pipeline upgrade that resolves sunsetting constraints from Storacha while strengthening version control and decentralization mechanisms.

## User Review Required
> [!IMPORTANT]
> **Gateway Cost Confirmation**: We are replacing the free `w3s.link` gateway with a dedicated Filebase gateway (e.g., `https://[gateway].myfilebase.com`). This requires a paid Filebase Standard tier.

## Proposed Changes

### Storage Backend (Filebase Migration)
*   **Dependency Shift**: Remove `@storacha/client` and `w3name` in favor of `@aws-sdk/client-s3` and standard HTTP clients.
*   **Uploads**: Modify directory upload functions to package items into a `.car` file in memory (using libraries like `ipfs-car`) and upload to Filebase S3 using the `x-amz-meta-import: car` header. *(Note: Because the UI strictly limits uploads to 32MB, packaging `.car` buffers in Cloud Function RAM (e.g. 512MB allocated) is perfectly safe and ensures each exhibit gets its own deterministic folder CID).*
*   **IPNS Delegation**: Update `generateName.ts` to store private keys in GCP Secret Manager, and `publishRevision.ts` to push IPNS updates on-demand via Filebase's `/api/v0/name/publish` RPC endpoint.

---

### Gateway & Routing (IPFS Proxy Pinning)
*   **Modify IPNS Proxy (`/api/ipns/[...path]`)**: Update to proxy from the newly provisioned Filebase Dedicated Gateway instead of `w3s.link`.
*   **Create IPFS Proxy Route (`src/app/api/ipfs/[cid]/[...path]/route.ts`)**:
    *   **Auth**: Verify the `cid` exists in Firestore (`adminDb.collection('files').where('cid', '==', cid)`).
    *   **Routing Logic**: 
        *   If the requested asset is `index.json`, fetch it from the Filebase gateway and perform an on-the-fly regex replacement, swapping absolute `https://niiifty.com/api/ipns/...` URLs with absolute, pinned `https://niiifty.com/api/ipfs/[cid]/...` URLs. 
        *   If a non-JSON asset (e.g., image, GLB), proxy and stream it directly from the Filebase gateway.
    *   **CORS**: Maintain `Access-Control-Allow-Origin: '*'` headers for Exhibit.so viewer compatibility.

---

### Frontend & Publishing (AT Protocol Integration)
*   **Firestore Schema (Backend)**:
    *   Remove legacy auto-publish logic triggered on `fileCreated`.
    *   Update `fileUpdated` function to watch for `atprotoPublishRequested === true`.
    *   When triggered, invoke `publishIIIFRecord(rkey, putRecord)` using the deterministic Firestore `fileId` as the `rkey`. Update the document with the resulting `atDid` and reset the request flag to `false`.
*   **Frontend UI Updates (`EditFile.tsx`)**:
    *   Add `atDid` (string) and `atprotoPublishRequested` (boolean) to the `File` TS interfaces.
    *   Implement a multi-state **Publish to Bluesky** button (Draft -> Broadcasting -> Published).
    *   Derive and display the AT URI: `at://${atDid}/cx.vmx.matadisco/${fileId}`.
    *   Provide the direct deep link string: `https://atproto-browser.vercel.app/${atDid}/at://${atDid}/cx.vmx.matadisco/${fileId}`.

## Verification Plan

### Automated Tests
- **Storage**: Run an E2E backend test to upload a document to Filebase and verify it successfully returns the resulting `CID` root.
- **Proxy**: Invoke the new `/api/ipfs/[cid]/index.json` internally to ensure regex replacement functions correctly over the raw IPFS response.

### Manual Verification
- **E2E UI & AT Proto Flow**: 
    1. Upload a lightweight `.glb`/manifest through the NIIIFTY UI. Wait for it to route via IPNS to ensure the basic proxy is functioning. 
    2. Click the new "Publish to Bluesky" button to trigger the `atprotoPublishRequested` cloud function flip.
    3. Monitor the Firestore document to see the status reset and populate `atDid`.
    4. Follow the deep link into `atproto-browser.vercel.app` and confirm the `cx.vmx.matadisco` record reliably points back to the immutable `api/ipfs/[cid]` deterministic URLs.
