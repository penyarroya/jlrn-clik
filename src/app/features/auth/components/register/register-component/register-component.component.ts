// // import { Component, OnInit } from '@angular/core';

// // @Component({
// //   selector: 'app-register-component',
// //   templateUrl: './register-component.component.html',
// //   styleUrls: ['./register-component.component.scss'],
// //   imports: [],
// // })
// // export class RegisterComponentComponent  implements OnInit {

// //   constructor() { }

// //   ngOnInit() {}

// // }




// // src/app/features/auth/components/register/register.component.ts

// import {
//   Component,
//   signal,
//   inject,
//   OnDestroy,
//   ViewChild,
//   ChangeDetectorRef,
//   AfterViewInit,
//   Renderer2,
//   OnInit,
//   NgZone,
//   ChangeDetectionStrategy
// } from '@angular/core';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { finalize, Subject, Subscription, takeUntil } from 'rxjs';

// import {
//   IonContent,
//   IonButton,
//   IonInput,
//   IonItem,
//   IonIcon,
//   IonText,
//   IonSpinner
// } from '@ionic/angular';

// import { addIcons } from 'ionicons';
// import {
//   personCircleOutline,
//   mailOutline,
//   lockClosedOutline,
//   eyeOutline,
//   eyeOffOutline,
//   personOutline,
//   idCardOutline,
//   timerOutline,
//   keyOutline,
//   clipboardOutline,
//   alertCircleOutline,
//   checkmarkCircleOutline,
//   closeCircleOutline,
//   arrowBackOutline
// } from 'ionicons/icons';

// // ✅ Ajusta estas rutas a tu estructura real
// import {
//   usernameValidator,
//   passwordValidator,
//   emailValidator,
//   matchValidator
// } from '../../../../../shared/validators/validators';
// import { AuthService } from '../../../Services/auth-service';
// import { FieldCleanupService } from '../../../../services/voz/field-cleanup.service';
// import { VoiceContextService } from '../../../../services/voz/voice-context.service';
// import { VoiceFilterService } from '../../../../services/voz/voice-filter.service';
// import { VoiceService } from '../../../../services/voz/voice.service';

// @Component({
//   selector: 'app-register',              // ✅ o 'app-register-component' si prefieres
//   imports: [
//     ReactiveFormsModule,                  // ✅ CommonModule fuera si usas @if/@for
//     RouterModule,
//     IonContent,
//     IonButton,
//     IonInput,
//     IonItem,
//     IonIcon,
//     IonText,
//     IonSpinner
//   ],
//   templateUrl: './register-component.component.html',   // ✅ typo corregido
//   styleUrls: ['./register-component.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {
//   private readonly fb = inject(FormBuilder);
//   private readonly authService = inject(AuthService);
//   private readonly router = inject(Router);
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly renderer = inject(Renderer2);
//   private readonly ngZone = inject(NgZone);

//   private readonly voiceService = inject(VoiceService);
//   private readonly voiceContext = inject(VoiceContextService);
//   private readonly voiceFilter = inject(VoiceFilterService);
//   private readonly fieldCleanup = inject(FieldCleanupService);

//   private timerInterval: any;
//   private isDestroyed = false;
//   private isVerifyingCode = false;
//   private destroy$ = new Subject<void>();
//   private formCompleteNotified = false;
//   private enableLogs = true;
//   private otpVerificationCompleted = false;

//   private dictationMode = false;
//   private dictationTarget:
//     | 'fullName'
//     | 'email'
//     | 'password'
//     | 'confirmPassword'
//     | 'firstName'
//     | 'lastName'
//     | 'otp'
//     | null = null;
//   private dictationBuffer = '';
//   private helpShown = false;

//   private isClearingOtp = false;
//   private clearOtpTimeout: any = null;
//   private isSpeaking = false;
//   private isReadingFields = false;

//   private otpDigitBuffer = '';
//   private otpTimer: any;

//   readonly isMicActive = signal<boolean>(!this.voiceService.isCurrentlyMuted());
//   private mutedSubscription?: Subscription;

//   readonly receivedOtpCode = signal<string | null>(null);
//   private otpCodeRead = false;

//   otpSlots: { filled: boolean; active: boolean; error: boolean }[] = [];
//   otpDigitCount = 0;
//   isDictating = false;
//   otpError = '';

//   private lastProcessedCommand = '';
//   private lastProcessedTime = 0;
//   private readonly COMMAND_DEBOUNCE = 2000;

//   private noSpeechAttempts = 0;
//   private readonly MAX_NO_SPEECH_ATTEMPTS = 10;

//   private firstCommandIgnored = false;

//   private isRegistering = false;

//   private readonly fieldOrder: string[] = [
//     'fullName',
//     'email',
//     'password',
//     'confirmPassword',
//     'firstName',
//     'lastName'
//   ];

//   @ViewChild('nameInput') nameInput!: IonInput;
//   @ViewChild('userInput') userInput!: IonInput;
//   @ViewChild('emailInput') emailInput!: IonInput;
//   @ViewChild('passwordInput') passwordInput!: IonInput;
//   @ViewChild('confirmPasswordInput') confirmPasswordInput!: IonInput;
//   @ViewChild('otpInput') otpInput!: IonInput;
//   @ViewChild('lastNameInput') lastNameInput!: IonInput;

//   hidePassword = signal(true);
//   hideConfirmPassword = signal(true);
//   isLoading = signal(false);
//   isVerifying = signal(false);
//   errorMessage = signal<string | null>(null);
//   timerSeconds = signal(120);
//   verificationCode = signal('');

//   private readonly WELCOME_MESSAGE =
//     'Bienvenido al registro. Di "usuario", "correo", "contraseña", "confirmar", "nombre", "apellidos", "registrar" para enviar, "limpiar" para borrar campos, "leer campos" para escuchar el contenido, o "ayuda" para más opciones.';

//   private readonly HELP_MESSAGE =
//     'En el registro puedes decir: "usuario" para el nombre de usuario, ' +
//     '"correo" para el email, ' +
//     '"contraseña" para tu clave, ' +
//     '"confirmar" para repetirla, ' +
//     '"nombre" para tu nombre propio, ' +
//     '"apellidos" para tus apellidos, ' +
//     '"registrar" o "enviar" para crear la cuenta, ' +
//     '"limpiar" para borrar todos los campos, ' +
//     '"leer campos" para escuchar el contenido de todos los campos, ' +
//     '"volver" para regresar, ' +
//     '"pegar código" para rellenar el código OTP automáticamente, ' +
//     '"iniciar sesión" para ir a la pantalla de inicio de sesión, ' +
//     'o "ayuda" para repetir este mensaje.';

//   readonly registerForm: FormGroup = this.fb.group({
//     fullName: ['', [Validators.required, usernameValidator()]],
//     email: ['', [Validators.required, emailValidator()]],
//     password: ['', [Validators.required, passwordValidator(9)]],
//     confirmPassword: ['', [Validators.required, matchValidator('password')]],
//     firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
//     lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
//   });

//   get fullNameCtrl() { return this.registerForm.get('fullName')!; }
//   get emailCtrl() { return this.registerForm.get('email')!; }
//   get passwordCtrl() { return this.registerForm.get('password')!; }
//   get confirmPasswordCtrl() { return this.registerForm.get('confirmPassword')!; }
//   get firstNameCtrl() { return this.registerForm.get('firstName')!; }
//   get lastNameCtrl() { return this.registerForm.get('lastName')!; }

//   constructor() {
//     console.log('🏗️ RegisterComponent constructor');
//     console.log('🎤 Estado del micrófono al inicio:', this.voiceService.isCurrentlyMuted() ? 'MUTEADO' : 'ACTIVO');

//     addIcons({
//       personCircleOutline,
//       mailOutline,
//       lockClosedOutline,
//       eyeOutline,
//       eyeOffOutline,
//       personOutline,
//       idCardOutline,
//       timerOutline,
//       keyOutline,
//       clipboardOutline,
//       alertCircleOutline,
//       checkmarkCircleOutline,
//       closeCircleOutline,
//       arrowBackOutline
//     });

//     this.registerForm.valueChanges.subscribe(() => {
//       if (this.errorMessage()) {
//         this.errorMessage.set(null);
//         this.cdr.markForCheck();
//       }
//     });

//     this.registerForm.get('password')?.valueChanges.subscribe(() => {
//       const confirmControl = this.registerForm.get('confirmPassword');
//       if (confirmControl) {
//         confirmControl.markAsDirty();
//         confirmControl.markAsTouched();
//         confirmControl.updateValueAndValidity();
//       }
//     });
//   }

//   ngOnInit(): void {
//     console.log('✅ RegisterComponent inicializado (con voz)');

//     if (this.voiceService.isCurrentlyMuted()) {
//       console.log('🎤 [Register] Micrófono MUTEADO - el usuario debe activarlo con "hola" o manualmente.');
//     } else {
//       console.log('🎤 [Register] Micrófono ACTIVO - el reconocimiento ya está funcionando.');
//     }

//     this.mutedSubscription = this.voiceService.getMutedState().subscribe(muted => {
//       this.isMicActive.set(!muted);
//       this.cdr.markForCheck();
//     });

//     const context = {
//       activationMessage: this.WELCOME_MESSAGE,
//       availableCommands: [
//         'usuario', 'email', 'correo', 'contraseña', 'confirmar',
//         'nombre', 'apellidos', 'registrar', 'enviar', 'limpiar',
//         'volver', 'ayuda', 'código', 'verificar', 'leer campos',
//         'pegar código', 'copiar código', 'iniciar sesión'
//       ],
//       preventBackend: true
//     };
//     this.voiceContext.setContext(context);

//     this.voiceService
//       .getTranscriptWithFinal()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (transcript: { text: string; isFinal: boolean }) => {
//           const text = transcript.text;
//           const isFinal = transcript.isFinal;
//           if (!text) return;

//           if (!this.firstCommandIgnored) {
//             this.firstCommandIgnored = true;
//             console.log(`⏭️ [Register] Primer comando ignorado: "${text}"`);
//             return;
//           }

//           console.log(`📝 [Register] Transcript recibido: "${text}" (Final: ${isFinal})`);

//           this.ngZone.run(() => {
//             if (this.isDestroyed) return;
//             this.handleVoiceCommand(text, isFinal);
//           });
//         },
//         error: (err) => {
//           console.error('❌ [Register] Error en transcript:', err);
//         }
//       });

//     this.voiceService.ready$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((ready) => {
//         if (ready) {
//           this.noSpeechAttempts = 0;
//           return;
//         }

//         if (!ready && !this.isDestroyed) {
//           this.noSpeechAttempts++;
//           if (this.noSpeechAttempts >= this.MAX_NO_SPEECH_ATTEMPTS) {
//             console.warn('🔇 Demasiados errores de no-speech, dejando de reintentar');
//             this.noSpeechAttempts = 0;
//             return;
//           }

//           console.log(`🔄 [Register] Reconocimiento caído, reintento ${this.noSpeechAttempts}...`);
//           setTimeout(() => {
//             if (!this.isDestroyed) {
//               this.voiceService.startListening();
//             }
//           }, 500);
//         }
//       });

//     setTimeout(() => {
//       if (!this.isDestroyed && !this.voiceService.isCurrentlyMuted() && !this.isVerifying()) {
//         this.voiceService.speakAlways(this.WELCOME_MESSAGE);
//       }
//     }, 1000);

//     this.registerFieldsForCleanup();

//     this.registerForm.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => {
//         if (this.isFormCompleteAndValid() && !this.formCompleteNotified) {
//           this.formCompleteNotified = true;
//           this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
//         } else if (!this.isFormCompleteAndValid()) {
//           this.formCompleteNotified = false;
//         }
//       });

//     this.resetOtpVisuals();
//   }

//   ngAfterViewInit(): void {
//     console.log('👀 RegisterComponent AfterViewInit');
//     this.setupFocusListeners();
//     this.cdr.markForCheck();
//   }

//   // ============================================================
//   // REGISTRO DE CAMPOS
//   // ============================================================

//   private registerFieldsForCleanup(): void {
//     const fields = [
//       { name: 'fullName', label: 'usuario' },
//       { name: 'email', label: 'correo' },
//       { name: 'password', label: 'contraseña' },
//       { name: 'confirmPassword', label: 'confirmar' },
//       { name: 'firstName', label: 'nombre' },
//       { name: 'lastName', label: 'apellidos' }
//     ];

//     for (const field of fields) {
//       this.fieldCleanup.registerField({
//         name: field.name,
//         label: field.label,
//         isFocused: false,
//         clear: () => this.clearField(field.name),
//         isEmpty: () => !this.registerForm.get(field.name)?.value,
//         canClear: true
//       });
//     }
//   }

//   private setupFocusListeners(): void {
//     const focusConfigs = [
//       { field: 'fullName', input: this.userInput },
//       { field: 'email', input: this.emailInput },
//       { field: 'password', input: this.passwordInput },
//       { field: 'confirmPassword', input: this.confirmPasswordInput },
//       { field: 'firstName', input: this.nameInput },
//       { field: 'lastName', input: this.lastNameInput }
//     ];

//     for (const config of focusConfigs) {
//       if (config.input) {
//         config.input.getInputElement().then((nativeEl: HTMLInputElement) => {
//           nativeEl.addEventListener('focus', () => {
//             this.fieldCleanup.registerField({
//               name: config.field,
//               label: this.getFieldLabel(config.field),
//               isFocused: true,
//               clear: () => this.clearField(config.field),
//               isEmpty: () => !this.registerForm.get(config.field)?.value
//             });
//           });

//           nativeEl.addEventListener('blur', () => {
//             this.fieldCleanup.registerField({
//               name: config.field,
//               label: this.getFieldLabel(config.field),
//               isFocused: false,
//               clear: () => this.clearField(config.field),
//               isEmpty: () => !this.registerForm.get(config.field)?.value
//             });
//           });
//         });
//       }
//     }
//   }

//   private getFieldLabel(fieldName: string): string {
//     const labels: Record<string, string> = {
//       fullName: 'usuario',
//       email: 'correo',
//       password: 'contraseña',
//       confirmPassword: 'confirmar',
//       firstName: 'nombre',
//       lastName: 'apellidos'
//     };
//     return labels[fieldName] || fieldName;
//   }

//   // ============================================================
//   // COMANDOS DE VOZ
//   // ============================================================

//   private handleVoiceCommand(text: string, isFinal: boolean = false): void {
//     if (this.isDestroyed) return;

//     if (this.isReadingFields) {
//       const lower = text.toLowerCase().trim();
//       if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//         this.isReadingFields = false;
//         window.speechSynthesis.cancel();
//         this.goBack();
//         return;
//       }
//       console.log('⏭️ [Register] Ignorando comando mientras se leen campos:', text);
//       return;
//     }

//     const lower = text.toLowerCase().trim();
//     console.log(`🔍 [handleVoiceCommand] isVerifying: ${this.isVerifying()}, lower: "${lower}"`);

//     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//       this.goBack();
//       return;
//     }

//     if (lower.includes('iniciar sesión') || lower.includes('ir a login') || lower.includes('login') || lower.includes('inicia sesión')) {
//       this.voiceService.speak('Navegando a inicio de sesión.');
//       this.router.navigateByUrl('/login', { replaceUrl: true });
//       return;
//     }

//     if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
//       this.showHelp();
//       return;
//     }

//     if (this.isVerifying()) {
//       console.log('🔐 OTP - Modo verificación activo, texto:', lower);

//       if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
//           lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
//           lower.includes('escribir código') || lower.includes('escribir codigo')) {
//         this.pasteOtpCode();
//         return;
//       }

//       if (lower.includes('código') || lower.includes('codigo') || lower.includes('otp') || lower.includes('dictar')) {
//         console.log('🔁 OTP - Activando dictado y reseteando');
//         this.otpDigitBuffer = '';
//         this.verificationCode.set('');
//         if (this.otpInput) {
//           this.otpInput.value = '';
//           this.otpInput.setFocus();
//         }
//         this.resetOtpVisuals();
//         this.cdr.detectChanges();
//         this.voiceService.speak('Campo OTP enfocado. Dicta los dígitos.');
//         return;
//       }

//       if (lower.includes('limpiar') || lower.includes('borrar') || lower.includes('reset')) {
//         this.otpDigitBuffer = '';
//         this.verificationCode.set('');
//         if (this.otpInput) {
//           this.otpInput.value = '';
//         }
//         this.resetOtpVisuals();
//         this.cdr.detectChanges();
//         this.voiceService.speak('Código limpiado.');
//         return;
//       }

