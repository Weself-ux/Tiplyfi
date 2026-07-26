// Arc Testnet Configuration — Frontend
// CRITICAL: USDC is the gas token on Arc, NOT ETH

export const ARC_TESTNET = {
  chainId: "0x4CEF52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

export const ARC_EXPLORER = "https://testnet.arcscan.app";

// ─── Supported EVM wallets ───────────────────────────────────────────────────
// Each entry describes how to detect the wallet's injected provider and what
// to show in the picker UI. Solana wallets (Phantom, Solflare) are added
// during the CCTP Solana phase.
export const SUPPORTED_WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    detect: () =>
      typeof window !== "undefined" &&
      window.ethereum?.isMetaMask &&
      !window.ethereum?.isBraveWallet,
    getProvider: () => window.ethereum,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    detect: () =>
      typeof window !== "undefined" && window.ethereum?.isCoinbaseWallet,
    getProvider: () => window.ethereum,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🛡️",
    detect: () =>
      typeof window !== "undefined" && window.ethereum?.isTrust,
    getProvider: () => window.ethereum,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "⬛",
    detect: () =>
      typeof window !== "undefined" && !!window.okxwallet,
    getProvider: () => window.okxwallet,
  },
  {
    id: "binance",
    name: "Binance Wallet",
    icon: "🟡",
    detect: () =>
      typeof window !== "undefined" && !!window.BinanceChain,
    getProvider: () => window.BinanceChain,
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    icon: "🔷",
    detect: () =>
      typeof window !== "undefined" && !!window.bitkeep?.ethereum,
    getProvider: () => window.bitkeep.ethereum,
  },
  {
    id: "bybit",
    name: "Bybit Wallet",
    icon: "🟠",
    detect: () =>
      typeof window !== "undefined" && !!window.bybitWallet,
    getProvider: () => window.bybitWallet,
  },
  {
    id: "zerion",
    name: "Zerion",
    icon: "💎",
    detect: () =>
      typeof window !== "undefined" && window.ethereum?.isZerion,
    getProvider: () => window.ethereum,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
    detect: () =>
      typeof window !== "undefined" && window.ethereum?.isRainbow,
    getProvider: () => window.ethereum,
  },
  {
    id: "rabby",
    name: "Rabby",
    icon: "🐰",
    detect: () =>
      typeof window !== "undefined" && window.ethereum?.isRabby,
    getProvider: () => window.ethereum,
  },
  {
    id: "tokenpocket",
    name: "TokenPocket",
    icon: "💼",
    detect: () =>
      typeof window !== "undefined" && !!window.tokenpocket,
    getProvider: () => window.tokenpocket,
  },
  {
    id: "imtoken",
    name: "imToken",
    icon: "🔑",
    detect: () =>
      typeof window !== "undefined" && !!window.imToken,
    getProvider: () => window.imToken,
  },
  {
    id: "coin98",
    name: "Coin98",
    icon: "💛",
    detect: () =>
      typeof window !== "undefined" && !!window.coin98?.provider,
    getProvider: () => window.coin98.provider,
  },
];

// ─── Connect a specific wallet and switch to Arc Testnet ─────────────────────
export async function connectWallet(walletId) {
  const wallet = SUPPORTED_WALLETS.find((w) => w.id === walletId);
  if (!wallet) throw new Error("Wallet not found.");

  const provider = wallet.getProvider();
  if (!provider) {
    throw new Error(
      `${wallet.name} not detected. Please install it and refresh.`,
    );
  }

  await provider.request({ method: "eth_requestAccounts" });

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainId }],
    });
  } 
  
  catch (switchError) {
    if (switchError.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [ARC_TESTNET],
      });
    } else {
      throw switchError;
    }
  }

  const accounts = await provider.request({ method: "eth_accounts" });
  if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
  return { address: accounts[0], provider, walletId };
}

// Kept for backward compat — dashboard SendUSDCForm still calls this
export async function connectMetaMask() {
  const result = await connectWallet("metamask");
  return result.address;
}

// ─── Send USDC via connected wallet provider ─────────────────────────────────
export async function sendUsdc(toAddress, amountUsdc, provider) {
  const p = provider || window.ethereum;
  if (!p) throw new Error("No wallet connected.");

  const parts = amountUsdc.toString().split(".");
  const whole = parts[0] || "0";
  const decimal = (parts[1] || "").padEnd(18, "0").slice(0, 18);
  const trimmed = (whole + decimal).replace(/^0+/, "") || "0";
  const weiHex = "0x" + BigInt(trimmed).toString(16);

  const accounts = await p.request({ method: "eth_accounts" });
  if (!accounts || accounts.length === 0) throw new Error("No wallet connected.");

  const txHash = await p.request({
    method: "eth_sendTransaction",
    params: [{ from: accounts[0], to: toAddress, value: weiHex }],
  });

  return txHash;
}

// ─── Send USDC from a Tiplyfi-generated wallet (private key in localStorage) ─
export async function sendUsdcFromPrivateKey(privateKey, toAddress, amountUsdc) {
  const { ethers } = await import("ethers");
  const rpcProvider = new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrls[0]);
  const wallet = new ethers.Wallet(privateKey, rpcProvider);
  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountUsdc.toString()),
  });
  return tx.hash;
}

// ─── Utilities ───────────────────────────────────────────────────────────────
 export function formatAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

 export function weiToUsdc(weiValue) {
  if (!weiValue) return "0.00";
  const wei = BigInt(weiValue);
  const whole = wei / BigInt(10 ** 18);
  const fraction = wei % BigInt(10 ** 18);
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fractionStr}`;
}
