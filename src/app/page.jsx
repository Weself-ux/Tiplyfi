import { useState } from "react";
import {
  Zap,
  Shield,
  DollarSign,
  Globe,
  Plus,
  Minus,
  ArrowRight,
  Mail,
  Wallet,
  Check,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Settlement",
    desc: "Tips land in your wallet in under a second on Arc. No delays, no holds, no waiting.",
  },
  {
    icon: DollarSign,
    title: "Zero Platform Fees",
    desc: "Wallet-to-wallet on Arc. Every cent of every tip goes directly to you.",
  },
  {
    icon: Shield,
    title: "Private by Default",
    desc: "Fans only see your username. Your wallet address stays completely hidden.",
  },
  {
    icon: Globe,
    title: "Global & Borderless",
    desc: "Anyone anywhere can tip you in USDC. No bank account or ID required.",
  },
];

const FAQS = [
  {
    q: "What is Tiplyfi?",
    a: "Tiplyfi is a creator tipping platform built on Arc Testnet. Creators get a unique tip link, receive USDC directly to their wallet, and fans can tip using any wallet, chain, or credit card.",
  },
  {
    q: "Can fans tip without a crypto wallet?",
    a: 'Yes. Our "No Wallet Needed" mode — powered by Circle Programmable Wallets — lets anyone send USDC to a creator on Arc Testnet without needing Wallet or any crypto.',
  },
  {
    q: "Do I need crypto experience?",
    a: "Not at all. Sign up with your email, generate a wallet in one click, share your link. No technical knowledge needed.",
  },
  {
    q: "What is USDC?",
    a: "USDC is a stablecoin pegged 1:1 to the US dollar. A $5 tip is always worth $5. On Arc, USDC is also the native gas token.",
  },
  {
    q: "Is Arc Testnet real money?",
    a: "Arc Testnet uses test USDC with no real monetary value — perfect for building and testing before mainnet.",
  },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 bg-white/90 border-b border-[#E5E7EB]"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5">
            <img
              src="https://raw.createusercontent.com/18c04710-416f-413e-9610-a8ca69e91d6d/"
              alt="Tiplyfi"
              className="w-7 h-7 rounded-lg"
            />
            <span className="text-lg font-bold text-[#111827] tracking-tight">
              Tiplyfi
            </span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors rounded-lg"
            >
              Log in
            </a>
            <a href="/signup"
              className="px-4 py-2 text-sm font-bold text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors shadow-sm"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-6 pt-20 pb-20 flex flex-col lg:flex-row items-center gap-14">
        <div className="flex-1 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#F5F3FF] text-[#7c3aed] rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border border-[#DDD6FE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]"></span>
            Now on Arc Testnet
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#111827] tracking-tight leading-[1.1] mb-5">
            Simply accept tips from anyone, anywhere with{" "}
            <span className="text-[#7c3aed]">TIPLYFI</span>
          </h1>
          <p className="text-base text-[#6B7280] leading-relaxed mb-8">
            Tiplyfi is the simplest way for creators to receive USDC tips globally. Fans can tip using any wallet, any chain, or a credit card 
            — powered by Circle and built on Arc.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#7c3aed] rounded-xl hover:bg-[#6d28d9] transition-colors shadow-sm shadow-[#7c3aed]/25"
            >
              Create My Tiplyfi <ArrowRight size={15} />
            </a>
            <a
              href="/howitworks"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-[#374151] bg-white border border-[#E5E7EB] rounded-xl hover:border-[#C4B5FD] hover:text-[#7c3aed] transition-colors"
            >
              See How It Works
            </a>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start">
            {[
              "Private",
              "Zero platform fees",
              "No credit card needed to tip",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 text-xs text-[#9CA3AF]"
              >
                <Check size={11} className="text-green-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Live mockup */}
        <div className="flex-1 max-w-[380px] w-full">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl shadow-[#7c3aed]/5 overflow-hidden">
            <div className="bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
                E
              </div>
              <p className="text-white font-semibold text-sm">@creator</p>
              <p className="text-white/60 text-xs">Creator · Arc Testnet</p>
            </div>
            <div className="p-5">
              <div className="flex border-b border-[#E5E7EB] mb-4">
                <div className="flex-1 text-center py-2 border-b-2 border-[#7c3aed]">
                  <p className="text-xs font-semibold text-[#7c3aed] flex items-center justify-center gap-1">
                    <Wallet size={11} /> Wallet
                  </p>
                </div>
                <div className="flex-1 text-center py-2 relative">
                  <p className="text-xs font-semibold text-[#6B7280] flex items-center justify-center gap-1">
                    <Zap size={11} /> No Wallet Needed
                  </p>
                  <span className="absolute top-1.5 right-1 bg-[#7c3aed] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {["$1", "$5", "$10", "$25"].map((a, i) => (
                  <div
                    key={a}
                    className={`text-center py-2 rounded-lg border text-xs font-bold ${i === 1 ? "border-[#7c3aed] bg-[#F5F3FF] text-[#7c3aed]" : "border-[#E5E7EB] text-[#374151]"}`}
                  >
                    {a}
                  </div>
                ))}
              </div>
              <div className="h-8 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg mb-3 flex items-center px-3">
                <span className="text-xs text-[#9CA3AF]">
                  Keep up the great work! 🔥
                </span>
              </div>
              <div className="h-10 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-xl flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  Send $5 USDC to @creator
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* No Wallet Feature callout */}
      <section className="bg-gradient-to-br from-[#7c3aed] to-[#3b82f6]">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5">
                <Zap size={12} /> Powered by Circle Programmable Wallets
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                Your fans don't need a crypto wallet to tip you
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-lg">
                With Tiplyfi's "No Wallet Needed" mode, anyone can send USDC
                directly to you on Arc Testnet. No Wallet. No seed phrase. No
                gas fees to worry about. The tip settles on-chain in under a
                second — powered by Circle.
              </p>
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#7c3aed] bg-white rounded-xl hover:bg-[#F5F3FF] transition-colors shadow-sm"
              >
                Get My Tip Link <ArrowRight size={15} />
              </a>
            </div>
            <div className="flex-1 max-w-sm w-full">
              <div className="space-y-3">
                {[
                  {
                    n: "1",
                    t: "Fan visits your tip link",
                    d: "Share /tip/yourname on Twitter, YouTube, Discord — anywhere.",
                  },
                  {
                    n: "2",
                    t: 'Picks "No Wallet Needed"',
                    d: "No Wallet popup. No seed phrase. Just amount + send.",
                  },
                  {
                    n: "3",
                    t: "USDC lands in your wallet",
                    d: "Circle settles the USDC on Arc Testnet in seconds.",
                  },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="flex gap-3 items-start bg-white/10 border border-white/20 rounded-xl p-4"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/25 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold mb-0.5">
                        {s.t}
                      </p>
                      <p className="text-white/70 text-xs leading-relaxed">
                        {s.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <div className="max-w-[1100px] mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
              Built for creators who want to get paid
            </h2>
            <p className="text-sm text-[#6B7280]">
              Simple, fast, and fee-free on Arc
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:border-[#C4B5FD] hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[#7c3aed]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white border-t border-[#E5E7EB]">
        <div className="max-w-[760px] mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
              Up in minutes, not hours
            </h2>
            <p className="text-sm text-[#6B7280]">
              Three steps to start receiving tips
            </p>
          </div>
          <div className="flex flex-col gap-8 relative">
            <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-[#E5E7EB]"></div>
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up with your email and pick a username. Your username becomes your public tip link.",
              },
              {
                step: "02",
                title: "Connect or generate a wallet",
                desc: "Connect Wallet or generate a fresh wallet. Your address stays private — fans never see it.",
              },
              {
                step: "03",
                title: "Share your link and get paid",
                desc: "Drop your link anywhere. Fans tip in USDC — with or without a wallet — and it settles on Arc in seconds.",
              },
            ].map((s, i) => (
              <div key={i} className="flex gap-6 items-start relative">
                <div className="w-10 h-10 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 shadow-sm shadow-[#7c3aed]/30">
                  {s.step}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-base font-bold text-[#111827] mb-1">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a
              href="/howitworks"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
            >
              Full guide <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <div className="max-w-[680px] mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-[#111827] tracking-tight mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border transition-all ${openFaq === i ? "border-[#C4B5FD] shadow-sm" : "border-[#E5E7EB]"}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-[#111827] pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? "bg-[#7c3aed] text-white" : "bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280]"}`}
                  >
                    {openFaq === i ? <Minus size={11} /> : <Plus size={11} />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-[#6B7280] leading-relaxed border-t border-[#F3F4F6] pt-4">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-[#E5E7EB]">
        <div className="max-w-[560px] mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-[#111827] tracking-tight mb-2">
            Start receiving tips today
          </h2>
          <p className="text-base text-[#6B7280]">
            Set up in 2 minutes. Zero fees.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://raw.createusercontent.com/18c04710-416f-413e-9610-a8ca69e91d6d/"
              alt="Tiplyfi"
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-bold text-[#111827]">Tiplyfi</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/howitworks"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              How It Works
            </a>
            <a
              href="/signup"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Sign Up
            </a>
            <a
              href="/login"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Log In
            </a>
            <a
              href="mailto:tipjar011@gmail.com"
              className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1"
            >
              <Mail size={11} /> Contact
            </a>
          </div>
          <p className="text-xs text-[#9CA3AF]">Built on Arc & Circle</p>
        </div>
      </footer>
    </div>
  );
}