//       if (lower.includes('verificar') || lower.includes('validar') || lower.includes('confirmar código') || lower.includes('aceptar')) {
//         if (this.otpDigitBuffer.length === 6) {
//           this.verifyCode(this.otpDigitBuffer);
//         } else {
//           this.voiceService.speak(`Tienes ${this.otpDigitBuffer.length} dígitos. Deben ser 6.`);
//           this.verifyCode();
//         }
//         return;
//       }

//       if (lower.includes('leer') || lower.includes('mostrar') || lower.includes('qué tengo')) {
//         const currentCode = this.otpDigitBuffer || 'vacío';
//         const digitCount = this.otpDigitBuffer.length;
//         if (digitCount === 0) {
//           this.voiceService.speak('No has ingresado ningún dígito aún.');
//         } else {
//           this.voiceService.speak(`Has ingresado ${digitCount} dígitos: ${currentCode.split('').join(' ')}.`);
//         }
//         return;
//       }

//       if (lower.includes('ayuda') || lower.includes('qué puedo decir')) {
//         this.voiceService.speak(
//           'Comandos disponibles: "código" para activar dictado, ' +
//           'dí los números uno por uno, "limpiar" para borrar, ' +
//           '"leer" para escuchar los dígitos ingresados, ' +
//           '"pegar código" para rellenar automáticamente el código, ' +
//           '"verificar" para validar, "atrás" para volver.'
//         );
//         return;
//       }

//       const numericText = this.voiceFilter.convertPhraseToText(lower, false);
//       const digits = numericText.replace(/\D/g, '');
//       console.log(`🔢 OTP - Texto convertido: "${numericText}", dígitos extraídos: "${digits}"`);

//       if (digits.length > 0) {
//         this.otpDigitBuffer = digits.slice(0, 6);
//         console.log(`🔢 OTP - Buffer actual: "${this.otpDigitBuffer}"`);

//         if (this.otpInput) {
//           this.otpInput.value = this.otpDigitBuffer;
//         }
//         this.verificationCode.set(this.otpDigitBuffer);
//         this.updateOtpSlots(this.otpDigitBuffer);
//         this.cdr.detectChanges();

//         if (isFinal && this.otpDigitBuffer.length === 6 && !this.otpVerificationCompleted && !this.isVerifyingCode) {
//           console.log('✅ OTP - 6 dígitos completos (FINAL), verificando...');
//           this.dictationMode = false;
//           this.dictationTarget = null;
//           this.verifyCode(this.otpDigitBuffer);
//           this.otpDigitBuffer = '';
//           this.verificationCode.set('');
//           if (this.otpInput) {
//             this.otpInput.value = '';
//           }
//           this.resetOtpVisuals();
//           this.cdr.detectChanges();
//         }
//         return;
//       }

//       console.log('⏭️ OTP - Comando no reconocido:', lower);
//       return;
//     }

//     // Debounce
//     const now = Date.now();
//     if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//       console.log(`⏭️ Register: comando duplicado ignorado: "${lower}"`);
//       return;
//     }
//     this.lastProcessedCommand = lower;
//     this.lastProcessedTime = now;

//     if (this.dictationMode && this.dictationTarget && this.dictationTarget !== 'otp') {
//       this.handleDictation(lower);
//       return;
//     }

//     if ((lower.includes('confirmar contraseña') ||
//         lower.includes('confirmar clave') ||
//         lower.includes('repetir contraseña') ||
//         lower === 'confirmar' ||
//         lower.startsWith('confirmar ')) &&
//         !(this.dictationMode && this.dictationTarget === 'confirmPassword')) {
//       console.log('📝 [Register] Iniciando dictado de confirmación');
//       this.startDictation('confirmPassword', '');
//       return;
//     }

//     const fieldLabels = this.fieldCleanup.getFieldLabels();
//     for (const label of fieldLabels) {
//       if (lower.includes(`limpiar ${label}`) || lower.includes(`borrar ${label}`)) {
//         const result = this.fieldCleanup.clearFieldByLabel(label);
//         if (result.success && this.dictationMode) {
//           this.stopDictation('', true);
//         }
//         return;
//       }
//     }

//     if (lower.includes('limpiar campo') || lower.includes('borrar campo')) {
//       this.fieldCleanup.clearFocusedField();
//       if (this.dictationMode) {
//         this.stopDictation('', true);
//       }
//       return;
//     }

//     if (lower === 'limpiar' || lower === 'borrar' || lower === 'resetear') {
//       this.fieldCleanup.clearAllFields();
//       if (this.dictationMode) {
//         this.stopDictation('', true);
//       }
//       return;
//     }

//     if (/^(usuario|nombre de usuario|user|username)\b/.test(lower)) {
//       const rest = lower.replace(/^(usuario|nombre de usuario|user|username)\s*/, '').trim();
//       this.startDictation('fullName', rest);
//       return;
//     }
//     if (/^(email|correo|correo electrónico)\b/.test(lower)) {
//       const rest = lower.replace(/^(email|correo|correo electrónico)\s*/, '').trim();
//       this.startDictation('email', rest);
//       return;
//     }
//     if (/^(nombre|nombre propio|firstname|name)\b/.test(lower)) {
//       const rest = lower.replace(/^(nombre|nombre propio|firstname|name)\s*/, '').trim();
//       this.startDictation('firstName', rest);
//       return;
//     }
//     if (/^(apellidos|apellido|lastname|surname)\b/.test(lower)) {
//       const rest = lower.replace(/^(apellidos|apellido|lastname|surname)\s*/, '').trim();
//       this.startDictation('lastName', rest);
//       return;
//     }
//     if (/^(contraseña|clave|password|pass)\b/.test(lower)) {
//       const rest = lower.replace(/^(contraseña|clave|password|pass)\s*/, '').trim();
//       this.startDictation('password', rest);
//       return;
//     }

//     if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
//       const missing = this.getMissingFields();
//       if (missing.length === 0) {
//         this.voiceService.speak('Todos los campos están completos y válidos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
//       } else {
//         const firstMissing = this.getFirstMissingField(missing);
//         if (firstMissing) {
//           this.focusInput(firstMissing);
//         }
//         const fieldLabelsList = missing.map(f => `"${this.getFieldLabel(f)}"`).join(', ');
//         this.voiceService.speak(`Faltan los campos: ${fieldLabelsList}. Di el nombre de uno para editarlo.`);
//       }
//       return;
//     }

//     if (lower.includes('leer campos') || lower === 'leer' || lower.includes('leer todo') ||
//         lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
//         lower.includes('qué he escrito') || lower.includes('revisar campos') ||
//         lower.includes('comprobar campos') || lower.includes('ver campos')) {
//       console.log('📖 [Register] Comando "leer campos" detectado');
//       this.readAllFields();
//       return;
//     }

//     if (lower.includes('registrar') || lower.includes('enviar') || lower.includes('crear cuenta')) {
//       if (this.isRegistering || this.isVerifying()) {
//         console.log('⏭️ Register: ya se está procesando un registro o verificación, ignorando duplicado');
//         return;
//       }
//       this.submitForm();
//       return;
//     }

//     console.log('🔍 Register - Comando no reconocido:', lower);
//   }

//   // ============================================================
//   // LEER TODOS LOS CAMPOS
//   // ============================================================

//   private readAllFields(): void {
//     if (this.isDestroyed) return;

//     this.isReadingFields = true;

//     const fieldConfigs = [
//       { key: 'fullName', label: 'Usuario' },
//       { key: 'email', label: 'Correo' },
//       { key: 'password', label: 'Contraseña' },
//       { key: 'confirmPassword', label: 'Confirmación' },
//       { key: 'firstName', label: 'Nombre' },
//       { key: 'lastName', label: 'Apellidos' }
//     ];

//     const filledFields: string[] = [];
//     const emptyFields: string[] = [];

//     for (const field of fieldConfigs) {
//       const control = this.registerForm.get(field.key);
//       const value = control?.value || '';
//       if (value && value.trim().length > 0) {
//         if (field.key === 'password' || field.key === 'confirmPassword') {
//           filledFields.push(`${field.label}: completado`);
//         } else if (field.key === 'email' && value) {
//           let emailText = value
//             .replace(/@/g, ' arroba ')
//             .replace(/\.com$/, ' punto com')
//             .replace(/\./g, ' punto ')
//             .replace(/\s+/g, ' ')
//             .trim();
//           filledFields.push(`${field.label}: ${emailText}`);
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
//         messages.push('Di "registrar" para crear la cuenta.');
//       }
//     }

//     this.speakWithPausesAndCallback(messages, 600, () => {
//       this.isReadingFields = false;
//     });
//   }

//   private speakWithPausesAndCallback(messages: string[], pauseMs: number = 500, callback: (() => void) | null = null): void {
//     if (this.isDestroyed || messages.length === 0) {
//       if (callback) callback();
//       return;
//     }

//     let index = 0;

//     const speakNext = () => {
//       if (this.isDestroyed || index >= messages.length) {
//         if (callback) callback();
//         return;
//       }

//       const message = messages[index];
//       console.log(`🔊 [Register] Hablando (${index + 1}/${messages.length}): "${message}"`);

//       this.voiceService.speak(message).then(() => {
//         index++;
//         if (index < messages.length) {
//           setTimeout(() => { speakNext(); }, pauseMs);
//         } else {
//           if (callback) callback();
//         }
//       }).catch(() => {
//         index++;
//         if (index < messages.length) {
//           setTimeout(() => { speakNext(); }, pauseMs);
//         } else {
//           if (callback) callback();
//         }
//       });
//     };

//     speakNext();
//   }

//   // ============================================================
//   // LIMPIEZA DE CAMPOS
//   // ============================================================

//   private getFocusedField(): string | null {
//     const activeElement = document.activeElement;
//     const fieldMap: Record<string, IonInput | undefined> = {
//       fullName: this.userInput,
//       email: this.emailInput,
//       password: this.passwordInput,
//       confirmPassword: this.confirmPasswordInput,
//       firstName: this.nameInput,
//       lastName: this.lastNameInput
//     };

//     for (const [fieldName, inputRef] of Object.entries(fieldMap)) {
//       if (!inputRef) continue;
//       const el = (inputRef as any).el;
//       if (el && el.contains(activeElement)) {
//         return fieldName;
//       }
//     }
//     return null;
//   }

//   private clearField(target: string): void {
//     if (this.isDestroyed) return;

//     window.speechSynthesis.cancel();
//     this.isSpeaking = false;

//     if (this.dictationMode) {
//       this.stopDictation(undefined, true);
//     }

//     const fieldName = this.getFieldLabel(target);
//     const control = this.registerForm.get(target);
//     if (!control) return;

//     const currentValue = control.value || '';

//     if (!currentValue) {
//       this.voiceService.speak(`El campo ${fieldName} ya está vacío.`);
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

//     this.voiceService.speak(`Campo ${fieldName} limpiado.`);
//     this.log(`🧹 Campo ${fieldName} limpiado`);
//     this.focusInput(target);
//   }

//   private clearFields(): void {
//     if (this.isDestroyed) return;

//     window.speechSynthesis.cancel();
//     this.isSpeaking = false;

//     if (this.dictationMode) this.stopDictation(undefined, true);

//     const fields = ['fullName', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
//     const hasValues = fields.some(field => {
//       const value = this.registerForm.get(field)?.value;
//       return value && value.length > 0;
//     });

//     if (!hasValues) {
//       this.voiceService.speak('Los campos ya están vacíos.');
//       return;
//     }

//     for (const field of fields) {
//       const control = this.registerForm.get(field);
//       if (control) {
//         control.setValue('', { emitEvent: true });
//         control.markAsPristine();
//         control.markAsUntouched();
//         this.updateFormAndInputDirectly(field, '');
//       }
//     }

//     this.errorMessage.set(null);
//     this.dictationBuffer = '';
//     this.cdr.markForCheck();
//     this.voiceService.speak('Todos los campos han sido limpiados.');
//     this.focusInput('fullName');
//     this.log('🧹 Todos los campos limpiados');
//   }

//   private log(...args: any[]): void {
//     if (this.enableLogs) console.log(...args);
//   }

//   // ============================================================
//   // DICTADO
//   // ============================================================

//   private startDictation(
//     target: 'fullName' | 'email' | 'password' | 'confirmPassword' | 'firstName' | 'lastName',
//     initialText = ''
//   ): void {
//     if (this.isDestroyed) return;
//     this.dictationMode = true;
//     this.dictationTarget = target;
//     this.dictationBuffer = '';

//     const fieldNames: Record<string, string> = {
//       fullName: 'usuario',
//       email: 'correo',
//       password: 'contraseña',
//       confirmPassword: 'confirmar',
//       firstName: 'nombre',
//       lastName: 'apellidos'
//     };
//     const fieldName = fieldNames[target] || target;

//     this.updateFormAndInputDirectly(target, '');

//     if (initialText) {
//       this.updateFormAndInputDirectly(target, initialText);
//       this.dictationBuffer = initialText.trimEnd();
//       this.voiceService.speak(`Dictando para ${fieldName}. Texto inicial: ${initialText}`);
//     } else {
//       const finishWords = this.voiceFilter.getFinishWords().slice(0, 2).join('" o "');
//       this.voiceService.speak(`Dictando ${fieldName}. Di "${finishWords}" para finalizar.`);
//     }

//     this.focusInput(target);
//     console.log(`🎤 Dictado activado para: ${target}`);
//   }

//   private startDictationForOTP(): void {
//     if (this.isDestroyed) return;
//     console.log('🎤 Activando dictado OTP');
//     this.otpDigitBuffer = '';
//     this.verificationCode.set('');
//     if (this.otpInput) {
//       this.otpInput.value = '';
//       this.otpInput.setFocus();
//     }
//     this.resetOtpVisuals();
//     this.cdr.detectChanges();
//     this.voiceService.speak('Modo dictado activado. Di los 6 dígitos.');
//   }

//   private handleDictation(text: string): void {
//     console.log('📝 [handleDictation] Recibido:', text);
//     if (this.isDestroyed || !this.dictationTarget) return;
//     const target = this.dictationTarget;

//     if (target === 'otp') {
//       this.handleVoiceCommand(text);
//       return;
//     }

//     const lower = text.toLowerCase().trim();

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
//       const missing = this.getMissingFields();
//       if (missing.length === 0) {
//         this.voiceService.speak('Todos los campos están completos y válidos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
//       } else {
//         const firstMissing = this.getFirstMissingField(missing);
//         if (firstMissing) {
//           this.focusInput(firstMissing);
//         }
//         const fieldLabels = missing.map(f => `"${this.getFieldLabel(f)}"`).join(', ');
//         this.voiceService.speak(`Faltan los campos: ${fieldLabels}. Di el nombre de uno para editarlo.`);
//       }
//       return;
//     }

//     if (lower.includes('leer campos') || lower === 'leer' || lower.includes('leer todo') ||
//         lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
//         lower.includes('qué he escrito') || lower.includes('revisar campos') ||
//         lower.includes('comprobar campos') || lower.includes('ver campos')) {
//       console.log('📖 [handleDictation] Comando "leer campos" detectado en dictado');
//       this.stopDictation('', true);
//       this.readAllFields();
//       return;
//     }

//     const fieldLabels = this.fieldCleanup.getFieldLabels();
//     for (const label of fieldLabels) {
//       if (lower.includes(`limpiar ${label}`) || lower.includes(`borrar ${label}`)) {
//         const result = this.fieldCleanup.clearFieldByLabel(label);
//         if (result.success) {
//           this.stopDictation('', true);
//         }
//         return;
//       }
//     }

//     if (lower === 'limpiar' || lower === 'borrar') {
//       const result = this.fieldCleanup.clearFieldByName(target);
//       if (result.success) {
//         this.stopDictation('', true);
//         return;
//       }
//     }

//     const fieldName = this.getFieldLabel(target).toLowerCase();
//     const formControlName = this.getFormControlName(target);
//     const currentValue = this.registerForm.get(formControlName)?.value || '';

//     if (lower === fieldName && !currentValue) {
//       console.log(`🔁 [handleDictation] El usuario dijo "${fieldName}" y el campo está vacío. Reiniciando dictado...`);
//       this.startDictation(target, '');
//       return;
//     }

//     const normalized = text.toLowerCase().trim();

