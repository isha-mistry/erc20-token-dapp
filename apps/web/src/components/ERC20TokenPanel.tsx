'use client';

/**
 * ERC-20 Token Interaction Panel
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useERC20Interactions } from '@cradle/erc20-stylus';
import type { Address } from 'viem';

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as Address;

export function ERC20TokenPanel() {
  const { address: userAddress } = useAccount();
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const token = useERC20Interactions({
    contractAddress: TOKEN_ADDRESS,
    network: 'arbitrum-sepolia',
    userAddress,
  });

  const tokenInfo = token.tokenInfo.status === 'success' ? token.tokenInfo.data : null;
  const balance = token.balance.status === 'success' ? token.balance.data : null;

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;
    try {
      await token.transfer(transferTo as Address, transferAmount);
      setTransferTo('');
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  if (!TOKEN_ADDRESS) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-400">
          Token not deployed yet. Run <code>pnpm deploy:token</code> to deploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Token Info */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {tokenInfo?.name || 'SuperPositionToken'} ({tokenInfo?.symbol || 'SPT'})
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Total Supply: {tokenInfo?.formattedTotalSupply || '...'}</p>
          <p>Your Balance: {balance?.formatted || '0'}</p>
          <p className="text-xs font-mono truncate">{TOKEN_ADDRESS}</p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Transfer Tokens</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={handleTransfer}
            disabled={token.isLoading || !transferTo || !transferAmount}
            className="w-full px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            {token.isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {token.txState.status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction successful: {token.txState.hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {token.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{token.error.message}</p>
        </div>
      )}
    </div>
  );
}
