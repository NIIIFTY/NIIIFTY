# NIIIFTY 2.0: AT Protocol Discoverability Architecture

## Overview

The NIIIFTY 2.0 architecture integrates with the **AT Protocol (Bluesky)** to ensure decentralized, global discoverability of 3D models and IIIF content. While IPNS gives content a stable identity, the AT Protocol's Firehose allows applications and indexers across the internet to passively listen for newly published manifests.

## Implementation Details

All AT Protocol publishing operations run automatically inside a protected Firebase Cloud Function environment (`functions/src/atproto`). When a manifest is created or updated, the Firebase `onCreate` or `onUpdate` trigger catches the event. The system then publishes a lightweight feed post containing the manifest metadata and IPNS stable URL.

### Authentication (`authenticateAgent`)

Using `@atproto/api` (the official SDK), the backend connects to an AT Protocol PDS (Personal Data Server).

- `ATPROTO_SERVICE`: The hosting service (default: `https://bsky.social`)
- `ATPROTO_IDENTIFIER`: The bot account Handle/DID configured to announce NIIIFTY uploads.
- `ATPROTO_PASSWORD`: The secure App Password.

### Publishing (`publishIIIFRecord`)

Once authenticated, the publisher constructs an `app.bsky.feed.post` record with:

1. A human-readable text block summarizing the new model upload.
2. A required faceted link pointing to the IIIF manifest's stable `ipns://` URL.

_Note: In future revisions, as customized Lexicons stabilize for IIIF formats (e.g., the Matadisco standard proposed by Volker Mische), the `app.bsky.feed.post` type will be substituted with a dedicated repository type tailored for IIIF indexing._

## Security and Indexing

1. By running this step server-side via Firebase Functions, users do not need individual AT Protocol credentials to make NIIIFTY artifacts globally indexable.
2. NIIIFTY acts as the publishing relay. Search engines listening to the open AT Firehose will immediately detect new 3D model entries without the need to actively ping NIIIFTY's REST API or Firestore database.
