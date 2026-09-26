// High-quality, zero-network-latency Vector Animal Avatars
// Supports Fox, Penguin, Lion, Tiger, Panda, Koala, Wolf, Bear, Owl, Rabbit, Cat, Dog, Dragon, Eagle, Monkey, Frog

export interface AnimalAvatar {
  id: string;
  name: string;
  emoji: string;
  bgColors: [string, string];
  svgContent: string;
}

export const ANIMAL_AVATARS: AnimalAvatar[] = [
  {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    bgColors: ['#f97316', '#c2410c'],
    svgContent: `
      <!-- Ears -->
      <polygon points="20,40 32,10 46,36" fill="#ea580c"/>
      <polygon points="25,36 33,18 42,34" fill="#fed7aa"/>
      <polygon points="80,40 68,10 54,36" fill="#ea580c"/>
      <polygon points="75,36 67,18 58,34" fill="#fed7aa"/>
      <!-- Head Base -->
      <path d="M 22 45 Q 50 35 78 45 Q 86 65 72 82 Q 50 96 28 82 Q 14 65 22 45 Z" fill="#f97316"/>
      <!-- White Cheeks & Muzzle -->
      <path d="M 22 55 Q 12 70 30 78 Q 50 86 50 72 Q 50 86 70 78 Q 88 70 78 55 Q 65 62 50 64 Q 35 62 22 55 Z" fill="#ffffff"/>
      <!-- Nose -->
      <polygon points="46,71 54,71 50,77" fill="#18181b"/>
      <!-- Eyes -->
      <ellipse cx="37" cy="52" rx="4.5" ry="5.5" fill="#18181b"/>
      <circle cx="38.5" cy="50.5" r="1.8" fill="#ffffff"/>
      <ellipse cx="63" cy="52" rx="4.5" ry="5.5" fill="#18181b"/>
      <circle cx="64.5" cy="50.5" r="1.8" fill="#ffffff"/>
    `
  },
  {
    id: 'penguin',
    name: 'Penguin',
    emoji: '🐧',
    bgColors: ['#0284c7', '#0f172a'],
    svgContent: `
      <!-- Head -->
      <ellipse cx="50" cy="52" rx="34" ry="36" fill="#0f172a"/>
      <!-- White Face/Chest -->
      <path d="M 26 56 C 26 36 40 36 50 44 C 60 36 74 36 74 56 C 74 76 64 84 50 84 C 36 84 26 76 26 56 Z" fill="#ffffff"/>
      <!-- Cheeks -->
      <circle cx="34" cy="62" r="4.5" fill="#fbcfe8" opacity="0.8"/>
      <circle cx="66" cy="62" r="4.5" fill="#fbcfe8" opacity="0.8"/>
      <!-- Beak -->
      <polygon points="43,56 57,56 50,68" fill="#f59e0b"/>
      <polygon points="45,56 55,56 50,63" fill="#fbbf24"/>
      <!-- Eyes -->
      <ellipse cx="38" cy="48" rx="4" ry="5" fill="#0f172a"/>
      <circle cx="39.5" cy="46.5" r="1.6" fill="#ffffff"/>
      <ellipse cx="62" cy="48" rx="4" ry="5" fill="#0f172a"/>
      <circle cx="63.5" cy="46.5" r="1.6" fill="#ffffff"/>
    `
  },
  {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    bgColors: ['#eab308', '#a16207'],
    svgContent: `
      <!-- Mane -->
      <circle cx="50" cy="52" r="38" fill="#b45309"/>
      <path d="M 50 12 Q 62 20 68 28 Q 80 28 84 40 Q 92 50 86 64 Q 88 76 76 84 Q 64 92 50 88 Q 36 92 24 84 Q 12 76 14 64 Q 8 50 16 40 Q 20 28 32 28 Q 38 20 50 12 Z" fill="#92400e"/>
      <!-- Ears -->
      <circle cx="28" cy="34" r="8" fill="#d97706"/>
      <circle cx="28" cy="34" r="4.5" fill="#fde68a"/>
      <circle cx="72" cy="34" r="8" fill="#d97706"/>
      <circle cx="72" cy="34" r="4.5" fill="#fde68a"/>
      <!-- Face -->
      <ellipse cx="50" cy="56" rx="27" ry="26" fill="#f59e0b"/>
      <!-- Muzzle -->
      <ellipse cx="44" cy="67" rx="8" ry="6.5" fill="#fef3c7"/>
      <ellipse cx="56" cy="67" rx="8" ry="6.5" fill="#fef3c7"/>
      <!-- Nose -->
      <polygon points="46,62 54,62 50,67" fill="#78350f"/>
      <!-- Eyes -->
      <ellipse cx="38" cy="49" rx="4" ry="5" fill="#18181b"/>
      <circle cx="39.5" cy="47.5" r="1.6" fill="#ffffff"/>
      <ellipse cx="62" cy="49" rx="4" ry="5" fill="#18181b"/>
      <circle cx="63.5" cy="47.5" r="1.6" fill="#ffffff"/>
    `
  },
  {
    id: 'tiger',
    name: 'Tiger',
    emoji: '🐯',
    bgColors: ['#ea580c', '#9a3412'],
    svgContent: `
      <!-- Ears -->
      <circle cx="26" cy="32" r="9" fill="#c2410c"/>
      <circle cx="26" cy="32" r="5" fill="#fed7aa"/>
      <circle cx="74" cy="32" r="9" fill="#c2410c"/>
      <circle cx="74" cy="32" r="5" fill="#fed7aa"/>
      <!-- Head -->
      <ellipse cx="50" cy="54" rx="34" ry="30" fill="#f97316"/>
      <!-- Head Stripes -->
      <polygon points="48,26 52,26 51,36 49,36" fill="#18181b"/>
      <polygon points="41,31 43,30 45,39 43,40" fill="#18181b"/>
      <polygon points="59,31 57,30 55,39 57,40" fill="#18181b"/>
      <!-- Side Stripes -->
      <polygon points="18,48 27,51 18,54" fill="#18181b"/>
      <polygon points="18,58 28,60 19,64" fill="#18181b"/>
      <polygon points="82,48 73,51 82,54" fill="#18181b"/>
      <polygon points="82,58 72,60 81,64" fill="#18181b"/>
      <!-- Muzzle -->
      <ellipse cx="43" cy="66" rx="9" ry="7" fill="#ffffff"/>
      <ellipse cx="57" cy="66" rx="9" ry="7" fill="#ffffff"/>
      <!-- Nose -->
      <polygon points="46,61 54,61 50,67" fill="#f43f5e"/>
      <!-- Eyes -->
      <ellipse cx="37" cy="50" rx="4.5" ry="5.5" fill="#18181b"/>
      <circle cx="38.5" cy="48.5" r="1.8" fill="#ffffff"/>
      <ellipse cx="63" cy="50" rx="4.5" ry="5.5" fill="#18181b"/>
      <circle cx="64.5" cy="48.5" r="1.8" fill="#ffffff"/>
    `
  },
  {
    id: 'panda',
    name: 'Panda',
    emoji: '🐼',
    bgColors: ['#475569', '#1e293b'],
    svgContent: `
      <!-- Ears -->
      <ellipse cx="24" cy="30" rx="9.5" ry="8.5" fill="#0f172a"/>
      <ellipse cx="76" cy="30" rx="9.5" ry="8.5" fill="#0f172a"/>
      <!-- Head -->
      <ellipse cx="50" cy="55" rx="34" ry="30" fill="#ffffff"/>
      <!-- Eye Patches -->
      <ellipse cx="36" cy="51" rx="8.5" ry="11" transform="rotate(-15 36 51)" fill="#0f172a"/>
      <ellipse cx="64" cy="51" rx="8.5" ry="11" transform="rotate(15 64 51)" fill="#0f172a"/>
      <!-- Eyes -->
      <circle cx="36" cy="51" r="3.5" fill="#ffffff"/>
      <circle cx="37" cy="50.5" r="2" fill="#0f172a"/>
      <circle cx="37.5" cy="50" r="0.8" fill="#ffffff"/>
      <circle cx="64" cy="51" r="3.5" fill="#ffffff"/>
      <circle cx="63" cy="50.5" r="2" fill="#0f172a"/>
      <circle cx="63.5" cy="50" r="0.8" fill="#ffffff"/>
      <!-- Nose & Mouth -->
      <ellipse cx="50" cy="65" rx="5" ry="3.5" fill="#0f172a"/>
      <path d="M 46 70 Q 50 73 54 70" stroke="#0f172a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    `
  },
  {
    id: 'koala',
    name: 'Koala',
    emoji: '🐨',
    bgColors: ['#64748b', '#334155'],
    svgContent: `
      <!-- Fluffy Ears -->
      <circle cx="21" cy="36" r="14" fill="#94a3b8"/>
      <circle cx="21" cy="36" r="8" fill="#fed7aa"/>
      <circle cx="79" cy="36" r="14" fill="#94a3b8"/>
      <circle cx="79" cy="36" r="8" fill="#fed7aa"/>
      <!-- Head -->
      <ellipse cx="50" cy="55" rx="31" ry="28" fill="#cbd5e1"/>
      <!-- Inner Cheeks -->
      <circle cx="31" cy="62" r="5" fill="#fbcfe8" opacity="0.7"/>
      <circle cx="69" cy="62" r="5" fill="#fbcfe8" opacity="0.7"/>
      <!-- Big Oval Nose -->
      <ellipse cx="50" cy="57" rx="8.5" ry="13" fill="#1e293b"/>
      <!-- Eyes -->
      <ellipse cx="34" cy="47" rx="3.5" ry="4.5" fill="#1e293b"/>
      <circle cx="35" cy="45.5" r="1.5" fill="#ffffff"/>
      <ellipse cx="66" cy="47" rx="3.5" ry="4.5" fill="#1e293b"/>
      <circle cx="67" cy="45.5" r="1.5" fill="#ffffff"/>
    `
  },
  {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    bgColors: ['#6366f1', '#4338ca'],
    svgContent: `
      <!-- Ears -->
      <polygon points="22,42 28,10 44,36" fill="#475569"/>
      <polygon points="26,38 30,18 40,34" fill="#cbd5e1"/>
      <polygon points="78,42 72,10 56,36" fill="#475569"/>
      <polygon points="74,38 70,18 60,34" fill="#cbd5e1"/>
      <!-- Head Base -->
      <path d="M 24 45 Q 50 34 76 45 Q 84 66 70 82 Q 50 94 30 82 Q 16 66 24 45 Z" fill="#64748b"/>
      <!-- Muzzle -->
      <path d="M 32 60 Q 50 48 68 60 Q 72 78 50 86 Q 28 78 32 60 Z" fill="#e2e8f0"/>
      <!-- Nose -->
      <ellipse cx="50" cy="74" rx="4.5" ry="3.5" fill="#0f172a"/>
      <!-- Piercing Amber Eyes -->
      <polygon points="33,48 43,50 35,55" fill="#fbbf24"/>
      <circle cx="37" cy="51" r="2" fill="#0f172a"/>
      <polygon points="67,48 57,50 65,55" fill="#fbbf24"/>
      <circle cx="63" cy="51" r="2" fill="#0f172a"/>
    `
  },
  {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    bgColors: ['#92400e', '#78350f'],
    svgContent: `
      <!-- Ears -->
      <circle cx="26" cy="30" r="9" fill="#78350f"/>
      <circle cx="26" cy="30" r="5" fill="#d97706"/>
      <circle cx="74" cy="30" r="9" fill="#78350f"/>
      <circle cx="74" cy="30" r="5" fill="#d97706"/>
      <!-- Head -->
      <ellipse cx="50" cy="55" rx="34" ry="30" fill="#92400e"/>
      <!-- Muzzle -->
      <ellipse cx="50" cy="66" rx="14" ry="10" fill="#fde68a"/>
      <!-- Nose -->
      <ellipse cx="50" cy="62" rx="6" ry="4" fill="#451a03"/>
      <!-- Mouth -->
      <path d="M 50 66 L 50 71 M 46 70 Q 50 74 54 70" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- Eyes -->
      <ellipse cx="36" cy="48" rx="3.5" ry="4.5" fill="#18181b"/>
      <circle cx="37" cy="46.5" r="1.5" fill="#ffffff"/>
      <ellipse cx="64" cy="48" rx="3.5" ry="4.5" fill="#18181b"/>
      <circle cx="65" cy="46.5" r="1.5" fill="#ffffff"/>
    `
  },
  {
    id: 'owl',
    name: 'Owl',
    emoji: '🦉',
    bgColors: ['#8b5cf6', '#6d28d9'],
    svgContent: `
      <!-- Ear Tufts -->
      <polygon points="26,38 32,16 44,32" fill="#5b21b6"/>
      <polygon points="74,38 68,16 56,32" fill="#5b21b6"/>
      <!-- Head/Body -->
      <ellipse cx="50" cy="55" rx="32" ry="34" fill="#7c3aed"/>
      <!-- Chest Feathers -->
      <path d="M 38 72 Q 44 76 50 72 Q 56 76 62 72 Q 50 88 38 72 Z" fill="#ddd6fe"/>
      <!-- Big Round Eye Rings -->
      <circle cx="37" cy="48" r="12" fill="#fde047"/>
      <circle cx="63" cy="48" r="12" fill="#fde047"/>
      <!-- Pupils -->
      <circle cx="37" cy="48" r="6" fill="#0f172a"/>
      <circle cx="39" cy="46" r="2.2" fill="#ffffff"/>
      <circle cx="63" cy="48" r="6" fill="#0f172a"/>
      <circle cx="65" cy="46" r="2.2" fill="#ffffff"/>
      <!-- Beak -->
      <polygon points="47,54 53,54 50,65" fill="#ea580c"/>
    `
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    emoji: '🐰',
    bgColors: ['#ec4899', '#be185d'],
    svgContent: `
      <!-- Tall Ears -->
      <ellipse cx="36" cy="22" rx="7.5" ry="20" fill="#ffffff"/>
      <ellipse cx="36" cy="22" rx="4" ry="15" fill="#fbcfe8"/>
      <ellipse cx="64" cy="22" rx="7.5" ry="20" fill="#ffffff"/>
      <ellipse cx="64" cy="22" rx="4" ry="15" fill="#fbcfe8"/>
      <!-- Head -->
      <ellipse cx="50" cy="58" rx="30" ry="26" fill="#ffffff"/>
      <!-- Cheeks -->
      <circle cx="30" cy="64" r="5" fill="#fbcfe8" opacity="0.8"/>
      <circle cx="70" cy="64" r="5" fill="#fbcfe8" opacity="0.8"/>
      <!-- Nose -->
      <polygon points="47,62 53,62 50,66" fill="#f43f5e"/>
      <path d="M 50 66 Q 47 70 44 68 M 50 66 Q 53 70 56 68" stroke="#f43f5e" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Whiskers -->
      <line x1="22" y1="62" x2="34" y2="64" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="22" y1="67" x2="34" y2="67" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="78" y1="62" x2="66" y2="64" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="78" y1="67" x2="66" y2="67" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Eyes -->
      <ellipse cx="37" cy="52" rx="3.5" ry="5" fill="#18181b"/>
      <circle cx="38" cy="50.5" r="1.6" fill="#ffffff"/>
      <ellipse cx="63" cy="52" rx="3.5" ry="5" fill="#18181b"/>
      <circle cx="64" cy="50.5" r="1.6" fill="#ffffff"/>
    `
  },
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    bgColors: ['#f43f5e', '#be123c'],
    svgContent: `
      <!-- Ears -->
      <polygon points="22,44 26,16 46,36" fill="#fb7185"/>
      <polygon points="28,38 30,22 42,34" fill="#fecdd3"/>
      <polygon points="78,44 74,16 54,36" fill="#fb7185"/>
      <polygon points="72,38 70,22 58,34" fill="#fecdd3"/>
      <!-- Head -->
      <ellipse cx="50" cy="56" rx="31" ry="26" fill="#f43f5e"/>
      <!-- Muzzle -->
      <ellipse cx="44" cy="66" rx="7" ry="5" fill="#fff1f2"/>
      <ellipse cx="56" cy="66" rx="7" ry="5" fill="#fff1f2"/>
      <!-- Nose & Mouth -->
      <polygon points="47,62 53,62 50,66" fill="#be123c"/>
      <!-- Whiskers -->
      <line x1="18" y1="62" x2="34" y2="64" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="18" y1="68" x2="34" y2="67" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="82" y1="62" x2="66" y2="64" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="82" y1="68" x2="66" y2="67" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Big Cat Eyes -->
      <ellipse cx="36" cy="50" rx="4.5" ry="5.5" fill="#fef08a"/>
      <ellipse cx="36" cy="50" rx="2" ry="5" fill="#0f172a"/>
      <ellipse cx="64" cy="50" rx="4.5" ry="5.5" fill="#fef08a"/>
      <ellipse cx="64" cy="50" rx="2" ry="5" fill="#0f172a"/>
    `
  },
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐶',
    bgColors: ['#10b981', '#047857'],
    svgContent: `
      <!-- Floppy Ears -->
      <ellipse cx="22" cy="50" rx="7.5" ry="18" fill="#b45309" transform="rotate(15 22 50)"/>
      <ellipse cx="78" cy="50" rx="7.5" ry="18" fill="#b45309" transform="rotate(-15 78 50)"/>
      <!-- Head -->
      <ellipse cx="50" cy="54" rx="30" ry="26" fill="#fde68a"/>
      <!-- Muzzle -->
      <ellipse cx="50" cy="65" rx="14" ry="10" fill="#ffffff"/>
      <!-- Nose -->
      <ellipse cx="50" cy="60" rx="6.5" ry="4.5" fill="#18181b"/>
      <!-- Tongue -->
      <path d="M 47 70 Q 50 78 53 70 Z" fill="#f43f5e"/>
      <path d="M 44 68 Q 50 72 56 68" stroke="#18181b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Eyes -->
      <circle cx="36" cy="48" r="4.5" fill="#18181b"/>
      <circle cx="37.5" cy="46.5" r="1.7" fill="#ffffff"/>
      <circle cx="64" cy="48" r="4.5" fill="#18181b"/>
      <circle cx="65.5" cy="46.5" r="1.7" fill="#ffffff"/>
    `
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐲',
    bgColors: ['#059669', '#065f46'],
    svgContent: `
      <!-- Horns -->
      <path d="M 30 36 Q 22 18 16 14 Q 28 22 34 32 Z" fill="#fde047"/>
      <path d="M 70 36 Q 78 18 84 14 Q 72 22 66 32 Z" fill="#fde047"/>
      <!-- Head -->
      <ellipse cx="50" cy="54" rx="30" ry="26" fill="#10b981"/>
      <!-- Snout -->
      <ellipse cx="50" cy="66" rx="16" ry="10" fill="#34d399"/>
      <!-- Nostrils (smoke puffs) -->
      <ellipse cx="43" cy="64" rx="2.5" ry="1.8" fill="#064e3b"/>
      <ellipse cx="57" cy="64" rx="2.5" ry="1.8" fill="#064e3b"/>
      <!-- Big Cute Dragon Eyes -->
      <circle cx="36" cy="48" r="5" fill="#fef08a"/>
      <ellipse cx="36" cy="48" rx="2" ry="4.5" fill="#064e3b"/>
      <circle cx="37" cy="46" r="1.2" fill="#ffffff"/>
      <circle cx="64" cy="48" r="5" fill="#fef08a"/>
      <ellipse cx="64" cy="48" rx="2" ry="4.5" fill="#064e3b"/>
      <circle cx="65" cy="46" r="1.2" fill="#ffffff"/>
    `
  },
  {
    id: 'eagle',
    name: 'Eagle',
    emoji: '🦅',
    bgColors: ['#0d9488', '#115e59'],
    svgContent: `
      <!-- White Feather Crown -->
      <ellipse cx="50" cy="52" rx="30" ry="32" fill="#ffffff"/>
      <!-- Eye Brow Furrow -->
      <path d="M 30 42 Q 40 40 48 45" stroke="#71717a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 70 42 Q 60 40 52 45" stroke="#71717a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Eyes -->
      <circle cx="38" cy="48" r="4.5" fill="#fde047"/>
      <circle cx="38" cy="48" r="2.2" fill="#09090b"/>
      <circle cx="62" cy="48" r="4.5" fill="#fde047"/>
      <circle cx="62" cy="48" r="2.2" fill="#09090b"/>
      <!-- Hooked Beak -->
      <path d="M 44 52 Q 50 48 56 52 Q 54 68 50 74 Q 46 68 44 52 Z" fill="#f59e0b"/>
      <polygon points="46,52 54,52 50,60" fill="#fbbf24"/>
    `
  },
  {
    id: 'monkey',
    name: 'Monkey',
    emoji: '🐵',
    bgColors: ['#b45309', '#713f12'],
    svgContent: `
      <!-- Big Ears -->
      <circle cx="18" cy="50" r="11" fill="#78350f"/>
      <circle cx="18" cy="50" r="6.5" fill="#fed7aa"/>
      <circle cx="82" cy="50" r="11" fill="#78350f"/>
      <circle cx="82" cy="50" r="6.5" fill="#fed7aa"/>
      <!-- Head Base -->
      <circle cx="50" cy="52" r="30" fill="#78350f"/>
      <!-- Face Mask -->
      <path d="M 32 44 Q 50 36 68 44 Q 74 62 66 72 Q 50 78 34 72 Q 26 62 32 44 Z" fill="#fed7aa"/>
      <!-- Nostrils & Grin -->
      <ellipse cx="46" cy="58" rx="1.8" ry="1.2" fill="#78350f"/>
      <ellipse cx="54" cy="58" rx="1.8" ry="1.2" fill="#78350f"/>
      <path d="M 42 64 Q 50 70 58 64" stroke="#78350f" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Eyes -->
      <circle cx="38" cy="48" r="3.5" fill="#18181b"/>
      <circle cx="39" cy="47" r="1.3" fill="#ffffff"/>
      <circle cx="62" cy="48" r="3.5" fill="#18181b"/>
      <circle cx="63" cy="47" r="1.3" fill="#ffffff"/>
    `
  },
  {
    id: 'frog',
    name: 'Frog',
    emoji: '🐸',
    bgColors: ['#16a34a', '#14532d'],
    svgContent: `
      <!-- Big Bulging Eyes on Top -->
      <circle cx="32" cy="36" r="13" fill="#22c55e"/>
      <circle cx="32" cy="36" r="7.5" fill="#ffffff"/>
      <circle cx="33" cy="36" r="4.5" fill="#0f172a"/>
      <circle cx="34.5" cy="34.5" r="1.5" fill="#ffffff"/>
      <circle cx="68" cy="36" r="13" fill="#22c55e"/>
      <circle cx="68" cy="36" r="7.5" fill="#ffffff"/>
      <circle cx="67" cy="36" r="4.5" fill="#0f172a"/>
      <circle cx="68.5" cy="34.5" r="1.5" fill="#ffffff"/>
      <!-- Head -->
      <ellipse cx="50" cy="58" rx="34" ry="24" fill="#22c55e"/>
      <!-- Cheeks -->
      <circle cx="28" cy="62" r="5" fill="#86efac" opacity="0.6"/>
      <circle cx="72" cy="62" r="5" fill="#86efac" opacity="0.6"/>
      <!-- Huge Happy Smile -->
      <path d="M 32 60 Q 50 76 68 60" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    `
  }
];

