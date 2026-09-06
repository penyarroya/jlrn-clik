// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-footer',
//   templateUrl: './footer.component.html',
//   styleUrls: ['./footer.component.scss'],
//   imports: [],
// })
// export class FooterComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }




// src/app/shared/components/footer/footer.component.ts

import { 
  Component, 
  Input, 
  inject, 
  computed, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonFooter, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonLabel, 
  IonCol, 
  IonRow, 
  IonGrid 
} from '@ionic/angular'; // ✅ CORRECTO: importar desde @ionic/angular
import { ThemeService } from '../../services/theme/theme';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export type FooterPosition = 'fixed' | 'sticky' | 'relative' | 'static';

export interface FooterNavLink {
  label: string;
  route: string;
  icon?: string;
}

export interface FooterSocialLink {
  label: string;
  url: string;
  icon: string;
}

export interface FooterLegalLink {
  label: string;
  url: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon
],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  // ============================================================
  // INPUTS - CONFIGURACIÓN DEL FOOTER
  // ============================================================
  
  @Input() position: FooterPosition = 'relative';
  @Input() bottom: string = '0';
  @Input() zIndex: number = 100;
  @Input() noMargin: boolean = false;
  @Input() compact: boolean = false;
  @Input() customClass: string = '';

  @Input() showSocial: boolean = true;
  @Input() showNav: boolean = true;
  @Input() showLegal: boolean = true;
  @Input() showVersion: boolean = true;
  @Input() showCopyright: boolean = true;

  // ============================================================
  // ENLACES CONFIGURABLES
  // ============================================================
  
  @Input() navLinks: FooterNavLink[] = [
    { label: 'Inicio', route: '/home', icon: 'home-outline' },
    { label: 'Acciones', route: '/voice-actions', icon: 'flash-outline' },
    { label: 'Comandos', route: '/voice-commands', icon: 'mic-outline' },
    { label: 'Perfil', route: '/profile', icon: 'person-outline' },
    { label: 'Configuración', route: '/settings', icon: 'settings-outline' }
  ];

  @Input() socialLinks: FooterSocialLink[] = [
    { label: 'GitHub', url: 'https://github.com/tu-usuario', icon: 'logo-github' },
    { label: 'Twitter', url: 'https://twitter.com/tu-usuario', icon: 'logo-twitter' },
    { label: 'YouTube', url: 'https://youtube.com/tu-usuario', icon: 'logo-youtube' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/tu-usuario', icon: 'logo-linkedin' }
  ];

  @Input() legalLinks: FooterLegalLink[] = [
    { label: 'Política de Privacidad', url: '/privacy' },
    { label: 'Términos de Servicio', url: '/terms' },
    { label: 'Cookies', url: '/cookies' }
  ];

  // ============================================================
  // ESTADO
  // ============================================================
  currentYear = new Date().getFullYear();
  appVersion = 'v1.0.0';

  // ============================================================
  // INYECCIONES
  // ============================================================
  private themeService = inject(ThemeService);

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons(allIcons);
  }

  // ============================================================
  // SIGNALS COMPUTADAS
  // ============================================================
  isDarkTheme = computed(() => {
    return this.themeService.currentTheme() === 'dark';
  });

  footerClasses = computed(() => {
    const classes: string[] = ['app-footer'];
    
    if (this.isDarkTheme()) {
      classes.push('dark');
    }
    
    if (this.compact) {
      classes.push('compact');
    }
    
    if (this.customClass) {
      classes.push(this.customClass);
    }

    if (this.position === 'fixed') {
      classes.push('position-fixed');
    } else if (this.position === 'sticky') {
      classes.push('position-sticky');
    } else if (this.position === 'relative') {
      classes.push('position-relative');
    }

    if (this.noMargin) {
      classes.push('no-margin');
    }
    
    return classes.join(' ');
  });

  footerStyles = computed(() => {
    const styles: any = {};

    if (this.position === 'fixed' || this.position === 'sticky') {
      styles.bottom = this.bottom;
      styles.zIndex = this.zIndex;
    }

    return styles;
  });
}
