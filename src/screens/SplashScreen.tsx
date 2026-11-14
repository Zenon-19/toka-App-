export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121512] text-[#F5F7F2] px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#202620] border border-[#303730] flex items-center justify-center mb-6">
          <div className="w-6 h-6 rounded-full border-[3px] border-[#C6FF69]" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F7F2]">TOKA</h1>
        <p className="mt-2 text-sm text-[#929B93]">Consistency over perfection.</p>
        <div className="mt-8 w-36 h-1 rounded-full bg-[#202620] overflow-hidden">
          <div className="h-full w-1/2 bg-[#C6FF69] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
