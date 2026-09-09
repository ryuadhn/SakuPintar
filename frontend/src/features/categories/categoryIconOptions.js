import {
    Banknote,
    Briefcase,
    Car,
    Clapperboard,
    Coffee,
    Dumbbell,
    FileText,
    Gift,
    GraduationCap,
    HeartPulse,
    Home,
    Landmark,
    Lightbulb,
    MoreHorizontal,
    PawPrint,
    Plane,
    ShoppingBag,
    ShoppingCart,
    Smartphone,
    Utensils,
    Users,
    Wallet,
} from 'lucide-react';

export const CATEGORY_ICON_OPTIONS = [
    { key: 'wallet', label: 'Umum', Icon: Wallet },
    { key: 'food', label: 'Makanan', Icon: Utensils },
    { key: 'coffee', label: 'Kopi', Icon: Coffee },
    { key: 'shopping', label: 'Belanja', Icon: ShoppingBag },
    { key: 'cart', label: 'Kebutuhan', Icon: ShoppingCart },
    { key: 'transport', label: 'Transportasi', Icon: Car },
    { key: 'home', label: 'Rumah', Icon: Home },
    { key: 'bills', label: 'Tagihan', Icon: FileText },
    { key: 'health', label: 'Kesehatan', Icon: HeartPulse },
    { key: 'fitness', label: 'Olahraga', Icon: Dumbbell },
    { key: 'entertainment', label: 'Hiburan', Icon: Clapperboard },
    { key: 'travel', label: 'Perjalanan', Icon: Plane },
    { key: 'education', label: 'Pendidikan', Icon: GraduationCap },
    { key: 'work', label: 'Pekerjaan', Icon: Briefcase },
    { key: 'income', label: 'Pemasukan', Icon: Banknote },
    { key: 'phone', label: 'Telepon', Icon: Smartphone },
    { key: 'utilities', label: 'Utilitas', Icon: Lightbulb },
    { key: 'family', label: 'Keluarga', Icon: Users },
    { key: 'gift', label: 'Hadiah', Icon: Gift },
    { key: 'pet', label: 'Hewan', Icon: PawPrint },
    { key: 'other', label: 'Lainnya', Icon: MoreHorizontal },
];

const CATEGORY_ICON_BY_KEY = Object.fromEntries(
    CATEGORY_ICON_OPTIONS.map((option) => [option.key, option.Icon]),
);

const LEGACY_CATEGORY_ICON_KEY_BY_ID = {
    food: 'food',
    transport: 'transport',
    lifestyle: 'entertainment',
    shopping: 'shopping',
    bills: 'bills',
    health: 'health',
    salary: 'income',
    bonus: 'work',
    'other-inc': 'other',
};

export const DEFAULT_CATEGORY_ICON_KEY = {
    expense: 'wallet',
    income: 'income',
};

export function getCategoryIcon(category) {
    return CATEGORY_ICON_BY_KEY[category?.iconKey]
        || CATEGORY_ICON_BY_KEY[LEGACY_CATEGORY_ICON_KEY_BY_ID[category?.id]]
        || Wallet;
}

export function getCategoryIconKey(category) {
    return category?.iconKey || LEGACY_CATEGORY_ICON_KEY_BY_ID[category?.id] || DEFAULT_CATEGORY_ICON_KEY[category?.type] || 'wallet';
}
