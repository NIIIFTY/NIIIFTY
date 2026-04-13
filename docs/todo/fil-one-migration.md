# Architectural Pivot: The Fil One Hybrid Strategy

To maximize strategic alignment with Protocol Labs and future Filecoin grant opportunities, NIIIFTY will migrate its primary data persistence layer to **Fil One** (`docs.fil.one`).

While Fil One provides an excellent S3-compatible interface for permanent storage on Filecoin, it abstracts away the IPFS and IPNS routing layers our IIIF `@id` URIs rely on. To bridge this gap without employing VMs or complex orchestration, NIIIFTY will adopt a **Serverless Hybrid Architecture**. This offloads heavy storage to Fil One while outsourcing IPNS routing to a specialized service API.

### 1. Storage Layer (Fil One S3)
All IIIF images, manifests, and AT Protocol payload data will be uploaded to Fil One using the standard `@aws-sdk/client-s3`. 
- **Benefit:** Direct participation in the Filecoin network ecosystem, ensuring project alignment for future grants and data permanence.
- **Cost Efficiency:** Fil One handles the heavy S3 bandwidth and Filecoin storage deals.

### 2. IPFS CID Generation (Local Polyfill)
Because Fil One does not return IPFS CIDs on upload via API, we must generate them deterministically before uploading.
- Use libraries like `ipfs-car` or `@ipld/car` within the Firebase Cloud Functions to package the manifest and images into a CAR (Content Addressable Archive) file.
- Calculate the accurate Root CID for the CAR file payload locally.
- Upload this CAR file to Fil One using the CID as the S3 Object Key (e.g., `s3://niiifty-bucket/[CID].car`).

### 3. IPNS Name Publishing (Managed Routing API)
We absolutely cannot rely on ephemeral Cloud Functions alone to maintain IPNS records (they require 24-48 hour republication to stay alive in the DHT), and we *will not* deploy any VMs or Kubo nodes.
- **Solution:** Use **Filebase** (or an equivalent service like Pinata) *strictly* as a managed IPNS Name Publisher API.
- Because Fil One is holding all the heavy Gigabytes of image/manifest data, our storage cost on Fil One is where the grant scaling happens.
- Filebase will only hold our IPNS keys and routing addresses. This easily fits entirely within Filebase's free tier. 
- The Cloud Function updates the IPNS pointer using Filebase's `/api/v0/name/publish` endpoint, and Filebase handles the 24/7 DHT republication infrastructure behind the scenes at zero cost.

## Proposed Implementation Steps

1. **Backend Integration:** Replace the Storacha SDK with standard `@aws-sdk/client-s3` aimed at Fil One's endpoint (`eu-west-1.s3.fil.one`).
2. **CAR Formatting:** Introduce the CAR packing utility in the Cloud Function to compute the immutable CIDs locally before upload.
3. **Name Routing API Deployment:** Create a free-tier Filebase account. Import the generated NIIIFTY Ed25519 keys via their `/api/v0/key/import` endpoint. Execute IPNS updates through this API in the Cloud Function.
4. **Proxy Fallback:** Ensure Next.js proxy routes fetch seamlessly from public IPFS gateways, and strictly fallback to fetching directly from the Fil One backend S3 URLs if the public gateways fail due to DHT lag.
