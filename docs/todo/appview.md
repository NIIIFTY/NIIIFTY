# NIIIFTY AppView Architecture Plan

This document outlines the proposed architecture for building a searchable AT Protocol AppView natively within NIIIFTY's existing Firebase stack.

## Goal

To index and search for NIIIFTY AT Protocol records (such as IIIF manifests by tag or subject) across the global Bluesky network, without hosting a standalone, stateful AT Protocol Relay (like Ramjet).

## Why an AppView?

A Relay's job is to download raw binary CAR files and serve basic XRPC requests based on DIDs or Keys. A Relay does not index the _contents_ of the JSON payload. To search for Matadisco records where `subject="photography"`, we must build an AppView that parses the firehose and inserts the JSON data into a searchable database.

## Proposed Architecture (Firebase-Native)

We can build the AppView components using our existing GCP/Firebase infrastructure to minimize complexity and billing.

### 1. The Firehose Consumer (Google Cloud Run + Bun)

- **What it does:** A persistent background service using the `@atproto/api` `Firehose` module, powered by the **Bun** runtime for high-performance CBOR decoding. It maintains a 24/7 WebSocket connection to a public relay (`wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos`).
- **Cursor Management:** Persistently stores the last processed sequence (`seq`) in a Firestore `_system/firehose_cursor` document. On container restart, it reads this cursor to resume the stream from the exact last event, preventing data loss or redundant processing.
- **Filtering & Operations:** It discards all traffic except for records matching `$type: "cx.vmx.matadisco"`. It explicitly processes `create`, `update`, and `delete` operations to ensure the local database accurately reflects user modifications and deletions.
- **Deployment:** Because Firebase Cloud Functions have a 60-minute timeout limit, they cannot maintain long-lived WebSockets. Instead, we deploy this consumer as a **Cloud Run** container using the official `oven/bun` Docker image. Since Bun executes TypeScript natively, no separate build step (`tsc`) is needed.
- **Configuration:** We configure the container with "CPU Always Allocated" so it does not spin down to zero, ensuring it continuously listens to the stream. Thanks to Cloud Run's native container support, we can deploy this via a simple `Dockerfile` using `gcloud run deploy`.

### 2. The Indexer Database (Cloud Firestore)

- **What it does:** When the Firehose Consumer parses a Matadisco record from the network, it validates the schema and inserts the relevant JSON fields (manifest URL, format, tags, subjects, keywords) into a new Firestore collection (e.g., `matadisco_index`).
- **Integration:** Because the Cloud Run container runs within the same GCP project as Firebase, it automatically has IAM permissions to write to Firestore using the standard `firebase-admin` SDK without needing explicit service accounts.

### 3. The Query API (Next.js & Algolia)

- **What it does:** The NIIIFTY React frontend queries an **Algolia** index rather than hitting Firestore directly.
- **Execution:** We use Firebase Extensions (or a Cloud Function Firestore trigger) to automatically sync the `matadisco_index` Firestore collection to Algolia. The frontend then uses the standard `algoliasearch` client or React InstantSearch UI components.
  ```javascript
  const results = await index.search('photography', {
    filters: 'format:manifest'
  });
  ```
- **Benefit:** Utilizing Algolia provides robust full-text search, fuzzy matching, dynamic faceting, and rapid response times (crucial for a global index) that are simply not possible natively with standard Firestore `array-contains` queries.

## Summary vs Standalone Relay

By deploying a stateless Cloud Run container to funnel specific firehose events into our existing Firestore database, we achieve massive network-wide discoverability for IIIF manifests without taking on the expensive infrastructure burden of hosting a high-write, local-disk Relay server.
