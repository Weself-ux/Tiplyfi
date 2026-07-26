// Arc Testnet Configuration
// CRITICAL: USDC is the gas token on Arc, NOT ETH
// Never mix native USDC gas with ERC-20 USDC logic

// TipRouter deployment. Empty until the contract is live — until then every
// tip is a direct wallet-to-wallet transfer and the routed path stays dormant.
export const TIP_ROUTER_ADDRESS = (
  process.env.TIP_ROUTER_ADDRESS || ""
).toLowerCase();

// keccak256("Tipped(address,address,uint256,uint256,uint256,bytes32)")
const TIPPED_TOPIC =
  "0xf0df44e4f3382f18e57bc7670c88542c838c23d709cadf43a2d64665f647a79f";

function topicToAddress(topic) {
  return ("0x" + topic.slice(-40)).toLowerCase();
}

// Decode a Tipped log. Non-indexed data is 4 x 32-byte words:
// grossAmount, netAmount, feeAmount, messageHash.
function decodeTipped(log) {
  const d = log.data.startsWith("0x") ? log.data.slice(2) : log.data;
  const word = (i) => d.slice(i * 64, (i + 1) * 64);
  return {
    creator: topicToAddress(log.topics[1]),
    tipper: topicToAddress(log.topics[2]),
    grossAmount: BigInt("0x" + word(0)),
    netAmount: BigInt("0x" + word(1)),
    feeAmount: BigInt("0x" + word(2)),
    messageHash: "0x" + word(3),
  };
}

export const ARC_CONFIG = {
  chainId: 5042002,
  chainIdHex: "0x4CEF52",
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
};

// Fetch wallet balance from Arc RPC (native USDC, not ETH)
export async function getBalance(address) {
  const response = await fetch(ARC_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Arc RPC error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "RPC error");
  }

  const weiHex = data.result;
  const weiBigInt = BigInt(weiHex);
  return weiBigInt.toString();
}

// Convert wei string to human-readable USDC (18 decimals)
export function weiToUsdc(weiString) {
  const wei = BigInt(weiString);
  const whole = wei / BigInt(10 ** 18);
  const fraction = wei % BigInt(10 ** 18);
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${fractionStr}`;
}

// Convert USDC amount to wei hex for transactions
export function usdcToWeiHex(usdcAmount) {
  const parts = usdcAmount.split(".");
  const whole = parts[0] || "0";
  const decimal = (parts[1] || "").padEnd(18, "0").slice(0, 18);
  const weiStr = whole + decimal;
  const wei = BigInt(weiStr);
  return "0x" + wei.toString(16);
}

// Fetch transaction history from Arc Explorer (Blockscout API)
export async function getTransactions(address, page = 1, limit = 20) {
  const url = `${ARC_CONFIG.explorerUrl}/api?module=account&action=txlist&address=${address}&sort=desc&page=${page}&offset=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Explorer API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status === "1" && Array.isArray(data.result)) {
    return data.result;
  }
  return [];
}

// Verify a tip transaction actually happened on-chain before trusting it.
// Without this, anyone could POST a made-up txHash/amount and have it
// recorded as a real tip with nothing actually moving on-chain.
export async function verifyArcTransaction(
  txHash,
  expectedTo,
  expectedAmountUsdc,
) {
  const txResponse = await fetch(ARC_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionByHash",
      params: [txHash],
      id: 1,
    }),
  });
  const txData = await txResponse.json();
  const tx = txData.result;
  if (!tx) {
    return { valid: false, reason: "Transaction not found on Arc Testnet." };
  }
  if (!tx.blockNumber) {
    return { valid: false, reason: "Transaction is not yet confirmed." };
  }

  const receiptResponse = await fetch(ARC_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
      id: 2,
    }),
  });
  const receiptData = await receiptResponse.json();
  const receipt = receiptData.result;
  if (!receipt || receipt.status !== "0x1") {
    return {
      valid: false,
      reason: "Transaction failed or could not be verified.",
    };
  }

  const to = (tx.to || "").toLowerCase();
  const creator = expectedTo.toLowerCase();
  const expectedUsdcNum = parseFloat(expectedAmountUsdc);

  // Path A — routed through TipRouter. tx.to is the contract, not the creator,
  // so trust the Tipped event rather than the transaction destination.
  if (TIP_ROUTER_ADDRESS && to === TIP_ROUTER_ADDRESS) {
    const log = (receipt.logs || []).find(
      (l) =>
        (l.address || "").toLowerCase() === TIP_ROUTER_ADDRESS &&
        l.topics?.[0] === TIPPED_TOPIC &&
        topicToAddress(l.topics[1]) === creator,
    );
    if (!log) {
      return {
        valid: false,
        reason: "No matching tip found in this transaction.",
      };
    }

    const ev = decodeTipped(log);
    const grossUsdc = parseFloat(weiToUsdc(ev.grossAmount.toString()));
    if (Math.abs(grossUsdc - expectedUsdcNum) > 0.000001) {
      return { valid: false, reason: "Transaction amount does not match." };
    }

    return {
      valid: true,
      from: ev.tipper,
      to: ev.creator,
      amountUsdc: parseFloat(weiToUsdc(ev.netAmount.toString())).toString(),
      grossUsdc: grossUsdc.toString(),
      feeUsdc: parseFloat(weiToUsdc(ev.feeAmount.toString())).toString(),
      messageHash: ev.messageHash,
      routed: true,
    };
  }

  // Path B — direct wallet-to-wallet transfer.
  if (!to || to !== creator) {
    return { valid: false, reason: "Transaction destination does not match." };
  }

  const actualUsdc = parseFloat(weiToUsdc(BigInt(tx.value).toString()));
  if (Math.abs(actualUsdc - expectedUsdcNum) > 0.000001) {
    return { valid: false, reason: "Transaction amount does not match." };
  }

  return {
    valid: true,
    from: tx.from,
    to: tx.to,
    amountUsdc: actualUsdc.toString(),
    grossUsdc: actualUsdc.toString(),
    feeUsdc: "0",
    routed: false,
  };
}

// Verify a contract/address exists on Arc before trusting it
export async function verifyAddressExists(address) {
  try {
    const response = await fetch(ARC_CONFIG.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getCode",
        params: [address, "latest"],
        id: 1,
      }),
    });
    const data = await response.json();
    // '0x' means EOA (regular wallet), anything else means contract
    return { exists: true, isContract: data.result !== "0x" };
  } catch {
    return { exists: false, isContract: false };
  }
}