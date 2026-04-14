# AT Protocol Publishing & Discovery Architecture: Deep Dive

This document outlines the architectural plan for implementing native AT Protocol publishing and global discovery for IIIF manifests, fulfilling the vision of the NIIIFTY 2.0 grant.

## 1. Authentication Strategy (App Passwords via Environment Variables)

A key requirement of NIIIFTY 2.0 is allowing institutions (GLAM orgs) to publish IIIF manifests directly to their **own personal Bluesky/AT Protocol accounts** rather than a centralized, single-purpose NIIIFTY service account.

Because NIIIFTY is designed as infrastructure that an institution operates (or where the backend is securely managed on their behalf), the most robust and secure approach is to use **AT Protocol App Passwords** configured directly in the server environment variables (`.env`).

- **Why Not OAuth?** OAuth is designed for multi-tenant SaaS applications where a stranger logs into a web UI and you need temporary permission to post as them.
- **Why App Passwords?** Since the GLAM org acts as the administrator of their own NIIIFTY backend instance, they can securely provision a revocable App Password from their Bluesky account settings and drop it into their Firebase secrets. The NIIIFTY Node.js publisher runs securely as a "headless bot" authorized specifically by that institution. This limits scope and prevents the need for building complex browser-based authentication flows.

## 2. The Core Paradigm Shift: From "Pull" to "Push"

Currently, discovering IIIF content relies on centralized aggregators crawling ("pulling") data from isolated institutional silos. This is slow, fragile, and expensive to maintain.

The AT Protocol (the underlying network powering Bluesky) solves this by providing a unified, global **Firehose**. By switching to a "Push" model, NIIIFTY allows any institution or user to broadcast their IIIF manifest updates structurally to the global network. Indexers simply listen to this Firehose in real-time, instantly discovering entirely new collections without having to know they existed beforehand.

## 3. Phase 1: Semantic Publishing (The Matadisco Lexicon)

Right now, NIIIFTY broadcasts IIIF metadata using the **Matadisco Lexicon** (`cx.vmx.matadisco`). This lexicon provides a generic wrapper for "resources" and supports extensible metadata blocks.

### A. The Lexicon Structure

NIIIFTY records align with the official [cx.vmx.matadisco](https://lexicon.garden/lexicon/did:plc:3mdq56yhyqq5k6d4guztheaf/cx.vmx.matadisco) schema. Although the official schema is minimal, it is **open**, allowing NIIIFTY to embed the following additional semantic fields:

- **Root Fields (Official)**:
    - `resource`: (String, Required) The stable IPNS HTTPS gateway URL for the IIIF Manifest.
    - `publishedAt`: (String, Required) ISO timestamp of publication.
    - `preview`: (Object, Optional) Contains `url` and `mimeType`.
- **NIIIFTY Extensions (Allowed)**:
    - `cid`: (String, Optional) The immutable CID for IPFS verifiability.
    - `tags`: (String Array) Subject tags for indexing (always includes `iiif`).
    - **IIIF Extension Block (`io.iiif.metadata`)**:
        - `label`: (String, Optional) Title of the resource.
        - `summary`: (String, Optional) Short description.
        - `provider`: (String, Optional) Publishing institution.
        - `rights`: (String, Optional) License/Rights URI.
        - `type`: (String, Optional) IIIF type (e.g., `Manifest`, `Collection`).
        - `metadata`: (Map, Optional) Arbitrary key-value pairs from the manifest.

### B. The Publisher Implementation

Implemented in `functions/src/atproto/publishRecord.ts`, the publisher constructs a typed record targeting the custom lexicon instead of a generic text post.

```typescript
// Core Publishing Logic
await agent.com.atproto.repo.createRecord({
  repo: agent.session?.did,
  collection: 'cx.vmx.matadisco',
  record: {
    $type: 'cx.vmx.matadisco',
    resource: payload.id,
    cid: payload.cid,
    publishedAt: new Date().toISOString(),
    tags: ['iiif', ...payload.tags],
    iiif: {
      $type: 'io.iiif.metadata',
      label: payload.label,
      summary: payload.summary,
      // ...other fields
    }
  },
});
```

This transforms the AT Protocol account from a "microblogging profile" into a decentralized, verifiable IIIF registry.

## 4. Phase 2: Interfacing with the External Discovery Relay

Another team is responsible for building the actual AT Protocol relay and Indexer daemon that consumes the Firehose. NIIIFTY's responsibility ends after successfully publishing the structured metadata payload.

For testing and integration purposes, we will interface with this external relay's Database/API.

### The Relay Integration

We expect the external relay to provide a queryable API or database endpoint that contains the indexed IIIF records it has caught from the Firehose.

- Our test harness will make network requests to this external relay to confirm that our broadcasts are being successfully parsed and stored globally.

## 5. Phase 3: The Integration Test Harness

The final deliverable is bringing this indexed data back to the user to prove the end-to-end flow is functional.

### The Test Harness Route

We will build out `src/app/test-harness/page.tsx` (or a dedicated integration route).

- **Relay Query Interface:** A UI component that pings the external AT Protocol relay's database to verify the newest IIIF manifests are visible.
- **Viewer Integration:** Clicking a result returned from the relay passes the indexed IPNS URL directly to the Universal Viewer component to prove resolution.

## 6. Step-by-Step Implementation Roadmap

1. **Step 1: Publisher Calibration.** Ensure `publishRecord.ts` outputs the exact `cx.vmx.matadisco` schema. [DONE]
2. **Step 2: Test Suite.** Implement unit tests and CLI harness to verify publishing logic.
3. **Step 3: Build Test Harness UI.** Create the Integration Test page in the Next.js frontend.
4. **Step 4: Connect to Relay API.** Ensure the Test Harness can query the database built by the external Relay team.
5. **Step 5: End-to-End Test.** Upload a file via NIIIFTY -> Watch it broadcast as a custom record -> Query the external Relay -> See it appear seamlessly in our test harness.

## 7. Verification & Testing

For detailed instructions on unit testing and manual integration verification, see: [atproto-test-plan.md](atproto-test-plan.md)
