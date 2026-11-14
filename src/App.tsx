import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastBanner } from './components/ToastBanner.tsx';
import { useNotificationScheduler } from './hooks/useNotificationScheduler.ts';
import { auth } from './lib/firebase.ts';
import { AppShell } from './navigation/AppShell.tsx';
import { AuthScreen } from './screens/AuthScreen.tsx';
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
import { setInMemoryToken } from './services/api.ts';
import { useTokaStore } from './store/useTokaStore.ts';

function AuthenticatedWorkspace() {
  useNotificationScheduler();

  const activeScreen = useTokaStore((s) => s.activeScreen);
  const settings = useTokaStore((s) => s.settings);
  const workspaceLoading = useTokaStore((s) => s.workspaceLoading);
  const showOnboardingPreview = useTokaStore((s) => s.showOnboardingPreview);

  if (workspaceLoading && !settings) {
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
  const firebaseUser = useTokaStore((s) => s.firebaseUser);
  const authInitialized = useTokaStore((s) => s.authInitialized);
  const setFirebaseUser = useTokaStore((s) => s.setFirebaseUser);
  const setAuthInitialized = useTokaStore((s) => s.setAuthInitialized);
  const loadWorkspace = useTokaStore((s) => s.loadWorkspace);

  const [splashMinDone, setSplashMinDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashMinDone(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setInMemoryToken(token);
          await loadWorkspace();
        } catch (err) {
          console.error('Failed to bootstrap session:', err);
        }
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setAuthInitialized, loadWorkspace]);

  return (
    <>
      <ToastBanner />
      {!authInitialized || !splashMinDone ? (
        <SplashScreen />
      ) : !firebaseUser ? (
        <AuthScreen />
      ) : (
        <AuthenticatedWorkspace />
      )}
    </>
  );
}
