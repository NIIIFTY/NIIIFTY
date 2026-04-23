# Pure Dynamic IIIF Manifest Architecture

Due to the transition to CID placeholders (`__CID__`) in static manifests, the JSON files stored on IPFS or GCS are no longer functional in external viewers without the NIIIFTY proxy. To optimize performance and simplify the pipeline, we are moving to a **Pure Dynamic Architecture** where manifests are generated on-demand by the API proxies.

## Status: Draft / Reviewed (2026-04-19)

---

## Phase 0: Foundation & Shared Types
- [ ] **Type Alignment**: Define a canonical `NiiiftyFile` interface in `src/types/index.ts` (and share with Cloud Functions) that reflects the Firestore storage schema.
- [ ] **Constants**: Move standard IIIF service profiles and context URLs to a shared constants file.

## Phase 1: Shared Generator Logic
- [ ] **Next.js Utility**: Implement `src/lib/iiif-generator.ts` by porting the `getIIIFManifestJson` logic.
- [ ] **Bug Fixes**: Resolve referencing issues (e.g., the `path` module vs variable bug found in `functions/src/iiif.ts`).
- [ ] **Context Awareness**: Ensure the generator accepts a `basePath` parameter to derive all internal IDs (Canvases, Items, Annotations) from the actual serving URL.

## Phase 2: API Proxy Interception & Caching
- [ ] **IPFS Proxy (`/api/ipfs/[cid]/...`)**:
    - [ ] Update `verifyCid` to return the full Firestore `NiiiftyFile` object instead of a boolean (Performance: Saves 1 Firestore read).
    - [ ] Intercept requests for `iiif/index.json`.
    - [ ] Serve the manifest dynamically using `/api/ipfs/[cid]/iiif` as the basis for all IDs.
- [ ] **GCS Proxy (`/api/gcs/[fileId]/...`)**:
    - [ ] Update `verifyFileId` to return the full Firestore `NiiiftyFile` object.
    - [ ] Intercept requests for `iiif/index.json`.
    - [ ] Serve the manifest dynamically using `/api/gcs/[fileId]/iiif` as the basis for all IDs.
- [ ] **Revalidation**: Implement `unstable_cache` with specific tags (e.g., `['iiif', cid]`) to allow for explicit purging.

## Phase 3: Immediate Synchronization
- [ ] **Firestore Triggers**: Add a trigger to the `files` collection that calls `revalidateTag` when metadata (label, summary, tags) is updated.
- [ ] **Dashboard Sync**: Update the `update` Cloud Function logic to trigger a revalidation of the proxy cache if possible, or rely on the Firestore trigger.

## Phase 4: Backend Cleanup
- [ ] **Cloud Functions**: Remove all manifest generation and upload logic from `createIIIFManifest` and `getIIIFManifestJson` in `functions/src/iiif.ts`.
- [ ] **Refactor Derivatives**: Focus `createImageIIIFDerivatives` solely on generating image tiles (sharp .tile()).
- [ ] **Simplify Pipeline**: Update `index.ts` and `update.ts` to coordinate only asset processing and storage.

---

## Technical Considerations
- **Manifest ID Consistency**: Manifest IDs must strictly match the URL used to access them to ensure viewer compatibility.
- **Level 0 Image Services**: Ensure `info.json` for tiled images is also handled correctly (either proxied or dynamically generated) to avoid relative path breaks.
- **Error States**: If Firestore metadata is incomplete (e.g., missing dimensions), provide sensible defaults or error responses to prevent viewer crashes.

## Benefits
*   **Latency**: Eliminates the "hop" to IPFS/GCS gateways for small JSON files.
*   **Instant Sync**: Metadata changes in Firestore reflect in the IIIF manifest within milliseconds via cache purging.
*   **Zero Storage Redundancy**: Manifests are no longer stored as static files, reducing storage costs.
*   **Cleaner Proxy**: Removes the need for complex regex/string replacement logic in the proxy route.
