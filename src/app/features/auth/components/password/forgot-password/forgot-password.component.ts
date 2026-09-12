// // src/app/features/auth/forgot-password/forgot-password.component.ts
// import {
//   Component,
//   signal,
//   effect,
//   viewChild,
//   ElementRef,
//   inject,
//   OnDestroy,
//   ChangeDetectorRef,
//   Renderer2,
//   OnInit,
//   NgZone,
//   ChangeDetectionStrategy
// } from '@angular/core';

// import { RouterModule, Router } from '@angular/router';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
// import { finalize, Subject, Subscription, takeUntil, debounceTime } from 'rxjs';

// // ✅ IONIC standalone imports
// import {
//   IonContent,
//   IonItem,
//   IonInput,
//   IonIcon,
//   IonButton,
//   IonText,
//   IonSpinner,
// } from '@ionic/angular';

// // ✅ iconos de ionicons
// import { addIcons } from 'ionicons';
// import {
//   mailOutline,
//   arrowBackOutline,
//   checkmarkCircleOutline,
//   closeCircleOutline,
//   alertCircleOutline,
//   keyOutline,
//   lockClosedOutline,
//   eyeOutline,
//   eyeOffOutline,
//   clipboardOutline,
// } from 'ionicons/icons';

// // ✅ Directivas locales
// import { AutoFocusDirective } from '../../../../../shared/directives/auto-focus.directive';
// import { DisableAutofillDirective } from '../../../../../shared/directives/disable-autofill.directive';

// import { emailValidator } from '../../../../../shared/validators/validators';
// import { AuthService } from '../../../Services/auth-service';
// import { VoiceCommandHandlerService } from '../../../../services/voz/voice-command-handler.service';
// import { VoiceContextService } from '../../../../services/voz/voice-context.service';
// import { VoiceFilterService } from '../../../../services/voz/voice-filter.service';
// import { VoiceService } from '../../../../services/voz/voice.service';
// import { FieldCleanupService } from '../../../../services/voz/field-cleanup.service';

// @Component({
//   selector: 'app-forgot-password',
//   standalone: true,
//   imports: [
//     RouterModule,
//     ReactiveFormsModule,
//     IonContent,
//     IonItem,
//     IonInput,
//     IonIcon,
//     IonButton,
//     IonText,
//     IonSpinner,
//   ],
//   templateUrl: './forgot-password.component.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   styleUrls: ['./forgot-password.component.scss'],
// })
// export class ForgotPasswordComponent implements OnInit, OnDestroy {
//   private readonly fb = inject(FormBuilder);
//   private readonly authService = inject(AuthService);
//   private readonly router = inject(Router);
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly renderer = inject(Renderer2);
//   private readonly ngZone = inject(NgZone);

//   // Servicios de voz
//   private readonly voiceService = inject(VoiceService);
//   private readonly voiceHandler = inject(VoiceCommandHandlerService);
//   private readonly voiceContext = inject(VoiceContextService);
//   private readonly voiceFilter = inject(VoiceFilterService);
//   private readonly fieldCleanup = inject(FieldCleanupService);

//   // Feedback de voz con debounce
//   private voiceFeedback$ = new Subject<string>();
//   private voiceFeedbackSubscription?: Subscription;

//   // ✅ Referencias a inputs (ion-input de Ionic)
//   readonly emailInput       = viewChild<ElementRef<HTMLIonInputElement>>('emailInput');
//   readonly codeInput        = viewChild<ElementRef<HTMLIonInputElement>>('codeInput');
//   readonly newPassInput     = viewChild<ElementRef<HTMLIonInputElement>>('newPassInput');
//   readonly confirmPassInput = viewChild<ElementRef<HTMLIonInputElement>>('confirmPassInput');

//   // Formularios
//   readonly forgotPasswordForm: FormGroup;
//   readonly resetPasswordForm: FormGroup;

//   // Estados
//   readonly emailSent = signal(false);
//   readonly isFinished = signal(false);
//   readonly isLoading = signal(false);
//   readonly hidePassword = signal(true);
//   readonly errorMessage = signal<string | null>(null);

//   private isDestroyed = false;
//   private welcomeShown = false;
//   private destroy$ = new Subject<void>();

//   // Estado del dictado — ✅ NUEVO: incluye 'code'
//   private dictationMode = false;
//   private dictationTarget: 'email' | 'code' | 'password' | 'confirmPassword' | null = null;
//   private dictationBuffer = '';
//   private helpShown = false;

//   private availableCodeForVoice: string | null = null;

//   // Control de duplicados
//   private lastProcessedCommand = '';
//   private lastProcessedTime = 0;
//   private readonly COMMAND_DEBOUNCE = 800;

//   private lastPasteAttempt = 0;
//   private readonly PASTE_DEBOUNCE = 1500;

//   private pendingReadCode = 0;

//   // Referencias para autofoco
//   readonly btnSubmitEmail = viewChild<ElementRef<HTMLButtonElement>>('btnSubmit');
//   readonly btnSubmitPass  = viewChild<ElementRef<HTMLButtonElement>>('btnSubmitPass');

//   // ✅ Señal para saber si el micrófono está activo
//   readonly isMicActive = signal<boolean>(!this.voiceService.isCurrentlyMuted());
//   private mutedSubscription?: Subscription;

//   // Mensajes con lenguaje natural
//   private readonly WELCOME_MESSAGE =
//     'Bienvenido a recuperación de contraseña. Di "correo" para escribir tu correo electrónico, ' +
//     '"enviar" para solicitar el código, ' +
//     '"leer campos" para escuchar lo que has escrito, ' +
//     '"volver" para regresar, ' +
//     '"iniciar sesión" para ir a la pantalla de inicio de sesión, ' +
//     'o "ayuda" para más opciones.';

//   private readonly HELP_MESSAGE_STEP_1 =
//     'Puedes decir: "correo" para escribir tu correo electrónico, ' +
//     '"enviar" para solicitar el código de verificación, ' +
//     '"leer campos" para escuchar lo que has escrito, ' +
//     '"borrar" para limpiar el campo, ' +
//     '"volver" para regresar, ' +
//     '"iniciar sesión" para ir a la pantalla de inicio de sesión, ' +
//     'o "ayuda" para repetir este mensaje.';

//   // private readonly HELP_MESSAGE_STEP_2 =
//   //   'Ahora puedes decir: "código" para dictar el código de verificación, ' +
//   //   '"copiar código" o "pegar código" para rellenarlo desde el portapapeles, ' +
//   //   '"contraseña" para escribir tu nueva contraseña, ' +
//   //   '"confirmar" para repetir la contraseña, ' +
//   //   '"guardar" para cambiar tu contraseña, ' +
//   //   '"leer campos" para escuchar lo que has escrito, ' +
//   //   '"borrar" para limpiar el campo actual, ' +
//   //   '"limpiar" para borrar todos los campos, ' +
//   //   '"volver" para regresar, o "ayuda" para repetir este mensaje.';

//   private readonly HELP_MESSAGE_STEP_2 =
//     'Ahora puedes decir: "leer código" para que te lea el código por voz, ' +
//     '"código" para dictarlo tú mismo, ' +
//     '"pegar código" si lo has copiado del correo, ' +
//     '"contraseña" para escribir tu nueva contraseña, ' +
//     '"confirmar" para repetir la contraseña, ' +
//     '"guardar" para cambiar tu contraseña, ' +
//     '"leer campos" para escuchar lo que has escrito, ' +
//     '"volver" para regresar, o "ayuda" para repetir este mensaje.';

//   constructor() {
//     // ✅ registrar los iconos usados en el HTML
//     addIcons({
//       mailOutline,
//       arrowBackOutline,
//       checkmarkCircleOutline,
//       closeCircleOutline,
//       alertCircleOutline,
//       keyOutline,
//       lockClosedOutline,
//       eyeOutline,
//       eyeOffOutline,
//       clipboardOutline,
//     });

//     // ✅ PASO 1: Solo email
//     this.forgotPasswordForm = this.fb.group({
//       email: ['', [Validators.required, emailValidator()]]
//     });

//     // Paso 2: Código OTP + Password + Confirmar
//     this.resetPasswordForm = this.fb.group({
//       code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
//       password: ['', [
//         Validators.required,
//         Validators.minLength(9),
//         Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
//       ]],
//       confirmPassword: [{ value: '', disabled: true }, [Validators.required]]
//     }, {
//       validators: this.passwordMatchValidator
//     });

//     // Lógica de habilitación en cascada
//     this.resetPasswordForm.get('password')?.statusChanges.subscribe(status => {
//       const confirmControl = this.resetPasswordForm.get('confirmPassword');
//       if (status === 'VALID') {
//         confirmControl?.enable();
//       } else {
//         confirmControl?.disable();
//         confirmControl?.setValue('');
//       }
//     });

//     // Efectos de accesibilidad
//     effect(() => {
//       if (this.forgotPasswordForm.valid && !this.emailSent()) {
//         setTimeout(() => this.btnSubmitEmail()?.nativeElement.focus(), 50);
//       }
//       if (this.resetPasswordForm.valid && this.emailSent() && !this.isFinished()) {
//         setTimeout(() => this.btnSubmitPass()?.nativeElement.focus(), 50);
//       }
//     });

//     // ✅ Suscripción para mensajes de voz con debounce
//     this.voiceFeedbackSubscription = this.voiceFeedback$
//       .pipe(debounceTime(1200))
//       .subscribe((message: string) => {
//         if (!this.isDestroyed && message) {
//           this.voiceService.speak(message);
//         }
//       });
//   }

//   private speakFeedback(message: string): void {
//     if (!this.isDestroyed && message) {
//       this.voiceFeedback$.next(message);
//     }
//   }

//   private spellDigits(code: string): string {
//     const map: Record<string, string> = {
//       '0': 'cero', '1': 'uno', '2': 'dos', '3': 'tres', '4': 'cuatro',
//       '5': 'cinco', '6': 'seis', '7': 'siete', '8': 'ocho', '9': 'nueve'
//     };
//     return code.split('').map(d => map[d] || d).join(', ');
//   }

//   ngOnInit(): void {
//     console.log('✅ ForgotPasswordComponent inicializado (con voz)');

//     this.mutedSubscription = this.voiceService.getMutedState().subscribe(muted => {
//       this.isMicActive.set(!muted);
//       this.cdr.markForCheck();
//     });

//     const context = {
//       activationMessage: this.WELCOME_MESSAGE,
//       availableCommands: [
//         'correo', 'enviar', 'código', 'codigo', 'otp',
//         'contraseña', 'confirmar', 'guardar', 'volver',
//         'ayuda', 'borrar', 'limpiar', 'leer campos', 'estado',
//         'leer código',
//         'copiar código',
//         'pegar código',
//         'iniciar sesión'
//       ],
//       preventBackend: true
//     };
//     this.voiceContext.setContext(context);

//     this.voiceService.ready$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((ready) => {
//         if (!ready && !this.isDestroyed) {
//           console.log('🔄 [ForgotPassword] Reconocimiento caído, reactivando...');
//           setTimeout(() => {
//             if (!this.isDestroyed) {
//               this.voiceService.startListening();
//             }
//           }, 500);
//         }
//       });

//     setTimeout(() => {
//       if (!this.isDestroyed) {
//         const isActive = this.voiceService.isRecognitionActive();
//         const isMuted = this.voiceService.isCurrentlyMuted();
//         console.log(`🎤 [ForgotPassword] Estado del micrófono - Activo: ${isActive}, Muteado: ${isMuted}`);

//         if (!isActive && !isMuted) {
//           console.log('🎤 [ForgotPassword] Reconocimiento inactivo, iniciando...');
//           this.voiceService.startListening();
//         } else if (isActive) {
//           console.log('🎤 [ForgotPassword] Micrófono ya activo, no se inicia nuevamente');
//         }
//       }
//     }, 1000);

//     this.voiceService
//       .getTranscript()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((text: string) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed || !text) return;
//           this.handleVoiceCommand(text);
//         });
//       });

//     this.registerFieldsForCleanup();

//     setTimeout(() => {
//       if (!this.isDestroyed) {
//         console.log('🎯 [ForgotPassword] Aplicando foco al campo email');
//         this.focusEmailRobusto();
//       }
//     }, 800);

//     setTimeout(() => {
//       if (this.isDestroyed) return;

//       const isMuted = this.voiceService.isCurrentlyMuted();

//       if (isMuted) {
//         console.log('🔇 [ForgotPassword] Micrófono muteado, bienvenida omitida');
//         if (!this.voiceService.isRecognitionActive()) {
//           this.voiceService.startListening();
//         }
//         return;
//       }

//       console.log('🗣️ [ForgotPassword] Iniciando bienvenida encadenada con micro');

//       this.voiceService.speakAlways(this.WELCOME_MESSAGE, true)
//         .then(() => {
//           if (this.isDestroyed) return;
//           setTimeout(() => {
//             if (this.isDestroyed) return;
//             if (!this.voiceService.isRecognitionActive()) {
//               console.log('🎤 [ForgotPassword] Bienvenida terminada → arrancando micro');
//               this.voiceService.startListening();
//             }
//           }, 400);
//         })
//         .catch((err) => {
//           console.warn('⚠️ [ForgotPassword] speakAlways falló, arrancando micro igualmente', err);
//           if (this.isDestroyed) return;
//           if (!this.voiceService.isRecognitionActive()) {
//             this.voiceService.startListening();
//           }
//         });
//     }, 1500);
//   }

//   // ============================================================
//   // ✅ HELPER: OBTENER INSTANCIA DE ION-INPUT
//   // ============================================================
//   private getIonInput(target: string): HTMLIonInputElement | undefined {
//     const map: Record<string, HTMLIonInputElement | undefined> = {
//       email: this.emailInput()?.nativeElement,
//       code: this.codeInput()?.nativeElement,
//       password: this.newPassInput()?.nativeElement,
//       confirmPassword: this.confirmPassInput()?.nativeElement
//     };
//     return map[target];
//   }

//   // ============================================================
//   // REGISTRO DE CAMPOS PARA LIMPIEZA UNIVERSAL
//   // ============================================================
//   private registerFieldsForCleanup(): void {
//     this.fieldCleanup.registerField({
//       name: 'email',
//       label: 'correo',
//       isFocused: false,
//       clear: () => this.clearField('email'),
//       isEmpty: () => !this.forgotPasswordForm.get('email')?.value
//     });

//     this.fieldCleanup.registerField({
//       name: 'code',
//       label: 'código',
//       isFocused: false,
//       clear: () => this.clearField('code'),
//       isEmpty: () => !this.resetPasswordForm.get('code')?.value
//     });

//     this.fieldCleanup.registerField({
//       name: 'password',
//       label: 'contraseña',
//       isFocused: false,
//       clear: () => this.clearField('password'),
//       isEmpty: () => !this.resetPasswordForm.get('password')?.value
//     });

//     this.fieldCleanup.registerField({
//       name: 'confirmPassword',
//       label: 'confirmar contraseña',
//       isFocused: false,
//       clear: () => this.clearField('confirmPassword'),
//       isEmpty: () => !this.resetPasswordForm.get('confirmPassword')?.value
//     });
//   }

//   // ============================================================
//   // LEER TODOS LOS CAMPOS
//   // ============================================================
//   private readAllFields(): void {
//     if (this.isDestroyed) return;

//     const fieldConfigs = [
//       { key: 'email', label: 'Correo', form: 'forgot' },
//       { key: 'code', label: 'Código', form: 'reset' },
//       { key: 'password', label: 'Contraseña', form: 'reset' },
//       { key: 'confirmPassword', label: 'Confirmación', form: 'reset' }
//     ];

//     const filledFields: string[] = [];
//     const emptyFields: string[] = [];

//     for (const field of fieldConfigs) {
//       if (field.form === 'reset' && !this.emailSent()) continue;
//       if (field.form === 'forgot' && this.emailSent()) continue;

//       const control = field.form === 'forgot'
//         ? this.forgotPasswordForm.get(field.key)
//         : this.resetPasswordForm.get(field.key);
//       const value = control?.value || '';
//       if (value && value.trim().length > 0) {
//         if (field.key === 'password' || field.key === 'confirmPassword') {
//           filledFields.push(`${field.label}: completado`);
//         } else {
//           filledFields.push(`${field.label}: ${value}`);
//         }
//       } else {
//         emptyFields.push(field.label);
//       }
//     }

//     const messages: string[] = [];

//     if (filledFields.length === 0 && emptyFields.length === 0) {
//       messages.push('No hay campos en el formulario.');
//     } else if (filledFields.length === 0) {
//       messages.push('Todos los campos están vacíos.');
//       messages.push('Los campos disponibles son: ' + emptyFields.join(', ') + '.');
//     } else {
//       messages.push('Contenido del formulario:');
//       messages.push(filledFields.join('. ') + '.');

//       if (emptyFields.length > 0) {
//         messages.push('Campos vacíos: ' + emptyFields.join(', ') + '.');
//       }

//       if (emptyFields.length === 0) {
//         messages.push('Todos los campos están completos.');
//         if (this.emailSent() && !this.isFinished()) {
//           messages.push('Di "guardar" para cambiar la contraseña.');
//         } else if (!this.emailSent()) {
//           messages.push('Di "enviar" para solicitar el código.');
//         } else if (this.isFinished()) {
//           messages.push('Ya has actualizado tu contraseña. Ve al login.');
//         }
//       }
//     }

//     this.speakWithPauses(messages, 600);
//   }

//   private speakWithPauses(messages: string[], pauseMs: number = 500): void {
//     if (this.isDestroyed || messages.length === 0) return;

//     let index = 0;

//     const speakNext = () => {
//       if (this.isDestroyed || index >= messages.length) return;

//       const message = messages[index];
//       console.log(`🔊 [ForgotPassword] Hablando (${index + 1}/${messages.length}): "${message}"`);

//       this.voiceService.speak(message).then(() => {
//         index++;
//         if (index < messages.length) {
//           setTimeout(() => {
//             speakNext();
//           }, pauseMs);
//         }
//       }).catch(() => {
//         index++;
//         setTimeout(() => {
//           speakNext();
//         }, pauseMs);
//       });
//     };

//     speakNext();
//   }

  

