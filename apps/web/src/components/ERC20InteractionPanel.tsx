'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
    Coins,
    Send,
    ArrowRightLeft,
    Shield,
    Flame,
    RefreshCw,
    Check,
    Wallet,
    AlertCircle,
    ExternalLink,
    Loader2,
    Globe,
    ChevronDown,
    ChevronUp,
    BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from 'wagmi';
import { arbitrum, arbitrumSepolia, type Chain } from 'wagmi/chains';

// Define custom Superposition chains
const superposition: Chain = {
    id: 55244,
    name: 'Superposition',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://rpc.superposition.so'] },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://explorer.superposition.so' },
    },
};

const superpositionTestnet: Chain = {
    id: 98985,
    name: 'Superposition Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'SPN',
        symbol: 'SPN',
    },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.superposition.so'] },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://testnet-explorer.superposition.so' },
    },
    testnet: true,
};

// ERC20 ABI for the deployed Stylus contract (IStylusToken)
const ERC20_ABI = [
    // ERC20 Standard Interface
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    // StylusToken Specific Functions (from lib.rs)
    "function mint(uint256 value)",
    "function mintTo(address to, uint256 value)",
    "function burn(uint256 value)",
];

// Network-specific default contract addresses (only for networks where contracts are deployed)
const DEFAULT_CONTRACT_ADDRESSES: Record<string, string | undefined> = {
    'arbitrum-sepolia': '0x5af02ab1d47cc700c1ec4578618df15b8c9c565e',
    'arbitrum': undefined, // No default contract deployed on mainnet
    'superposition': undefined, // No default contract deployed on mainnet
    'superposition-testnet': '0x88be27d855cb563bfcb18fa466f67d32d62fd0af',
};

// Network configurations
const NETWORKS = {
    'arbitrum-sepolia': {
        name: 'Arbitrum Sepolia',
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        explorerUrl: 'https://sepolia.arbiscan.io',
        chainId: arbitrumSepolia.id,
        chain: arbitrumSepolia,
    },
    'arbitrum': {
        name: 'Arbitrum One',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        explorerUrl: 'https://arbiscan.io',
        chainId: arbitrum.id,
        chain: arbitrum,
    },
    'superposition': {
        name: 'Superposition',
        rpcUrl: 'https://rpc.superposition.so',
        explorerUrl: 'https://explorer.superposition.so',
        chainId: 55244,
        chain: superposition,
    },
    'superposition-testnet': {
        name: 'Superposition Testnet',
        rpcUrl: 'https://testnet-rpc.superposition.so',
        explorerUrl: 'https://testnet-explorer.superposition.so',
        chainId: 98985,
        chain: superpositionTestnet,
    },
};

interface ERC20InteractionPanelProps {
    contractAddress?: string;
    network?: 'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet';
}

interface TxStatus {
    status: 'idle' | 'pending' | 'success' | 'error';
    message: string;
    hash?: string;
}

