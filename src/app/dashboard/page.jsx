import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Menu,
  LogOut,
  Send,
  BarChart3,
  Wallet,
  LayoutDashboard,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  History,
} from "lucide-react";
import useSession from "../../utils/useSession";
import {
  sendUsdcFromPrivateKey,
  formatAddress,
  ARC_EXPLORER,
} from "../../utils/arc-config";

const EarningsChart = lazy(() => import("./EarningsChart"));

function SendUSDCForm({ walletAddress, username }) {
  const [toAddress, setToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleSend() {
    if (!toAddress || !sendAmount) {
      setSendStatus("Please fill in all fields.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      setSendStatus("Invalid wallet address.");
      return;
    }
    if (isNaN(sendAmount) || Number(sendAmount) <= 0) {
      setSendStatus("Enter a valid amount.");
      return;
    }
    try {
      setSending(true);
       const storedKey = localStorage.getItem("tipjar_private_key_" + username);
      if (!storedKey) {
        throw new Error(
          "This browser doesn't have your wallet key. Open Tiplyfi in the browser you signed up with.",
        );
      }
      setSendStatus("Sending USDC on Arc...");
      const hash = await sendUsdcFromPrivateKey(
        storedKey,
        toAddress,
        sendAmount,
      );

      setTxHash(hash);
      setSendStatus("Sent successfully!");
      setToAddress("");
      setSendAmount("");
    } catch (err) {
      setSendStatus("Error: " + err.message);
    } finally {
      setSending(false);
    }
  }

  const isSuccess = sendStatus === "Sent successfully!";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
          Recipient Address
        </label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
            setSendStatus("");
          }}
          placeholder="0x..."
          className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
          Amount (USDC)
        </label>
        <input
          type="text"
          value={sendAmount}
          onChange={(e) => {
            setSendAmount(e.target.value);
            setSendStatus("");
          }}
          placeholder="0.00"
          className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
        />
      </div>
      {sendStatus && (
        <div
          className={`px-3 py-2.5 text-sm rounded-lg border ${isSuccess ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {sendStatus}
        </div>
      )}
      {txHash && (
        <a
          href={`${ARC_EXPLORER}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#7c3aed] hover:text-[#6d28d9]"
        >
          View on Arc Explorer <ExternalLink size={12} />
        </a>
      )}
      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send size={16} /> Send USDC
          </>
        )}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: sessionLoading, logout, getToken } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [copied, setCopied] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [keyPassword, setKeyPassword] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyChecking, setKeyChecking] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, sessionLoading]);

  // Fetch balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["balance", user?.walletAddress],
    queryFn: async () => {
      if (!user?.walletAddress) return null;
      const res = await fetch(
        `/api/wallet/balance?address=${user.walletAddress}`,
      );
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    enabled: !!user?.walletAddress,
    refetchInterval: 30000,
  });

  // Fetch transactions
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", user?.walletAddress],
    queryFn: async () => {
      if (!user?.walletAddress) return null;
      const res = await fetch(
        `/api/wallet/transactions?address=${user.walletAddress}`,
      );
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!user?.walletAddress,
    refetchInterval: 30000,
  });

  // Fetch tip analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["analytics", user?.username, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!user?.username) return null;
      const res = await fetch(
        `/api/tips/analytics?username=${user.username}&year=${selectedYear}&month=${selectedMonth}`,
      );
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!user?.username,
    refetchInterval: 60000,
  });

  // Escrowed tips: funds the contract held because a direct transfer failed.
  // With EOA creator wallets this should always be zero.
  const { data: escrowData } = useQuery({
    queryKey: ["escrow", user?.username],
    queryFn: async () => {
      const token = localStorage.getItem("tipjar_token");
      if (!token) return null;
      const res = await fetch("/api/tips/escrow", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.username,
    refetchInterval: 60000,
  });

  // Fetch detailed tip history (includes tipper messages, unlike raw on-chain activity)
  const { data: tipHistoryData, isLoading: tipHistoryLoading } = useQuery({
    queryKey: ["tipHistory", user?.username],
    queryFn: async () => {
      if (!user?.username) return null;
      const res = await fetch(`/api/tips/history?username=${user.username}`);
      if (!res.ok) throw new Error("Failed to fetch tip history");
      return res.json();
    },
    enabled: !!user?.username,
    refetchInterval: 30000,
  });

  function copyLink() {
    const link = window.location.origin + "/tip/" + user.username;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyAddress() {
    navigator.clipboard.writeText(user.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  }

  async function verifyPasswordAndRevealKey() {
    if (!keyPassword) {
      setKeyError("Please enter your password.");
      return;
    }
    setKeyChecking(true);
    setKeyError("");
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ password: keyPassword }),
      });
      if (!res.ok) {
        setKeyError("Incorrect password.");
        return;
      }
      const stored = localStorage.getItem(
        "Tiplyfi_private_key_" + user.username,
      );
      if (!stored) {
        setKeyError(
          "No private key found on this device. This wallet may have been connected via MetaMask, or you're viewing this on a different device than the one used to sign up.",
        );
        return;
      }
      setRevealedKey(stored);
      setShowKeyPrompt(false);
      setKeyPassword("");
    } catch {
      setKeyError("Something went wrong. Please try again.");
    } finally {
      setKeyChecking(false);
    }
  }

  function hidePrivateKey() {
    setRevealedKey(null);
    setShowKeyText(false);
  }

  function copyPrivateKey() {
    navigator.clipboard.writeText(revealedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  function formatDate(timestamp) {
    let ts;
    if (typeof timestamp === "number") {
      ts = timestamp * 1000;
    } else if (/^\d+$/.test(String(timestamp))) {
      ts = Number(timestamp) * 1000;
    } else {
      ts = timestamp;
    }
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 size={24} className="text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  const transactions = txData?.transactions || [];
  const incomingTxns = transactions.filter((tx) => tx.isIncoming);

  const outgoingTxns = transactions.filter((tx) => !tx.isIncoming);
  const recentActivity = [
    ...(tipHistoryData?.tips || []).map((tip) => ({
      key: `tip-${tip.id}`,
      isIncoming: true,
      counterparty: tip.tipperAddress,
      amountUsdc: tip.amountUsdc || tip.amount,
      dateValue: tip.createdAt,
      sortTime: new Date(tip.createdAt).getTime() || 0,
    })),
    ...outgoingTxns.map((tx) => ({
      key: `tx-${tx.hash}`,
      isIncoming: false,
      counterparty: tx.to,
      amountUsdc: tx.valueUsdc,
      dateValue: tx.timestamp,
      sortTime: Number(tx.timestamp) * 1000 || 0,
    })),
  ]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 5);

  const fullHistory = [
    ...(tipHistoryData?.tips || []).map((tip) => ({
      key: `tip-${tip.id}`,
      isIncoming: true,
      counterparty: tip.tipperAddress,
      amountUsdc: tip.amountUsdc || tip.amount,
      dateValue: tip.createdAt,
      message: tip.message,
      txHash: tip.txHash,
      sortTime: new Date(tip.createdAt).getTime() || 0,
    })),
    ...outgoingTxns.map((tx) => ({
      key: `tx-${tx.hash}`,
      isIncoming: false,
      counterparty: tx.to,
      amountUsdc: tx.valueUsdc,
      dateValue: tx.timestamp,
      message: null,
      txHash: tx.hash,
      sortTime: Number(tx.timestamp) * 1000 || 0,
    })),
  ].sort((a, b) => b.sortTime - a.sortTime);

  async function handleClaimEscrow() {
    try {
      const { connectWallet } = await import("../../utils/arc-config");
      const { provider, address } = await connectWallet("metamask");
      if (address.toLowerCase() !== user.walletAddress.toLowerCase()) {
        alert(
          "Connect the wallet that matches your Tiplyfi address to claim these tips.",
        );
        return;
      }
      const { ethers } = await import("ethers");
      const iface = new ethers.Interface(["function withdraw()"]);
      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: import.meta.env.VITE_TIP_ROUTER_ADDRESS,
            data: iface.encodeFunctionData("withdraw", []),
          },
        ],
      });
      alert("Claim submitted. Your balance will update shortly.");
    } catch (err) {
      alert("Claim failed: " + (err?.message || "unknown error"));
    }
  }

  const tipLink =
    (typeof window !== "undefined" ? window.location.origin : "") +
    "/tip/" +
    user.username;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "history", label: "History", icon: History },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "wallet", label: "Wallet", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-inter">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1000px] mx-auto px-6 flex items-center justify-between h-14">
          <a
            href="/"
            className="text-lg font-semibold text-[#111827] tracking-tight flex items-center gap-2"
          >
            <img
              src="https://raw.createusercontent.com/18c04710-416f-413e-9610-a8ca69e91d6d/"
              alt="Tiplyfi"
              className="w-6 h-6 rounded"
            />
            Tiplyfi
          </a>
          <div className="relative flex items-center gap-3">
            <span className="text-sm text-[#6B7280]">@{user.username}</span>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              className="p-2 text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] rounded-lg transition-colors"
            >
              <Menu size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1">
                  <span className="block px-4 py-2 text-sm text-[#9CA3AF] cursor-default">
                    Profile
                  </span>
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB]"
                  >
                    Settings
                  </a>
                  <span className="block px-4 py-2 text-sm text-[#9CA3AF] cursor-default">
                    Contact us
                  </span>
                  <div className="my-1 border-t border-[#F3F4F6]" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-[#6B7280]">
            Here is your Tiplyfi overview
          </p>
        </div>

        {escrowData?.count > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#92400E]">
                {escrowData.total.toFixed(2)} USDC is waiting to be claimed
              </p>
              <p className="text-xs text-[#92400E]/80 mt-0.5">
                {escrowData.count} tip{escrowData.count === 1 ? "" : "s"}{" "}
                couldn't reach your wallet automatically. The funds are held
                safely by the Tiplyfi contract — only you can withdraw them.
              </p>
            </div>
            <button
              onClick={handleClaimEscrow}
              className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-[#D97706] rounded-xl hover:bg-[#B45309] transition-colors"
            >
              Claim
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
              USDC Balance
            </p>
            {balanceLoading ? (
              <p className="text-sm text-[#6B7280]">Fetching...</p>
            ) : (
              <p className="text-2xl font-semibold text-[#111827]">
                {balanceData?.balanceUsdc || "0.0000"}{" "}
                <span className="text-sm font-normal text-[#6B7280]">USDC</span>
              </p>
            )}
            <p className="text-xs text-[#6B7280] mt-1">Live on Arc Testnet</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
              Tips Received
            </p>
            <p className="text-2xl font-semibold text-[#111827]">
              {analyticsData?.tipCount || incomingTxns.length}{" "}
              <span className="text-sm font-normal text-[#6B7280]">tips</span>
            </p>
            <p className="text-xs text-[#6B7280] mt-1">All time</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
              All-Time Tip Amount
            </p>
            <p className="text-2xl font-semibold text-[#111827]">
              {(analyticsData?.totalEarnings || 0).toFixed(2)}{" "}
              <span className="text-sm font-normal text-[#6B7280]">USDC</span>
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Since your first tip
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-[#E5E7EB]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 pb-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${isActive ? "text-[#111827] border-[#7c3aed]" : "text-[#6B7280] border-transparent hover:text-[#111827]"}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Share link */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-1">
                Share Your Tiplyfi
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Send this link to your audience so they can tip you in USDC
              </p>
              <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3">
                <code className="flex-1 text-sm text-[#7c3aed] break-all">
                  {tipLink}
                </code>
                <button
                  onClick={copyLink}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] flex-shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-1">
                Recent Activity
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Latest transactions on your wallet
              </p>
              {txLoading || tipHistoryLoading ? (
                <p className="text-sm text-[#6B7280] py-4">
                  Loading transactions...
                </p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-[#6B7280] py-4">
                  No transactions yet. Share your tip link to get started!
                </p>
              ) : (
                <div className="space-y-0">
                  {recentActivity.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-4 py-3 border-b border-[#F3F4F6] last:border-0"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${item.isIncoming ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}
                      >
                        {item.isIncoming ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#111827]">
                          {item.isIncoming ? "From " : "To "}
                          {formatAddress(item.counterparty)}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {formatDate(item.dateValue)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${item.isIncoming ? "text-green-600" : "text-red-500"}`}
                      >
                        {item.isIncoming ? "+" : "-"}
                        {item.amountUsdc} USDC
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

       {activeTab === "history" && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h3 className="text-base font-semibold text-[#111827] mb-1">
              History
            </h3>
            <p className="text-sm text-[#6B7280] mb-4">
              All tips received and USDC sent from your wallet
            </p>
            {tipHistoryLoading || txLoading ? (
              <p className="text-sm text-[#6B7280] py-4">Loading...</p>
            ) : fullHistory.length === 0 ? (
              <p className="text-sm text-[#6B7280] py-4">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-0">
                {fullHistory.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-4 py-3.5 border-b border-[#F3F4F6] last:border-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.isIncoming ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}
                    >
                      {item.isIncoming ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[#111827]">
                          {item.isIncoming ? "From " : "To "}
                          {formatAddress(item.counterparty)}
                        </p>
                        <span
                          className={`text-sm font-semibold flex-shrink-0 ${item.isIncoming ? "text-green-600" : "text-red-500"}`}
                        >
                          {item.isIncoming ? "+" : "-"}
                          {item.amountUsdc} USDC
                        </span>
                      </div>
                      {item.isIncoming && item.message && (
                        <p className="text-sm text-[#374151] bg-[#F9FAFB] rounded-lg px-3 py-2 mt-1.5 mb-1.5 italic">
                          "{item.message}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-[#6B7280]">
                          {formatDate(item.dateValue)}
                        </p>
                        {item.txHash && (
                          <a
                            href={`${ARC_EXPLORER}/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#7c3aed] hover:text-[#6d28d9] flex items-center gap-0.5"
                          >
                            Explorer <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

{activeTab === "analytics" && (
          <div className="space-y-4">
            {/* Earnings Overview */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h3 className="text-base font-semibold text-[#111827]">
                  Monthly Earnings
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="text-sm border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-[#374151] outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-1"
                  >
                    {[
                      "January","February","March","April","May","June",
                      "July","August","September","October","November","December",
                    ].map((label, i) => (
                      <option key={i} value={i + 1}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="text-sm border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-[#374151] outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-1"
                  >
                    {Array.from(
                      new Set([
                        now.getFullYear(),
                        ...((analyticsData?.availableMonths || []).map((m) => m.year)),
                      ]),
                    )
                      .sort((a, b) => b - a)
                      .map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                {(analyticsData?.monthlyEarnings || []).reduce(
                  (sum, d) => sum + d.total, 0,
                ).toFixed(2)}{" "}
                USDC earned this month
              </p>
              {!analyticsData?.monthlyEarnings ||
              analyticsData.monthlyEarnings.length === 0 ? (
                <p className="text-sm text-[#6B7280] py-8 text-center">
                  No tips received in this month yet.
                </p>
              ) : (
                <Suspense
                  fallback={
                    <p className="text-sm text-[#6B7280] py-8 text-center">
                      Loading chart...
                    </p>
                  }
                >
                  <EarningsChart data={analyticsData.monthlyEarnings} />
                </Suspense>
              )}
            </div>

            {/* Top Supporters */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-1">
                Top Supporters
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Your biggest tippers by total amount sent
              </p>
              {!analyticsData?.topTippers ||
              analyticsData.topTippers.length === 0 ? (
                <p className="text-sm text-[#6B7280] py-4">
                  No tips yet — your top supporters will show up here.
                </p>
              ) : (
                <div className="space-y-0">
                  {analyticsData.topTippers.map((tipper, i) => (
                    <div
                      key={tipper.address}
                      className="flex items-center gap-3 py-3 border-b border-[#F3F4F6] last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#F3E8FF] text-[#7c3aed] text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#111827] font-medium">
                          {formatAddress(tipper.address)}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {tipper.tipCount} tip{tipper.tipCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                        {tipper.totalAmount.toFixed(2)} USDC
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-1">
                Your Wallet
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Your USDC tips are sent to this address on Arc Testnet
              </p>
              <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 mb-4">
                <code className="flex-1 text-sm text-[#111827] break-all">
                  {user.walletAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] flex-shrink-0"
                >
                  {copiedAddress ? "Copied!" : "Copy"}
                </button>
              </div>
              <a
                href={`${ARC_EXPLORER}/address/${user.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-[#7c3aed] border border-[#7c3aed] rounded-lg hover:bg-[#EFF6FF] transition-colors"
              >
                View on Arc Explorer <ExternalLink size={14} />
              </a>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-1 flex items-center gap-2">
                <Lock size={16} className="text-[#6B7280]" />
                Private Key
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Anyone with this key has full control of your wallet. Keep it secret.
              </p>

              {!revealedKey && (
                <button
                  onClick={() => {
                    setShowKeyPrompt(true);
                    setKeyError("");
                    setKeyPassword("");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#111827] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <Eye size={14} /> Reveal Private Key
                </button>
              )}

              {showKeyPrompt && !revealedKey && (
                <div className="mt-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                  <p className="text-sm text-[#111827] font-medium mb-2">
                    Confirm your account password
                  </p>
                  <input
                    type="password"
                    value={keyPassword}
                    onChange={(e) => {
                      setKeyPassword(e.target.value);
                      setKeyError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") verifyPasswordAndRevealKey();
                    }}
                    placeholder="Your account password"
                    className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all mb-2"
                  />
                  {keyError && (
                    <p className="text-sm text-red-600 mb-2">{keyError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={verifyPasswordAndRevealKey}
                      disabled={keyChecking}
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50"
                    >
                      {keyChecking ? "Checking..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => {
                        setShowKeyPrompt(false);
                        setKeyPassword("");
                        setKeyError("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {revealedKey && (
                <div className="mt-2">
                  <div className="flex items-center gap-3 bg-[#FEF2F2] border border-red-200 rounded-lg px-4 py-3 mb-3">
                    <code className="flex-1 text-sm text-[#111827] break-all">
                      {showKeyText
                        ? revealedKey
                        : "•".repeat(Math.min(revealedKey.length, 50))}
                    </code>
                    <button
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="text-[#6B7280] hover:text-[#111827] flex-shrink-0"
                    >
                      {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPrivateKey}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9]"
                    >
                      {copiedKey ? "Copied!" : "Copy Key"}
                    </button>
                    <button
                      onClick={hidePrivateKey}
                      className="px-3 py-1.5 text-xs font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-1">
                Send USDC
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Send USDC directly to any address on Arc Testnet
              </p>
              
              <SendUSDCForm walletAddress={user.walletAddress} username={user.username} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
