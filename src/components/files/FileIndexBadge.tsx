import { Badge } from '@/components/ui/badge';
import { useIndexStatus } from '@/hooks/useIndexStatus';
import { CheckCircle2 } from 'lucide-react';

export function FileIndexBadge({ id }: { id: string | undefined }) {
  const { isIndexed } = useIndexStatus(id);

  if (!isIndexed) return null;

  return (
    <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest gap-1 flex items-center">
      <CheckCircle2 size={10} />
      Indexed
    </Badge>
  );
}