//   // ============================================================
//   // ✅ MÉTODO PARA PEGAR CÓDIGO DESDE EL PORTAPAPELES
//   // ============================================================
//   /**
//    * ✅ Lee el portapapeles con reintentos.
//    *    Windows/Chrome a veces devuelve "" en el primer intento.
//    */
//   private async readClipboardWithRetry(maxAttempts = 3, delayMs = 150): Promise<string> {
//     for (let i = 0; i < maxAttempts; i++) {
//       try {
//         const text = await navigator.clipboard.readText();
//         if (text && text.trim().length > 0) {
//           if (i > 0) {
//             console.log(`📋 [ForgotPassword] Portapapeles leído en el intento ${i + 1}`);
//           }
//           return text;
//         }
//         console.log(`📋 [ForgotPassword] Intento ${i + 1}: portapapeles vacío, reintentando...`);
//       } catch (err) {
//         console.warn(`⚠️ [ForgotPassword] Error en intento ${i + 1}:`, err);
//       }

//       if (i < maxAttempts - 1) {
//         await new Promise(r => setTimeout(r, delayMs));
//       }
//     }

//     return '';
//   }


//   /**
//    * ✅ Extrae el código de 6 dígitos del texto del portapapeles.
//    *    Estrategia:
//    *    1. Busca código junto a palabra clave ("código", "code", "verificación")
//    *    2. Busca cualquier grupo exacto de 6 dígitos
//    *    3. Fallback: primeros 6 dígitos consecutivos
//    *    Devuelve null si no encuentra nada válido.
//    */
//   private extractCodeFromText(text: string): string | null {
//     if (!text || text.trim().length === 0) return null;

//     const contextMatch = text.match(/(?:c[oó]digo|code|verificaci[oó]n|otp)[^\d]{0,20}(\d{6})/i);
//     if (contextMatch) {
//       console.log(`📋 Código por contexto: "${contextMatch[1]}"`);
//       return contextMatch[1];
//     }

//     const numberMatch = text.match(/\b(\d{6})\b/);
//     if (numberMatch) {
//       console.log(`📋 Código por patrón: "${numberMatch[1]}"`);
//       return numberMatch[1];
//     }

//     const digits = text.replace(/\D/g, '').slice(0, 6);
//     if (digits.length === 6) {
//       console.log(`📋 Código por limpieza: "${digits}"`);
//       return digits;
//     }

//     return null;
//   }


//   //
//   public async pasteCodeFromClipboard(): Promise<void> {
//     if (this.isDestroyed) return;

//     const now = Date.now();
//     if (now - this.lastPasteAttempt < this.PASTE_DEBOUNCE) {
//       console.log('⏭️ [ForgotPassword] pegar código ignorado (debounce)');
//       return;
//     }
//     this.lastPasteAttempt = now;

//     try {
//       const text = await this.readClipboardWithRetry();
//       const code = this.extractCodeFromText(text);

//       if (!code) {
//         this.voiceService.speak('El portapapeles no contiene un código de 6 dígitos. Copia el código del correo primero.');
//         return;
//       }

//       this.applyCode(code, 'pegado');
//     } catch (err) {
//       console.error('Error al leer el portapapeles:', err);
//       this.voiceService.speak('No se pudo acceder al portapapeles. Asegúrate de permitir el acceso.');
//     }
//   }


//   //
//   public async copyCodeFromClipboard(): Promise<void> {
//     if (this.isDestroyed) return;

//     const now = Date.now();
//     if (now - this.lastPasteAttempt < this.PASTE_DEBOUNCE) {
//       console.log('⏭️ [ForgotPassword] copiar código ignorado (debounce)');
//       return;
//     }
//     this.lastPasteAttempt = now;

//     try {
//       const text = await this.readClipboardWithRetry();
//       const code = this.extractCodeFromText(text);

//       if (!code) {
//         this.voiceService.speak('El portapapeles no contiene un código de 6 dígitos. Copia el código del correo primero.');
//         return;
//       }

//       this.applyCode(code, 'copiado');
//     } catch (err) {
//       console.error('Error al leer el portapapeles:', err);
//       this.voiceService.speak('No se pudo acceder al portapapeles. Asegúrate de permitir el acceso.');
//     }
//   }

//   //
//   private applyCode(code: string, action: 'pegado' | 'copiado'): void {
//     this.resetPasswordForm.patchValue({ code });
//     this.resetPasswordForm.get('code')?.markAsDirty();
//     this.resetPasswordForm.get('code')?.markAsTouched();

//     const ionInput = this.getIonInput('code');
//     if (ionInput) {
//       ionInput.value = code;
//     }

//     this.cdr.detectChanges();
//     this.voiceService.speak(`Código ${code} ${action} correctamente.`);
//     console.log(`📋 Código ${action} desde el portapapeles: "${code}"`);

//     if (this.resetPasswordForm.get('code')?.valid) {
//       setTimeout(() => this.focusInput('password'), 500);
//     }
//   }

//   // ============================================================
//   // PROCESAMIENTO DE COMANDOS DE VOZ
//   // ============================================================
//   // private handleVoiceCommand(text: string): void {
//   //   if (this.isDestroyed) return;
//   //   const lower = text.toLowerCase().trim();

//   //   const now = Date.now();
//   //   if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//   //     console.log(`⏭️ ForgotPassword: comando duplicado ignorado: "${lower}"`);
//   //     return;
//   //   }
//   //   this.lastProcessedCommand = lower;
//   //   this.lastProcessedTime = now;

//   //   // ✅ Si el campo está vacío y dice "correo", iniciar dictado directo
//   //   if ((lower === 'correo' || lower === 'email' || lower === 'correo electrónico') && !this.emailSent()) {
//   //     const control = this.forgotPasswordForm.get('email');
//   //     const shouldStartDictation = (!control?.value || control.value.length === 0) &&
//   //                                 (!this.dictationMode || this.dictationTarget !== 'email');

//   //     if (shouldStartDictation) {
//   //       console.log(`🎤 [ForgotPassword] Campo "correo" vacío, iniciando dictado directo`);
//   //       if (this.dictationMode) {
//   //         this.stopDictation(undefined, true);
//   //       }
//   //       this.voiceService.speak('Dime tu correo electrónico. Di "fin" o "terminar" cuando hayas terminado.');
//   //       this.startDictation('email', '');
//   //       return;
//   //     } else if (this.dictationMode && this.dictationTarget === 'email') {
//   //       console.log(`⏭️ [ForgotPassword] Ya dictando "correo", ignorando comando`);
//   //       return;
//   //     }
//   //   }

//   //   // ✅ PRIORIDAD: Si estamos en modo dictado
//   //   if (this.dictationMode && this.dictationTarget) {
//   //     this.handleDictation(lower);
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // COMANDO "LEER CAMPOS"
//   //   // ============================================================
//   //   if (lower.includes('leer campos') || lower === 'leer' || lower.includes('leer todo') ||
//   //       lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
//   //       lower.includes('qué he escrito') || lower.includes('revisar campos') ||
//   //       lower.includes('comprobar campos') || lower.includes('ver campos')) {
//   //     console.log('📖 [ForgotPassword] Comando "leer campos" detectado');
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //     }
//   //     this.readAllFields();
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // COMANDO "ESTADO" / "QUÉ FALTA"
//   //   // ============================================================
//   //   if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
//   //     console.log('📊 [ForgotPassword] Comando "estado" detectado');
//   //     if (this.dictationMode) {
//   //       this.stopDictation(undefined, true);
//   //     }
//   //     this.showStatus();
//   //     return;
//   //   }

//   //   // ✅ COMANDO VOLVER
//   //   if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//   //     this.goBack();
//   //     return;
//   //   }

//   //   // ✅ COMANDO "INICIAR SESIÓN"
//   //   if (lower.includes('iniciar sesión') || lower.includes('ir a login') || lower.includes('login') || lower.includes('inicia sesión')) {
//   //     this.voiceService.clearTranscript();
//   //     this.voiceService.speak('Navegando a inicio de sesión.');
//   //     this.router.navigate(['/login']);
//   //     return;
//   //   }

//   //   // ✅ COMANDO BORRAR / LIMPIAR (soporta campo específico o activo)
//   //   if (lower.includes('borrar') || lower.includes('limpiar')) {
//   //     if (lower.includes('correo') || lower.includes('email')) {
//   //       this.clearField('email');
//   //       return;
//   //     }
//   //     if (lower.includes('código') || lower.includes('codigo')) {
//   //       this.clearField('code');
//   //       return;
//   //     }
//   //     if (lower.includes('confirmar')) {
//   //       this.clearField('confirmPassword');
//   //       return;
//   //     }
//   //     if (lower.includes('contraseña') || lower.includes('clave') || lower.includes('password')) {
//   //       this.clearField('password');
//   //       return;
//   //     }
//   //     this.clearCurrentField();
//   //     return;
//   //   }

//   //   // ============================================================
//   //   // PASO 1: SOLICITAR CORREO
//   //   // ============================================================
//   //   if (!this.emailSent()) {
//   //     if (/^(correo|email|correo electrónico)\b/.test(lower)) {
//   //       const rest = lower.replace(/^(correo|email|correo electrónico)\s*/, '').trim();
//   //       if (rest && rest.length > 0) {
//   //         this.startDictation('email', rest);
//   //       } else {
//   //         this.startDictation('email', '');
//   //       }
//   //       return;
//   //     }

//   //     if (lower.includes('enviar') || lower.includes('siguiente') || lower.includes('continuar')) {
//   //       this.onSubmitEmail();
//   //       return;
//   //     }
//   //   }

//   //   // ============================================================
//   //   // PASO 2: CÓDIGO + NUEVA CONTRASEÑA
//   //   // ============================================================
//   //   if (this.emailSent() && !this.isFinished()) {
//   //     // ✅ NUEVO: "código" ahora arranca dictado del código (no solo foco)
//   //     if (lower.includes('código') || lower.includes('codigo') || lower.includes('otp') || lower.includes('pin')) {
//   //       const control = this.resetPasswordForm.get('code');
//   //       const shouldStartDictation = (!control?.value || control.value.length === 0) &&
//   //                                   (!this.dictationMode || this.dictationTarget !== 'code');

//   //       if (shouldStartDictation) {
//   //         console.log(`🎤 [ForgotPassword] Campo "código" vacío, iniciando dictado directo`);
//   //         this.focusCodeInput();
//   //         setTimeout(() => this.startDictation('code', ''), 500);
//   //         return;
//   //       } else if (this.dictationMode && this.dictationTarget === 'code') {
//   //         console.log(`⏭️ [ForgotPassword] Ya dictando "código", ignorando comando`);
//   //         return;
//   //       }
//   //       return;
//   //     }

//   //     // ✅ COMANDO: Copiar/Pegar código (desde el portapapeles)
//   //     if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
//   //         lower.includes('copiar código') || lower.includes('copiar codigo') ||
//   //         lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
//   //         lower.includes('escribir código') || lower.includes('escribir codigo')) {
//   //       if (!this.isMicActive()) {
//   //         this.voiceService.speak('El micrófono está desactivado. Actívalo con "hola" o desde el botón de micrófono.');
//   //         return;
//   //       }
//   //       this.copyCodeFromClipboard();
//   //       return;
//   //     }

//   //     // Dictado: nueva contraseña
//   //     if (/^(contraseña|clave|password|pass|nueva contraseña)\b/.test(lower)) {
//   //       const rest = lower.replace(/^(contraseña|clave|password|pass|nueva contraseña)\s*/, '').trim();
//   //       this.startDictation('password', rest);
//   //       return;
//   //     }

//   //     // Dictado: confirmar contraseña
//   //     if (lower.includes('confirmar') || lower.includes('confirmar contraseña') ||
//   //         lower.includes('confirmar clave') || lower.includes('repetir contraseña')) {
//   //       this.startDictation('confirmPassword', '');
//   //       return;
//   //     }

//   //     // Guardar / Cambiar contraseña
//   //     if (lower.includes('guardar') || lower.includes('cambiar') || lower.includes('actualizar')) {
//   //       this.onSubmitNewPassword();
//   //       return;
//   //     }
//   //   }

//   //   // Limpiar todos los campos
//   //   if (lower.includes('limpiar todo') || lower.includes('borrar todo') || lower.includes('resetear')) {
//   //     this.clearAllFields();
//   //     return;
//   //   }

//   //   // Ayuda
//   //   if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
//   //     this.showHelp();
//   //     return;
//   //   }

//   //   console.log('🔍 ForgotPassword: comando no reconocido:', lower);
//   // }











//   private handleVoiceCommand(text: string): void {
//     if (this.isDestroyed) return;
//     const lower = text.toLowerCase().trim();

//     // ✅ Comandos compuestos que NO deben pasar por debounce
//     const bypassDebounceCommands = [
//       'pegar código', 'pegar codigo',
//       'copiar código', 'copiar codigo',
//       'rellenar código', 'rellenar codigo',
//       'escribir código', 'escribir codigo',
//       'leer código', 'leer codigo',
//       'dime el código', 'dime el codigo',
//       'dicta el código', 'dicta el codigo',
//       'léeme el código', 'leeme el codigo',
//       // ✅ Fragmentos sueltos de "leer código" (el motor de voz los emite por separado)
//       'leer', 'léeme', 'leeme', 'dime', 'dicta'
//     ];
//     const bypassDebounce = bypassDebounceCommands.some(cmd => lower.includes(cmd));

//     const now = Date.now();
//     if (!bypassDebounce &&
//         lower === this.lastProcessedCommand &&
//         (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//       console.log(`⏭️ ForgotPassword: comando duplicado ignorado: "${lower}"`);
//       return;
//     }
//     this.lastProcessedCommand = lower;
//     this.lastProcessedTime = now;

//     // ============================================================
//     // ✅ NUEVO: manejo de "leer código" fragmentado por el motor de voz
//     //    El motor emite "leer" y "código" como fragmentos separados.
//     //    Aquí reconstruimos la intención.
//     // ============================================================

//     // Si es "leer" suelto, marcar que esperamos "código"
//     if (lower === 'leer' || lower === 'léeme' || lower === 'leeme' ||
//         lower === 'dime' || lower === 'dicta') {
//       console.log('⏳ [ForgotPassword] "leer" suelto detectado, esperando "código"...');
//       this.pendingReadCode = Date.now();
//       return;
//     }

//     // Si hace <1.5s dijimos "leer" y ahora llega "código", es "leer código"
//     if (this.pendingReadCode && (Date.now() - this.pendingReadCode) < 1500) {
//       if (lower.includes('código') || lower.includes('codigo')) {
//         console.log('🔊 [ForgotPassword] "leer código" reconstruido desde fragmentos');
//         this.pendingReadCode = 0;
//         this.handleReadCodeByVoice();
//         return;
//       }
//       this.pendingReadCode = 0;
//     }

//     // ============================================================
//     // ✅ Comandos de código (portapapeles + lectura por voz)
//     //    ANTES de la prioridad de dictado, para que "código" fragmentado
//     //    no arranque dictado cuando en realidad el usuario quiere
//     //    "leer código" o "pegar código"
//     // ============================================================
//     if (this.emailSent() && !this.isFinished()) {

//       // ✅ NUEVO: leer código por voz (accesibilidad para invidentes)
//       if (lower.includes('leer código') || lower.includes('leer codigo') ||
//           lower.includes('dime el código') || lower.includes('dime el codigo') ||
//           lower.includes('dicta el código') || lower.includes('dicta el codigo') ||
//           lower.includes('léeme el código') || lower.includes('leeme el codigo')) {
//         console.log('🔊 [ForgotPassword] Comando leer código detectado');
//         this.handleReadCodeByVoice();
//         return;
//       }

//       // ✅ Comandos de portapapeles (pegar/copiar código)
//       if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
//           lower.includes('copiar código') || lower.includes('copiar codigo') ||
//           lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
//           lower.includes('escribir código') || lower.includes('escribir codigo')) {
//         console.log('📋 [ForgotPassword] Comando pegar/copiar código detectado (antes de dictado)');
//         if (this.dictationMode) {
//           this.stopDictation(undefined, true);
//         }
//         this.copyCodeFromClipboard();
//         return;
//       }
//     }

//     // ✅ Si el campo está vacío y dice "correo", iniciar dictado directo
//     if ((lower === 'correo' || lower === 'email' || lower === 'correo electrónico') && !this.emailSent()) {
//       const control = this.forgotPasswordForm.get('email');
//       const shouldStartDictation = (!control?.value || control.value.length === 0) &&
//                                   (!this.dictationMode || this.dictationTarget !== 'email');

//       if (shouldStartDictation) {
//         console.log(`🎤 [ForgotPassword] Campo "correo" vacío, iniciando dictado directo`);
//         if (this.dictationMode) {
//           this.stopDictation(undefined, true);
//         }
//         this.voiceService.speak('Dime tu correo electrónico. Di "fin" o "terminar" cuando hayas terminado.');
//         this.startDictation('email', '');
//         return;
//       } else if (this.dictationMode && this.dictationTarget === 'email') {
//         console.log(`⏭️ [ForgotPassword] Ya dictando "correo", ignorando comando`);
//         return;
//       }
//     }

//     // ✅ PRIORIDAD: Si estamos en modo dictado
//     if (this.dictationMode && this.dictationTarget) {
//       this.handleDictation(lower);
//       return;
//     }

//     // ============================================================
//     // COMANDO "LEER CAMPOS"
//     // ============================================================
//     if (lower.includes('leer campos') || lower.includes('leer todo') ||
//         lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
//         lower.includes('qué he escrito') || lower.includes('revisar campos') ||
//         lower.includes('comprobar campos') || lower.includes('ver campos')) {
//       console.log('📖 [ForgotPassword] Comando "leer campos" detectado');
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//       }
//       this.readAllFields();
//       return;
//     }

//     // ============================================================
//     // COMANDO "ESTADO" / "QUÉ FALTA"
//     // ============================================================
//     if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
//       console.log('📊 [ForgotPassword] Comando "estado" detectado');
//       if (this.dictationMode) {
//         this.stopDictation(undefined, true);
//       }
//       this.showStatus();
//       return;
//     }

//     // ✅ COMANDO VOLVER
//     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//       this.goBack();
//       return;
//     }

//     // ✅ COMANDO "INICIAR SESIÓN"
//     if (lower.includes('iniciar sesión') || lower.includes('ir a login') || lower.includes('login') || lower.includes('inicia sesión')) {
//       this.voiceService.clearTranscript();
//       this.voiceService.speak('Navegando a inicio de sesión.');
//       this.router.navigate(['/login']);
//       return;
//     }

//     // ✅ COMANDO BORRAR / LIMPIAR
//     if (lower.includes('borrar') || lower.includes('limpiar')) {
//       if (lower.includes('correo') || lower.includes('email')) {
//         this.clearField('email');
//         return;
//       }
//       if (lower.includes('código') || lower.includes('codigo')) {
//         this.clearField('code');
//         return;
//       }
//       if (lower.includes('confirmar')) {
//         this.clearField('confirmPassword');
//         return;
//       }
//       if (lower.includes('contraseña') || lower.includes('clave') || lower.includes('password')) {
//         this.clearField('password');
//         return;
//       }
//       this.clearCurrentField();
//       return;
//     }

