// // src/app/features/auth/components/login/login.component.ts

// import { 
//   Component, 
//   signal, 
//   inject, 
//   OnDestroy, 
//   OnInit, 
//   ChangeDetectorRef,
//   ChangeDetectionStrategy,
//   ViewChild,
//   ElementRef,
//   AfterViewInit,
//   Renderer2,
//   NgZone
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { finalize, Subject, takeUntil } from 'rxjs';
// import { passwordValidator, usernameValidator, getErrorMessage} from '../../../../shared/validators/validators';

// import { 
//   IonContent, 
//   IonButton, 
//   IonInput, 
//   IonItem, 
//   IonLabel, 
//   IonIcon,
//   IonCheckbox,
//   IonText,
//   IonSpinner
// } from '@ionic/angular';

// import { LoginRequest } from '../../models/LoginRequest';
// import { addIcons } from 'ionicons';
// import { 
//   mailOutline, 
//   lockClosedOutline, 
//   eyeOutline, 
//   eyeOffOutline, 
//   logInOutline,
//   arrowBackOutline,
//   personOutline,
//   alertCircleOutline,
//   checkmarkCircleOutline,
//   closeCircleOutline,
//   warningOutline,
//   informationCircleOutline,
//   keyOutline,
//   shieldOutline,
//   checkmarkOutline
// } from 'ionicons/icons';
// import { AuthService } from '../../Services/auth-service';
// import { VoiceContextService } from '../../../services/voz/voice-context.service';
// import { FieldCleanupService } from '../../../services/voz/field-cleanup.service';
// import { VoiceCommandHandlerService } from '../../../services/voz/voice-command-handler.service';
// import { VoiceCommandOrchestratorService } from '../../../services/voz/voice-command-orchestrator.service';
// import { VoiceFilterService } from '../../../services/voz/voice-filter.service';
// import { VoiceService } from '../../../services/voz/voice.service';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     IonContent,
//     IonButton,
//     IonInput,
//     IonItem,
//     IonLabel,
//     IonIcon,
//     IonCheckbox,
//     IonText,
//     IonSpinner
//   ],
//   templateUrl: './login-component.html',
//   styleUrls: ['./login-component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
//   private fb = inject(FormBuilder);
//   private authService = inject(AuthService);
//   private router = inject(Router);
//   private cdr = inject(ChangeDetectorRef);
//   private renderer = inject(Renderer2);
//   private ngZone = inject(NgZone);
//   private voiceService = inject(VoiceService);
//   private voiceContext = inject(VoiceContextService);
//   private voiceFilter = inject(VoiceFilterService);
//   private voiceHandler = inject(VoiceCommandHandlerService);
//   private orchestrator = inject(VoiceCommandOrchestratorService);
//   private fieldCleanup = inject(FieldCleanupService);

//   private destroy$ = new Subject<void>();
//   private lastProcessedCommand = '';
//   private lastProcessedTime = 0;
//   private readonly COMMAND_DEBOUNCE = 2000;
//   private isDestroyed = false;
//   private welcomeTimeout: any = null;

//   // ============================================================
//   // REFERENCIAS A INPUTS
//   // ============================================================
//   @ViewChild('usernameInput') usernameInput!: IonInput;
//   @ViewChild('passwordInput') passwordInput!: IonInput;
//   @ViewChild('usernameInputEl', { read: ElementRef }) usernameInputEl!: ElementRef<HTMLInputElement>;
//   @ViewChild('passwordInputEl', { read: ElementRef }) passwordInputEl!: ElementRef<HTMLInputElement>;

//   // ============================================================
//   // FORMULARIO
//   // ============================================================
//   // loginForm = this.fb.nonNullable.group({
//   //   usernameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
//   //   password: ['', [Validators.required, Validators.minLength(9)]],
//   //   rememberMe: [false]
//   // });


//   loginForm = this.fb.nonNullable.group({
//     usernameOrEmail: ['', [Validators.required, usernameValidator()]],
//     password: ['', [Validators.required, passwordValidator(9)]],
//     rememberMe: [false]
//   });

//   // ============================================================
//   // SEÑALES PARA ESTADO DE UI
//   // ============================================================
//   isLoading = signal<boolean>(false);
//   errorMessage = signal<string | null>(null);
//   showError = signal<boolean>(false);
//   hidePassword = signal<boolean>(true);
//   isProcessing = signal<boolean>(false);
//   isListening = signal<boolean>(false);
//   lastReply = signal<string>('');

//   // ✅ SEÑALES PARA FEEDBACK EN TIEMPO REAL
//   usernameLength = signal<number>(0);
//   passwordLength = signal<number>(0);
//   isUsernameValid = signal<boolean>(false);
//   isPasswordValid = signal<boolean>(false);
//   passwordStrength = signal<number>(0);
//   passwordStrengthText = signal<string>('');
//   passwordStrengthColor = signal<string>('medium');

//   // ============================================================
//   // ESTADO DE VOZ Y DICTADO
//   // ============================================================
//   private welcomeShown = false;
//   private dictationMode = false;
//   private dictationTarget: 'username' | 'password' | null = null;
//   private dictationBuffer = '';

//   private readonly WELCOME_MESSAGE = 'Bienvenido a inicio de sesión. Di "usuario", "contraseña", "enviar", "limpiar campos", "leer campos", "volver", o "ayuda" para más opciones.';

//   // ============================================================
//   // GETTERS
//   // ============================================================
//   get usernameOrEmailCtrl() { return this.loginForm.controls.usernameOrEmail; }
//   get passwordCtrl() { return this.loginForm.controls.password; }

//   // ============================================================
//   // SINÓNIMOS
//   // ============================================================
//   private readonly synonyms = {
//     dictateUsername: ['usuario', 'escribir usuario', 'escribe usuario', 'nombre', 'escribir nombre', 'escribe nombre', 'user', 'email', 'correo'],
//     dictatePassword: ['contraseña', 'clave', 'escribir contraseña', 'escribe contraseña', 'escribir clave', 'escribe clave', 'password', 'pass'],
//     finish: ['fin', 'listo', 'terminar', 'finalizar', 'ok', 'vale', 'hecho', 'completar'],
//     back: ['volver', 'atrás', 'regresar', 'retroceder', 'cancelar'],
//     login: ['enviar', 'logear', 'acceder', 'entrar', 'iniciar sesión', 'login', 'ingresar', 'acceder al sistema'],
//     mute: ['silenciar micrófono', 'dejar de escuchar', 'silenciar', 'mute', 'apagar micrófono'],
//     unmute: ['activar micrófono', 'encender micrófono', 'desmutear', 'unmute', 'escuchar'],
//     showPassword: ['mostrar contraseña', 'ver contraseña', 'mostrar clave', 'ver clave'],
//     hidePassword: ['ocultar contraseña', 'ocultar clave', 'esconder contraseña'],
//     help: ['ayuda', 'qué puedo decir', 'opciones', 'comandos', 'ayúdame'],
//     clearUsername: ['limpiar usuario', 'borrar usuario', 'limpiar nombre', 'borrar nombre', 'limpiar nombre de usuario'],
//     clearPassword: ['limpiar contraseña', 'borrar contraseña', 'limpiar clave', 'borrar clave'],
//     clearCurrent: ['limpiar campo', 'borrar campo', 'limpiar este campo', 'borrar este campo'],
//     clearAll: ['limpiar campos', 'limpiar todo', 'borrar todo', 'resetear', 'empezar de cero', 'borrar campos'],
//     cancel: ['cancelar', 'cancel', 'abortar'],
//     register: ['registro', 'registrar', 'crear cuenta', 'registrarme', 'nueva cuenta'],
//     forgot: ['olvidé', 'recuperar', 'recuperar contraseña', 'olvide contraseña', 'recuperar clave'],
//     privacy: ['privacidad', 'política de privacidad', 'política'],
//     terms: ['condiciones', 'términos', 'términos y condiciones', 'condiciones de uso'],
//     readFields: ['leer campos', 'leer', 'leer todo', 'qué tengo', 'qué hay', 'mostrar campos', 'qué he escrito', 'revisar campos'],
//     status: ['estado', 'qué falta', 'campos pendientes', 'falta algo']
//   };

//   // ============================================================
//   // MÉTODOS DE VALIDACIÓN
//   // ============================================================
//   private isValidUsernameOrEmail(value: string): boolean {
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     if (emailRegex.test(value)) return true;
//     const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
//     return usernameRegex.test(value);
//   }

//   private calculatePasswordStrength(password: string): number {
//     if (!password) return 0;
//     let strength = 0;
//     if (password.length >= 9) strength++;
//     if (/[A-Z]/.test(password)) strength++;
//     if (/[0-9]/.test(password)) strength++;
//     if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
//     return strength;
//   }

//   private getPasswordStrengthText(strength: number): string {
//     if (strength === 0) return 'Muy débil';
//     if (strength === 1) return 'Débil';
//     if (strength === 2) return 'Media';
//     if (strength === 3) return 'Fuerte';
//     if (strength === 4) return 'Muy fuerte';
//     return '';
//   }

//   private getPasswordStrengthColor(strength: number): string {
//     if (strength === 0) return 'danger';
//     if (strength === 1) return 'warning';
//     if (strength === 2) return 'medium';
//     if (strength === 3) return 'success';
//     if (strength === 4) return 'success';
//     return 'medium';
//   }

//   // ============================================================
//   // MÉTODOS PARA EL HTML
//   // ============================================================
//   // getPasswordRequirementsStatus(): { label: string; met: boolean }[] {
//   //   const value = this.passwordCtrl.value || '';
//   //   return [
//   //     { label: 'Mínimo 9 caracteres', met: value.length >= 9 },
//   //     { label: 'Al menos 1 mayúscula', met: /[A-Z]/.test(value) },
//   //     { label: 'Al menos 1 minúscula', met: /[a-z]/.test(value) },
//   //     { label: 'Al menos 1 número', met: /[0-9]/.test(value) },
//   //     { label: 'Al menos 1 carácter especial', met: /[!@#$%^&*(),.?":{}|<>]/.test(value) }
//   //   ];
//   // }


//   getPasswordRequirementsStatus(): { label: string; met: boolean }[] {
//     const ctrl = this.passwordCtrl;
//     const errors = ctrl.errors || {};
//     const value = ctrl.value || '';
//     const isEmpty = value.length === 0;

//     return [
//       { label: 'Mínimo 9 caracteres', met: !isEmpty && !errors['minlength'] },
//       { label: 'Al menos 1 mayúscula', met: !isEmpty && !errors['missingUppercase'] },
//       { label: 'Al menos 1 minúscula', met: !isEmpty && !errors['missingLowercase'] },
//       { label: 'Al menos 1 número', met: !isEmpty && !errors['missingNumber'] },
//       { label: 'Al menos 1 carácter especial', met: !isEmpty && !errors['missingSpecialChar'] }
//     ];
//   }

//   // updateSignals(): void {
//   //   const username = this.usernameOrEmailCtrl.value || '';
//   //   const password = this.passwordCtrl.value || '';
    
//   //   this.usernameLength.set(username.length);
//   //   this.passwordLength.set(password.length);
    
//   //   this.isUsernameValid.set(username.length >= 3 && this.isValidUsernameOrEmail(username));
    
//   //   const strength = this.calculatePasswordStrength(password);
//   //   this.passwordStrength.set(strength);
//   //   this.isPasswordValid.set(password.length >= 9 && strength >= 3);
//   //   this.passwordStrengthText.set(this.getPasswordStrengthText(strength));
//   //   this.passwordStrengthColor.set(this.getPasswordStrengthColor(strength));
//   // }



//   updateSignals(): void {
//     const username = this.usernameOrEmailCtrl.value || '';
//     const password = this.passwordCtrl.value || '';
    
//     this.usernameLength.set(username.length);
//     this.passwordLength.set(password.length);
    
//     // ✅ Usa el estado del validador de Angular
//     this.isUsernameValid.set(this.usernameOrEmailCtrl.valid && username.length > 0);
    
//     const strength = this.calculatePasswordStrength(password);
//     this.passwordStrength.set(strength);
    
//     // ✅ Usa el estado del validador de Angular
//     this.isPasswordValid.set(this.passwordCtrl.valid && password.length > 0);
    
//     this.passwordStrengthText.set(this.getPasswordStrengthText(strength));
//     this.passwordStrengthColor.set(this.getPasswordStrengthColor(strength));
//   }



//   // ============================================================
//   // CONSTRUCTOR
//   // ============================================================
//   constructor() {
//     addIcons({ 
//       mailOutline, 
//       lockClosedOutline, 
//       eyeOutline, 
//       eyeOffOutline, 
//       logInOutline,
//       arrowBackOutline,
//       personOutline,
//       alertCircleOutline,
//       checkmarkCircleOutline,
//       closeCircleOutline,
//       warningOutline,
//       informationCircleOutline,
//       keyOutline,
//       shieldOutline,
//       checkmarkOutline
//     });

//     // ✅ SUSCRIBIRSE A CAMBIOS DEL FORMULARIO
//     this.loginForm.valueChanges.subscribe(() => {
//       this.updateSignals();
//     });
//   }

//   // ============================================================
//   // CICLO DE VIDA
//   // ============================================================
//   ngOnInit(): void {
//     console.log('✅ LoginComponent inicializado');

//     this.voiceContext.setContext({
//       activationMessage: this.WELCOME_MESSAGE,
//       availableCommands: [
//         'usuario', 'contraseña', 'enviar', 'limpiar', 'mostrar contraseña',
//         'ocultar contraseña', 'registro', 'recuperar', 'volver',
//         'silenciar micrófono', 'ayuda', 'leer campos',
//         'privacidad', 'condiciones'
//       ],
//       preventBackend: true
//     });

//     // ✅ SUSCRIPCIÓN IGUAL QUE MATERIAL
//     this.voiceService.getTranscript()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((text: string) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed) return;
//           if (text && text.trim().length >= 1 && /[a-záéíóú]/.test(text)) {
//             this.handleVoiceCommand(text);
//           }
//         });
//       });

//     // Suscripciones al orchestrator
//     this.orchestrator.status$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((status) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed) return;
//           this.isProcessing.set(status === 'processing' || status === 'listening');
//           this.cdr.markForCheck();
//         });
//       });

//     this.orchestrator.response$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((response) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed || !response) return;
//           this.lastReply.set(response.reply);
//           if (!response.audioBase64) {
//             this.voiceService.speak(response.reply);
//           }
//           this.handleAction(response);
//           this.cdr.markForCheck();
//         });
//       });

//     this.orchestrator.error$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((err) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed || !err) return;
//           console.error('Error en orchestrator:', err);
//           this.errorMessage.set(err);
//           this.cdr.markForCheck();
//         });
//       });

//     this.voiceService.getMutedState()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((muted) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed) return;
//           this.isListening.set(!muted);
//           this.cdr.markForCheck();
//         });
//       });

//     // Registrar campos
//     this.registerFieldsForCleanup();

//     // ✅ ACTUALIZAR SEÑALES
//     this.updateSignals();

