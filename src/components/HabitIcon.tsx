import {
  BookOpen,
  Brain,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Feather,
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenTool,
  Sparkles,
  Sun,
  Target,
  Timer,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Sun,
  BookOpen,
  Brain,
  Droplets,
  Dumbbell,
  Feather,
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenTool,
  Sparkles,
  Target,
  Timer,
  Zap,
  CheckCircle2,
};

interface HabitIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function HabitIcon({ name, size = 20, className = '' }: HabitIconProps) {
  const Icon = ICON_MAP[name] || CheckCircle2;
  return <Icon size={size} className={className} strokeWidth={1.85} />;
}
