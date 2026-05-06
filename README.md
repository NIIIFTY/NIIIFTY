# NIIIFTY

**Official Lexicon:** [`cx.vmx.matadisco`](https://lexicon.garden/lexicon/did:plc:3mdq56yhyqq5k6d4guztheaf/cx.vmx.matadisco)

## NIIIFTY 2 Grant Outcomes

This repository contains the infrastructure and deliverables for the **NIIIFTY 2** grant, aimed at solving Stable Identity and Global Discovery for decentralized IIIF content on IPFS.

### 1. AT Protocol Publisher (Global Discovery)
We built and published the [`@niiifty/atproto-publisher`](https://www.npmjs.com/package/@niiifty/atproto-publisher) module to NPM. This open-source, reusable Node.js package allows any application to construct and publish IIIF metadata records directly to an AT Protocol account. By tapping into the AT Protocol Firehose, we inverted the traditional IIIF "Pull" model (crawlers) into a highly scalable "Push" model, enabling instant, global discoverability.

### 2. Version Pinning Proxy (Stable Identity)
*Deviation from grant:* Originally, we planned to use Storacha's w3name (IPNS) for mutable pointers, but the service was discontinued. 
**The Solution:** We transitioned to Filebase for S3-compatible IPFS storage and implemented our own **Version Pinning Proxy**. 
**The Rationale:** This CID-only architecture removes the operational complexity and rate limits of managed IPNS keys. Manifests use a `__CID__` placeholder, and our high-performance proxy dynamically rewrites these into explicit, pinned links on the fly. This guarantees long-term verifiability without reliance on external naming infrastructure.

### 3. Decentralized "Search Across" AppView
To demonstrate global discovery, we built a serverless AppView within the NIIIFTY platform.
- A **Bun-based Jetstream consumer** runs on Cloud Run, subscribing to the firehose and indexing new IIIF records into Firestore.
- A **Next.js Frontend** provides a dedicated search interface to explore the decentralized network.

### 4. Bonus: AI Auto-Tagging via Gemini
*Addition to grant:* To maximize the value of the published metadata, we integrated Google's **Gemini 3 Flash** (via the new `@google/genai` SDK) into the upload pipeline. 
When users upload 2D images, MP4 videos, or 3D GLB models, Gemini automatically analyzes the visual content (or representative thumbnails) to generate rich, descriptive summaries and relevant search tags. This AI-enriched metadata is then bundled into the AT Protocol record, significantly improving the semantic searchability of IIIF assets across the network.

---

## Local Development

You can run the full NIIIFTY stack locally using `pnpm`.

1. **Start the Firebase Emulators**
   This will spin up local versions of Firestore, Cloud Functions, Auth, Storage, and Hosting. The Emulator UI will be available at [http://127.0.0.1:4000](http://127.0.0.1:4000).

   ```bash
   pnpm emulate
   ```

2. **Start the Next.js Development Server**
   This will start the frontend web application.
   ```bash
   pnpm dev
   ```

## Cloud Infrastructure Setup

NIIIFTY utilizes a serverless, vendor-agnostic architecture centered around **Filebase** (S3-compatible IPFS) and **Google Cloud Secret Manager**.

### 1. Filebase Storage (IPFS)

To handle high-performance directory uploads with deterministic CIDs, we use the Filebase S3 API with CAR (Content Addressable Archive) support.

1. **Create a Filebase Account**: You can start on the **Free** tier (which allows unlimited IPFS uploads within storage limits).
2. **Provision an S3 Bucket**: Create a bucket (e.g., `niiifty`) to store CAR files.
3. **Generate S3 Credentials**: Obtain your `Access Key` and `Secret Key`.

### 2. Environment Variables & Secrets

Configure the following secrets in your Firebase environment:

| Secret                 | Description                                                             |
| :--------------------- | :---------------------------------------------------------------------- |
| `FILEBASE_ACCESS_TOKEN` | Filebase S3 Access Token                                                  |
| `FILEBASE_SECRET_KEY`  | Filebase S3 Secret Key                                                  |
| `FILEBASE_GATEWAY_URL` | Your dedicated Filebase gateway (e.g. `https://niiifty.myfilebase.com`) |
| `ATPROTO_SERVICE`      | AT Protocol PDS (e.g. `https://bsky.social`)                            |
| `ATPROTO_IDENTIFIER`   | Your handle or DID                                                      |
| `ATPROTO_PASSWORD`     | App Password for your AT account                                        |

```bash
firebase functions:secrets:set FILEBASE_ACCESS_TOKEN
# ... etc
```

## High-Performance IPFS Version Pinning

NIIIFTY eliminates "popcorning" and reliability issues by using a specialized server-side deterministic version pinning proxy.

### 1. IPFS Pinning Proxy (`/api/ipfs/...`)

Instantly resolves content-addressed data using a dedicated Filebase gateway, ensuring high performance for IIIF viewers.

### 2. IPFS Pinning Proxy (`/api/ipfs/...`)

To ensure long-term verifiability of files, we implemented a **deterministic version pinning proxy**.

- **URL Rewriting**: When fetching IIIF `index.json` manifests, the proxy runs a regex rewriter that transforms all mutable dynamic links into explicit, cid-pinned proxy links.
- **Immutability**: This guarantees that if a user captures a manifest via the IPFS proxy, it is fixed to a specific content version for all eternity.

## Architectural Decisions

### 1. "UX First" Streaming

- **The Decision**: We use server-side streaming instead of 302 redirects.
- **The Rationale**: IIIF zoomable viewers require hundreds of parallel tile requests. Redirects force hundreds of expensive DNS/TLS handshakes, killing performance. Streaming over a single HTTP/2 multiplexed connection to `niiifty.com` provides a "CDN-like" experience for decentralized data.

### 2. Manual Federation Control

- **The Decision**: We moved from automatic broadcasting to a manual "Publish to Bluesky" workflow.
- **The Rationale**: This allows creators to curate exactly when a file is ready for the federated discovery layer. We use the Firestore `fileId` as the AT Protocol `rkey`, ensuring all updates remain idempotent and stable.

### 3. Serverless AppView

- **The Decision**: We built a lightweight, Firebase-native AppView for indexing `cx.vmx.matadisco` records.
- **The Rationale**: By using **Cloud Run + Bun + Jetstream**, we achieve 90% cost reduction compared to hosting a full AT Protocol Relay. We integrate this with **Vertex AI** and **Firestore Vector Search** to provide high-performance semantic discovery without third-party dependencies like Algolia.

### 4. Separation of Concerns (PDS vs AppView)

- **The Decision**: The AppView indexing service (`matadisco-consumer`) is strictly decoupled from the primary NIIIFTY database (PDS).
- **The Rationale**: To adhere to true decentralized architecture, the AppView only consumes public records from the AT Protocol Firehose and writes them to the `matadisco_index` collection. It has zero knowledge of the private `files` collection used for authoring. For the admin dashboard to show if an asset is "Indexed", the UI acts as a pure client—querying the `matadisco_index` collection directly rather than relying on internal database callbacks.

## AppView & Semantic Search

NIIIFTY implements a native AT Protocol AppView to index and search files across the network.

### 1. The Jetstream Consumer (`/appview`)
A persistent **Bun** service running on **Cloud Run** that subscribes to the AT Protocol firehose via **Jetstream**. It filters for `cx.vmx.matadisco` records and indexes them into a `matadisco_index` Firestore collection.

### 2. AI-Powered Indexing
We use the official **Vector Search with Firestore** extension to generate semantic embeddings.
- **Provider**: Vertex AI (`europe-west1`)
- **Model**: `text-embedding-004` (768 dimensions)
- **Input**: A combined `searchText` field (Label + Summary)
- **Trigger**: Automatic on Firestore document writes.

### 3. Semantic Search API
A callable Firebase Cloud Function (`searchAppView`) provides fuzzy, vector-based search.
- **Logic**: Converts user queries into vectors using Vertex AI and performs a `findNearest` query on Firestore.
- **Performance**: Entirely regionalized in `europe-west1` to match the `eur3` Firestore location, ensuring sub-100ms search latency.

## Federation & Discovery

Records are published to your AT Protocol repository and indexed by Matadisco.

### Viewing Records

You can view published records and verify their structure using these community tools:

- **[ATProto Browser](https://atproto-browser.vercel.app/)**: Enter your DID and browse the `cx.vmx.matadisco` collection.
- **[PDS Explorer](https://pdsexplorer.com/)**: Inspect the raw DAG-CBOR objects in your repository.

## Security

- **GCP IAM**: Authorization is enforced via the **Firebase Admin SDK**. The proxy guard ensures only CIDs managed by NIIIFTY are resolvable through the pinning gateway.
- **Secret Manager**: Private keys never touch disk or logs; they are pulled on-demand from GCP Secret Manager for RPC signature operations.

## Deployment & Maintenance

NIIIFTY is a multi-service architecture spanning several Google Cloud regions.

### 1. Regional Architecture
*   **App Hosting (Frontend)**: `europe-west4` (Netherlands). Managed via GitHub push.
*   **Cloud Functions (API)**: `europe-west1` (Belgium).
*   **Indexer (Cloud Run)**: `europe-west1` (Belgium).
*   **Firestore/Vertex AI**: `europe-west1` / `eur3`.

### 2. Deployment Commands
Always specify the project ID explicitly to avoid environment contamination:

```bash
# 1. Deploy Cloud Functions
cd functions && pnpm run deploy --project niiifty-bd2e2

# 2. Deploy Jetstream Indexer (Cloud Run)
pnpm run deploy:appview --project niiifty-bd2e2

# 3. Deploy Frontend (Triggered via Git)
git push origin main
```

### 3. Public Access (CORS)
New 2nd Gen Cloud Functions are **private by default**. If you add a new callable function that needs to be accessed by the frontend, you must make it public:

```bash
gcloud functions add-iam-policy-binding [FUNCTION_NAME] \
  --region europe-west1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker" \
  --project niiifty-bd2e2
```
*Note: For 2nd Gen functions, this also automatically grants `roles/run.invoker` to the underlying Cloud Run service.*

---
