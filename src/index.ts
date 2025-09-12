import { Client } from '@modelcontextprotocol/sdk';

export function createClient(): Client {
  // Initialize a Model Context Protocol client
  return new Client();
}

if (require.main === module) {
  // Example usage
  const client = createClient();
  console.log('Client initialized', client);
}
