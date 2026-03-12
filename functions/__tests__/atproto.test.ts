import { describe, it, expect } from '@jest/globals';
import { authenticateAgent } from '../src/atproto/auth.js';

describe('AT Protocol Module', () => {
  it('verifies authenticateAgent throws using invalid credentials', async () => {
    // Force a missing PDS ENV
    const originalEnv = process.env.ATPROTO_SERVICE;
    process.env.ATPROTO_SERVICE = '';

    await expect(authenticateAgent('https://bsky.social', 'abc', 'abc')).rejects.toThrow();

    // Restore ENV
    process.env.ATPROTO_SERVICE = originalEnv;
  });

  // Mocking the @atproto/api would go here for an integration test without spamming PDS.
  // We can skip a full mock implementation in this scaffolding since we'll test via the harness.
});
