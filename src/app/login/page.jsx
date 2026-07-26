import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import useSession from "../../utils/useSession";

export default function Login() {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
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

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-inter flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Back link */}
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

          <h1 className="text-lg font-semibold text-[#111827] text-center mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-[#6B7280] text-center mb-6">
            Log in to your creator account
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
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
                className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-[#6B7280]">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-[#7c3aed] font-medium hover:text-[#6d28d9]"
              >
                Create one
              </a>
            </p>
            <a
              href="/forgot-password"
              className="text-sm text-[#6B7280] hover:text-[#7c3aed] transition-colors"
            >
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
