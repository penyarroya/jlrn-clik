// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-emoji-avatar',
//   templateUrl: './emoji-avatar.component.html',
//   styleUrls: ['./emoji-avatar.component.scss'],
//   imports: [],
// })
// export class EmojiAvatarComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }




// src/app/shared/components/emoji-avatar/emoji-avatar.component.ts

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getAvatarStyle } from '../../../features/pages/admin/models/emoji-avatar.util';

@Component({
  selector: 'app-emoji-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emoji-avatar.component.html',
  styleUrls: ['./emoji-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmojiAvatarComponent {

  /** Emoji a mostrar (ej: '🐺') */
  emoji = input<string>('👤');

  /** Tamaño en píxeles (cuadrado) */
  size = input<number>(48);

  /** Texto alternativo (accesibilidad) */
  alt = input<string>('');

  /** Estilo calculado por hash del emoji */
  style = computed(() => getAvatarStyle(this.emoji()));

  /** Gradiente CSS listo para aplicar */
  gradient = computed(() => {
    const s = this.style();
    return `linear-gradient(135deg, ${s.gradientFrom} 0%, ${s.gradientTo} 100%)`;
  });

  /** Clases CSS dinámicas (forma + patrón) */
  cssClasses = computed(() => {
    const s = this.style();
    return `shape-${s.shape} pattern-${s.pattern}`;
  });
}