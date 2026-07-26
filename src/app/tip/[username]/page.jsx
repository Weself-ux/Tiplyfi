import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Loader2,
  X,
  ArrowRight,
  Wallet,
  
  Check,
  Zap,
  Shield,
} from "lucide-react";
 import {
  sendUsdc,
  sendUsdcFromPrivateKey,
  formatAddress,
  ARC_EXPLORER,
  TIP_ROUTER_ADDRESS,
  computeTipAmounts,
  tipViaRouter,
  weiToDisplay,
} from "../../../utils/arc-config";
import WalletPicker from "../../../utils/WalletPicker";
import { confirmTip, flushTipQueue } from "../../../utils/tipQueue";

const AMOUNTS = ["1", "5", "10", "25"];

// Networks supported via Circle CCTP V2 / Gateway on testnet.
// Arc is native. Solana added in phase 2. BNB/Sui excluded (not on CCTP).
const NETWORKS = [
  { id: "arc",       label: "Arc Testnet",       available: true  },
  { id: "sepolia",   label: "Eth Sepolia",        available: false },
  { id: "base",      label: "Base Sepolia",       available: false },
  { id: "arbitrum",  label: "Arbitrum Sepolia",   available: false },
  { id: "avalanche", label: "Avalanche Fuji",     available: false },
  { id: "op",        label: "OP Sepolia",         available: false },
  { id: "polygon",   label: "Polygon Amoy",       available: false },
  { id: "solana",    label: "Solana Devnet",      available: false },
];

