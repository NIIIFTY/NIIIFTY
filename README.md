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

### High-Performance IPNS Streaming Proxy

Previously, NIIIFTY hardcoded `dweb.link` URLs for IPNS manifest distribution. To resolve reliability issues, we implemented a centralized Next.js proxy route (`/api/ipns/[ipnsKey]/[...path]`).

#### Why a Streaming Proxy instead of a 302 Redirect?

Initially, the proxy used a `302 Temporary Redirect`. However, this caused "popcorning" in IIIF viewers because browsers had to establish new TLS handshakes for every tile redirected to `w3s.link`. The current **Streaming Proxy** solves this:

1.  **Instant Name Resolution:** We query the `name.web3.storage` REST API to instantly map IPNS keys to CIDs, bypassing the slow IPFS DHT.
2.  **Server-Side Streaming:** The Next.js backend fetches the content from the Storacha Gateway and streams the binary data directly to the client.
3.  **Connection Multiplexing:** The browser maintains a single HTTP/2 connection to `niiifty.com`. Tiles are streamed back in parallel without extra DNS lookups or TLS handshakes.
4.  **Rate-Limit Resilience:** Resolution results are cached (`revalidate: 300`) to prevent blocking during heavy IIIF tile loads (100+ requests).

#### Cost and Security

*   **Cost (Egress):** Unlike a redirect, streaming consumes Google Cloud egress bandwidth (~$0.12/GB). This is a trade-off for a premium, smooth user experience.
*   **Security (Restricted Reverse Proxy):** The proxy is **not** an open gateway. It is a restricted reverse proxy that only resolves paths against `w3s.link` using validated IPNS records. It mitigated SSRF risks by hardcoding the destination gateway and only allowing resolution via the trusted naming service.

Within the Cloud Functions, always use the `getProxyUrl` helper (from `src/ipns/proxy.ts`) to ensure manifests point to this routing.