//     // Mostrar bienvenida
//     setTimeout(() => {
//       this.showWelcomeMessage();
//     }, 1000);

//     // Asegurar reconocimiento
//     setTimeout(() => {
//       if (!this.isDestroyed && !this.voiceService.isRecognitionActive()) {
//         this.voiceService.startListening();
//       }
//     }, 1500);
//   }

//   ngAfterViewInit(): void {
//     this.setupFocusListeners();
//     // ✅ ACTUALIZAR SEÑALES
//     this.updateSignals();
//   }

//   ngOnDestroy(): void {
//     console.log('🧹 LoginComponent - Iniciando limpieza');
//     this.isDestroyed = true;
//     if (this.welcomeTimeout) {
//       clearTimeout(this.welcomeTimeout);
//       this.welcomeTimeout = null;
//     }
//     window.speechSynthesis.cancel();
//     this.voiceContext.resetContext();
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.fieldCleanup.unregisterField('username');
//     this.fieldCleanup.unregisterField('password');
//     this.dictationMode = false;
//     this.dictationTarget = null;
//     this.dictationBuffer = '';
//     console.log('🧹 LoginComponent destruido');
//   }

//   // ============================================================
//   // REGISTRAR CAMPOS
//   // ============================================================
//   private registerFieldsForCleanup(): void {
//     this.fieldCleanup.registerField({
//       name: 'username',
//       label: 'usuario',
//       isFocused: false,
//       clear: () => this.clearField('username'),
//       isEmpty: () => !this.loginForm.get('usernameOrEmail')?.value
//     });

//     this.fieldCleanup.registerField({
//       name: 'password',
//       label: 'contraseña',
//       isFocused: false,
//       clear: () => this.clearField('password'),
//       isEmpty: () => !this.loginForm.get('password')?.value
//     });
//   }

//   private setupFocusListeners(): void {
//     const usernameEl = this.usernameInputEl?.nativeElement;
//     const passwordEl = this.passwordInputEl?.nativeElement;

//     if (usernameEl) {
//       this.renderer.listen(usernameEl, 'focus', () => {
//         this.fieldCleanup.registerField({
//           name: 'username',
//           label: 'usuario',
//           isFocused: true,
//           clear: () => this.clearField('username'),
//           isEmpty: () => !this.loginForm.get('usernameOrEmail')?.value
//         });
//       });
//       this.renderer.listen(usernameEl, 'blur', () => {
//         this.fieldCleanup.registerField({
//           name: 'username',
//           label: 'usuario',
//           isFocused: false,
//           clear: () => this.clearField('username'),
//           isEmpty: () => !this.loginForm.get('usernameOrEmail')?.value
//         });
//       });
//     }

//     if (passwordEl) {
//       this.renderer.listen(passwordEl, 'focus', () => {
//         this.fieldCleanup.registerField({
//           name: 'password',
//           label: 'contraseña',
//           isFocused: true,
//           clear: () => this.clearField('password'),
//           isEmpty: () => !this.loginForm.get('password')?.value
//         });
//       });
//       this.renderer.listen(passwordEl, 'blur', () => {
//         this.fieldCleanup.registerField({
//           name: 'password',
//           label: 'contraseña',
//           isFocused: false,
//           clear: () => this.clearField('password'),
//           isEmpty: () => !this.loginForm.get('password')?.value
//         });
//       });
//     }
//   }

//   // ============================================================
//   // MENSAJE DE BIENVENIDA
//   // ============================================================
//   private showWelcomeMessage(): void {
//     if (this.welcomeShown || this.isDestroyed) return;
//     this.welcomeShown = true;

//     const isMuted = this.voiceService.isCurrentlyMuted();
    
//     if (!isMuted) {
//       this.welcomeTimeout = setTimeout(() => {
//         if (!this.isDestroyed) {
//           this.voiceService.speakAlways(this.WELCOME_MESSAGE);
//         }
//       }, 1500);
//     } else {
//       console.log('🔇 [Login] Micrófono muteado, mensaje de bienvenida omitido');
//     }
//   }

//   // ============================================================
//   // HANDLE VOICE COMMAND - IGUAL QUE MATERIAL
//   // ============================================================
//   // private handleVoiceCommand(text: string): void {
//   //   if (this.isDestroyed) return;
//   //   const lower = text.toLowerCase().trim();
    
//   //   console.log(`📝 [handleVoiceCommand] lower: "${lower}"`);

//   //   // Ignorar números sueltos
//   //   const isNumeric = /^\d+$/.test(lower) || ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'].some(w => lower === w);
//   //   if (isNumeric) {
//   //     console.log('⏭️ Login: número suelto ignorado');
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // COMANDOS DE NAVEGACIÓN
//   //   // ============================================================
//   //   if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar') || lower.includes('retroceder')) {
//   //     console.log('🔙 Login: ejecutando "volver"');
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //     }
//   //     this.voiceService.clearTranscript();
//   //     // this.router.navigate(['/home']);
//   //     this.router.navigateByUrl('/home', { replaceUrl: true });
//   //     return;
//   //   }

//   //   if (lower.includes('privacidad') || lower.includes('política de privacidad') || lower.includes('política')) {
//   //     console.log('🔐 [Login] Ejecutando "privacidad"');
//   //     this.voiceService.clearTranscript();
//   //     this.voiceService.speak('Navegando a política de privacidad');
//   //     this.router.navigate(['/privacy']);
//   //     return;
//   //   }

//   //   if (lower.includes('condiciones') || lower.includes('términos') || lower.includes('términos y condiciones') || lower.includes('condiciones de uso')) {
//   //     console.log('📄 [Login] Ejecutando "condiciones"');
//   //     this.voiceService.clearTranscript();
//   //     this.voiceService.speak('Navegando a términos y condiciones');
//   //     this.router.navigate(['/terms']);
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // DICTADO DIRECTO (si campo vacío)
//   //   // ============================================================
//   //   if (lower === 'usuario' || lower === 'contraseña' || lower === 'clave' || lower === 'password' || lower === 'pass') {
//   //     console.log(`🎤 [Login] Campo "${lower}" detectado`);
//   //     const target = lower === 'usuario' ? 'username' : 'password';
//   //     const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//   //     const control = this.loginForm.get(formControlName);
      
//   //     const shouldStartDictation = (!control?.value || control.value.length === 0) && 
//   //                                 (!this.dictationMode || this.dictationTarget !== target);
      
//   //     if (shouldStartDictation) {
//   //       console.log(`🎤 [Login] Campo "${lower}" vacío, iniciando dictado directo`);
//   //       if (this.dictationMode) {
//   //         this.stopDictation(undefined, true);
//   //       }
//   //       this.startDictation(target, '');
//   //       return;
//   //     } else if (this.dictationMode && this.dictationTarget === target) {
//   //       console.log(`⏭️ [Login] Ya dictando "${target}", ignorando comando`);
//   //       return;
//   //     }
//   //   }

//   //   // ============================================================
//   //   // DEBOUNCE
//   //   // ============================================================
//   //   const now = Date.now();
//   //   if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//   //     console.log(`⏭️ Login: comando duplicado ignorado: "${lower}"`);
//   //     return;
//   //   }
//   //   this.lastProcessedCommand = lower;
//   //   this.lastProcessedTime = now;

//   //   // ============================================================
//   //   // COMANDOS DE ACCIÓN
//   //   // ============================================================
//   //   if (this.synonyms.cancel.some(s => lower.includes(s))) {
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //       this.voiceService.speak('Dictado cancelado');
//   //     }
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // 🔥 COMANDO "LOGIN" - CORREGIDO (valida campos antes de enviar)
//   //   // ============================================================
//   //   if (this.synonyms.login.some(s => lower.includes(s))) {
//   //     console.log('🔐 Login: ejecutando login por voz');
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //     }
      
//   //     // ✅ VERIFICAR QUE EL FORMULARIO TENGA DATOS
//   //     const username = this.usernameOrEmailCtrl.value || '';
//   //     const password = this.passwordCtrl.value || '';
      
//   //     if (!username || username.length < 3) {
//   //       //this.voiceService.speakAlways('Primero escribe tu usuario. Di "usuario" para escribir tu usuario.');
//   //       this.focusInput('username');
//   //       return;
//   //     }
      
//   //     if (!password || password.length < 9) {
//   //       this.voiceService.speakAlways('Primero escribe tu contraseña. Di "contraseña" para escribir tu clave.');
//   //       this.focusInput('password');
//   //       return;
//   //     }
      
//   //     this.onSubmit();
//   //     return;
//   //   }

//   //   if (this.synonyms.readFields.some(s => lower.includes(s))) {
//   //     console.log('📖 [Login] Comando "leer campos" detectado');
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //     }
//   //     this.readFields();
//   //     return;
//   //   }

//   //   if (this.synonyms.status.some(s => lower.includes(s))) {
//   //     console.log('📊 [Login] Comando "estado" detectado');
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //     }
//   //     this.getStatus();
//   //     return;
//   //   }

//   //   if (this.synonyms.clearUsername.some(s => lower.includes(s))) {
//   //     this.clearField('username');
//   //     return;
//   //   }

//   //   if (this.synonyms.clearPassword.some(s => lower.includes(s))) {
//   //     this.clearField('password');
//   //     return;
//   //   }

//   //   if (this.synonyms.clearCurrent.some(s => lower.includes(s))) {
//   //     const focusedField = this.getFocusedField();
//   //     if (focusedField) {
//   //       this.clearField(focusedField);
//   //     } else {
//   //       this.voiceService.speak('No hay ningún campo enfocado. Di "limpiar usuario" o "limpiar contraseña".');
//   //     }
//   //     return;
//   //   }

//   //   if (this.synonyms.clearAll.some(s => lower.includes(s))) {
//   //     this.clearAllFields();
//   //     return;
//   //   }

//   //   if (this.synonyms.help.some(s => lower.includes(s))) {
//   //     this.showHelp();
//   //     return;
//   //   }

//   //   if (this.synonyms.mute.some(s => lower.includes(s))) {
//   //     this.voiceService.mute();
//   //     return;
//   //   }

//   //   if (this.synonyms.unmute.some(s => lower.includes(s))) {
//   //     this.voiceService.unmute();
//   //     return;
//   //   }

//   //   if (this.synonyms.showPassword.some(s => lower.includes(s))) {
//   //     if (this.hidePassword()) {
//   //       this.togglePasswordVisibility();
//   //       this.voiceService.speak('Contraseña visible');
//   //     }
//   //     return;
//   //   }

//   //   if (this.synonyms.hidePassword.some(s => lower.includes(s))) {
//   //     if (!this.hidePassword()) {
//   //       this.togglePasswordVisibility();
//   //       this.voiceService.speak('Contraseña oculta');
//   //     }
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // ✅ MODO DICTADO ACTIVO
//   //   // ============================================================
//   //   if (this.dictationMode && this.dictationTarget) {
//   //     console.log(`🔍 [handleVoiceCommand] Modo dictado activo, llamando a handleDictation: "${lower}"`);
//   //     this.handleDictation(lower);
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // INICIAR DICTADO
//   //   // ============================================================
//   //   if (this.synonyms.dictateUsername.some(s => lower.includes(s))) {
//   //     const afterCommand = lower.replace(/^(usuario|nombre|user|email|correo|escribir usuario|escribe usuario|escribir nombre|escribe nombre)\s*/, '').trim();
//   //     this.startDictation('username', afterCommand);
//   //     return;
//   //   }

//   //   if (this.synonyms.dictatePassword.some(s => lower.includes(s))) {
//   //     const afterCommand = lower.replace(/^(contraseña|clave|pass|password|escribir contraseña|escribe contraseña|escribir clave|escribe clave)\s*/, '').trim();
//   //     this.startDictation('password', afterCommand);
//   //     return;
//   //   }

//   //   if (this.synonyms.register.some(s => lower.includes(s))) {
//   //     console.log('🔍 Login: navegando a registro');
//   //     this.voiceService.speak('Navegando a registro');
//   //     setTimeout(() => {
//   //       this.voiceService.clearTranscript();
//   //     }, 100);
//   //     setTimeout(() => {
//   //       if (!this.isDestroyed) {
//   //         this.router.navigate(['/register']);
//   //       }
//   //     }, 300);
//   //     return;
//   //   }

//   //   if (this.synonyms.forgot.some(s => lower.includes(s))) {
//   //     this.voiceService.clearTranscript();
//   //     this.voiceService.speak('Navegando a recuperar contraseña');
//   //     this.router.navigate(['/forgot-password']);
//   //     return;
//   //   }

//   //   console.log('⏭️ Login - Comando no reconocido, ignorado:', lower);
//   // }







//   private handleVoiceCommand(text: string): void {
//     if (this.isDestroyed) return;
//     const lower = text.toLowerCase().trim();
    
//     console.log(`📝 [handleVoiceCommand] lower: "${lower}"`);

//     // Ignorar números sueltos
//     const isNumeric = /^\d+$/.test(lower) || ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'].some(w => lower === w);
//     if (isNumeric) {
//       console.log('⏭️ Login: número suelto ignorado');
//       return;
//     }

//     // ============================================================
//     // COMANDOS DE NAVEGACIÓN
//     // ============================================================
//     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar') || lower.includes('retroceder')) {
//       console.log('🔙 Login: ejecutando "volver"');
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//       }
//       this.voiceService.clearTranscript();
//       this.router.navigateByUrl('/home', { replaceUrl: true });
//       return;
//     }

//     if (lower.includes('privacidad') || lower.includes('política de privacidad') || lower.includes('política')) {
//       console.log('🔐 [Login] Ejecutando "privacidad"');
//       this.voiceService.clearTranscript();
//       this.voiceService.speak('Navegando a política de privacidad');
//       this.router.navigateByUrl('/privacy', { replaceUrl: true });
//       return;
//     }

//     if (lower.includes('condiciones') || lower.includes('términos') || lower.includes('términos y condiciones') || lower.includes('condiciones de uso')) {
//       console.log('📄 [Login] Ejecutando "condiciones"');
//       this.voiceService.clearTranscript();
//       this.voiceService.speak('Navegando a términos y condiciones');
//       this.router.navigateByUrl('/terms', { replaceUrl: true });
//       return;
//     }

//     // ============================================================
//     // DICTADO DIRECTO (si campo vacío)
//     // ============================================================
//     if (lower === 'usuario' || lower === 'contraseña' || lower === 'clave' || lower === 'password' || lower === 'pass') {
//       console.log(`🎤 [Login] Campo "${lower}" detectado`);
//       const target = lower === 'usuario' ? 'username' : 'password';
//       const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//       const control = this.loginForm.get(formControlName);
      
//       const shouldStartDictation = (!control?.value || control.value.length === 0) && 
//                                   (!this.dictationMode || this.dictationTarget !== target);
      
//       if (shouldStartDictation) {
//         console.log(`🎤 [Login] Campo "${lower}" vacío, iniciando dictado directo`);
//         if (this.dictationMode) {
//           this.stopDictation(undefined, true);
//         }
//         this.startDictation(target, '');
//         return;
//       } else if (this.dictationMode && this.dictationTarget === target) {
//         console.log(`⏭️ [Login] Ya dictando "${target}", ignorando comando`);
//         return;
//       }
//     }

