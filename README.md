# NIIIFTY

**Official Lexicon:** [`cx.vmx.matadisco`](https://lexicon.garden/lexicon/did:plc:3mdq56yhyqq5k6d4guztheaf/cx.vmx.matadisco)

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
2. **Provision an S3 Bucket**: Create a bucket (e.g., `niiifty`) to store exhibit CAR files.
3. **Generate S3 Credentials**: Obtain your `Access Key` and `Secret Key`.

### 2. Version Pinning Proxy (Dropping IPNS)

NIIIFTY has moved away from the InterPlanetary Name System (IPNS) to a **CID-only architecture**. This transition was made to reduce operational complexity and eliminate per-name limits/costs associated with managed IPNS providers.

- **The Rationale**: Since NIIIFTY already requires a server-side proxy for high-performance IIIF resolution and on-the-fly CID injection, the overhead of managing IPNS keys and DHT republication offered diminishing returns.
- **How it works**: Manifests are generated with a stable `__CID__` placeholder. When requested via the IPFS proxy (`/api/ipfs/[cid]`), the proxy dynamically replaces `__CID__` with the actual requested CID, ensuring absolute, pinned links without dedicated naming infrastructure.

### 3. Environment Variables & Secrets

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

To ensure long-term verifiability of exhibits, we implemented a **deterministic version pinning proxy**.

- **URL Rewriting**: When fetching IIIF `index.json` manifests, the proxy runs a regex rewriter that transforms all mutable dynamic links into explicit, cid-pinned proxy links.
- **Immutability**: This guarantees that if a user captures a manifest via the IPFS proxy, it is fixed to a specific content version for all eternity.

## Architectural Decisions

### 1. "UX First" Streaming

- **The Decision**: We use server-side streaming instead of 302 redirects.
- **The Rationale**: IIIF zoomable viewers require hundreds of parallel tile requests. Redirects force hundreds of expensive DNS/TLS handshakes, killing performance. Streaming over a single HTTP/2 multiplexed connection to `niiifty.com` provides a "CDN-like" experience for decentralized data.

### 2. Manual Federation Control

- **The Decision**: We moved from automatic broadcasting to a manual "Publish to Bluesky" workflow.
- **The Rationale**: This allows creators to curate exactly when an exhibit is ready for the federated discovery layer. We use the Firestore `fileId` as the AT Protocol `rkey`, ensuring all updates remain idempotent and stable.

### 3. Serverless AppView

- **The Decision**: We built a lightweight, Firebase-native AppView for indexing `cx.vmx.matadisco` records.
- **The Rationale**: By using **Cloud Run + Bun + Jetstream**, we achieve 90% cost reduction compared to hosting a full AT Protocol Relay, while maintaining deep semantic search capabilities for exhibit manifests.

## Federation & Discovery

Records are published to your AT Protocol repository and indexed by Matadisco.

### Viewing Records

You can view published records and verify their structure using these community tools:

- **[ATProto Browser](https://atproto-browser.vercel.app/)**: Enter your DID and browse the `cx.vmx.matadisco` collection.
- **[PDS Explorer](https://pdsexplorer.com/)**: Inspect the raw DAG-CBOR objects in your repository.

## Security

- **GCP IAM**: Authorization is enforced via the **Firebase Admin SDK**. The proxy guard ensures only CIDs managed by NIIIFTY are resolvable through the pinning gateway.
- **Secret Manager**: Private keys never touch disk or logs; they are pulled on-demand from GCP Secret Manager for RPC signature operations.

---