export default function TipPage({ params }) {
  const { username } = params;
  const [mode, setMode] = useState("wallet");
  const [network, setNetwork] = useState("arc");
  const [wallet, setWallet] = useState(null);       // { address, provider, walletId }
  const [showPicker, setShowPicker] = useState(false);
  const [amount, setAmount] = useState("5");
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [tipperEmail, setTipperEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState("");
  const [sentAmount, setSentAmount] = useState("");
  const [fanCoversFee, setFanCoversFee] = useState(false);

  useEffect(() => {
    flushTipQueue();
  }, []);

  const {
    data: creator,
    isLoading: creatorLoading,
    error: creatorError,
  } = useQuery({
    queryKey: ["creator", username],
    queryFn: async () => {
      const res = await fetch(`/api/user/${username}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("not_found");
        throw new Error("Failed to load creator");
      }
      return res.json();
    },
  });

   const finalAmount = customAmount || amount;

  // Creator's setting decides the default; the fan can always opt to cover it.
  const creatorWantsFanToPay = creator?.feeMode === "fan_pays";
  const feePaidByFan = creatorWantsFanToPay || fanCoversFee;

  const validAmount =
    finalAmount && !isNaN(finalAmount) && Number(finalAmount) > 0;
  const amounts = validAmount
    ? computeTipAmounts(finalAmount, feePaidByFan)
    : null;

   async function handleWalletTip() {
    if (!wallet) { setStatus("Connect your wallet first."); return; }
    if (!amounts) { setStatus("Enter a valid amount."); return; }

    const clientRef =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const routed = Boolean(TIP_ROUTER_ADDRESS);
    const netUsdc = routed ? weiToDisplay(amounts.netWei) : finalAmount;
    const grossUsdc = routed ? weiToDisplay(amounts.valueWei) : finalAmount;
    const feeUsdc = routed ? weiToDisplay(amounts.feeWei) : "0";

    let tipId = null;

    try {
      setLoading(true);

      // 1. Persist the tip (including the message) BEFORE going on-chain.
      setStatus("Preparing...");
      try {
        const prep = await fetch("/api/tips/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientRef,
            creatorUsername: username,
            creatorAddress: creator.walletAddress,
            tipperAddress: wallet.address,
            amount: netUsdc,
            amountUsdc: parseFloat(netUsdc),
            grossUsdc: parseFloat(grossUsdc),
            feeUsdc: parseFloat(feeUsdc),
            message: message || null,
          }),
        });
        if (prep.ok) {
          const data = await prep.json();
          tipId = data.tipId ?? null;
        } else {
          console.warn("[tiplyfi] prepare returned", prep.status);
        }
      } catch (prepErr) {
        console.warn("[tiplyfi] prepare failed", prepErr);
      }

      // 2. Send on-chain.
      setStatus("Confirm in your wallet...");
      const hash = routed
        ? await tipViaRouter({
            creatorAddress: creator.walletAddress,
            valueWei: amounts.valueWei,
            feeWei: amounts.feeWei,
            message: message || null,
            provider: wallet.provider,
          })
        : await sendUsdc(creator.walletAddress, finalAmount, wallet.provider);
      setTxHash(hash);

      // 3. Confirm. On failure this queues to localStorage — never silent.
      await confirmTip({ tipId, clientRef, txHash: hash });

      setSuccessMode("wallet");
      setShowSuccess(true);
      setSentAmount(netUsdc);
      setAmount("5"); setCustomAmount(""); setMessage(""); setStatus("");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSponsoredTip() {
    if (!finalAmount || isNaN(finalAmount) || Number(finalAmount) <= 0) {
      setStatus("Enter a valid amount."); return;
    }
    if (Number(finalAmount) > 100) {
      setStatus("Sponsored tips are limited to 100 USDC."); return;
    }
    try {
      setLoading(true);
      setStatus("Processing your tip on Arc...");
      const res = await fetch("/api/tips/sponsored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorUsername: username,
          amountUsdc: parseFloat(finalAmount),
          message: message || null,
          tipperEmail: tipperEmail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tip failed.");
      setTxHash(data.txId || "");
      setSuccessMode("sponsored");
      setShowSuccess(true);
      setSentAmount(finalAmount);
      setAmount("5"); setCustomAmount(""); setMessage("");
      setTipperEmail(""); setStatus("");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (creatorError?.message === "not_found") {
    return (
      <div className="min-h-screen bg-[#F9FAFB] font-inter flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 max-w-[400px] w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
            <X size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-[#111827] mb-2">Page not found</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            This creator page doesn't exist yet. Want to create your own?
          </p>
          <a href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-xl hover:bg-[#6d28d9] transition-colors">
            Create Your Tiplyfi <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  if (creatorError) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] font-inter flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 max-w-[400px] w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
            <X size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-[#111827] mb-2">Couldn't load this page</h2>
          <p className="text-sm text-[#6B7280] mb-6">Something went wrong. Please try again.</p>
          <button onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-xl hover:bg-[#6d28d9] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (creatorLoading || !creator) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 size={24} className="text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  const initial = creator.username ? creator.username[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-white to-[#EFF6FF] font-inter flex flex-col items-center justify-center px-4 py-12">

      {showPicker && (
        <WalletPicker
          onConnect={(result) => {
            setWallet(result);
            setShowPicker(false);
            setStatus("");
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm max-w-[460px] w-full overflow-hidden">

        <div className="bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-8 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 backdrop-blur-sm">
            {initial}
          </div>
          <h1 className="text-white font-semibold text-xl">@{creator.username}</h1>
          <p className="text-white/70 text-sm mt-0.5">{creator.displayName}</p>
        </div>

         <div className="flex border-b border-[#E5E7EB]">
          <button
            onClick={() => { setMode("wallet"); setStatus(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${mode === "wallet" ? "text-[#7c3aed] border-[#7c3aed]" : "text-[#6B7280] border-transparent hover:text-[#111827]"}`}
          >
            <Wallet size={15} /> Wallet
          </button>
          <button
            onClick={() => { setMode("sponsored"); setStatus(""); setWallet(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors relative ${mode === "sponsored" ? "text-[#7c3aed] border-[#7c3aed]" : "text-[#6B7280] border-transparent hover:text-[#111827]"}`}
          >
            <Zap size={15} /> No Wallet Needed
            <span className="absolute top-2 right-3 bg-[#7c3aed] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              NEW
            </span>
          </button>
        </div>

        <div className="p-6">

          {mode === "sponsored" && (
            <div className="flex items-start gap-3 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-3 mb-5">
              <Zap size={16} className="text-[#7c3aed] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#6B7280] leading-relaxed">
                <span className="font-semibold text-[#7c3aed]">No crypto wallet needed.</span>{" "}
                The tip is sent directly to the creator in USDC on Arc Testnet via Circle Programmable Wallets.{" "}
                <span className="font-medium text-amber-600">Testing mode only.</span>
              </p>
            </div>
          )}

           {mode === "wallet" && (
            <div className="mb-5">
              {!wallet && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    Network
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NETWORKS.map((n) => (
                      <button
                        key={n.id}
                        disabled={!n.available}
                        onClick={() => n.available && setNetwork(n.id)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                          network === n.id
                            ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                            : n.available
                              ? "text-[#374151] border-[#E5E7EB] hover:border-[#7c3aed]"
                              : "text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed bg-[#F9FAFB]"
                        }`}
                      >
                        {n.label}
                        {!n.available && (
                          <span className="text-[9px] bg-[#E5E7EB] text-[#6B7280] px-1 py-0.5 rounded">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!wallet ? (
                <button
                  onClick={() => setShowPicker(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#111827] rounded-xl hover:bg-[#1F2937] transition-colors"
                >
                  <Wallet size={16} />
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                    <span className="text-sm font-medium text-green-800">
                      {formatAddress(wallet.address)}
                    </span>
                    <span className="text-xs text-green-600 capitalize">
                      ({wallet.walletId})
                    </span>
                  </div>
                  <button
                    onClick={() => setWallet(null)}
                    className="text-xs text-[#6B7280] hover:text-red-500 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

           {mode === "sponsored" && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                Your Email (optional, for receipt)
              </label>
              <input
                type="email"
                value={tipperEmail}
                onChange={(e) => { setTipperEmail(e.target.value); setStatus(""); }}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-xl outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
              />
            </div>
          )}

           <div className="mb-4">
            <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wider">
              Amount (USDC)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount(""); setStatus(""); }}
                  className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                    amount === a && !customAmount
                      ? "border-[#7c3aed] bg-[#F5F3FF] text-[#7c3aed]"
                      : "border-[#E5E7EB] text-[#374151] hover:border-[#C4B5FD]"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); setStatus(""); }}
              placeholder="Custom amount"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-xl outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
            />
          </div>

           <div className="mb-5">
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
              Message (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => { setMessage(e.target.value); setStatus(""); }}
              placeholder="Keep up the great work! 🔥"
              maxLength={200}
              className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-xl outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
            />
          </div>

           {mode === "wallet" && amounts && TIP_ROUTER_ADDRESS && (
            <div className="mb-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-xs">
              <div className="flex justify-between text-[#6B7280] mb-1">
                <span>Tip to @{creator.username}</span>
                <span className="text-[#111827] font-medium">
                  ${weiToDisplay(amounts.netWei)}
                </span>
              </div>
              <div className="flex justify-between text-[#6B7280] mb-2">
                <span>Tiplyfi fee (6%)</span>
                <span className="text-[#111827] font-medium">
                  ${weiToDisplay(amounts.feeWei)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5E7EB] font-semibold text-[#111827]">
                <span>You pay</span>
                <span>${weiToDisplay(amounts.valueWei)}</span>
              </div>

              {!creatorWantsFanToPay && (
                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fanCoversFee}
                    onChange={(e) => setFanCoversFee(e.target.checked)}
                    className="mt-0.5 accent-[#7c3aed]"
                  />
                  <span className="text-[#6B7280] leading-snug">
                    Cover the fee so @{creator.username} receives the full amount
                  </span>
                </label>
              )}
            </div>
          )}

          {status && (
            <div className="mb-4 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {status}
            </div>
          )}

           {mode === "wallet" ? (
            <button
              onClick={handleWalletTip}
              disabled={loading || !wallet}
              className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> {status || "Sending..."}
                </span>
              ) : (
                `Send ${finalAmount ? `$${finalAmount}` : ""} USDC to @${creator.username}`
              )}
            </button>
          ) : (
            <button
              onClick={handleSponsoredTip}
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> {status || "Processing..."}
                </span>
              ) : (
                `Send ${finalAmount ? `$${finalAmount}` : ""} USDC · No Wallet Needed`
              )}
            </button>
          )}

           <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
              <Shield size={11} /> Secured by Arc & Circle
            </div>
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
              <Zap size={11} /> Settles in &lt;1 second
            </div>
          </div>
        </div>
      </div>

       <div className="mt-6 text-center">
        <p className="text-xs text-[#9CA3AF]">
          Want your own Tiplyfi?{" "}
          <a href="/signup" className="text-[#7c3aed] font-medium hover:text-[#6d28d9]">
            Create one free →
          </a>
        </p>
      </div>

       {showSuccess && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 max-w-[420px] w-full text-center shadow-xl relative">
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#111827] transition-colors"
            >
              <X size={14} />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#F5F3FF] flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-[#7c3aed]" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-1">Tip Sent! 🎉</h2>
            <p className="text-sm text-[#6B7280] mb-6">
              {successMode === "sponsored"
                ? `$${sentAmount} USDC was sent to @${creator.username} via Circle on Arc Testnet. No wallet needed — it just worked.`
                : `$${sentAmount} USDC arrived in @${creator.username}'s wallet on Arc Testnet in under a second.`}
            </p>

            {txHash && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1.5">
                  {successMode === "sponsored" ? "Circle Transfer ID" : "Transaction Hash"}
                </p>
                <code className="text-xs text-[#7c3aed] break-all block">
                  {txHash.length > 20 ? txHash.slice(0, 20) + "..." : txHash}
                </code>
                {successMode === "wallet" && (
                  <a
                    href={`${ARC_EXPLORER}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#7c3aed] font-medium mt-2 hover:text-[#6d28d9]"
                  >
                    View on Arc Explorer <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}

            <div className="space-y-2">
              <a
                href="/signup"
                className="block w-full py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-xl hover:opacity-90 transition-opacity text-center"
              >
                Create Your Own Tiplyfi
              </a>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-2.5 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] rounded-xl hover:border-[#D1D5DB] hover:text-[#111827] transition-colors"
              >
                Send Another Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
