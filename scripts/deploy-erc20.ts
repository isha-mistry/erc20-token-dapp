/**
 * ERC-20 Token Deployment Script
 * 
 * Usage: ts-node scripts/deploy-erc20.ts
 */

import { deployERC20TokenViaAPI } from '@cradle/erc20-stylus';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const apiUrl = process.env.ERC20_DEPLOYMENT_API_URL || 'http://localhost:4000';
  const rpcEndpoint = process.env.RPC_ENDPOINT || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  console.log('Deploying ERC-20 token...');
  console.log('Name:', 'SuperPositionToken');
  console.log('Symbol:', 'SPT');
  console.log('Initial Supply:', '1000000');
  console.log('Network:', 'arbitrum-sepolia');

  const result = await deployERC20TokenViaAPI({
    name: 'SuperPositionToken',
    symbol: 'SPT',
    initialSupply: '1000000',
    privateKey,
    rpcEndpoint,
    deploymentApiUrl: apiUrl,
  });

  console.log('\n✅ Token deployed successfully!');
  console.log('Token Address:', result.tokenAddress);
  console.log('Transaction Hash:', result.txHash);
  console.log('\nAdd this to your .env file:');
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${result.tokenAddress}`);
}

main().catch(console.error);
