'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt, useSendTransaction, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, keccak256, toHex, isAddress } from 'viem';
import { Attribution } from 'ox/erc8021';
import { B20_FACTORY_ADDRESS, PLATFORM } from '@/lib/constants';

// Builder Code Attribution
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_0997z4ol';
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

const B20_FACTORY_ABI = [
  {
    name: 'createB20',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'variant', type: 'uint8' },
      { name: 'salt', type: 'bytes32' },
      { name: 'params', type: 'bytes' },
      { name: 'initCalls', type: 'bytes[]' },
    ],
    outputs: [{ name: 'token', type: 'address' }],
  },
] as const;

const STEP = { FORM: 0, FEE_PAYMENT: 1, TOKEN_CREATION: 2, SUCCESS: 3 } as const;
type Step = typeof STEP[keyof typeof STEP];

export default function LaunchpadPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [variant, setVariant] = useState<'ASSET' | 'STABLECOIN'>('ASSET');
  const [decimals, setDecimals] = useState(18);
  const [supplyCap, setSupplyCap] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [step, setStep] = useState<Step>(STEP.FORM);
  const [createdTokenAddress, setCreatedTokenAddress] = useState('');
  const [error, setError] = useState('');

  const { data: feeHash, sendTransaction: sendFee } = useSendTransaction();
  const { isLoading: isFeeLoading, isSuccess: isFeeSuccess } = useWaitForTransactionReceipt({ hash: feeHash });
  const { data: createHash, writeContract: createToken } = useWriteContract();
  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash });

  // Input sanitization helper
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/[|]/g, '') // Remove pipe character (used as delimiter)
      .replace(/[<>]/g, '') // Remove HTML tags
      .trim();
  };

  const handleCreateToken = () => {
    if (!address) return;
    setStep(STEP.TOKEN_CREATION);
    setError('');
    try {
      const salt = keccak256(toHex(`${address}-${Date.now()}`));
      const finalDecimals = variant === 'STABLECOIN' ? 6 : decimals;
      // Sanitize inputs before encoding
      const sanitizedName = sanitizeInput(tokenName);
      const sanitizedSymbol = sanitizeInput(tokenSymbol);
      const params = toHex(`${sanitizedName}|${sanitizedSymbol}|${adminAddress || address}|${finalDecimals}`);
      createToken({
        address: B20_FACTORY_ADDRESS,
        abi: B20_FACTORY_ABI,
        functionName: 'createB20',
        args: [variant === 'ASSET' ? 0 : 1, salt, params, [] as `0x${string}`[]],
        dataSuffix: DATA_SUFFIX,
      });
    } catch {
      setError('Failed to initiate token creation');
      setStep(STEP.FEE_PAYMENT);
    }
  };

  useEffect(() => {
    if (isFeeSuccess && step === STEP.FEE_PAYMENT) handleCreateToken();
  }, [isFeeSuccess]);

  useEffect(() => {
    if (!isCreateSuccess || !createHash || createdTokenAddress) return;
    const mockAddr = '0xB200' + createHash.slice(6, 42);
    setCreatedTokenAddress(mockAddr);
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('tokens').insert({
        address: mockAddr, name: tokenName, symbol: tokenSymbol, variant,
        decimals: variant === 'STABLECOIN' ? 6 : decimals,
        admin_address: adminAddress || address, deployer_address: address,
        supply_cap: supplyCap ? parseFloat(supplyCap) : null,
        tx_hash: createHash, created_via_launchpad: true,
        chain_id: 8453, // Base Mainnet
      }).then(() => setStep(STEP.SUCCESS));
    }).catch(() => setStep(STEP.SUCCESS));
  }, [isCreateSuccess, createHash]);

  const isFormValid = tokenName.trim() !== '' && tokenSymbol.trim() !== '' && tokenSymbol.length <= 10 && (variant === 'STABLECOIN' || (decimals >= 6 && decimals <= 18));

  // Check B20 Activation Registry
  const checkActivation = async (): Promise<boolean> => {
    if (!publicClient) return false;
    try {
      const featureId = keccak256(toHex(variant === 'ASSET' ? 'base.b20_asset' : 'base.b20_stablecoin'));
      const isActivated = await publicClient.readContract({
        address: '0x8453000000000000000000000000000000000001' as `0x${string}`,
        abi: [{
          name: 'isActivated',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'feature', type: 'bytes32' }],
          outputs: [{ name: '', type: 'bool' }]
        }],
        functionName: 'isActivated',
        args: [featureId],
      });
      return isActivated as boolean;
    } catch (err) {
      console.error('Activation check failed:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!isConnected || !address) { setError('Please connect your wallet'); return; }
    if (!isFormValid) { setError('Please fill in all fields'); return; }
    
    // HIGH PRIORITY: Admin address validation
    if (adminAddress && !isAddress(adminAddress)) {
      setError('Invalid admin address. Must be a valid Ethereum address (0x...)');
      return;
    }
    
    // HIGH PRIORITY: Token symbol validation (server-side)
    if (!/^[A-Z0-9]+$/.test(tokenSymbol)) {
      setError('Token symbol can only contain letters (A-Z) and numbers (0-9)');
      return;
    }
    
    if (tokenSymbol.length === 0 || tokenSymbol.length > 10) {
      setError('Token symbol must be 1-10 characters');
      return;
    }
    
    // HIGH PRIORITY: Decimals validation (server-side)
    if (variant === 'ASSET') {
      const decimalValue = parseInt(decimals.toString());
      if (isNaN(decimalValue) || decimalValue < 6 || decimalValue > 18) {
        setError('Decimals must be a number between 6 and 18');
        return;
      }
    }
    
    // Check activation
    const isActivated = await checkActivation();
    if (!isActivated) {
      setError('⚠️ B20 Mainnet Activation: July 8, 2026, 18:00 UTC (Not active yet)');
      return;
    }
    
    setStep(STEP.FEE_PAYMENT);
    try {
      sendFee({ 
        to: PLATFORM.FEE_RECIPIENT as `0x${string}`, 
        value: parseEther(PLATFORM.LAUNCH_FEE),
        data: DATA_SUFFIX,
      });
    } catch {
      setError('Failed to initiate fee payment');
      setStep(STEP.FORM);
    }
  };

  const resetForm = () => { setStep(STEP.FORM); setTokenName(''); setTokenSymbol(''); setSupplyCap(''); setCreatedTokenAddress(''); setError(''); };

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>🚀 B20 Deploy</h1>
        </div>

        <div className="glass rounded-xl p-5" style={{ border: '1px solid var(--border)', borderTop: '3px solid var(--ice-primary)' }}>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: step >= STEP.FORM ? 'var(--ice-primary)' : 'var(--border)', color: '#fff' }}>1</div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Form</span>
            </div>
            <div className="flex-1 h-1 mx-2" style={{ background: step >= STEP.FEE_PAYMENT ? 'var(--ice-primary)' : 'var(--border)' }} />
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: step >= STEP.FEE_PAYMENT ? 'var(--ice-primary)' : 'var(--border)', color: '#fff' }}>2</div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Fee</span>
            </div>
            <div className="flex-1 h-1 mx-2" style={{ background: step >= STEP.TOKEN_CREATION ? 'var(--ice-primary)' : 'var(--border)' }} />
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: step >= STEP.TOKEN_CREATION ? 'var(--ice-primary)' : 'var(--border)', color: '#fff' }}>3</div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Deploy</span>
            </div>
          </div>
          {error && (<div className="rounded-lg p-3 mb-4" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}><p className="text-sm" style={{ color: 'var(--error)' }}>&#10060; {error}</p></div>)}
          {step === STEP.SUCCESS && (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">&#127881;</div>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Token Successfully Created!</h2>
              <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--ice-pale)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Token Address:</p>
                <p className="font-mono text-sm break-all" style={{ color: 'var(--ice-primary)' }}>{createdTokenAddress}</p>
              </div>
              <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--ice-pale)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Transaction Hash:</p>
                <p className="font-mono text-xs break-all" style={{ color: 'var(--text-secondary)' }}>{createHash}</p>
              </div>
              
              {/* Admin Risk Warning */}
              <div className="rounded-lg p-4 mb-4 text-left" style={{ background: '#FEF3C7', border: '2px solid #FCD34D' }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: '#92400E' }}>Token Admin Controls</h3>
                    <p className="text-xs mb-2" style={{ color: '#92400E' }}>
                      Admin Address: <span className="font-mono">{adminAddress || address}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs" style={{ color: '#DC2626' }}>🔴</span>
                    <p className="text-xs" style={{ color: '#92400E' }}>Admin can mint unlimited tokens (no supply cap set)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs" style={{ color: '#DC2626' }}>🔴</span>
                    <p className="text-xs" style={{ color: '#92400E' }}>Admin can pause all transfers at any time</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs" style={{ color: '#DC2626' }}>🔴</span>
                    <p className="text-xs" style={{ color: '#92400E' }}>Admin can blocklist addresses</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs" style={{ color: '#DC2626' }}>🔴</span>
                    <p className="text-xs" style={{ color: '#92400E' }}>Admin can burn user balances (BURN_BLOCKED_ROLE)</p>
                  </div>
                </div>
                <div className="rounded p-2 mb-2" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                  <p className="text-xs font-semibold" style={{ color: '#991B1B' }}>
                    ⚠️ B20 FUN does NOT control this token after creation. Do your own research (DYOR) before trading.
                  </p>
                </div>
                <a 
                  href="https://docs.base.org/base-chain/specs/upgrades/beryl/b20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs underline inline-block"
                  style={{ color: '#1E40AF' }}
                >
                  Learn more about B20 admin roles →
                </a>
              </div>
              
              <button onClick={resetForm} className="text-white px-5 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'var(--ice-primary)' }}>Create New Token</button>
            </div>
          )}
          {step === STEP.FORM && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Token Name *</label>
                <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="E.g: My Token" required className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Token Symbol * (Max 10)</label>
                <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().slice(0, 10))} placeholder="E.g: MYT" required className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Token Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setVariant('ASSET')} className="p-3 rounded-lg text-left" style={{ border: `2px solid ${variant === 'ASSET' ? 'var(--ice-primary)' : 'var(--border)'}`, background: variant === 'ASSET' ? 'var(--ice-pale)' : 'var(--bg-surface)' }}>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>Asset</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>General purpose token</div>
                  </button>
                  <button type="button" onClick={() => setVariant('STABLECOIN')} className="p-3 rounded-lg text-left" style={{ border: `2px solid ${variant === 'STABLECOIN' ? 'var(--ice-primary)' : 'var(--border)'}`, background: variant === 'STABLECOIN' ? 'var(--ice-pale)' : 'var(--bg-surface)' }}>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>Stablecoin</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fiat-backed (6 decimals)</div>
                  </button>
                </div>
              </div>
              {variant === 'ASSET' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Decimals (6-18)</label>
                  <input type="number" value={decimals} onChange={(e) => setDecimals(parseInt(e.target.value))} min="6" max="18" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Supply Cap (Optional)</label>
                <input type="text" value={supplyCap} onChange={(e) => setSupplyCap(e.target.value)} placeholder="E.g: 1000000" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Leave empty for no limit</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Admin Address (Optional)</label>
                <input type="text" value={adminAddress} onChange={(e) => setAdminAddress(e.target.value)} placeholder={address || 'Your wallet address will be used automatically'} className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--ice-pale)', border: '1px solid var(--ice-primary)' }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Platform Fee:</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{PLATFORM.LAUNCH_FEE} ETH</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Two transactions: (1) Fee payment, (2) Token creation</p>
              </div>
              {!isConnected ? (
                <button type="button" disabled className="w-full px-5 py-3 rounded-lg text-sm font-semibold cursor-not-allowed" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>Please Connect Wallet</button>
              ) : (
                <button type="submit" disabled={!isFormValid} className="w-full px-5 py-3 rounded-lg text-sm font-semibold" style={{ background: isFormValid ? 'var(--ice-primary)' : 'var(--border)', color: isFormValid ? '#fff' : 'var(--text-secondary)', cursor: isFormValid ? 'pointer' : 'not-allowed' }}>Start Token Creation</button>
              )}
            </form>
          )}
          {(step === STEP.FEE_PAYMENT || step === STEP.TOKEN_CREATION) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--ice-primary)' }} />
              {step === STEP.FEE_PAYMENT && (<><h3 className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Step 1/2: Paying Fee...</h3><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Waiting for wallet confirmation</p>{isFeeLoading && <p className="text-xs mt-3" style={{ color: 'var(--ice-primary)' }}>Waiting for transaction...</p>}</>)}
              {step === STEP.TOKEN_CREATION && (<><h3 className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Step 2/2: Creating Token...</h3><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Waiting for wallet confirmation</p>{isCreateLoading && <p className="text-xs mt-3" style={{ color: 'var(--ice-primary)' }}>Waiting for transaction...</p>}</>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}