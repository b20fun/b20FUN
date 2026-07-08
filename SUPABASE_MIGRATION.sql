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