//     // ============================================================
//     // PASO 1: SOLICITAR CORREO
//     // ============================================================
//     if (!this.emailSent()) {
//       if (/^(correo|email|correo electrónico)\b/.test(lower)) {
//         const rest = lower.replace(/^(correo|email|correo electrónico)\s*/, '').trim();
//         if (rest && rest.length > 0) {
//           this.startDictation('email', rest);
//         } else {
//           this.startDictation('email', '');
//         }
//         return;
//       }

//       if (lower.includes('enviar') || lower.includes('siguiente') || lower.includes('continuar')) {
//         this.onSubmitEmail();
//         return;
//       }
//     }

//     // ============================================================
//     // PASO 2: CÓDIGO + NUEVA CONTRASEÑA
//     //    ("leer código" y "pegar código" ya se comprobaron arriba)
//     // ============================================================
//     if (this.emailSent() && !this.isFinished()) {

//       // ✅ SOLO el dictado genérico de "código"
//       if (lower.includes('código') || lower.includes('codigo') || lower.includes('otp') || lower.includes('pin')) {
//         const control = this.resetPasswordForm.get('code');
//         const shouldStartDictation = (!control?.value || control.value.length === 0) &&
//                                     (!this.dictationMode || this.dictationTarget !== 'code');

//         if (shouldStartDictation) {
//           console.log(`🎤 [ForgotPassword] Campo "código" vacío, iniciando dictado directo`);
//           this.focusCodeInput();
//           setTimeout(() => this.startDictation('code', ''), 500);
//           return;
//         } else if (this.dictationMode && this.dictationTarget === 'code') {
//           console.log(`⏭️ [ForgotPassword] Ya dictando "código", ignorando comando`);
//           return;
//         }
//         return;
//       }

//       // Dictado: nueva contraseña
//       if (/^(contraseña|clave|password|pass|nueva contraseña)\b/.test(lower)) {
//         const rest = lower.replace(/^(contraseña|clave|password|pass|nueva contraseña)\s*/, '').trim();
//         this.startDictation('password', rest);
//         return;
//       }

//       // Dictado: confirmar contraseña
//       if (lower.includes('confirmar') || lower.includes('confirmar contraseña') ||
//           lower.includes('confirmar clave') || lower.includes('repetir contraseña')) {
//         this.startDictation('confirmPassword', '');
//         return;
//       }

//       // Guardar / Cambiar contraseña
//       if (lower.includes('guardar') || lower.includes('cambiar') || lower.includes('actualizar')) {
//         this.onSubmitNewPassword();
//         return;
//       }
//     }

//     // Limpiar todos los campos
//     if (lower.includes('limpiar todo') || lower.includes('borrar todo') || lower.includes('resetear')) {
//       this.clearAllFields();
//       return;
//     }

//     // Ayuda
//     if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
//       this.showHelp();
//       return;
//     }

//     console.log('🔍 ForgotPassword: comando no reconocido:', lower);
//   }




//   //
//   private handleReadCodeByVoice(): void {
//     if (this.dictationMode) {
//       this.stopDictation(undefined, true);
//     }

//     if (!this.availableCodeForVoice) {
//       this.voiceService.speak('Todavía no has solicitado el código. Di "enviar" para pedirlo.');
//       return;
//     }

//     const code = this.availableCodeForVoice;

//     this.resetPasswordForm.patchValue({ code });
//     this.resetPasswordForm.get('code')?.markAsDirty();
//     this.resetPasswordForm.get('code')?.markAsTouched();

//     const codeInput = this.codeInput()?.nativeElement;
//     if (codeInput) {
//       this.renderer.setProperty(codeInput, 'value', code);
//       codeInput.dispatchEvent(new Event('input', { bubbles: true }));
//     }

//     this.cdr.detectChanges();

//     this.voiceService.speak(
//       `Tu código de verificación es: ${this.spellDigits(code)}. ` +
//       `Ya está relleno. Ahora di "contraseña" para escribir tu nueva clave.`
//     );

//     setTimeout(() => {
//       this.newPassInput()?.nativeElement.focus({ preventScroll: true });
//     }, 1000);
//   }



//   // ============================================================
//   // MÉTODO DE ESTADO - PÚBLICO
//   // ============================================================
//   public showStatus(): void {
//     if (this.isDestroyed) return;

//     if (!this.emailSent()) {
//       const email = this.forgotPasswordForm.get('email')?.value || '';
//       if (!email || email.trim().length === 0) {
//         this.voiceService.speak('Falta tu correo electrónico. Di "correo" para escribirlo.');
//       } else {
//         this.voiceService.speak('Tu correo está completo. Di "enviar" para solicitar el código, o "leer campos" para escuchar lo que has escrito.');
//       }
//       return;
//     }

//     if (!this.isFinished()) {
//       const code = this.resetPasswordForm.get('code')?.value || '';
//       const password = this.resetPasswordForm.get('password')?.value || '';
//       const confirm = this.resetPasswordForm.get('confirmPassword')?.value || '';

//       const missingFields = [];
//       if (!code || code.trim().length === 0) missingFields.push('código');
//       if (!password || password.trim().length === 0) missingFields.push('contraseña');
//       if (!confirm || confirm.trim().length === 0) missingFields.push('confirmación');

//       if (missingFields.length === 0) {
//         this.voiceService.speak('Todos los campos están completos. Di "guardar" para cambiar tu contraseña, o "leer campos" para escuchar lo que has escrito.');
//       } else {
//         const fieldList = missingFields.map(f => `"${f}"`).join(', ');
//         this.voiceService.speak(`Faltan los campos: ${fieldList}. Di el nombre de uno para escribirlo.`);
//       }
//       return;
//     }

//     this.voiceService.speak('Ya actualizaste tu contraseña. Ve al login para iniciar sesión.');
//   }

//   // ============================================================
//   // DICTADO DE VOZ
//   // ============================================================
//   // ✅ NUEVO: firma con 'code'
//   private startDictation(target: 'email' | 'code' | 'password' | 'confirmPassword', initialText = ''): void {
//     if (this.isDestroyed) return;

//     if (this.dictationMode && this.dictationTarget === target) {
//       console.log(`⏭️ [ForgotPassword] Ya dictando "${target}", ignorando`);
//       return;
//     }

//     this.dictationMode = true;
//     this.dictationTarget = target;
//     this.dictationBuffer = '';

//     // ✅ NUEVO: añadido 'code'
//     const fieldNames: Record<string, string> = {
//       email: 'correo electrónico',
//       code: 'código de verificación',
//       password: 'contraseña',
//       confirmPassword: 'confirmación de contraseña'
//     };
//     const fieldName = fieldNames[target] || target;

//     this.updateFormAndInputDirectly(target, '');

//     if (initialText && initialText.trim().length > 0) {
//       let cleanedText = initialText;
//       if (target === 'email') {
//         cleanedText = this.cleanEmailText(initialText);
//       }
//       this.updateFormAndInputDirectly(target, cleanedText);
//       this.dictationBuffer = cleanedText.trimEnd();
//       this.voiceService.speak(`Dictando ${fieldName}. Texto inicial: ${cleanedText}`);
//     } else {
//       const finishWords = this.voiceFilter.getFinishWords().slice(0, 3).join('", "');

//       if (target === 'email') {
//         this.voiceService.speak(`Dime tu correo electrónico. Di "${finishWords}" cuando hayas terminado.`);
//       } else if (target === 'code') {
//         // ✅ NUEVO: mensaje para código
//         this.voiceService.speak(`Di los 6 dígitos del código. Di "${finishWords}" cuando hayas terminado.`);
//       } else if (target === 'password') {
//         this.voiceService.speak(`Dime tu nueva contraseña. Di "${finishWords}" cuando hayas terminado.`);
//       } else {
//         this.voiceService.speak(`Repite tu contraseña. Di "${finishWords}" cuando hayas terminado.`);
//       }
//     }

//     this.focusInput(target);
//     console.log(`🎤 Dictado activado para: ${target}`);
//   }

//   private cleanEmailText(text: string): string {
//     if (!text) return '';

//     let cleaned = text.replace(/\s+/g, '');
//     cleaned = cleaned.replace(/arroba/g, '@');
//     cleaned = cleaned.replace(/punto/g, '.');
//     cleaned = cleaned.replace(/\s*@\s*/g, '@');
//     cleaned = cleaned.replace(/\s*\.\s*/g, '.');
//     cleaned = cleaned.replace(/@@/g, '@');
//     cleaned = cleaned.replace(/\.\./g, '.');

//     cleaned = cleaned.replace(/^@+/, '');
//     cleaned = cleaned.replace(/^\.+/, '');
//     cleaned = cleaned.replace(/@+$/, '');
//     cleaned = cleaned.replace(/\.+$/, '');

//     return cleaned;
//   }

//   // private handleDictation(text: string): void {
//   //   if (this.isDestroyed || !this.dictationTarget) return;
//   //   const target = this.dictationTarget;
//   //   const currentValue = this.getCurrentValue(target);

//   //   console.log(`📝 [handleDictation] target: ${target}, currentValue: "${currentValue}", text: "${text}"`);

//   //   const lower = text.toLowerCase().trim();

//   //   if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//   //     console.log('🔙 [handleDictation] Comando "volver" detectado en dictado, ejecutando...');
//   //     this.stopDictation('', true);
//   //     this.goBack();
//   //     return;
//   //   }

//   //   if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
//   //     console.log('❓ [handleDictation] Comando "ayuda" detectado en dictado');
//   //     this.stopDictation('', true);
//   //     this.showHelp();
//   //     return;
//   //   }

//   //   if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
//   //     console.log('📊 [handleDictation] Comando "estado" detectado en dictado');
//   //     this.stopDictation('', true);
//   //     this.showStatus();
//   //     return;
//   //   }

//   //   if (lower.includes('leer campos') || lower === 'leer' || lower.includes('leer todo') ||
//   //       lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
//   //       lower.includes('qué he escrito') || lower.includes('revisar campos') ||
//   //       lower.includes('comprobar campos') || lower.includes('ver campos')) {
//   //     console.log('📖 [handleDictation] Comando "leer campos" detectado en dictado');
//   //     this.stopDictation('', true);
//   //     this.readAllFields();
//   //     return;
//   //   }

//   //   if (lower === 'borrar' || lower === 'limpiar' || lower.includes('borrar campo') || lower.includes('limpiar campo')) {
//   //     console.log('🧹 [handleDictation] Comando "borrar" detectado, limpiando campo');
//   //     this.updateFormAndInputDirectly(target, '');
//   //     this.dictationBuffer = '';
//   //     this.stopDictation('', true);
//   //     const fieldName = target === 'email' ? 'correo' : 'contraseña';
//   //     this.voiceService.speak(`Campo ${fieldName} limpiado. Di el nombre del campo para escribirlo.`);
//   //     return;
//   //   }

//   //   if (this.voiceFilter.containsFinishWords(text)) {
//   //     console.log('🔴 Comando de finalización');
//   //     const cleanText = this.voiceFilter.removeFinishWords(text);

//   //     let finalValue = this.dictationBuffer || currentValue;

//   //     if (cleanText.length > 0) {
//   //       console.log(`📝 Procesando: "${cleanText}"`);
//   //       const processed = this.voiceFilter.processDictationPhrase(cleanText, this.getDictationContext(target), false);
//   //       if (processed.success) {
//   //         let textToAdd = processed.text;
//   //         if (target === 'email') {
//   //           textToAdd = this.cleanEmailText(textToAdd);

//   //           this.updateFormAndInputDirectly(target, textToAdd);

//   //           const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   //           if (!emailPattern.test(textToAdd)) {
//   //             console.log(`❌ Email inválido: "${textToAdd}"`);
//   //             this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente o dictarlo de nuevo.');
//   //             this.dictationBuffer = '';
//   //             this.dictationMode = false;
//   //             this.dictationTarget = null;
//   //             this.dictationBuffer = '';
//   //             this.cdr.markForCheck();
//   //             return;
//   //           }
//   //         }
//   //         finalValue = textToAdd;
//   //         this.updateFormAndInputDirectly(target, finalValue);
//   //         this.dictationBuffer = processed.text.trimEnd();
//   //         console.log(`🔤 Reemplazado por: "${finalValue}"`);
//   //       }
//   //     } else {
//   //       console.log(`🔤 Sin texto nuevo, usando buffer: "${finalValue}"`);
//   //       if (finalValue && finalValue.length > 0) {
//   //         this.updateFormAndInputDirectly(target, finalValue);
//   //       }
//   //     }
//   //     this.stopDictation(finalValue);
//   //     return;
//   //   }

//   //   if (lower === 'fin' || lower === 'terminar') {
//   //     console.log('🔴 [ForgotPassword] Finalización directa');
//   //     const finalValue = this.dictationBuffer || currentValue;

//   //     if (target === 'email' && finalValue && finalValue.length > 0) {
//   //       this.updateFormAndInputDirectly(target, finalValue);

//   //       const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   //       if (!emailPattern.test(finalValue)) {
//   //         console.log(`❌ Email inválido al finalizar: "${finalValue}"`);
//   //         this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente o dictarlo de nuevo.');
//   //         this.dictationBuffer = '';
//   //         this.dictationMode = false;
//   //         this.dictationTarget = null;
//   //         this.dictationBuffer = '';
//   //         this.cdr.markForCheck();
//   //         return;
//   //       }
//   //     }

//   //     this.stopDictation(finalValue);
//   //     return;
//   //   }

//   //   if (text.includes('borrar') || text.includes('eliminar')) {
//   //     if (this.dictationBuffer.length > 0) {
//   //       const newValue = currentValue.slice(0, -this.dictationBuffer.length);
//   //       this.updateFormAndInputDirectly(target, newValue);
//   //       this.voiceService.speak(`Borrado: ${this.dictationBuffer.trim()}`);
//   //       this.dictationBuffer = '';
//   //       return;
//   //     } else {
//   //       const newValue = currentValue.slice(0, -1);
//   //       this.updateFormAndInputDirectly(target, newValue);
//   //       this.voiceService.speak('Borrado último carácter');
//   //       return;
//   //     }
//   //   }

//   //   if (text.includes('limpiar todo') || text.includes('borrar todo')) {
//   //     this.updateFormAndInputDirectly(target, '');
//   //     this.dictationBuffer = '';
//   //     this.voiceService.speak('Campo limpiado');
//   //     return;
//   //   }

//   //   if (text.includes('mostrar') || text.includes('ver') || text.includes('leer')) {
//   //     this.voiceService.speak(`Texto actual: ${currentValue || 'vacío'}`);
//   //     return;
//   //   }

//   //   const shouldCapitalize = target !== 'email';
//   //   let processed = this.voiceFilter.processDictationPhrase(text, this.getDictationContext(target), shouldCapitalize);

//   //   if (!processed.success || !processed.text) {
//   //     const word = text.trim();
//   //     const cleanWord = word.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
//   //     let finalWord = cleanWord;
//   //     if (shouldCapitalize && (currentValue === '' || currentValue.endsWith(' ')) && finalWord.length > 0) {
//   //       finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
//   //     }
//   //     processed = {
//   //       success: true,
//   //       text: finalWord + ' ',
//   //       originalText: text,
//   //       processedText: finalWord + ' '
//   //     } as any;
//   //     console.log(`🔤 Fallback: "${processed.text}"`);
//   //   }

//   //   let textToAdd = processed.text;
//   //   if (target === 'email') {
//   //     textToAdd = this.cleanEmailText(textToAdd);
//   //   }

//   //   this.dictationBuffer = textToAdd.trimEnd();
//   //   console.log(`🔤 Texto acumulado (no visible): "${this.dictationBuffer}"`);
//   // }











//   private handleDictation(text: string): void {
//     if (this.isDestroyed || !this.dictationTarget) return;
//     const target = this.dictationTarget;
//     const currentValue = this.getCurrentValue(target);

//     console.log(`📝 [handleDictation] target: ${target}, currentValue: "${currentValue}", text: "${text}"`);

//     const lower = text.toLowerCase().trim();

//     // ✅ NUEVO: si estamos dictando y dicen "pegar código", cancelar dictado y pegar
//     if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
//         lower.includes('copiar código') || lower.includes('copiar codigo') ||
//         lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
//         lower.includes('escribir código') || lower.includes('escribir codigo')) {
//       console.log('📋 [handleDictation] pegar/copiar código detectado → cancelando dictado');
//       this.stopDictation('', true);
//       this.copyCodeFromClipboard();
//       return;
//     }

//     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//       console.log('🔙 [handleDictation] Comando "volver" detectado en dictado, ejecutando...');
//       this.stopDictation('', true);
//       this.goBack();
//       return;
//     }

//     if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
//       console.log('❓ [handleDictation] Comando "ayuda" detectado en dictado');
//       this.stopDictation('', true);
//       this.showHelp();
//       return;
//     }

//     if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
//       console.log('📊 [handleDictation] Comando "estado" detectado en dictado');
//       this.stopDictation('', true);
//       this.showStatus();
//       return;
//     }

//     if (lower.includes('leer campos') || lower.includes('leer todo') ||
//         lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
//         lower.includes('qué he escrito') || lower.includes('revisar campos') ||
//         lower.includes('comprobar campos') || lower.includes('ver campos')) {
//       console.log('📖 [handleDictation] Comando "leer campos" detectado en dictado');
//       this.stopDictation('', true);
//       this.readAllFields();
//       return;
//     }

//     if (lower === 'borrar' || lower === 'limpiar' || lower.includes('borrar campo') || lower.includes('limpiar campo')) {
//       console.log('🧹 [handleDictation] Comando "borrar" detectado, limpiando campo');
//       this.updateFormAndInputDirectly(target, '');
//       this.dictationBuffer = '';
//       this.stopDictation('', true);
//       const fieldName = target === 'email' ? 'correo' : 'contraseña';
//       this.voiceService.speak(`Campo ${fieldName} limpiado. Di el nombre del campo para escribirlo.`);
//       return;
//     }

//     if (this.voiceFilter.containsFinishWords(text)) {
//       console.log('🔴 Comando de finalización');
//       const cleanText = this.voiceFilter.removeFinishWords(text);

//       let finalValue = this.dictationBuffer || currentValue;

//       if (cleanText.length > 0) {
//         console.log(`📝 Procesando: "${cleanText}"`);
//         const processed = this.voiceFilter.processDictationPhrase(cleanText, this.getDictationContext(target), false);
//         if (processed.success) {
//           let textToAdd = processed.text;
//           if (target === 'email') {
//             textToAdd = this.cleanEmailText(textToAdd);