//     const validateAndSave = (finalValue: string): boolean => {
//       this.updateFormAndInputDirectly(target, finalValue);

//       if (!finalValue || finalValue.length === 0) {
//         const control = this.registerForm.get(target);
//         if (control && control.hasError('required')) {
//           this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
//           return false;
//         }
//         this.stopDictation('');
//         return true;
//       }

//       const validationError = this.validateField(target, finalValue);
//       if (validationError) {
//         const fieldLabel = this.getFieldLabel(target);
//         this.voiceService.speak(validationError + ' Se borrará el contenido. Vuelve a decir "' + fieldLabel + '" para escribir de nuevo.');
//         setTimeout(() => {
//           this.updateFormAndInputDirectly(target, '');
//         }, 3000);
//         return false;
//       }

//       this.stopDictation(finalValue);
//       return true;
//     };

//     if (normalized.endsWith('fin') || normalized.endsWith('terminar') ||
//         normalized.endsWith(' fin') || normalized.endsWith(' terminar')) {
//       console.log('🔴 [Register] Comando de finalización detectado (fin/terminar):', normalized);
//       let cleanText = normalized.replace(/\s*(fin|terminar)$/, '').trim();

//       if (!cleanText) {
//         const control = this.registerForm.get(target);
//         if (control && control.hasError('required')) {
//           this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
//           return;
//         }
//         this.updateFormAndInputDirectly(target, '');
//         this.stopDictation('');
//         return;
//       }

//       const processed = this.voiceFilter.processDictationPhrase(
//         cleanText,
//         this.getDictationContext(target),
//         false
//       );
//       if (processed.success) {
//         let textToAdd = processed.text;
//         if (target === 'firstName' || target === 'lastName') {
//           textToAdd = textToAdd
//             .replace(/(\d)\s+([a-zA-Záéíóúüñ])/g, '$1$2')
//             .replace(/([a-zA-Záéíóúüñ])\s+(\d)/g, '$1$2');
//         }
//         validateAndSave(textToAdd);
//       } else {
//         this.stopDictation(currentValue);
//       }
//       return;
//     }

//     if (normalized === 'fin' || normalized === 'terminar') {
//       console.log('🔴 [Register] Finalización directa');
//       const control = this.registerForm.get(target);
//       if (control && control.hasError('required')) {
//         this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
//         return;
//       }
//       this.updateFormAndInputDirectly(target, '');
//       this.stopDictation('');
//       return;
//     }

//     if (this.voiceFilter.containsFinishWords(text)) {
//       const cleanText = this.voiceFilter.removeFinishWords(text);
//       if (cleanText.length > 0) {
//         const processed = this.voiceFilter.processDictationPhrase(cleanText, this.getDictationContext(target), false);
//         if (processed.success) {
//           let textToAdd = processed.text;
//           if (target === 'firstName' || target === 'lastName') {
//             textToAdd = textToAdd
//               .replace(/(\d)\s+([a-zA-Záéíóúüñ])/g, '$1$2')
//               .replace(/([a-zA-Záéíóúüñ])\s+(\d)/g, '$1$2');
//           }
//           validateAndSave(textToAdd);
//         } else {
//           this.stopDictation(currentValue);
//         }
//       } else {
//         const control = this.registerForm.get(target);
//         if (control && control.hasError('required')) {
//           this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
//           return;
//         }
//         this.stopDictation(currentValue);
//       }
//       return;
//     }

//     if (text.includes('borrar') || text.includes('eliminar')) {
//       if (this.dictationBuffer.length > 0) {
//         const newValue = currentValue.slice(0, -this.dictationBuffer.length);
//         this.updateFormAndInputDirectly(target, newValue);
//         this.voiceService.speak(`Borrado: ${this.dictationBuffer.trim()}`);
//         this.dictationBuffer = '';
//       } else {
//         const newValue = currentValue.slice(0, -1);
//         this.updateFormAndInputDirectly(target, newValue);
//         this.voiceService.speak('Borrado último carácter');
//       }
//       return;
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

//     const shouldCapitalize = target === 'firstName' || target === 'lastName';
//     let processed = this.voiceFilter.processDictationPhrase(text, this.getDictationContext(target), shouldCapitalize);

//     if (!processed.success || !processed.text) {
//       const word = text.trim();
//       let finalWord = word;
//       if (shouldCapitalize && (currentValue === '' || currentValue.endsWith(' ')) && finalWord.length > 0) {
//         finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
//       }
//       processed = {
//         success: true,
//         text: finalWord + ' ',
//         originalText: text,
//         processedText: finalWord + ' '
//       } as any;
//     }

//     let textToAdd = processed.text;
//     if (target === 'firstName' || target === 'lastName') {
//       textToAdd = textToAdd
//         .replace(/(\d)\s+([a-zA-Záéíóúüñ])/g, '$1$2')
//         .replace(/([a-zA-Záéíóúüñ])\s+(\d)/g, '$1$2');
//     }

//     if (target !== 'password' && target !== 'confirmPassword') {
//       const newValue = currentValue + textToAdd;
//       this.updateFormAndInputDirectly(target, newValue);
//       console.log(`🔤 Dictado añadido (${target}): "${processed.text}" → "${newValue}"`);
//     } else {
//       this.dictationBuffer = processed.text.trimEnd();
//       if (this.enableLogs) {
//         console.log(`🔤 Dictado de contraseña en progreso (sin actualizar): "${processed.text}"`);
//       }
//     }
//   }

//   private validateField(target: string, value: string): string | null {
//     if (!value || value.trim().length === 0) {
//       return `El campo ${this.getFieldLabel(target)} no puede estar vacío.`;
//     }

//     const trimmed = value.trim();

//     switch (target) {
//       case 'email':
//         if (!trimmed.includes('@')) {
//           return 'El email debe contener "arroba".';
//         }
//         if (!trimmed.includes('.')) {
//           return 'El email debe contener un punto en el dominio.';
//         }
//         const emailControl = this.registerForm.get('email');
//         if (emailControl) {
//           emailControl.setValue(trimmed, { emitEvent: false });
//           emailControl.updateValueAndValidity({ emitEvent: false });
//           if (emailControl.invalid) {
//             return 'El email no tiene un formato válido.';
//           }
//         }
//         break;

//       case 'password':
//         if (trimmed.length < 9) {
//           return `La contraseña debe tener al menos 9 caracteres. Tiene ${trimmed.length}.`;
//         }
//         const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(trimmed);
//         const hasLower = /[a-záéíóúñ]/.test(trimmed);
//         const hasNumber = /\d/.test(trimmed);
//         const hasSpecial = /[!@#$%^&*(),.?":{}|<>-]/.test(trimmed);
//         const missing = [];
//         if (!hasUpper) missing.push('mayúscula');
//         if (!hasLower) missing.push('minúscula');
//         if (!hasNumber) missing.push('número');
//         if (!hasSpecial) missing.push('carácter especial');
//         if (missing.length > 0) {
//           return `Falta: ${missing.join(', ')}.`;
//         }
//         break;

//       case 'confirmPassword':
//         const password = this.registerForm.get('password')?.value || '';
//         if (trimmed !== password) {
//           return 'La confirmación no coincide con la contraseña.';
//         }
//         break;

//       case 'fullName':
//       case 'firstName':
//       case 'lastName':
//         if (trimmed.length < 2) {
//           return `El campo ${this.getFieldLabel(target)} debe tener al menos 2 caracteres.`;
//         }
//         break;

//       default:
//         if (trimmed.length === 0) {
//           return `El campo ${this.getFieldLabel(target)} no puede estar vacío.`;
//         }
//         break;
//     }

//     return null;
//   }

//   private async stopDictation(finalValue?: string, silent = false): Promise<void> {
//     console.log('🔴 [stopDictation] LLAMADO - target:', this.dictationTarget, 'silent:', silent);
//     if (this.isDestroyed) return;

//     const target = this.dictationTarget;
//     this.dictationMode = false;
//     this.dictationTarget = null;
//     this.dictationBuffer = '';
//     this.cdr.markForCheck();

//     if (!target) {
//       console.log('🔴 Dictado finalizado (sin target)');
//       return;
//     }

//     const formControlName = this.getFormControlName(target);
//     const value = finalValue !== undefined ? finalValue : this.registerForm.get(formControlName)?.value || '';
//     const trimmed = value.trimEnd();

//     if (!silent) {
//       if (trimmed.length > 0) {
//         this.updateFormAndInputDirectly(target, trimmed);
//         if (target !== 'password' && target !== 'confirmPassword') {
//           await this.voiceService.speak(`Listo, ${this.getFieldLabel(target)} completado.`);
//         }
//       } else {
//         await this.voiceService.speak('Dictado finalizado. Campo vacío.');
//       }
//     } else {
//       if (trimmed.length > 0) {
//         this.updateFormAndInputDirectly(target, trimmed);
//       }
//     }

//     if (target === 'password' && trimmed.length > 0 && !silent) {
//       await this.validatePasswordAfterDictation(trimmed);
//     }
//     if (target === 'confirmPassword' && trimmed.length > 0 && !silent) {
//       await this.validateConfirmPasswordAfterDictation();
//     }

//     if (target !== 'password' && target !== 'confirmPassword') {
//       const nextMissingField = this.getNextMissingField(target);
//       if (nextMissingField && !silent) {
//         await new Promise(resolve => setTimeout(resolve, 500));
//         this.focusInput(nextMissingField);
//         const label = this.getFieldLabel(nextMissingField);

//         if (nextMissingField === 'email') {
//           await this.voiceService.speak('Di correo para editar el email.');
//         } else if (nextMissingField === 'confirmPassword') {
//           await this.voiceService.speak('Di confirmar para editar.');
//         } else {
//           await this.voiceService.speak(`Campo ${label} disponible. Di "${label}" para editarlo.`);
//         }
//       } else if (!nextMissingField && !silent) {
//         await new Promise(resolve => setTimeout(resolve, 800));
//         await this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
//       }
//     }

//     console.log('🔴 Dictado finalizado');
//   }

//   // ============================================================
//   // AUXILIARES
//   // ============================================================

//   private getMissingFields(): string[] {
//     const fields = ['fullName', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
//     const missing: string[] = [];
//     for (const field of fields) {
//       const control = this.registerForm.get(field);
//       if (!control || control.invalid || !control.value) {
//         missing.push(field);
//       }
//     }
//     return missing;
//   }

//   private getFirstMissingField(missingFields: string[]): string | null {
//     for (const field of this.fieldOrder) {
//       if (missingFields.includes(field)) {
//         return field;
//       }
//     }
//     return null;
//   }

//   private getNextField(currentField: string): string | null {
//     const index = this.fieldOrder.indexOf(currentField);
//     if (index === -1 || index === this.fieldOrder.length - 1) {
//       return null;
//     }
//     return this.fieldOrder[index + 1];
//   }

//   private getNextMissingField(currentField: string): string | null {
//     const missing = this.getMissingFields();
//     if (missing.length === 0) return null;

//     const currentIndex = this.fieldOrder.indexOf(currentField);
//     if (currentIndex === -1) return missing[0];

//     for (let i = currentIndex + 1; i < this.fieldOrder.length; i++) {
//       const field = this.fieldOrder[i];
//       if (missing.includes(field)) {
//         return field;
//       }
//     }
//     return missing[0];
//   }

//   private isFormCompleteAndValid(): boolean {
//     const fields = ['fullName', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'];
//     for (const field of fields) {
//       const control = this.registerForm.get(field);
//       if (!control || control.invalid || !control.value) {
//         return false;
//       }
//     }
//     return true;
//   }

//   private getPasswordErrors(): string | null {
//     const ctrl = this.passwordCtrl;
//     if (!ctrl.dirty && !ctrl.touched) return null;
//     const value = ctrl.value || '';
//     if (ctrl.hasError('required')) return 'La contraseña es obligatoria.';
//     if (value.length <= 2) return null;
//     if (ctrl.valid) return null;
//     if (ctrl.hasError('minlength')) {
//       return `Debe tener al menos 9 caracteres. Tiene ${value.length}.`;
//     }
//     const missing: string[] = [];
//     if (ctrl.hasError('missingUppercase')) missing.push('mayúscula');
//     if (ctrl.hasError('missingLowercase')) missing.push('minúscula');
//     if (ctrl.hasError('missingNumber')) missing.push('número');
//     if (ctrl.hasError('missingSpecialChar')) missing.push('carácter especial');
//     if (missing.length === 0) return null;
//     return `Falta: ${missing.join(', ')}.`;
//   }

//   private getConfirmPasswordErrors(): string | null {
//     const ctrl = this.confirmPasswordCtrl;
//     if (!ctrl.dirty && !ctrl.touched) return null;
//     if (ctrl.hasError('required')) return 'Es obligatorio confirmar la contraseña.';
//     if (ctrl.hasError('mismatch')) return 'La confirmación no coincide con la contraseña.';
//     return null;
//   }

//   private getFormControlName(target: string): string {
//     const map: Record<string, string> = {
//       fullName: 'fullName',
//       email: 'email',
//       password: 'password',
//       confirmPassword: 'confirmPassword',
//       firstName: 'firstName',
//       lastName: 'lastName'
//     };
//     return map[target] || target;
//   }

//   private getDictationContext(target: string): 'username' | 'password' | 'email' | 'text' {
//     const map: Record<string, 'username' | 'password' | 'email' | 'text'> = {
//       fullName: 'username',
//       email: 'email',
//       password: 'password',
//       confirmPassword: 'password',
//       firstName: 'text',
//       lastName: 'text'
//     };
//     return map[target] || 'text';
//   }

//   private focusInput(target: string): void {
//     if (this.isDestroyed) return;
//     const inputMap: Record<string, IonInput | undefined> = {
//       fullName: this.userInput,
//       email: this.emailInput,
//       password: this.passwordInput,
//       confirmPassword: this.confirmPasswordInput,
//       firstName: this.nameInput,
//       lastName: this.lastNameInput
//     };
//     const input = inputMap[target];
//     if (input) {
//       setTimeout(() => {
//         if (!this.isDestroyed) {
//           input.setFocus();
//           this.cdr.markForCheck();
//         }
//       }, 100);
//     }
//   }

//   private focusOtpInput(): void {
//     if (this.isDestroyed || !this.otpInput) return;
//     this.otpInput.setFocus();
//     this.voiceService.speak('Campo de código de verificación enfocado. Dicta los dígitos.');
//   }

//   private updateFormAndInputDirectly(target: string, value: string): void {
//     if (this.isDestroyed) return;

//     // Trim para contraseña (espacios fantasma del dictado)
//     if (target === 'password' || target === 'confirmPassword') {
//       value = value.trim();
//     }

//     const formControlName = this.getFormControlName(target);
//     const control = this.registerForm.get(formControlName);
//     if (!control) return;

//     control.setValue(value, { emitEvent: true });
//     control.markAsDirty();
//     control.markAsTouched();

//     const inputMap: Record<string, IonInput | undefined> = {
//       fullName: this.userInput,
//       email: this.emailInput,
//       password: this.passwordInput,
//       confirmPassword: this.confirmPasswordInput,
//       firstName: this.nameInput,
//       lastName: this.lastNameInput
//     };
//     const input = inputMap[target];
//     if (input) {
//       input.value = value;
//     }

//     control.updateValueAndValidity({ emitEvent: true });
//     this.cdr.markForCheck();
//   }

//   // ============================================================
//   // ACCIONES
//   // ============================================================

//   private submitForm(): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) this.stopDictation(undefined, true);

//     if (this.registerForm.invalid) {
//       this.registerForm.markAllAsTouched();
//       const errors = this.generalErrorMessage;
//       this.voiceService.speak(`El formulario tiene errores: ${errors}`);
//       return;
//     }
//     this.onRegister();
//   }

//   private showHelp(): void {
//     if (this.helpShown) return;
//     this.helpShown = true;

//     if (this.voiceService.isCurrentlyMuted()) {
//       this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
//     } else if (this.isVerifying()) {
//       this.voiceService.speak('En la verificación puedes decir "código" para enfocar el campo OTP, "pegar código" para rellenar automáticamente el código, "copiar código" para copiarlo al portapapeles, o "verificar" para validar el código.');
//     } else {
//       this.voiceService.speak(this.HELP_MESSAGE);
//     }

//     setTimeout(() => { this.helpShown = false; }, 5000);
//   }

//   togglePassword(): void {
//     if (this.isDestroyed) return;
//     this.hidePassword.update((value) => !value);
//   }

