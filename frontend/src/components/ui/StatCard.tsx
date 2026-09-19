import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-[#0f1714] border border-[#1f352b] hover:border-emerald-500/40 p-5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 group ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{value}</div>
        <div className="mt-1 flex items-center space-x-2">
          {trend && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
        </div>
      </div>

      {/* Subtle bottom gradient glow */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
    </div>
  );
};
