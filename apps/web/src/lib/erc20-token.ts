/**
 * ERC-20 Token Library
 * 
 * Utilities for interacting with the deployed token
 */

import { 
  getTokenInfo, 
  getBalance, 
  transfer, 
  mint, 
  burn,
  type TokenInfo,
} from '@cradle/erc20-stylus';
import type { Address } from 'viem';

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as Address;
const RPC_ENDPOINT = 'https://sepolia-rollup.arbitrum.io/rpc';

export async function fetchTokenInfo(): Promise<TokenInfo> {
  return getTokenInfo(TOKEN_ADDRESS, RPC_ENDPOINT);
}

export async function fetchBalance(account: Address): Promise<string> {
  const balance = await getBalance(TOKEN_ADDRESS, account, RPC_ENDPOINT);
  return balance.formatted;
}

export async function sendTokens(
  to: Address, 
  amount: string, 
  privateKey: string
): Promise<string> {
  return transfer(TOKEN_ADDRESS, to, amount, privateKey, RPC_ENDPOINT);
}

export async function mintTokens(
  to: Address, 
  amount: string, 
  privateKey: string
): Promise<string> {
  return mint(TOKEN_ADDRESS, to, amount, privateKey, RPC_ENDPOINT);
}

export async function burnTokens(
  amount: string, 
  privateKey: string
): Promise<string> {
  return burn(TOKEN_ADDRESS, amount, privateKey, RPC_ENDPOINT);
}

export const TOKEN_CONFIG = {
  name: 'SuperPositionToken',
  symbol: 'SPT',
  network: 'arbitrum-sepolia',
  features: ["ownable","mintable","burnable","pausable"],
} as const;
