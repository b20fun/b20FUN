-- Supabase Migration: Add chain_id column to tokens table
-- Base Mainnet Migration - 2026-07-07

-- Add chain_id column to tokens table
ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS chain_id INTEGER DEFAULT 8453;

-- Add index for faster queries by chain
CREATE INDEX IF NOT EXISTS idx_tokens_chain_id ON tokens(chain_id);

-- Add comment to column
COMMENT ON COLUMN tokens.chain_id IS 'Blockchain network ID: 8453 (Base Mainnet), 84532 (Base Sepolia)';

-- Optional: Add check constraint to only allow Base networks
ALTER TABLE tokens 
ADD CONSTRAINT check_chain_id_base_networks 
CHECK (chain_id IN (8453, 84532));

-- Update existing rows to Base Mainnet if NULL
UPDATE tokens 
SET chain_id = 8453 
WHERE chain_id IS NULL;

-- Make column NOT NULL after setting defaults
ALTER TABLE tokens 
ALTER COLUMN chain_id SET NOT NULL;


-- ======================================================
-- Swap History Table Migration
-- Created: 2026-07-09
-- Purpose: Track all swap transactions for user history
-- ======================================================

-- Create swap_history table
CREATE TABLE IF NOT EXISTS swap_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  user_address TEXT NOT NULL,
  from_token_address TEXT NOT NULL,
  to_token_address TEXT NOT NULL,
  from_token_symbol TEXT NOT NULL,
  to_token_symbol TEXT NOT NULL,
  from_token_name TEXT,
  to_token_name TEXT,
  from_amount TEXT NOT NULL,
  to_amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  dex_used TEXT, -- 'uniswap' or 'aerodrome'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chain_id INTEGER DEFAULT 8453,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_swap_history_user ON swap_history(user_address);
CREATE INDEX IF NOT EXISTS idx_swap_history_timestamp ON swap_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_swap_history_tx_hash ON swap_history(tx_hash);
CREATE INDEX IF NOT EXISTS idx_swap_history_status ON swap_history(status);

-- Add constraint for status values
ALTER TABLE swap_history 
ADD CONSTRAINT check_swap_status 
CHECK (status IN ('pending', 'completed', 'failed'));

-- Add comments
COMMENT ON TABLE swap_history IS 'Stores all swap transaction history for users';
COMMENT ON COLUMN swap_history.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN swap_history.user_address IS 'User wallet address who initiated the swap';
COMMENT ON COLUMN swap_history.status IS 'Transaction status: pending, completed, failed';
COMMENT ON COLUMN swap_history.dex_used IS 'Which DEX was used: uniswap or aerodrome';


-- ======================================================
-- Add logo columns to swap_history table
-- Created: 2026-07-09
-- Purpose: Store token logo URLs for better UI display
-- ======================================================

ALTER TABLE swap_history 
ADD COLUMN IF NOT EXISTS from_token_logo TEXT,
ADD COLUMN IF NOT EXISTS to_token_logo TEXT;

COMMENT ON COLUMN swap_history.from_token_logo IS 'Logo URL for the source token';
COMMENT ON COLUMN swap_history.to_token_logo IS 'Logo URL for the destination token';
