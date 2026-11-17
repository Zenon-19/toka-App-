import type { ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  Home,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import { TokaLogo } from '../components/TokaLogo.tsx';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { MainTab } from '../types/index.ts';

interface AppShellProps {
  children: ReactNode;
}

const NAV_TABS: { id: MainTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export function AppShell({ children }: AppShellProps) {
  const activeTab = useTokaStore((s) => s.activeTab);
  const activeScreen = useTokaStore((s) => s.activeScreen);
  const profile = useTokaStore((s) => s.profile);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);

  const displayName = profile?.name?.trim() || 'Your profile';

  return (
    <div className="min-h-screen bg-[var(--toka-bg-primary)] text-[var(--toka-text-primary)] flex flex-col md:flex-row">
      {/* Desktop & Tablet Left Navigation Rail (>= 768px) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-[var(--toka-bg-secondary)] border-r border-[var(--toka-border)] p-5 justify-between z-30">
        <div>
          <button
            type="button"
            onClick={() => navigateToTab('home')}
            className="toka-logo flex items-center gap-3 px-2 py-1.5 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
            aria-label="TOKA Home"
          >
            <TokaLogo size={32} />
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--toka-text-primary)]">
              TOKA
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateToScreen('create-habit')}
            className="mt-6 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--toka-bg-secondary)]"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span>Create Habit</span>
          </button>

          <nav className="mt-6 space-y-1" aria-label="Primary navigation">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const active =
                activeTab === tab.id &&
                !['calendar', 'settings', 'notifications'].includes(activeScreen);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigateToTab(tab.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                    active
                      ? 'bg-[var(--toka-bg-card)] text-[var(--toka-text-primary)] font-semibold'
                      : 'text-[var(--toka-text-secondary)] font-medium hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-card)]/50'
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? 'text-[var(--toka-accent-text)]' : ''}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-[var(--toka-border)] space-y-1">
            <button
              type="button"
              onClick={() => navigateToScreen('calendar')}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                activeScreen === 'calendar'
                  ? 'bg-[var(--toka-bg-card)] text-[var(--toka-text-primary)] font-semibold'
                  : 'text-[var(--toka-text-secondary)] font-medium hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-card)]/50'
              }`}
            >
              <Calendar
                size={17}
                className={activeScreen === 'calendar' ? 'text-[var(--toka-accent-text)]' : ''}
              />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => navigateToScreen('notifications')}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                activeScreen === 'notifications'
                  ? 'bg-[var(--toka-bg-card)] text-[var(--toka-text-primary)] font-semibold'
                  : 'text-[var(--toka-text-secondary)] font-medium hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-card)]/50'
              }`}
            >
              <Bell
                size={17}
                className={activeScreen === 'notifications' ? 'text-[var(--toka-accent-text)]' : ''}
              />
              <span>Reminders</span>
            </button>
            <button
              type="button"
              onClick={() => navigateToScreen('settings')}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                activeScreen === 'settings'
                  ? 'bg-[var(--toka-bg-card)] text-[var(--toka-text-primary)] font-semibold'
                  : 'text-[var(--toka-text-secondary)] font-medium hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-card)]/50'
              }`}
            >
              <Settings
                size={17}
                className={activeScreen === 'settings' ? 'text-[var(--toka-accent-text)]' : ''}
              />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateToTab('profile')}
          className="min-h-[44px] p-3 rounded-xl bg-[var(--toka-bg-card)] text-left hover:bg-[var(--toka-bg-card)]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
        >
          <div className="text-sm font-medium text-[var(--toka-text-primary)] truncate">
            {displayName}
          </div>
          <div className="text-xs text-[var(--toka-text-secondary)] truncate mt-0.5">
            Stored on this device
          </div>
        </button>
      </aside>

      {/* Mobile Compact Header (< 768px) */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-4 bg-[var(--toka-bg-primary)]/90 backdrop-blur-md border-b border-[var(--toka-border)] flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateToTab('home')}
          className="toka-logo flex items-center gap-2.5 whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] rounded-xl"
          aria-label="TOKA Home"
        >
          <TokaLogo size={28} />
          <span className="font-display text-base font-semibold tracking-tight">TOKA</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('create-habit')}
          aria-label="Create new habit"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Fixed 4-Tab Bottom Bar (< 768px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--toka-bg-secondary)]/95 backdrop-blur-md border-t border-[var(--toka-border)] grid grid-cols-4 items-center px-2"
      >
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateToTab(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                active ? 'text-[var(--toka-accent-text)]' : 'text-[var(--toka-text-secondary)]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-xs font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
