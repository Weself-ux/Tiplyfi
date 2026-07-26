import { useState } from "react";
import { X } from "lucide-react";
import { SUPPORTED_WALLETS, connectWallet } from "./arc-config";

/**
 * WalletPicker — 2-column grid modal (7 left, 6 right).
 * Detected wallets are clickable; undetected show an Install link.
 *
 * Props:
 *   onConnect({ address, provider, walletId }) — called on success
 *   onClose() — called when user dismisses
 */
export default function WalletPicker({ onConnect, onClose }) {
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState("");

  const leftCol = SUPPORTED_WALLETS.slice(0, 7);
  const rightCol = SUPPORTED_WALLETS.slice(7);

  async function handleConnect(wallet) {
    if (!wallet.detect()) return;
    setError("");
    setConnecting(wallet.id);
    try {
      const result = await connectWallet(wallet.id);
      onConnect(result);
    } catch (err) {
      setError(err.message || "Connection failed. Please try again.");
    } finally {
      setConnecting(null);
    }
  }

  function WalletButton({ wallet }) {
    const installed = wallet.detect();
    return (
      <div className="relative">
        <button
          onClick={() => handleConnect(wallet)}
          disabled={!!connecting || !installed}
          className={`w-full flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all
            ${installed
              ? "border-[#E5E7EB] hover:border-[#7c3aed] hover:bg-[#F5F3FF] cursor-pointer"
              : "border-[#E5E7EB] opacity-40 cursor-default"
            }
            ${connecting === wallet.id ? "border-[#7c3aed] bg-[#F5F3FF]" : ""}
          `}
        >
          <span className="text-2xl leading-none">{wallet.icon}</span>
          <span className="text-[10px] font-medium text-[#374151] text-center leading-tight">
            {wallet.name}
          </span>
          {connecting === wallet.id && (
            <span className="text-[9px] text-[#7c3aed]">Connecting…</span>
          )}
        </button>
        {!installed && (
          <a
            href={getInstallUrl(wallet.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-1 right-1 text-[8px] text-[#7c3aed] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Install
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">
              Connect Wallet
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Choose your wallet to continue
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            {leftCol.map((wallet) => (
              <WalletButton key={wallet.id} wallet={wallet} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {rightCol.map((wallet) => (
              <WalletButton key={wallet.id} wallet={wallet} />
            ))}
          </div>
        </div>

        <p className="text-[10px] text-[#9CA3AF] text-center mt-4">
          By connecting you agree to Tiplyfi's{" "}
          <a href="/terms" className="underline hover:text-[#7c3aed]">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}

function getInstallUrl(walletId) {
  const urls = {
    metamask: "https://metamask.io/download/",
    coinbase: "https://www.coinbase.com/wallet",
    trust: "https://trustwallet.com/download",
    okx: "https://www.okx.com/web3",
    binance: "https://www.binance.com/en/web3wallet",
    bitget: "https://web3.bitget.com/en/wallet-download",
    bybit: "https://www.bybit.com/en/web3/",
    zerion: "https://zerion.io/download",
    rainbow: "https://rainbow.me/download",
    rabby: "https://rabby.io/",
    tokenpocket: "https://www.tokenpocket.pro/en/download/app",
    imtoken: "https://token.im/download",
    coin98: "https://coin98.com/wallet",
  };
  return urls[walletId] || "#";
}