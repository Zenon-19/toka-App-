import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTokaStore } from '../store/useTokaStore.ts';

export function AuthScreen() {
  const signInWithGoogle = useTokaStore((s) => s.signInWithGoogle);
  const authLoading = useTokaStore((s) => s.authLoading);
  const authError = useTokaStore((s) => s.authError);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#121512] text-[#F5F7F2] grid grid-cols-1 lg:grid-cols-12 items-stretch">
      {/* Editorial visual panel on desktop */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 bg-[#1B201C] border-r border-[#303730] overflow-hidden">
        {!imgFailed ? (
          <img
            src="/src/assets/images/toka_onboarding_stone_1794664301339.jpg"
            alt="Balanced dark river stones in quiet studio light"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B201C] via-[#121512] to-[#202620]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121512] via-[#121512]/55 to-[#121512]/30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#202620]/90 border border-[#303730] flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#C6FF69]" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-[#F5F7F2]">
            TOKA
          </span>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="text-sm text-[#C6FF69] font-medium mb-3">Consistency over perfection</p>
          <h2 className="text-4xl font-semibold tracking-tight leading-[1.15] text-[#F5F7F2] [text-wrap:balance]">
            Build habits. Become consistent. Transform yourself.
          </h2>
          <p className="mt-4 text-base text-[#929B93] leading-relaxed">
            A calm, disciplined system for tracking daily commitments, protecting streaks across
            real schedules, and reviewing honest longitudinal progress.
          </p>

          <div className="mt-8 pt-6 border-t border-[#303730]/80 grid grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-medium text-[#F5F7F2]">Schedule-aware</div>
              <div className="text-xs text-[#929B93] mt-1">
                Rest days never break your streak.
              </div>
            </div>
            <div>
              <div className="font-medium text-[#F5F7F2]">Honest insights</div>
              <div className="text-xs text-[#929B93] mt-1">
                Real PostgreSQL completion analytics.
              </div>
            </div>
            <div>
              <div className="font-medium text-[#F5F7F2]">Quiet focus</div>
              <div className="text-xs text-[#929B93] mt-1">
                Zero clutter, built for daily use.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign-in action panel */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#202620] border border-[#303730] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-[#C6FF69]" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">TOKA</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#F5F7F2] [text-wrap:balance]">
            Welcome to TOKA
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-[#929B93]">
            Sign in with your Google account to sync your habits, streaks, and settings securely
            across sessions.
          </p>

          {authError ? (
            <div
              role="alert"
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400"
            >
              {authError}
            </div>
          ) : null}

          <div className="mt-8">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-[#C6FF69] text-[#121512] font-semibold text-sm flex items-center justify-center gap-3 hover:brightness-95 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#121512"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>{authLoading ? 'Signing in...' : 'Continue with Google'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-[#929B93]">
            Consistency over perfection. Your personal habit history is isolated to your
            authenticated account and can be exported or deleted anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
