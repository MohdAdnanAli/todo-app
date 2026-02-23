import type { LucideIcon } from 'lucide-react';

// Only import icons that are actually used
import { 
  Briefcase, 
  ShoppingCart, 
  Heart, 
  Home, 
  Car, 
  Plane, 
  BookOpen, 
  GraduationCap, 
  Utensils, 
  Coffee, 
  DollarSign, 
  CreditCard, 
  Phone, 
  Mail, 
  Video, 
  PartyPopper,
  Gift,
  Target,
  Trophy,
  Flame,
  Dumbbell,
  Code,
  Laptop,
  Server,
  Cloud,
  Lock,
  FileText,
  Palette,
  PenTool,
  Music,
  Check,
  AlertTriangle,
  Bell,
  Footprints,
  Dog,
  Leaf,
  Bus,
  Shield,
  TrendingUp,
  PiggyBank,
  Folder,
  Clock,
  Calendar,
  Star,
  User,
  Users,
  MessageSquare,
  Scissors,
  Moon,
  Tv,
  Gamepad2,
  Camera,
  Mic,
  Headphones,
  Hammer,
  Bike,
  Train,
  Flower2,
  TreePine,
  Mountain,
  Sun,
  CloudRain,
  Snowflake,
  Droplets,
  Thermometer,
  Wind
} from 'lucide-react';

