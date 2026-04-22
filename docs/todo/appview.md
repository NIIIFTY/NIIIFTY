# NIIIFTY AppView Architecture Plan

This document outlines the proposed architecture for building a searchable AT Protocol AppView natively within NIIIFTY's existing Firebase stack.

## Goal

To index and search for NIIIFTY AT Protocol records (such as IIIF manifests by tag or subject) across the global Bluesky network, without hosting a standalone, stateful AT Protocol Relay (like Ramjet).

## Why an AppView?

A Relay's job is to download raw binary CAR files and serve basic XRPC requests based on DIDs or Keys. A Relay does not index the _contents_ of the JSON payload. To search for Matadisco records where `subject="photography"`, we must build an AppView that parses the firehose and inserts the JSON data into a searchable database.

## Proposed Architecture (Firebase-Native)

We can build the AppView components using our existing GCP/Firebase infrastructure to minimize complexity and billing.

### 1. The Firehose Consumer (Google Cloud Run + Bun + @atcute/jetstream)

- **What it does:** A persistent background service powered by the **Bun** runtime and the **`@atcute/jetstream`** library. It maintains a 24/7 WebSocket connection to a public **Jetstream** relay. Jetstream drastically reduces bandwidth and CPU overhead by pre-filtering the firehose and outputting lightweight JSON instead of raw CBOR.
- **Library Choice:** We use `@atcute/jetstream` because it is specifically designed for this architecture. It handles the WebSocket lifecycle, automatic reconnections, and native JSON parsing of the Jetstream envelope.
- **Lexicon Type Generation:** To ensure type safety when indexing custom records, we use `@atcute/lex-cli` to generate strict TypeScript definitions from our lexicon JSON.
  ```bash
  # Generate types for the AppView consumer
  npx @atcute/lex-cli generate ./lexicons/cx.vmx.matadisco.json -o ./src/atproto/lexicons.ts
  ```
- **Cursor Management:** Persistently stores the last processed microsecond timestamp in a Firestore `_system/firehose_cursor` document. On container restart, the cursor is passed to the constructor to resume exactly where it left off, preventing data loss.
- **Operations:** The consumer parses the commit events (`event.kind === 'commit'`) and processes `create`, `update`, and `delete` operations for `cx.vmx.matadisco` records.
- **Deployment:** Deployed as a **Cloud Run Web Service** using the official `oven/bun` Docker image. We configure `--max-instances=1` and `--min-instances=1` to ensure a singleton consumer.


### 2. The Indexer Database (Cloud Firestore)

- **What it does:** When the Firehose Consumer parses a Matadisco record from the network, it specifically checks for the existence of the **`record.iiif` extension block**. If present, it validates the schema and natively extracts the Matadisco `tags` along with the core IIIF metadata (`record.iiif.provider`, `record.iiif.rights`, `record.iiif.label`, `record.iiif.summary`, `record.iiif.type`, `record.iiif.metadata`). This structural filtering ensures that any Matadisco record containing IIIF-compatible data is indexed, regardless of whether it also contains an explicit `iiif` tag. It then inserts these fields and the manifest URL into a new Firestore collection (e.g., `matadisco_index`). Writes must be **idempotent**, using the record's AT URI (`at://...`) as the Firestore Document ID so any duplicate events simply overwrite rather than duplicate records. Because our publishers embed search facets directly into the AT Protocol payload using an open JSON extension, the consumer can parse and index everything in one pass without making external reverse-lookups to the heavy IIIF Manifests!
- **Semantic Text Embeddings:** We use the official Firebase Extension ("Extract image and text embeddings with Vertex AI"). Whenever a new record is saved, the extension automatically sends the combined `label` and `summary` text to Vertex AI to generate an embedding vector and saves it into the database document. To mitigate risk of Vertex AI cost spikes, we rely on Jetstream's strict collection filtering to limit processing volume, and recommend setting up strict GCP billing budget alerts.
- **Integration:** Because the Cloud Run container runs within the same GCP project as Firebase, it automatically has IAM permissions to write to Firestore using the standard `firebase-admin` SDK without needing explicit service accounts.

### 3. The Query API (Firebase Cloud Functions & Vector Search)

- **What it does:** Uses Firestore native Vector Searches (`findNearest`), providing fuzzy, semantic search natively without relying on expensive third-party indexing services like Algolia.
- **Exact Filters & Fuzzy Matching:** Alongside the `embeddingVector`, exact `tags`, `provider`, `rights`, and resource `type` fields are indexed as arrays or strict strings. Furthermore, the arbitrary `metadata` dictionary allows the API to satisfy incredibly precise domain-specific filters (e.g., `where("metadata.medium", "==", "oil on canvas")`), while utilizing semantic vector search for organic text queries, giving you deep cross-network capability.
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
