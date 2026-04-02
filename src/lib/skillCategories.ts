import { Code2, Palette, Music, Languages, TrendingUp, Dumbbell, PenLine, FlaskConical, ChefHat, Camera } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SkillCategory {
    id: string
    label: string
    icon: LucideIcon
    keywords: string[]
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        id: 'tech',
        label: 'Tech & Code',
        icon: Code2,
        keywords: ['programming', 'coding', 'javascript', 'typescript', 'python', 'react', 'nextjs', 'node', 'web', 'app', 'software', 'data', 'ai', 'machine learning', 'sql', 'database', 'html', 'css', 'backend', 'frontend', 'devops', 'cloud', 'aws', 'docker', 'git', 'api', 'java', 'c++', 'swift', 'kotlin', 'flutter', 'mobile', 'ios', 'android', 'cybersecurity', 'blockchain', 'excel', 'sheets'],
    },
    {
        id: 'design',
        label: 'Design & Art',
        icon: Palette,
        keywords: ['design', 'figma', 'photoshop', 'illustrator', 'ui', 'ux', 'graphic', 'logo', 'branding', 'animation', 'drawing', 'painting', 'illustration', 'art', 'sketch', 'typography', '3d', 'blender', 'after effects', 'premiere', 'video editing', 'motion', 'canva'],
    },
    {
        id: 'music',
        label: 'Music',
        icon: Music,
        keywords: ['guitar', 'piano', 'drums', 'bass', 'singing', 'vocals', 'music', 'production', 'mixing', 'dj', 'violin', 'saxophone', 'trumpet', 'ukulele', 'music theory', 'ableton', 'fl studio', 'recording', 'songwriting', 'composition'],
    },
    {
        id: 'languages',
        label: 'Languages',
        icon: Languages,
        keywords: ['english', 'spanish', 'french', 'german', 'mandarin', 'chinese', 'japanese', 'korean', 'arabic', 'portuguese', 'italian', 'russian', 'hindi', 'language', 'conversation', 'grammar', 'translation', 'linguistics'],
    },
    {
        id: 'business',
        label: 'Business',
        icon: TrendingUp,
        keywords: ['marketing', 'sales', 'business', 'finance', 'accounting', 'entrepreneur', 'startup', 'product', 'management', 'leadership', 'strategy', 'consulting', 'seo', 'social media', 'content', 'copywriting', 'investing', 'trading', 'stocks', 'crypto', 'real estate', 'negotiation'],
    },
    {
        id: 'fitness',
        label: 'Health & Fitness',
        icon: Dumbbell,
        keywords: ['fitness', 'yoga', 'meditation', 'nutrition', 'gym', 'running', 'crossfit', 'pilates', 'boxing', 'martial arts', 'swimming', 'cycling', 'weight training', 'health', 'wellness', 'personal training', 'stretching', 'calisthenics'],
    },
    {
        id: 'writing',
        label: 'Writing',
        icon: PenLine,
        keywords: ['writing', 'blogging', 'poetry', 'fiction', 'creative writing', 'storytelling', 'journalism', 'editing', 'screenwriting', 'copywriting', 'essay', 'proofreading', 'technical writing'],
    },
    {
        id: 'science',
        label: 'Science & Math',
        icon: FlaskConical,
        keywords: ['math', 'mathematics', 'physics', 'chemistry', 'biology', 'statistics', 'calculus', 'algebra', 'science', 'research', 'data science', 'neuroscience', 'psychology', 'economics'],
    },
    {
        id: 'cooking',
        label: 'Cooking & Food',
        icon: ChefHat,
        keywords: ['cooking', 'baking', 'chef', 'food', 'recipes', 'nutrition', 'meal prep', 'pastry', 'cuisine', 'grilling', 'fermentation', 'cocktails', 'coffee', 'barista'],
    },
    {
        id: 'photo',
        label: 'Photo & Video',
        icon: Camera,
        keywords: ['photography', 'photo', 'videography', 'video', 'filming', 'editing', 'lightroom', 'camera', 'cinematography', 'youtube', 'tiktok', 'content creation', 'podcast'],
    },
]
