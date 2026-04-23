# Architectural Pivot: Filebase S3 for IPFS & IPNS

This plan outlines the architecture shift from the legacy Storacha infrastructure directly to Filebase. By abandoning the previously proposed self-hosted Kubo node strategy, Filebase provides an S3-compatible API that inherently pins objects to IPFS, alongside a managed platform API for publishing IPNS keys. This satisfies the requirement for decentralized permanence without the massive DevOps overhead of maintaining a standalone IPFS GCE instance.

## Proposed Changes

---

### Backend Migration (Cloud Functions)

#### [MODIFY] `package.json`
Remove the existing Storacha/w3name dependencies (`@storacha/client`, `@ucanto`, `w3name`) and replace them with standard AWS S3 libraries and HTTP clients for communicating with Filebase.
- Add `@aws-sdk/client-s3` for object uploads.

#### [MODIFY] Upload Logic (`storacha.ts` -> `filebase.ts`)
Convert directory packaging and uploads to push directly to the Filebase S3 API endpoint (`s3.filebase.com`). 
- **Benefit:** Filebase maps standard S3 uploads directly to IPFS blocks and returns the decentralized IPFS CID in the S3 response headers (`x-amz-meta-cid`). If Filebase ever disappears, you simply point your S3 SDK at the next provider (like the proposed "fil one") with zero application rewrites.

> [!WARNING]
> **Implementation Gap in S3 Uploads (Directories)**
> Standard AWS S3 `PutObject` requests only upload flat files. They will return individual CIDs per file, but they **will not** automatically generate an overarching directory CID that wraps the metadata and images (which is typically required for IIIF manifest architectures).

- **Recommendation:** To get a root folder CID representing an entire structure, we must explicitly code one of two methods:
  1.  **CAR File Upload:** Package the IIIF components into a `.car` (Content Addressable Archive) file locally and upload it using S3 `PutObject` with the metadata header `x-amz-meta-import: car`.
  2.  **Bucket Tagging:** Upload the files individually, and then send an S3 `PutBucketTagging` request with `TagSet=[{Key=generateBucketCid,Value=true}]`. Filebase intercepts this tag and generates an IPFS folder CID for the bucket contents.

#### [MODIFY] IPNS Generation & Publishing
> [!TIP]
> **Avoiding Vendor Lock-in (Keys):** To ensure NIIIFTY can always migrate providers without breaking existing IIIF @ids, we must maintain absolute ownership of the IPNS private keys.

- **Generation (`generateName.ts`):** Generate the IPNS Keypair (RSA/Ed25519) securely within the Cloud Function environment. Serialize and save this Private Key directly into Google Cloud Secret Manager or the protected Firestore `manifest` document.
- **Publishing (`publishRevision.ts`):** Use Filebase's IPFS RPC-compatible endpoints (`/api/v0/key/import` and `/api/v0/name/publish`). We pass our securely held private key to Filebase on-demand so they can handle the heavy lifting of routing and resolving the DHT DHT without permanently trapping our namespace in their proprietary database.

> [!CAUTION]
> **Key Custody Trade-off**
> While we store the keys securely, using Filebase's `/api/v0/key/import` endpoint inherently requires sending the raw private key over the wire to their servers. This means it is no longer a "zero-knowledge" custody arrangement. They possess the key to handle background DHT republication. This is a highly worthwhile tradeoff for avoiding managing our own DHT node, but it must be acknowledged. Additionally, we must verify that the `generateName.ts` Ed25519 key format matches the IPFS protobuf encoding expected by Filebase's import endpoint.

---

### Proxy Routing Alignment

#### [MODIFY] Target Gateways
Update the internal routing proxy strategies to use Filebase gateways instead of `w3s.link` or a local internal Kubo IP.
- Point the Next.js API proxy at your dedicated Filebase gateway (`https://[niiifty-gateway].myfilebase.com/ipfs/[cid]`).

> [!NOTE]
> **Cost Assessment**
> Moving from the public `w3s.link` to a dedicated `https://[niiifty-gateway].myfilebase.com` gateway will drastically improve performance and reliability. However, dedicated gateways are restricted to paid subscriptions on Filebase (typically starting at their Standard tier). Ensure the monthly subscription cost is accounted for in the operational budget.

## Verification Plan

### Automated Tests
- Upload a lightweight NIIIFTY manifest document using `@aws-sdk/client-s3` targeting `s3.filebase.com`.
- Verify the returned S3 object metadata contains the correct `CID`.

### Manual Verification
- Resolve the Filebase-published IPNS name on the standard, public `https://ipfs.io/ipns/` gateway to prove the identity is fully decentralized and completely uncoupled from Filebase's ecosystem.
