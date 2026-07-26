import { useState, useCallback, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  AlertTriangle,
  Wallet,
  Sparkles,
  Loader2,
} from "lucide-react";
import useSession from "../../utils/useSession";
import { connectMetaMask } from "../../utils/arc-config";

const EMAILJS_SERVICE = "service_3ub0w2v";
const EMAILJS_TEMPLATE_OTP = "template_tan8syy";
const EMAILJS_TEMPLATE_WELCOME = "template_owsv6a8";
const EMAILJS_PUBLIC_KEY = "a7C5T6Unk9oPR7CXL";

// Helper — sends email directly from the browser via EmailJS
async function sendEmailJS(serviceId, templateId, templateParams, publicKey) {
  const { default: emailjs } = await import("@emailjs/browser");
  await emailjs.send(serviceId, templateId, templateParams, publicKey);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[0-9]/.test(password))
    return "Password must include at least one number.";
  if (!/[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]/.test(password))
    return "Password must include at least one special character.";
  return null;
}

// Client-side wallet generation using ethers.js
async function generateWalletClientSide() {
  const { ethers } = await import("ethers");
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

export default function Signup() {
  const { login } = useSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    day: "",
    month: "",
    year: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [walletOption, setWalletOption] = useState("");
  const [generatedWallet, setGeneratedWallet] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [keySaved, setKeySaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameTimeout = useRef(null);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  // Real-time username uniqueness check
  useEffect(() => {
    if (form.username.length < 5) {
      setUsernameAvailable(null);
      return;
    }
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    setCheckingUsername(true);
    usernameTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/check-username?username=${form.username}`,
        );
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
  }, [form.username]);

  function validateStep1() {
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return false;
    }
    if (!form.email.includes("@")) {
      setError("Enter a valid email.");
      return false;
    }
    if (!form.day || !form.month || !form.year) {
      setError("Date of birth is required.");
      return false;
    }
    const dob = new Date(`${form.month} ${form.day}, ${form.year}`);
    if (isNaN(dob.getTime())) {
      setError("Enter a valid date of birth.");
      return false;
    }
    if (dob > new Date()) {
      setError("Date of birth cannot be in the future.");
      return false;
    }
    const age = (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 16) {
      setError("You must be at least 16 years old.");
      return false;
    }
    if (!form.username || form.username.length < 5) {
      setError("Username must be at least 5 characters.");
      return false;
    }
    if (usernameAvailable === false) {
      setError("Username already taken.");
      return false;
    }
    const passError = validatePassword(form.password);
    if (passError) {
      setError(passError);
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  }

  async function sendOTP() {
    if (!validateStep1()) return;
    setSendingOtp(true);
    setError("");
    try {
      const code = generateOTP();
      const expiry = Date.now() + 15 * 60 * 1000;
      setSentOtp(JSON.stringify({ code, expiry }));

      await sendEmailJS(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE_OTP,
        {
          email: form.email,
          passcode: code,
          time: new Date(expiry).toLocaleTimeString(),
        },
        EMAILJS_PUBLIC_KEY,
      );
      setStep(2);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  function verifyOTP() {
    if (!otp) {
      setError("Please enter the verification code.");
      return;
    }
    try {
      const { code, expiry } = JSON.parse(sentOtp);
      if (Date.now() > expiry) {
        setError("Code expired. Please request a new one.");
        return;
      }
      if (otp !== code) {
        setError("Incorrect code. Please try again.");
        return;
      }
      setStep(3);
      setError("");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleGenerateWallet() {
    try {
      const wallet = await generateWalletClientSide();
      setGeneratedWallet(wallet);
      setWalletOption("generate");
      setError("");
    } catch (err) {
      setError("Failed to generate wallet: " + err.message);
    }
  }

  async function handleConnectMetaMask() {
    try {
      const address = await connectMetaMask();
      setConnectedAddress(address);
      setWalletOption("metamask");
      setError("");
    } catch (err) {
      setError(err.message || "Connection failed.");
    }
  }

  function disconnectWallet() {
    setConnectedAddress(null);
    setWalletOption("");
    setGeneratedWallet(null);
  }

  function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text);
    if (type === "address") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  async function handleFinish() {
    if (!walletOption) {
      setError("Please choose a wallet option.");
      return;
    }
    if (walletOption === "generate" && !keySaved) {
      setError("Please confirm you saved your private key.");
      return;
    }
    const address =
      walletOption === "generate" ? generatedWallet.address : connectedAddress;
    if (!address) {
      setError("No wallet connected.");
      return;
    }
    setLoading(true);
    try {
      // Create account via backend (argon2 hashing happens server-side)
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          username: form.username,
          password: form.password,
          dateOfBirth: `${form.month} ${form.day}, ${form.year}`,
          walletAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed.");
      if (walletOption === "generate" && generatedWallet?.privateKey) {
  localStorage.setItem(
    "Tiplyfi_private_key_" + form.username,
    generatedWallet.privateKey
  );
}
      // Send welcome email (non-critical)
      try {
        await sendEmailJS(
          EMAILJS_SERVICE,
          EMAILJS_TEMPLATE_WELCOME,
          { name: form.fullName, email: form.email },
          EMAILJS_PUBLIC_KEY,
        );
      } catch {
        // Welcome email is non-critical
      }

      login(data.user, data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = ["Profile", "Verify", "Wallet"];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-inter flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[560px]">
        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to home
        </a>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          {/* Progress */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step >= stepNum;
              return (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isActive ? "bg-[#7c3aed] text-white" : "bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280]"}`}
                    >
                      {step > stepNum ? <Check size={14} /> : stepNum}
                    </div>
                    <span className="text-xs text-[#6B7280] mt-1">{label}</span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-16 h-0.5 mx-2 mb-5 ${step > stepNum ? "bg-[#7c3aed]" : "bg-[#E5E7EB]"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Profile */}
          {step === 1 && (
            <>
              <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
                Create Your Tiplyfi
              </h1>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                Set up your creator profile
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        updateForm(
                          "username",
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, ""),
                        )
                      }
                      placeholder="yourname"
                      className="w-full px-3 py-2.5 pr-8 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                    />
                    {form.username.length >= 5 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                          <Loader2
                            size={14}
                            className="text-[#6B7280] animate-spin"
                          />
                        ) : usernameAvailable === true ? (
                          <Check size={14} className="text-green-500" />
                        ) : usernameAvailable === false ? (
                          <span className="text-xs text-red-500">Taken</span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  Date of Birth
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.day}
                    onChange={(e) => updateForm("day", e.target.value)}
                    placeholder="DD"
                    maxLength={2}
                    className="w-16 px-3 py-2.5 text-sm text-center text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                  />
                  <select
                    value={form.month}
                    onChange={(e) => updateForm("month", e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => updateForm("year", e.target.value)}
                    placeholder="YYYY"
                    maxLength={4}
                    className="w-20 px-3 py-2.5 text-sm text-center text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 pr-10 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        updateForm("confirmPassword", e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 pr-10 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={sendOTP}
                disabled={sendingOtp}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending
                    verification code...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-sm text-[#6B7280] text-center mt-4">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-[#7c3aed] font-medium hover:text-[#6d28d9]"
                >
                  Log in
                </a>
              </p>
            </>
          )}

          {/* Step 2: Verify Email */}
          {step === 2 && (
            <>
              <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
                Verify Your Email
              </h1>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-[#111827]">{form.email}</span>
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2.5 text-sm text-center text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all tracking-[0.3em] text-lg font-semibold"
                />
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={verifyOTP}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors"
              >
                Verify Code
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#6B7280]">
                <button
                  onClick={sendOTP}
                  disabled={sendingOtp}
                  className="text-[#7c3aed] font-medium hover:text-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? "Sending..." : resendSuccess ? "Code sent ✓" : "Resend code"}
                </button>
                <span>·</span>
                <button
                  onClick={() => setStep(1)}
                  className="hover:text-[#111827]"
                >
                  Back
                </button>
              </div>
            </>
          )}

          {/* Step 3: Wallet */}
          {step === 3 && (
            <>
              <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
                Connect Your Wallet
              </h1>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                Choose how you want to receive tips
              </p>

              <div className="flex flex-col gap-3 mb-5">
                <button
                  onClick={handleConnectMetaMask}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left w-full transition-colors ${walletOption === "metamask" ? "border-[#7c3aed] bg-[#EFF6FF]" : "border-[#E5E7EB] hover:border-[#D1D5DB]"}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center">
                    <Wallet size={20} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#111827] block">
                      Connect Wallet
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      Use your existing wallet
                    </span>
                  </div>
                </button>
                <button
                  onClick={handleGenerateWallet}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left w-full transition-colors ${walletOption === "generate" ? "border-[#7c3aed] bg-[#EFF6FF]" : "border-[#E5E7EB] hover:border-[#D1D5DB]"}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center">
                    <Sparkles size={20} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#111827] block">
                      Generate Wallet
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      Create a new wallet instantly
                    </span>
                  </div>
                </button>
              </div>

              {/* Connected MetaMask */}
              {connectedAddress && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-sm text-green-700">
                      Connected: {connectedAddress.slice(0, 8)}...
                      {connectedAddress.slice(-6)}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {/* Generated Wallet */}
              {generatedWallet && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle
                      size={16}
                      className="text-amber-600 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-amber-800 font-medium">
                      Save your private key now. It cannot be recovered if lost.
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 mt-1">
                      <code className="flex-1 text-xs text-[#111827] break-all">
                        {generatedWallet.address}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedWallet.address, "address")
                        }
                        className="text-[#6B7280] hover:text-[#111827] flex-shrink-0"
                      >
                        {copiedAddress ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Private Key
                    </label>
                    <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 mt-1">
                      <code className="flex-1 text-xs text-[#111827] break-all">
                        {generatedWallet.privateKey}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedWallet.privateKey, "key")
                        }
                        className="text-[#6B7280] hover:text-[#111827] flex-shrink-0"
                      >
                        {copiedKey ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keySaved}
                      onChange={(e) => setKeySaved(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-[#6B7280]">
                      I have saved my private key in a safe place
                    </span>
                  </label>
                </div>
              )}

              {error && (
                <div className="mb-4 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating your
                    Tiplyfi...
                  </>
                ) : (
                  "Get Started on  Tiplyfi"
                )}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full mt-3 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