//             this.updateFormAndInputDirectly(target, textToAdd);

//             const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//             if (!emailPattern.test(textToAdd)) {
//               console.log(`❌ Email inválido: "${textToAdd}"`);
//               this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente o dictarlo de nuevo.');
//               this.dictationBuffer = '';
//               this.dictationMode = false;
//               this.dictationTarget = null;
//               this.dictationBuffer = '';
//               this.cdr.markForCheck();
//               return;
//             }
//           }
//           finalValue = textToAdd;
//           this.updateFormAndInputDirectly(target, finalValue);
//           this.dictationBuffer = processed.text.trimEnd();
//           console.log(`🔤 Reemplazado por: "${finalValue}"`);
//         }
//       } else {
//         console.log(`🔤 Sin texto nuevo, usando buffer: "${finalValue}"`);
//         if (finalValue && finalValue.length > 0) {
//           this.updateFormAndInputDirectly(target, finalValue);
//         }
//       }
//       this.stopDictation(finalValue);
//       return;
//     }

//     if (lower === 'fin' || lower === 'terminar') {
//       console.log('🔴 [ForgotPassword] Finalización directa');
//       const finalValue = this.dictationBuffer || currentValue;

//       if (target === 'email' && finalValue && finalValue.length > 0) {
//         this.updateFormAndInputDirectly(target, finalValue);

//         const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//         if (!emailPattern.test(finalValue)) {
//           console.log(`❌ Email inválido al finalizar: "${finalValue}"`);
//           this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente o dictarlo de nuevo.');
//           this.dictationBuffer = '';
//           this.dictationMode = false;
//           this.dictationTarget = null;
//           this.dictationBuffer = '';
//           this.cdr.markForCheck();
//           return;
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

//     const shouldCapitalize = target !== 'email';
//     let processed = this.voiceFilter.processDictationPhrase(text, this.getDictationContext(target), shouldCapitalize);

//     if (!processed.success || !processed.text) {
//       const word = text.trim();
//       const cleanWord = word.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
//       let finalWord = cleanWord;
//       if (shouldCapitalize && (currentValue === '' || currentValue.endsWith(' ')) && finalWord.length > 0) {
//         finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
//       }
//       processed = {
//         success: true,
//         text: finalWord + ' ',
//         originalText: text,
//         processedText: finalWord + ' '
//       } as any;
//       console.log(`🔤 Fallback: "${processed.text}"`);
//     }

//     let textToAdd = processed.text;
//     if (target === 'email') {
//       textToAdd = this.cleanEmailText(textToAdd);
//     }

//     this.dictationBuffer = textToAdd.trimEnd();
//     console.log(`🔤 Texto acumulado (no visible): "${this.dictationBuffer}"`);
//   }





//   private stopDictation(finalValue?: string, silent = false): void {
//     if (this.isDestroyed) return;
//     console.log(`🔴 stopDictation (silent: ${silent})`);
//     const target = this.dictationTarget;

//     if (target) {
//       let value = finalValue !== undefined ? finalValue : this.dictationBuffer;

//       if (!value || value.length === 0) {
//         value = this.getCurrentValue(target);
//       }

//       value = value.trim();

//       if (value && value.length > 0) {
//         if (target === 'email') {
//           const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//           if (!emailPattern.test(value)) {
//             console.log(`❌ Email inválido en stopDictation: "${value}"`);
//             if (!silent) {
//               this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente.');
//             }
//             this.dictationBuffer = '';
//             this.dictationMode = false;
//             this.dictationTarget = null;
//             this.dictationBuffer = '';
//             this.cdr.markForCheck();
//             return;
//           }
//         }

//         this.updateFormAndInputDirectly(target, value);
//         if (!silent) {
//           if (target === 'email') {
//             const cleanEmail = this.cleanEmailText(value);
//             if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
//               this.voiceService.speak(`Correo guardado: ${cleanEmail}`);
//             } else {
//               this.voiceService.speak('Correo guardado correctamente.');
//             }
//           } else if (target === 'code') {
//             // ✅ NUEVO: mensaje para código
//             this.voiceService.speak(`Código completado: ${value}. Di "contraseña" para la nueva clave.`);
//           } else if (target === 'password') {
//             this.voiceService.speak(`Listo, contraseña completada.`);
//           } else {
//             this.voiceService.speak(`Listo, confirmación completada.`);
//           }
//         }
//       } else {
//         if (!silent) {
//           const fieldName =
//             target === 'email' ? 'el correo' :
//             target === 'code' ? 'el código' :
//             target === 'password' ? 'la contraseña' : 'la confirmación';
//           this.voiceService.speak(`No se reconoció ${fieldName}.`);
//         }
//       }
//     }

//     this.dictationMode = false;
//     this.dictationTarget = null;
//     this.dictationBuffer = '';
//     this.cdr.markForCheck();
//     console.log('🔴 Dictado finalizado');
//   }

//   private validatePasswordAfterDictation(password: string): void {
//     const control = this.resetPasswordForm.get('password');
//     if (control && control.invalid) {
//       const errors = this.getPasswordErrors();
//       this.updateFormAndInputDirectly('password', '');
//       this.dictationBuffer = '';

//       if (errors) {
//         this.voiceService.speak(`La contraseña no es válida: ${errors}. Voy a borrarla. Di "contraseña" para intentarlo de nuevo.`);
//       } else {
//         this.voiceService.speak('La contraseña no cumple con los requisitos. Voy a borrarla. Di "contraseña" para intentarlo de nuevo.');
//       }
//       setTimeout(() => {
//         this.startDictation('password', '');
//       }, 500);
//       return;
//     } else if (control && control.valid) {
//       this.voiceService.speak('Contraseña válida. Ahora di "confirmar" para repetirla, o "guardar" para cambiar tu contraseña.');
//       setTimeout(() => {
//         this.focusInput('confirmPassword');
//       }, 500);
//     }
//   }

//   private validateConfirmPasswordAfterDictation(): void {
//     const control = this.resetPasswordForm.get('confirmPassword');
//     if (control && control.invalid) {
//       const errors = this.getConfirmPasswordErrors();
//       this.updateFormAndInputDirectly('confirmPassword', '');
//       this.dictationBuffer = '';

//       if (errors) {
//         this.voiceService.speak(`Error: ${errors}. Voy a borrar el campo. Di "confirmar" para intentarlo de nuevo.`);
//       } else {
//         this.voiceService.speak('La confirmación no coincide con la contraseña. Voy a borrar el campo. Di "confirmar" para intentarlo de nuevo.');
//       }
//       setTimeout(() => {
//         this.startDictation('confirmPassword', '');
//       }, 500);
//       return;
//     } else if (control && control.valid) {
//       this.voiceService.speak('Confirmación correcta. Di "guardar" para cambiar tu contraseña.');
//     }
//   }

//   private getPasswordErrors(): string | null {
//     const ctrl = this.resetPasswordForm.get('password');
//     if (!ctrl) return null;
//     const value = ctrl.value || '';
//     if (ctrl.hasError('required')) return 'La contraseña es obligatoria.';
//     if (ctrl.hasError('minlength')) {
//       return `Debe tener al menos 9 caracteres. Tiene ${value.length}.`;
//     }
//     if (ctrl.hasError('pattern')) {
//       return 'Debe incluir mayúscula, minúscula, número y símbolo.';
//     }
//     return null;
//   }

//   private getConfirmPasswordErrors(): string | null {
//     const ctrl = this.resetPasswordForm.get('confirmPassword');
//     if (!ctrl) return null;
//     if (ctrl.hasError('required')) return 'Es obligatorio confirmar la contraseña.';
//     if (this.resetPasswordForm.hasError('passwordsMismatch')) {
//       return 'La confirmación no coincide con la contraseña.';
//     }
//     return null;
//   }

//   private getCurrentValue(target: string): string {
//     if (target === 'email') {
//       return this.forgotPasswordForm.get('email')?.value || '';
//     }
//     return this.resetPasswordForm.get(target)?.value || '';
//   }

//   // ✅ NUEVO: incluye 'code'
//   private getDictationContext(target: string): 'email' | 'password' | 'text' {
//     const map: Record<string, 'email' | 'password' | 'text'> = {
//       email: 'email',
//       code: 'text',
//       password: 'password',
//       confirmPassword: 'password'
//     };
//     return map[target] || 'text';
//   }

//   private updateFormAndInputDirectly(target: string, value: string): void {
//     if (this.isDestroyed) return;
//     const control = target === 'email'
//       ? this.forgotPasswordForm.get('email')
//       : this.resetPasswordForm.get(target);
//     if (!control) return;

//     control.setValue(value, { emitEvent: true });
//     control.markAsDirty();
//     control.markAsTouched();

//     const ionInput = this.getIonInput(target);
//     if (ionInput) {
//       ionInput.value = value;
//     }

//     control.updateValueAndValidity({ emitEvent: true });
//     this.cdr.markForCheck();
//   }

//   private focusInput(target: string): void {
//     if (this.isDestroyed) return;
//     const ionInput = this.getIonInput(target);
//     if (ionInput) {
//       setTimeout(() => {
//         if (!this.isDestroyed && ionInput) {
//           ionInput.setFocus();
//           this.cdr.markForCheck();
//         }
//       }, 100);
//     }
//   }

//   // ============================================================
//   // FOCO ROBUSTO PARA CÓDIGO (con fallback)
//   // ============================================================
//   private focusCodeInput(): void {
//     if (this.isDestroyed) return;

//     setTimeout(() => {
//       if (this.isDestroyed) return;

//       const ionInput = this.codeInput()?.nativeElement;
//       if (ionInput) {
//         console.log('🎯 [ForgotPassword] codeInput encontrado por viewChild');
//         ionInput.setFocus()
//           .then(() => {
//             console.log('✅ [ForgotPassword] Foco aplicado al campo código');
//             this.voiceService.speak('Campo de código enfocado. Di los 6 dígitos, o di "copiar código" si lo tienes en el portapapeles.');
//           })
//           .catch((err: any) => {
//             console.warn('⚠️ Falló setFocus del código, probando fallback', err);
//             this.focusCodeFallback();
//           });
//         return;
//       }

//       console.log('⚠️ codeInput no disponible, usando fallback');
//       this.focusCodeFallback();
//     }, 300);
//   }

//   private focusCodeFallback(): void {
//     if (this.isDestroyed) return;

//     const inputEl = document.querySelector('ion-input[formControlName="code"]') as any;
//     if (inputEl?.setFocus) {
//       inputEl.setFocus()
//         .then(() => {
//           console.log('✅ [ForgotPassword] Foco aplicado por querySelector');
//           this.voiceService.speak('Campo de código enfocado.');
//         })
//         .catch((err: any) => {
//           console.warn('⚠️ Falló querySelector setFocus', err);
//           this.voiceService.speak('No se pudo enfocar el campo de código. Tócalo con el dedo.');
//         });
//     } else {
//       console.warn('❌ No se encontró ion-input[formControlName="code"]');
//       this.voiceService.speak('No se pudo enfocar el campo de código.');
//     }
//   }

//   // ============================================================
//   // FOCO ROBUSTO PARA EMAIL (con fallback)
//   // ============================================================
//   private focusEmailRobusto(): void {
//     if (this.isDestroyed) return;

//     const ionInput = this.emailInput()?.nativeElement;
//     if (ionInput) {
//       console.log('🎯 [ForgotPassword] emailInput encontrado por viewChild');
//       ionInput.setFocus()
//         .then(() => console.log('✅ [ForgotPassword] Foco aplicado por viewChild'))
//         .catch((err: any) => {
//           console.warn('⚠️ [ForgotPassword] Falló setFocus, probando fallback', err);
//           this.focusEmailFallback();
//         });
//       return;
//     }

//     console.log('⚠️ [ForgotPassword] emailInput no disponible, usando fallback');
//     this.focusEmailFallback();
//   }

//   private focusEmailFallback(): void {
//     if (this.isDestroyed) return;

//     const inputEl = document.querySelector('ion-input[formControlName="email"]') as any;
//     if (inputEl?.setFocus) {
//       inputEl.setFocus()
//         .then(() => console.log('✅ [ForgotPassword] Foco aplicado por querySelector'))
//         .catch((err: any) => console.warn('⚠️ [ForgotPassword] Falló querySelector setFocus', err));
//     } else {
//       console.warn('❌ [ForgotPassword] No se encontró ion-input[formControlName="email"]');
//     }
//   }

//   // ============================================================
//   // MÉTODOS DE LIMPIEZA
//   // ============================================================
//   private clearField(target: string): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) {
//       this.stopDictation(undefined, true);
//     }

//     const fieldName = this.getFieldName(target);
//     const control = target === 'email'
//       ? this.forgotPasswordForm.get('email')
//       : this.resetPasswordForm.get(target);

//     if (!control) return;

//     const currentValue = control.value || '';
//     if (!currentValue) {
//       if (target === 'email') {
//         this.voiceService.speak('El correo ya está vacío. Di "correo" para escribirlo.');
//       } else {
//         this.voiceService.speak(`El campo ${fieldName} ya está vacío. Di el nombre del campo para escribirlo.`);
//       }
//       this.focusInput(target);
//       return;
//     }

//     control.setValue('', { emitEvent: true });
//     control.markAsPristine();
//     control.markAsUntouched();
//     this.errorMessage.set(null);
//     this.dictationBuffer = '';

//     this.updateFormAndInputDirectly(target, '');
//     this.cdr.markForCheck();

//     if (target === 'email') {
//       this.voiceService.speak('Correo borrado. Di "correo" para escribirlo de nuevo.');
//     } else {
//       this.voiceService.speak(`Campo ${fieldName} borrado. Di el nombre del campo para escribirlo.`);
//     }
//     this.focusInput(target);
//   }

//   private clearAllFields(): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) this.stopDictation(undefined, true);

//     if (!this.emailSent()) {
//       const email = this.forgotPasswordForm.get('email')?.value || '';
//       if (!email) {
//         this.voiceService.speak('El correo ya está vacío.');
//         return;
//       }
//       this.forgotPasswordForm.patchValue({ email: '' });
//       this.forgotPasswordForm.markAsPristine();
//       this.forgotPasswordForm.markAsUntouched();
//       this.errorMessage.set(null);
//       this.voiceService.speak('Correo borrado. Di "correo" para escribirlo.');
//       this.focusInput('email');
//     } else if (!this.isFinished()) {
//       const code = this.resetPasswordForm.get('code')?.value || '';
//       const password = this.resetPasswordForm.get('password')?.value || '';
//       const confirm = this.resetPasswordForm.get('confirmPassword')?.value || '';

//       if (!code && !password && !confirm) {
//         this.voiceService.speak('Los campos ya están vacíos.');
//         return;
//       }

//       this.resetPasswordForm.patchValue({ code: '', password: '', confirmPassword: '' });
//       this.resetPasswordForm.markAsPristine();
//       this.resetPasswordForm.markAsUntouched();
//       this.errorMessage.set(null);
//       this.voiceService.speak('Todos los campos borrados. Di "código" para el código, "contraseña" para la nueva clave.');
//       this.focusInput('code');
//     }
//     this.cdr.markForCheck();
//   }

//   private clearCurrentField(): void {
//     if (this.isDestroyed) return;

//     if (this.dictationMode && this.dictationTarget) {
//       const target = this.dictationTarget;
//       this.updateFormAndInputDirectly(target, '');
//       this.dictationBuffer = '';
//       this.voiceService.speak(`Campo ${this.getFieldName(target)} borrado.`);
//       this.focusInput(target);
//       return;
//     }

//     const activeElement = document.activeElement as HTMLElement;
//     if (!activeElement) {
//       this.voiceService.speak('No hay un campo activo para borrar.');
//       return;
//     }

//     const isFocused = (inputRef: ElementRef<HTMLIonInputElement> | undefined): boolean => {
//       const el = inputRef?.nativeElement;
//       if (!el) return false;
//       return el === activeElement || el.contains(activeElement);
//     };

//     let target: string | null = null;
//     if (isFocused(this.emailInput())) target = 'email';
//     else if (isFocused(this.codeInput())) target = 'code';
//     else if (isFocused(this.newPassInput())) target = 'password';
//     else if (isFocused(this.confirmPassInput())) target = 'confirmPassword';

//     if (!target) {
//       // Determinar campos disponibles según el paso actual
//       const campos = this.getCamposDisponiblesDelPaso();

//       if (campos.length === 0) {
//         this.voiceService.speak('No hay campos para borrar en este paso.');
//         return;
//       }

//       if (campos.length === 1) {
//         // ✅ clearField ya emite su propio mensaje ("Correo borrado. Di...")
//         //    No duplicar el speak aquí
//         this.clearField(campos[0].key);
//         return;
//       }

//       const nombres = campos.map(c => `"${c.nombre}"`).join(', ');
//       this.voiceService.speak(`¿Qué campo quieres borrar? Puedes decir ${nombres}.`);
//       return;
//     }

//     this.clearField(target);
//   }

//   //
//   private getFieldName(target: string): string {
//     const map: Record<string, string> = {
//       email: 'correo',
//       code: 'código de verificación',
//       password: 'nueva contraseña',
//       confirmPassword: 'confirmación de contraseña'
//     };
//     return map[target] || target;
//   }

//   //
//   private getCamposDisponiblesDelPaso(): { key: string; nombre: string }[] {
//     // PASO 1: solo correo
//     if (!this.emailSent()) {
//       return [{ key: 'email', nombre: 'correo' }];
//     }

//     // PASO 3: no hay campos
//     if (this.isFinished()) {
//       return [];
//     }

//     // PASO 2: código + contraseña + confirmación
//     return [
//       { key: 'code',            nombre: 'código' },
//       { key: 'password',        nombre: 'contraseña' },
//       { key: 'confirmPassword', nombre: 'confirmación de contraseña' }
//     ];
//   }

//   // ============================================================
//   // ACCIONES DEL FORMULARIO - PÚBLICOS
//   // ============================================================
//   public goBack(): void {
//     if (this.isDestroyed) return;

//     if (this.dictationMode) {
//       this.stopDictation(undefined, true);
//     }

//     if (this.isFinished()) {
//       this.voiceService.speak('Volviendo al inicio de sesión.');
//       this.router.navigate(['/login']);
//       return;
//     }

//     if (this.emailSent()) {
//       this.emailSent.set(false);
//       this.errorMessage.set(null);
//       this.resetPasswordForm.reset();
//       this.voiceService.speak('Volviendo al paso de correo.');
//       setTimeout(() => this.focusInput('email'), 300);
//       return;
//     }

