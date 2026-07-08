'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { useEffect, useState } from 'react';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showModal, setShowModal] = useState(false);

  const isCorrectNetwork = chainId === base.id;

  useEffect(() => {
    if (isConnected && !isCorrectNetwork) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isConnected, isCorrectNetwork]);

  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: base.id });
  };

  if (!showModal) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-4 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">⚠️ Wrong Network</h2>
          <p className="text-gray-300 mb-6">
            This application runs on Base Mainnet. Please switch your network.
          </p>
          <button
            onClick={handleSwitchNetwork}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Switch to Base Mainnet
          </button>
        </div>
      </div>
    </>
  );
}
