/* Shimmer skeleton components shared across the messaging page */

function Shimmer({ className = '' }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function ConversationSkeleton() {
  return (
    <div className="p-4 flex gap-3">
      <Shimmer className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Shimmer className="h-3.5 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ResearcherSkeleton() {
  return (
    <div className="p-6 flex flex-col items-center gap-3">
      <Shimmer className="w-24 h-24 rounded-2xl" />
      <Shimmer className="h-4 w-2/3" />
      <Shimmer className="h-3 w-1/2" />
      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        <Shimmer className="h-16 rounded-xl" />
        <Shimmer className="h-16 rounded-xl" />
      </div>
      <div className="w-full space-y-2 mt-2">
        <Shimmer className="h-3.5 w-full" />
        <Shimmer className="h-3.5 w-4/5" />
        <Shimmer className="h-3.5 w-3/5" />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-5 py-2">
      {/* Inbound */}
      <div className="flex gap-3 max-w-[72%]">
        <Shimmer className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-4 w-full rounded-2xl" />
          <Shimmer className="h-4 w-3/4 rounded-2xl" />
        </div>
      </div>
      {/* Outbound */}
      <div className="flex flex-col items-end max-w-[55%] ml-auto space-y-1.5">
        <Shimmer className="h-4 w-full rounded-2xl" />
      </div>
      {/* Inbound */}
      <div className="flex gap-3 max-w-[65%]">
        <Shimmer className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-4 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
