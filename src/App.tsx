import { useEffect, useState } from 'react';
import { ToastBanner } from './components/ToastBanner.tsx';
import { useNotificationScheduler } from './hooks/useNotificationScheduler.ts';
import { AppShell } from './navigation/AppShell.tsx';
import { CalendarScreen } from './screens/CalendarScreen.tsx';
import { CreateHabitScreen } from './screens/CreateHabitScreen.tsx';
import { EditHabitScreen } from './screens/EditHabitScreen.tsx';
import { HabitDetailsScreen } from './screens/HabitDetailsScreen.tsx';
import { HabitsScreen } from './screens/HabitsScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { InsightsScreen } from './screens/InsightsScreen.tsx';
import { NotificationsScreen } from './screens/NotificationsScreen.tsx';
import { OnboardingScreen } from './screens/OnboardingScreen.tsx';
import { ProfileScreen } from './screens/ProfileScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { SplashScreen } from './screens/SplashScreen.tsx';
import { useTokaStore } from './store/useTokaStore.ts';

function WorkspaceApp() {
  useNotificationScheduler();

  const activeScreen = useTokaStore((s) => s.activeScreen);
  const settings = useTokaStore((s) => s.settings);
  const workspaceLoading = useTokaStore((s) => s.workspaceLoading);
  const workspaceError = useTokaStore((s) => s.workspaceError);
  const showOnboardingPreview = useTokaStore((s) => s.showOnboardingPreview);

  if (workspaceLoading && !settings && !workspaceError) {
    return <SplashScreen />;
  }

  if (showOnboardingPreview || (settings && !settings.onboardingCompleted)) {
    return <OnboardingScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'habits':
        return <HabitsScreen />;
      case 'insights':
        return <InsightsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'create-habit':
        return <CreateHabitScreen />;
      case 'edit-habit':
        return <EditHabitScreen />;
      case 'habit-details':
        return <HabitDetailsScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return <AppShell>{renderScreen()}</AppShell>;
}

export default function App() {
  const workspaceInitialized = useTokaStore((s) => s.workspaceInitialized);
  const loadWorkspace = useTokaStore((s) => s.loadWorkspace);

  const [splashMinDone, setSplashMinDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashMinDone(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  return (
    <>
      <ToastBanner />
      {!workspaceInitialized || !splashMinDone ? <SplashScreen /> : <WorkspaceApp />}
    </>
  );
}
