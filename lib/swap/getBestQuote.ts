// lib/swap/getBestQuote.ts
// Fetches quotes from Uniswap V3 and Aerodrome simultaneously, returns the best one.

import { type Address, type PublicClient } from "viem";
import {
  quoterV2Abi,
  aerodromeRouterAbi,
  CONTRACTS,
  NATIVE_ETH,
} from "./abis";

// Pools always exist with WETH, not with native ETH.
// When getting quotes, we convert the NATIVE_ETH sentinel to the WETH address —
// the price will be the same, only in the SENDING stage of the swap does the
// native/wrapped difference come into play (see executeSwap.ts).
function toQuotableAddress(addr: Address): Address {
  return addr === NATIVE_ETH ? (CONTRACTS.weth as Address) : addr;
}

export type DexQuote = {
  dex: "uniswap" | "aerodrome" | "weth-wrap";
  amountOut: bigint;
  error?: string;
};

export type BestQuoteResult = {
  best: DexQuote | null;
  all: DexQuote[];
};

const DEFAULT_FEE_TIER = 3000; // 0.3% — Most common pool fee in Uniswap V3

/**
 * Gets a quote from Uniswap QuoterV2.
 * NOTE: QuoterV2 is not a "view" function (internally returns data via revert),
 * but viem's readContract simulates this (via eth_call) and works correctly —
 * it doesn't send a real transaction, doesn't cost gas.
 */
async function getUniswapQuote(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<DexQuote> {
  try {
    const result = await client.readContract({
      address: CONTRACTS.uniswap.quoterV2 as Address,
      abi: quoterV2Abi,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          amountIn,
          fee: DEFAULT_FEE_TIER,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    // result: [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
    return { dex: "uniswap", amountOut: result[0] };
  } catch (err) {
    // If pool doesn't exist or liquidity is insufficient, this will fail — this is normal,
    // we just mark that DEX as "couldn't provide quote".
    return {
      dex: "uniswap",
      amountOut: 0n,
      error: err instanceof Error ? err.message : "Uniswap quote failed",
    };
  }
}

/**
 * Gets a quote from Aerodrome Router.
 * We use `stable: false` because B20 tokens will generally be volatile
 * (unbalanced price) assets — for stablecoin<->stablecoin pairs
 * this can be set to true.
 */
async function getAerodromeQuote(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<DexQuote> {
  try {
    const routes = [
      {
        from: tokenIn,
        to: tokenOut,
        stable: false,
        factory: CONTRACTS.aerodrome.poolFactory as Address,
      },
    ];

    const result = await client.readContract({
      address: CONTRACTS.aerodrome.router as Address,
      abi: aerodromeRouterAbi,
      functionName: "getAmountsOut",
      args: [amountIn, routes],
    });

    // result: amounts[] — last element is the output amount
    const amountOut = result[result.length - 1];
    return { dex: "aerodrome", amountOut };
  } catch (err) {
    return {
      dex: "aerodrome",
      amountOut: 0n,
      error: err instanceof Error ? err.message : "Aerodrome quote failed",
    };
  }
}

/**
 * Gets quotes from two DEXs in parallel, marks the one with the highest
 * amountOut as "best". If both fail, returns best: null —
 * in this case, "No liquidity found for this pair" should be shown in the UI.
 * 
 * SPECIAL CASE: ETH ↔ WETH swaps don't have liquidity pools because
 * they are essentially the same asset (wrap/unwrap operation). In this case,
 * we return a "weth-wrap" pseudo-dex with a 1:1 ratio.
 */
export async function getBestQuote(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<BestQuoteResult> {
  const wethAddr = CONTRACTS.weth as Address;
  
  // ÖZEL DURUM: ETH ↔ WETH (aynı token, sadece wrap/unwrap)
  // tokenIn/tokenOut burada RAW adresler (NATIVE_ETH veya gerçek adres)
  const isETHtoWETH = tokenIn === NATIVE_ETH && tokenOut.toLowerCase() === wethAddr.toLowerCase();
  const isWETHtoETH = tokenIn.toLowerCase() === wethAddr.toLowerCase() && tokenOut === NATIVE_ETH;
  
  if (isETHtoWETH || isWETHtoETH) {
    // 1:1 wrap/unwrap - likidite havuzu gereksiz
    return {
      best: { dex: "weth-wrap", amountOut: amountIn }, // 1:1 oran
      all: [{ dex: "weth-wrap", amountOut: amountIn }],
    };
  }

  const quotableIn = toQuotableAddress(tokenIn);
  const quotableOut = toQuotableAddress(tokenOut);

  const [uniswap, aerodrome] = await Promise.all([
    getUniswapQuote(client, quotableIn, quotableOut, amountIn),
    getAerodromeQuote(client, quotableIn, quotableOut, amountIn),
  ]);

  const all = [uniswap, aerodrome];
  const viable = all.filter((q) => q.amountOut > 0n);

  if (viable.length === 0) {
    return { best: null, all };
  }

  const best = viable.reduce((a, b) => (a.amountOut > b.amountOut ? a : b));
  return { best, all };
}
