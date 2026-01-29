import { WalletButton } from '@/components/wallet-button';
import { ERC20InteractionPanel } from '@/components/ERC20InteractionPanel';
import { Coins } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen dark">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[var(--card-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                ERC-20 Interactor
              </h1>
              <p className="text-sm text-slate-400">
                Read & write with any ERC-20 token
              </p>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--card-bg)] shadow-2xl shadow-black/20 ring-1 ring-white/[0.04]">
          <ERC20InteractionPanel />
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Connect your wallet, pick a network and contract, then use read/write
          operations. Supports Arbitrum Sepolia, Arbitrum One, and Superposition.
        </p>
      </main>
    </div>
  );
}
