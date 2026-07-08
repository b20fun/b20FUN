import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { Attribution } from 'ox/erc8021';
import { http } from 'wagmi';

// Base Builder Code - Get yours from base.dev > Settings > Builder Code
// This enables onchain attribution for all transactions made through the app
// Replace 'bc_b20token' with your actual code from base.dev
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_b20token';

// Generate the ERC-8021 attribution suffix
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

export const config = getDefaultConfig({
  appName: 'B20 FUN',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  chains: [base], // Base Mainnet (Chain ID: 8453)
  transports: {
    [base.id]: http(),
  },
  // Automatically append Builder Code to all transactions for attribution
  dataSuffix: DATA_SUFFIX,
  ssr: true,
});