//   toggleConfirmPassword(): void {
//     if (this.isDestroyed) return;
//     this.hideConfirmPassword.update((value) => !value);
//   }

//   // ============================================================
//   // REGISTRO
//   // ============================================================

//   onRegister(): void {
//     if (this.isDestroyed) return;

//     if (this.registerForm.invalid) {
//       this.registerForm.markAllAsTouched();
//       return;
//     }

//     this.isRegistering = true;
//     this.isLoading.set(true);
//     this.errorMessage.set(null);

//     const payload = {
//       username: this.registerForm.get('fullName')?.value,
//       email: this.registerForm.get('email')?.value.toLowerCase(),
//       password: this.registerForm.get('password')?.value,
//       confirmPassword: this.registerForm.get('confirmPassword')?.value,
//       firstName: this.registerForm.get('firstName')?.value,
//       lastName: this.registerForm.get('lastName')?.value,
//     };

//     this.authService.register(payload)
//       .pipe(finalize(() => {
//         this.isLoading.set(false);
//         this.isRegistering = false;
//         this.cdr.markForCheck();
//       }))
//       .subscribe({
//         next: (response: any) => {
//           if (this.isDestroyed) return;

//           const otpCode = response?.code || response?.otp || null;
//           console.log('🔑 Código OTP recibido del backend:', otpCode);

//           if (otpCode) {
//             this.receivedOtpCode.set(otpCode);
//             this.voiceService.speak(
//               'Registro exitoso. El código de verificación ha sido recibido. Di "pegar código" para rellenarlo automáticamente.'
//             );
//           } else {
//             this.voiceService.speak('Registro exitoso. Revisa tu correo para el código de verificación.');
//           }

//           this.isVerifying.set(true);

//           this.voiceContext.setContext({
//             activationMessage: 'Estás en la verificación del código. Di "código" para enfocar, "pegar código" para rellenar, o "verificar" para validar.',
//             availableCommands: ['código', 'pegar código', 'verificar', 'atrás', 'ayuda'],
//             preventBackend: true
//           });

//           this.otpDigitBuffer = '';
//           this.verificationCode.set('');
//           if (this.otpInput) {
//             this.otpInput.value = '';
//           }
//           this.resetOtpVisuals();
//           this.cdr.detectChanges();
//           this.startTimer();

//           if (otpCode) {
//             setTimeout(() => {
//               if (!this.isDestroyed) {
//                 this.voiceService.speak('Di "pegar código" para rellenar el campo OTP.');
//               }
//             }, 1500);
//           }

//           setTimeout(() => {
//             if (!this.isDestroyed && this.otpInput) {
//               this.otpInput.setFocus();
//               this.cdr.markForCheck();
//             }
//           }, 600);
//         },
//         error: (err) => {
//           console.error('❌ Error en registro:', err);
//           this.handleError(err);
//         }
//       });
//   }

//   // ============================================================
//   // OTP
//   // ============================================================

//   public pasteOtpCode(): void {
//     const code = this.receivedOtpCode();
//     if (!code || code.length < 6) {
//       this.voiceService.speak('No hay un código disponible para pegar. Asegúrate de que el registro fue exitoso.');
//       return;
//     }

//     this.otpDigitBuffer = code;
//     this.verificationCode.set(code);
//     if (this.otpInput) {
//       this.otpInput.value = code;
//       this.otpInput.setFocus();
//     }
//     this.updateOtpSlots(code);
//     this.cdr.detectChanges();

//     this.voiceService.speak(`Código ${code} pegado en el campo. Di "verificar" para validarlo.`);
//     console.log(`📋 Código pegado en OTP: "${code}"`);
//   }

//   public copyOtpCodeToClipboard(): void {
//     let code = this.receivedOtpCode();
//     if (!code || code.length < 6) {
//       code = this.verificationCode() || this.otpDigitBuffer;
//     }

//     if (!code || code.length < 6) {
//       this.voiceService.speak('No hay un código de 6 dígitos para copiar.');
//       return;
//     }

//     if (navigator.clipboard && navigator.clipboard.writeText) {
//       navigator.clipboard.writeText(code).then(() => {
//         this.voiceService.speak('Código copiado al portapapeles.');
//       }).catch(() => {
//         this.fallbackCopyOtp(code);
//       });
//     } else {
//       this.fallbackCopyOtp(code);
//     }
//   }

//   private fallbackCopyOtp(code: string): void {
//     const textArea = document.createElement('textarea');
//     textArea.value = code;
//     textArea.style.position = 'fixed';
//     textArea.style.opacity = '0';
//     textArea.style.left = '-9999px';
//     document.body.appendChild(textArea);
//     textArea.select();
//     document.execCommand('copy');
//     document.body.removeChild(textArea);
//     this.voiceService.speak('Código copiado al portapapeles.');
//   }

//   verifyCode(code?: string): void {
//     if (this.isDestroyed) return;
//     if (this.otpVerificationCompleted) {
//       console.log('⏳ OTP ya verificado, ignorando nueva solicitud.');
//       return;
//     }
//     if (this.isVerifyingCode) {
//       console.log('⏳ Ya hay una verificación en curso, ignorando...');
//       return;
//     }

//     if (code) {
//       console.log(`🔍 verifyCode recibió code: "${code}", verificationCode actual: "${this.verificationCode()}"`);
//       if (this.verificationCode() !== code) {
//         this.verificationCode.set(code);
//         if (this.otpInput) {
//           this.otpInput.value = code;
//           this.cdr.detectChanges();
//         }
//       }
//     }

//     const codeToVerify = code || this.verificationCode();
//     const email = this.registerForm.get('email')?.value?.toLowerCase() || '';

//     if (!codeToVerify || codeToVerify.length < 6) {
//       this.voiceService.speak('El código debe tener 6 dígitos.');
//       return;
//     }

//     if (!email) {
//       this.errorMessage.set('No se encontró el email.');
//       return;
//     }

//     this.isVerifyingCode = true;
//     this.isLoading.set(true);
//     this.errorMessage.set(null);

//     const data = { email, code: codeToVerify };
//     console.log('📤 Enviando verificación:', JSON.stringify(data));

//     this.authService.verifyOtp(data)
//       .pipe(finalize(() => {
//         if (!this.isDestroyed) {
//           this.isLoading.set(false);
//           this.cdr.markForCheck();
//         }
//       }))
//       .subscribe({
//         next: () => {
//           if (this.isDestroyed) return;
//           this.isVerifyingCode = false;
//           this.otpVerificationCompleted = true;
//           console.log('✅ Verificación exitosa');
//           this.otpSlots = this.otpSlots.map(slot => ({ ...slot, filled: true, active: false, error: false }));
//           this.otpDigitCount = 6;
//           this.isDictating = false;
//           this.cdr.detectChanges();
//           this.voiceService.speak('Cuenta verificada correctamente.');
//           setTimeout(() => {
//             if (!this.isDestroyed) {
//               this.router.navigateByUrl('/login', { replaceUrl: true });
//             }
//           }, 2000);
//         },
//         error: (err) => {
//           if (this.isDestroyed) return;
//           this.isVerifyingCode = false;
//           console.log('🔴 Error OTP:', err);

//           const errorMessage = err?.error?.message || err?.message || '';
//           if (err.status === 400 && errorMessage.toLowerCase().includes('ya está verificado')) {
//             console.log('✅ El email ya estaba verificado, redirigiendo a login...');
//             this.otpVerificationCompleted = true;
//             this.voiceService.speak('Tu cuenta ya estaba verificada. Redirigiendo al login.');
//             setTimeout(() => {
//               if (!this.isDestroyed) {
//                 this.router.navigateByUrl('/login', { replaceUrl: true });
//               }
//             }, 1500);
//             return;
//           }

//           this.errorMessage.set('Código inválido o expirado.');
//           this.otpSlots = this.otpSlots.map(slot => ({ ...slot, filled: true, active: false, error: true }));
//           this.cdr.detectChanges();

//           this.verificationCode.set('');
//           if (this.otpInput) {
//             this.otpInput.value = '';
//           }
//           this.cdr.detectChanges();

//           const isMuted = this.voiceService.isCurrentlyMuted();
//           if (!isMuted) {
//             this.voiceService.speak(`Código ${codeToVerify} inválido o expirado. Intenta de nuevo.`);
//           } else {
//             this.voiceService.speak('Código inválido o expirado. Di "código" para enfocar y dicta los dígitos.');
//           }

//           setTimeout(() => {
//             if (this.isDestroyed) return;
//             this.resetOtpVisuals();
//             this.otpDigitBuffer = '';
//             this.cdr.detectChanges();
//           }, 2000);
//         }
//       });
//   }

//   private handleError(err: any): void {
//     if (this.isDestroyed) return;
//     const status = err?.status;
//     const serverMessage = err?.message || err?.error?.message || err?.error || '';

//     let msg = 'Error inesperado.';
//     if (status === 409) {
//       const lowerMsg = serverMessage.toLowerCase();
//       if (lowerMsg.includes('correo') || lowerMsg.includes('email')) {
//         msg = 'Este correo electrónico ya está registrado.';
//       } else if (lowerMsg.includes('usuario') || lowerMsg.includes('username')) {
//         msg = 'El nombre de usuario ya está en uso.';
//       } else {
//         msg = serverMessage || 'El usuario o correo ya existen.';
//       }
//     } else if (status === 400) {
//       msg = `Datos inválidos: ${serverMessage}`;
//     } else if (status === 0) {
//       msg = 'No hay conexión con el servidor.';
//     } else {
//       msg = serverMessage || 'Ha ocurrido un error inesperado.';
//     }

//     this.errorMessage.set(`❌ ${msg}`);
//     this.voiceService.speak(msg);
//   }

//   onOtpChange(event: any): void {
//     if (this.isDestroyed) return;
//     const value = event.target.value;
//     this.verificationCode.set(value);

//     if (value.length === 6 && !this.isVerifyingCode) {
//       this.verifyCode(value);
//     }
//   }

//   private startTimer(): void {
//     if (this.isDestroyed) return;
//     if (this.timerInterval) clearInterval(this.timerInterval);
//     this.timerSeconds.set(120);

//     this.timerInterval = setInterval(() => {
//       if (this.isDestroyed) {
//         clearInterval(this.timerInterval);
//         return;
//       }
//       this.timerSeconds.update(s => s - 1);
//       const current = this.timerSeconds();

//       if (current === 60 || current === 30 || current === 15 || current === 10 || current === 5) {
//         if (!this.otpVerificationCompleted && !this.isVerifyingCode) {
//           this.voiceService.speak(`Te quedan ${current} segundos para introducir el código.`);
//         }
//       }

//       if (current <= 0) {
//         clearInterval(this.timerInterval);
//         if (!this.otpVerificationCompleted) {
//           const email = this.registerForm.get('email')?.value;
//           if (email) {
//             this.authService.cancelPendingRegistration(email).subscribe({
//               next: () => {
//                 this.voiceService.speak('El tiempo ha expirado. El registro pendiente ha sido cancelado. Puedes intentarlo de nuevo.');
//                 this.resetVerification();
//               },
//               error: (err) => {
//                 console.error('Error al cancelar el registro:', err);
//                 this.voiceService.speak('Error al cancelar el registro. El sistema lo eliminará automáticamente en unos minutos.');
//                 this.resetVerification();
//               }
//             });
//           } else {
//             this.voiceService.speak('El tiempo ha expirado. Por favor, intenta registrarte de nuevo.');
//             this.resetVerification();
//           }
//         }
//       }
//     }, 1000);
//   }

//   formattedTime(): string {
//     return `${Math.floor(this.timerSeconds() / 60)}:${(this.timerSeconds() % 60).toString().padStart(2, '0')}`;
//   }

//   resetVerification(): void {
//     if (this.isDestroyed) return;

//     if (this.clearOtpTimeout) {
//       clearTimeout(this.clearOtpTimeout);
//       this.clearOtpTimeout = null;
//     }
//     if (this.otpTimer) {
//       clearTimeout(this.otpTimer);
//       this.otpTimer = null;
//     }

//     this.isVerifying.set(false);
//     this.errorMessage.set(null);
//     this.verificationCode.set('');
//     this.otpDigitBuffer = '';
//     this.isClearingOtp = false;
//     this.isVerifyingCode = false;

//     if (this.otpInput) {
//       this.otpInput.value = '';
//     }

//     this.resetOtpVisuals();
//     this.cdr.detectChanges();
//     this.voiceService.speak('Volviendo al formulario de registro.');
//   }

//   get hasVisibleErrors(): boolean {
//     return Object.keys(this.registerForm.controls).some(key => {
//       const control = this.registerForm.get(key);
//       return control?.invalid && control?.touched;
//     });
//   }

//   get visibleErrorFields(): string[] {
//     const fieldLabels: Record<string, string> = {
//       fullName: 'nombre de usuario',
//       email: 'correo electrónico',
//       password: 'contraseña',
//       confirmPassword: 'confirmación de contraseña',
//       firstName: 'nombre propio',
//       lastName: 'apellidos'
//     };

//     return Object.keys(this.registerForm.controls)
//       .filter(key => {
//         const control = this.registerForm.get(key);
//         return control?.invalid && control?.touched;
//       })
//       .map(key => fieldLabels[key] || key);
//   }

//   get generalErrorMessage(): string {
//     if (!this.hasVisibleErrors) return '';
//     const fields = [...this.visibleErrorFields];
//     if (fields.length === 1) {
//       return `Error en el campo: ${fields[0]}.`;
//     }
//     const last = fields.pop();
//     return `Errores en los campos: ${fields.join(', ')} y ${last}.`;
//   }

//   public goBack(): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) this.stopDictation(undefined, true);

//     if (this.isVerifying()) {
//       this.resetVerification();
//       this.voiceService.speak('Volviendo al formulario de registro.');
//       return;
//     }

//     this.voiceService.speak('Volviendo al inicio de sesión.');
//     this.router.navigateByUrl('/login', { replaceUrl: true });
//   }

//   goToLogin(): void {
//     if (this.isDestroyed) return;
//     if (this.dictationMode) this.stopDictation(undefined, true);
//     this.router.navigateByUrl('/login', { replaceUrl: true });
//   }

//   // ============================================================
//   // VALIDACIONES POST-DICTADO
//   // ============================================================

//   private async validatePasswordAfterDictation(password: string): Promise<void> {
//     const control = this.registerForm.get('password');
//     if (control && control.invalid) {
//       this.dictationBuffer = '';
//       const msg = 'Contraseña inválida. Di "contraseña" para intentarlo de nuevo.';
//       await this.voiceService.speak(msg);
//       await new Promise(resolve => setTimeout(resolve, 500));
//       return;
//     } else if (control && control.valid) {
//       await this.voiceService.speak('Contraseña válida.');
//       await new Promise(resolve => setTimeout(resolve, 500));
//       this.focusInput('confirmPassword');
//       await this.voiceService.speak('Di confirmar para editar.');
//     }
//   }

//   private async validateConfirmPasswordAfterDictation(): Promise<void> {
//     const control = this.registerForm.get('confirmPassword');
//     const password = this.registerForm.get('password')?.value || '';
//     const confirm = control?.value || '';

//     const normalize = (str: string) => {
//       if (!str) return '';
//       return str
//         .replace(/\s/g, '')
//         .replace(/-/g, '')
//         .replace(/[!@#$%^&*(),.?":{}|<>]/g, '')
//         .toLowerCase();
//     };

//     const normalizedPassword = normalize(password);
//     const normalizedConfirm = normalize(confirm);

//     if (control && (control.invalid || normalizedPassword !== normalizedConfirm)) {
//       this.dictationBuffer = '';
//       const msg = 'La confirmación no coincide con la contraseña. Voy a borrar el campo. Di "confirmar" para intentarlo de nuevo.';
//       await this.voiceService.speak(msg);
//       await new Promise(resolve => setTimeout(resolve, 500));
//       this.updateFormAndInputDirectly('confirmPassword', '');
//       this.cdr.markForCheck();
//       this.focusInput('confirmPassword');
//       return;
//     } else if (control && control.valid && normalizedPassword === normalizedConfirm) {
//       await this.voiceService.speak('Confirmación correcta.');
//       const nextMissing = this.getNextMissingField('confirmPassword');
//       if (nextMissing) {
//         await new Promise(resolve => setTimeout(resolve, 500));
//         this.focusInput(nextMissing);
//         const label = this.getFieldLabel(nextMissing);
//         if (nextMissing === 'confirmPassword') {
//           await this.voiceService.speak('Di confirmar para editar.');
//         } else {
//           await this.voiceService.speak(`Campo ${label} disponible. Di "${label}" para editarlo.`);
//         }
//       } else {
//         await this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
//       }
//     }
//   }

