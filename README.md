# NIIIFTY

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

## Storacha Network Setup

To deploy the functions or run full integration tests, you need a decentralized NIIIFTY Space registered on the Storacha network.

1. **Install the CLI and Authenticate**

   ```bash
   npm install -g @storacha/cli
   w3 login <your_email@domain.com>
   ```

2. **Provision a New Space**

   ```bash
   # Create a space (you will be prompted to backup a recovery phrase)
   w3 space create "NIIIFTY Production"
   ```

3. **Generate a Headless Sub-Agent Key**
   Run the helper script to create an Ed25519 identity for your backend. Note the `KEY_STRING` output.

   ```bash
   cd functions && node generate-key.js
   ```

4. **Delegate Capabilities to the Sub-Agent**
   Using the `DID:` output from Step 3, generate a wildcard delegation proof for the new identity.

   ```bash
   w3 delegation create <DID_STRING> -o proof.ucan
   ```

5. **Update Environment**
   Run the injection script to automatically parse the `proof.ucan` blob and update your `.env` variables with the base64 encoded capability.
   ```bash
   node inject-proof.js
   ```
   Finally, copy the `KEY_STRING` from Step 3 into your `.env` as `STORACHA_KEY`.

> [!WARNING]
> **Preserve in your Password Manager!**
> You must securely save the 24-word **Space Recovery Phrase** generated in Step 2. You should also backup the exact base64 strings for `STORACHA_KEY` and `STORACHA_PROOF` from your `.env` file since they cannot be recovered easily if lost.

## Architecture Notes

### Why We Use an IPNS Proxy Instead of dweb.link

Previously, NIIIFTY hardcoded `dweb.link` URLs for IPNS manifest distribution. This legacy architecture was dropped in favor of a centralized Next.js proxy route (`/api/ipns/[ipnsKey]`) for several critical reasons:

1. **DHT Resolution Unreliability:** `dweb.link` (and most public gateways) relies on the global IPFS Distributed Hash Table (DHT) to resolve IPNS names to content IDs (CIDs). In production, this resulted in extreme latency and frequent `500 Internal Server Error` timeouts, breaking IIIF Viewer tile requests.
2. **Instant Name Resolution:** By using a custom Next.js proxy, we can directly query the centralized `name.web3.storage` REST API, which instantly maps our generated IPNS keys to their latest CIDs without touching the DHT.
3. **High-Performance Redirection:** Once the CID is instantly resolved, the proxy issues a `302 Temporary Redirect` to the ultra-fast `w3s.link` dedicated CDN.
4. **Rate-Limit Resilience:** IIIF Viewers make dozens of parallel requests for individual image tiles. Querying the naming service for *every* tile would instantly trigger 'Too Many Requests' rate blocks. The proxy leverages HTTP caching (`Cache-Control: public, max-age=300`) to guarantee that all parallel tile requests are processed using a single fast, buffered resolution.

Within the Cloud Functions, always use the `getProxyUrl` helper (from `src/ipns/proxy.ts`) to ensure URLs natively point to the Next.js proxy routing.
