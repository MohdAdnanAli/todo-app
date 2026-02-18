import type { LucideIcon } from 'lucide-react';
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
  TrendingUp, 
  PiggyBank,
  Phone, 
  Mail, 
  MessageSquare, 
  Video, 
  Calendar,
  Clock,
  Star,
  HeartHandshake,
  Users,
  PartyPopper,
  Gift,
  Zap,
  Target,
  Trophy,
  Flame,
  Activity,
  Dumbbell,
  Brain,
  Lightbulb,
  Code,
  Laptop,
  Server,
  Cloud,
  Database,
  Lock,
  Shield,
  Eye,
  FileText,
  Folder,
  Archive,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Search,
  Filter,
  SortAsc,
  Download,
  Upload,
  Share2,
  Link,
  ExternalLink,
  Bookmark,
  Flag,
  MapPin,
  Camera,
  Image,
  Music,
  Headphones,
  Mic,
  Radio,
  Tv,
  Gamepad2,
  Palette,
  PenTool,
  Scissors,
  Hammer,
  Wrench,
  Bike,
  Bus,
  Train,
  Ship,
  Footprints,
  Dog,
  Cat,
  Leaf,
  Flower2,
  TreePine,
  Mountain,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Thermometer,
  Droplets,
  Wind,
  Bell
} from 'lucide-react';

// Keyword categories with associated keywords and icons
interface KeywordCategory {
  keywords: string[];
  icon: LucideIcon;
  priority?: number;
}

