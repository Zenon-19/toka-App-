import { TokaLogo } from '../components/TokaLogo.tsx';

export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121512] text-[#F5F7F2] px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="mb-6">
          <TokaLogo size={96} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F7F2]">TOKA</h1>
        <p className="mt-2 text-sm text-[#929B93]">Consistency over perfection.</p>
      </div>
    </div>
  );
}