// Keyword to icon mapping with priority
const ICON_MAP: Array<{ keywords: string[]; icon: LucideIcon; priority: number }> = [
  // Priority 10 - High importance
  { keywords: ['work', 'job', 'office', 'meeting', 'project', 'deadline', 'client', 'boss', 'colleague', 'conference', 'presentation'], icon: Briefcase, priority: 10 },
  { keywords: ['code', 'programming', 'developer', 'software', 'bug', 'deploy', 'git', 'github'], icon: Code, priority: 10 },
  { keywords: ['urgent', 'important', 'asap', 'emergency', 'critical'], icon: AlertTriangle, priority: 10 },
  { keywords: ['health', 'doctor', 'medicine', 'hospital', 'clinic', 'checkup', 'dentist', 'therapy'], icon: Heart, priority: 10 },
  { keywords: ['bill', 'payment', 'invoice', 'rent', 'mortgage', 'utility', 'tax'], icon: CreditCard, priority: 10 },
  { keywords: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'booking'], icon: Plane, priority: 10 },
  { keywords: ['study', 'learn', 'course', 'class', 'homework', 'exam', 'test'], icon: GraduationCap, priority: 10 },
  
  // Priority 9
  { keywords: ['shopping', 'buy', 'purchase', 'order', 'deliver', 'grocery', 'store', 'cart'], icon: ShoppingCart, priority: 9 },
  { keywords: ['money', 'budget', 'save', 'investment', 'stock', 'crypto', 'bank', 'finance'], icon: DollarSign, priority: 9 },
  { keywords: ['gym', 'fitness', 'workout', 'exercise', 'run', 'jog', 'yoga', 'train', 'sport'], icon: Dumbbell, priority: 9 },
  { keywords: ['security', 'password', 'login', '2fa', 'authentication', 'privacy'], icon: Lock, priority: 9 },
  { keywords: ['achievement', 'milestone', 'win', 'success', 'goal'], icon: Trophy, priority: 9 },
  { keywords: ['home', 'house', 'clean', 'laundry', 'repair', 'fix', 'furniture'], icon: Home, priority: 9 },
  
  // Priority 8
  { keywords: ['phone', 'call', 'contact'], icon: Phone, priority: 8 },
  { keywords: ['email', 'message', 'mail', 'text'], icon: Mail, priority: 8 },
  { keywords: ['video', 'zoom', 'meet', 'conference call'], icon: Video, priority: 8 },
  { keywords: ['birthday', 'party', 'celebration', 'event', 'anniversary'], icon: PartyPopper, priority: 8 },
  { keywords: ['gift', 'present'], icon: Gift, priority: 8 },
  { keywords: ['target', 'objective', 'resolution'], icon: Target, priority: 8 },
  { keywords: ['design', 'art', 'draw', 'paint', 'photo', 'create'], icon: Palette, priority: 8 },
  { keywords: ['computer', 'laptop', 'pc', 'device', 'tech'], icon: Laptop, priority: 8 },
  { keywords: ['server', 'hosting', 'domain', 'website', 'web'], icon: Server, priority: 8 },
  { keywords: ['backup', 'cloud', 'data'], icon: Cloud, priority: 8 },
  
  // Priority 7
  { keywords: ['drive', 'car', 'gas', 'fuel', 'maintenance', 'license', 'traffic'], icon: Car, priority: 7 },
  { keywords: ['bus', 'train', 'transit', 'commute'], icon: Bus, priority: 7 },
  { keywords: ['friend', 'family', 'date', 'hangout', 'social'], icon: Users, priority: 7 },
  { keywords: ['book', 'read', 'library', 'article', 'blog'], icon: BookOpen, priority: 7 },
  { keywords: ['write', 'blog', 'post', 'content'], icon: PenTool, priority: 7 },
  { keywords: ['music', 'song', 'practice', 'instrument'], icon: Music, priority: 7 },
  { keywords: ['habit', 'routine', 'daily', 'consistency'], icon: Flame, priority: 7 },
  { keywords: ['walk', 'hike', 'outdoor', 'nature', 'park'], icon: Footprints, priority: 7 },
  { keywords: ['pet', 'dog', 'cat', 'feed'], icon: Dog, priority: 7 },
  
  // Priority 6
  { keywords: ['food', 'meal', 'recipe', 'cook', 'eating', 'dinner', 'lunch', 'breakfast'], icon: Utensils, priority: 6 },
  { keywords: ['coffee', 'cafe', 'drink'], icon: Coffee, priority: 6 },
  { keywords: ['haircut', 'barber', 'salon', 'spa', 'nails'], icon: Scissors, priority: 6 },
  { keywords: ['sleep', 'rest', 'relax', 'break'], icon: Moon, priority: 6 },
  { keywords: ['reminder', 'note', 'remember', 'remind'], icon: Bell, priority: 6 },
  { keywords: ['plant', 'garden', 'water plants'], icon: Leaf, priority: 6 },
  
  // Priority 5
  { keywords: ['chore', 'errand', 'groceries', 'supplies'], icon: Folder, priority: 5 },
  { keywords: ['game', 'gaming', 'play'], icon: Gamepad2, priority: 5 },
  { keywords: ['movie', 'film', 'watch', 'show'], icon: Tv, priority: 5 },
  { keywords: ['photo', 'picture', 'camera'], icon: Camera, priority: 5 },
  { keywords: ['record', 'podcast', 'mic'], icon: Mic, priority: 5 },
  { keywords: ['listen', 'audio', 'headphones'], icon: Headphones, priority: 5 },
  { keywords: ['repair', 'fix', 'tool', 'wrench', 'hammer'], icon: Hammer, priority: 5 },
  { keywords: ['bike', 'cycling'], icon: Bike, priority: 5 },
  { keywords: ['train', 'rail'], icon: Train, priority: 5 },
  { keywords: ['flower', 'floral'], icon: Flower2, priority: 5 },
  { keywords: ['tree', 'forest'], icon: TreePine, priority: 5 },
  { keywords: ['mountain', 'climbing'], icon: Mountain, priority: 5 },
  { keywords: ['weather', 'sunny'], icon: Sun, priority: 5 },
  { keywords: ['rain', 'rainy'], icon: CloudRain, priority: 5 },
  { keywords: ['snow', 'winter'], icon: Snowflake, priority: 5 },
  { keywords: ['water', 'drink'], icon: Droplets, priority: 5 },
  { keywords: ['weather', 'temperature'], icon: Thermometer, priority: 5 },
  { keywords: ['wind', 'breezy'], icon: Wind, priority: 5 },
  
  // Priority 4
  { keywords: ['schedule', 'calendar', 'event'], icon: Calendar, priority: 4 },
  { keywords: ['time', 'clock', 'alarm'], icon: Clock, priority: 4 },
  { keywords: ['favorite', 'star', 'like'], icon: Star, priority: 4 },
  { keywords: ['profile', 'account', 'user'], icon: User, priority: 4 },
  { keywords: ['group', 'team', 'meeting'], icon: MessageSquare, priority: 4 },
  { keywords: ['file', 'document', 'report'], icon: FileText, priority: 4 },
  { keywords: ['folder', 'directory'], icon: Folder, priority: 4 },
  { keywords: ['invest', 'trading', 'market'], icon: TrendingUp, priority: 4 },
  { keywords: ['save', 'savings', 'piggy'], icon: PiggyBank, priority: 4 },
  { keywords: ['protect', 'safe', 'shield'], icon: Shield, priority: 4 },
];

