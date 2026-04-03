# NIIIFTY 2.0: IPNS Stable Identity Architecture

## Overview

The NIIIFTY 2.0 architecture integrates **Storacha's `w3name`** directly into the core indexing flow to provide stable, mutable pointers to IIIF manifest data stored on decentralized networks (IPFS/Filecoin).

Historically, each update to a 3D model, metadata, or image required generating a new IPFS CID. Without IPNS, clients would have to constantly update their references. By using IPNS, we decouple the canonical identifier from the immutable content hash.

## Implementation Details

All IPNS operations run securely inside a protected Firebase Cloud Function environment (`functions/src/ipns`). Doing this offloads the heavy cryptographic signing steps from the user's browser, preventing browser performance degradation and creating a reliable background job architecture for large 3D models.

### `generateName()`

Uses `w3name.create()` to generate a new `WritableName`. This produces an Ed25519 keypair. The public key forms the `k51...` IPNS string identifier, while the private key must be safely stored to authorize future updates. In NIIIFTY, this is serialized as an encoded `Uint8Array` in the Firestore document representing the model.

### `createNameRevision()`

Once an updated GLB model or thumbnail is packaged into a new IIIF manifest and uploaded to IPFS (via `@storacha/client`), we get a new content CID. The `Name.increment(revision, cid)` API is used to cryptographically sign a payload pointing to the new CID.

### `publishRevision()`

Finally, the signed revision is broadcasted via `Name.publish(revision, name.key)`. From this moment forward, resolving the stable IPNS URL will return the latest CID.

## Storage and Security Considerations

1. **Private Keys:** The IPNS generated private keys (`keyplate.bytes`) are stored in Firebase Firestore alongside the exhibit/file records.
2. **Access Control:** Since the IPNS update logic runs on Firebase `onUpdate` triggers, only authenticated modifications that meet NIIIFTY's Firestore Rules will be allowed to trigger an IPNS revision roll.

## Next Steps

- Integrate off-chain data sync via AT Protocol using the generated IPNS stable identity instead of CIDs.