//     // ============================================================
//     // DEBOUNCE
//     // ============================================================
//     const now = Date.now();
//     if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//       console.log(`⏭️ Login: comando duplicado ignorado: "${lower}"`);
//       return;
//     }
//     this.lastProcessedCommand = lower;
//     this.lastProcessedTime = now;

//     // ============================================================
//     // COMANDOS DE ACCIÓN
//     // ============================================================
//     if (this.synonyms.cancel.some(s => lower.includes(s))) {
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//         this.voiceService.speak('Dictado cancelado');
//       }
//       return;
//     }

//     // ============================================================
//     // 🔥 COMANDO "LOGIN" - CORREGIDO (valida campos antes de enviar)
//     // ============================================================
//     if (this.synonyms.login.some(s => lower.includes(s))) {
//       console.log('🔐 Login: ejecutando login por voz');
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//       }
      
//       // ✅ VERIFICAR QUE EL FORMULARIO TENGA DATOS
//       const username = this.usernameOrEmailCtrl.value || '';
//       const password = this.passwordCtrl.value || '';
      
//       if (!username || username.length < 3) {
//         //this.voiceService.speakAlways('Primero escribe tu usuario. Di "usuario" para escribir tu usuario.');
//         this.focusInput('username');
//         return;
//       }
      
//       if (!password || password.length < 9) {
//         this.voiceService.speakAlways('Primero escribe tu contraseña. Di "contraseña" para escribir tu clave.');
//         this.focusInput('password');
//         return;
//       }
      
//       this.onSubmit();
//       return;
//     }

//     if (this.synonyms.readFields.some(s => lower.includes(s))) {
//       console.log('📖 [Login] Comando "leer campos" detectado');
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//       }
//       this.readFields();
//       return;
//     }

//     if (this.synonyms.status.some(s => lower.includes(s))) {
//       console.log('📊 [Login] Comando "estado" detectado');
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//       }
//       this.getStatus();
//       return;
//     }

//     if (this.synonyms.clearUsername.some(s => lower.includes(s))) {
//       this.clearField('username');
//       return;
//     }

//     if (this.synonyms.clearPassword.some(s => lower.includes(s))) {
//       this.clearField('password');
//       return;
//     }

//     if (this.synonyms.clearCurrent.some(s => lower.includes(s))) {
//       const focusedField = this.getFocusedField();
//       if (focusedField) {
//         this.clearField(focusedField);
//       } else {
//         this.voiceService.speak('No hay ningún campo enfocado. Di "limpiar usuario" o "limpiar contraseña".');
//       }
//       return;
//     }

//     if (this.synonyms.clearAll.some(s => lower.includes(s))) {
//       this.clearAllFields();
//       return;
//     }

//     if (this.synonyms.help.some(s => lower.includes(s))) {
//       this.showHelp();
//       return;
//     }

//     if (this.synonyms.mute.some(s => lower.includes(s))) {
//       this.voiceService.mute();
//       return;
//     }

//     if (this.synonyms.unmute.some(s => lower.includes(s))) {
//       this.voiceService.unmute();
//       return;
//     }

//     if (this.synonyms.showPassword.some(s => lower.includes(s))) {
//       if (this.hidePassword()) {
//         this.togglePasswordVisibility();
//         this.voiceService.speak('Contraseña visible');
//       }
//       return;
//     }

//     if (this.synonyms.hidePassword.some(s => lower.includes(s))) {
//       if (!this.hidePassword()) {
//         this.togglePasswordVisibility();
//         this.voiceService.speak('Contraseña oculta');
//       }
//       return;
//     }

//     // ============================================================
//     // ✅ MODO DICTADO ACTIVO
//     // ============================================================
//     if (this.dictationMode && this.dictationTarget) {
//       console.log(`🔍 [handleVoiceCommand] Modo dictado activo, llamando a handleDictation: "${lower}"`);
//       this.handleDictation(lower);
//       return;
//     }

//     // ============================================================
//     // INICIAR DICTADO
//     // ============================================================
//     if (this.synonyms.dictateUsername.some(s => lower.includes(s))) {
//       const afterCommand = lower.replace(/^(usuario|nombre|user|email|correo|escribir usuario|escribe usuario|escribir nombre|escribe nombre)\s*/, '').trim();
//       this.startDictation('username', afterCommand);
//       return;
//     }

//     if (this.synonyms.dictatePassword.some(s => lower.includes(s))) {
//       const afterCommand = lower.replace(/^(contraseña|clave|pass|password|escribir contraseña|escribe contraseña|escribir clave|escribe clave)\s*/, '').trim();
//       this.startDictation('password', afterCommand);
//       return;
//     }

//     if (this.synonyms.register.some(s => lower.includes(s))) {
//       console.log('🔍 Login: navegando a registro');
//       this.voiceService.speak('Navegando a registro');
//       setTimeout(() => {
//         this.voiceService.clearTranscript();
//       }, 100);
//       setTimeout(() => {
//         if (!this.isDestroyed) {
//           this.router.navigateByUrl('/register', { replaceUrl: true });
//         }
//       }, 300);
//       return;
//     }

//     if (this.synonyms.forgot.some(s => lower.includes(s))) {
//       this.voiceService.clearTranscript();
//       this.voiceService.speak('Navegando a recuperar contraseña');
//       this.router.navigateByUrl('/forgot-password', { replaceUrl: true });
//       return;
//     }

//     console.log('⏭️ Login - Comando no reconocido, ignorado:', lower);
//   }














  

//   // ============================================================
//   // HANDLE DICTATION - IGUAL QUE MATERIAL
//   // ============================================================
  
//   private handleDictation(text: string): void {
//     if (this.isDestroyed) return;
//     const target = this.dictationTarget!;
//     const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//     const control = this.loginForm.get(formControlName);
//     if (!control) return;
//     const currentValue = control.value || '';
//     console.log(`🔊 handleDictation: "${text}"`);

//     const shouldCapitalize = target !== 'username';

//     // ✅ IGUAL QUE MATERIAL
//     if (this.voiceFilter.containsFinishWords(text)) {
//       console.log('🔴 Comando de finalización');
//       const cleanText = this.voiceFilter.removeFinishWords(text);
      
//       // ✅ USAR EL TEXTO ACUMULADO (dictationBuffer) EN LUGAR DE currentValue
//       let finalValue = this.dictationBuffer || currentValue;

//       if (cleanText.length > 0) {
//         console.log(`📝 Procesando: "${cleanText}"`);
//         const processed = this.voiceFilter.processDictationPhrase(cleanText, target, shouldCapitalize);
//         if (processed.success) {
//           finalValue = processed.text;
//           this.updateFormAndInputDirectly(target, finalValue);
//           this.dictationBuffer = processed.text.trimEnd();
//           console.log(`🔤 Reemplazado por: "${finalValue}"`);
//         }
//       } else {
//         // ✅ Si no hay texto nuevo, usar el acumulado
//         console.log(`🔤 Usando texto acumulado: "${this.dictationBuffer}"`);
//         if (this.dictationBuffer) {
//           finalValue = this.dictationBuffer;
//           this.updateFormAndInputDirectly(target, finalValue);
//         }
//       }
//       this.stopDictation(finalValue);
//       return;
//     }

//     if (text.includes('borrar') || text.includes('eliminar')) {
//       if (this.dictationBuffer.length > 0) {
//         const newValue = currentValue.slice(0, -this.dictationBuffer.length);
//         this.updateFormAndInputDirectly(target, newValue);
//         this.voiceService.speak(`Borrado: ${this.dictationBuffer.trim()}`);
//         this.dictationBuffer = '';
//         return;
//       } else {
//         const newValue = currentValue.slice(0, -1);
//         this.updateFormAndInputDirectly(target, newValue);
//         this.voiceService.speak('Borrado último carácter');
//         return;
//       }
//     }

//     if (text.includes('limpiar todo') || text.includes('borrar todo')) {
//       this.updateFormAndInputDirectly(target, '');
//       this.dictationBuffer = '';
//       this.voiceService.speak('Campo limpiado');
//       return;
//     }

//     if (text.includes('mostrar') || text.includes('ver') || text.includes('leer')) {
//       this.voiceService.speak(`Texto actual: ${currentValue || 'vacío'}`);
//       return;
//     }

//     // ✅ IGUAL QUE MATERIAL - processDictationPhrase
//     let processed = this.voiceFilter.processDictationPhrase(text, target, shouldCapitalize);
//     if (!processed.success || !processed.text) {
//       const word = text.trim();
//       const cleanWord = word.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
//       let finalWord = cleanWord;
//       if (shouldCapitalize && (currentValue === '' || currentValue.endsWith(' ')) && finalWord.length > 0) {
//         finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
//       }
//       processed = { success: true, text: finalWord + ' ', originalText: text, processedText: finalWord + ' ' } as any;
//       console.log(`🔤 Fallback: "${processed.text}"`);
//     }

//     this.dictationBuffer = processed.text.trimEnd();
//     console.log(`🔤 Texto acumulado (no visible): "${this.dictationBuffer}"`);
//   }

//   // ============================================================
//   // START DICTATION - IGUAL QUE MATERIAL
//   // ============================================================
//   private startDictation(target: 'username' | 'password', initialText = ''): void {
//     if (this.isDestroyed) return;
//     this.dictationMode = true;
//     this.dictationTarget = target;
//     this.dictationBuffer = '';
//     const fieldName = target === 'username' ? 'usuario' : 'contraseña';

//     this.updateFormAndInputDirectly(target, '');

//     if (initialText) {
//       this.updateFormAndInputDirectly(target, initialText);
//       this.dictationBuffer = initialText.trimEnd();
//       this.voiceService.speak(`Dictando ${fieldName}. Texto inicial: ${initialText}`);
//     } else {
//       const finishList = this.voiceFilter.getFinishWords().slice(0, 2).join(' o ');
//       this.voiceService.speak(`Dictando ${fieldName}. Di "${finishList}" para finalizar.`);
//     }

//     this.focusInput(target);
//     console.log(`🎤 Dictado activado para: ${target}`);
//   }

//   // ============================================================
//   // STOP DICTATION - IGUAL QUE MATERIAL
//   // ============================================================
//   private stopDictation(finalValue?: string, silent = false): void {
//     if (this.isDestroyed) return;
//     console.log(`🔴 stopDictation (silent: ${silent})`);
//     const target = this.dictationTarget;
    
//     if (target) {
//       const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//       const control = this.loginForm.get(formControlName);
//       let value = finalValue !== undefined ? finalValue : control?.value || '';
//       value = value.trimEnd();

//       if (value && value.length > 0) {
//         this.updateFormAndInputDirectly(target, value);

//         // ✅ VALIDACIÓN DE USUARIO
//         if (target === 'username') {
//           control?.markAsTouched();
//           control?.updateValueAndValidity();
          
//           if (control?.invalid) {
//             const errors = this.getUsernameErrors();
//             const msg = errors || 'El usuario no es válido. Debe tener al menos 3 caracteres y solo letras, números, . _ @ ! ? - y sin espacios.';
            
//             this.voiceService.speakAlways(`Error: ${msg}. Puedes corregirlo manualmente o decir "usuario" para intentarlo de nuevo.`);
            
//             setTimeout(() => this.focusInput('username'), 500);
            
//             this.dictationMode = false;
//             this.dictationTarget = null;
//             this.dictationBuffer = '';
//             this.cdr.markForCheck();
//             return;
//           } else {
//             if (!silent) {
//               this.voiceService.speakAlways(`Usuario válido. Ahora puedes decir "contraseña".`);
//               setTimeout(() => {
//                 this.focusInput('password');
//               }, 800);
//             }
//           }
//         }

//         // ✅ VALIDACIÓN DE CONTRASEÑA
//         if (target === 'password') {
//           control?.markAsTouched();
//           control?.updateValueAndValidity();
          
//           if (control?.invalid) {
//             const errors = this.getPasswordErrors();
//             const msg = errors || 'La contraseña no cumple los requisitos. Debe tener al menos 9 caracteres, mayúscula, minúscula, número y símbolo.';
            
//             this.voiceService.speakAlways(`Error: ${msg}. Puedes corregirlo manualmente o decir "contraseña" para intentarlo de nuevo.`);
            
//             setTimeout(() => this.focusInput('password'), 500);
            
//             this.dictationMode = false;
//             this.dictationTarget = null;
//             this.dictationBuffer = '';
//             this.cdr.markForCheck();
//             return;
//           } else {
//             if (!silent) {
//               this.voiceService.speakAlways(`Contraseña válida. Di "enviar" para iniciar sesión.`);
//             }
//           }
//         }
//       } else {
//         if (!silent) {
//           const fieldName = target === 'username' ? 'el usuario' : 'la contraseña';
//           this.voiceService.speakAlways(`No se reconoció ${fieldName}. Di "${target === 'username' ? 'usuario' : 'contraseña'}" para intentarlo de nuevo.`);
//         }
//       }

//       if (target === 'username' && !silent) {
//         setTimeout(() => {
//           if (!this.isDestroyed) {
//             this.focusInput('password');
//             this.cdr.markForCheck();
//           }
//         }, 300);
//       }
//     }
    
//     this.dictationMode = false;
//     this.dictationTarget = null;
//     this.dictationBuffer = '';
//     this.cdr.markForCheck();
//   }

//   // ============================================================
//   // MÉTODOS DE UTILIDAD
//   // ============================================================
//   private focusInput(target: 'username' | 'password'): void {
//     if (this.isDestroyed) return;
//     setTimeout(() => {
//       if (!this.isDestroyed) {
//         if (target === 'username') {
//           this.usernameInput?.setFocus();
//         } else {
//           this.passwordInput?.setFocus();
//         }
//         this.cdr.markForCheck();
//       }
//     }, 100);
//   }

//   private getFocusedField(): 'username' | 'password' | null {
//     const activeElement = document.activeElement;
//     const usernameEl = this.usernameInputEl?.nativeElement;
//     const passwordEl = this.passwordInputEl?.nativeElement;
    
//     if (usernameEl === activeElement) return 'username';
//     if (passwordEl === activeElement) return 'password';
//     return null;
//   }

//   // private updateFormAndInputDirectly(target: 'username' | 'password', value: string): void {
//   //   if (this.isDestroyed) return;
    
//   //   const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//   //   const control = this.loginForm.get(formControlName);
//   //   if (!control) {
//   //     console.error(`❌ Control ${formControlName} no encontrado`);
//   //     return;
//   //   }

//   //   control.setValue(value, { emitEvent: true });
//   //   control.markAsDirty();
//   //   control.markAsTouched();

//   //   const inputEl = target === 'username' 
//   //     ? this.usernameInputEl?.nativeElement 
//   //     : this.passwordInputEl?.nativeElement;
      