const keywordCategories: KeywordCategory[] = [
  // Work & Career
  { keywords: ['work', 'job', 'office', 'meeting', 'project', 'task', 'deadline', 'client', 'boss', 'colleague', 'conference', 'presentation', 'report', 'email', 'schedule'], icon: Briefcase, priority: 10 },
  
  // Shopping
  { keywords: ['buy', 'shopping', 'purchase', 'order', 'deliver', 'amazon', 'grocery', 'store', 'cart', 'items', 'supplies'], icon: ShoppingCart, priority: 9 },
  
  // Health & Fitness
  { keywords: ['health', 'doctor', 'medicine', 'pill', 'appointment', 'hospital', 'clinic', 'checkup', 'dentist', 'therapy'], icon: Heart, priority: 10 },
  { keywords: ['fitness', 'gym', 'workout', 'exercise', 'run', 'running', 'jog', 'yoga', 'stretch', 'train', 'sport', 'match'], icon: Dumbbell, priority: 9 },
  { keywords: ['diet', 'nutrition', 'food', 'meal', 'recipe', 'cook', 'eating', 'healthy'], icon: Utensils, priority: 8 },
  
  // Home & Living
  { keywords: ['home', 'house', 'clean', 'laundry', 'vacuum', 'repair', 'fix', 'furniture', 'decor', 'garden'], icon: Home, priority: 9 },
  
  // Travel & Transport
  { keywords: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'booking', 'reservation', 'airport', 'tourist'], icon: Plane, priority: 10 },
  { keywords: ['drive', 'car', 'gas', 'fuel', 'maintenance', 'license', 'traffic'], icon: Car, priority: 8 },
  { keywords: ['bus', 'train', 'transit', 'commute'], icon: Bus, priority: 7 },
  
  // Finance
  { keywords: ['bill', 'payment', 'invoice', 'rent', 'mortgage', 'utility', 'electric', 'water', 'internet', 'phone bill'], icon: CreditCard, priority: 10 },
  { keywords: ['money', 'budget', 'save', 'investment', 'stock', 'crypto', 'bank', 'finance'], icon: DollarSign, priority: 9 },
  { keywords: ['tax', 'irs', 'audit'], icon: FileText, priority: 10 },
  
  // Communication
  { keywords: ['call', 'phone', 'contact'], icon: Phone, priority: 8 },
  { keywords: ['email', 'message', 'text', 'mail'], icon: Mail, priority: 7 },
  { keywords: ['zoom', 'meet', 'video call', 'conference call'], icon: Video, priority: 7 },
  
  // Events & Social
  { keywords: ['birthday', 'party', 'celebration', 'event', 'anniversary'], icon: PartyPopper, priority: 9 },
  { keywords: ['gift', 'present'], icon: Gift, priority: 8 },
  { keywords: ['friend', 'family', 'date', 'hangout'], icon: Users, priority: 7 },
  
  // Education
  { keywords: ['study', 'learn', 'course', 'class', 'homework', 'assignment', 'exam', 'test', 'quiz'], icon: GraduationCap, priority: 9 },
  { keywords: ['book', 'read', 'library', 'article', 'blog'], icon: BookOpen, priority: 7 },
  
  // Personal Care
  { keywords: ['haircut', 'barber', 'salon', 'spa', 'massage', 'nails'], icon: Scissors, priority: 7 },
  { keywords: ['sleep', 'rest', 'relax', 'vacation', 'break'], icon: Moon, priority: 6 },
  
  // Tech & Digital
  { keywords: ['code', 'programming', 'developer', 'software', 'bug', 'deploy', 'git', 'github'], icon: Code, priority: 10 },
  { keywords: ['computer', 'laptop', 'pc', 'device', 'tech'], icon: Laptop, priority: 8 },
  { keywords: ['server', 'hosting', 'domain', 'website', 'web'], icon: Server, priority: 8 },
  { keywords: ['backup', 'cloud', 'data'], icon: Cloud, priority: 8 },
  { keywords: ['password', 'security', 'login', '2fa', 'authentication'], icon: Lock, priority: 9 },
  
  // Creative
  { keywords: ['design', 'art', 'draw', 'paint', 'photo', 'video edit', 'create'], icon: Palette, priority: 8 },
  { keywords: ['write', 'blog', 'post', 'content'], icon: PenTool, priority: 7 },
  { keywords: ['music', 'song', 'practice', 'instrument'], icon: Music, priority: 7 },
  
  // Daily Tasks
  { keywords: ['chore', 'errand', 'laundry', 'groceries'], icon: Check, priority: 6 },
  { keywords: ['cook', 'dinner', 'lunch', 'breakfast'], icon: Coffee, priority: 7 },
  
  // Goals & Motivation
  { keywords: ['goal', 'target', 'objective', 'resolution'], icon: Target, priority: 8 },
  { keywords: ['achievement', 'milestone', 'win', 'success'], icon: Trophy, priority: 9 },
  { keywords: ['habit', 'routine', 'daily'], icon: Flame, priority: 7 },
  
  // Urgent/Important
  { keywords: ['urgent', 'important', 'asap', 'emergency', 'critical'], icon: AlertTriangle, priority: 10 },
  { keywords: ['reminder', 'note', 'remember'], icon: Bell, priority: 6 },
  
  // Outdoor & Nature
  { keywords: ['walk', 'hike', 'outdoor', 'nature', 'park'], icon: Footprints, priority: 7 },
  { keywords: ['pet', 'dog', 'cat', 'feed'], icon: Dog, priority: 7 },
  { keywords: ['plant', 'garden', 'water plants'], icon: Leaf, priority: 6 },
  
  // Default
  { keywords: [], icon: Check, priority: 0 }
];

/**
 * Analyzes todo text and returns the most appropriate icon
 * based on keyword matching
 */
export function getSmartIcon(todoText: string): LucideIcon {
  const lowerText = todoText.toLowerCase();
  
  // Sort categories by priority (highest first) and match
  const sortedCategories = [...keywordCategories].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  for (const category of sortedCategories) {
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword)) {
        return category.icon;
      }
    }
  }
  
  // Default icon based on completed state
  return Check;
}

// Additional helper for getting icon name (for debugging/display)
export function getIconName(todoText: string): string {
  const icon = getSmartIcon(todoText);
  return icon.displayName || 'Check';
}

