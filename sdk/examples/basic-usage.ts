import { ValocracyClient } from '../src/clients/ValocracyClient';
import { calculateMana } from '../src/utils/decay';

const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const RPC_URL = "https://soroban-testnet.stellar.org";
const VALOCRACY_ID = process.env.VALOCRACY_ID || "CC...";

async function main() {
  const client = new ValocracyClient(NETWORK_PASSPHRASE, RPC_URL, VALOCRACY_ID);

  const address = "GA..."; 
  
  console.log(`Checking level for ${address}...`);
  const level = await client.getLevel(address);
  console.log(`Level: ${level}`);

  console.log(`Checking mana...`);
  const mana = await client.getMana(address);
  console.log(`Mana: ${mana}`);

  // Example: Client-side decay calculation
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 10000; // Mock
  const computedMana = calculateMana(10, 0, expiry, now);
  console.log(`Computed Mana: ${computedMana}`);
}

main().catch(console.error);