//   //   if (inputEl) {
//   //     inputEl.value = value;
//   //     this.renderer.setProperty(inputEl, 'value', value);
//   //     inputEl.dispatchEvent(new Event('input', { bubbles: true }));
//   //     inputEl.dispatchEvent(new Event('change', { bubbles: true }));
//   //   }

//   //   control.updateValueAndValidity({ emitEvent: true });
//   //   this.updateSignals();
//   //   this.cdr.markForCheck();
//   //   console.log(`✅ Valor actualizado: "${control.value}"`);
//   // }



//   private updateFormAndInputDirectly(target: 'username' | 'password', value: string): void {
//     if (this.isDestroyed) return;
    
//     // ✅ Trim para password: elimina espacios fantasma del dictado
//     //    (los espacios internos siguen rechazándose por el validador)
//     if (target === 'password') {
//       value = value.trim();
//     }
    
//     const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//     const control = this.loginForm.get(formControlName);
//     if (!control) {
//       console.error(`❌ Control ${formControlName} no encontrado`);
//       return;
//     }

//     control.setValue(value, { emitEvent: true });
//     control.markAsDirty();
//     control.markAsTouched();

//     const inputEl = target === 'username' 
//       ? this.usernameInputEl?.nativeElement 
//       : this.passwordInputEl?.nativeElement;
      
//     if (inputEl) {
//       inputEl.value = value;
//       this.renderer.setProperty(inputEl, 'value', value);
//       inputEl.dispatchEvent(new Event('input', { bubbles: true }));
//       inputEl.dispatchEvent(new Event('change', { bubbles: true }));
//     }

//     control.updateValueAndValidity({ emitEvent: true });
//     this.updateSignals();
//     this.cdr.markForCheck();
//     console.log(`✅ Valor actualizado: "${control.value}"`);
//   }



//   private clearField(target: 'username' | 'password'): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) this.stopDictation(undefined, true);

//     const fieldName = target === 'username' ? 'usuario' : 'contraseña';
//     const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
//     const control = this.loginForm.get(formControlName);
//     if (!control) return;

//     const currentValue = control.value || '';

//     if (!currentValue) {
//       this.voiceService.speak(`El campo ${fieldName} ya está vacío. Di "${fieldName}" para escribir uno nuevo.`);
//       setTimeout(() => {
//         if (!this.isDestroyed) {
//           this.focusInput(target);
//           if (!this.voiceService.isRecognitionActive()) {
//             this.voiceService.startListening();
//           }
//         }
//       }, 800);
//       return;
//     }

//     control.setValue('', { emitEvent: true });
//     control.markAsPristine();
//     control.markAsUntouched();
//     this.errorMessage.set(null);
//     this.dictationBuffer = '';
//     this.updateFormAndInputDirectly(target, '');
//     this.cdr.markForCheck();

//     this.voiceService.speak(`Campo ${fieldName} limpiado. Di "${fieldName}" para escribir uno nuevo.`);

//     setTimeout(() => {
//       if (!this.isDestroyed) {
//         this.focusInput(target);
//         if (!this.voiceService.isRecognitionActive()) {
//           this.voiceService.startListening();
//         }
//       }
//     }, 800);
//   }

//   private clearAllFields(): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) this.stopDictation(undefined, true);
    
//     const username = this.usernameOrEmailCtrl.value || '';
//     const password = this.passwordCtrl.value || '';
    
//     if (!username && !password) {
//       this.voiceService.speak('Los campos ya están vacíos.');
//       this.focusInput('username');
//       return;
//     }
    
//     this.loginForm.patchValue({ usernameOrEmail: '', password: '' });
//     this.loginForm.markAsPristine();
//     this.loginForm.markAsUntouched();
//     this.errorMessage.set(null);
//     this.dictationBuffer = '';
//     this.updateFormAndInputDirectly('username', '');
//     this.updateFormAndInputDirectly('password', '');
//     this.cdr.detectChanges();
//     this.cdr.markForCheck();
    
//     this.voiceService.speak('Todos los campos limpiados.');
//     this.focusInput('username');
//     console.log('🧹 Todos los campos limpiados');
//   }

//   // ============================================================
//   // LEER CAMPOS Y ESTADO
//   // ============================================================
//   private readFields(): void {
//     if (this.isDestroyed) return;
//     const username = this.usernameOrEmailCtrl.value || '(vacío)';
//     const password = this.passwordCtrl.value ? '********' : '(vacío)';
//     const messages = [
//       `Usuario: ${username}`,
//       `Contraseña: ${password}`
//     ];
//     this.speakWithPauses(messages);
//   }

//   private getStatus(): void {
//     if (this.isDestroyed) return;
//     const username = this.usernameOrEmailCtrl.value || '';
//     const password = this.passwordCtrl.value || '';
//     const missingFields = [];
    
//     if (!username || username.trim().length === 0) missingFields.push('usuario');
//     if (!password || password.trim().length === 0) missingFields.push('contraseña');
    
//     if (missingFields.length === 0) {
//       this.voiceService.speak('Todos los campos están completos. Di "enviar" para iniciar sesión, o "leer campos" para comprobar el contenido.');
//     } else {
//       const fieldList = missingFields.map(f => `"${f}"`).join(', ');
//       this.voiceService.speak(`Faltan los campos: ${fieldList}. Di el nombre de uno para editarlo.`);
//     }
//   }

//   private speakWithPauses(messages: string[], pauseMs: number = 500): void {
//     if (this.isDestroyed || messages.length === 0) return;
//     let index = 0;
//     const speakNext = () => {
//       if (this.isDestroyed || index >= messages.length) return;
//       const message = messages[index];
//       this.voiceService.speak(message).then(() => {
//         index++;
//         if (index < messages.length) setTimeout(speakNext, pauseMs);
//       }).catch(() => {
//         index++;
//         setTimeout(speakNext, pauseMs);
//       });
//     };
//     speakNext();
//   }

//   // ============================================================
//   // AYUDA
//   // ============================================================
//   private showHelp(): void {
//     if (this.isDestroyed) return;
//     if (this.voiceService.isCurrentlyMuted()) {
//       this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
//       return;
//     }
//     const helpMessages = [
//       'Puedes decir: "usuario" para escribir tu usuario.',
//       '"contraseña" para tu clave.',
//       '"enviar" para iniciar sesión.',
//       '"limpiar" para borrar los campos.',
//       '"leer campos" para escuchar el contenido.',
//       '"mostrar contraseña" u "ocultar contraseña" para ver u ocultar tu clave.',
//       '"registrar" para crear una cuenta.',
//       '"recuperar" para recuperar tu contraseña.',
//       '"volver" para regresar a la página anterior.',
//       '"silenciar micrófono" para apagar el micrófono.',
//       '"privacidad" para ver la política de privacidad.',
//       '"condiciones" para ver los términos y condiciones.',
//       'o "ayuda" para ver todas las opciones.'
//     ];
//     this.speakWithPauses(helpMessages, 100);
//   }

//   // ============================================================
//   // MÉTODOS DE ERRORES
//   // ============================================================
//   // getUsernameErrors(): string | null {
//   //   const ctrl = this.usernameOrEmailCtrl;
//   //   if (!ctrl.dirty && !ctrl.touched) return null;
//   //   if (ctrl.hasError('required')) return 'El usuario o correo es obligatorio';
//   //   if (ctrl.hasError('minlength')) return 'Debe tener al menos 3 caracteres';
//   //   return null;
//   // }

//   // getPasswordErrors(): string | null {
//   //   const ctrl = this.passwordCtrl;
//   //   if (!ctrl.dirty && !ctrl.touched) return null;
//   //   if (ctrl.hasError('required')) return 'La contraseña es obligatoria';
//   //   if (ctrl.hasError('minlength')) return 'Debe tener al menos 9 caracteres';
//   //   return null;
//   // }

//   getUsernameErrors(): string | null {
//     const ctrl = this.usernameOrEmailCtrl;
//     if (!ctrl.dirty && !ctrl.touched) return null;
//     if (!ctrl.errors) return null;
//     return getErrorMessage(ctrl.errors, 'El usuario');
//   }

//   getPasswordErrors(): string | null {
//     const ctrl = this.passwordCtrl;
//     if (!ctrl.dirty && !ctrl.touched) return null;
//     if (!ctrl.errors) return null;
//     return getErrorMessage(ctrl.errors, 'La contraseña');
//   }

//   // ============================================================
//   // MÉTODOS DE UI
//   // ============================================================
//   togglePasswordVisibility(): void {
//     this.hidePassword.update(value => !value);
//     this.cdr.markForCheck();
//   }

//   onUsernameBlur(): void {
//     const value = this.usernameOrEmailCtrl.value;
//     if (value) {
//       const trimmed = value.trim();
//       if (trimmed !== value) {
//         this.usernameOrEmailCtrl.setValue(trimmed);
//       }
//       this.usernameOrEmailCtrl.updateValueAndValidity();
//     }
//     this.updateSignals();
//   }

//   // onPasswordBlur(): void {
//   //   const value = this.passwordCtrl.value;
//   //   if (value) {
//   //     this.passwordCtrl.updateValueAndValidity();
//   //   }
//   //   this.updateSignals();
//   // }


//   onPasswordBlur(): void {
//     const value = this.passwordCtrl.value;
//     if (value) {
//       const trimmed = value.trim();
//       if (trimmed !== value) {
//         this.passwordCtrl.setValue(trimmed);
//       }
//       this.passwordCtrl.updateValueAndValidity();
//     }
//     this.updateSignals();
//   }


//   // ============================================================
//   // MÉTODOS DE ACCIÓN DEL ORCHESTRATOR
//   // ============================================================
//   // private handleAction(response: any): void {
//   //   if (this.isDestroyed) return;
//   //   const action = response.action;
//   //   if (!action) return;
//   //   console.log(`🎯 Acción recibida: ${action.type}`, action.payload);
//   //   switch (action.type) {
//   //     case 'navigate':
//   //       const route = action.payload?.['route'];
//   //       if (route) this.router.navigate([route]);
//   //       break;
//   //     case 'login':
//   //       this.onSubmit();
//   //       break;
//   //     case 'input':
//   //       if (action.payload?.['field'] && action.payload?.['value']) {
//   //         this.updateFormAndInputDirectly(
//   //           action.payload['field'] as 'username' | 'password', 
//   //           action.payload['value'] as string
//   //         );
//   //       }
//   //       break;
//   //     case 'clear':
//   //       this.clearAllFields();
//   //       break;
//   //     default:
//   //       console.log('Acción no reconocida:', action.type);
//   //   }
//   // }



//   private handleAction(response: any): void {
//     if (this.isDestroyed) return;
//     const action = response.action;
//     if (!action) return;
//     console.log(`🎯 Acción recibida: ${action.type}`, action.payload);
//     switch (action.type) {
//       case 'navigate':
//         const route = action.payload?.['route'];
//         if (route) this.router.navigateByUrl(route, { replaceUrl: true });  // ✅ CAMBIO
//         break;
//       case 'login':
//         this.onSubmit();
//         break;
//       case 'input':
//         if (action.payload?.['field'] && action.payload?.['value']) {
//           this.updateFormAndInputDirectly(
//             action.payload['field'] as 'username' | 'password', 
//             action.payload['value'] as string
//           );
//         }
//         break;
//       case 'clear':
//         this.clearAllFields();
//         break;
//       default:
//         console.log('Acción no reconocida:', action.type);
//     }
//   }


//   // ============================================================
//   // SUBMIT
//   // // ============================================================
//   // onSubmit(): void {
//   //   if (this.isDestroyed) return;
//   //   if (this.dictationMode) this.stopDictation(undefined, true);

//   //   if (this.loginForm.invalid || this.isLoading()) {
//   //     this.loginForm.markAllAsTouched();
//   //     let errorMsg = 'El formulario tiene errores. ';
//   //     if (this.usernameOrEmailCtrl.invalid) {
//   //       errorMsg += 'El usuario es obligatorio y debe tener al menos 3 caracteres. ';
//   //     }
//   //     if (this.passwordCtrl.invalid) {
//   //       errorMsg += 'La contraseña es obligatoria y debe tener al menos 9 caracteres. ';
//   //     }
//   //     this.errorMessage.set(errorMsg);
//   //     this.showError.set(true);
//   //     this.voiceService.speakAlways(errorMsg);
//   //     if (this.usernameOrEmailCtrl.invalid) {
//   //       setTimeout(() => this.focusInput('username'), 500);
//   //     } else if (this.passwordCtrl.invalid) {
//   //       setTimeout(() => this.focusInput('password'), 500);
//   //     }
//   //     this.cdr.markForCheck();
//   //     return;
//   //   }

//   //   this.isLoading.set(true);
//   //   this.errorMessage.set(null);
//   //   this.showError.set(false);
//   //   this.cdr.markForCheck();

//   //   const credentials: LoginRequest = {
//   //     usernameOrEmail: this.usernameOrEmailCtrl.value || '',
//   //     password: this.passwordCtrl.value || ''
//   //   };

//   //   this.authService.login(credentials)
//   //     .pipe(finalize(() => {
//   //       if (!this.isDestroyed) {
//   //         this.isLoading.set(false);
//   //         this.cdr.markForCheck();
//   //       }
//   //     }))
//   //     .subscribe({
//   //       next: () => {
//   //         if (!this.isDestroyed) {
//   //           console.log('✅ Login exitoso');
//   //           this.voiceService.clearTranscript();
//   //           this.voiceService.speak('¡Bienvenido!');
//   //           this.router.navigate(['/dashboard']);
//   //         }
//   //       },
//   //       error: (err) => {
//   //         if (!this.isDestroyed) {
//   //           console.error('Error en login:', err);
//   //           let msg = 'Error al iniciar sesión. ';
//   //           if (err.status === 401 || err.status === 403) {
//   //             msg = 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
//   //           } else if (err.status === 0) {
//   //             msg = 'Error de conexión. Verifica tu conexión a internet.';
//   //           } else if (err.status === 404) {
//   //             msg = 'Usuario no encontrado. Verifica tus credenciales.';
//   //           } else if (err.status === 500) {
//   //             msg = 'Error en el servidor. Intenta más tarde.';
//   //           } else {
//   //             msg = err.message || 'Error inesperado. Intenta de nuevo.';
//   //           }
//   //           this.errorMessage.set(msg);
//   //           this.showError.set(true);
//   //           this.voiceService.speakAlways(msg);
//   //           this.focusInput('username');
//   //           this.cdr.markForCheck();
//   //         }
//   //       }
//   //     });
//   // }




//   onSubmit(): void {
//   if (this.isDestroyed) return;
//   if (this.dictationMode) this.stopDictation(undefined, true);

