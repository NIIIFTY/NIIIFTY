# NIIIFTY AppView Architecture Plan

This document outlines the proposed architecture for building a searchable AT Protocol AppView natively within NIIIFTY's existing Firebase stack.

## Goal

To index and search for NIIIFTY AT Protocol records (such as IIIF manifests by tag or subject) across the global Bluesky network, without hosting a standalone, stateful AT Protocol Relay (like Ramjet).

## Why an AppView?

A Relay's job is to download raw binary CAR files and serve basic XRPC requests based on DIDs or Keys. A Relay does not index the _contents_ of the JSON payload. To search for Matadisco records where `subject="photography"`, we must build an AppView that parses the firehose and inserts the JSON data into a searchable database.

## Proposed Architecture (Firebase-Native)

We can build the AppView components using our existing GCP/Firebase infrastructure to minimize complexity and billing.

### 1. The Firehose Consumer (Google Cloud Run + Bun)

- **What it does:** A persistent background service powered by the **Bun** runtime. It maintains a 24/7 WebSocket connection to a public **Jetstream** relay (e.g., `wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=cx.vmx.matadisco`). Jetstream drastically reduces bandwidth and CPU overhead by pre-filtering the firehose and outputting lightweight JSON instead of raw CBOR.
- **Cursor Management:** Persistently stores the last processed microsecond timestamp in a Firestore `_system/firehose_cursor` document. To avoid the Firestore 1-write-per-second limit on single documents, cursor writes are **debounced** (e.g., saved every 5 seconds) and use `{ merge: true }` to gracefully handle brief overlaps if Cloud Run starts a second instance during deployments. On container restart, it appends `&cursor=...` to the WebSocket URL to resume the stream preventing data loss.
- **Operations:** It natively parses the simplified JSON payload and processes `create`, `update`, and `delete` operations for Matadisco records, ensuring the local database accurately reflects user modifications. For `delete` events, the service promptly removes the corresponding document from Firestore to keep the index clean and prevent stale queries.
- **Deployment:** Because Firebase Cloud Functions have a 60-minute timeout limit, they cannot maintain long-lived WebSockets. Instead, we deploy this consumer as a **Cloud Run Web Service** using the official `oven/bun` Docker image. Since Bun executes TypeScript natively, no separate build step (`tsc`) is needed.
- **Configuration & Lifecyle:** We configure the container with "CPU Always Allocated" and crucially, **`--max-instances=1` and `--min-instances=1`** to ensure it runs as a singleton and prevents duplicate processing. As a Cloud Run Service, it must include a tiny HTTP server that returns `200 OK` on `$PORT` for health checks. Additionally, if the WebSocket stream drops, the process must forcefully call `process.exit(1)` so Cloud Run detects the failure and safely restarts the container.

### 2. The Indexer Database (Cloud Firestore)

- **What it does:** When the Firehose Consumer parses a Matadisco record from the network, it validates the schema and inserts the relevant JSON fields (manifest URL, format, tags, subjects, keywords) into a new Firestore collection (e.g., `matadisco_index`). Writes must be **idempotent**, using the record's AT URI (`at://...`) as the Firestore Document ID so any duplicate events simply overwrite rather than duplicate records.
- **Sanitization & Validation:** Because the public AT Protocol is open, anyone can publish Matadisco records. Before creating the record, the indexing service rigorously validates the payload for a valid IPFS/IPNS URI and enforces text length limits. This prevents malicious spam accounts from inflating Firestore storage and triggering runaway Vertex AI embedding costs.
- **Semantic Text Embeddings:** We use the official Firebase Extension ("Extract image and text embeddings with Vertex AI"). Whenever a new record is saved, the extension automatically sends the descriptive text to Vertex AI to generate an embedding vector and saves it into the database document. To mitigate risk of Vertex AI cost spikes, we rely on Jetstream's strict collection filtering to limit processing volume, and recommend setting up strict GCP billing budget alerts.
- **Integration:** Because the Cloud Run container runs within the same GCP project as Firebase, it automatically has IAM permissions to write to Firestore using the standard `firebase-admin` SDK without needing explicit service accounts.

### 3. The Query API (Firebase Cloud Functions & Vector Search)

- **What it does:** Uses Firestore native Vector Searches (`findNearest`), providing fuzzy, semantic search natively without relying on expensive third-party indexing services like Algolia.
- **Exact & Fuzzy Matching:** Alongside the `embeddingVector`, exact `keywords` and `tags` are indexed as arrays. The API can satisfy precise keyword queries natively via Firestore (`where("tags", "array-contains", "value")`) while utilizing semantic vector search for organic, sentence-based text queries, preventing unexpected mismatch frustrations on direct tags.
- **Execution:** To keep operations secure and fast, Next.js does not query Firestore directly. Instead, the frontend sends the search text to a single callable Firebase Cloud Function. This server-side function uses Vertex AI to convert the search string into a vector, and then securely queries Firestore using the Admin SDK:
  ```javascript
  // Server-side Firebase Cloud Function
  const queryVector = FieldValue.vector(generatedVectorArray);
  const results = await admin.firestore().collection('matadisco_index')
    .findNearest('embeddingVector', queryVector, { limit: 10, distanceMeasure: 'COSINE' })
    .get();
  
  // Format results and return to client
  ```
  The Next.js frontend receives the formatted search results in a single, secure network hop.
- **Benefit:** This keeps the architecture 100% native to Firebase and Google Cloud, dropping our highest variable cost-risk (Algolia). It inherently provides powerful "fuzzy" matching, typo-tolerance, and AI compatibility (RAG) for fractions of a cent per search, completely solving the traditional AppView expense problem.

## Summary vs Standalone Relay

By deploying a stateless Cloud Run container to funnel specific firehose events into our existing Firestore database, we achieve massive network-wide discoverability for IIIF manifests without taking on the expensive infrastructure burden of hosting a high-write, local-disk Relay server.