//   // ============================================================
//   // OTP VISUAL
//   // ============================================================

//   private resetOtpVisuals(): void {
//     this.otpSlots = Array(6).fill(null).map(() => ({
//       filled: false,
//       active: false,
//       error: false
//     }));
//     this.otpDigitCount = 0;
//     this.otpError = '';
//     this.isDictating = false;
//   }

//   private updateOtpSlots(digits: string): void {
//     const digitArray = digits.split('');
//     this.otpSlots = Array(6).fill(null).map((_, index) => ({
//       filled: index < digitArray.length && digitArray[index] !== '',
//       active: index === digitArray.length && digitArray.length < 6,
//       error: false
//     }));
//     this.otpDigitCount = digitArray.length;
//     this.isDictating = digitArray.length < 6;
//     this.cdr.detectChanges();
//   }

//   // ============================================================
//   // DESTRUCCIÓN
//   // ============================================================

//   ngOnDestroy(): void {
//     console.log('🧹 RegisterComponent destruido');

//     this.voiceService.clearTranscript();

//     this.isDestroyed = true;

//     if (this.dictationMode) {
//       this.stopDictation(undefined, true);
//     }

//     if (this.timerInterval) {
//       clearInterval(this.timerInterval);
//       this.timerInterval = null;
//     }

//     if (this.clearOtpTimeout) {
//       clearTimeout(this.clearOtpTimeout);
//       this.clearOtpTimeout = null;
//     }

//     if (this.otpTimer) {
//       clearTimeout(this.otpTimer);
//       this.otpTimer = null;
//     }

//     this.mutedSubscription?.unsubscribe();

//     this.destroy$.next();
//     this.destroy$.complete();
//     this.voiceContext.resetContext();
//     window.speechSynthesis.cancel();

//     const fieldNames = ['fullName', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
//     for (const name of fieldNames) {
//       this.fieldCleanup.unregisterField(name);
//     }

//     this.dictationMode = false;
//     this.dictationTarget = null;
//     this.dictationBuffer = '';
//     this.otpDigitBuffer = '';
//   }
// }








import {
  Component,
  signal,
  inject,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
  OnInit,
  NgZone,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';  // ✅ AÑADIDO NavigationEnd
import { finalize, Subject, Subscription, takeUntil, filter } from 'rxjs';  // ✅ AÑADIDO filter

import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonIcon,
  IonText,
  IonSpinner} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  personOutline,
  idCardOutline,
  timerOutline,
  keyOutline,
  clipboardOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';

