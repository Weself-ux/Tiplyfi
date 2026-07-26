import { ArrowRight, Mail } from "lucide-react";

const CREATOR_STEPS = [
  {
    title: "Create Your Account",
    desc: "Sign up with your name, email and a username. Your username becomes your unique Tiplyfi link — for example, Tiplyfi.app/tip/yourname.",
  },
  {
    title: "Connect or Generate a Wallet",
    desc: "Connect your existing wallet or let Tiplyfi generate a brand new one for you instantly. Your wallet address is never shown publicly — only your username is.",
  },
  {
    title: "Share Your Link",
    desc: "Copy your unique tip link from your dashboard and share it anywhere — your stream, your bio, your posts, your content. Anyone can click it and tip you.",
  },
  {
    title: "Receive Tips Instantly",
    desc: "When a fan sends a tip, the USDC lands directly in your wallet on Arc Testnet in under a second. You also get to track all incoming tips in your dashboard.",
  },
  {
    title: "Send or Withdraw Anytime",
    desc: "From your dashboard wallet tab you can send USDC to any address on Arc directly — no need to leave the platform.",
  },
];

const FAN_STEPS = [
  {
    title: "Visit the Creator Link",
    desc: "Click the tip link shared by your favourite creator. You will land on their personal Tiplyfi page showing their username.",
  },
  {
    title: "Choose How to Tip",
    desc: "Connect your wallet if you already have USDC on Arc Testnet — or pick the no-wallet option and tip using just your email, no crypto wallet required.",
  },
  {
    title: "Connect Your Wallet (Optional)",
    desc: "If you choose the wallet option, connect your wallet and make sure you have USDC on Arc Testnet. You can get free test USDC from faucet.circle.com.",
  },
  {
    title: "Choose an Amount and Send",
    desc: "Pick a preset amount — 1, 5, 10 or 25 USDC — or enter a custom amount. Add an optional message then click Send.",
  },
  {
    title: "Done",
    desc: "Your tip is sent instantly. You will see a confirmation with the transaction hash that you can verify on Arc Explorer. The creator receives it in under a second.",
  },
];

const WHY_CARDS = [
  {
    title: "USDC is Stable",
    desc: "Unlike volatile cryptocurrencies, USDC is pegged 1:1 to the US dollar. A $5 tip is always worth $5.",
  },
  {
    title: "Arc is Fast",
    desc: "Transactions on Arc confirm in under a second. No waiting, no uncertainty about whether your tip went through.",
  },
  {
    title: "USDC is Gas on Arc",
    desc: "Arc uses USDC as its native gas token. This means you only need one token for everything — tips and transaction fees included.",
  },
  {
    title: "No Middlemen",
    desc: "Tips go directly from the fan wallet to the creator wallet. Tiplyfi never holds your funds.",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
          <a
            href="/"
            className="text-xl font-semibold text-[#111827] tracking-tight flex items-center gap-2"
          >
            <img
              src="https://raw.createusercontent.com/18c04710-416f-413e-9610-a8ca69e91d6d/"
              alt="Tiplyfi"
              className="w-7 h-7 rounded-lg"
            />
            Tiplyfi
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#6B7280] rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827] transition-colors"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-[800px] mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#7c3aed] rounded-full px-3 py-1 text-xs font-medium mb-6">
            How It Works
          </div>
          <h1 className="text-4xl font-semibold text-[#111827] tracking-tight mb-4">
            Simple. Fast. Direct.
          </h1>
          <p className="text-base text-[#6B7280] leading-relaxed max-w-lg mx-auto">
            Tiplyfi connects creators with their audience through direct USDC
            payments on Arc. No middlemen, no platform fees, no delays.
          </p>
        </div>
      </section>

      {/* For Creators */}
      <section className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <div className="max-w-[800px] mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-[#111827] mb-8 pb-3 border-b border-[#E5E7EB]">
            For Creators
          </h2>
          <div className="space-y-6">
            {CREATOR_STEPS.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Fans */}
      <section className="bg-white border-t border-[#E5E7EB]">
        <div className="max-w-[800px] mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-[#111827] mb-8 pb-3 border-b border-[#E5E7EB]">
            For Fans and Tippers
          </h2>
          <div className="space-y-6">
            {FAN_STEPS.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Arc & USDC */}
      <section className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <div className="max-w-[800px] mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-[#111827] mb-8 pb-3 border-b border-[#E5E7EB]">
            Why Arc and USDC?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_CARDS.map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-[#D1D5DB] transition-colors"
              >
                <h3 className="text-sm font-semibold text-[#111827] mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-[#E5E7EB]">
        <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-10">
            <h2 className="text-2xl font-semibold text-[#111827] tracking-tight mb-3">
              Ready to get started?
            </h2>
            <p className="text-sm text-[#6B7280] mb-8">
              Set up your Tiplyfi in under 2 minutes.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors"
            >
              Get Started on Tiplyfi
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://raw.createusercontent.com/18c04710-416f-413e-9610-a8ca69e91d6d/"
              alt="Tiplyfi"
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-semibold text-[#111827]">
              Tiplyfi
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Home
            </a>
            <a
              href="mailto:tipjar011@gmail.com"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1"
            >
              <Mail size={12} /> Contact
            </a>
          </div>
          <p className="text-xs text-[#6B7280]">Built on Arc Testnet</p>
        </div>
      </footer>
    </div>
  );
}
