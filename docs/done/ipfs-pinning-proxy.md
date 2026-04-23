# Task: IPFS Version Pinning Proxy

To support deterministic "version pinning" for downstream consumers (like Exhibit.so) while adhering to the IIIF constraint of absolute URLs, we need to create a server-side dynamic proxy that rewrites manifest URLs on-the-fly.

## Problem Statement
The NIIIFTY backend generates IIIF manifests (`index.json`) containing absolute URLs that point to the mutable IPNS gateway (`https://niiifty.com/api/ipns/[IPNS_NAME]/...`). 
If a consumer application fetches the manifest directly from its IPFS `cid`, the internal assets will still resolve to the IPNS endpoints, breaking version determinism (content updates will silently mutate the exhibit).

## Proposed Solution: `/api/ipfs/[cid]`
Build a parallel Next.js API route that acts similarly to the `/api/ipns/[ipnsKey]` proxy, but specifically for pinned IPFS CIDs. It will dynamically inspect and rewrite `index.json` requests so that all internal absolute paths route back to the pinned IPFS proxy instead of the IPNS proxy.

### Technical Tasks

- [ ] **Create New Route**: Create a new dynamic API route at `src/app/api/ipfs/[cid]/[...path]/route.ts`.
- [ ] **Firestore Verification Guard**: Implement the same security check as the IPNS route to ensure the `cid` belongs to a file actually managed by NIIIFTY.
    - Query: `adminDb.collection('files').where('cid', '==', cid).limit(1).get()`
- [ ] **Proxy & Rewrite Logic**:
    - **Determine Asset Type**:
        - If the requested `relativePath` is **NOT** `index.json`, proxy the request exactly like the IPNS route: fetch from `https://[cid].ipfs.w3s.link/[relativePath]` and stream the body.
        - If the requested `relativePath` **IS** `index.json` (or any `.json` IIIF manifest equivalent):
            1. Fetch the JSON from the IPFS gateway.
            2. Parse it as text.
            3. Perform a global string replacement: 
               * `Replace`: `https://niiifty.com/api/ipns/` (and potentially localhost during dev)
               * `With`: `https://niiifty.com/api/ipfs/`
            4. Alternatively (and more securely), use regex to replace `https://niiifty.com/api/ipns/[ANY_IPNS_KEY]` with `https://niiifty.com/api/ipfs/[cid]`.
            5. Return the modified JSON with appropriate `application/json` headers.
- [ ] **CORS Configuration**: Ensure the route maintains `Access-Control-Allow-Origin: '*'` headers so external viewers like Exhibit.so can consume it natively.

## User Workflow in Consumers (Exhibit.so)
- When a user copies a NIIIFTY URL, Exhibit.so can extract the `cid` (either from Matadisco AT records or a metadata API).
- Exhibit.so invokes the IIIF viewer using `https://niiifty.com/api/ipfs/[cid]/index.json`.
- The IIIF viewer requests `https://niiifty.com/api/ipfs/[cid]/optimized.glb`.
- NIIIFTY pipes the exact byte-for-byte immutable asset from Web3 Storage to the viewer, perfectly pinning the state.
