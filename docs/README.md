# @cradle/erc20-stylus

ERC-20 Token implementation and interaction utilities for Arbitrum Stylus.

## Features

- **Ownable** - Owner-controlled contract management
- **Mintable** - Owner can mint new tokens
- **Burnable** - Token holders can burn their tokens
- **Pausable** - Owner can pause/unpause transfers
- Complete ERC-20 standard implementation
- React hooks for easy frontend integration

## Installation

```bash
pnpm add @cradle/erc20-stylus
```

## Smart Contract

The smart contract source code is located in the `contract/` directory. This is a Rust-based Stylus contract that can be deployed to Arbitrum.

### Prerequisites

1. Install Rust and Cargo:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install cargo-stylus:
   ```bash
   cargo install cargo-stylus
   ```

3. Add the WASM target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### Building the Contract

```bash
cd contract

# Check the contract compiles correctly
cargo stylus check

# Build for deployment
cargo build --release --target wasm32-unknown-unknown
```

### Deploying to Arbitrum

#### Arbitrum Sepolia (Testnet)

```bash
cd contract
cargo stylus deploy \
  --private-key <YOUR_PRIVATE_KEY> \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

#### Arbitrum One (Mainnet)

```bash
cd contract
cargo stylus deploy \
  --private-key <YOUR_PRIVATE_KEY> \
  --endpoint https://arb1.arbitrum.io/rpc
```

### Initializing the Contract

After deployment, call the `initialize` function with your token parameters:

```rust
// Function signature:
initialize(
    name: String,        // Token name (e.g., "My Token")
    symbol: String,      // Token symbol (e.g., "MTK")
    decimals: u8,        // Decimal places (typically 18)
    initial_supply: U256,// Initial supply (in smallest units)
    owner: Address       // Owner address
)
```

### Contract Functions

#### ERC-20 Standard
- `name()` - Returns the token name
- `symbol()` - Returns the token symbol
- `decimals()` - Returns the number of decimals
- `total_supply()` - Returns the total token supply
- `balance_of(account)` - Returns the balance of an account
- `transfer(to, value)` - Transfer tokens
- `approve(spender, value)` - Approve a spender
- `allowance(owner, spender)` - Get allowance
- `transfer_from(from, to, value)` - Transfer using allowance

#### Extended Functions
- `increase_allowance(spender, added_value)` - Increase allowance
- `decrease_allowance(spender, subtracted_value)` - Decrease allowance

#### Mintable (Owner Only)
- `mint(to, amount)` - Mint new tokens

#### Burnable
- `burn(amount)` - Burn caller's tokens
- `burn_from(from, amount)` - Burn tokens using allowance

#### Pausable (Owner Only)
- `pause()` - Pause transfers
- `unpause()` - Unpause transfers
- `is_paused()` - Check if paused

#### Ownable
- `owner()` - Get current owner
- `transfer_ownership(new_owner)` - Transfer ownership
- `renounce_ownership()` - Renounce ownership

## Frontend Usage

### Using React Hooks

```tsx
import { useERC20Interactions, CHAIN_IDS } from '@cradle/erc20-stylus';

function TokenDashboard() {
  const token = useERC20Interactions({
    contractAddress: '0x...', // Your deployed contract address
    rpcEndpoint: 'https://sepolia-rollup.arbitrum.io/rpc',
    privateKey: process.env.PRIVATE_KEY,
  });

  return (
    <div>
      <p>Name: {token.name}</p>
      <p>Symbol: {token.symbol}</p>
      <p>Total Supply: {token.totalSupply}</p>
      <button onClick={() => token.transfer('0x...', '100')}>
        Transfer 100 tokens
      </button>
    </div>
  );
}
```

### Using Interaction Functions Directly

```tsx
import { getTokenInfo, transfer, mint } from '@cradle/erc20-stylus';

// Get token information
const info = await getTokenInfo({
  contractAddress: '0x...',
  rpcEndpoint: 'https://sepolia-rollup.arbitrum.io/rpc',
});

console.log(info.name, info.symbol, info.totalSupply);

// Transfer tokens
await transfer({
  contractAddress: '0x...',
  rpcEndpoint: 'https://sepolia-rollup.arbitrum.io/rpc',
  privateKey: '0x...',
  to: '0x...',
  amount: '1000000000000000000', // 1 token (with 18 decimals)
});
```

## API Reference

### Constants

- `ERC20_ABI` - Full ABI for ERC20 Stylus contract
- `CHAIN_IDS` - Chain IDs for supported networks
- `RPC_ENDPOINTS` - Default RPC endpoints
- `FACTORY_ADDRESSES` - Factory contract addresses

### Hooks

- `useERC20Deploy` - Hook for deploying new ERC20 tokens
- `useERC20Interactions` - Hook for interacting with deployed tokens

### Functions

- `deployERC20TokenViaAPI` - Deploy a new ERC20 token via API
- `initializeToken` - Initialize a deployed token
- `getTokenInfo` - Get token information
- `getBalance` - Get token balance
- `getAllowance` - Get allowance
- `transfer` - Transfer tokens
- `approve` - Approve spender
- `transferFrom` - Transfer using allowance
- `mint` - Mint new tokens (owner only)
- `burn` - Burn tokens
- `pause` - Pause transfers (owner only)
- `unpause` - Unpause transfers (owner only)
- `transferOwnership` - Transfer contract ownership

## License

MIT OR Apache-2.0