// Pre-sorted icons at module load time for performance
const SORTED_ICONS = [...ICON_MAP].sort((a, b) => b.priority - a.priority);

// Memoized color cache
const colorCache = new Map<string, string>();

/**
 * Get the appropriate icon for a todo based on its text content
 * Uses keyword matching with priority ordering
 */
export function getSmartIcon(todoText: string): LucideIcon {
  if (!todoText) return Check;
  
  const lowerText = todoText.toLowerCase();
  
  // Use pre-sorted icons (no runtime sorting)
  for (const item of SORTED_ICONS) {
    for (const keyword of item.keywords) {
      if (lowerText.includes(keyword)) {
        return item.icon;
      }
    }
  }
  
  // Default fallback
  return Check;
}

/**
 * Get color based on todo content/category - VIBRANT COLORS
 */
export function getIconColor(todoText: string, isCompleted: boolean = false): string {
  if (isCompleted) return '#9ca3af';
  
  // Check cache first
  const cacheKey = `${todoText}-${isCompleted}`;
  const cached = colorCache.get(cacheKey);
  if (cached) return cached;
  
  const lowerText = todoText.toLowerCase();
  let color = '#818cf8'; // Default
  
  // Work - Electric Indigo
  if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project') || 
      lowerText.includes('deadline') || lowerText.includes('office')) {
    color = '#818cf8';
  }
  // Shopping - Bright Orange
  else if (lowerText.includes('shop') || lowerText.includes('buy') || lowerText.includes('order') || 
      lowerText.includes('grocery')) {
    color = '#fb923c';
  }
  // Health - Bright Green
  else if (lowerText.includes('health') || lowerText.includes('doctor') || lowerText.includes('medicine') || 
      lowerText.includes('fitness') || lowerText.includes('gym') || lowerText.includes('workout')) {
    color = '#34d399';
  }
  // Finance - Bright Emerald
  else if (lowerText.includes('bill') || lowerText.includes('payment') || lowerText.includes('money') || 
      lowerText.includes('budget') || lowerText.includes('tax') || lowerText.includes('invest')) {
    color = '#34d399';
  }
  // Travel - Bright Cyan
  else if (lowerText.includes('travel') || lowerText.includes('trip') || lowerText.includes('flight') || 
      lowerText.includes('vacation')) {
    color = '#22d3ee';
  }
  // Education - Bright Purple
  else if (lowerText.includes('study') || lowerText.includes('learn') || lowerText.includes('course') || 
      lowerText.includes('homework') || lowerText.includes('exam')) {
    color = '#c084fc';
  }
  // Tech - Bright Slate
  else if (lowerText.includes('code') || lowerText.includes('programming') || lowerText.includes('computer') || 
      lowerText.includes('server') || lowerText.includes('tech')) {
    color = '#94a3b8';
  }
  // Urgent - Bright Amber
  else if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('asap') || 
      lowerText.includes('emergency')) {
    color = '#fbbf24';
  }
  // Creative - Hot Pink
  else if (lowerText.includes('design') || lowerText.includes('art') || lowerText.includes('music') || 
      lowerText.includes('photo')) {
    color = '#f43f5e';
  }
  
  // Cache the result (limit cache size to prevent memory issues)
  if (colorCache.size > 100) {
    colorCache.clear();
  }
  colorCache.set(cacheKey, color);
  
  return color;
}

/**
 * Get icon name for debugging
 */
export function getIconName(todoText: string): string {
  const icon = getSmartIcon(todoText);
  return icon.displayName || 'Check';
}

// Export icons array for external use if needed
export const AVAILABLE_ICONS = SORTED_ICONS.map(item => ({
  icon: item.icon,
  keywords: item.keywords,
  priority: item.priority
}));

