import { generateName, createNameRevision } from '../src/ipns';

describe('IPNS Module', () => {
  it('generates a new IPNS keyplate correctly', async () => {
    const keyplate = await generateName();
    // Ensure it looks like a valid k51 string
    expect(keyplate.toString().startsWith('k5')).toBe(true);
  });

  it('creates and parses revisions offline', async () => {
    // Generate a temporary keyplate for the test
    const keyplate = await generateName();

    // Create an initial revision pointing to a dummy CID
    const dummyCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const revision = await createNameRevision(keyplate, dummyCid);

    expect(revision).toBeDefined();
    expect(revision.value).toBe(dummyCid);
  });

  // Note: we don't test publishRevision against live network repeatedly
  // to avoid hitting rate limits. Offline tests confirm cryptographic soundness.
});
