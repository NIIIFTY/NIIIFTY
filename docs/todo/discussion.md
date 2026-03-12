# Discussion Points for Volker Mische (Relay Developer)

To ensure a smooth integration between NIIIFTY's publisher and the external Relay, outline the following topics during the architectural discussion:

### A. The Schema (Matadisco Lexicon)

- **NSID Confirmation**: The schema is defined as `cx.vmx.matadisco`. Can you confirm this is the namespace identifier we should be targeting?
- **Required Fields**: We see `created` and `metadata` are required. For NIIIFTY, `metadata` will point to the IIIF manifest. Do you recommend storing any other high-level info within the AT Protocol record itself, or should the Relay parse everything directly from the IIIF manifest?
- **Data Types**: Are there strict format requirements or expected contents for the `metadata` URI?
- **Thumbnails**: The schema provides a `preview` object with `mimeType` and `url`. Thumbnails will be stored in IPFS via Storacha. Will the Relay correctly resolve and cache `ipfs://` URLs in `preview.url`, or must we provide HTTP gateways? Since thumbnails will be important for the UI, what are the expectations regarding thumbnail resolution and aspect ratio?
- **Canonical URLs**: If we use a tool to add existing IIIF manifests as summaries with a thumbnail and description, can the records securely link back to their canonical URL?
- **Validation Fallback**: What happens if NIIIFTY publishes a record that is missing an optional field or slightly malformed? Does the relay silently drop it, or is there a way to see validation logs?

### B. The Relay Query API (For the Test Harness)

- **Endpoint Structure**: Does the Relay expose a REST API, GraphQL endpoint, or WebSocket for querying indexed records? What is the base URL?
- **Query Parameters**: How do we fetch the latest records? Can we query by specific `manifestId` or by the publishing account's DID to verify our specific uploads?
- **Tagged Search**: Does the relay/search API support tagged search (e.g., adding existing IIIF manifests as summaries to the search index)?
- **Indexing Latency**: After NIIIFTY publishes a record to the AT Protocol, roughly how many seconds/minutes should we expect before it becomes queryable in the Relay's database?
- **Authentication**: Will the NIIIFTY test harness need an API key to read from the Relay, or will it be a public endpoint?

### C. Future Proofing

- **Record Updates & Deletions**: If a user deletes a project in NIIIFTY, should we issue an AT Protocol `$type: 'com.atproto.repo.deleteRecord'`? Does the Relay respect these deletion events to remove the IIIF manifest from the global search?
- **Versioning**: As the Matadisco schema evolves, how will versioning be handled?