//   if (this.loginForm.invalid || this.isLoading()) {
//     this.loginForm.markAllAsTouched();
//     let errorMsg = 'El formulario tiene errores. ';
//     if (this.usernameOrEmailCtrl.invalid) {
//       errorMsg += 'El usuario es obligatorio y debe tener al menos 3 caracteres. ';
//     }
//     if (this.passwordCtrl.invalid) {
//       errorMsg += 'La contraseña es obligatoria y debe tener al menos 9 caracteres. ';
//     }
//     this.errorMessage.set(errorMsg);
//     this.showError.set(true);
//     this.voiceService.speakAlways(errorMsg);
//     if (this.usernameOrEmailCtrl.invalid) {
//       setTimeout(() => this.focusInput('username'), 500);
//     } else if (this.passwordCtrl.invalid) {
//       setTimeout(() => this.focusInput('password'), 500);
//     }
//     this.cdr.markForCheck();
//     return;
//   }

//   this.isLoading.set(true);
//   this.errorMessage.set(null);
//   this.showError.set(false);
//   this.cdr.markForCheck();

//   const credentials: LoginRequest = {
//     usernameOrEmail: this.usernameOrEmailCtrl.value || '',
//     password: this.passwordCtrl.value || ''
//   };

//   this.authService.login(credentials)
//     .pipe(finalize(() => {
//       if (!this.isDestroyed) {
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       }
//     }))
//     .subscribe({
//       next: () => {
//         if (!this.isDestroyed) {
//           console.log('✅ Login exitoso');
//           this.voiceService.clearTranscript();
//           this.voiceService.speak('¡Bienvenido!');
//           this.router.navigateByUrl('/dashboard', { replaceUrl: true });  // ✅ CAMBIO
//         }
//       },
//       error: (err) => {
//         if (!this.isDestroyed) {
//           console.error('Error en login:', err);
//           let msg = 'Error al iniciar sesión. ';
//           if (err.status === 401 || err.status === 403) {
//             msg = 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
//           } else if (err.status === 0) {
//             msg = 'Error de conexión. Verifica tu conexión a internet.';
//           } else if (err.status === 404) {
//             msg = 'Usuario no encontrado. Verifica tus credenciales.';
//           } else if (err.status === 500) {
//             msg = 'Error en el servidor. Intenta más tarde.';
//           } else {
//             msg = err.message || 'Error inesperado. Intenta de nuevo.';
//           }
//           this.errorMessage.set(msg);
//           this.showError.set(true);
//           this.voiceService.speakAlways(msg);
//           this.focusInput('username');
//           this.cdr.markForCheck();
//         }
//       }
//     });
//   }




//   // ============================================================
//   // MÉTODOS DE NAVEGACIÓN
//   // ============================================================
//   // goToRegister(): void {
//   //   this.router.navigate(['/register']);
//   // }

//   // goToForgotPassword(): void {
//   //   this.router.navigate(['/forgot-password']);
//   // }

//   // goBack(): void {
//   //   this.router.navigate(['/home']);
//   // }

//   goToRegister(): void {
//     this.router.navigateByUrl('/register', { replaceUrl: true });
//   }

//   goToForgotPassword(): void {
//     this.router.navigateByUrl('/forgot-password', { replaceUrl: true });
//   }

//   goBack(): void {
//     this.router.navigateByUrl('/home', { replaceUrl: true });
//   }
// }








// src/app/features/auth/components/login/login.component.ts

import { 
  Component, 
  signal, 
  inject, 
  OnDestroy, 
  OnInit, 
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, NavigationEnd  } from '@angular/router';
import { finalize, Subject, takeUntil, filter } from 'rxjs';
import { passwordValidator, usernameValidator, getErrorMessage } from '../../../../shared/validators/validators';

import { 
  IonContent, 
  IonButton, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonIcon,
  IonCheckbox,
  IonText,
  IonSpinner} from '@ionic/angular';

