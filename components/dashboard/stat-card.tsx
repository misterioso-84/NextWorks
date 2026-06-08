import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  className?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-950/30', icon: 'bg-green-600', text: 'text-green-600 dark:text-green-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  red: { bg: 'bg-red-50 dark:bg-red-950/30', icon: 'bg-red-600', text: 'text-red-600 dark:text-red-400' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-900/50', icon: 'bg-slate-600', text: 'text-slate-600 dark:text-slate-400' },
};

export function StatCard({ title, value, description, icon: Icon, trend, color = 'blue', className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn('border-0 shadow-sm hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn('text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colors.icon)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