import {
  usernameValidator,
  passwordValidator,
  emailValidator,
  matchValidator
} from '../../../../../shared/validators/validators';
import { AuthService } from '../../../Services/auth-service';
import { FieldCleanupService } from '../../../../services/voz/field-cleanup.service';
import { VoiceContextService } from '../../../../services/voz/voice-context.service';
import { VoiceFilterService } from '../../../../services/voz/voice-filter.service';
import { VoiceService } from '../../../../services/voz/voice.service';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonIcon,
    IonText,
    IonSpinner,
  ],
  templateUrl: './register-component.component.html',
  styleUrls: ['./register-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  private readonly voiceService = inject(VoiceService);
  private readonly voiceContext = inject(VoiceContextService);
  private readonly voiceFilter = inject(VoiceFilterService);
  private readonly fieldCleanup = inject(FieldCleanupService);

  private timerInterval: any;
  private isDestroyed = false;
  private isVerifyingCode = false;
  private destroy$ = new Subject<void>();
  private formCompleteNotified = false;
  private enableLogs = true;
  private otpVerificationCompleted = false;

  private dictationMode = false;
  private dictationTarget:
    | 'fullName'
    | 'email'
    | 'password'
    | 'confirmPassword'
    | 'firstName'
    | 'lastName'
    | 'otp'
    | null = null;
  private dictationBuffer = '';
  private helpShown = false;

  private isClearingOtp = false;
  private clearOtpTimeout: any = null;
  private isSpeaking = false;
  private isReadingFields = false;

  private otpDigitBuffer = '';
  private otpTimer: any;

  readonly isMicActive = signal<boolean>(!this.voiceService.isCurrentlyMuted());
  private mutedSubscription?: Subscription;

  readonly receivedOtpCode = signal<string | null>(null);

  otpSlots: { filled: boolean; active: boolean; error: boolean }[] = [];
  otpDigitCount = 0;
  isDictating = false;
  otpError = '';

  private lastProcessedCommand = '';
  private lastProcessedTime = 0;
  private readonly COMMAND_DEBOUNCE = 2000;

  private noSpeechAttempts = 0;
  private readonly MAX_NO_SPEECH_ATTEMPTS = 10;


  private isRegistering = false;

  private readonly fieldOrder: string[] = [
    'fullName',
    'email',
    'password',
    'confirmPassword',
    'firstName',
    'lastName'
  ];

  @ViewChild('nameInput') nameInput!: IonInput;
  @ViewChild('userInput') userInput!: IonInput;
  @ViewChild('emailInput') emailInput!: IonInput;
  @ViewChild('passwordInput') passwordInput!: IonInput;
  @ViewChild('confirmPasswordInput') confirmPasswordInput!: IonInput;
  @ViewChild('otpInput') otpInput!: IonInput;
  @ViewChild('lastNameInput') lastNameInput!: IonInput;

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  isVerifying = signal(false);
  errorMessage = signal<string | null>(null);
  timerSeconds = signal(120);
  verificationCode = signal('');

  private readonly WELCOME_MESSAGE =
    'Bienvenido al registro. Di "usuario", "correo", "contraseña", "confirmar", "nombre", "apellidos", "registrar" para enviar, "limpiar" para borrar campos, "leer campos" para escuchar el contenido, o "ayuda" para más opciones.';

  private readonly HELP_MESSAGE =
    'En el registro puedes decir: "usuario" para el nombre de usuario, ' +
    '"correo" para el email, ' +
    '"contraseña" para tu clave, ' +
    '"confirmar" para repetirla, ' +
    '"nombre" para tu nombre propio, ' +
    '"apellidos" para tus apellidos, ' +
    '"registrar" o "enviar" para crear la cuenta, ' +
    '"limpiar" para borrar todos los campos, ' +
    '"leer campos" para escuchar el contenido de todos los campos, ' +
    '"volver" para regresar, ' +
    '"pegar código" para rellenar el código OTP automáticamente, ' +
    '"iniciar sesión" para ir a la pantalla de inicio de sesión, ' +
    'o "ayuda" para repetir este mensaje.';

  readonly registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, usernameValidator()]],
    email: ['', [Validators.required, emailValidator()]],
    password: ['', [Validators.required, passwordValidator(9)]],
    confirmPassword: ['', [Validators.required, matchValidator('password')]],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
  });

  get fullNameCtrl() { return this.registerForm.get('fullName')!; }
  get emailCtrl() { return this.registerForm.get('email')!; }
  get passwordCtrl() { return this.registerForm.get('password')!; }
  get confirmPasswordCtrl() { return this.registerForm.get('confirmPassword')!; }
  get firstNameCtrl() { return this.registerForm.get('firstName')!; }
  get lastNameCtrl() { return this.registerForm.get('lastName')!; }

  constructor() {
    console.log('🏗️ RegisterComponent constructor');
    console.log('🎤 Estado del micrófono al inicio:', this.voiceService.isCurrentlyMuted() ? 'MUTEADO' : 'ACTIVO');

    addIcons({
      personCircleOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      personOutline,
      idCardOutline,
      timerOutline,
      keyOutline,
      clipboardOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      arrowBackOutline
    });

    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
        this.cdr.markForCheck();
      }
    });

    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      const confirmControl = this.registerForm.get('confirmPassword');
      if (confirmControl) {
        confirmControl.markAsDirty();
        confirmControl.markAsTouched();
        confirmControl.updateValueAndValidity();
      }
    });
  }

  //
  // ngOnInit(): void {
  //   console.log('✅ RegisterComponent inicializado (con voz)');

  //   if (this.voiceService.isCurrentlyMuted()) {
  //     console.log('🎤 [Register] Micrófono MUTEADO');
  //   } else {
  //     console.log('🎤 [Register] Micrófono ACTIVO');
  //   }

  //   this.mutedSubscription = this.voiceService.getMutedState().subscribe(muted => {
  //     this.isMicActive.set(!muted);
  //     this.cdr.markForCheck();
  //   });

  //   this.voiceContext.setContext({
  //     activationMessage: this.WELCOME_MESSAGE,
  //     availableCommands: [
  //       'usuario', 'email', 'correo', 'contraseña', 'confirmar',
  //       'nombre', 'apellidos', 'registrar', 'enviar', 'limpiar',
  //       'volver', 'ayuda', 'código', 'verificar', 'leer campos',
  //       'pegar código', 'iniciar sesión'
  //     ],
  //     preventBackend: true
  //   });

  //   this.voiceService
  //     .getTranscriptWithFinal()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (transcript: { text: string; isFinal: boolean }) => {
  //         const text = transcript.text;
  //         const isFinal = transcript.isFinal;
  //         if (!text) return;

  //         console.log(`📝 [Register] Transcript recibido: "${text}" (Final: ${isFinal})`);

  //         this.ngZone.run(() => {
  //           if (this.isDestroyed) return;
  //           this.handleVoiceCommand(text, isFinal);
  //         });
  //       },
  //       error: (err) => {
  //         console.error('❌ [Register] Error en transcript:', err);
  //       }
  //     });

  //   this.voiceService.ready$
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((ready) => {
  //       if (ready) {
  //         this.noSpeechAttempts = 0;
  //         return;
  //       }

  //       if (!ready && !this.isDestroyed) {
  //         this.noSpeechAttempts++;
  //         if (this.noSpeechAttempts >= this.MAX_NO_SPEECH_ATTEMPTS) {
  //           console.warn('🔇 Demasiados errores de no-speech');
  //           this.noSpeechAttempts = 0;
  //           return;
  //         }

  //         console.log(`🔄 [Register] Reconocimiento caído, reintento ${this.noSpeechAttempts}...`);
  //         setTimeout(() => {
  //           if (!this.isDestroyed) {
  //             this.voiceService.startListening();
  //           }
  //         }, 500);
  //       }
  //     });

  //   setTimeout(() => {
  //     if (!this.isDestroyed && !this.voiceService.isCurrentlyMuted() && !this.isVerifying()) {
  //       this.voiceService.speakAlways(this.WELCOME_MESSAGE);
  //     }
  //   }, 1000);

  //   this.registerFieldsForCleanup();

  //   this.registerForm.valueChanges
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(() => {
  //       if (this.isFormCompleteAndValid() && !this.formCompleteNotified) {
  //         this.formCompleteNotified = true;
  //         this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
  //       } else if (!this.isFormCompleteAndValid()) {
  //         this.formCompleteNotified = false;
  //       }
  //     });

  //   this.resetOtpVisuals();
  // }





  ngOnInit(): void {
    console.log('✅ RegisterComponent inicializado (con voz)');

    if (this.voiceService.isCurrentlyMuted()) {
      console.log('🎤 [Register] Micrófono MUTEADO');
    } else {
      console.log('🎤 [Register] Micrófono ACTIVO');
    }

    this.mutedSubscription = this.voiceService.getMutedState().subscribe(muted => {
      this.isMicActive.set(!muted);
      this.cdr.markForCheck();
    });

    this.voiceContext.setContext({
      activationMessage: this.WELCOME_MESSAGE,
      availableCommands: [
        'usuario', 'email', 'correo', 'contraseña', 'confirmar',
        'nombre', 'apellidos', 'registrar', 'enviar', 'limpiar',
        'volver', 'ayuda', 'código', 'verificar', 'leer campos',
        'pegar código', 'iniciar sesión'
      ],
      preventBackend: true
    });

    this.voiceService
      .getTranscriptWithFinal()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transcript: { text: string; isFinal: boolean }) => {
          const text = transcript.text;
          const isFinal = transcript.isFinal;
          if (!text) return;

          console.log(`📝 [Register] Transcript recibido: "${text}" (Final: ${isFinal})`);

          this.ngZone.run(() => {
            if (this.isDestroyed) return;
            this.handleVoiceCommand(text, isFinal);
          });
        },
        error: (err) => {
          console.error('❌ [Register] Error en transcript:', err);
        }
      });

    // ✅ NUEVO: Escuchar navegaciones para aplicar foco al entrar a /register
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        if (url === '/register' || url.startsWith('/register?')) {
          console.log('🎯 [Register] Navegación a /register detectada');
          this.focusFirstInput();
        }
      });

    // ✅ NUEVO: Aplicar foco en la primera carga (si ya estamos en /register)
    setTimeout(() => {
      if (this.router.url === '/register' || this.router.url.startsWith('/register?')) {
        this.focusFirstInput();
      }
    }, 800);

    this.voiceService.ready$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ready) => {
        if (ready) {
          this.noSpeechAttempts = 0;
          return;
        }

        if (!ready && !this.isDestroyed) {
          this.noSpeechAttempts++;
          if (this.noSpeechAttempts >= this.MAX_NO_SPEECH_ATTEMPTS) {
            console.warn('🔇 Demasiados errores de no-speech');
            this.noSpeechAttempts = 0;
            return;
          }

          console.log(`🔄 [Register] Reconocimiento caído, reintento ${this.noSpeechAttempts}...`);
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.voiceService.startListening();
            }
          }, 500);
        }
      });

    // ✅ BIENVENIDA ENCADENADA CON REINICIO DEL MICRÓFONO
    setTimeout(() => {
      if (this.isDestroyed) return;

      const isMuted = this.voiceService.isCurrentlyMuted();

      // Si está muteado, no hablamos, pero arrancamos micro igual
      if (isMuted) {
        console.log('🔇 [Register] Micrófono muteado, bienvenida omitida');
        if (!this.voiceService.isRecognitionActive()) {
          this.voiceService.startListening();
        }
        return;
      }

      // Si estamos en verificación OTP, no hablamos la bienvenida principal
      if (this.isVerifying()) {
        console.log('⏭️ [Register] En verificación OTP, bienvenida principal omitida');
        if (!this.voiceService.isRecognitionActive()) {
          this.voiceService.startListening();
        }
        return;
      }

      console.log('🗣️ [Register] Iniciando bienvenida encadenada con micro');

      this.voiceService.speakAlways(this.WELCOME_MESSAGE, true)
        .then(() => {
          if (this.isDestroyed) return;
          setTimeout(() => {
            if (this.isDestroyed) return;
            if (!this.voiceService.isRecognitionActive()) {
              console.log('🎤 [Register] Bienvenida terminada → arrancando micro');
              this.voiceService.startListening();
            }
          }, 400);
        })
        .catch((err) => {
          console.warn('⚠️ [Register] speakAlways falló, arrancando micro igualmente', err);
          if (this.isDestroyed) return;
          if (!this.voiceService.isRecognitionActive()) {
            this.voiceService.startListening();
          }
        });
    }, 1000);

    this.registerFieldsForCleanup();

    this.registerForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isFormCompleteAndValid() && !this.formCompleteNotified) {
          this.formCompleteNotified = true;
          this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
        } else if (!this.isFormCompleteAndValid()) {
          this.formCompleteNotified = false;
        }
      });

    this.resetOtpVisuals();
  }




  //
  private focusByQuerySelectorRegister(): void {
    const inputEl = document.querySelector('ion-input[formControlName="fullName"]') as any;
    if (inputEl && inputEl.setFocus) {
      inputEl.setFocus();
      console.log('🎯 [Register] ✅ Foco aplicado por querySelector');
    }
  }

  // ✅ NUEVO: Método para aplicar foco desde router.events
  private focusFirstInput(): void {
    console.log('🎯 [Register] focusFirstInput() llamado');

    setTimeout(() => {
      if (this.isDestroyed) return;

      this.cdr.detectChanges();

      if (this.userInput) {
        this.userInput.setFocus()
          .then(() => console.log('🎯 [Register] ✅ Foco aplicado en userInput'))
          .catch(err => {
            console.warn('🎯 [Register] ⚠️ Falló setFocus, intentando fallback', err);
            this.focusByQuerySelectorRegister();
          });
      } else {
        console.log('🎯 [Register] userInput NO disponible, usando fallback');
        this.focusByQuerySelectorRegister();
      }
    }, 400);
  }

  //
  ngAfterViewInit(): void {
    console.log('👀 RegisterComponent AfterViewInit');
    this.setupFocusListeners();
    this.cdr.markForCheck();
  }

  // ============================================================
  // REGISTRO DE CAMPOS
  // ============================================================

  private registerFieldsForCleanup(): void {
    const fields = [
      { name: 'fullName', label: 'usuario' },
      { name: 'email', label: 'correo' },
      { name: 'password', label: 'contraseña' },
      { name: 'confirmPassword', label: 'confirmar' },
      { name: 'firstName', label: 'nombre' },
      { name: 'lastName', label: 'apellidos' }
    ];

    for (const field of fields) {
      this.fieldCleanup.registerField({
        name: field.name,
        label: field.label,
        isFocused: false,
        clear: () => this.clearField(field.name),
        isEmpty: () => !this.registerForm.get(field.name)?.value,
        canClear: true
      });
    }
  }

  private setupFocusListeners(): void {
    const focusConfigs: { field: string; input?: IonInput }[] = [
      { field: 'fullName', input: this.userInput },
      { field: 'email', input: this.emailInput },
      { field: 'password', input: this.passwordInput },
      { field: 'confirmPassword', input: this.confirmPasswordInput },
      { field: 'firstName', input: this.nameInput },
      { field: 'lastName', input: this.lastNameInput }
    ];

    for (const config of focusConfigs) {
      if (config.input) {
        config.input.getInputElement().then((nativeEl: HTMLInputElement) => {
          nativeEl.addEventListener('focus', () => {
            this.fieldCleanup.registerField({
              name: config.field,
              label: this.getFieldLabel(config.field),
              isFocused: true,
              clear: () => this.clearField(config.field),
              isEmpty: () => !this.registerForm.get(config.field)?.value
            });
          });

          nativeEl.addEventListener('blur', () => {
            this.fieldCleanup.registerField({
              name: config.field,
              label: this.getFieldLabel(config.field),
              isFocused: false,
              clear: () => this.clearField(config.field),
              isEmpty: () => !this.registerForm.get(config.field)?.value
            });
          });
        });
      }
    }
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      fullName: 'usuario',
      email: 'correo',
      password: 'contraseña',
      confirmPassword: 'confirmar',
      firstName: 'nombre',
      lastName: 'apellidos'
    };
    return labels[fieldName] || fieldName;
  }

  // ============================================================
  // COMANDOS DE VOZ
  // ============================================================
  private handleVoiceCommand(text: string, isFinal: boolean = false): void {
    if (this.isDestroyed) return;

    if (this.isReadingFields) {
      const lower = text.toLowerCase().trim();

      if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
        this.isReadingFields = false;
        window.speechSynthesis.cancel();
        this.goBack();
        return;
      }

      console.log('⏭️ [Register] Ignorando comando mientras se leen campos:', text);
      return;
    }

    const lower = text.toLowerCase().trim();
    console.log(`🔍 [handleVoiceCommand] isVerifying: ${this.isVerifying()}, lower: "${lower}"`);

    if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
      this.goBack();
      return;
    }

    if (lower.includes('iniciar sesión') || lower.includes('ir a login') || lower.includes('login') || lower.includes('inicia sesión')) {
      this.voiceService.speak('Navegando a inicio de sesión.');
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    if (lower.includes('ayuda') || lower === 'help' || lower.includes('qué puedo decir')) {
      this.showHelp();
      return;
    }

    // ============================================================
    // MODO VERIFICACIÓN (OTP)
    // ============================================================
    if (this.isVerifying()) {
      console.log('🔐 OTP - Modo verificación activo, texto:', lower);

      if (lower.includes('pegar código') || lower.includes('pegar codigo') ||
          lower.includes('rellenar código') || lower.includes('rellenar codigo') ||
          lower.includes('escribir código') || lower.includes('escribir codigo')) {
        this.pasteOtpCode();
        return;
      }

      if (lower.includes('código') || lower.includes('codigo') || lower.includes('otp') || lower.includes('dictar')) {
        console.log('🔁 OTP - Activando dictado y reseteando');
        this.otpDigitBuffer = '';
        this.verificationCode.set('');
        if (this.otpInput) {
          this.otpInput.value = '';
          this.otpInput.setFocus();
        }
        this.resetOtpVisuals();
        this.cdr.detectChanges();
        this.voiceService.speak('Campo OTP enfocado. Dicta los dígitos.');
        return;
      }

      if (lower.includes('limpiar') || lower.includes('borrar') || lower.includes('reset')) {
        this.otpDigitBuffer = '';
        this.verificationCode.set('');
        if (this.otpInput) {
          this.otpInput.value = '';
        }
        this.resetOtpVisuals();
        this.cdr.detectChanges();
        this.voiceService.speak('Código limpiado.');
        return;
      }

      if (lower.includes('verificar') || lower.includes('validar') || lower.includes('confirmar código') || lower.includes('aceptar')) {
        if (this.otpDigitBuffer.length === 6) {
          this.verifyCode(this.otpDigitBuffer);
        } else {
          this.voiceService.speak(`Tienes ${this.otpDigitBuffer.length} dígitos. Deben ser 6.`);
          this.verifyCode();
        }
        return;
      }

      if (lower.includes('leer') || lower.includes('mostrar') || lower.includes('qué tengo')) {
        const currentCode = this.otpDigitBuffer || 'vacío';
        const digitCount = this.otpDigitBuffer.length;
        if (digitCount === 0) {
          this.voiceService.speak('No has ingresado ningún dígito aún.');
        } else {
          this.voiceService.speak(`Has ingresado ${digitCount} dígitos: ${currentCode.split('').join(' ')}.`);
        }
        return;
      }

      if (lower.includes('ayuda') || lower.includes('qué puedo decir')) {
        this.voiceService.speak(
          'Comandos disponibles: "código" para activar dictado, ' +
          'dí los números uno por uno, "limpiar" para borrar, ' +
          '"leer" para escuchar los dígitos ingresados, ' +
          '"pegar código" para rellenar automáticamente el código, ' +
          '"verificar" para validar, "atrás" para volver.'
        );
        return;
      }

      const numericText = this.voiceFilter.convertPhraseToText(lower, false);
      const digits = numericText.replace(/\D/g, '');
      console.log(`🔢 OTP - Texto convertido: "${numericText}", dígitos extraídos: "${digits}"`);

      if (digits.length > 0) {
        this.otpDigitBuffer = digits.slice(0, 6);
        console.log(`🔢 OTP - Buffer actual: "${this.otpDigitBuffer}"`);

        if (this.otpInput) {
          this.otpInput.value = this.otpDigitBuffer;
        }
        this.verificationCode.set(this.otpDigitBuffer);
        this.updateOtpSlots(this.otpDigitBuffer);
        this.cdr.detectChanges();

        if (isFinal && this.otpDigitBuffer.length === 6 && !this.otpVerificationCompleted && !this.isVerifyingCode) {
          console.log('✅ OTP - 6 dígitos completos (FINAL), verificando...');
          this.dictationMode = false;
          this.dictationTarget = null;
          this.verifyCode(this.otpDigitBuffer);
          this.otpDigitBuffer = '';
          this.verificationCode.set('');
          if (this.otpInput) {
            this.otpInput.value = '';
          }
          this.resetOtpVisuals();
          this.cdr.detectChanges();
        }
        return;
      }

      console.log('⏭️ OTP - Comando no reconocido:', lower);
      return;
    }

    // ============================================================
    // MODO REGISTRO (comandos del formulario)
    // ============================================================
    const now = Date.now();
    if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
      console.log(`⏭️ Register: comando duplicado ignorado: "${lower}"`);
      return;
    }
    this.lastProcessedCommand = lower;
    this.lastProcessedTime = now;

    if (this.dictationMode && this.dictationTarget && this.dictationTarget !== 'otp') {
      this.handleDictation(lower);
      return;
    }

    if ((lower.includes('confirmar contraseña') ||
        lower.includes('confirmar clave') ||
        lower.includes('repetir contraseña') ||
        lower === 'confirmar' ||
        lower.startsWith('confirmar ')) &&
        !(this.dictationMode && this.dictationTarget === 'confirmPassword')) {
      console.log('📝 [Register] Iniciando dictado de confirmación');
      this.startDictation('confirmPassword', '');
      return;
    }

    const fieldLabels = this.fieldCleanup.getFieldLabels();
    for (const label of fieldLabels) {
      if (lower.includes(`limpiar ${label}`) || lower.includes(`borrar ${label}`)) {
        const result = this.fieldCleanup.clearFieldByLabel(label);
        if (result.success && this.dictationMode) {
          this.stopDictation('', true);
        }
        return;
      }
    }

    if (lower.includes('limpiar campo') || lower.includes('borrar campo')) {
      this.fieldCleanup.clearFocusedField();
      if (this.dictationMode) {
        this.stopDictation('', true);
      }
      return;
    }

    if (lower === 'limpiar' || lower === 'borrar' || lower === 'resetear') {
      this.fieldCleanup.clearAllFields();
      if (this.dictationMode) {
        this.stopDictation('', true);
      }
      return;
    }

    if (/^(usuario|nombre de usuario|user|username)\b/.test(lower)) {
      const rest = lower.replace(/^(usuario|nombre de usuario|user|username)\s*/, '').trim();
      this.startDictation('fullName', rest);
      return;
    }
    if (/^(email|correo|correo electrónico)\b/.test(lower)) {
      const rest = lower.replace(/^(email|correo|correo electrónico)\s*/, '').trim();
      this.startDictation('email', rest);
      return;
    }
    if (/^(nombre|nombre propio|firstname|name)\b/.test(lower)) {
      const rest = lower.replace(/^(nombre|nombre propio|firstname|name)\s*/, '').trim();
      this.startDictation('firstName', rest);
      return;
    }
    if (/^(apellidos|apellido|lastname|surname)\b/.test(lower)) {
      const rest = lower.replace(/^(apellidos|apellido|lastname|surname)\s*/, '').trim();
      this.startDictation('lastName', rest);
      return;
    }
    if (/^(contraseña|clave|password|pass)\b/.test(lower)) {
      const rest = lower.replace(/^(contraseña|clave|password|pass)\s*/, '').trim();
      this.startDictation('password', rest);
      return;
    }

    if (lower.includes('estado') || lower.includes('qué falta') || lower.includes('campos pendientes')) {
      const missing = this.getMissingFields();
      if (missing.length === 0) {
        this.voiceService.speak('Todos los campos están completos y válidos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
      } else {
        const firstMissing = this.getFirstMissingField(missing);
        if (firstMissing) {
          this.focusInput(firstMissing);
        }
        const fieldLabelsList = missing.map(f => `"${this.getFieldLabel(f)}"`).join(', ');
        this.voiceService.speak(`Faltan los campos: ${fieldLabelsList}. Di el nombre de uno para editarlo.`);
      }
      return;
    }

    if (lower.includes('leer campos') || lower === 'leer' || lower.includes('leer todo') ||
        lower.includes('qué tengo') || lower.includes('qué hay') || lower.includes('mostrar campos') ||
        lower.includes('qué he escrito') || lower.includes('revisar campos') ||
        lower.includes('comprobar campos') || lower.includes('ver campos')) {
      console.log('📖 [Register] Comando "leer campos" detectado');
      this.readAllFields();
      return;
    }

    if (lower.includes('registrar') || lower.includes('enviar') || lower.includes('crear cuenta')) {
      if (this.isRegistering || this.isVerifying()) {
        console.log('⏭️ Register: ya se está procesando un registro o verificación, ignorando duplicado');
        return;
      }
      this.submitForm();
      return;
    }

    console.log('🔍 Register - Comando no reconocido:', lower);
  }

  // ============================================================
  // LEER TODOS LOS CAMPOS
  // ============================================================

  private readAllFields(): void {
    if (this.isDestroyed) return;

    this.isReadingFields = true;

    const fieldConfigs = [
      { key: 'fullName', label: 'Usuario' },
      { key: 'email', label: 'Correo' },
      { key: 'password', label: 'Contraseña' },
      { key: 'confirmPassword', label: 'Confirmación' },
      { key: 'firstName', label: 'Nombre' },
      { key: 'lastName', label: 'Apellidos' }
    ];

    const filledFields: string[] = [];
    const emptyFields: string[] = [];

    for (const field of fieldConfigs) {
      const control = this.registerForm.get(field.key);
      const value = control?.value || '';
      if (value && value.trim().length > 0) {
        if (field.key === 'password' || field.key === 'confirmPassword') {
          filledFields.push(`${field.label}: completado`);
        } else if (field.key === 'email' && value) {
          const emailText = value
            .replace(/@/g, ' arroba ')
            .replace(/\.com$/, ' punto com')
            .replace(/\./g, ' punto ')
            .replace(/\s+/g, ' ')
            .trim();
          filledFields.push(`${field.label}: ${emailText}`);
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
        messages.push('Di "registrar" para crear la cuenta.');
      }
    }

    this.speakWithPausesAndCallback(messages, 600, () => {
      this.isReadingFields = false;
    });
  }

  private speakWithPausesAndCallback(messages: string[], pauseMs: number = 500, callback: (() => void) | null = null): void {
    if (this.isDestroyed || messages.length === 0) {
      if (callback) callback();
      return;
    }

    let index = 0;

    const speakNext = () => {
      if (this.isDestroyed || index >= messages.length) {
        if (callback) callback();
        return;
      }

      const message = messages[index];
      console.log(`🔊 [Register] Hablando (${index + 1}/${messages.length}): "${message}"`);

      this.voiceService.speak(message).then(() => {
        index++;
        if (index < messages.length) {
          setTimeout(() => { speakNext(); }, pauseMs);
        } else {
          if (callback) callback();
        }
      }).catch(() => {
        index++;
        if (index < messages.length) {
          setTimeout(() => { speakNext(); }, pauseMs);
        } else {
          if (callback) callback();
        }
      });
    };

    speakNext();
  }


  private clearField(target: string): void {
    if (this.isDestroyed) return;

    window.speechSynthesis.cancel();
    this.isSpeaking = false;

    if (this.dictationMode) {
      this.stopDictation(undefined, true);
    }

    const fieldName = this.getFieldLabel(target);
    const control = this.registerForm.get(target);
    if (!control) return;

    const currentValue = control.value || '';

    if (!currentValue) {
      this.voiceService.speak(`El campo ${fieldName} ya está vacío.`);
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

    this.voiceService.speak(`Campo ${fieldName} limpiado.`);
    this.log(`🧹 Campo ${fieldName} limpiado`);
    this.focusInput(target);
  }

  private log(...args: any[]): void {
    if (this.enableLogs) console.log(...args);
  }

  // ============================================================
  // DICTADO
  // ============================================================

  private startDictation(
    target: 'fullName' | 'email' | 'password' | 'confirmPassword' | 'firstName' | 'lastName',
    initialText = ''
  ): void {
    if (this.isDestroyed) return;
    this.dictationMode = true;
    this.dictationTarget = target;
    this.dictationBuffer = '';

    const fieldNames: Record<string, string> = {
      fullName: 'usuario',
      email: 'correo',
      password: 'contraseña',
      confirmPassword: 'confirmar',
      firstName: 'nombre',
      lastName: 'apellidos'
    };
    const fieldName = fieldNames[target] || target;

    this.updateFormAndInputDirectly(target, '');

    if (initialText) {
      this.updateFormAndInputDirectly(target, initialText);
      this.dictationBuffer = initialText.trimEnd();
      this.voiceService.speak(`Dictando para ${fieldName}. Texto inicial: ${initialText}`);
    } else {
      const finishWords = this.voiceFilter.getFinishWords().slice(0, 2).join('" o "');
      this.voiceService.speak(`Dictando ${fieldName}. Di "${finishWords}" para finalizar.`);
    }

    this.focusInput(target);
    console.log(`🎤 Dictado activado para: ${target}`);
  }

  //
  private handleDictation(text: string): void {
    console.log('📝 [handleDictation] Recibido:', text);
    if (this.isDestroyed || !this.dictationTarget) return;
    const target = this.dictationTarget;

    if (target === 'otp') {
      this.handleVoiceCommand(text);
      return;
    }

    const lower = text.toLowerCase().trim();

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
      const missing = this.getMissingFields();
      if (missing.length === 0) {
        this.voiceService.speak('Todos los campos están completos y válidos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
      } else {
        const firstMissing = this.getFirstMissingField(missing);
        if (firstMissing) {
          this.focusInput(firstMissing);
        }
        const fieldLabels = missing.map(f => `"${this.getFieldLabel(f)}"`).join(', ');
        this.voiceService.speak(`Faltan los campos: ${fieldLabels}. Di el nombre de uno para editarlo.`);
      }
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

    const fieldLabels = this.fieldCleanup.getFieldLabels();
    for (const label of fieldLabels) {
      if (lower.includes(`limpiar ${label}`) || lower.includes(`borrar ${label}`)) {
        const result = this.fieldCleanup.clearFieldByLabel(label);
        if (result.success) {
          this.stopDictation('', true);
        }
        return;
      }
    }

    if (lower === 'limpiar' || lower === 'borrar') {
      const result = this.fieldCleanup.clearFieldByName(target);
      if (result.success) {
        this.stopDictation('', true);
        return;
      }
    }

    const fieldName = this.getFieldLabel(target).toLowerCase();
    const formControlName = this.getFormControlName(target);
    const currentValue = this.registerForm.get(formControlName)?.value || '';

    if (lower === fieldName && !currentValue) {
      console.log(`🔁 [handleDictation] El usuario dijo "${fieldName}" y el campo está vacío. Reiniciando dictado...`);
      this.startDictation(target, '');
      return;
    }

    const normalized = text.toLowerCase().trim();

    const validateAndSave = (finalValue: string): boolean => {
      this.updateFormAndInputDirectly(target, finalValue);

      if (!finalValue || finalValue.length === 0) {
        const control = this.registerForm.get(target);
        if (control && control.hasError('required')) {
          this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
          return false;
        }
        this.stopDictation('');
        return true;
      }

      const validationError = this.validateField(target, finalValue);
      if (validationError) {
        const fieldLabel = this.getFieldLabel(target);
        this.voiceService.speak(validationError + ' Se borrará el contenido. Vuelve a decir "' + fieldLabel + '" para escribir de nuevo.');
        setTimeout(() => {
          this.updateFormAndInputDirectly(target, '');
        }, 3000);
        return false;
      }

      this.stopDictation(finalValue);
      return true;
    };

    const buildFinalValue = (extra: string = ''): string => {
      const existing = currentValue.trim();
      const dictado = (this.dictationBuffer || '').trim();
      const extraTrim = extra.trim();

      const partes: string[] = [];
      if (existing) partes.push(existing);
      if (dictado) partes.push(dictado);
      if (extraTrim) partes.push(extraTrim);

      return partes.join(' ').trim();
    };

    // ============================================================
    // FINALIZACIÓN CON "fin" / "terminar" (con texto incluido)
    // ============================================================
    if (normalized.endsWith('fin') || normalized.endsWith('terminar') ||
        normalized.endsWith(' fin') || normalized.endsWith(' terminar')) {
      console.log('🔴 [Register] Comando de finalización detectado (fin/terminar):', normalized);
      const cleanText = normalized.replace(/\s*(fin|terminar)$/, '').trim();

      // ✅ CASO 1: "fin" sin texto → usar buffer
      if (!cleanText) {
        const finalValue = buildFinalValue();

        if (!finalValue) {
          const control = this.registerForm.get(target);
          if (control && control.hasError('required')) {
            this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
            return;
          }
          this.stopDictation('');
          return;
        }

        validateAndSave(finalValue);
        return;
      }

      // ✅ CASO 2: "X fin" con texto
      const bufferActual = (this.dictationBuffer || '').trim();

      if (bufferActual.length > 0) {
        console.log('🔤 Buffer tiene contenido, ignorando cleanText para evitar duplicado');
        console.log('   buffer:', bufferActual);
        console.log('   cleanText:', cleanText);
        validateAndSave(buildFinalValue());
        return;
      }

      const processed = this.voiceFilter.processDictationPhrase(
        cleanText,
        this.getDictationContext(target),
        false
      );

      if (processed.success) {
        let textToAdd = (processed.text || '').trim();
        if (target === 'firstName' || target === 'lastName') {
          textToAdd = textToAdd
            .replace(/(\d)\s+([a-zA-Záéíóúüñ])/g, '$1$2')
            .replace(/([a-zA-Záéíóúüñ])\s+(\d)/g, '$1$2');
        }
        validateAndSave(buildFinalValue(textToAdd));
      } else {
        validateAndSave(buildFinalValue(cleanText));
      }
      return;
    }

    // ============================================================
    // FINALIZACIÓN SOLO CON "fin" / "terminar"
    // ============================================================
    if (normalized === 'fin' || normalized === 'terminar') {
      console.log('🔴 [Register] Finalización directa');

      const finalValue = buildFinalValue();

      if (!finalValue) {
        const control = this.registerForm.get(target);
        if (control && control.hasError('required')) {
          this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
          return;
        }
        this.stopDictation('');
        return;
      }

      validateAndSave(finalValue);
      return;
    }

    // ============================================================
    // FINALIZACIÓN CON PALABRAS DE FIN
    // ============================================================
    if (this.voiceFilter.containsFinishWords(text)) {
      const cleanText = this.voiceFilter.removeFinishWords(text);
      if (cleanText.length > 0) {
        const processed = this.voiceFilter.processDictationPhrase(cleanText, this.getDictationContext(target), false);
        if (processed.success) {
          let textToAdd = (processed.text || '').trim();
          if (target === 'firstName' || target === 'lastName') {
            textToAdd = textToAdd
              .replace(/(\d)\s+([a-zA-Záéíóúüñ])/g, '$1$2')
              .replace(/([a-zA-Záéíóúüñ])\s+(\d)/g, '$1$2');
          }
          validateAndSave(buildFinalValue(textToAdd));
        } else {
          validateAndSave(buildFinalValue());
        }
      } else {
        const finalValue = buildFinalValue();

        if (!finalValue) {
          const control = this.registerForm.get(target);
          if (control && control.hasError('required')) {
            this.voiceService.speak(`El campo ${this.getFieldLabel(target)} es obligatorio. Di "${this.getFieldLabel(target)}" para escribirlo.`);
            return;
          }
          this.stopDictation('');
          return;
        }

        validateAndSave(finalValue);
      }
      return;
    }

    // ============================================================
    // BORRAR / LIMPIAR
    // ============================================================
    if (text.includes('borrar') || text.includes('eliminar')) {
      if (this.dictationBuffer.length > 0) {
        const words = this.dictationBuffer.trim().split(/\s+/);
        words.pop();
        this.dictationBuffer = words.join(' ');
        this.voiceService.speak('Borrado último elemento dictado');
      } else if (currentValue.length > 0) {
        const newValue = currentValue.slice(0, -1);
        this.updateFormAndInputDirectly(target, newValue);
        this.voiceService.speak('Borrado último carácter');
      }
      return;
    }

    if (text.includes('limpiar todo') || text.includes('borrar todo')) {
      this.updateFormAndInputDirectly(target, '');
      this.dictationBuffer = '';
      this.voiceService.speak('Campo limpiado');
      return;
    }

    if (text.includes('mostrar') || text.includes('ver') || text.includes('leer')) {
      const preview = buildFinalValue();
      this.voiceService.speak(`Texto actual: ${preview || 'vacío'}`);
      return;
    }

    // ============================================================
    // DICTADO NORMAL: SOLO ACUMULA EN BUFFER
    // ============================================================
    const shouldCapitalize = target !== 'fullName' && target !== 'email';

    let processed = this.voiceFilter.processDictationPhrase(
      text,
      this.getDictationContext(target),
      shouldCapitalize
    );

    if (!processed.success || !processed.text) {
      const word = text.trim();
      const cleanWord = word
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u');
      let finalWord = cleanWord;
      if (shouldCapitalize && (this.dictationBuffer === '' || this.dictationBuffer.endsWith(' ')) && finalWord.length > 0) {
        finalWord = finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
      }
      processed = {
        success: true,
        text: finalWord + ' ',
        originalText: text,
        processedText: finalWord + ' '
      } as any;
    }

    let textToAdd = processed.text || '';
    if (target === 'firstName' || target === 'lastName') {
      textToAdd = textToAdd
        .replace(/(\d)\s+([a-zA-Záéíóúüñ])/g, '$1$2')
        .replace(/([a-zA-Záéíóúüñ])\s+(\d)/g, '$1$2');
    }

    // ✅ ACUMULAR EN BUFFER (no actualizar input durante dictado)
    this.dictationBuffer = textToAdd.trimEnd();
    console.log(`🔤 Texto acumulado (no visible) en ${target}: "${this.dictationBuffer}"`);
  }

  private validateField(target: string, value: string): string | null {
    if (!value || value.trim().length === 0) {
      return `El campo ${this.getFieldLabel(target)} no puede estar vacío.`;
    }

    const trimmed = value.trim();

    switch (target) {
      case 'email':
        if (!trimmed.includes('@')) return 'El email debe contener "arroba".';
        if (!trimmed.includes('.')) return 'El email debe contener un punto en el dominio.';
        const emailControl = this.registerForm.get('email');
        if (emailControl) {
          emailControl.setValue(trimmed, { emitEvent: false });
          emailControl.updateValueAndValidity({ emitEvent: false });
          if (emailControl.invalid) return 'El email no tiene un formato válido.';
        }
        break;

      case 'password': {
        if (trimmed.length < 9) {
          return `La contraseña debe tener al menos 9 caracteres. Tiene ${trimmed.length}.`;
        }
        const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(trimmed);
        const hasLower = /[a-záéíóúñ]/.test(trimmed);
        const hasNumber = /\d/.test(trimmed);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>-]/.test(trimmed);
        const missing: string[] = [];
        if (!hasUpper) missing.push('mayúscula');
        if (!hasLower) missing.push('minúscula');
        if (!hasNumber) missing.push('número');
        if (!hasSpecial) missing.push('carácter especial');
        if (missing.length > 0) {
          return `Falta: ${missing.join(', ')}.`;
        }
        break;
      }

      case 'confirmPassword': {
        const password = this.registerForm.get('password')?.value || '';
        if (trimmed !== password) {
          return 'La confirmación no coincide con la contraseña.';
        }
        break;
      }

      case 'fullName':
      case 'firstName':
      case 'lastName':
        if (trimmed.length < 2) {
          return `El campo ${this.getFieldLabel(target)} debe tener al menos 2 caracteres.`;
        }
        break;

      default:
        if (trimmed.length === 0) {
          return `El campo ${this.getFieldLabel(target)} no puede estar vacío.`;
        }
        break;
    }

    return null;
  }

  private async stopDictation(finalValue?: string, silent = false): Promise<void> {
    console.log('🔴 [stopDictation] LLAMADO - target:', this.dictationTarget, 'silent:', silent);
    if (this.isDestroyed) return;

    const target = this.dictationTarget;
    this.dictationMode = false;
    this.dictationTarget = null;
    this.dictationBuffer = '';
    this.cdr.markForCheck();

    if (!target) {
      console.log('🔴 Dictado finalizado (sin target)');
      return;
    }

    const formControlName = this.getFormControlName(target);
    const value = finalValue !== undefined ? finalValue : this.registerForm.get(formControlName)?.value || '';
    const trimmed = value.trimEnd();

    if (!silent) {
      if (trimmed.length > 0) {
        this.updateFormAndInputDirectly(target, trimmed);
        if (target !== 'password' && target !== 'confirmPassword') {
          await this.voiceService.speak(`Listo, ${this.getFieldLabel(target)} completado.`);
        }
      } else {
        await this.voiceService.speak('Dictado finalizado. Campo vacío.');
      }
    } else {
      if (trimmed.length > 0) {
        this.updateFormAndInputDirectly(target, trimmed);
      }
    }

    if (target === 'password' && trimmed.length > 0 && !silent) {
      await this.validatePasswordAfterDictation(trimmed);
    }
    if (target === 'confirmPassword' && trimmed.length > 0 && !silent) {
      await this.validateConfirmPasswordAfterDictation();
    }

    if (target !== 'password' && target !== 'confirmPassword') {
      const nextMissingField = this.getNextMissingField(target);
      if (nextMissingField && !silent) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.focusInput(nextMissingField);
        const label = this.getFieldLabel(nextMissingField);

        if (nextMissingField === 'email') {
          await this.voiceService.speak('Di correo para editar el email.');
        } else if (nextMissingField === 'confirmPassword') {
          await this.voiceService.speak('Di confirmar para editar.');
        } else {
          await this.voiceService.speak(`Campo ${label} disponible. Di "${label}" para editarlo.`);
        }
      } else if (!nextMissingField && !silent) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
      }
    }

    console.log('🔴 Dictado finalizado');
  }

  // ============================================================
  // AUXILIARES
  // ============================================================

  private getMissingFields(): string[] {
    const fields = ['fullName', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
    const missing: string[] = [];
    for (const field of fields) {
      const control = this.registerForm.get(field);
      if (!control || control.invalid || !control.value) {
        missing.push(field);
      }
    }
    return missing;
  }

  private getFirstMissingField(missingFields: string[]): string | null {
    for (const field of this.fieldOrder) {
      if (missingFields.includes(field)) return field;
    }
    return null;
  }

  private getNextMissingField(currentField: string): string | null {
    const missing = this.getMissingFields();
    if (missing.length === 0) return null;

    const currentIndex = this.fieldOrder.indexOf(currentField);
    if (currentIndex === -1) return missing[0];

    for (let i = currentIndex + 1; i < this.fieldOrder.length; i++) {
      const field = this.fieldOrder[i];
      if (missing.includes(field)) return field;
    }
    return missing[0];
  }

  private isFormCompleteAndValid(): boolean {
    const fields = ['fullName', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    for (const field of fields) {
      const control = this.registerForm.get(field);
      if (!control || control.invalid || !control.value) return false;
    }
    return true;
  }

  private getFormControlName(target: string): string {
    const map: Record<string, string> = {
      fullName: 'fullName',
      email: 'email',
      password: 'password',
      confirmPassword: 'confirmPassword',
      firstName: 'firstName',
      lastName: 'lastName'
    };
    return map[target] || target;
  }

  private getDictationContext(target: string): 'username' | 'password' | 'email' | 'text' {
    const map: Record<string, 'username' | 'password' | 'email' | 'text'> = {
      fullName: 'username',
      email: 'email',
      password: 'password',
      confirmPassword: 'password',
      firstName: 'text',
      lastName: 'text'
    };
    return map[target] || 'text';
  }

  private focusInput(target: string): void {
    if (this.isDestroyed) return;
    const inputMap: Record<string, IonInput | undefined> = {
      fullName: this.userInput,
      email: this.emailInput,
      password: this.passwordInput,
      confirmPassword: this.confirmPasswordInput,
      firstName: this.nameInput,
      lastName: this.lastNameInput
    };
    const input = inputMap[target];
    if (input) {
      setTimeout(() => {
        if (!this.isDestroyed) {
          input.setFocus();
          this.cdr.markForCheck();
        }
      }, 100);
    }
  }

  private updateFormAndInputDirectly(target: string, value: string): void {
    if (this.isDestroyed) return;

    if (target === 'password' || target === 'confirmPassword') {
      value = value.trim();
    }

    const formControlName = this.getFormControlName(target);
    const control = this.registerForm.get(formControlName);
    if (!control) return;

    control.setValue(value, { emitEvent: true });
    control.markAsDirty();
    control.markAsTouched();

    const inputMap: Record<string, IonInput | undefined> = {
      fullName: this.userInput,
      email: this.emailInput,
      password: this.passwordInput,
      confirmPassword: this.confirmPasswordInput,
      firstName: this.nameInput,
      lastName: this.lastNameInput
    };
    const input = inputMap[target];
    if (input) {
      input.value = value;
    }

    control.updateValueAndValidity({ emitEvent: true });
    this.cdr.markForCheck();
  }

  // ============================================================
  // ACCIONES
  // ============================================================

  private submitForm(): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      const errors = this.generalErrorMessage;
      this.voiceService.speak(`El formulario tiene errores: ${errors}`);
      return;
    }
    this.onRegister();
  }

  private showHelp(): void {
    if (this.helpShown) return;
    this.helpShown = true;

    if (this.voiceService.isCurrentlyMuted()) {
      this.voiceService.speak('El micrófono está desactivado. Di "hola" para activarlo.');
    } else if (this.isVerifying()) {
      this.voiceService.speak('En la verificación puedes decir "código" para enfocar el campo OTP, "pegar código" para rellenar automáticamente el código, "copiar código" para copiarlo al portapapeles, o "verificar" para validar el código.');
    } else {
      this.voiceService.speak(this.HELP_MESSAGE);
    }

    setTimeout(() => { this.helpShown = false; }, 5000);
  }

  togglePassword(): void {
    if (this.isDestroyed) return;
    this.hidePassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    if (this.isDestroyed) return;
    this.hideConfirmPassword.update((value) => !value);
  }

  // ============================================================
  // REGISTRO
  // ============================================================

  onRegister(): void {
    if (this.isDestroyed) return;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegistering = true;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      username: this.registerForm.get('fullName')?.value,
      email: this.registerForm.get('email')?.value.toLowerCase(),
      password: this.registerForm.get('password')?.value,
      confirmPassword: this.registerForm.get('confirmPassword')?.value,
      firstName: this.registerForm.get('firstName')?.value,
      lastName: this.registerForm.get('lastName')?.value,
    };

    this.authService.register(payload)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.isRegistering = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: any) => {
          if (this.isDestroyed) return;

          const otpCode = response?.code || response?.otp || null;
          console.log('🔑 Código OTP recibido del backend:', otpCode);

          if (otpCode) {
            this.receivedOtpCode.set(otpCode);
            this.voiceService.speak(
              'Registro exitoso. El código de verificación ha sido recibido. Di "pegar código" para rellenarlo automáticamente.'
            );
          } else {
            this.voiceService.speak('Registro exitoso. Revisa tu correo para el código de verificación.');
          }

          this.isVerifying.set(true);

          this.voiceContext.setContext({
            activationMessage: 'Estás en la verificación del código. Di "código" para enfocar, "pegar código" para rellenar, o "verificar" para validar.',
            availableCommands: ['código', 'pegar código', 'verificar', 'atrás', 'ayuda'],
            preventBackend: true
          });

          this.otpDigitBuffer = '';
          this.verificationCode.set('');
          if (this.otpInput) {
            this.otpInput.value = '';
          }
          this.resetOtpVisuals();
          this.cdr.detectChanges();
          this.startTimer();

          if (otpCode) {
            setTimeout(() => {
              if (!this.isDestroyed) {
                this.voiceService.speak('Di "pegar código" para rellenar el campo OTP.');
              }
            }, 1500);
          }

          setTimeout(() => {
            if (!this.isDestroyed && this.otpInput) {
              this.otpInput.setFocus();
              this.cdr.markForCheck();
            }
          }, 600);
        },
        error: (err) => {
          console.error('❌ Error en registro:', err);
          this.handleError(err);
        }
      });
  }

  // ============================================================
  // OTP
  // ============================================================

  public pasteOtpCode(): void {
    const code = this.receivedOtpCode();
    if (!code || code.length < 6) {
      this.voiceService.speak('No hay un código disponible para pegar. Asegúrate de que el registro fue exitoso.');
      return;
    }

    this.otpDigitBuffer = code;
    this.verificationCode.set(code);
    if (this.otpInput) {
      this.otpInput.value = code;
      this.otpInput.setFocus();
    }
    this.updateOtpSlots(code);
    this.cdr.detectChanges();

    this.voiceService.speak(`Código ${code} pegado en el campo. Di "verificar" para validarlo.`);
    console.log(`📋 Código pegado en OTP: "${code}"`);
  }

  public copyOtpCodeToClipboard(): void {
    let code = this.receivedOtpCode();
    if (!code || code.length < 6) {
      code = this.verificationCode() || this.otpDigitBuffer;
    }

    if (!code || code.length < 6) {
      this.voiceService.speak('No hay un código de 6 dígitos para copiar.');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        this.voiceService.speak('Código copiado al portapapeles.');
      }).catch(() => {
        this.fallbackCopyOtp(code);
      });
    } else {
      this.fallbackCopyOtp(code);
    }
  }

  private fallbackCopyOtp(code: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = code;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.voiceService.speak('Código copiado al portapapeles.');
  }

  verifyCode(code?: string): void {
    if (this.isDestroyed) return;
    if (this.otpVerificationCompleted) {
      console.log('⏳ OTP ya verificado, ignorando nueva solicitud.');
      return;
    }
    if (this.isVerifyingCode) {
      console.log('⏳ Ya hay una verificación en curso, ignorando...');
      return;
    }

    if (code) {
      console.log(`🔍 verifyCode recibió code: "${code}"`);
      if (this.verificationCode() !== code) {
        this.verificationCode.set(code);
        if (this.otpInput) {
          this.otpInput.value = code;
        }
      }
    }

    const codeToVerify = code || this.verificationCode();
    const email = this.registerForm.get('email')?.value?.toLowerCase() || '';

    if (!codeToVerify || codeToVerify.length < 6) {
      this.voiceService.speak('El código debe tener 6 dígitos.');
      return;
    }

    if (!email) {
      this.errorMessage.set('No se encontró el email.');
      return;
    }

    this.isVerifyingCode = true;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const data = { email, code: codeToVerify };
    console.log('📤 Enviando verificación:', JSON.stringify(data));

    this.authService.verifyOtp(data)
      .pipe(finalize(() => {
        if (!this.isDestroyed) {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      }))
      .subscribe({
        next: () => {
          if (this.isDestroyed) return;
          this.isVerifyingCode = false;
          this.otpVerificationCompleted = true;
          console.log('✅ Verificación exitosa');
          this.otpSlots = this.otpSlots.map(slot => ({ ...slot, filled: true, active: false, error: false }));
          this.otpDigitCount = 6;
          this.isDictating = false;
          this.cdr.detectChanges();
          this.voiceService.speak('Cuenta verificada correctamente.');
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.router.navigateByUrl('/login', { replaceUrl: true });
            }
          }, 2000);
        },
        error: (err) => {
          if (this.isDestroyed) return;
          this.isVerifyingCode = false;
          console.log('🔴 Error OTP:', err);

          const errorMessage = err?.error?.message || err?.message || '';
          if (err.status === 400 && errorMessage.toLowerCase().includes('ya está verificado')) {
            console.log('✅ El email ya estaba verificado, redirigiendo a login...');
            this.otpVerificationCompleted = true;
            this.voiceService.speak('Tu cuenta ya estaba verificada. Redirigiendo al login.');
            setTimeout(() => {
              if (!this.isDestroyed) {
                this.router.navigateByUrl('/login', { replaceUrl: true });
              }
            }, 1500);
            return;
          }

          this.errorMessage.set('Código inválido o expirado.');
          this.otpSlots = this.otpSlots.map(slot => ({ ...slot, filled: true, active: false, error: true }));
          this.cdr.detectChanges();

          this.verificationCode.set('');
          if (this.otpInput) {
            this.otpInput.value = '';
          }
          this.cdr.detectChanges();

          const isMuted = this.voiceService.isCurrentlyMuted();
          if (!isMuted) {
            this.voiceService.speak(`Código ${codeToVerify} inválido o expirado. Intenta de nuevo.`);
          } else {
            this.voiceService.speak('Código inválido o expirado. Di "código" para enfocar y dicta los dígitos.');
          }

          setTimeout(() => {
            if (this.isDestroyed) return;
            this.resetOtpVisuals();
            this.otpDigitBuffer = '';
            this.cdr.detectChanges();
          }, 2000);
        }
      });
  }

  private handleError(err: any): void {
    if (this.isDestroyed) return;
    const status = err?.status;
    const serverMessage = err?.message || err?.error?.message || err?.error || '';

    let msg = 'Error inesperado.';
    if (status === 409) {
      const lowerMsg = serverMessage.toLowerCase();
      if (lowerMsg.includes('correo') || lowerMsg.includes('email')) {
        msg = 'Este correo electrónico ya está registrado.';
      } else if (lowerMsg.includes('usuario') || lowerMsg.includes('username')) {
        msg = 'El nombre de usuario ya está en uso.';
      } else {
        msg = serverMessage || 'El usuario o correo ya existen.';
      }
    } else if (status === 400) {
      msg = `Datos inválidos: ${serverMessage}`;
    } else if (status === 0) {
      msg = 'No hay conexión con el servidor.';
    } else {
      msg = serverMessage || 'Ha ocurrido un error inesperado.';
    }

    this.errorMessage.set(`❌ ${msg}`);
    this.voiceService.speak(msg);
  }

  onOtpChange(event: any): void {
    if (this.isDestroyed) return;
    const value = event.detail?.value ?? event.target?.value ?? '';
    this.verificationCode.set(value);

    if (value.length === 6 && !this.isVerifyingCode) {
      this.verifyCode(value);
    }
  }

  private startTimer(): void {
    if (this.isDestroyed) return;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerSeconds.set(120);

    this.timerInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(this.timerInterval);
        return;
      }
      this.timerSeconds.update(s => s - 1);
      const current = this.timerSeconds();

      if (current === 60 || current === 30 || current === 15 || current === 10 || current === 5) {
        if (!this.otpVerificationCompleted && !this.isVerifyingCode) {
          this.voiceService.speak(`Te quedan ${current} segundos para introducir el código.`);
        }
      }

      if (current <= 0) {
        clearInterval(this.timerInterval);
        if (!this.otpVerificationCompleted) {
          const email = this.registerForm.get('email')?.value;
          if (email) {
            this.authService.cancelPendingRegistration(email).subscribe({
              next: () => {
                this.voiceService.speak('El tiempo ha expirado. El registro pendiente ha sido cancelado. Puedes intentarlo de nuevo.');
                this.resetVerification();
              },
              error: (err) => {
                console.error('Error al cancelar el registro:', err);
                this.voiceService.speak('Error al cancelar el registro. El sistema lo eliminará automáticamente en unos minutos.');
                this.resetVerification();
              }
            });
          } else {
            this.voiceService.speak('El tiempo ha expirado. Por favor, intenta registrarte de nuevo.');
            this.resetVerification();
          }
        }
      }
    }, 1000);
  }

  formattedTime(): string {
    return `${Math.floor(this.timerSeconds() / 60)}:${(this.timerSeconds() % 60).toString().padStart(2, '0')}`;
  }

  resetVerification(): void {
    if (this.isDestroyed) return;

    if (this.clearOtpTimeout) {
      clearTimeout(this.clearOtpTimeout);
      this.clearOtpTimeout = null;
    }
    if (this.otpTimer) {
      clearTimeout(this.otpTimer);
      this.otpTimer = null;
    }

    this.isVerifying.set(false);
    this.errorMessage.set(null);
    this.verificationCode.set('');
    this.otpDigitBuffer = '';
    this.isClearingOtp = false;
    this.isVerifyingCode = false;

    if (this.otpInput) {
      this.otpInput.value = '';
    }

    this.resetOtpVisuals();
    this.cdr.detectChanges();
    this.voiceService.speak('Volviendo al formulario de registro.');
  }

  get hasVisibleErrors(): boolean {
    return Object.keys(this.registerForm.controls).some(key => {
      const control = this.registerForm.get(key);
      return control?.invalid && control?.touched;
    });
  }

  get visibleErrorFields(): string[] {
    const fieldLabels: Record<string, string> = {
      fullName: 'nombre de usuario',
      email: 'correo electrónico',
      password: 'contraseña',
      confirmPassword: 'confirmación de contraseña',
      firstName: 'nombre propio',
      lastName: 'apellidos'
    };

    return Object.keys(this.registerForm.controls)
      .filter(key => {
        const control = this.registerForm.get(key);
        return control?.invalid && control?.touched;
      })
      .map(key => fieldLabels[key] || key);
  }

  get generalErrorMessage(): string {
    if (!this.hasVisibleErrors) return '';
    const fields = [...this.visibleErrorFields];
    if (fields.length === 1) {
      return `Error en el campo: ${fields[0]}.`;
    }
    const last = fields.pop();
    return `Errores en los campos: ${fields.join(', ')} y ${last}.`;
  }

  public goBack(): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);

    if (this.isVerifying()) {
      this.resetVerification();
      this.voiceService.speak('Volviendo al formulario de registro.');
      return;
    }

    this.voiceService.speak('Volviendo al inicio de sesión.');
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  goToLogin(): void {
    if (this.isDestroyed) return;
    if (this.dictationMode) this.stopDictation(undefined, true);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // ============================================================
  // VALIDACIONES POST-DICTADO
  // ============================================================

  private async validatePasswordAfterDictation(password: string): Promise<void> {
    const control = this.registerForm.get('password');
    if (control && control.invalid) {
      this.dictationBuffer = '';
      await this.voiceService.speak('Contraseña inválida. Di "contraseña" para intentarlo de nuevo.');
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    } else if (control && control.valid) {
      await this.voiceService.speak('Contraseña válida.');
      await new Promise(resolve => setTimeout(resolve, 500));
      this.focusInput('confirmPassword');
      await this.voiceService.speak('Di confirmar para editar.');
    }
  }

  private async validateConfirmPasswordAfterDictation(): Promise<void> {
    const control = this.registerForm.get('confirmPassword');
    const password = this.registerForm.get('password')?.value || '';
    const confirm = control?.value || '';

    const normalize = (str: string) => {
      if (!str) return '';
      return str
        .replace(/\s/g, '')
        .replace(/-/g, '')
        .replace(/[!@#$%^&*(),.?":{}|<>]/g, '')
        .toLowerCase();
    };

    const normalizedPassword = normalize(password);
    const normalizedConfirm = normalize(confirm);

    if (control && (control.invalid || normalizedPassword !== normalizedConfirm)) {
      this.dictationBuffer = '';
      const msg = 'La confirmación no coincide con la contraseña. Voy a borrar el campo. Di "confirmar" para intentarlo de nuevo.';
      await this.voiceService.speak(msg);
      await new Promise(resolve => setTimeout(resolve, 500));
      this.updateFormAndInputDirectly('confirmPassword', '');
      this.cdr.markForCheck();
      this.focusInput('confirmPassword');
      return;
    } else if (control && control.valid && normalizedPassword === normalizedConfirm) {
      await this.voiceService.speak('Confirmación correcta.');
      const nextMissing = this.getNextMissingField('confirmPassword');
      if (nextMissing) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.focusInput(nextMissing);
        const label = this.getFieldLabel(nextMissing);
        if (nextMissing === 'confirmPassword') {
          await this.voiceService.speak('Di confirmar para editar.');
        } else {
          await this.voiceService.speak(`Campo ${label} disponible. Di "${label}" para editarlo.`);
        }
      } else {
        await this.voiceService.speak('Todos los campos están completos. Di "registrar" para crear la cuenta, o "leer campos" para comprobar el contenido.');
      }
    }
  }

  // ============================================================
  // OTP VISUAL
  // ============================================================

  private resetOtpVisuals(): void {
    this.otpSlots = Array(6).fill(null).map(() => ({
      filled: false,
      active: false,
      error: false
    }));
    this.otpDigitCount = 0;
    this.otpError = '';
    this.isDictating = false;
  }

  private updateOtpSlots(digits: string): void {
    const digitArray = digits.split('');
    this.otpSlots = Array(6).fill(null).map((_, index) => ({
      filled: index < digitArray.length && digitArray[index] !== '',
      active: index === digitArray.length && digitArray.length < 6,
      error: false
    }));
    this.otpDigitCount = digitArray.length;
    this.isDictating = digitArray.length < 6;
    this.cdr.detectChanges();
  }

  // ============================================================
  // DESTRUCCIÓN
  // ============================================================

  ngOnDestroy(): void {
    console.log('🧹 RegisterComponent destruido');

    this.voiceService.clearTranscript();

    this.isDestroyed = true;

    if (this.dictationMode) {
      this.stopDictation(undefined, true);
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.clearOtpTimeout) {
      clearTimeout(this.clearOtpTimeout);
      this.clearOtpTimeout = null;
    }

    if (this.otpTimer) {
      clearTimeout(this.otpTimer);
      this.otpTimer = null;
    }

    this.mutedSubscription?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
    this.voiceContext.resetContext();
    window.speechSynthesis.cancel();

    const fieldNames = ['fullName', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
    for (const name of fieldNames) {
      this.fieldCleanup.unregisterField(name);
    }

    this.dictationMode = false;
    this.dictationTarget = null;
    this.dictationBuffer = '';
    this.otpDigitBuffer = '';
  }
}