export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header Skeleton - matches actual header */}
      <header className="bg-[#121214] border-b border-[#2a2a2e] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="h-8 w-24 bg-[#2a2a2e] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[#2a2a2e] rounded mt-1 animate-pulse" />
            </div>
            <div className="h-4 w-4 bg-[#2a2a2e] rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Toggle Skeleton */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit mb-6">
          <div className="h-10 w-28 bg-white rounded-md" />
          <div className="h-10 w-24 bg-gray-200 rounded-md" />
        </div>

        {/* Card Skeleton */}
        <div className="bg-[#2a2a2e] rounded-xl p-6 space-y-6">
          {/* Step Indicator Skeleton */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#3a3a3e] animate-pulse" />
                <div className="hidden sm:block ml-2 h-4 w-20 bg-[#3a3a3e] rounded animate-pulse" />
                {step < 4 && (
                  <div className="w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 bg-[#3a3a3e]" />
                )}
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-48 bg-[#3a3a3e] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#3a3a3e] rounded animate-pulse" />

            {/* Operation Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <div
                  key={card}
                  className="bg-[#1a1a1e] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#3a3a3e] animate-pulse" />
                    <div className="h-5 w-24 bg-[#3a3a3e] rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-[#3a3a3e] rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-[#3a3a3e] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};