import { LoginRequest } from '../../models/LoginRequest';
import { addIcons } from 'ionicons';
import { 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline, 
  logInOutline,
  arrowBackOutline,
  personOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  informationCircleOutline,
  keyOutline,
  shieldOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { AuthService } from '../../Services/auth-service';
import { VoiceContextService } from '../../../services/voz/voice-context.service';
import { FieldCleanupService } from '../../../services/voz/field-cleanup.service';
import { VoiceCommandHandlerService } from '../../../services/voz/voice-command-handler.service';
import { VoiceCommandOrchestratorService } from '../../../services/voz/voice-command-orchestrator.service';
import { VoiceFilterService } from '../../../services/voz/voice-filter.service';
import { VoiceService } from '../../../services/voz/voice.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonIcon,
    IonCheckbox,
    IonText,
    IonSpinner
  ],
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);
  private voiceService = inject(VoiceService);
  private voiceContext = inject(VoiceContextService);
  private voiceFilter = inject(VoiceFilterService);
  private voiceHandler = inject(VoiceCommandHandlerService);
  private orchestrator = inject(VoiceCommandOrchestratorService);
  private fieldCleanup = inject(FieldCleanupService);

  private destroy$ = new Subject<void>();
  private lastProcessedCommand = '';
  private lastProcessedTime = 0;
  private readonly COMMAND_DEBOUNCE = 2000;
  private isDestroyed = false;
  private welcomeTimeout: any = null;


  @ViewChild('usernameInput') usernameInput!: IonInput;
  @ViewChild('passwordInput') passwordInput!: IonInput;
  @ViewChild('usernameInputEl', { read: ElementRef }) usernameInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInputEl', { read: ElementRef }) passwordInputEl!: ElementRef<HTMLInputElement>;

  loginForm = this.fb.nonNullable.group({
    usernameOrEmail: ['', [Validators.required, usernameValidator()]],
    password: ['', [Validators.required, passwordValidator(9)]],
    rememberMe: [false]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showError = signal<boolean>(false);
  hidePassword = signal<boolean>(true);
  isProcessing = signal<boolean>(false);
  isListening = signal<boolean>(false);
  lastReply = signal<string>('');

  usernameLength = signal<number>(0);
  passwordLength = signal<number>(0);
  isUsernameValid = signal<boolean>(false);
  isPasswordValid = signal<boolean>(false);
  passwordStrength = signal<number>(0);
  passwordStrengthText = signal<string>('');
  passwordStrengthColor = signal<string>('medium');

  private welcomeShown = false;
  private dictationMode = false;
  private dictationTarget: 'username' | 'password' | null = null;
  private dictationBuffer = '';

  // ✅ NUEVO: estado de la ayuda fragmentada
  private helpInProgress = false;
  private helpCurrentIndex = 0;
  private helpBlocks: string[] = [];
  private helpCancelled = false;

  // private readonly WELCOME_MESSAGE = 'Bienvenido a inicio de sesión. Di "usuario", "contraseña", "enviar", "limpiar campos", "leer campos", "volver", o "ayuda" para más opciones.';
  private readonly WELCOME_MESSAGE = 'Inicio de sesión. Di "usuario" o "ayuda para mas comandos".';

  get usernameOrEmailCtrl() { return this.loginForm.controls.usernameOrEmail; }
  get passwordCtrl() { return this.loginForm.controls.password; }

  // private readonly synonyms = {
  //   dictateUsername: ['usuario', 'escribir usuario', 'escribe usuario', 'nombre', 'escribir nombre', 'escribe nombre', 'user', 'email', 'correo'],
  //   dictatePassword: ['contraseña', 'clave', 'escribir contraseña', 'escribe contraseña', 'escribir clave', 'escribe clave', 'password', 'pass'],
  //   finish: ['fin', 'listo', 'terminar', 'finalizar', 'ok', 'vale', 'hecho', 'completar'],
  //   back: ['volver', 'atrás', 'regresar', 'retroceder', 'cancelar'],
  //   login: ['enviar', 'logear', 'acceder', 'entrar', 'iniciar sesión', 'login', 'ingresar', 'acceder al sistema'],
  //   mute: ['silenciar micrófono', 'dejar de escuchar', 'silenciar', 'mute', 'apagar micrófono'],
  //   unmute: ['activar micrófono', 'encender micrófono', 'desmutear', 'unmute', 'escuchar'],
  //   showPassword: ['mostrar contraseña', 'ver contraseña', 'mostrar clave', 'ver clave'],
  //   hidePassword: ['ocultar contraseña', 'ocultar clave', 'esconder contraseña'],
  //   help: ['ayuda', 'qué puedo decir', 'opciones', 'comandos', 'ayúdame'],
  //   clearUsername: ['limpiar usuario', 'borrar usuario', 'limpiar nombre', 'borrar nombre', 'limpiar nombre de usuario'],
  //   clearPassword: ['limpiar contraseña', 'borrar contraseña', 'limpiar clave', 'borrar clave'],
  //   clearCurrent: ['limpiar campo', 'borrar campo', 'limpiar este campo', 'borrar este campo'],
  //   clearAll: ['limpiar campos', 'limpiar todo', 'borrar todo', 'resetear', 'empezar de cero', 'borrar campos'],
  //   cancel: ['cancelar', 'cancel', 'abortar'],
  //   register: ['registro', 'registrar', 'crear cuenta', 'registrarme', 'nueva cuenta'],
  //   forgot: ['olvidé', 'recuperar', 'recuperar contraseña', 'olvide contraseña', 'recuperar clave'],
  //   privacy: ['privacidad', 'política de privacidad', 'política'],
  //   terms: ['condiciones', 'términos', 'términos y condiciones', 'condiciones de uso'],
  //   readFields: ['leer campos', 'leer', 'leer todo', 'qué tengo', 'qué hay', 'mostrar campos', 'qué he escrito', 'revisar campos'],
  //   status: ['estado', 'qué falta', 'campos pendientes', 'falta algo']
  // };


    private readonly synonyms = {
      dictateUsername: ['usuario', 'escribir usuario', 'escribe usuario', 'nombre', 'escribir nombre', 'escribe nombre', 'user', 'email', 'correo'],
      dictatePassword: ['contraseña', 'clave', 'escribir contraseña', 'escribe contraseña', 'escribir clave', 'escribe clave', 'password', 'pass'],
      finish: ['fin', 'listo', 'terminar', 'finalizar', 'ok', 'vale', 'hecho', 'completar'],
      back: ['volver', 'vuelve', 'atrás', 'regresar', 'retroceder', 'cancelar'],
      login: ['enviar', 'envia', 'logear', 'acceder', 'entrar', 'iniciar sesión', 'login', 'ingresar', 'acceder al sistema'],
      mute: ['silenciar micrófono', 'dejar de escuchar', 'silenciar', 'mute', 'apagar micrófono'],
      unmute: ['activar micrófono', 'encender micrófono', 'desmutear', 'unmute', 'escuchar'],
      showPassword: ['mostrar contraseña', 'ver contraseña', 'mostrar clave', 'ver clave'],
      hidePassword: ['ocultar contraseña', 'ocultar clave', 'esconder contraseña'],
      help: ['ayuda', 'qué puedo decir', 'opciones', 'comandos', 'ayúdame'],
      clearUsername: ['limpiar usuario', 'borrar usuario', 'limpiar nombre', 'borrar nombre', 'limpiar nombre de usuario'],
      clearPassword: ['limpiar contraseña', 'borrar contraseña', 'limpiar clave', 'borrar clave'],
      clearCurrent: ['limpiar campo', 'borrar campo', 'limpiar este campo', 'borrar este campo'],
      clearAll: ['limpiar campos', 'limpiar todo', 'borrar todo', 'resetear', 'empezar de cero', 'borrar campos'],
      cancel: ['cancelar', 'cancel', 'abortar'],
      register: ['registro', 'registrar', 'registra', 'crear cuenta', 'registrarme', 'nueva cuenta'],
      forgot: ['olvidé', 'recuperar', 'recupera', 'recuperar contraseña', 'olvide contraseña', 'recuperar clave'],
      privacy: ['privacidad', 'política de privacidad', 'política'],
      terms: ['condiciones', 'términos', 'términos y condiciones', 'condiciones de uso'],
      readFields: ['leer campos', 'leer', 'leer todo', 'qué tengo', 'qué hay', 'mostrar campos', 'qué he escrito', 'revisar campos'],
      status: ['estado', 'qué falta', 'campos pendientes', 'falta algo']
  };

  private calculatePasswordStrength(password: string): number {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 9) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;   // ← añade esta
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;  // ahora va de 0 a 5
  }

  private getPasswordStrengthText(strength: number): string {
    if (strength === 0) return 'Muy débil';
    if (strength === 1) return 'Débil';
    if (strength === 2) return 'Media';
    if (strength === 3) return 'Fuerte';
    if (strength === 4) return 'Muy fuerte';
    return '';
  }

  private getPasswordStrengthColor(strength: number): string {
    if (strength === 0) return 'danger';
    if (strength === 1) return 'warning';
    if (strength === 2) return 'medium';
    if (strength === 3) return 'success';
    if (strength === 4) return 'success';
    return 'medium';
  }

  getPasswordRequirementsStatus(): { label: string; met: boolean }[] {
    const ctrl = this.passwordCtrl;
    const errors = ctrl.errors || {};
    const value = ctrl.value || '';
    const isEmpty = value.length === 0;

    return [
      { label: 'Mínimo 9 caracteres', met: !isEmpty && !errors['minlength'] },
      { label: 'Al menos 1 mayúscula', met: !isEmpty && !errors['missingUppercase'] },
      { label: 'Al menos 1 minúscula', met: !isEmpty && !errors['missingLowercase'] },
      { label: 'Al menos 1 número', met: !isEmpty && !errors['missingNumber'] },
      { label: 'Al menos 1 carácter especial', met: !isEmpty && !errors['missingSpecialChar'] }
    ];
  }

  updateSignals(): void {
    const username = this.usernameOrEmailCtrl.value || '';
    const password = this.passwordCtrl.value || '';
    
    this.usernameLength.set(username.length);
    this.passwordLength.set(password.length);
    
    this.isUsernameValid.set(this.usernameOrEmailCtrl.valid && username.length > 0);
    
    const strength = this.calculatePasswordStrength(password);
    this.passwordStrength.set(strength);
    
    this.isPasswordValid.set(this.passwordCtrl.valid && password.length > 0);
    
    this.passwordStrengthText.set(this.getPasswordStrengthText(strength));
    this.passwordStrengthColor.set(this.getPasswordStrengthColor(strength));
  }

  constructor() {
    addIcons({ 
      mailOutline, 
      lockClosedOutline, 
      eyeOutline, 
      eyeOffOutline, 
      logInOutline,
      arrowBackOutline,
      personOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      informationCircleOutline,
      keyOutline,
      shieldOutline,
      checkmarkOutline
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.updateSignals();
    });
  }

  //
  ngOnInit(): void {
    const t0 = performance.now();
    console.log('⏱️ LoginComponent ngOnInit inicio:', t0);

    console.log('✅ LoginComponent inicializado');

    this.voiceContext.setContext({
      activationMessage: this.WELCOME_MESSAGE,
      availableCommands: [
        'usuario', 'contraseña', 'enviar', 'limpiar', 'mostrar contraseña',
        'ocultar contraseña', 'registro', 'recuperar', 'volver',
        'silenciar micrófono', 'ayuda', 'leer campos',
        'privacidad', 'condiciones'
      ],
      preventBackend: true
    });

    this.voiceService.getTranscript()
      .pipe(takeUntil(this.destroy$))
      .subscribe((text: string) => {
        this.ngZone.run(() => {
          if (this.isDestroyed) return;
          if (text && text.trim().length >= 1 && /[a-záéíóú]/.test(text)) {
            this.handleVoiceCommand(text);
          }
        });
      });

    // Navegaciones → aplicar foco al entrar a /login
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        if (url === '/login' || url.startsWith('/login?')) {
          console.log('🎯 [Login] Navegación a /login detectada');
          this.focusFirstInput();
        }
      });

    // Foco en primera carga
    setTimeout(() => {
      if (this.router.url === '/login' || this.router.url.startsWith('/login?')) {
        this.focusFirstInput();
      }
    }, 800);

    this.orchestrator.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.ngZone.run(() => {
          if (this.isDestroyed) return;
          this.isProcessing.set(status === 'processing' || status === 'listening');
          this.cdr.markForCheck();
        });
      });

    this.orchestrator.response$
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        this.ngZone.run(() => {
          if (this.isDestroyed || !response) return;
          this.lastReply.set(response.reply);
          if (!response.audioBase64) {
            this.voiceService.speak(response.reply);
          }
          this.handleAction(response);
          this.cdr.markForCheck();
        });
      });

    this.orchestrator.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((err) => {
        this.ngZone.run(() => {
          if (this.isDestroyed || !err) return;
          console.error('Error en orchestrator:', err);
          this.errorMessage.set(err);
          this.cdr.markForCheck();
        });
      });

    this.voiceService.getMutedState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((muted) => {
        this.ngZone.run(() => {
          if (this.isDestroyed) return;
          this.isListening.set(!muted);
          this.cdr.markForCheck();
        });
      });

    this.registerFieldsForCleanup();
    this.updateSignals();

    // ============================================================
    // ✅ BIENVENIDA + MICRÓFONO ENCADENADOS (una sola secuencia)
    // ============================================================
    this.welcomeTimeout = setTimeout(() => {
      if (this.isDestroyed) return;

      const isMuted = this.voiceService.isCurrentlyMuted();

      // Si está muteado, no hablamos, pero arrancamos micro igual
      if (isMuted) {
        console.log('🔇 [Login] Micrófono muteado, bienvenida omitida');
        if (!this.voiceService.isRecognitionActive()) {
          this.voiceService.startListening();
        }
        return;
      }

      if (this.welcomeShown) {
        // Ya se mostró antes → solo garantizar micro activo
        if (!this.voiceService.isRecognitionActive()) {
          this.voiceService.startListening();
        }
        return;
      }

      this.welcomeShown = true;

      console.log('🗣️ [Login] Iniciando bienvenida encadenada con micro');

      // this.voiceService.speakAlways(this.WELCOME_MESSAGE)
      this.voiceService.speakAlways(this.WELCOME_MESSAGE, true)
        .then(() => {
          if (this.isDestroyed) return;
          // Pequeño delay para que el recognizer no capture el eco del TTS
          setTimeout(() => {
            if (this.isDestroyed) return;
            if (!this.voiceService.isRecognitionActive()) {
              console.log('🎤 [Login] Bienvenida terminada → arrancando micro');
              this.voiceService.startListening();
            }
          }, 400);
        })
        .catch((err) => {
          console.warn('⚠️ [Login] speakAlways falló, arrancando micro igualmente', err);
          if (this.isDestroyed) return;
          if (!this.voiceService.isRecognitionActive()) {
            this.voiceService.startListening();
          }
        });
    }, 1200);

    console.log('⏱️ LoginComponent ngOnInit fin:', performance.now() - t0);
  }

  //
  private focusFirstInput(): void {
    console.log('🎯 [Login] focusFirstInput() llamado');

    setTimeout(() => {
      if (this.isDestroyed) return;

      this.cdr.detectChanges();

      if (this.usernameInput) {
        this.usernameInput.setFocus()
          .then(() => console.log('🎯 [Login] ✅ Foco aplicado en usernameInput'))
          .catch(err => {
            console.warn('🎯 [Login] ⚠️ Falló setFocus, intentando fallback', err);
            this.focusByQuerySelector();
          });
      } else {
        console.log('🎯 [Login] usernameInput NO disponible, usando fallback');
        this.focusByQuerySelector();
      }
    }, 600);
  }

  private focusByQuerySelector(): void {
    const inputEl = document.querySelector('ion-input[formControlName="usernameOrEmail"]') as any;
    if (inputEl && inputEl.setFocus) {
      inputEl.setFocus();
      console.log('🎯 [Login] ✅ Foco aplicado por querySelector');
    } else {
      console.warn('🎯 [Login] ⚠️ No se pudo aplicar el foco');
    }
  }

  //
  ngAfterViewInit(): void {
    this.setupFocusListeners();
    this.updateSignals();
  }

  ngOnDestroy(): void {
    console.log('🧹 LoginComponent - Iniciando limpieza');
    this.isDestroyed = true;

    // ✅ Detener ayuda en curso 
    this.helpCancelled = true;
    this.helpInProgress = false;
    this.voiceService.setSuppressStopWords(false); 
    window.speechSynthesis.cancel();

    if (this.welcomeTimeout) {
      clearTimeout(this.welcomeTimeout);
      this.welcomeTimeout = null;
    }

    this.voiceContext.resetContext();
    this.destroy$.next();
    this.destroy$.complete();
    this.fieldCleanup.unregisterField('username');
    this.fieldCleanup.unregisterField('password');
    this.dictationMode = false;
    this.dictationTarget = null;
    this.dictationBuffer = '';
    console.log('🧹 LoginComponent destruido');
  }

  private registerFieldsForCleanup(): void {
    this.fieldCleanup.registerField({
      name: 'username',
      label: 'usuario',
      isFocused: false,
      clear: () => this.clearField('username'),
      isEmpty: () => !this.loginForm.get('usernameOrEmail')?.value
    });

    this.fieldCleanup.registerField({
      name: 'password',
      label: 'contraseña',
      isFocused: false,
      clear: () => this.clearField('password'),
      isEmpty: () => !this.loginForm.get('password')?.value
    });
  }

  private setupFocusListeners(): void {
    const usernameEl = this.usernameInputEl?.nativeElement;
    const passwordEl = this.passwordInputEl?.nativeElement;

    if (usernameEl) {
      this.renderer.listen(usernameEl, 'focus', () => {
        this.fieldCleanup.registerField({
          name: 'username',
          label: 'usuario',
          isFocused: true,
          clear: () => this.clearField('username'),
          isEmpty: () => !this.loginForm.get('usernameOrEmail')?.value
        });
      });
      this.renderer.listen(usernameEl, 'blur', () => {
        this.fieldCleanup.registerField({
          name: 'username',
          label: 'usuario',
          isFocused: false,
          clear: () => this.clearField('username'),
          isEmpty: () => !this.loginForm.get('usernameOrEmail')?.value
        });
      });
    }

    if (passwordEl) {
      this.renderer.listen(passwordEl, 'focus', () => {
        this.fieldCleanup.registerField({
          name: 'password',
          label: 'contraseña',
          isFocused: true,
          clear: () => this.clearField('password'),
          isEmpty: () => !this.loginForm.get('password')?.value
        });
      });
      this.renderer.listen(passwordEl, 'blur', () => {
        this.fieldCleanup.registerField({
          name: 'password',
          label: 'contraseña',
          isFocused: false,
          clear: () => this.clearField('password'),
          isEmpty: () => !this.loginForm.get('password')?.value
        });
      });
    }
  }

  private showWelcomeMessage(): void {
    if (this.welcomeShown || this.isDestroyed) return;
    this.welcomeShown = true;

    const isMuted = this.voiceService.isCurrentlyMuted();
    
    if (!isMuted) {
      this.welcomeTimeout = setTimeout(() => {
        if (!this.isDestroyed) {
          this.voiceService.speakAlways(this.WELCOME_MESSAGE);
        }
      }, 1500);
    } else {
      console.log('🔇 [Login] Micrófono muteado, mensaje de bienvenida omitido');
    }
  }

  //
  // private handleVoiceCommand(text: string): void {
  //   if (this.isDestroyed) return;
  //   const lower = text.toLowerCase().trim();
    
  //   console.log(`📝 [handleVoiceCommand] lower: "${lower}"`);

  //   // Ignorar números sueltos
  //   const isNumeric = /^\d+$/.test(lower) || ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'].some(w => lower === w);
  //   if (isNumeric) {
  //     console.log('⏭️ Login: número suelto ignorado');
  //     return;
  //   }

  //   // ✅ DEBOUNCE AL PRINCIPIO: filtra duplicados antes de cualquier comando
  //   const now = Date.now();
  //   if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
  //     console.log(`⏭️ Login: comando duplicado ignorado: "${lower}"`);
  //     return;
  //   }
  //   this.lastProcessedCommand = lower;
  //   this.lastProcessedTime = now;

  //   // ============================================================
  //   // COMANDOS DE NAVEGACIÓN
  //   // ============================================================
  //   if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar') || lower.includes('retroceder')) {
  //     console.log('🔙 Login: ejecutando "volver"');
  //     if (this.dictationMode) {
  //       this.stopDictation(undefined, true);
  //     }
  //     this.voiceService.clearTranscript();
  //     this.router.navigateByUrl('/home', { replaceUrl: true });
  //     return;
  //   }

  //   if (lower.includes('privacidad') || lower.includes('política de privacidad') || lower.includes('política')) {
  //     console.log('🔐 [Login] Ejecutando "privacidad"');
  //     this.voiceService.clearTranscript();
  //     this.voiceService.speak('Navegando a política de privacidad');
  //     this.router.navigateByUrl('/privacy', { replaceUrl: true });
  //     return;
  //   }

  //   if (lower.includes('condiciones') || lower.includes('términos') || lower.includes('términos y condiciones') || lower.includes('condiciones de uso')) {
  //     console.log('📄 [Login] Ejecutando "condiciones"');
  //     this.voiceService.clearTranscript();
  //     this.voiceService.speak('Navegando a términos y condiciones');
  //     this.router.navigateByUrl('/terms', { replaceUrl: true });
  //     return;
  //   }

  //   // ============================================================
  //   // DICTADO DIRECTO (si campo vacío)
  //   // ============================================================
  //   if (lower === 'usuario' || lower === 'contraseña' || lower === 'clave' || lower === 'password' || lower === 'pass') {
  //     console.log(`🎤 [Login] Campo "${lower}" detectado`);
  //     const target = lower === 'usuario' ? 'username' : 'password';
  //     const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
  //     const control = this.loginForm.get(formControlName);
      
  //     const shouldStartDictation = (!control?.value || control.value.length === 0) && 
  //                                 (!this.dictationMode || this.dictationTarget !== target);
      
  //     if (shouldStartDictation) {
  //       console.log(`🎤 [Login] Campo "${lower}" vacío, iniciando dictado directo`);
  //       if (this.dictationMode) {
  //         this.stopDictation(undefined, true);
  //       }
  //       this.startDictation(target, '');
  //       return;
  //     } else if (this.dictationMode && this.dictationTarget === target) {
  //       console.log(`⏭️ [Login] Ya dictando "${target}", ignorando comando`);
  //       return;
  //     }
  //   }

  //   // ============================================================
  //   // COMANDOS DE ACCIÓN
  //   // ============================================================
  //   if (this.synonyms.cancel.some(s => lower.includes(s))) {
  //     if (this.dictationMode) {
  //       this.stopDictation(undefined, true);
  //       this.voiceService.speak('Dictado cancelado');
  //     }
  //     return;
  //   }

  //   if (this.synonyms.login.some(s => lower.includes(s))) {
  //     console.log('🔐 Login: ejecutando login por voz');
  //     if (this.dictationMode) {
  //       this.stopDictation(undefined, true);
  //     }
      
  //     const username = this.usernameOrEmailCtrl.value || '';
  //     const password = this.passwordCtrl.value || '';
      
  //     if (!username || username.length < 3) {
  //       this.focusInput('username');
  //       return;
  //     }
      
  //     if (!password || password.length < 9) {
  //       this.voiceService.speakAlways('Primero escribe tu contraseña. Di "contraseña" para escribir tu clave.');
  //       this.focusInput('password');
  //       return;
  //     }
      
  //     this.onSubmit();
  //     return;
  //   }

  //   if (this.synonyms.readFields.some(s => lower.includes(s))) {
  //     console.log('📖 [Login] Comando "leer campos" detectado');
  //     if (this.dictationMode) {
  //       this.stopDictation(undefined, true);
  //     }
  //     this.readFields();
  //     return;
  //   }

  //   if (this.synonyms.status.some(s => lower.includes(s))) {
  //     console.log('📊 [Login] Comando "estado" detectado');
  //     if (this.dictationMode) {
  //       this.stopDictation(undefined, true);
  //     }
  //     this.getStatus();
  //     return;
  //   }

  //   if (this.synonyms.clearUsername.some(s => lower.includes(s))) {
  //     this.clearField('username');
  //     return;
  //   }

  //   if (this.synonyms.clearPassword.some(s => lower.includes(s))) {
  //     this.clearField('password');
  //     return;
  //   }

  //   if (this.synonyms.clearCurrent.some(s => lower.includes(s))) {
  //     const focusedField = this.getFocusedField();
  //     if (focusedField) {
  //       this.clearField(focusedField);
  //     } else {
  //       this.voiceService.speak('No hay ningún campo enfocado. Di "limpiar usuario" o "limpiar contraseña".');
  //     }
  //     return;
  //   }

  //   if (this.synonyms.clearAll.some(s => lower.includes(s))) {
  //     this.clearAllFields();
  //     return;
  //   }

  //   if (this.synonyms.help.some(s => lower.includes(s))) {
  //     this.showHelp();
  //     return;
  //   }

  //   if (this.synonyms.mute.some(s => lower.includes(s))) {
  //     this.voiceService.mute();
  //     return;
  //   }

  //   if (this.synonyms.unmute.some(s => lower.includes(s))) {
  //     this.voiceService.unmute();
  //     return;
  //   }

  //   if (this.synonyms.showPassword.some(s => lower.includes(s))) {
  //     if (this.hidePassword()) {
  //       this.togglePasswordVisibility();
  //       this.voiceService.speak('Contraseña visible');
  //     }
  //     return;
  //   }

  //   if (this.synonyms.hidePassword.some(s => lower.includes(s))) {
  //     if (!this.hidePassword()) {
  //       this.togglePasswordVisibility();
  //       this.voiceService.speak('Contraseña oculta');
  //     }
  //     return;
  //   }

  //   // ============================================================
  //   // MODO DICTADO ACTIVO
  //   // ============================================================
  //   if (this.dictationMode && this.dictationTarget) {
  //     console.log(`🔍 [handleVoiceCommand] Modo dictado activo, llamando a handleDictation: "${lower}"`);
  //     this.handleDictation(lower);
  //     return;
  //   }

  //   // ============================================================
  //   // INICIAR DICTADO
  //   // ============================================================
  //   if (this.synonyms.dictateUsername.some(s => lower.includes(s))) {
  //     const afterCommand = lower.replace(/^(usuario|nombre|user|email|correo|escribir usuario|escribe usuario|escribir nombre|escribe nombre)\s*/, '').trim();
  //     this.startDictation('username', afterCommand);
  //     return;
  //   }

  //   if (this.synonyms.dictatePassword.some(s => lower.includes(s))) {
  //     const afterCommand = lower.replace(/^(contraseña|clave|pass|password|escribir contraseña|escribe contraseña|escribir clave|escribe clave)\s*/, '').trim();
  //     this.startDictation('password', afterCommand);
  //     return;
  //   }

  //   // if (this.synonyms.register.some(s => lower.includes(s))) {
  //   //   console.log('🔍 Login: navegando a registro');
  //   //   this.voiceService.speak('Navegando a registro');
  //   //   setTimeout(() => {
  //   //     this.voiceService.clearTranscript();
  //   //   }, 100);
  //   //   setTimeout(() => {
  //   //     if (!this.isDestroyed) {
  //   //       this.router.navigateByUrl('/register', { replaceUrl: true });
  //   //     }
  //   //   }, 300);
  //   //   return;
  //   // }


  //   if (this.synonyms.register.some(s => lower.includes(s))) {
  //     console.log('🔍 Login: navegando a registro');
  //     this.voiceService.clearTranscript();
  //     this.voiceService.onNavigate();   // ✅ NUEVO: bloquea comandos de navegación 3000 ms
  //     setTimeout(() => {
  //       if (!this.isDestroyed) {
  //         this.router.navigateByUrl('/register', { replaceUrl: true });
  //       }
  //     }, 300);
  //     return;
  //   }


  //   if (this.synonyms.forgot.some(s => lower.includes(s))) {
  //     this.voiceService.clearTranscript();
  //     this.voiceService.speak('Navegando a recuperar contraseña');
  //     this.router.navigateByUrl('/forgot-password', { replaceUrl: true });
  //     return;
  //   }

  //   console.log('⏭️ Login - Comando no reconocido, ignorado:', lower);
  // }











  private handleVoiceCommand(text: string): void {
    if (this.isDestroyed) return;
    const lower = text.toLowerCase().trim();
    
    console.log(`📝 [handleVoiceCommand] lower: "${lower}"`);

    // ============================================================
    // ✅ CONTROL DE LA AYUDA EN CURSO (ANTES DE CUALQUIER COSA)
    // ============================================================
    if (this.helpInProgress) {
      if (lower.includes('para') || lower.includes('silencio') ||
          lower.includes('calla') || lower.includes('stop') ||
          lower.includes('detente')) {
        this.stopHelp();
        this.voiceService.speak('Ayuda detenida.');
        return;
      }
      if (lower === 'siguiente' || lower === 'continúa' || lower === 'continua') {
        window.speechSynthesis.cancel();
        return;
      }
      if (lower === 'repetir' || lower === 'repite') {
        this.helpCurrentIndex = Math.max(0, this.helpCurrentIndex - 1);
        window.speechSynthesis.cancel();
        return;
      }
      console.log('⏭️ Login: ignorando comando durante la ayuda:', lower);
      return;
    }

    // Ignorar números sueltos
    const isNumeric = /^\d+$/.test(lower) || ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'].some(w => lower === w);
    if (isNumeric) {
      console.log('⏭️ Login: número suelto ignorado');
      return;
    }

    // ✅ DEBOUNCE AL PRINCIPIO: filtra duplicados antes de cualquier comando
    const now = Date.now();
    if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
      console.log(`⏭️ Login: comando duplicado ignorado: "${lower}"`);
      return;
    }
    this.lastProcessedCommand = lower;
    this.lastProcessedTime = now;

    // ============================================================
    // COMANDOS DE NAVEGACIÓN
    // ============================================================
    if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar') || lower.includes('retroceder')) {
      console.log('🔙 Login: ejecutando "volver"');
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
      }
      this.voiceService.clearTranscript();
      this.voiceService.onNavigate();
      this.router.navigateByUrl('/home', { replaceUrl: true });
      return;
    }
    
    if (lower.includes('privacidad') || lower.includes('política de privacidad') || lower.includes('política')) {
      console.log('🔐 [Login] Ejecutando "privacidad"');
      this.voiceService.clearTranscript();
      this.voiceService.speak('Navegando a política de privacidad');
      this.router.navigateByUrl('/privacy', { replaceUrl: true });
      return;
    }

    if (lower.includes('condiciones') || lower.includes('términos') || lower.includes('términos y condiciones') || lower.includes('condiciones de uso')) {
      console.log('📄 [Login] Ejecutando "condiciones"');
      this.voiceService.clearTranscript();
      this.voiceService.speak('Navegando a términos y condiciones');
      this.router.navigateByUrl('/terms', { replaceUrl: true });
      return;
    }

    // ============================================================
    // DICTADO DIRECTO (si campo vacío)
    // ============================================================
    if (lower === 'usuario' || lower === 'contraseña' || lower === 'clave' || lower === 'password' || lower === 'pass') {
      console.log(`🎤 [Login] Campo "${lower}" detectado`);
      const target = lower === 'usuario' ? 'username' : 'password';
      const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
      const control = this.loginForm.get(formControlName);
      
      const shouldStartDictation = (!control?.value || control.value.length === 0) && 
                                  (!this.dictationMode || this.dictationTarget !== target);
      
      if (shouldStartDictation) {
        console.log(`🎤 [Login] Campo "${lower}" vacío, iniciando dictado directo`);
        if (this.dictationMode) {
          this.stopDictation(undefined, true);
        }
        this.startDictation(target, '');
        return;
      } else if (this.dictationMode && this.dictationTarget === target) {
        console.log(`⏭️ [Login] Ya dictando "${target}", ignorando comando`);
        return;
      }
    }

    // ============================================================
    // COMANDOS DE ACCIÓN
    // ============================================================
    if (this.synonyms.cancel.some(s => lower.includes(s))) {
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
        this.voiceService.speak('Dictado cancelado');
      }
      return;
    }

    if (this.synonyms.login.some(s => lower.includes(s))) {
      console.log('🔐 Login: ejecutando login por voz');
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
      }
      
      const username = this.usernameOrEmailCtrl.value || '';
      const password = this.passwordCtrl.value || '';
      
      if (!username || username.length < 3) {
        this.focusInput('username');
        return;
      }
      
      if (!password || password.length < 9) {
        this.voiceService.speakAlways('Primero escribe tu contraseña. Di "contraseña" para escribir tu clave.');
        this.focusInput('password');
        return;
      }
      
      this.onSubmit();
      return;
    }

    if (this.synonyms.readFields.some(s => lower.includes(s))) {
      console.log('📖 [Login] Comando "leer campos" detectado');
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
      }
      this.readFields();
      return;
    }

    if (this.synonyms.status.some(s => lower.includes(s))) {
      console.log('📊 [Login] Comando "estado" detectado');
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
      }
      this.getStatus();
      return;
    }

    if (this.synonyms.clearUsername.some(s => lower.includes(s))) {
      this.clearField('username');
      return;
    }

    if (this.synonyms.clearPassword.some(s => lower.includes(s))) {
      this.clearField('password');
      return;
    }

    if (this.synonyms.clearCurrent.some(s => lower.includes(s))) {
      const focusedField = this.getFocusedField();
      if (focusedField) {
        this.clearField(focusedField);
      } else {
        this.voiceService.speak('No hay ningún campo enfocado. Di "limpiar usuario" o "limpiar contraseña".');
      }
      return;
    }

    if (this.synonyms.clearAll.some(s => lower.includes(s))) {
      this.clearAllFields();
      return;
    }

    if (this.synonyms.help.some(s => lower.includes(s))) {
      this.showHelp();
      return;
    }

    if (this.synonyms.mute.some(s => lower.includes(s))) {
      this.voiceService.mute();
      return;
    }

    if (this.synonyms.unmute.some(s => lower.includes(s))) {
      this.voiceService.unmute();
      return;
    }

    if (this.synonyms.showPassword.some(s => lower.includes(s))) {
      if (this.hidePassword()) {
        this.togglePasswordVisibility();
        this.voiceService.speak('Contraseña visible');
      }
      return;
    }

    if (this.synonyms.hidePassword.some(s => lower.includes(s))) {
      if (!this.hidePassword()) {
        this.togglePasswordVisibility();
        this.voiceService.speak('Contraseña oculta');
      }
      return;
    }

    // ============================================================
    // MODO DICTADO ACTIVO
    // ============================================================
    if (this.dictationMode && this.dictationTarget) {
      console.log(`🔍 [handleVoiceCommand] Modo dictado activo, llamando a handleDictation: "${lower}"`);
      this.handleDictation(lower);
      return;
    }

    // ============================================================
    // INICIAR DICTADO
    // ============================================================
    if (this.synonyms.dictateUsername.some(s => lower.includes(s))) {
      const afterCommand = lower.replace(/^(usuario|nombre|user|email|correo|escribir usuario|escribe usuario|escribir nombre|escribe nombre)\s*/, '').trim();
      this.startDictation('username', afterCommand);
      return;
    }

    if (this.synonyms.dictatePassword.some(s => lower.includes(s))) {
      const afterCommand = lower.replace(/^(contraseña|clave|pass|password|escribir contraseña|escribe contraseña|escribir clave|escribe clave)\s*/, '').trim();
      this.startDictation('password', afterCommand);
      return;
    }

    if (this.synonyms.register.some(s => lower.includes(s))) {
      console.log('🔍 Login: navegando a registro');
      this.voiceService.clearTranscript();
      this.voiceService.onNavigate();
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.router.navigateByUrl('/register', { replaceUrl: true });
        }
      }, 300);
      return;
    }

    if (this.synonyms.forgot.some(s => lower.includes(s))) {
      this.voiceService.clearTranscript();
      this.voiceService.speak('Navegando a recuperar contraseña');
      this.router.navigateByUrl('/forgot-password', { replaceUrl: true });
      return;
    }

    console.log('⏭️ Login - Comando no reconocido, ignorado:', lower);
  }








  //
  private handleDictation(text: string): void {
    if (this.isDestroyed) return;
    const target = this.dictationTarget!;
    const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
    const control = this.loginForm.get(formControlName);
    if (!control) return;
    const currentValue = control.value || '';
    console.log(`🔊 handleDictation: "${text}"`);

    const shouldCapitalize = target !== 'username';

    if (this.voiceFilter.containsFinishWords(text)) {
      console.log('🔴 Comando de finalización');
      const cleanText = this.voiceFilter.removeFinishWords(text);
      
      let finalValue = this.dictationBuffer || currentValue;

      if (cleanText.length > 0) {
        console.log(`📝 Procesando: "${cleanText}"`);
        const processed = this.voiceFilter.processDictationPhrase(cleanText, target, shouldCapitalize);
        if (processed.success) {
          finalValue = processed.text;
          this.updateFormAndInputDirectly(target, finalValue);
          this.dictationBuffer = processed.text.trimEnd();
          console.log(`🔤 Reemplazado por: "${finalValue}"`);
        }
      } else {
        console.log(`🔤 Usando texto acumulado: "${this.dictationBuffer}"`);
        if (this.dictationBuffer) {
          finalValue = this.dictationBuffer;
          this.updateFormAndInputDirectly(target, finalValue);
        }
      }
      this.stopDictation(finalValue);
      return;
    }

    if (text.includes('borrar') || text.includes('eliminar')) {
      if (this.dictationBuffer.length > 0) {
        const newValue = currentValue.slice(0, -this.dictationBuffer.length);
        this.updateFormAndInputDirectly(target, newValue);
        this.voiceService.speak(`Borrado: ${this.dictationBuffer.trim()}`);
        this.dictationBuffer = '';
        return;
      } else {
        const newValue = currentValue.slice(0, -1);
        this.updateFormAndInputDirectly(target, newValue);
        this.voiceService.speak('Borrado último carácter');
        return;
      }
    }

    if (text.includes('limpiar todo') || text.includes('borrar todo')) {
      this.updateFormAndInputDirectly(target, '');
      this.dictationBuffer = '';
      this.voiceService.speak('Campo limpiado');
      return;
    }

    if (text.includes('mostrar') || text.includes('ver') || text.includes('leer')) {
      this.voiceService.speak(`Texto actual: ${currentValue || 'vacío'}`);
      return;
    }

    let processed = this.voiceFilter.processDictationPhrase(text, target, shouldCapitalize);
    if (!processed.success || !processed.text) {
      const word = text.trim();
      const cleanWord = word.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
      let finalWord = cleanWord;
      if (shouldCapitalize && (currentValue === '' || currentValue.endsWith(' ')) && finalWord.length > 0) {
        finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
      }
      processed = { success: true, text: finalWord + ' ', originalText: text, processedText: finalWord + ' ' } as any;
      console.log(`🔤 Fallback: "${processed.text}"`);
    }

    this.dictationBuffer = processed.text.trimEnd();
    console.log(`🔤 Texto acumulado (no visible): "${this.dictationBuffer}"`);
  }

  private startDictation(target: 'username' | 'password', initialText = ''): void {
    if (this.isDestroyed) return;
    this.dictationMode = true;
    this.dictationTarget = target;
    this.dictationBuffer = '';
    const fieldName = target === 'username' ? 'usuario' : 'contraseña';

    this.updateFormAndInputDirectly(target, '');

    if (initialText) {
      this.updateFormAndInputDirectly(target, initialText);
      this.dictationBuffer = initialText.trimEnd();
      this.voiceService.speak(`Dictando ${fieldName}. Texto inicial: ${initialText}`);
    } else {
      const finishList = this.voiceFilter.getFinishWords().slice(0, 2).join(' o ');
      this.voiceService.speak(`Dictando ${fieldName}. Di "${finishList}" para finalizar.`);
    }

    this.focusInput(target);
    console.log(`🎤 Dictado activado para: ${target}`);
  }

  private stopDictation(finalValue?: string, silent = false): void {
    if (this.isDestroyed) return;
    console.log(`🔴 stopDictation (silent: ${silent})`);
    const target = this.dictationTarget;
    
    if (target) {
      const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
      const control = this.loginForm.get(formControlName);
      let value = finalValue !== undefined ? finalValue : control?.value || '';
      value = value.trimEnd();

      if (value && value.length > 0) {
        this.updateFormAndInputDirectly(target, value);

        if (target === 'username') {
          control?.markAsTouched();
          control?.updateValueAndValidity();
          
          if (control?.invalid) {
            const errors = this.getUsernameErrors();
            const msg = errors || 'El usuario no es válido. Debe tener al menos 3 caracteres y solo letras, números, . _ @ ! ? - y sin espacios.';
            
            this.voiceService.speakAlways(`Error: ${msg}. Puedes corregirlo manualmente o decir "usuario" para intentarlo de nuevo.`);
            
            setTimeout(() => this.focusInput('username'), 500);
            
            this.dictationMode = false;
            this.dictationTarget = null;
            this.dictationBuffer = '';
            this.cdr.markForCheck();
            return;
          } else {
            if (!silent) {
              this.voiceService.speakAlways(`Usuario válido. Ahora puedes decir "contraseña".`);
              setTimeout(() => {
                this.focusInput('password');
              }, 800);
            }
          }
        }

        if (target === 'password') {
          control?.markAsTouched();
          control?.updateValueAndValidity();
          
          if (control?.invalid) {
            const errors = this.getPasswordErrors();
            const msg = errors || 'La contraseña no cumple los requisitos. Debe tener al menos 9 caracteres, mayúscula, minúscula, número y símbolo.';
            
            this.voiceService.speakAlways(`Error: ${msg}. Puedes corregirlo manualmente o decir "contraseña" para intentarlo de nuevo.`);
            
            setTimeout(() => this.focusInput('password'), 500);
            
            this.dictationMode = false;
            this.dictationTarget = null;
            this.dictationBuffer = '';
            this.cdr.markForCheck();
            return;
          } else {
            if (!silent) {
              this.voiceService.speakAlways(`Contraseña válida. Di "enviar" para iniciar sesión.`);
            }
          }
        }
      } else {
        if (!silent) {
          const fieldName = target === 'username' ? 'el usuario' : 'la contraseña';
          this.voiceService.speakAlways(`No se reconoció ${fieldName}. Di "${target === 'username' ? 'usuario' : 'contraseña'}" para intentarlo de nuevo.`);
        }
      }

      if (target === 'username' && !silent) {
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.focusInput('password');
            this.cdr.markForCheck();
          }
        }, 300);
      }
    }
    
    this.dictationMode = false;
    this.dictationTarget = null;
    this.dictationBuffer = '';
    this.cdr.markForCheck();
  }

  private focusInput(target: 'username' | 'password'): void {
    if (this.isDestroyed) return;
    setTimeout(() => {
      if (!this.isDestroyed) {
        if (target === 'username') {
          this.usernameInput?.setFocus();
        } else {
          this.passwordInput?.setFocus();
        }
        this.cdr.markForCheck();
      }
    }, 100);
  }

  private getFocusedField(): 'username' | 'password' | null {
    const activeElement = document.activeElement;
    const usernameEl = this.usernameInputEl?.nativeElement;
    const passwordEl = this.passwordInputEl?.nativeElement;
    
    if (usernameEl === activeElement) return 'username';
    if (passwordEl === activeElement) return 'password';
    return null;
  }

  private updateFormAndInputDirectly(target: 'username' | 'password', value: string): void {
    if (this.isDestroyed) return;
    
    if (target === 'password') {
      value = value.trim();
    }
    
    const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
    const control = this.loginForm.get(formControlName);
    if (!control) {
      console.error(`❌ Control ${formControlName} no encontrado`);
      return;
    }

    control.setValue(value, { emitEvent: true });
    control.markAsDirty();
    control.markAsTouched();

    const inputEl = target === 'username' 
      ? this.usernameInputEl?.nativeElement 
      : this.passwordInputEl?.nativeElement;
      
    if (inputEl) {
      inputEl.value = value;
      this.renderer.setProperty(inputEl, 'value', value);
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    control.updateValueAndValidity({ emitEvent: true });
    this.updateSignals();
    this.cdr.markForCheck();
    console.log(`✅ Valor actualizado: "${control.value}"`);
  }

  private clearField(target: 'username' | 'password'): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);

    const fieldName = target === 'username' ? 'usuario' : 'contraseña';
    const formControlName = target === 'username' ? 'usernameOrEmail' : 'password';
    const control = this.loginForm.get(formControlName);
    if (!control) return;

    const currentValue = control.value || '';

    if (!currentValue) {
      this.voiceService.speak(`El campo ${fieldName} ya está vacío. Di "${fieldName}" para escribir uno nuevo.`);
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.focusInput(target);
          if (!this.voiceService.isRecognitionActive()) {
            this.voiceService.startListening();
          }
        }
      }, 800);
      return;
    }

    control.setValue('', { emitEvent: true });
    control.markAsPristine();
    control.markAsUntouched();
    this.errorMessage.set(null);
    this.dictationBuffer = '';
    this.updateFormAndInputDirectly(target, '');
    this.cdr.markForCheck();

    this.voiceService.speak(`Campo ${fieldName} limpiado. Di "${fieldName}" para escribir uno nuevo.`);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.focusInput(target);
        if (!this.voiceService.isRecognitionActive()) {
          this.voiceService.startListening();
        }
      }
    }, 800);
  }

  private clearAllFields(): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);
    
    const username = this.usernameOrEmailCtrl.value || '';
    const password = this.passwordCtrl.value || '';
    
    if (!username && !password) {
      this.voiceService.speak('Los campos ya están vacíos.');
      this.focusInput('username');
      return;
    }
    
    this.loginForm.patchValue({ usernameOrEmail: '', password: '' });
    this.loginForm.markAsPristine();
    this.loginForm.markAsUntouched();
    this.errorMessage.set(null);
    this.dictationBuffer = '';
    this.updateFormAndInputDirectly('username', '');
    this.updateFormAndInputDirectly('password', '');
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    
    this.voiceService.speak('Todos los campos limpiados.');
    this.focusInput('username');
    console.log('🧹 Todos los campos limpiados');
  }

  private readFields(): void {
    if (this.isDestroyed) return;
    const username = this.usernameOrEmailCtrl.value || '(vacío)';
    const password = this.passwordCtrl.value ? '********' : '(vacío)';
    const messages = [
      `Usuario: ${username}`,
      `Contraseña: ${password}`
    ];
    this.speakWithPauses(messages);
  }

  private getStatus(): void {
    if (this.isDestroyed) return;
    const username = this.usernameOrEmailCtrl.value || '';
    const password = this.passwordCtrl.value || '';
    const missingFields = [];
    
    if (!username || username.trim().length === 0) missingFields.push('usuario');
    if (!password || password.trim().length === 0) missingFields.push('contraseña');
    
    if (missingFields.length === 0) {
      this.voiceService.speak('Todos los campos están completos. Di "enviar" para iniciar sesión, o "leer campos" para comprobar el contenido.');
    } else {
      const fieldList = missingFields.map(f => `"${f}"`).join(', ');
      this.voiceService.speak(`Faltan los campos: ${fieldList}. Di el nombre de uno para editarlo.`);
    }
  }

  private speakWithPauses(messages: string[], pauseMs: number = 500): void {
    if (this.isDestroyed || messages.length === 0) return;
    let index = 0;
    const speakNext = () => {
      if (this.isDestroyed || index >= messages.length) return;
      const message = messages[index];
      this.voiceService.speak(message).then(() => {
        index++;
        if (index < messages.length) setTimeout(speakNext, pauseMs);
      }).catch(() => {
        index++;
        setTimeout(speakNext, pauseMs);
      });
    };
    speakNext();
  }

  //
  // private showHelp(): void {
  //   if (this.isDestroyed) return;
  //   if (this.voiceService.isCurrentlyMuted()) {
  //     this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
  //     return;
  //   }

  //   // ✅ UNA SOLA emisión con el texto completo
  //   const helpText =
  //     'Puedes decir: ' +
  //     '"usuario" para escribir tu usuario. ' +
  //     '"contraseña" para tu clave. ' +
  //     '"enviar" para iniciar sesión. ' +
  //     '"limpiar" para borrar los campos. ' +
  //     '"leer campos" para escuchar el contenido. ' +
  //     '"mostrar contraseña" u "ocultar contraseña" para ver u ocultar tu clave. ' +
  //     '"registrar" para crear una cuenta. ' +
  //     '"recuperar" para recuperar tu contraseña. ' +
  //     '"volver" para regresar a la página anterior. ' +
  //     '"silenciar micrófono" para apagar el micrófono. ' +
  //     '"privacidad" para ver la política de privacidad. ' +
  //     '"condiciones" para ver los términos y condiciones. ' +
  //     'o "ayuda" para ver todas las opciones.';

  //   this.voiceService.speak(helpText);
  // }


  private showHelp(): void {
    if (this.isDestroyed) return;
    if (this.voiceService.isCurrentlyMuted()) {
      this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
      return;
    }

    const blocks = [
      'Ayuda. Puedes decir:',
      'usuario, para escribir tu nombre;',
      'contraseña, para tu clave;',
      'enviar, para iniciar sesión;',
      'limpiar, para borrar los campos;',
      'leer campos, para escuchar lo que has escrito;',
      'mostrar contraseña u ocultar contraseña;',
      'registrar, para crear una cuenta;',
      'recuperar, para recuperar tu contraseña;',
      'volver, para regresar;',
      'silenciar micrófono;',
      'privacidad, para la política;',
      'condiciones, para los términos;',
      'o ayuda, para repetir esta lista.',
      'Di "para" para detener la ayuda.'
    ];

    this.playHelpBlocks(blocks, 350);
  }




  // ✅ NUEVO: reproduce la ayuda en bloques cortos con pausas
  private playHelpBlocks(blocks: string[], pauseMs = 350): void {
    if (this.isDestroyed) return;

    this.helpBlocks = blocks;
    this.helpCurrentIndex = 0;
    this.helpInProgress = true;
    this.helpCancelled = false;

    // ✅ Desactivar la intercepción de "para" en el VoiceService
    this.voiceService.setSuppressStopWords(true);

    const playNext = () => {
      if (this.isDestroyed || this.helpCancelled) {
        this.helpInProgress = false;
        this.voiceService.setSuppressStopWords(false);   // ✅ Reactivar
        return;
      }

      if (this.helpCurrentIndex >= this.helpBlocks.length) {
        this.helpInProgress = false;
        this.voiceService.setSuppressStopWords(false);   // ✅ Reactivar
        console.log('🔊 [Login] Ayuda finalizada');
        return;
      }

      const block = this.helpBlocks[this.helpCurrentIndex];
      this.helpCurrentIndex++;

      this.voiceService.speak(block)
        .then(() => {
          if (this.helpCancelled || this.isDestroyed) {
            this.helpInProgress = false;
            this.voiceService.setSuppressStopWords(false);
            return;
          }
          setTimeout(playNext, pauseMs);
        })
        .catch(() => {
          if (this.helpCancelled || this.isDestroyed) {
            this.helpInProgress = false;
            this.voiceService.setSuppressStopWords(false);
            return;
          }
          setTimeout(playNext, pauseMs);
        });
    };

    playNext();
  }


  // ✅ NUEVO: detiene la ayuda en curso
  private stopHelp(): void {
    if (!this.helpInProgress) return;
    console.log('🛑 [Login] Ayuda detenida por el usuario');
    this.helpCancelled = true;
    this.helpInProgress = false;
    this.voiceService.setSuppressStopWords(false);   // ✅ Reactivar
    window.speechSynthesis.cancel();
  }

  //
  getUsernameErrors(): string | null {
    const ctrl = this.usernameOrEmailCtrl;
    if (!ctrl.dirty && !ctrl.touched) return null;
    if (!ctrl.errors) return null;
    return getErrorMessage(ctrl.errors, 'El usuario');
  }

  getPasswordErrors(): string | null {
    const ctrl = this.passwordCtrl;
    if (!ctrl.dirty && !ctrl.touched) return null;
    if (!ctrl.errors) return null;
    return getErrorMessage(ctrl.errors, 'La contraseña');
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
    this.cdr.markForCheck();
  }

  onUsernameBlur(): void {
    const value = this.usernameOrEmailCtrl.value;
    if (value) {
      const trimmed = value.trim();
      if (trimmed !== value) {
        this.usernameOrEmailCtrl.setValue(trimmed);
      }
      this.usernameOrEmailCtrl.updateValueAndValidity();
    }
    this.updateSignals();
  }

  onPasswordBlur(): void {
    const value = this.passwordCtrl.value;
    if (value) {
      const trimmed = value.trim();
      if (trimmed !== value) {
        this.passwordCtrl.setValue(trimmed);
      }
      this.passwordCtrl.updateValueAndValidity();
    }
    this.updateSignals();
  }

  private handleAction(response: any): void {
    if (this.isDestroyed) return;
    const action = response.action;
    if (!action) return;
    console.log(`🎯 Acción recibida: ${action.type}`, action.payload);
    switch (action.type) {
      case 'navigate':
        const route = action.payload?.['route'];
        if (route) this.router.navigateByUrl(route, { replaceUrl: true });
        break;
      case 'login':
        this.onSubmit();
        break;
      case 'input':
        if (action.payload?.['field'] && action.payload?.['value']) {
          this.updateFormAndInputDirectly(
            action.payload['field'] as 'username' | 'password', 
            action.payload['value'] as string
          );
        }
        break;
      case 'clear':
        this.clearAllFields();
        break;
      default:
        console.log('Acción no reconocida:', action.type);
    }
  }

  onSubmit(): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);

    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      let errorMsg = 'El formulario tiene errores. ';
      if (this.usernameOrEmailCtrl.invalid) {
        errorMsg += 'El usuario es obligatorio y debe tener al menos 3 caracteres. ';
      }
      if (this.passwordCtrl.invalid) {
        errorMsg += 'La contraseña es obligatoria y debe tener al menos 9 caracteres. ';
      }
      this.errorMessage.set(errorMsg);
      this.showError.set(true);
      this.voiceService.speakAlways(errorMsg);
      if (this.usernameOrEmailCtrl.invalid) {
        setTimeout(() => this.focusInput('username'), 500);
      } else if (this.passwordCtrl.invalid) {
        setTimeout(() => this.focusInput('password'), 500);
      }
      this.cdr.markForCheck();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.showError.set(false);
    this.cdr.markForCheck();

    const credentials: LoginRequest = {
      usernameOrEmail: this.usernameOrEmailCtrl.value || '',
      password: this.passwordCtrl.value || ''
    };

    this.authService.login(credentials)
      .pipe(finalize(() => {
        if (!this.isDestroyed) {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      }))
      .subscribe({
        next: () => {
          if (!this.isDestroyed) {
            console.log('✅ Login exitoso');
            this.voiceService.clearTranscript();
            this.voiceService.speak('¡Bienvenido!');
            this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          }
        },
        error: (err) => {
          if (!this.isDestroyed) {
            console.error('Error en login:', err);
            let msg = 'Error al iniciar sesión. ';
            if (err.status === 401 || err.status === 403) {
              msg = 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
            } else if (err.status === 0) {
              msg = 'Error de conexión. Verifica tu conexión a internet.';
            } else if (err.status === 404) {
              msg = 'Usuario no encontrado. Verifica tus credenciales.';
            } else if (err.status === 500) {
              msg = 'Error en el servidor. Intenta más tarde.';
            } else {
              msg = err.message || 'Error inesperado. Intenta de nuevo.';
            }
            this.errorMessage.set(msg);
            this.showError.set(true);
            this.voiceService.speakAlways(msg);
            this.focusInput('username');
            this.cdr.markForCheck();
          }
        }
      });
  }

  goToRegister(): void {
    this.router.navigateByUrl('/register', { replaceUrl: true });
  }

  goToForgotPassword(): void {
    this.router.navigateByUrl('/forgot-password', { replaceUrl: true });
  }

  goBack(): void {
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}