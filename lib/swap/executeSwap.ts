// lib/swap/executeSwap.ts
//
// Function that actually sends the swap transaction to the chain. We handle
// the difference between native ETH (when user selects "ETH") and ERC-20/B20
// tokens here — the user will never see the word "WETH" in the interface.
//
// ⚠️ TEST WARNING: Uniswap SwapRouter02's "send ETH and pass WETH as tokenIn"
// behavior (input side) is a known, common pattern in periphery contracts,
// but verify the behavior on the specific Base Sepolia deploy by REALLY
// testing — try the first swap with a small amount.

import { type Address, encodeFunctionData } from "viem";
import type { WriteContractMutateAsync } from "wagmi/query";
import {
  swapRouter02Abi,
  aerodromeRouterAbi,
  CONTRACTS,
  NATIVE_ETH,
} from "./abis";
import type { DexQuote } from "./getBestQuote";
import type { Config } from 'wagmi';
import type { WriteContractMutateAsync } from 'wagmi/query';

type ExecuteSwapArgs = {
  writeContractAsync: WriteContractMutateAsync<Config, unknown>;
  best: DexQuote;
  tokenIn: Address; // NATIVE_ETH olabilir
  tokenOut: Address; // NATIVE_ETH olabilir
  amountIn: bigint;
  minAmountOut: bigint;
  userAddress: Address;
  dataSuffix?: `0x${string}`; // Builder Code attribution
};

const FEE_TIER = 3000;

export async function executeSwap({
  writeContractAsync,
  best,
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  userAddress,
  dataSuffix,
}: ExecuteSwapArgs): Promise<`0x${string}`> {
  const isEthIn = tokenIn === NATIVE_ETH;
  const isEthOut = tokenOut === NATIVE_ETH;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

  // ---------------- WETH WRAP/UNWRAP ----------------
  // ETH → WETH or WETH → ETH: Use WETH contract directly
  console.log('executeSwap called:', {
    dex: best.dex,
    isEthIn,
    isEthOut,
    tokenIn,
    tokenOut,
    amountIn: amountIn.toString(),
    wethAddr: CONTRACTS.weth
  });
  
  if (best.dex === "weth-wrap") {
    const wethAddr = CONTRACTS.weth as Address;
    
    // ETH → WETH: deposit()
    if (isEthIn) {
      console.log('Executing ETH → WETH wrap via deposit()', { wethAddr, value: amountIn.toString() });
      return writeContractAsync({
        address: wethAddr,
        abi: [
          {
            inputs: [],
            name: "deposit",
            outputs: [],
            stateMutability: "payable",
            type: "function",
          },
        ] as const,
        functionName: "deposit",
        value: amountIn,
        dataSuffix,
      });
    }
    
    // WETH → ETH: withdraw()
    if (isEthOut) {
      console.log('Executing WETH → ETH unwrap via withdraw()', { wethAddr, amount: amountIn.toString() });
      return writeContractAsync({
        address: wethAddr,
        abi: [
          {
            inputs: [{ internalType: "uint256", name: "wad", type: "uint256" }],
            name: "withdraw",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const,
        functionName: "withdraw",
        args: [amountIn],
        dataSuffix,
      });
    }
    
    console.error('WETH wrap/unwrap: Neither isEthIn nor isEthOut is true!', { isEthIn, isEthOut, tokenIn, tokenOut });
    throw new Error('WETH wrap/unwrap logic error');
  }

  // ---------------- AERODROME ----------------
  // Aerodrome has separate, simple functions for native ETH —
  // wrap/unwrap is done automatically inside the contract.
  if (best.dex === "aerodrome") {
    const route = {
      from: isEthIn ? (CONTRACTS.weth as Address) : tokenIn,
      to: isEthOut ? (CONTRACTS.weth as Address) : tokenOut,
      stable: false,
      factory: CONTRACTS.aerodrome.poolFactory as Address,
    };

    if (isEthIn) {
      return writeContractAsync({
        address: CONTRACTS.aerodrome.router as Address,
        abi: aerodromeRouterAbi,
        functionName: "swapExactETHForTokens",
        args: [minAmountOut, [route], userAddress, deadline],
        value: amountIn, // ETH sent here
        dataSuffix,
      });
    }

    if (isEthOut) {
      return writeContractAsync({
        address: CONTRACTS.aerodrome.router as Address,
        abi: aerodromeRouterAbi,
        functionName: "swapExactTokensForETH",
        args: [amountIn, minAmountOut, [route], userAddress, deadline],
        dataSuffix,
      });
    }

    // Token -> Token (no native ETH)
    return writeContractAsync({
      address: CONTRACTS.aerodrome.router as Address,
      abi: aerodromeRouterAbi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, minAmountOut, [route], userAddress, deadline],
      dataSuffix,
    });
  }

  // ---------------- UNISWAP V3 ----------------
  const wethAddr = CONTRACTS.weth as Address;

  // Simple case: no ETH input, no ETH output → single call is enough
  if (!isEthIn && !isEthOut) {
    return writeContractAsync({
      address: CONTRACTS.uniswap.swapRouter02 as Address,
      abi: swapRouter02Abi,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          fee: FEE_TIER,
          recipient: userAddress,
          amountIn,
          amountOutMinimum: minAmountOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
      dataSuffix,
    });
  }

  // ETH input: tokenIn = WETH, msg.value = amountIn.
  // Router automatically converts sent ETH to WETH and does the swap.
  if (isEthIn && !isEthOut) {
    return writeContractAsync({
      address: CONTRACTS.uniswap.swapRouter02 as Address,
      abi: swapRouter02Abi,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: wethAddr,
          tokenOut,
          fee: FEE_TIER,
          recipient: userAddress,
          amountIn,
          amountOutMinimum: minAmountOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
      value: amountIn,
      dataSuffix,
    });
  }

  // ETH output: swap result must be held in ROUTER (recipient = router
  // address itself), then unwrapWETH9 sends native ETH to user.
  // Both are combined in ONE transaction via multicall.
  if (isEthOut) {
    const swapCalldata = encodeExactInputSingle({
      tokenIn: isEthIn ? wethAddr : tokenIn,
      tokenOut: wethAddr,
      fee: FEE_TIER,
      recipient: CONTRACTS.uniswap.swapRouter02 as Address, // router itself
      amountIn,
      amountOutMinimum: minAmountOut,
      sqrtPriceLimitX96: 0n,
    });

    const unwrapCalldata = encodeUnwrapWETH9(minAmountOut, userAddress);

    return writeContractAsync({
      address: CONTRACTS.uniswap.swapRouter02 as Address,
      abi: swapRouter02Abi,
      functionName: "multicall",
      args: [[swapCalldata, unwrapCalldata]],
      value: isEthIn ? amountIn : 0n,
      dataSuffix,
    });
  }

  throw new Error("Unexpected swap state");
}

// --- Helper encode functions (needed for multicall) ---

function encodeExactInputSingle(params: {
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
  recipient: Address;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: bigint;
}): `0x${string}` {
  return encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: "exactInputSingle",
    args: [params],
  });
}

function encodeUnwrapWETH9(
  amountMinimum: bigint,
  recipient: Address
): `0x${string}` {
  return encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: "unwrapWETH9",
    args: [amountMinimum, recipient],
  });
}
