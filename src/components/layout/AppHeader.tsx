import { Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  title?: string;
}

export const AppHeader = ({ title = "ServiceTracker" }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg text-card-foreground">{title}</h1>
        </div>
        <Button variant="ghost" size="sm">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};