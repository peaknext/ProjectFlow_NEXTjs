export default function ProjectsLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded-md mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-10 w-[240px] bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex-shrink-0">
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-10 w-[240px] bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex-shrink-0">
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-10 w-[240px] bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex-1 min-w-[250px]">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card rounded-lg border border-border flex-1">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-5 w-48 bg-muted animate-pulse rounded-md mb-2" />
                <div className="h-2 w-[200px] bg-muted animate-pulse rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="border-t border-border bg-card px-6 py-4 mt-4 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-muted animate-pulse rounded-md" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  );
}
