# ERC-20 Token

# SuperPositionToken (SPT)

An ERC-20 token deployed on Arbitrum Sepolia using Stylus.

## Token Details

- **Name:** SuperPositionToken
- **Symbol:** SPT
- **Initial Supply:** 1000000
- **Network:** arbitrum-sepolia
- **Features:** ownable, mintable, burnable, pausable

## Deployment

```bash
pnpm deploy:token
```

This will deploy the token and output the contract address.

## Usage

### Get Token Info

```typescript
import { fetchTokenInfo } from '@/lib/erc20-token';

const info = await fetchTokenInfo();
console.log(info.name, info.symbol, info.formattedTotalSupply);
```

### Transfer Tokens

```typescript
import { sendTokens } from '@/lib/erc20-token';

await sendTokens('0x...', '100', privateKey);
```

### Mint Tokens (Owner Only)

```typescript
import { mintTokens } from '@/lib/erc20-token';

await mintTokens('0x...', '1000', privateKey);
```

## Contract Features

- **ownable**: Enabled
- **mintable**: Enabled
- **burnable**: Enabled
- **pausable**: Enabled
