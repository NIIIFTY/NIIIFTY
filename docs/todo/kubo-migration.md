# Task: Sovereign IPFS Architecture Migration (Kubo Pivot)

Due to the sunsetting of Storacha's hosted services (April 15 read-only cutoff), NIIIFTY is pivoting to a sovereign, self-hosted IPFS architecture. This plan integrates the transition to a dedicated Google Cloud Kubo node with our ongoing work on IPFS version pinning and AT Protocol discovery.

## 1. Infrastructure Pivot (Self-Hosted Kubo)
We will deploy a dedicated IPFS node inside the existing Google Cloud Project. This avoids third-party SaaS volatility and fulfills the PL Grant mandate for decentralized infrastructure.

- [ ] **Provision GCE Node**: Deploy an `e2-medium` (4GB RAM) Compute Engine instance using Google's Container-Optimized OS running the `ipfs/kubo:latest` Docker image to handle Kubo's memory requirements. Attach a 50GB persistent SSD. Configure `Datastore.StorageMax` and enabled automatic GC to manage disk growth. Assign a static external IP for peering stability.
- [ ] **Configure Serverless VPC Access**: Provision a Serverless VPC Access Connector (or Direct VPC Egress). Attach it to the Firebase Cloud Functions and App Hosting environments so they can route traffic to the GCE node's internal IP.
- [ ] **Configure VPC Firewall**:
  - **Port 4001 (Swarm)**: Open to `0.0.0.0` (Public IPFS peering via static IP).
  - **Port 5001 (RPC API)**: Allow ingress *only* from the internal VPC (specifically the Serverless VPC Connector subnet).
  - **Port 8080 (Gateway)**: Allow ingress *only* from the internal VPC (Serverless VPC Connector subnet).

## 2. Backend Migration (Cloud Functions)
Replace all `storacha` and `w3name` dependencies with the official `kubo-rpc-client` communicating over the internal Google network.

- [ ] **Uninstall Dependencies**: Remove `@storacha/client`, `w3name`, and `@ucanto` packages. Install `kubo-rpc-client`.
- [ ] **Upload Logic (`storacha.ts` -> `kubo.ts`)**: Rewrite directory uploads to push directly to the Kubo node via `ipfs.addAll()`.
- [ ] **IPNS Generation (`generateName.ts`)**: Rewrite to use `ipfs.key.gen({ type: 'rsa' })`. The `ipnsName` becomes the generated peer ID. **Crucially, implement an `ipfs.key.export()` step and securely back up the private key (e.g., Google Cloud Secret Manager) so keys aren't lost if the standalone node dies.**
- [ ] **IPNS Publishing (`publishRevision.ts`)**: Rewrite to use `ipfs.name.publish(cid, { key: 'ipnsKey' })`. Because DHT resolution and publishing is extremely slow, move this logic into an asynchronous background task (e.g., Firebase Task Queues) to prevent HTTP timeouts.

## 3. Proxy Routing Alignment (refs: `ipfs-pinning-proxy.md`)
Leverage the internal fast-path afforded by Firebase App Hosting sitting on the same VPC as the Kubo node.

- [ ] **Update IPNS Proxy**: Modify `src/app/api/ipns/.../route.ts` to fetch underlying bytes from the internal Kubo gateway (`http://[KUBO_INTERNAL_IP]:8080/ipfs/[cid]`) instead of `w3s.link`.
- [ ] **Implement IPFS Pinning Proxy**: Create the new `/api/ipfs/[cid]` route as defined in the pinning plan. This route will dynamically rewrite manifest URLs using the internal Kubo node as the source of truth, skipping SSL overhead since traffic remains entirely within Google's data center.

## 4. AT Protocol Integration (refs: `atproto-ui-integration.md`)
The AT Protocol strategy remains unchanged but operates downstream of the new Kubo architecture.

- [ ] **Publishing**: Implement the manual "Publish to Bluesky" UI flow in NIIIFTY.
- [ ] **Idempotent Records**: Use the Firestore `fileId` as the AT Protocol `rkey`.
- [ ] **UI State**: Store `atDid` within the Firestore `manifest` document as the global proof-of-publication flag to determine Draft/Pending/Published UI states across all clients.
