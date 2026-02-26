import { BskyAgent } from '@atproto/api';

/**
 * Initializes and authenticates a Bluesky Agent instance.
 * @param {string} service - The PDS service URL (e.g., 'https://bsky.social').
 * @param {string} identifier - The user's handle or DID.
 * @param {string} password - The user's app password.
 * @returns {Promise<BskyAgent>} The authenticated agent.
 */
export async function authenticateAgent(service: string, identifier: string, password: string): Promise<BskyAgent> {
  const agent = new BskyAgent({ service });
  await agent.login({ identifier, password });
  return agent;
}
