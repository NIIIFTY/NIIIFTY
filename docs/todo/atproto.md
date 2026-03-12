# AT Protocol Publishing & Discovery Architecture: Deep Dive

This document outlines the architectural plan for implementing native AT Protocol publishing and global discovery for IIIF manifests, fulfilling the vision of the NIIIFTY 2.0 grant.

## 1. Authentication Strategy (App Passwords via Environment Variables)

A key requirement of NIIIFTY 2.0 is allowing institutions (GLAM orgs) to publish IIIF manifests directly to their **own personal Bluesky/AT Protocol accounts** rather than a centralized, single-purpose NIIIFTY service account.

Because NIIIFTY is designed as infrastructure that an institution operates (or where the backend is securely managed on their behalf), the most robust and secure approach is to use **AT Protocol App Passwords** configured directly in the server environment variables (`.env`).

- **Why Not OAuth?** OAuth is designed for multi-tenant SaaS applications where a stranger logs into a web UI and you need temporary permission to post as them.
- **Why App Passwords?** Since the GLAM org acts as the administrator of their own NIIIFTY backend instance, they can securely provision a revocable App Password from their Bluesky account settings and drop it into their Firebase secrets. The NIIIFTY Node.js publisher runs securely as a "headless bot" authorized specifically by that institution. This limits scope and prevents the need for building complex browser-based authentication flows.

## 2. The Core Paradigm Shift: From "Pull" to "Push"

Currently, discovering IIIF content relies on centralized aggregators crawling ("pulling") data from isolated institutional silos. This is slow, fragile, and expensive to maintain.

The AT Protocol (the underlying network powering Bluesky) solves this by providing a unified, global **Firehose**. By switching to a "Push" model, NIIIFTY allows any institution or user to broadcast their IIIF manifest updates structurally to the global network. Indexers simply listen to this Firehose in real-time, instantly discovering entirely new collections Without having to know they existed beforehand.

## 3. Phase 1: Semantic Publishing (The Matadisco Lexicon)

Right now, the NIIIFTY prototype broadcasts an IPNS URL wrapped in a standard social media post (`app.bsky.feed.post`). To enable machine-to-machine IIIF discovery, we need to move to strongly-typed data repositories using **Custom Lexicons**.

### A. Defining the Lexicon

We will collaborate to finalize the `com.matadisco.iiif.manifest` (or similar) AT Protocol Lexicon. This acts as the schema for the data payload.

Expected fields in the Lexicon schema:

- `manifestId`: (String, Required) The stable IPNS HTTPS gateway URL (e.g., `https://[ipnsName].ipns.dweb.link`).
- `title`: (String, Optional)
- `description`: (String, Optional)
- `thumbnailUrl`: (String, Optional)
- `license`: (String, Optional)
- `attribution`: (String, Optional)

### B. Updating the Publisher Module

We will update `functions/src/atproto/publishRecord.ts`. Instead of using `agent.post()`, it will use the `com.atproto.repo.createRecord` method targeting our new custom Lexicon.

```typescript
// Conceptual Implementation
await agent.com.atproto.repo.createRecord({
  repo: agent.session?.did,
  collection: 'com.matadisco.iiif.manifest', // The custom lexicon
  record: {
    $type: 'com.matadisco.iiif.manifest',
    manifestId: payload.manifestId,
    title: payload.title,
    // ...other semantic data
    createdAt: new Date().toISOString(),
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

1. **Step 1: Lexicon Design.** Formalize the `com.matadisco.iiif.manifest` schema JSON.
2. **Step 2: Update Publisher.** Switch NIIIFTY's `publishRecord.ts` to output this custom schema instead of generic text posts.
3. **Step 3: Build Test Harness UI.** Create the Integration Test page in the Next.js frontend.
4. **Step 4: Connect to Relay API.** Ensure the Test Harness can query the database built by the external Relay team.
5. **Step 6: End-to-End Test.** Upload a file via NIIIFTY -> Watch it broadcast as a custom record -> Query the external Relay -> See it appear seamlessly in our test harness.
