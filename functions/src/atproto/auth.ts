import { AtpAgent } from '@atproto/api';

/**
 * Initializes and authenticates an AT Protocol Agent instance.
 * @param {string} service - The PDS service URL (e.g., 'https://bsky.social').
 * @param {string} identifier - The user's handle or DID.
 * @param {string} password - The user's app password.
 * @returns {Promise<AtpAgent>} The authenticated agent.
 */
export async function authenticateAgent(service: string, identifier: string, password: string): Promise<AtpAgent> {
  const agent = new AtpAgent({ service });
  await agent.login({ identifier, password });
  return agent;
}