export function ERC20InteractionPanel({
    contractAddress: initialAddress,
    network: initialNetwork = 'arbitrum-sepolia',
}: ERC20InteractionPanelProps) {
    const [selectedNetwork, setSelectedNetwork] = useState<'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet'>(initialNetwork);
    const [contractAddress, setContractAddress] = useState(initialAddress || DEFAULT_CONTRACT_ADDRESSES[initialNetwork] || '');
    const [showCustomContract, setShowCustomContract] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const networkConfig = NETWORKS[selectedNetwork];
    const rpcUrl = networkConfig.rpcUrl;
    const explorerUrl = networkConfig.explorerUrl;

    // Wagmi hooks for wallet connection
    const { address: userAddress, isConnected: walletConnected, chain: currentChain } = useAccount();
    const chainId = networkConfig.chainId;
    const publicClient = usePublicClient({ chainId: chainId as Parameters<typeof usePublicClient>[0] extends { chainId?: infer C } ? C : never });
    const { data: walletClient } = useWalletClient({ chainId });
    const { switchChainAsync } = useSwitchChain();

    // Token info
    const [tokenName, setTokenName] = useState<string | null>(null);
    const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
    const [decimals, setDecimals] = useState<number>(18);
    const [totalSupply, setTotalSupply] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState<string | null>(null);

    // Form inputs - Write operations
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferFromAddress, setTransferFromAddress] = useState('');
    const [transferFromTo, setTransferFromTo] = useState('');
    const [transferFromAmount, setTransferFromAmount] = useState('');
    const [approveSpender, setApproveSpender] = useState('');
    const [approveAmount, setApproveAmount] = useState('');
    const [mintAmount, setMintAmount] = useState('');
    const [mintToAddress, setMintToAddress] = useState('');
    const [mintToAmount, setMintToAmount] = useState('');
    const [burnAmount, setBurnAmount] = useState('');

    // Form inputs - Read operations
    const [allowanceOwner, setAllowanceOwner] = useState('');
    const [allowanceSpender, setAllowanceSpender] = useState('');
    const [allowanceResult, setAllowanceResult] = useState<string | null>(null);
    const [balanceCheckAddress, setBalanceCheckAddress] = useState('');
    const [balanceCheckResult, setBalanceCheckResult] = useState<string | null>(null);

    // Transaction status
    const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
    const [customAddressError, setCustomAddressError] = useState<string | null>(null);
    const [isValidatingContract, setIsValidatingContract] = useState(false);
    const [contractError, setContractError] = useState<string | null>(null);

    // Check if using the default contract for the selected network
    const defaultAddress = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
    const isUsingDefaultContract = defaultAddress && contractAddress === defaultAddress;
    const hasDefaultContract = !!defaultAddress;
    const displayExplorerUrl = explorerUrl;

    // Update contract address when network changes
    useEffect(() => {
        const newDefault = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
        if (newDefault && (isUsingDefaultContract || !initialAddress)) {
            setContractAddress(newDefault);
        } else if (!newDefault && !initialAddress) {
            setContractAddress('');
        }
    }, [selectedNetwork]);

    // Validate if an address is a contract
    const validateContract = async (address: string): Promise<boolean> => {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const code = await provider.getCode(address);
            return code !== '0x' && code.length > 2;
        } catch (error) {
            return false;
        }
    };

    // Update contract address when using custom
    const handleUseCustomContract = async () => {
        if (!customAddress || !ethers.isAddress(customAddress)) {
            setCustomAddressError('Invalid address format');
            return;
        }

        setIsValidatingContract(true);
        setCustomAddressError(null);

        const isContract = await validateContract(customAddress);
        if (!isContract) {
            setCustomAddressError('Address is not a contract');
            setIsValidatingContract(false);
            return;
        }

        setContractAddress(customAddress);
        setIsValidatingContract(false);
    };

    // Reset to default contract for the selected network
    const handleUseDefaultContract = () => {
        const defaultAddr = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
        setContractAddress(defaultAddr || '');
        setCustomAddress('');
        setCustomAddressError(null);
        setShowCustomContract(false);
    };

    const getReadContract = useCallback(() => {
        if (!contractAddress || !rpcUrl) return null;
        // Create a fresh provider with the current RPC URL
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        return new ethers.Contract(contractAddress, ERC20_ABI, provider);
    }, [contractAddress, rpcUrl, selectedNetwork]);

    const getWriteContract = useCallback(async () => {
        console.log('[ERC20] getWriteContract called', { contractAddress, walletConnected, currentChainId: currentChain?.id, targetChainId: networkConfig.chainId });

        if (!contractAddress) {
            console.error('[ERC20] No contract address');
            throw new Error('No contract address specified');
        }

        if (!walletConnected) {
            console.error('[ERC20] Wallet not connected');
            throw new Error('Please connect your wallet first');
        }

        // Check if ethereum provider exists
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
            console.error('[ERC20] No ethereum provider found');
            throw new Error('No wallet detected. Please install MetaMask.');
        }

        // Switch chain if necessary
        const targetChainIdHex = `0x${networkConfig.chainId.toString(16)}`;
        console.log('[ERC20] Current chain:', currentChain?.id, 'Target chain:', networkConfig.chainId);

        if (currentChain?.id !== networkConfig.chainId) {
            console.log('[ERC20] Switching chain to', networkConfig.name);
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChainIdHex }],
                });
                console.log('[ERC20] Chain switched successfully');
            } catch (switchError: any) {
                console.log('[ERC20] Switch error:', switchError.code, switchError.message);
                if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain') || switchError.message?.includes('wallet_addEthereumChain')) {
                    console.log('[ERC20] Chain not found, adding chain...');
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: targetChainIdHex,
                                chainName: networkConfig.name,
                                nativeCurrency: networkConfig.chain.nativeCurrency,
                                rpcUrls: [networkConfig.rpcUrl],
                                blockExplorerUrls: [networkConfig.explorerUrl],
                            }],
                        });
                        console.log('[ERC20] Chain added successfully');
                    } catch (addError: any) {
                        console.error('[ERC20] Failed to add chain:', addError);
                        throw new Error(`Failed to add ${networkConfig.name} to wallet: ${addError.message}`);
                    }
                } else if (switchError.code === 4001) {
                    throw new Error('User rejected chain switch');
                } else {
                    throw switchError;
                }
            }
        }

        console.log('[ERC20] Creating provider and signer...');
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        console.log('[ERC20] Signer address:', await signer.getAddress());

        const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
        console.log('[ERC20] Contract created at:', contractAddress);
        return contract;
    }, [contractAddress, walletConnected, currentChain?.id, networkConfig]);

    // Helper to parse RPC/contract errors into user-friendly messages
    const parseContractError = useCallback((error: any): string => {
        const errorMessage = error?.message || error?.reason || String(error);

        if (errorMessage.includes('BAD_DATA') || errorMessage.includes('could not decode result data')) {
            return `Contract not found or not deployed on ${networkConfig.name}. The contract may only exist on a different network.`;
        }
        if (errorMessage.includes('call revert exception')) {
            return `Contract call failed. The contract may not support this function or is not properly deployed on ${networkConfig.name}.`;
        }
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            return `Network connection error. Please check your connection and try again.`;
        }
        if (errorMessage.includes('execution reverted')) {
            return `Transaction reverted: ${error?.reason || 'Unknown reason'}`;
        }

        return `Error: ${error?.reason || error?.shortMessage || errorMessage.slice(0, 100)}`;
    }, [networkConfig.name]);

    const fetchTokenInfo = useCallback(async () => {
        const contract = getReadContract();
        if (!contract) return;

        setContractError(null);

        try {
            const [name, symbol, dec, supply] = await Promise.all([
                contract.name().catch(() => null),
                contract.symbol().catch(() => null),
                contract.decimals().catch(() => 18),
                contract.totalSupply().catch(() => 0),
            ]);

            // Check if we got valid data - if all are null/default, contract may not exist
            if (name === null && symbol === null) {
                setContractError(`Unable to read contract data. The contract may not be deployed on ${networkConfig.name}.`);
                setIsConnected(false);
                return;
            }

            setTokenName(name);
            setTokenSymbol(symbol);
            setDecimals(Number(dec));
            setTotalSupply(ethers.formatUnits(supply, dec));

            if (userAddress) {
                try {
                    const balance = await contract.balanceOf(userAddress);
                    setUserBalance(ethers.formatUnits(balance, dec));
                } catch (balanceError: any) {
                    console.error('Error fetching balance:', balanceError);
                    setContractError(parseContractError(balanceError));
                }
            }
            setIsConnected(true);
        } catch (error: any) {
            console.error('Error fetching token info:', error);
            setContractError(parseContractError(error));
            setIsConnected(false);
        }
    }, [getReadContract, userAddress, networkConfig.name, parseContractError]);

    useEffect(() => {
        if (contractAddress && rpcUrl) {
            fetchTokenInfo();
        }
    }, [contractAddress, rpcUrl, fetchTokenInfo, userAddress]);

    const handleTransaction = async (
        operation: () => Promise<ethers.TransactionResponse>,
        successMessage: string
    ) => {
        console.log('[ERC20] handleTransaction called, walletConnected:', walletConnected, 'txStatus:', txStatus.status);

        if (txStatus.status === 'pending') {
            console.log('[ERC20] Transaction already pending, skipping');
            return;
        }

        if (!walletConnected) {
            console.log('[ERC20] Wallet not connected');
            setTxStatus({ status: 'error', message: 'Please connect your wallet first' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
            return;
        }

        try {
            setTxStatus({ status: 'pending', message: 'Confirming...' });
            console.log('[ERC20] Executing operation...');
            const tx = await operation();
            console.log('[ERC20] Transaction submitted:', tx.hash);
            setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', hash: tx.hash });
            await tx.wait();
            console.log('[ERC20] Transaction confirmed');
            setTxStatus({ status: 'success', message: successMessage, hash: tx.hash });
            fetchTokenInfo();
        } catch (error: any) {
            console.error('[ERC20] Transaction error:', error);
            const errorMsg = error.reason || error.message || error.shortMessage || 'Transaction failed';
            setTxStatus({ status: 'error', message: errorMsg });
        }
        setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    };

    const handleTransfer = async () => {
        console.log('[ERC20] handleTransfer called');
        try {
            const contract = await getWriteContract();
            if (!contract || !transferTo || !transferAmount) return;
            handleTransaction(
                () => contract.transfer(transferTo, ethers.parseUnits(transferAmount, decimals)),
                `Transferred ${transferAmount} ${tokenSymbol || 'tokens'}!`
            );
        } catch (error: any) {
            console.error('[ERC20] handleTransfer error:', error);
            setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
        }
    };

    const handleTransferFrom = async () => {
        try {
            const contract = await getWriteContract();
            if (!contract || !transferFromAddress || !transferFromTo || !transferFromAmount) return;
            handleTransaction(
                () => contract.transferFrom(
                    transferFromAddress,
                    transferFromTo,
                    ethers.parseUnits(transferFromAmount, decimals)
                ),
                `Transferred ${transferFromAmount} ${tokenSymbol || 'tokens'} from ${transferFromAddress.slice(0, 6)}...!`
            );
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
        }
    };

    const handleApprove = async () => {
        console.log('[ERC20] handleApprove called');
        try {
            const contract = await getWriteContract();
            if (!contract || !approveSpender || !approveAmount) return;
            handleTransaction(
                () => contract.approve(approveSpender, ethers.parseUnits(approveAmount, decimals)),
                `Approved ${approveAmount} ${tokenSymbol || 'tokens'}!`
            );
        } catch (error: any) {
            console.error('[ERC20] handleApprove error:', error);
            setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
        }
    };

    const handleMint = async () => {
        console.log('[ERC20] handleMint called');
        try {
            const contract = await getWriteContract();
            if (!contract || !mintAmount) return;
            handleTransaction(
                () => contract.mint(ethers.parseUnits(mintAmount, decimals)),
                `Minted ${mintAmount} ${tokenSymbol || 'tokens'} to yourself!`
            );
        } catch (error: any) {
            console.error('[ERC20] handleMint error:', error);
            setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
        }
    };

    const handleMintTo = async () => {
        console.log('[ERC20] handleMintTo called');
        try {
            const contract = await getWriteContract();
            if (!contract || !mintToAddress || !mintToAmount) return;
            handleTransaction(
                () => contract.mintTo(mintToAddress, ethers.parseUnits(mintToAmount, decimals)),
                `Minted ${mintToAmount} ${tokenSymbol || 'tokens'}!`
            );
        } catch (error: any) {
            console.error('[ERC20] handleMintTo error:', error);
            setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
        }
    };

    const handleBurn = async () => {
        console.log('[ERC20] handleBurn called');
        try {
            const contract = await getWriteContract();
            if (!contract || !burnAmount) return;
            handleTransaction(
                () => contract.burn(ethers.parseUnits(burnAmount, decimals)),
                `Burned ${burnAmount} ${tokenSymbol || 'tokens'}!`
            );
        } catch (error: any) {
            console.error('[ERC20] handleBurn error:', error);
            setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
        }
    };

    const checkAllowance = async () => {
        const contract = getReadContract();
        if (!contract || !allowanceOwner || !allowanceSpender) return;
        try {
            const allowance = await contract.allowance(allowanceOwner, allowanceSpender);
            setAllowanceResult(ethers.formatUnits(allowance, decimals));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const checkBalance = async () => {
        const contract = getReadContract();
        if (!contract || !balanceCheckAddress) return;
        try {
            const balance = await contract.balanceOf(balanceCheckAddress);
            setBalanceCheckResult(ethers.formatUnits(balance, decimals));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const inputClass = 'input-field';
    const btnClass = (color: string) => cn('btn-primary', color);

    return (
        <div className="space-y-6 p-5 sm:p-6">
            {/* Token header */}
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/5 px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Coins className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {tokenName || 'ERC-20'} {tokenSymbol ? `(${tokenSymbol})` : 'Token'}
                        </h2>
                        <p className="text-sm text-slate-400">Stylus contract</p>
                    </div>
                </div>
            </div>

            {contractError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                    <p className="text-sm text-red-300">{contractError}</p>
                </div>
            )}

            {/* Wallet + Network row */}
            <div className="space-y-4">
                <div className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3',
                    walletConnected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'
                )}>
                    <Wallet className={cn('h-5 w-5 shrink-0', walletConnected ? 'text-emerald-400' : 'text-amber-400')} />
                    {walletConnected ? (
                        <span className="text-sm text-slate-200">
                            <span className="text-slate-400">Connected</span>{' '}
                            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-emerald-400">{userAddress?.slice(0, 6)}…{userAddress?.slice(-4)}</code>
                        </span>
                    ) : (
                        <span className="text-sm text-amber-200/90">Connect your wallet for write operations</span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                        <Globe className="h-4 w-4" /> Network
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(['arbitrum-sepolia', 'arbitrum', 'superposition', 'superposition-testnet'] as const).map((net) => (
                            <button
                                key={net}
                                onClick={() => setSelectedNetwork(net)}
                                className={cn(
                                    'rounded-xl border px-3 py-2.5 text-xs font-medium transition-all',
                                    selectedNetwork === net
                                        ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/10'
                                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                                )}
                            >
                                {NETWORKS[net].name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contract */}
            <div className="section-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Contract</span>
                        {isUsingDefaultContract && (
                            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">Default</span>
                        )}
                    </div>
                    <a
                        href={`${displayExplorerUrl}/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg font-mono text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                        {contractAddress.slice(0, 6)}…{contractAddress.slice(-4)}
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCustomContract(!showCustomContract)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <span>Use custom contract</span>
                    {showCustomContract ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showCustomContract && (
                    <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                        <input
                            type="text"
                            value={customAddress}
                            onChange={(e) => {
                                setCustomAddress(e.target.value);
                                setCustomAddressError(null);
                            }}
                            placeholder="0x..."
                            className={cn(inputClass, customAddressError && 'border-red-500/50 focus:ring-red-500/40')}
                        />
                        {customAddressError && (
                            <p className="flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" /> {customAddressError}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleUseCustomContract}
                                disabled={!customAddress || isValidatingContract}
                                className={cn(btnClass('bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 flex-1'), 'flex items-center justify-center gap-2')}
                            >
                                {isValidatingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isValidatingContract ? 'Validating…' : 'Use custom'}
                            </button>
                            <button
                                type="button"
                                onClick={handleUseDefaultContract}
                                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={fetchTokenInfo}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--forge-bg)]"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh token info
                </button>
            </div>

            {/* Transaction Status */}
            {txStatus.status !== 'idle' && (
                <div className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-3',
                    txStatus.status === 'pending' && 'border-sky-500/30 bg-sky-500/10',
                    txStatus.status === 'success' && 'border-emerald-500/30 bg-emerald-500/10',
                    txStatus.status === 'error' && 'border-red-500/30 bg-red-500/10'
                )}>
                    {txStatus.status === 'pending' && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-sky-400" />}
                    {txStatus.status === 'success' && <Check className="h-5 w-5 shrink-0 text-emerald-400" />}
                    {txStatus.status === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />}
                    <div className="min-w-0 flex-1">
                        <p className={cn(
                            'text-sm font-medium',
                            txStatus.status === 'pending' && 'text-sky-300',
                            txStatus.status === 'success' && 'text-emerald-300',
                            txStatus.status === 'error' && 'text-red-300'
                        )}>{txStatus.message}</p>
                        {txStatus.hash && (
                            <a href={`${explorerUrl}/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                                View on explorer <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Token Stats */}
            {isConnected && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="section-card flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                <Coins className="h-5 w-5" />
                            </div>
                            <span className="text-sm text-slate-400">Total supply</span>
                        </div>
                        <span className="text-lg font-semibold tabular-nums text-white">{totalSupply ? Number(totalSupply).toLocaleString() : '—'}</span>
                    </div>
                    {walletConnected && (
                        <div className="section-card flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <span className="text-sm text-slate-400">Your balance</span>
                            </div>
                            <span className="text-lg font-semibold tabular-nums text-white">{userBalance ? Number(userBalance).toLocaleString() : '—'}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Write Operations */}
            {isConnected && walletConnected && (
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Send className="h-4 w-4" />
                        </span>
                        Write operations
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Transfer */}
                        <div className="section-card space-y-3">
                            <span className="text-sm font-medium text-emerald-400">Transfer</span>
                            <input type="text" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="Recipient (0x…)" className={inputClass} />
                            <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount" className={inputClass} />
                            <button onClick={handleTransfer} disabled={txStatus.status === 'pending'} className={btnClass('bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500')}>
                                Transfer
                            </button>
                        </div>

                        {/* Transfer From */}
                        <div className="section-card space-y-3">
                            <div className="flex items-center gap-2 text-teal-400">
                                <ArrowRightLeft className="h-4 w-4" />
                                <span className="text-sm font-medium">Transfer from</span>
                            </div>
                            <input type="text" value={transferFromAddress} onChange={(e) => setTransferFromAddress(e.target.value)} placeholder="From (owner 0x…)" className={inputClass} />
                            <input type="text" value={transferFromTo} onChange={(e) => setTransferFromTo(e.target.value)} placeholder="To (recipient 0x…)" className={inputClass} />
                            <input type="number" value={transferFromAmount} onChange={(e) => setTransferFromAmount(e.target.value)} placeholder="Amount" className={inputClass} />
                            <button onClick={handleTransferFrom} disabled={txStatus.status === 'pending'} className={btnClass('bg-teal-600 hover:bg-teal-500 focus:ring-teal-500')}>
                                Transfer from
                            </button>
                        </div>

                        {/* Approve */}
                        <div className="section-card space-y-3">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Shield className="h-4 w-4" />
                                <span className="text-sm font-medium">Approve spender</span>
                            </div>
                            <input type="text" value={approveSpender} onChange={(e) => setApproveSpender(e.target.value)} placeholder="Spender (0x…)" className={inputClass} />
                            <input type="number" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} placeholder="Amount" className={inputClass} />
                            <button onClick={handleApprove} disabled={txStatus.status === 'pending'} className={btnClass('bg-blue-600 hover:bg-blue-500 focus:ring-blue-500')}>
                                Approve
                            </button>
                        </div>

                        {/* Mint (to self) */}
                        <div className="section-card space-y-3">
                            <div className="flex items-center gap-2 text-violet-400">
                                <Coins className="h-4 w-4" />
                                <span className="text-sm font-medium">Mint (to yourself)</span>
                            </div>
                            <input type="number" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" className={inputClass} />
                            <button onClick={handleMint} disabled={txStatus.status === 'pending'} className={btnClass('bg-violet-600 hover:bg-violet-500 focus:ring-violet-500')}>
                                Mint
                            </button>
                        </div>

                        {/* Mint To */}
                        <div className="section-card space-y-3">
                            <div className="flex items-center gap-2 text-fuchsia-400">
                                <Coins className="h-4 w-4" />
                                <span className="text-sm font-medium">Mint to address</span>
                            </div>
                            <input type="text" value={mintToAddress} onChange={(e) => setMintToAddress(e.target.value)} placeholder="To address (0x…)" className={inputClass} />
                            <input type="number" value={mintToAmount} onChange={(e) => setMintToAmount(e.target.value)} placeholder="Amount" className={inputClass} />
                            <button onClick={handleMintTo} disabled={txStatus.status === 'pending'} className={btnClass('bg-fuchsia-600 hover:bg-fuchsia-500 focus:ring-fuchsia-500')}>
                                Mint to
                            </button>
                        </div>

                        {/* Burn */}
                        <div className="section-card space-y-3">
                            <div className="flex items-center gap-2 text-orange-400">
                                <Flame className="h-4 w-4" />
                                <span className="text-sm font-medium">Burn tokens</span>
                            </div>
                            <input type="number" value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder="Amount" className={inputClass} />
                            <button onClick={handleBurn} disabled={txStatus.status === 'pending'} className={btnClass('bg-orange-600 hover:bg-orange-500 focus:ring-orange-500')}>
                                Burn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Read Operations */}
            {isConnected && (
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                            <BookOpen className="h-4 w-4" />
                        </span>
                        Read operations
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Check Allowance */}
                        <div className="section-card space-y-3">
                            <span className="text-sm font-medium text-purple-400">Check allowance</span>
                            <input type="text" value={allowanceOwner} onChange={(e) => setAllowanceOwner(e.target.value)} placeholder="Owner (0x…)" className={inputClass} />
                            <input type="text" value={allowanceSpender} onChange={(e) => setAllowanceSpender(e.target.value)} placeholder="Spender (0x…)" className={inputClass} />
                            <button type="button" onClick={checkAllowance} className={btnClass('bg-purple-600 hover:bg-purple-500 focus:ring-purple-500')}>
                                Check allowance
                            </button>
                            {allowanceResult !== null && (
                                <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2">
                                    <p className="text-sm text-purple-300">Allowance: <span className="font-semibold text-white">{allowanceResult}</span></p>
                                </div>
                            )}
                        </div>

                        {/* Check Balance */}
                        <div className="section-card space-y-3">
                            <span className="text-sm font-medium text-cyan-400">Check balance</span>
                            <input type="text" value={balanceCheckAddress} onChange={(e) => setBalanceCheckAddress(e.target.value)} placeholder="Address (0x…)" className={inputClass} />
                            <button type="button" onClick={checkBalance} className={btnClass('bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500')}>
                                Check balance
                            </button>
                            {balanceCheckResult !== null && (
                                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
                                    <p className="text-sm text-cyan-300">Balance: <span className="font-semibold text-white">{Number(balanceCheckResult).toLocaleString()}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
