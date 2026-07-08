import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'B20TOKEN',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  chains: [base], // Base Mainnet (Chain ID: 8453)
  ssr: true,
});
