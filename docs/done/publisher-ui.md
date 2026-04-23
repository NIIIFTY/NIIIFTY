# Updating the Authoring UI for Matadisco Publish Records

The current UI (`src/components/files/EditFile.tsx`) handles basic metadata: `title`, `description`, `attribution`, and `license`. To properly support the new Matadisco "Push" architecture—where the publisher defines the search index natively—we need to expand the form to allow users to build out the `tags` and `metadata` objects before hitting "Update" or "Publish."

## Proposed UI Changes

### 1. Dynamic Key-Value Builder for `metadata` (Domain-specific precise indexing)
Currently, there is no way for a user to input dynamic IIIF attributes like "Medium", "Artist", or "Date".
- **Change:** Add a dynamic field list below the "Description" allowing users to add custom Key/Value pairs. We can use `useFieldArray` from `react-hook-form` to allow users to click "+ Add Metadata Field".
- **Result:** This will output a `Record<string, string>` object directly into the `metadata` property we just added to the AT Protocol backend.

### 2. Tags Input for `tags` (Global AT Protocol indexing)
The Matadisco spec heavily relies on the root-level array of strings (`tags: ["iiif", "painting"]`) for global hashtag discovery.
- **Change:** Add a "Tags" input implemented as a `shadcn-ui` text input. When the user types a tag and presses "Enter", it will generate a visual `Badge` underneath the input offering a small "x" icon to remove it. 
- **Constraint:** The `"iiif"` badge will be permanently rendered without an "x" icon to ensure it cannot be removed.

### 3. IPFS Verifiability (CID)
We will add a mandatory `cid` field to the AT Protocol `iiif` extension. This CID will match the root CID of the manifest directory pinned to Storacha.

### 4. Native Schema Alignment (No Mapping)
Per your feedback, we will completely rewrite the database schema and UI forms to natively match the IIIF/Matadisco property names. The old fields will be replaced everywhere in the frontend and backend:
- `title` -> `label`
- `description` -> `summary`
- `attribution` -> `provider`
- `license` -> `rights`

## Execution Plan

### Phase 1: Backend Schema & Trigger Updates
- [x] Update `publishRecord.ts` with `cid` in schema.
- [x] Update `index.ts` to pass `cid` from Storacha into AT Protocol records.

### Phase 2: UI & Type System Refactor
#### [MODIFY] `src/utils/Types.ts`
- Refactor the `AuthoringFile` interface: remove `title`, `description`, `attribution`, `license`.
- Add `label`, `summary`, `provider`, `rights`, `tags`, `metadata`, and `cid`.

#### [MODIFY] `src/components/files/EditFile.tsx` & `src/components/files/FileUploader.tsx`
- Refactor the `zod` form schemas to use these exact new keys (`label`, `summary`, etc.).
- Update all form fields and values to use the new keys natively. 
- Expand forms to include `tags` (shadcn-ui badges) and `metadata` (key-value builder).

#### [MODIFY] `functions/src/index.ts`
- Ensure triggers are fully aligned with the new native names.
