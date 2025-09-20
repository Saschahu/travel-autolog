import buildInfo from '@/build-info.json';
import { Badge } from '@/components/ui/badge';

export function BuildInfo() {
  const { version, sha, target, timestamp } = buildInfo;
  
  return (
    <div className="fixed bottom-2 right-2 z-50 flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
      <Badge variant="secondary" className="text-xs">
        v{version}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {sha}
      </Badge>
      <Badge 
        variant={target === 'native' ? 'default' : 'secondary'} 
        className="text-xs"
      >
        {target}
      </Badge>
    </div>
  );
}