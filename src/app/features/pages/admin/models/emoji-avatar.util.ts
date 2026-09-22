// src/app/shared/utils/emoji-avatar.util.ts

export interface AvatarStyle {
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  shape: 'circle' | 'squircle' | 'hexagon';
  pattern: 'none' | 'dots' | 'stripes' | 'waves' | 'glow';
}

const PALETTES = [
  { from: '#667eea', to: '#764ba2' }, // azul-morado
  { from: '#f093fb', to: '#f5576c' }, // rosa-rojo
  { from: '#4facfe', to: '#00f2fe' }, // azul-cian
  { from: '#43e97b', to: '#38f9d7' }, // verde-menta
  { from: '#fa709a', to: '#fee140' }, // rosa-amarillo
  { from: '#ff9a9e', to: '#fecfef' }, // rosa-pastel
  { from: '#a18cd1', to: '#fbc2eb' }, // lila-rosa
  { from: '#30cfd0', to: '#330867' }, // cian-morado
  { from: '#5ee7df', to: '#b490ca' }, // turquesa-lila
  { from: '#c79081', to: '#dfa579' }, // marrón-dorado
  { from: '#96fbc4', to: '#f9f586' }, // verde-lima
  { from: '#13547a', to: '#80d0c7' }, // azul-verde
  { from: '#ff6e7f', to: '#bfe9ff' }, // coral-cielo
  { from: '#ff8177', to: '#b12a5b' }, // rojo-vino
  { from: '#ffecd2', to: '#fcb69f' }, // melocotón
  { from: '#fad0c4', to: '#ffd1ff' }, // durazno
];

const SHAPES: AvatarStyle['shape'][] = ['circle', 'squircle', 'hexagon'];
const PATTERNS: AvatarStyle['pattern'][] = ['none', 'dots', 'stripes', 'waves', 'glow'];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getAvatarStyle(emoji: string): AvatarStyle {
  const safeEmoji = emoji || '👤';
  const hash = hashString(safeEmoji);
  const palette = PALETTES[hash % PALETTES.length];

  return {
    gradientFrom: palette.from,
    gradientTo: palette.to,
    textColor: '#ffffff',
    shape: SHAPES[(hash >> 4) % SHAPES.length],
    pattern: PATTERNS[(hash >> 8) % PATTERNS.length],
  };
}