//     this.voiceService.speak('Volviendo al inicio de sesión.');
//     this.router.navigate(['/login']);
//   }

//   public showHelp(): void {
//     if (this.helpShown) return;
//     this.helpShown = true;

//     if (this.voiceService.isCurrentlyMuted()) {
//       this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
//       setTimeout(() => { this.helpShown = false; }, 5000);
//       return;
//     }

//     if (this.isFinished()) {
//       this.voiceService.speak('Tu contraseña ya fue actualizada. Puedes iniciar sesión.');
//     } else if (!this.emailSent()) {
//       this.voiceService.speak(this.HELP_MESSAGE_STEP_1);
//     } else {
//       this.voiceService.speak(this.HELP_MESSAGE_STEP_2);
//     }

//     setTimeout(() => { this.helpShown = false; }, 8000);
//   }

//   // ============================================================
//   // MÉTODOS ORIGINALES - PÚBLICOS
//   // ============================================================
//   private passwordMatchValidator(control: AbstractControl) {
//     const password = control.get('password')?.value;
//     const confirmPassword = control.get('confirmPassword')?.value;
//     return confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
//   }

//   public togglePassword(): void {
//     this.hidePassword.update(v => !v);
//   }

//   // public onSubmitEmail(): void {
//   //   if (this.forgotPasswordForm.invalid) {
//   //     this.forgotPasswordForm.markAllAsTouched();
//   //     this.focusInput('email');

//   //     let msg = 'El correo es obligatorio y debe tener un formato válido.';
//   //     const emailControl = this.forgotPasswordForm.get('email');
//   //     if (emailControl?.hasError('required')) {
//   //       msg = 'El correo electrónico es obligatorio.';
//   //     } else if (emailControl?.hasError('invalidEmail')) {
//   //       msg = 'El formato del correo electrónico no es válido. Debe incluir un arroba y un dominio.';
//   //     }

//   //     this.errorMessage.set(msg);
//   //     this.voiceService.speak(msg);
//   //     this.cdr.markForCheck();
//   //     return;
//   //   }

//   //   if (this.isLoading()) return;

//   //   this.isLoading.set(true);
//   //   this.errorMessage.set(null);
//   //   this.voiceService.speak('Validando correo electrónico...');

//   //   const email = this.forgotPasswordForm.value.email;
//   //   console.log('📤 Enviando correo para recuperación:', email);

//   //   this.authService.forgotPassword(email)
//   //     .pipe(finalize(() => {
//   //       this.isLoading.set(false);
//   //       this.cdr.markForCheck();
//   //     }))
//   //     .subscribe({
//   //       next: (response) => {
//   //         console.log('✅ Respuesta del backend:', response);

//   //         if (response && typeof response === 'object') {
//   //           if (response.success === false || response.error === true) {
//   //             const errorMsg = response.message || 'Ha ocurrido un error.';
//   //             console.log('🔴 Error en la respuesta:', errorMsg);
//   //             this.errorMessage.set(errorMsg);
//   //             this.voiceService.speak(errorMsg);
//   //             this.focusInput('email');
//   //             this.cdr.markForCheck();
//   //             return;
//   //           }

//   //           if (response.message &&
//   //               (response.message.toLowerCase().includes('no registrado') ||
//   //                response.message.toLowerCase().includes('not found') ||
//   //                response.message.toLowerCase().includes('no existe'))) {
//   //             console.log('🔴 Correo no registrado:', response.message);
//   //             const msg = 'El correo electrónico no está registrado. Verifica que lo has escrito correctamente.';
//   //             this.errorMessage.set(msg);
//   //             this.voiceService.speak(msg);
//   //             this.focusInput('email');
//   //             this.cdr.markForCheck();
//   //             return;
//   //           }
//   //         }

//   //         this.emailSent.set(true);
//   //         this.voiceService.speak('Código enviado a tu correo. Revisa tu bandeja de entrada o spam.');
//   //         setTimeout(() => {
//   //           this.focusInput('code');
//   //         }, 500);
//   //       },
//   //       error: (err) => {
//   //         console.log('🔴 Error HTTP:', err);

//   //         let msg = 'El correo electrónico no está registrado. Verifica que lo has escrito correctamente.';

//   //         if (err && typeof err === 'object') {
//   //           if (err.message) {
//   //             msg = err.message;
//   //           } else if (err.error && typeof err.error === 'object' && err.error.message) {
//   //             msg = err.error.message;
//   //           }
//   //         }

//   //         console.log('🔴 Mensaje final de error:', msg);
//   //         this.errorMessage.set(msg);
//   //         this.voiceService.speak(msg);
//   //         this.focusInput('email');
//   //         this.cdr.markForCheck();
//   //       }
//   //     });
//   // }







//   public onSubmitEmail(): void {
//     if (this.forgotPasswordForm.invalid) {
//       this.forgotPasswordForm.markAllAsTouched();
//       this.focusInput('email');

//       let msg = 'El correo es obligatorio y debe tener un formato válido.';
//       const emailControl = this.forgotPasswordForm.get('email');
//       if (emailControl?.hasError('required')) {
//         msg = 'El correo electrónico es obligatorio.';
//       } else if (emailControl?.hasError('invalidEmail')) {
//         msg = 'El formato del correo electrónico no es válido. Debe incluir un arroba y un dominio.';
//       }

//       this.errorMessage.set(msg);
//       this.voiceService.speak(msg);
//       this.cdr.markForCheck();
//       return;
//     }

//     if (this.isLoading()) return;

//     this.isLoading.set(true);
//     this.errorMessage.set(null);
//     this.voiceService.speak('Validando correo electrónico...');

//     const email = this.forgotPasswordForm.value.email;
//     console.log('📤 Enviando correo para recuperación:', email);

//     this.authService.forgotPassword(email)
//       .pipe(finalize(() => {
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       }))
//       .subscribe({
//         next: (response) => {
//           console.log('✅ Respuesta del backend:', response);

//           if (response && typeof response === 'object') {
//             if (response.success === false || response.error === true) {
//               const errorMsg = response.message || 'Ha ocurrido un error.';
//               console.log('🔴 Error en la respuesta:', errorMsg);
//               this.errorMessage.set(errorMsg);
//               this.voiceService.speak(errorMsg);
//               this.focusInput('email');
//               this.cdr.markForCheck();
//               return;
//             }

//             if (response.message &&
//                 (response.message.toLowerCase().includes('no registrado') ||
//                 response.message.toLowerCase().includes('not found') ||
//                 response.message.toLowerCase().includes('no existe'))) {
//               console.log('🔴 Correo no registrado:', response.message);
//               const msg = 'El correo electrónico no está registrado. Verifica que lo has escrito correctamente.';
//               this.errorMessage.set(msg);
//               this.voiceService.speak(msg);
//               this.focusInput('email');
//               this.cdr.markForCheck();
//               return;
//             }
//           }

//           // ✅ DIAGNÓSTICO: imprimir el tipo y las claves del response
//           console.log('🔍 [ForgotPassword] Tipo de response:', typeof response);
//           console.log('🔍 [ForgotPassword] Claves del response:', response ? Object.keys(response as any) : 'null');
//           console.log('🔍 [ForgotPassword] response.code:', (response as any)?.code);
//           console.log('🔍 [ForgotPassword] JSON response:', JSON.stringify(response));

//           // ✅ NUEVO: capturar el código si el backend lo devuelve
//           const codeFromBackend =
//             (response as any)?.code ||
//             (response as any)?.otp ||
//             (response as any)?.verificationCode ||
//             null;

//           if (codeFromBackend) {
//             this.availableCodeForVoice = String(codeFromBackend).trim();
//             console.log('🎯 [ForgotPassword] Código capturado para lectura por voz:', this.availableCodeForVoice);
//           } else {
//             this.availableCodeForVoice = null;
//             console.warn('⚠️ [ForgotPassword] NO se encontró campo code en la respuesta');
//           }

//           this.emailSent.set(true);

//           // ✅ Mensaje que cubre ambos canales (correo tradicional + voz)
//           if (this.availableCodeForVoice) {
//             this.voiceService.speak(
//               'Código enviado a tu correo. ' +
//               'Puedes revisar tu correo y copiarlo, o decir "leer código" para que te lo lea en voz alta.'
//             );
//           } else {
//             this.voiceService.speak(
//               'Código enviado a tu correo. Revisa tu bandeja de entrada o spam.'
//             );
//           }

//           setTimeout(() => {
//             this.focusInput('code');
//           }, 500);
//         },
//         error: (err) => {
//           console.log('🔴 Error HTTP:', err);

//           let msg = 'El correo electrónico no está registrado. Verifica que lo has escrito correctamente.';

//           if (err && typeof err === 'object') {
//             if (err.message) {
//               msg = err.message;
//             } else if (err.error && typeof err.error === 'object' && err.error.message) {
//               msg = err.error.message;
//             }
//           }

//           console.log('🔴 Mensaje final de error:', msg);
//           this.errorMessage.set(msg);
//           this.voiceService.speak(msg);
//           this.focusInput('email');
//           this.cdr.markForCheck();
//         }
//       });
//   }




//   public onSubmitNewPassword(): void {
//     if (this.isDestroyed) return;
//     if (this.isLoading()) return;

//     this.resetPasswordForm.markAllAsTouched();

//     const codeCtrl = this.resetPasswordForm.get('code');
//     const passwordCtrl = this.resetPasswordForm.get('password');
//     const confirmCtrl = this.resetPasswordForm.get('confirmPassword');

//     if (this.resetPasswordForm.invalid) {
//       let errorMessages: string[] = [];

//       if (codeCtrl?.hasError('required')) {
//         errorMessages.push('El código de verificación es obligatorio.');
//       }
//       if (codeCtrl?.hasError('minlength')) {
//         errorMessages.push('El código debe tener 6 dígitos.');
//       }
//       if (passwordCtrl?.hasError('required')) {
//         errorMessages.push('La contraseña es obligatoria.');
//       }
//       if (passwordCtrl?.hasError('minlength')) {
//         errorMessages.push('La contraseña debe tener al menos 9 caracteres.');
//       }
//       if (passwordCtrl?.hasError('pattern')) {
//         errorMessages.push('La contraseña debe incluir mayúscula, minúscula, número y símbolo.');
//       }
//       if (confirmCtrl?.hasError('required')) {
//         errorMessages.push('Debes confirmar la contraseña.');
//       }
//       if (this.resetPasswordForm.hasError('passwordsMismatch') && confirmCtrl?.dirty) {
//         errorMessages.push('Las contraseñas no coinciden.');
//       }

//       let voiceMsg = 'El formulario contiene errores. ';
//       if (errorMessages.length === 1) {
//         voiceMsg += errorMessages[0];
//       } else if (errorMessages.length === 2) {
//         voiceMsg += errorMessages[0] + ' Y ' + errorMessages[1];
//       } else if (errorMessages.length > 2) {
//         const last = errorMessages.pop();
//         voiceMsg += errorMessages.join(' ') + ' Y ' + last;
//       }
//       voiceMsg += ' Revisa los campos resaltados.';

//       this.errorMessage.set(voiceMsg);
//       this.voiceService.speak(voiceMsg);

//       if (codeCtrl?.invalid) {
//         setTimeout(() => this.focusInput('code'), 500);
//       } else if (passwordCtrl?.invalid) {
//         setTimeout(() => this.focusInput('password'), 500);
//       } else if (confirmCtrl?.invalid) {
//         setTimeout(() => this.focusInput('confirmPassword'), 500);
//       }

//       this.cdr.markForCheck();
//       return;
//     }

//     const code = this.resetPasswordForm.value.code;
//     if (!code || code.trim().length === 0) {
//       const msg = 'Falta el código de verificación. Revisa tu correo y di "código" para introducirlo.';
//       this.errorMessage.set(msg);
//       this.voiceService.speak(msg);
//       this.focusInput('code');
//       this.cdr.markForCheck();
//       return;
//     }

//     this.isLoading.set(true);
//     this.errorMessage.set(null);
//     this.voiceService.speak('Actualizando contraseña...');

//     const payload = {
//       email: this.forgotPasswordForm.value.email,
//       code: this.resetPasswordForm.value.code,
//       newPassword: this.resetPasswordForm.value.password,
//       confirmPassword: this.resetPasswordForm.value.confirmPassword
//     };

//     console.log('🔍 [ForgotPassword] Payload a enviar:', JSON.stringify({
//       email: payload.email,
//       code: payload.code,
//       newPassword: payload.newPassword ? `[${payload.newPassword.length} chars]` : 'VACÍO',
//       confirmPassword: payload.confirmPassword ? `[${payload.confirmPassword.length} chars]` : 'VACÍO'
//     }, null, 2));

//     this.authService.resetPassword(payload)
//       .pipe(finalize(() => {
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       }))
//       .subscribe({
//         next: () => {
//           this.isFinished.set(true);
//           this.voiceService.speak('¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.');
//           console.log('✅ Contraseña actualizada correctamente');
//         },
//         error: (err) => {
//           console.log('🔴 [ForgotPassword] Error reset-password:', err);

//           let msg = 'Código inválido o expirado. Inténtalo de nuevo.';

//           if (err?.status === 0) {
//             msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
//           } else if (err?.status === 400) {
//             msg = err.message || 'Los datos enviados no son válidos. Verifica el código y la contraseña.';
//           } else if (err?.status === 401 || err?.status === 403) {
//             msg = 'El código de verificación no es válido o ha expirado. Solicita uno nuevo.';
//           } else if (err?.status === 500) {
//             msg = 'Error en el servidor. Inténtalo más tarde.';
//           } else if (err?.message) {
//             msg = err.message;
//           } else if (err?.error?.message) {
//             msg = err.error.message;
//           }

//           this.errorMessage.set(msg);
//           this.voiceService.speak(msg);
//           this.focusInput('code');
//         }
//       });
//   }

//   // ============================================================
//   // DESTRUCCIÓN
//   // ============================================================
//   ngOnDestroy(): void {
//     console.log('🧹 ForgotPasswordComponent destruido');

//     this.mutedSubscription?.unsubscribe();

//     this.isDestroyed = true;

//     if (this.voiceFeedbackSubscription) {
//       this.voiceFeedbackSubscription.unsubscribe();
//       this.voiceFeedback$.complete();
//     }

//     if (this.dictationMode) {
//       this.stopDictation(undefined, true);
//     }

//     this.destroy$.next();
//     this.destroy$.complete();
//     this.voiceContext.resetContext();
//     window.speechSynthesis.cancel();

//     this.fieldCleanup.unregisterField('email');
//     this.fieldCleanup.unregisterField('code');
//     this.fieldCleanup.unregisterField('password');
//     this.fieldCleanup.unregisterField('confirmPassword');

//     this.dictationMode = false;
//     this.dictationTarget = null;
//     this.dictationBuffer = '';
//   }
// }













// src/app/features/auth/forgot-password/forgot-password.component.ts
import {
  Component,
  signal,
  effect,
  viewChild,
  ElementRef,
  inject,
  OnDestroy,
  ChangeDetectorRef,
  Renderer2,
  OnInit,
  NgZone,
  ChangeDetectionStrategy
} from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { finalize, Subject, Subscription, takeUntil, debounceTime } from 'rxjs';

