import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-[#1a2b23]/70 rounded-xl ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-[#0f1714] border border-[#1f352b]">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-1/12" />
        </div>
      ))}
    </div>
  );
};
