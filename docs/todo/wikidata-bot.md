# Wikidata IIIF to AT Protocol Firehose

This document outlines a plan to build a lightweight, automated scraper that queries Wikidata for IIIF Manifests and publishes them to the AT Protocol using the `cx.vmx.matadisco` schema.

This project is modeled directly after the architectural approach of `vmx/sentinel-to-atproto`.

### 1. Architecture Details

- **Environment**: Cloudflare Workers (Scheduled triggers / Cron Jobs).
- **State Management**: Cloudflare KV (Key-Value) store to remember the last successful query timestamp (e.g., `last-created`).
- **Data Source**: Wikidata Query Service (WDQS) via SPARQL.
- **Destinations**: A dedicated Bluesky account acting as the firehose publisher for this dataset.
- **Dependencies**:
  - `@atcute/tid` for generating strict Record IDs.
  - Fetch API (No heavy `@atproto/api` SDK footprint).

### 2. The Data Extraction (SPARQL)

Wikidata tracks IIIF Manifests under property **P7936**. The Cloudflare Worker will execute a SPARQL query to find newly added or modified items containing this property since the last run.

**Required Data Points:**

1.  **IIIF Manifest URL** (`P7936`): Maps to `metadata`.
2.  **Date Modified**: Maps to `created`.
3.  **Image URL** (`P18` - optional): Maps to `preview.url`.

_Example SPARQL concept:_

```sparql
SELECT ?item ?itemLabel ?manifest ?image ?modified
WHERE {
  ?item wdt:P7936 ?manifest .
  OPTIONAL { ?item wdt:P18 ?image }
  ?item schema:dateModified ?modified .
  # FILTER(?modified > "2026-03-01T00:00:00Z"^^xsd:dateTime)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
LIMIT 200
```

### 3. Execution Pipeline

The `index.ts` Cloudflare Worker will execute on a scheduled cron (e.g., `0 * * * *` for hourly):

1.  **Fetch State:** Retrieve the `last-created` timestamp from the Cloudflare KV store.
2.  **Query Data:** Send the SPARQL query to `query.wikidata.org` requesting records modified _after_ `last-created`.
3.  **Map Data:** Iterate over the results and format them strictly to the Matadisco Lexicon:
    ```json
    {
      "$type": "cx.vmx.matadisco",
      "metadata": "https://server.domain/path/to/manifest.json",
      "preview": { "url": "https://upload.wikimedia.org/...", "mimeType": "image/jpeg" },
      "created": "2026-03-12T14:45:00Z"
    }
    ```
4.  **Publish Batch:**
    - Initialize an AT Protocol session using raw HTTP `fetch` to `com.atproto.server.createSession`.
    - Bundle the new records (up to 200) into a single writes array.
    - Submit the writes using `com.atproto.repo.applyWrites`.
5.  **Save State:** If the publish succeeds, record the highest `modified` date back into the Cloudflare KV store as the new `last-created`.

### 4. Trade-offs & Considerations

- **Rate Limits:** Wikidata Query Service is strict. A single Cloudflare Worker running hourly bulk updates is far safer than listening to live event streams.
- **Scale:** If thousands of IIIF manifests are added to Wikidata in a single hour, the worker must handle pagination and multiple `applyWrites` batches before timing out.
- **Link Rot:** The bot will publish whatever URL Wikidata has on record. If the institution's IIIF server is down, the Relay will index a dead link.
- **Updating/Deleting Records:** The `sentinel` approach is append-only. If a IIIF manifest is removed from Wikidata, this bot currently has no mechanism to issue a `$type: 'com.atproto.repo.deleteRecord'` command to remove it from the Matadisco search index.