// Helper to look up an avatar by ID
export function getAnimalById(id: string): AnimalAvatar {
  const found = ANIMAL_AVATARS.find(a => a.id.toLowerCase() === id.toLowerCase());
  return found || ANIMAL_AVATARS[0];
}

// Generate data URI SVG from an animal avatar
export function createAnimalSvgDataUri(avatar: AnimalAvatar): string {
  const [c1, c2] = avatar.bgColors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g_${avatar.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#g_${avatar.id})"/>
    ${avatar.svgContent}
  </svg>`.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Universal getAvatarUrl: NEVER returns letters!
// If customPhoto is an uploaded photo (base64/http) or starts with "animal:xyz", returns that.
// Otherwise hashes the seed and returns one of the 16 vibrant Animal Avatars!
export function getAvatarUrl(seed: string, customPhoto?: string): string {
  if (customPhoto && customPhoto.trim()) {
    if (customPhoto.startsWith('animal:')) {
      const animalId = customPhoto.replace('animal:', '');
      return createAnimalSvgDataUri(getAnimalById(animalId));
    }
    if (customPhoto.startsWith('data:image/') || customPhoto.startsWith('http')) {
      return customPhoto;
    }
  }

  // Check if seed is an animal ID
  const directMatch = ANIMAL_AVATARS.find(a => a.id.toLowerCase() === (seed || '').toLowerCase());
  if (directMatch) {
    return createAnimalSvgDataUri(directMatch);
  }

  // Hash seed to deterministically assign one of the animal avatars
  let hash = 0;
  const safeSeed = seed || 'CW';
  for (let i = 0; i < safeSeed.length; i++) {
    hash = safeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ANIMAL_AVATARS.length;
  return createAnimalSvgDataUri(ANIMAL_AVATARS[index]);
}

// Generates a short, memorable, clean user ID (e.g., CW-8492 or CW-7K2M)
export function generateShortUserId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes confusing 0, O, 1, I
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CW-${code}`;
}
