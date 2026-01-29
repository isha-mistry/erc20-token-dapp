# My Dapp

A Web3 application - foundation built with Cradle

## Quick Start

### 1. Navigate to the Frontend

```bash
cd apps/web
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add the required values:
- `PRIVATE_KEY`: Private key for deployment and transactions
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect Cloud project ID for wallet connections

> **Note**: Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components (including contract interaction panels)
│   ├── lib/              # Utilities (wagmi config, chains, utils)
│   └── hooks/            # Custom React hooks
├── package.json
└── .env.example
```

## Available Scripts

Run these commands from the `apps/web` directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Web3**: wagmi + viem
- **Wallet Connection**: RainbowKit

## License

MIT

---

Generated with ❤️ by [Cradle](https://cradle-web-eight.vercel.app)
