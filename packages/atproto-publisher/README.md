# @niiifty/atproto-publisher

A reusable Node.js module for publishing IIIF records to the AT Protocol (Bluesky). This package enables you to easily authenticate with a PDS and publish structured IIIF metadata to the `cx.vmx.matadisco` lexicon, supporting global decentralized discovery.

## Installation

```bash
npm install @niiifty/atproto-publisher
```

## Usage

### 1. Authenticate with the AT Protocol

```typescript
import { authenticateAgent } from '@niiifty/atproto-publisher';

const agent = await authenticateAgent(
  'https://bsky.social', // or your custom PDS
  'your-handle.bsky.social',
  'your-app-password'
);
```

### 2. Publish a IIIF Record

```typescript
import { publishIIIFRecord } from '@niiifty/atproto-publisher';

const payload = {
  id: 'https://your-domain.com/api/ipfs/bafy.../manifest.json', // The stable URI of the manifest
  thumbnail: 'https://your-domain.com/api/ipfs/bafy.../thumb.jpg',
  provider: 'Your Institution',
  rights: 'https://creativecommons.org/licenses/by/4.0/',
  label: 'A beautiful painting',
  summary: 'A short description of the painting for semantic search.',
  type: 'Manifest',
  tags: ['art', 'painting', '19th-century'],
  cid: 'bafy...' // Optional IPFS CID for verifiability
};

// Generate a deterministic or random key for the record
const rkey = 'record-id-123'; 

const { uri, cid } = await publishIIIFRecord(agent, rkey, payload);
console.log(`Published! URI: ${uri}, CID: ${cid}`);
```

### 3. Delete a IIIF Record

```typescript
import { deleteIIIFRecord } from '@niiifty/atproto-publisher';

await deleteIIIFRecord(agent, 'record-id-123');
```

## Integrating with NIIIFTY AppView

Records published using this module are structured using the `cx.vmx.matadisco` lexicon and an embedded `$type: 'io.iiif.metadata'` extension. This ensures they are automatically indexed by the NIIIFTY AppView Firehose Consumer and immediately available for semantic search globally.
