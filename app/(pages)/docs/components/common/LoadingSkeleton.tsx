"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type?: "catalog" | "editor" | "sidebar";
}

export function LoadingSkeleton({ type = "catalog" }: LoadingSkeletonProps) {
  if (type === "catalog") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (type === "editor") {
    return (
      <div className="h-full flex flex-col p-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Editor skeleton */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    );
  }

  if (type === "sidebar") {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-8 w-4/5" />
      </div>
    );
  }

  return null;
}