// ✅ IONIC standalone imports
import {
  IonContent,
  IonItem,
  IonInput,
  IonIcon,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/angular';

// ✅ iconos de ionicons
import { addIcons } from 'ionicons';
import {
  mailOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  keyOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  clipboardOutline,
} from 'ionicons/icons';

// ✅ Directivas locales
import { AutoFocusDirective } from '../../../../../shared/directives/auto-focus.directive';
import { DisableAutofillDirective } from '../../../../../shared/directives/disable-autofill.directive';

import { emailValidator } from '../../../../../shared/validators/validators';
import { AuthService } from '../../../Services/auth-service';
import { VoiceCommandHandlerService } from '../../../../services/voz/voice-command-handler.service';
import { VoiceContextService } from '../../../../services/voz/voice-context.service';
import { VoiceFilterService } from '../../../../services/voz/voice-filter.service';
import { VoiceService } from '../../../../services/voz/voice.service';
import { FieldCleanupService } from '../../../../services/voz/field-cleanup.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonIcon,
    IonButton,
    IonText,
    IonSpinner,
  ],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);

  // Servicios de voz
  private readonly voiceService = inject(VoiceService);
  private readonly voiceHandler = inject(VoiceCommandHandlerService);
  private readonly voiceContext = inject(VoiceContextService);
  private readonly voiceFilter = inject(VoiceFilterService);
  private readonly fieldCleanup = inject(FieldCleanupService);

  // Feedback de voz con debounce
  private voiceFeedback$ = new Subject<string>();
  private voiceFeedbackSubscription?: Subscription;

  // ✅ Referencias a inputs (ion-input de Ionic)
  readonly emailInput       = viewChild<ElementRef<HTMLIonInputElement>>('emailInput');
  readonly codeInput        = viewChild<ElementRef<HTMLIonInputElement>>('codeInput');
  readonly newPassInput     = viewChild<ElementRef<HTMLIonInputElement>>('newPassInput');
  readonly confirmPassInput = viewChild<ElementRef<HTMLIonInputElement>>('confirmPassInput');

  // Formularios
  readonly forgotPasswordForm: FormGroup;
  readonly resetPasswordForm: FormGroup;

  // Estados
  readonly emailSent = signal(false);
  readonly isFinished = signal(false);
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly errorMessage = signal<string | null>(null);

  private isDestroyed = false;
  private welcomeShown = false;
  private destroy$ = new Subject<void>();

  // Estado del dictado — ✅ NUEVO: incluye 'code'
  private dictationMode = false;
  private dictationTarget: 'email' | 'code' | 'password' | 'confirmPassword' | null = null;
  private dictationBuffer = '';
  private helpShown = false;

  // Control de duplicados
  private lastProcessedCommand = '';
  private lastProcessedTime = 0;
  private readonly COMMAND_DEBOUNCE = 800;

  private lastPasteAttempt = 0;
  private readonly PASTE_DEBOUNCE = 1500;

  // Referencias para autofoco
  readonly btnSubmitEmail = viewChild<ElementRef<HTMLButtonElement>>('btnSubmit');
  readonly btnSubmitPass  = viewChild<ElementRef<HTMLButtonElement>>('btnSubmitPass');

  // ✅ Señal para saber si el micrófono está activo
  readonly isMicActive = signal<boolean>(!this.voiceService.isCurrentlyMuted());
  private mutedSubscription?: Subscription;

  // Mensajes con lenguaje natural
  private readonly WELCOME_MESSAGE =
    'Bienvenido a recuperación de contraseña. Di "correo" para escribir tu correo electrónico, ' +
    '"enviar" para solicitar el código, ' +
    '"leer campos" para escuchar lo que has escrito, ' +
    '"volver" para regresar, ' +
    '"iniciar sesión" para ir a la pantalla de inicio de sesión, ' +
    'o "ayuda" para más opciones.';

  private readonly HELP_MESSAGE_STEP_1 =
    'Puedes decir: "correo" para escribir tu correo electrónico, ' +
    '"enviar" para solicitar el código de verificación, ' +
    '"leer campos" para escuchar lo que has escrito, ' +
    '"borrar" para limpiar el campo, ' +
    '"volver" para regresar, ' +
    '"iniciar sesión" para ir a la pantalla de inicio de sesión, ' +
    'o "ayuda" para repetir este mensaje.';

  private readonly HELP_MESSAGE_STEP_2 =
    'Ahora puedes decir: "código" para dictar el código, ' +
    '"pegar código" si lo has copiado del correo, ' +
    '"contraseña" para escribir tu nueva contraseña, ' +
    '"confirmar" para repetir la contraseña, ' +
    '"guardar" para cambiar tu contraseña, ' +
    '"leer campos" para escuchar lo que has escrito, ' +
    '"volver" para regresar, o "ayuda" para repetir este mensaje.';

  constructor() {
    // ✅ registrar los iconos usados en el HTML
    addIcons({
      mailOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      keyOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      clipboardOutline,
    });

    // ✅ PASO 1: Solo email
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, emailValidator()]]
    });

    // Paso 2: Código OTP + Password + Confirmar
    this.resetPasswordForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [
        Validators.required,
        Validators.minLength(9),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
      ]],
      confirmPassword: [{ value: '', disabled: true }, [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Lógica de habilitación en cascada
    this.resetPasswordForm.get('password')?.statusChanges.subscribe(status => {
      const confirmControl = this.resetPasswordForm.get('confirmPassword');
      if (status === 'VALID') {
        confirmControl?.enable();
      } else {
        confirmControl?.disable();
        confirmControl?.setValue('');
      }
    });

    // Efectos de accesibilidad
    effect(() => {
      if (this.forgotPasswordForm.valid && !this.emailSent()) {
        setTimeout(() => this.btnSubmitEmail()?.nativeElement.focus(), 50);
      }
      if (this.resetPasswordForm.valid && this.emailSent() && !this.isFinished()) {
        setTimeout(() => this.btnSubmitPass()?.nativeElement.focus(), 50);
      }
    });

    // ✅ Suscripción para mensajes de voz con debounce
    this.voiceFeedbackSubscription = this.voiceFeedback$
      .pipe(debounceTime(1200))
      .subscribe((message: string) => {
        if (!this.isDestroyed && message) {
          this.voiceService.speak(message);
        }
      });
  }

  private speakFeedback(message: string): void {
    if (!this.isDestroyed && message) {
      this.voiceFeedback$.next(message);
    }
  }

  /**
   * Convierte "503682" en "cinco, cero, tres, seis, ocho, dos"
   * para que el usuario lo oiga claramente y pueda verificar.
   */
  private spellDigits(code: string): string {
    const map: Record<string, string> = {
      '0': 'cero', '1': 'uno', '2': 'dos', '3': 'tres', '4': 'cuatro',
      '5': 'cinco', '6': 'seis', '7': 'siete', '8': 'ocho', '9': 'nueve'
    };
    return code.split('').map(d => map[d] || d).join(', ');
  }

  ngOnInit(): void {
    console.log('✅ ForgotPasswordComponent inicializado (con voz)');

    this.mutedSubscription = this.voiceService.getMutedState().subscribe(muted => {
      this.isMicActive.set(!muted);
      this.cdr.markForCheck();
    });

    const context = {
      activationMessage: this.WELCOME_MESSAGE,
      availableCommands: [
        'correo', 'enviar', 'código', 'codigo', 'otp',
        'contraseña', 'confirmar', 'guardar', 'volver',
        'ayuda', 'borrar', 'limpiar', 'leer campos', 'estado',
        'copiar código',
        'pegar código',
        'iniciar sesión'
      ],
      preventBackend: true
    };
    this.voiceContext.setContext(context);

    this.voiceService.ready$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ready) => {
        if (!ready && !this.isDestroyed) {
          console.log('🔄 [ForgotPassword] Reconocimiento caído, reactivando...');
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.voiceService.startListening();
            }
          }, 500);
        }
      });

    setTimeout(() => {
      if (!this.isDestroyed) {
        const isActive = this.voiceService.isRecognitionActive();
        const isMuted = this.voiceService.isCurrentlyMuted();
        console.log(`🎤 [ForgotPassword] Estado del micrófono - Activo: ${isActive}, Muteado: ${isMuted}`);

        if (!isActive && !isMuted) {
          console.log('🎤 [ForgotPassword] Reconocimiento inactivo, iniciando...');
          this.voiceService.startListening();
        } else if (isActive) {
          console.log('🎤 [ForgotPassword] Micrófono ya activo, no se inicia nuevamente');
        }
      }
    }, 1000);

    this.voiceService
      .getTranscript()
      .pipe(takeUntil(this.destroy$))
      .subscribe((text: string) => {
        this.ngZone.run(() => {
          if (this.isDestroyed || !text) return;
          this.handleVoiceCommand(text);
        });
      });

    this.registerFieldsForCleanup();

    setTimeout(() => {
      if (!this.isDestroyed) {
        console.log('🎯 [ForgotPassword] Aplicando foco al campo email');
        this.focusEmailRobusto();
      }
    }, 800);

    setTimeout(() => {
      if (this.isDestroyed) return;

      const isMuted = this.voiceService.isCurrentlyMuted();

      if (isMuted) {
        console.log('🔇 [ForgotPassword] Micrófono muteado, bienvenida omitida');
        if (!this.voiceService.isRecognitionActive()) {
          this.voiceService.startListening();
        }
        return;
      }

      console.log('🗣️ [ForgotPassword] Iniciando bienvenida encadenada con micro');

      this.voiceService.speakAlways(this.WELCOME_MESSAGE, true)
        .then(() => {
          if (this.isDestroyed) return;
          setTimeout(() => {
            if (this.isDestroyed) return;
            if (!this.voiceService.isRecognitionActive()) {
              console.log('🎤 [ForgotPassword] Bienvenida terminada → arrancando micro');
              this.voiceService.startListening();
            }
          }, 400);
        })
        .catch((err) => {
          console.warn('⚠️ [ForgotPassword] speakAlways falló, arrancando micro igualmente', err);
          if (this.isDestroyed) return;
          if (!this.voiceService.isRecognitionActive()) {
            this.voiceService.startListening();
          }
        });
    }, 1500);
  }

  // ============================================================
  // ✅ HELPER: OBTENER INSTANCIA DE ION-INPUT
  // ============================================================
  private getIonInput(target: string): HTMLIonInputElement | undefined {
    const map: Record<string, HTMLIonInputElement | undefined> = {
      email: this.emailInput()?.nativeElement,
      code: this.codeInput()?.nativeElement,
      password: this.newPassInput()?.nativeElement,
      confirmPassword: this.confirmPassInput()?.nativeElement
    };
    return map[target];
  }

  // ============================================================
  // REGISTRO DE CAMPOS PARA LIMPIEZA UNIVERSAL
  // ============================================================
  private registerFieldsForCleanup(): void {
    this.fieldCleanup.registerField({
      name: 'email',
      label: 'correo',
      isFocused: false,
      clear: () => this.clearField('email'),
      isEmpty: () => !this.forgotPasswordForm.get('email')?.value
    });

    this.fieldCleanup.registerField({
      name: 'code',
      label: 'código',
      isFocused: false,
      clear: () => this.clearField('code'),
      isEmpty: () => !this.resetPasswordForm.get('code')?.value
    });

    this.fieldCleanup.registerField({
      name: 'password',
      label: 'contraseña',
      isFocused: false,
      clear: () => this.clearField('password'),
      isEmpty: () => !this.resetPasswordForm.get('password')?.value
    });

    this.fieldCleanup.registerField({
      name: 'confirmPassword',
      label: 'confirmar contraseña',
      isFocused: false,
      clear: () => this.clearField('confirmPassword'),
      isEmpty: () => !this.resetPasswordForm.get('confirmPassword')?.value
    });
  }

  // ============================================================
  // LEER TODOS LOS CAMPOS
  // ============================================================
  private readAllFields(): void {
    if (this.isDestroyed) return;

    const fieldConfigs = [
      { key: 'email', label: 'Correo', form: 'forgot' },
      { key: 'code', label: 'Código', form: 'reset' },
      { key: 'password', label: 'Contraseña', form: 'reset' },
      { key: 'confirmPassword', label: 'Confirmación', form: 'reset' }
    ];

    const filledFields: string[] = [];
    const emptyFields: string[] = [];

    for (const field of fieldConfigs) {
      if (field.form === 'reset' && !this.emailSent()) continue;
      if (field.form === 'forgot' && this.emailSent()) continue;

      const control = field.form === 'forgot'
        ? this.forgotPasswordForm.get(field.key)
        : this.resetPasswordForm.get(field.key);
      const value = control?.value || '';
      if (value && value.trim().length > 0) {
        if (field.key === 'password' || field.key === 'confirmPassword') {
          filledFields.push(`${field.label}: completado`);
        } else {
          filledFields.push(`${field.label}: ${value}`);
        }
      } else {
        emptyFields.push(field.label);
      }
    }

    const messages: string[] = [];

    if (filledFields.length === 0 && emptyFields.length === 0) {
      messages.push('No hay campos en el formulario.');
    } else if (filledFields.length === 0) {
      messages.push('Todos los campos están vacíos.');
      messages.push('Los campos disponibles son: ' + emptyFields.join(', ') + '.');
    } else {
      messages.push('Contenido del formulario:');
      messages.push(filledFields.join('. ') + '.');

      if (emptyFields.length > 0) {
        messages.push('Campos vacíos: ' + emptyFields.join(', ') + '.');
      }

      if (emptyFields.length === 0) {
        messages.push('Todos los campos están completos.');
        if (this.emailSent() && !this.isFinished()) {
          messages.push('Di "guardar" para cambiar la contraseña.');
        } else if (!this.emailSent()) {
          messages.push('Di "enviar" para solicitar el código.');
        } else if (this.isFinished()) {
          messages.push('Ya has actualizado tu contraseña. Ve al login.');
        }
      }
    }

    this.speakWithPauses(messages, 600);
  }

  private speakWithPauses(messages: string[], pauseMs: number = 500): void {
    if (this.isDestroyed || messages.length === 0) return;

    let index = 0;

    const speakNext = () => {
      if (this.isDestroyed || index >= messages.length) return;

      const message = messages[index];
      console.log(`🔊 [ForgotPassword] Hablando (${index + 1}/${messages.length}): "${message}"`);

      this.voiceService.speak(message).then(() => {
        index++;
        if (index < messages.length) {
          setTimeout(() => {
            speakNext();
          }, pauseMs);
        }
      }).catch(() => {
        index++;
        setTimeout(() => {
          speakNext();
        }, pauseMs);
      });
    };

    speakNext();
  }

  // ============================================================
  // ✅ MÉTODO PARA PEGAR CÓDIGO DESDE EL PORTAPAPELES
  // ============================================================
  /**
   * ✅ Lee el portapapeles con reintentos.
   *    Windows/Chrome a veces devuelve "" en el primer intento.
   */
  private async readClipboardWithRetry(maxAttempts = 3, delayMs = 150): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          if (i > 0) {
            console.log(`📋 [ForgotPassword] Portapapeles leído en el intento ${i + 1}`);
          }
          return text;
        }
        console.log(`📋 [ForgotPassword] Intento ${i + 1}: portapapeles vacío, reintentando...`);
      } catch (err) {
        console.warn(`⚠️ [ForgotPassword] Error en intento ${i + 1}:`, err);
      }

      if (i < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    return '';
  }


  /**
   * ✅ Extrae el código de 6 dígitos del texto del portapapeles.
   *    Estrategia:
   *    1. Busca código junto a palabra clave ("código", "code", "verificación")
   *    2. Busca cualquier grupo exacto de 6 dígitos
   *    3. Fallback: primeros 6 dígitos consecutivos
   *    Devuelve null si no encuentra nada válido.
   */
  private extractCodeFromText(text: string): string | null {
    if (!text || text.trim().length === 0) return null;

    const contextMatch = text.match(/(?:c[oó]digo|code|verificaci[oó]n|otp)[^\d]{0,20}(\d{6})/i);
    if (contextMatch) {
      console.log(`📋 Código por contexto: "${contextMatch[1]}"`);
      return contextMatch[1];
    }

    const numberMatch = text.match(/\b(\d{6})\b/);
    if (numberMatch) {
      console.log(`📋 Código por patrón: "${numberMatch[1]}"`);
      return numberMatch[1];
    }

    const digits = text.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      console.log(`📋 Código por limpieza: "${digits}"`);
      return digits;
    }

    return null;
  }


  //
  public async pasteCodeFromClipboard(): Promise<void> {
    if (this.isDestroyed) return;

    const now = Date.now();
    if (now - this.lastPasteAttempt < this.PASTE_DEBOUNCE) {
      console.log('⏭️ [ForgotPassword] pegar código ignorado (debounce)');
      return;
    }
    this.lastPasteAttempt = now;

    try {
      const text = await this.readClipboardWithRetry();
      const code = this.extractCodeFromText(text);

      if (!code) {
        this.voiceService.speak('El portapapeles no contiene un código de 6 dígitos. Copia el código del correo primero.');
        return;
      }

      this.applyCode(code, 'pegado');
    } catch (err) {
      console.error('Error al leer el portapapeles:', err);
      this.voiceService.speak('No se pudo acceder al portapapeles. Asegúrate de permitir el acceso.');
    }
  }


  //
  public async copyCodeFromClipboard(): Promise<void> {
    if (this.isDestroyed) return;

    const now = Date.now();
    if (now - this.lastPasteAttempt < this.PASTE_DEBOUNCE) {
      console.log('⏭️ [ForgotPassword] copiar código ignorado (debounce)');
      return;
    }
    this.lastPasteAttempt = now;

    try {
      const text = await this.readClipboardWithRetry();
      const code = this.extractCodeFromText(text);

      if (!code) {
        this.voiceService.speak('El portapapeles no contiene un código de 6 dígitos. Copia el código del correo primero.');
        return;
      }

      this.applyCode(code, 'copiado');
    } catch (err) {
      console.error('Error al leer el portapapeles:', err);
      this.voiceService.speak('No se pudo acceder al portapapeles. Asegúrate de permitir el acceso.');
    }
  }

  //
  private applyCode(code: string, action: 'pegado' | 'copiado'): void {
    this.resetPasswordForm.patchValue({ code });
    this.resetPasswordForm.get('code')?.markAsDirty();
    this.resetPasswordForm.get('code')?.markAsTouched();

    const ionInput = this.getIonInput('code');
    if (ionInput) {
      ionInput.value = code;
    }

    this.cdr.detectChanges();

    // ✅ Aviso claro dígito a dígito: el usuario puede verificar si es el correcto
    this.voiceService.speak(
      `Código ${action}: ${this.spellDigits(code)}. ` +
      `Verifica que coincide con el que recibiste en el correo. ` +
      `Si no es correcto, di "borrar código" y copia el correcto del correo.`
    );
    console.log(`📋 Código ${action} desde el portapapeles: "${code}"`);

    if (this.resetPasswordForm.get('code')?.valid) {
      setTimeout(() => this.focusInput('password'), 1200);
    }
  }



  // ============================================================
  // PROCESAMIENTO DE COMANDOS DE VOZ
  // ============================================================
  private handleVoiceCommand(text: string): void {
    if (this.isDestroyed) return;
    const lower = text.toLowerCase().trim();

    // ✅ Comandos compuestos que NO deben pasar por debounce
   const bypassDebounceCommands = [
      'pegar código', 'pegar codigo',
      'copiar código', 'copiar codigo',
      'rellenar código', 'rellenar codigo',
      'escribir código', 'escribir codigo'
    ];
    const bypassDebounce = bypassDebounceCommands.some(cmd => lower.includes(cmd));

    const now = Date.now();
    if (!bypassDebounce &&
        lower === this.lastProcessedCommand &&
        (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
      console.log(`⏭️ ForgotPassword: comando duplicado ignorado: "${lower}"`);
      return;
    }
    this.lastProcessedCommand = lower;
    this.lastProcessedTime = now;

    // ============================================================
    // ✅ Comandos de código (portapapeles + lectura por voz)
    //    ANTES de la prioridad de dictado, para que "código" fragmentado
    //    no arranque dictado cuando en realidad el usuario quiere
    //    "leer código" o "pegar código"
    // ============================================================
    if (this.emailSent() && !this.isFinished()) {
      
      // ✅ Comandos de portapapeles (pegar/copiar código)
      if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
          lower.includes('copiar código') || lower.includes('copiar codigo') ||
          lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
          lower.includes('escribir código') || lower.includes('escribir codigo')) {
        console.log('📋 [ForgotPassword] Comando pegar/copiar código detectado (antes de dictado)');
        if (this.dictationMode) {
          this.stopDictation(undefined, true);
        }
        this.copyCodeFromClipboard();
        return;
      }
    }

    // ✅ Si el campo está vacío y dice "correo", iniciar dictado directo
    if ((lower === 'correo' || lower === 'email' || lower === 'correo electrónico') && !this.emailSent()) {
      const control = this.forgotPasswordForm.get('email');
      const shouldStartDictation = (!control?.value || control.value.length === 0) &&
                                  (!this.dictationMode || this.dictationTarget !== 'email');

      if (shouldStartDictation) {
        console.log(`🎤 [ForgotPassword] Campo "correo" vacío, iniciando dictado directo`);
        if (this.dictationMode) {
          this.stopDictation(undefined, true);
        }
        this.voiceService.speak('Dime tu correo electrónico. Di "fin" o "terminar" cuando hayas terminado.');
        this.startDictation('email', '');
        return;
      } else if (this.dictationMode && this.dictationTarget === 'email') {
        console.log(`⏭️ [ForgotPassword] Ya dictando "correo", ignorando comando`);
        return;
      }
    }

    // ✅ PRIORIDAD: Si estamos en modo dictado
    if (this.dictationMode && this.dictationTarget) {
      this.handleDictation(lower);
      return;
    }

    // ============================================================
    // COMANDO "LEER CAMPOS"
    // ============================================================
    if (lower.includes('leer campos') || lower.includes('leer todo') ||
        lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
        lower.includes('qué he escrito') || lower.includes('revisar campos') ||
        lower.includes('comprobar campos') || lower.includes('ver campos')) {
      console.log('📖 [ForgotPassword] Comando "leer campos" detectado');
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
      }
      this.readAllFields();
      return;
    }

    // ============================================================
    // COMANDO "ESTADO" / "QUÉ FALTA"
    // ============================================================
    if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
      console.log('📊 [ForgotPassword] Comando "estado" detectado');
      if (this.dictationMode) {
        this.stopDictation(undefined, true);
      }
      this.showStatus();
      return;
    }

    // ✅ COMANDO VOLVER
    if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
      this.goBack();
      return;
    }

    // ✅ COMANDO "INICIAR SESIÓN"
    if (lower.includes('iniciar sesión') || lower.includes('ir a login') || lower.includes('login') || lower.includes('inicia sesión')) {
      this.voiceService.clearTranscript();
      this.voiceService.speak('Navegando a inicio de sesión.');
      this.router.navigate(['/login']);
      return;
    }

    // ✅ COMANDO BORRAR / LIMPIAR
    if (lower.includes('borrar') || lower.includes('limpiar')) {
      if (lower.includes('correo') || lower.includes('email')) {
        this.clearField('email');
        return;
      }
      if (lower.includes('código') || lower.includes('codigo')) {
        this.clearField('code');
        return;
      }
      if (lower.includes('confirmar')) {
        this.clearField('confirmPassword');
        return;
      }
      if (lower.includes('contraseña') || lower.includes('clave') || lower.includes('password')) {
        this.clearField('password');
        return;
      }
      this.clearCurrentField();
      return;
    }

    // ============================================================
    // PASO 1: SOLICITAR CORREO
    // ============================================================
    if (!this.emailSent()) {
      if (/^(correo|email|correo electrónico)\b/.test(lower)) {
        const rest = lower.replace(/^(correo|email|correo electrónico)\s*/, '').trim();
        if (rest && rest.length > 0) {
          this.startDictation('email', rest);
        } else {
          this.startDictation('email', '');
        }
        return;
      }

      if (lower.includes('enviar') || lower.includes('siguiente') || lower.includes('continuar')) {
        this.onSubmitEmail();
        return;
      }
    }

    // ============================================================
    // PASO 2: CÓDIGO + NUEVA CONTRASEÑA
    //    ("leer código" y "pegar código" ya se comprobaron arriba)
    // ============================================================
    if (this.emailSent() && !this.isFinished()) {

      // ✅ SOLO el dictado genérico de "código"
      if (lower.includes('código') || lower.includes('codigo') || lower.includes('otp') || lower.includes('pin')) {
        const control = this.resetPasswordForm.get('code');
        const shouldStartDictation = (!control?.value || control.value.length === 0) &&
                                    (!this.dictationMode || this.dictationTarget !== 'code');

        if (shouldStartDictation) {
          console.log(`🎤 [ForgotPassword] Campo "código" vacío, iniciando dictado directo`);
          this.focusCodeInput();
          setTimeout(() => this.startDictation('code', ''), 500);
          return;
        } else if (this.dictationMode && this.dictationTarget === 'code') {
          console.log(`⏭️ [ForgotPassword] Ya dictando "código", ignorando comando`);
          return;
        }
        return;
      }

      // Dictado: nueva contraseña
      if (/^(contraseña|clave|password|pass|nueva contraseña)\b/.test(lower)) {
        const rest = lower.replace(/^(contraseña|clave|password|pass|nueva contraseña)\s*/, '').trim();
        this.startDictation('password', rest);
        return;
      }

      // Dictado: confirmar contraseña
      if (lower.includes('confirmar') || lower.includes('confirmar contraseña') ||
          lower.includes('confirmar clave') || lower.includes('repetir contraseña')) {
        this.startDictation('confirmPassword', '');
        return;
      }

      // Guardar / Cambiar contraseña
      if (lower.includes('guardar') || lower.includes('cambiar') || lower.includes('actualizar')) {
        this.onSubmitNewPassword();
        return;
      }
    }

    // Limpiar todos los campos
    if (lower.includes('limpiar todo') || lower.includes('borrar todo') || lower.includes('resetear')) {
      this.clearAllFields();
      return;
    }

    // Ayuda
    if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
      this.showHelp();
      return;
    }

    console.log('🔍 ForgotPassword: comando no reconocido:', lower);
  }

  // ============================================================
  // MÉTODO DE ESTADO - PÚBLICO
  // ============================================================
  public showStatus(): void {
    if (this.isDestroyed) return;

    if (!this.emailSent()) {
      const email = this.forgotPasswordForm.get('email')?.value || '';
      if (!email || email.trim().length === 0) {
        this.voiceService.speak('Falta tu correo electrónico. Di "correo" para escribirlo.');
      } else {
        this.voiceService.speak('Tu correo está completo. Di "enviar" para solicitar el código, o "leer campos" para escuchar lo que has escrito.');
      }
      return;
    }

    if (!this.isFinished()) {
      const code = this.resetPasswordForm.get('code')?.value || '';
      const password = this.resetPasswordForm.get('password')?.value || '';
      const confirm = this.resetPasswordForm.get('confirmPassword')?.value || '';

      const missingFields = [];
      if (!code || code.trim().length === 0) missingFields.push('código');
      if (!password || password.trim().length === 0) missingFields.push('contraseña');
      if (!confirm || confirm.trim().length === 0) missingFields.push('confirmación');

      if (missingFields.length === 0) {
        this.voiceService.speak('Todos los campos están completos. Di "guardar" para cambiar tu contraseña, o "leer campos" para escuchar lo que has escrito.');
      } else {
        const fieldList = missingFields.map(f => `"${f}"`).join(', ');
        this.voiceService.speak(`Faltan los campos: ${fieldList}. Di el nombre de uno para escribirlo.`);
      }
      return;
    }

    this.voiceService.speak('Ya actualizaste tu contraseña. Ve al login para iniciar sesión.');
  }

  // ============================================================
  // DICTADO DE VOZ
  // ============================================================
  // ✅ NUEVO: firma con 'code'
  private startDictation(target: 'email' | 'code' | 'password' | 'confirmPassword', initialText = ''): void {
    if (this.isDestroyed) return;

    if (this.dictationMode && this.dictationTarget === target) {
      console.log(`⏭️ [ForgotPassword] Ya dictando "${target}", ignorando`);
      return;
    }

    this.dictationMode = true;
    this.dictationTarget = target;
    this.dictationBuffer = '';

    // ✅ NUEVO: añadido 'code'
    const fieldNames: Record<string, string> = {
      email: 'correo electrónico',
      code: 'código de verificación',
      password: 'contraseña',
      confirmPassword: 'confirmación de contraseña'
    };
    const fieldName = fieldNames[target] || target;

    this.updateFormAndInputDirectly(target, '');

    if (initialText && initialText.trim().length > 0) {
      let cleanedText = initialText;
      if (target === 'email') {
        cleanedText = this.cleanEmailText(initialText);
      }
      this.updateFormAndInputDirectly(target, cleanedText);
      this.dictationBuffer = cleanedText.trimEnd();
      this.voiceService.speak(`Dictando ${fieldName}. Texto inicial: ${cleanedText}`);
    } else {
      const finishWords = this.voiceFilter.getFinishWords().slice(0, 3).join('", "');

      if (target === 'email') {
        this.voiceService.speak(`Dime tu correo electrónico. Di "${finishWords}" cuando hayas terminado.`);
      } else if (target === 'code') {
        // ✅ NUEVO: mensaje para código
        this.voiceService.speak(`Di los 6 dígitos del código. Di "${finishWords}" cuando hayas terminado.`);
      } else if (target === 'password') {
        this.voiceService.speak(`Dime tu nueva contraseña. Di "${finishWords}" cuando hayas terminado.`);
      } else {
        this.voiceService.speak(`Repite tu contraseña. Di "${finishWords}" cuando hayas terminado.`);
      }
    }

    this.focusInput(target);
    console.log(`🎤 Dictado activado para: ${target}`);
  }

  private cleanEmailText(text: string): string {
    if (!text) return '';

    let cleaned = text.replace(/\s+/g, '');
    cleaned = cleaned.replace(/arroba/g, '@');
    cleaned = cleaned.replace(/punto/g, '.');
    cleaned = cleaned.replace(/\s*@\s*/g, '@');
    cleaned = cleaned.replace(/\s*\.\s*/g, '.');
    cleaned = cleaned.replace(/@@/g, '@');
    cleaned = cleaned.replace(/\.\./g, '.');

    cleaned = cleaned.replace(/^@+/, '');
    cleaned = cleaned.replace(/^\.+/, '');
    cleaned = cleaned.replace(/@+$/, '');
    cleaned = cleaned.replace(/\.+$/, '');

    return cleaned;
  }

  //
  private handleDictation(text: string): void {
    if (this.isDestroyed || !this.dictationTarget) return;
    const target = this.dictationTarget;
    const currentValue = this.getCurrentValue(target);

    console.log(`📝 [handleDictation] target: ${target}, currentValue: "${currentValue}", text: "${text}"`);

    const lower = text.toLowerCase().trim();

    // ✅ NUEVO: si estamos dictando y dicen "pegar código", cancelar dictado y pegar
    if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
        lower.includes('copiar código') || lower.includes('copiar codigo') ||
        lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
        lower.includes('escribir código') || lower.includes('escribir codigo')) {
      console.log('📋 [handleDictation] pegar/copiar código detectado → cancelando dictado');
      this.stopDictation('', true);
      this.copyCodeFromClipboard();
      return;
    }

    if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
      console.log('🔙 [handleDictation] Comando "volver" detectado en dictado, ejecutando...');
      this.stopDictation('', true);
      this.goBack();
      return;
    }

    if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
      console.log('❓ [handleDictation] Comando "ayuda" detectado en dictado');
      this.stopDictation('', true);
      this.showHelp();
      return;
    }

    if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
      console.log('📊 [handleDictation] Comando "estado" detectado en dictado');
      this.stopDictation('', true);
      this.showStatus();
      return;
    }

    if (lower.includes('leer campos') || lower.includes('leer todo') ||
        lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
        lower.includes('qué he escrito') || lower.includes('revisar campos') ||
        lower.includes('comprobar campos') || lower.includes('ver campos')) {
      console.log('📖 [handleDictation] Comando "leer campos" detectado en dictado');
      this.stopDictation('', true);
      this.readAllFields();
      return;
    }

    if (lower === 'borrar' || lower === 'limpiar' || lower.includes('borrar campo') || lower.includes('limpiar campo')) {
      console.log('🧹 [handleDictation] Comando "borrar" detectado, limpiando campo');
      this.updateFormAndInputDirectly(target, '');
      this.dictationBuffer = '';
      this.stopDictation('', true);
      const fieldName = target === 'email' ? 'correo' : 'contraseña';
      this.voiceService.speak(`Campo ${fieldName} limpiado. Di el nombre del campo para escribirlo.`);
      return;
    }

    if (this.voiceFilter.containsFinishWords(text)) {
      console.log('🔴 Comando de finalización');
      const cleanText = this.voiceFilter.removeFinishWords(text);

      let finalValue = this.dictationBuffer || currentValue;

      if (cleanText.length > 0) {
        console.log(`📝 Procesando: "${cleanText}"`);
        const processed = this.voiceFilter.processDictationPhrase(cleanText, this.getDictationContext(target), false);
        if (processed.success) {
          let textToAdd = processed.text;
          if (target === 'email') {
            textToAdd = this.cleanEmailText(textToAdd);

            this.updateFormAndInputDirectly(target, textToAdd);

            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(textToAdd)) {
              console.log(`❌ Email inválido: "${textToAdd}"`);
              this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente o dictarlo de nuevo.');
              this.dictationBuffer = '';
              this.dictationMode = false;
              this.dictationTarget = null;
              this.dictationBuffer = '';
              this.cdr.markForCheck();
              return;
            }
          }
          finalValue = textToAdd;
          this.updateFormAndInputDirectly(target, finalValue);
          this.dictationBuffer = processed.text.trimEnd();
          console.log(`🔤 Reemplazado por: "${finalValue}"`);
        }
      } else {
        console.log(`🔤 Sin texto nuevo, usando buffer: "${finalValue}"`);
        if (finalValue && finalValue.length > 0) {
          this.updateFormAndInputDirectly(target, finalValue);
        }
      }
      this.stopDictation(finalValue);
      return;
    }

    if (lower === 'fin' || lower === 'terminar') {
      console.log('🔴 [ForgotPassword] Finalización directa');
      const finalValue = this.dictationBuffer || currentValue;

      if (target === 'email' && finalValue && finalValue.length > 0) {
        this.updateFormAndInputDirectly(target, finalValue);

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(finalValue)) {
          console.log(`❌ Email inválido al finalizar: "${finalValue}"`);
          this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente o dictarlo de nuevo.');
          this.dictationBuffer = '';
          this.dictationMode = false;
          this.dictationTarget = null;
          this.dictationBuffer = '';
          this.cdr.markForCheck();
          return;
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

    const shouldCapitalize = target !== 'email';
    let processed = this.voiceFilter.processDictationPhrase(text, this.getDictationContext(target), shouldCapitalize);

    if (!processed.success || !processed.text) {
      const word = text.trim();
      const cleanWord = word.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
      let finalWord = cleanWord;
      if (shouldCapitalize && (currentValue === '' || currentValue.endsWith(' ')) && finalWord.length > 0) {
        finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
      }
      processed = {
        success: true,
        text: finalWord + ' ',
        originalText: text,
        processedText: finalWord + ' '
      } as any;
      console.log(`🔤 Fallback: "${processed.text}"`);
    }

    let textToAdd = processed.text;
    if (target === 'email') {
      textToAdd = this.cleanEmailText(textToAdd);
    }

    this.dictationBuffer = textToAdd.trimEnd();
    console.log(`🔤 Texto acumulado (no visible): "${this.dictationBuffer}"`);
  }





  private stopDictation(finalValue?: string, silent = false): void {
    if (this.isDestroyed) return;
    console.log(`🔴 stopDictation (silent: ${silent})`);
    const target = this.dictationTarget;

    if (target) {
      let value = finalValue !== undefined ? finalValue : this.dictationBuffer;

      if (!value || value.length === 0) {
        value = this.getCurrentValue(target);
      }

      value = value.trim();

      if (value && value.length > 0) {
        if (target === 'email') {
          const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailPattern.test(value)) {
            console.log(`❌ Email inválido en stopDictation: "${value}"`);
            if (!silent) {
              this.voiceService.speak('El correo no tiene un formato válido. Debe incluir @ y un dominio como .com. Puedes corregirlo manualmente.');
            }
            this.dictationBuffer = '';
            this.dictationMode = false;
            this.dictationTarget = null;
            this.dictationBuffer = '';
            this.cdr.markForCheck();
            return;
          }
        }

        this.updateFormAndInputDirectly(target, value);
        if (!silent) {
          if (target === 'email') {
            const cleanEmail = this.cleanEmailText(value);
            if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
              this.voiceService.speak(`Correo guardado: ${cleanEmail}`);
            } else {
              this.voiceService.speak('Correo guardado correctamente.');
            }
          } else if (target === 'code') {
            // ✅ NUEVO: mensaje para código
            this.voiceService.speak(`Código completado: ${value}. Di "contraseña" para la nueva clave.`);
          } else if (target === 'password') {
            this.voiceService.speak(`Listo, contraseña completada.`);
          } else {
            this.voiceService.speak(`Listo, confirmación completada.`);
          }
        }
      } else {
        if (!silent) {
          const fieldName =
            target === 'email' ? 'el correo' :
            target === 'code' ? 'el código' :
            target === 'password' ? 'la contraseña' : 'la confirmación';
          this.voiceService.speak(`No se reconoció ${fieldName}.`);
        }
      }
    }

    this.dictationMode = false;
    this.dictationTarget = null;
    this.dictationBuffer = '';
    this.cdr.markForCheck();
    console.log('🔴 Dictado finalizado');
  }

  private validatePasswordAfterDictation(password: string): void {
    const control = this.resetPasswordForm.get('password');
    if (control && control.invalid) {
      const errors = this.getPasswordErrors();
      this.updateFormAndInputDirectly('password', '');
      this.dictationBuffer = '';

      if (errors) {
        this.voiceService.speak(`La contraseña no es válida: ${errors}. Voy a borrarla. Di "contraseña" para intentarlo de nuevo.`);
      } else {
        this.voiceService.speak('La contraseña no cumple con los requisitos. Voy a borrarla. Di "contraseña" para intentarlo de nuevo.');
      }
      setTimeout(() => {
        this.startDictation('password', '');
      }, 500);
      return;
    } else if (control && control.valid) {
      this.voiceService.speak('Contraseña válida. Ahora di "confirmar" para repetirla, o "guardar" para cambiar tu contraseña.');
      setTimeout(() => {
        this.focusInput('confirmPassword');
      }, 500);
    }
  }

  private validateConfirmPasswordAfterDictation(): void {
    const control = this.resetPasswordForm.get('confirmPassword');
    if (control && control.invalid) {
      const errors = this.getConfirmPasswordErrors();
      this.updateFormAndInputDirectly('confirmPassword', '');
      this.dictationBuffer = '';

      if (errors) {
        this.voiceService.speak(`Error: ${errors}. Voy a borrar el campo. Di "confirmar" para intentarlo de nuevo.`);
      } else {
        this.voiceService.speak('La confirmación no coincide con la contraseña. Voy a borrar el campo. Di "confirmar" para intentarlo de nuevo.');
      }
      setTimeout(() => {
        this.startDictation('confirmPassword', '');
      }, 500);
      return;
    } else if (control && control.valid) {
      this.voiceService.speak('Confirmación correcta. Di "guardar" para cambiar tu contraseña.');
    }
  }

  private getPasswordErrors(): string | null {
    const ctrl = this.resetPasswordForm.get('password');
    if (!ctrl) return null;
    const value = ctrl.value || '';
    if (ctrl.hasError('required')) return 'La contraseña es obligatoria.';
    if (ctrl.hasError('minlength')) {
      return `Debe tener al menos 9 caracteres. Tiene ${value.length}.`;
    }
    if (ctrl.hasError('pattern')) {
      return 'Debe incluir mayúscula, minúscula, número y símbolo.';
    }
    return null;
  }

  private getConfirmPasswordErrors(): string | null {
    const ctrl = this.resetPasswordForm.get('confirmPassword');
    if (!ctrl) return null;
    if (ctrl.hasError('required')) return 'Es obligatorio confirmar la contraseña.';
    if (this.resetPasswordForm.hasError('passwordsMismatch')) {
      return 'La confirmación no coincide con la contraseña.';
    }
    return null;
  }

  private getCurrentValue(target: string): string {
    if (target === 'email') {
      return this.forgotPasswordForm.get('email')?.value || '';
    }
    return this.resetPasswordForm.get(target)?.value || '';
  }

  // ✅ NUEVO: incluye 'code'
  private getDictationContext(target: string): 'email' | 'password' | 'text' {
    const map: Record<string, 'email' | 'password' | 'text'> = {
      email: 'email',
      code: 'text',
      password: 'password',
      confirmPassword: 'password'
    };
    return map[target] || 'text';
  }

  private updateFormAndInputDirectly(target: string, value: string): void {
    if (this.isDestroyed) return;
    const control = target === 'email'
      ? this.forgotPasswordForm.get('email')
      : this.resetPasswordForm.get(target);
    if (!control) return;

    control.setValue(value, { emitEvent: true });
    control.markAsDirty();
    control.markAsTouched();

    const ionInput = this.getIonInput(target);
    if (ionInput) {
      ionInput.value = value;
    }

    control.updateValueAndValidity({ emitEvent: true });
    this.cdr.markForCheck();
  }

  private focusInput(target: string): void {
    if (this.isDestroyed) return;
    const ionInput = this.getIonInput(target);
    if (ionInput) {
      setTimeout(() => {
        if (!this.isDestroyed && ionInput) {
          ionInput.setFocus();
          this.cdr.markForCheck();
        }
      }, 100);
    }
  }

  // ============================================================
  // FOCO ROBUSTO PARA CÓDIGO (con fallback)
  // ============================================================
  private focusCodeInput(): void {
    if (this.isDestroyed) return;

    setTimeout(() => {
      if (this.isDestroyed) return;

      const ionInput = this.codeInput()?.nativeElement;
      if (ionInput) {
        console.log('🎯 [ForgotPassword] codeInput encontrado por viewChild');
        ionInput.setFocus()
          .then(() => {
            console.log('✅ [ForgotPassword] Foco aplicado al campo código');
            this.voiceService.speak('Campo de código enfocado. Di los 6 dígitos, o di "copiar código" si lo tienes en el portapapeles.');
          })
          .catch((err: any) => {
            console.warn('⚠️ Falló setFocus del código, probando fallback', err);
            this.focusCodeFallback();
          });
        return;
      }

      console.log('⚠️ codeInput no disponible, usando fallback');
      this.focusCodeFallback();
    }, 300);
  }

  private focusCodeFallback(): void {
    if (this.isDestroyed) return;

    const inputEl = document.querySelector('ion-input[formControlName="code"]') as any;
    if (inputEl?.setFocus) {
      inputEl.setFocus()
        .then(() => {
          console.log('✅ [ForgotPassword] Foco aplicado por querySelector');
          this.voiceService.speak('Campo de código enfocado.');
        })
        .catch((err: any) => {
          console.warn('⚠️ Falló querySelector setFocus', err);
          this.voiceService.speak('No se pudo enfocar el campo de código. Tócalo con el dedo.');
        });
    } else {
      console.warn('❌ No se encontró ion-input[formControlName="code"]');
      this.voiceService.speak('No se pudo enfocar el campo de código.');
    }
  }

  // ============================================================
  // FOCO ROBUSTO PARA EMAIL (con fallback)
  // ============================================================
  private focusEmailRobusto(): void {
    if (this.isDestroyed) return;

    const ionInput = this.emailInput()?.nativeElement;
    if (ionInput) {
      console.log('🎯 [ForgotPassword] emailInput encontrado por viewChild');
      ionInput.setFocus()
        .then(() => console.log('✅ [ForgotPassword] Foco aplicado por viewChild'))
        .catch((err: any) => {
          console.warn('⚠️ [ForgotPassword] Falló setFocus, probando fallback', err);
          this.focusEmailFallback();
        });
      return;
    }

    console.log('⚠️ [ForgotPassword] emailInput no disponible, usando fallback');
    this.focusEmailFallback();
  }

  private focusEmailFallback(): void {
    if (this.isDestroyed) return;

    const inputEl = document.querySelector('ion-input[formControlName="email"]') as any;
    if (inputEl?.setFocus) {
      inputEl.setFocus()
        .then(() => console.log('✅ [ForgotPassword] Foco aplicado por querySelector'))
        .catch((err: any) => console.warn('⚠️ [ForgotPassword] Falló querySelector setFocus', err));
    } else {
      console.warn('❌ [ForgotPassword] No se encontró ion-input[formControlName="email"]');
    }
  }

  // ============================================================
  // MÉTODOS DE LIMPIEZA
  // ============================================================
  private clearField(target: string): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) {
      this.stopDictation(undefined, true);
    }

    const fieldName = this.getFieldName(target);
    const control = target === 'email'
      ? this.forgotPasswordForm.get('email')
      : this.resetPasswordForm.get(target);

    if (!control) return;

    const currentValue = control.value || '';
    if (!currentValue) {
      if (target === 'email') {
        this.voiceService.speak('El correo ya está vacío. Di "correo" para escribirlo.');
      } else {
        this.voiceService.speak(`El campo ${fieldName} ya está vacío. Di el nombre del campo para escribirlo.`);
      }
      this.focusInput(target);
      return;
    }

    control.setValue('', { emitEvent: true });
    control.markAsPristine();
    control.markAsUntouched();
    this.errorMessage.set(null);
    this.dictationBuffer = '';

    this.updateFormAndInputDirectly(target, '');
    this.cdr.markForCheck();

    if (target === 'email') {
      this.voiceService.speak('Correo borrado. Di "correo" para escribirlo de nuevo.');
    } else {
      this.voiceService.speak(`Campo ${fieldName} borrado. Di el nombre del campo para escribirlo.`);
    }
    this.focusInput(target);
  }

  private clearAllFields(): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);

    if (!this.emailSent()) {
      const email = this.forgotPasswordForm.get('email')?.value || '';
      if (!email) {
        this.voiceService.speak('El correo ya está vacío.');
        return;
      }
      this.forgotPasswordForm.patchValue({ email: '' });
      this.forgotPasswordForm.markAsPristine();
      this.forgotPasswordForm.markAsUntouched();
      this.errorMessage.set(null);
      this.voiceService.speak('Correo borrado. Di "correo" para escribirlo.');
      this.focusInput('email');
    } else if (!this.isFinished()) {
      const code = this.resetPasswordForm.get('code')?.value || '';
      const password = this.resetPasswordForm.get('password')?.value || '';
      const confirm = this.resetPasswordForm.get('confirmPassword')?.value || '';

      if (!code && !password && !confirm) {
        this.voiceService.speak('Los campos ya están vacíos.');
        return;
      }

      this.resetPasswordForm.patchValue({ code: '', password: '', confirmPassword: '' });
      this.resetPasswordForm.markAsPristine();
      this.resetPasswordForm.markAsUntouched();
      this.errorMessage.set(null);
      this.voiceService.speak('Todos los campos borrados. Di "código" para el código, "contraseña" para la nueva clave.');
      this.focusInput('code');
    }
    this.cdr.markForCheck();
  }

  private clearCurrentField(): void {
    if (this.isDestroyed) return;

    if (this.dictationMode && this.dictationTarget) {
      const target = this.dictationTarget;
      this.updateFormAndInputDirectly(target, '');
      this.dictationBuffer = '';
      this.voiceService.speak(`Campo ${this.getFieldName(target)} borrado.`);
      this.focusInput(target);
      return;
    }

    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {
      this.voiceService.speak('No hay un campo activo para borrar.');
      return;
    }

    const isFocused = (inputRef: ElementRef<HTMLIonInputElement> | undefined): boolean => {
      const el = inputRef?.nativeElement;
      if (!el) return false;
      return el === activeElement || el.contains(activeElement);
    };

    let target: string | null = null;
    if (isFocused(this.emailInput())) target = 'email';
    else if (isFocused(this.codeInput())) target = 'code';
    else if (isFocused(this.newPassInput())) target = 'password';
    else if (isFocused(this.confirmPassInput())) target = 'confirmPassword';

    if (!target) {
      // Determinar campos disponibles según el paso actual
      const campos = this.getCamposDisponiblesDelPaso();

      if (campos.length === 0) {
        this.voiceService.speak('No hay campos para borrar en este paso.');
        return;
      }

      if (campos.length === 1) {
        // ✅ clearField ya emite su propio mensaje ("Correo borrado. Di...")
        //    No duplicar el speak aquí
        this.clearField(campos[0].key);
        return;
      }

      const nombres = campos.map(c => `"${c.nombre}"`).join(', ');
      this.voiceService.speak(`¿Qué campo quieres borrar? Puedes decir ${nombres}.`);
      return;
    }

    this.clearField(target);
  }

  //
  private getFieldName(target: string): string {
    const map: Record<string, string> = {
      email: 'correo',
      code: 'código de verificación',
      password: 'nueva contraseña',
      confirmPassword: 'confirmación de contraseña'
    };
    return map[target] || target;
  }

  //
  private getCamposDisponiblesDelPaso(): { key: string; nombre: string }[] {
    // PASO 1: solo correo
    if (!this.emailSent()) {
      return [{ key: 'email', nombre: 'correo' }];
    }

    // PASO 3: no hay campos
    if (this.isFinished()) {
      return [];
    }

    // PASO 2: código + contraseña + confirmación
    return [
      { key: 'code',            nombre: 'código' },
      { key: 'password',        nombre: 'contraseña' },
      { key: 'confirmPassword', nombre: 'confirmación de contraseña' }
    ];
  }

  // ============================================================
  // ACCIONES DEL FORMULARIO - PÚBLICOS
  // ============================================================
  public goBack(): void {
    if (this.isDestroyed) return;

    if (this.dictationMode) {
      this.stopDictation(undefined, true);
    }

    if (this.isFinished()) {
      this.voiceService.speak('Volviendo al inicio de sesión.');
      this.router.navigate(['/login']);
      return;
    }

    if (this.emailSent()) {
      this.emailSent.set(false);
      this.errorMessage.set(null);
      this.resetPasswordForm.reset();
      this.voiceService.speak('Volviendo al paso de correo.');
      setTimeout(() => this.focusInput('email'), 300);
      return;
    }

    this.voiceService.speak('Volviendo al inicio de sesión.');
    this.router.navigate(['/login']);
  }

  public showHelp(): void {
    if (this.helpShown) return;
    this.helpShown = true;

    if (this.voiceService.isCurrentlyMuted()) {
      this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
      setTimeout(() => { this.helpShown = false; }, 5000);
      return;
    }

    if (this.isFinished()) {
      this.voiceService.speak('Tu contraseña ya fue actualizada. Puedes iniciar sesión.');
    } else if (!this.emailSent()) {
      this.voiceService.speak(this.HELP_MESSAGE_STEP_1);
    } else {
      this.voiceService.speak(this.HELP_MESSAGE_STEP_2);
    }

    setTimeout(() => { this.helpShown = false; }, 8000);
  }

  // ============================================================
  // MÉTODOS ORIGINALES - PÚBLICOS
  // ============================================================
  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
  }

  public togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  //
  public onSubmitEmail(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.focusInput('email');

      let msg = 'El correo es obligatorio y debe tener un formato válido.';
      const emailControl = this.forgotPasswordForm.get('email');
      if (emailControl?.hasError('required')) {
        msg = 'El correo electrónico es obligatorio.';
      } else if (emailControl?.hasError('invalidEmail')) {
        msg = 'El formato del correo electrónico no es válido. Debe incluir un arroba y un dominio.';
      }

      this.errorMessage.set(msg);
      this.voiceService.speak(msg);
      this.cdr.markForCheck();
      return;
    }

    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.voiceService.speak('Validando correo electrónico...');

    const email = this.forgotPasswordForm.value.email;
    console.log('📤 Enviando correo para recuperación:', email);

    this.authService.forgotPassword(email)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del backend:', response);

          // Manejo de errores de negocio (rate limit)
          if (response && typeof response === 'object') {
            if (response.success === false) {
              const errorMsg = response.message || 'Ha ocurrido un error.';
              console.log('🔴 Error en la respuesta:', errorMsg);
              this.errorMessage.set(errorMsg);
              this.voiceService.speak(errorMsg);
              this.focusInput('email');
              this.cdr.markForCheck();
              return;
            }
          }

          // ✅ Éxito (mensaje genérico anti-enumeración)
          this.emailSent.set(true);

          this.voiceService.speak(
            'Si el correo está registrado, recibirás un código de recuperación. ' +
            'Puedes dictarlo diciendo "código", o copiarlo del correo y decir "pegar código".'
          );

          setTimeout(() => {
            this.focusInput('code');
          }, 500);
        },
        error: (err) => {
          console.log('🔴 Error HTTP:', err);

          let msg = 'No se pudo procesar la solicitud. Inténtalo más tarde.';

          if (err && typeof err === 'object') {
            if (err.message) {
              msg = err.message;
            } else if (err.error && typeof err.error === 'object' && err.error.message) {
              msg = err.error.message;
            }
          }

          console.log('🔴 Mensaje final de error:', msg);
          this.errorMessage.set(msg);
          this.voiceService.speak(msg);
          this.focusInput('email');
          this.cdr.markForCheck();
        }
      });
  }




  public onSubmitNewPassword(): void {
    if (this.isDestroyed) return;
    if (this.isLoading()) return;

    this.resetPasswordForm.markAllAsTouched();

    const codeCtrl = this.resetPasswordForm.get('code');
    const passwordCtrl = this.resetPasswordForm.get('password');
    const confirmCtrl = this.resetPasswordForm.get('confirmPassword');

    if (this.resetPasswordForm.invalid) {
      let errorMessages: string[] = [];

      if (codeCtrl?.hasError('required')) {
        errorMessages.push('El código de verificación es obligatorio.');
      }
      if (codeCtrl?.hasError('minlength')) {
        errorMessages.push('El código debe tener 6 dígitos.');
      }
      if (passwordCtrl?.hasError('required')) {
        errorMessages.push('La contraseña es obligatoria.');
      }
      if (passwordCtrl?.hasError('minlength')) {
        errorMessages.push('La contraseña debe tener al menos 9 caracteres.');
      }
      if (passwordCtrl?.hasError('pattern')) {
        errorMessages.push('La contraseña debe incluir mayúscula, minúscula, número y símbolo.');
      }
      if (confirmCtrl?.hasError('required')) {
        errorMessages.push('Debes confirmar la contraseña.');
      }
      if (this.resetPasswordForm.hasError('passwordsMismatch') && confirmCtrl?.dirty) {
        errorMessages.push('Las contraseñas no coinciden.');
      }

      let voiceMsg = 'El formulario contiene errores. ';
      if (errorMessages.length === 1) {
        voiceMsg += errorMessages[0];
      } else if (errorMessages.length === 2) {
        voiceMsg += errorMessages[0] + ' Y ' + errorMessages[1];
      } else if (errorMessages.length > 2) {
        const last = errorMessages.pop();
        voiceMsg += errorMessages.join(' ') + ' Y ' + last;
      }
      voiceMsg += ' Revisa los campos resaltados.';

      this.errorMessage.set(voiceMsg);
      this.voiceService.speak(voiceMsg);

      if (codeCtrl?.invalid) {
        setTimeout(() => this.focusInput('code'), 500);
      } else if (passwordCtrl?.invalid) {
        setTimeout(() => this.focusInput('password'), 500);
      } else if (confirmCtrl?.invalid) {
        setTimeout(() => this.focusInput('confirmPassword'), 500);
      }

      this.cdr.markForCheck();
      return;
    }

    const code = this.resetPasswordForm.value.code;
    if (!code || code.trim().length === 0) {
      const msg = 'Falta el código de verificación. Revisa tu correo y di "código" para introducirlo.';
      this.errorMessage.set(msg);
      this.voiceService.speak(msg);
      this.focusInput('code');
      this.cdr.markForCheck();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.voiceService.speak('Actualizando contraseña...');

    const payload = {
      email: this.forgotPasswordForm.value.email,
      code: this.resetPasswordForm.value.code,
      newPassword: this.resetPasswordForm.value.password,
      confirmPassword: this.resetPasswordForm.value.confirmPassword
    };

    console.log('🔍 [ForgotPassword] Payload a enviar:', JSON.stringify({
      email: payload.email,
      code: payload.code,
      newPassword: payload.newPassword ? `[${payload.newPassword.length} chars]` : 'VACÍO',
      confirmPassword: payload.confirmPassword ? `[${payload.confirmPassword.length} chars]` : 'VACÍO'
    }, null, 2));

    this.authService.resetPassword(payload)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.isFinished.set(true);
          this.voiceService.speak('¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.');
          console.log('✅ Contraseña actualizada correctamente');
        },
        error: (err) => {
          console.log('🔴 [ForgotPassword] Error reset-password:', err);

          let msg = 'Código inválido o expirado. Inténtalo de nuevo.';

          if (err?.status === 0) {
            msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          } else if (err?.status === 400) {
            msg = err.message || 'Los datos enviados no son válidos. Verifica el código y la contraseña.';
          } else if (err?.status === 401 || err?.status === 403) {
            msg = 'El código de verificación no es válido o ha expirado. Solicita uno nuevo.';
          } else if (err?.status === 500) {
            msg = 'Error en el servidor. Inténtalo más tarde.';
          } else if (err?.message) {
            msg = err.message;
          } else if (err?.error?.message) {
            msg = err.error.message;
          }

          this.errorMessage.set(msg);
          this.voiceService.speak(msg);
          this.focusInput('code');
        }
      });
  }

  // ============================================================
  // DESTRUCCIÓN
  // ============================================================
  ngOnDestroy(): void {
    console.log('🧹 ForgotPasswordComponent destruido');

    this.mutedSubscription?.unsubscribe();

    this.isDestroyed = true;

    if (this.voiceFeedbackSubscription) {
      this.voiceFeedbackSubscription.unsubscribe();
      this.voiceFeedback$.complete();
    }

    if (this.dictationMode) {
      this.stopDictation(undefined, true);
    }

    this.destroy$.next();
    this.destroy$.complete();
    this.voiceContext.resetContext();
    window.speechSynthesis.cancel();

    this.fieldCleanup.unregisterField('email');
    this.fieldCleanup.unregisterField('code');
    this.fieldCleanup.unregisterField('password');
    this.fieldCleanup.unregisterField('confirmPassword');

    this.dictationMode = false;
    this.dictationTarget = null;
    this.dictationBuffer = '';
  }
}