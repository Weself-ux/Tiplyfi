import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

const EMAILJS_SERVICE = "service_3ub0w2v";
const EMAILJS_TEMPLATE = "template_tan8syy";
const EMAILJS_PUBLIC_KEY = "a7C5T6Unk9oPR7CXL";

// Helper — sends email directly from the browser via EmailJS (dynamic import keeps this out of SSR)
async function sendEmailJS(serviceId, templateId, templateParams, publicKey) {
  const { default: emailjs } = await import("@emailjs/browser");
  await emailjs.send(serviceId, templateId, templateParams, publicKey);
}

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

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendResetCode() {
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const code = generateOTP();
      const expiry = Date.now() + 15 * 60 * 1000;
      setSentOtp(JSON.stringify({ code, expiry }));

      const registerRes = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!registerRes.ok) {
        throw new Error("Could not start password reset.");
      }

      await sendEmailJS(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        { email, passcode: code, time: new Date(expiry).toLocaleTimeString() },
        EMAILJS_PUBLIC_KEY,
      );
      setStep(2);
    } catch {
      setError("Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function verifyCode() {
    if (!otp) {
      setError("Please enter the reset code.");
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

  async function resetPassword() {
    const passError = validatePassword(newPassword);
    if (passError) {
      setError(passError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { code } = JSON.parse(sentOtp);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-inter flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to home
        </a>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827] tracking-tight"
            >
              <img
                src="https://raw.createusercontent.com/18c04710-416f-413e-9610-a8ca69e91d6d/"
                alt="Tiplyfi Jar"
                className="w-7 h-7 rounded-lg"
              />
              Tiplyfi Jar
            </a>
          </div>

          {/* Step 1: Enter email */}
          {step === 1 && (
            <>
              <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
                Reset your password
              </h1>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                Enter your email and we'll send you a reset code
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 transition-all"
                />
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={sendResetCode}
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </button>

              <p className="text-sm text-[#6B7280] text-center mt-4">
                <a
                  href="/login"
                  className="text-[#7c3aed] font-medium hover:text-[#6d28d9]"
                >
                  Back to Login
                </a>
              </p>
            </>
          )}

          {/* Step 2: Enter code */}
          {step === 2 && (
            <>
              <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
                Enter reset code
              </h1>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-[#111827]">{email}</span>
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  Reset Code
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
                onClick={verifyCode}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors"
              >
                Verify Code
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#6B7280]">
                <button
                  onClick={sendResetCode}
                  className="text-[#7c3aed] font-medium hover:text-[#6d28d9]"
                >
                  Resend code
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

          {/* Step 3: New password */}
          {step === 3 && (
            <>
              <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
                Set new password
              </h1>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                Choose a strong password for your account
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
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

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
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

              {error && (
                <div className="mb-4 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={resetPassword}
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
