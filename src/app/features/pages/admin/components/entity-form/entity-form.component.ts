// // src/app/features/admin/dynamic-entity-manager/components/entity-form/entity-form.component.ts

// import {
//   Component, input, output, inject, computed, signal, effect,
//   OnInit, ViewChild, ElementRef, AfterViewInit
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormsModule, ReactiveFormsModule, FormBuilder,
//   FormGroup, Validators, FormControl
// } from '@angular/forms';
// import { RouterModule, Router, ActivatedRoute } from '@angular/router';

// // ✅ Ionic 9
// import {
//   IonIcon, IonButton, IonSpinner,
//   IonCheckbox, IonSelect, IonSelectOption,
//   IonInput, IonTextarea
// } from '@ionic/angular';
// import { addIcons } from 'ionicons';
// import {
//   createOutline,
//   closeOutline,
//   saveOutline
// } from 'ionicons/icons';

// import { EntityConfigService } from '../../../../../shared/services/sidebar/entity-config.service';
// import { EntityCrudService } from '../../../../../shared/services/sidebar/entity-crud.service';
// import { EntityConfig } from '../../../admin//models/entity-config';
// import { RoleService } from '../../../../services/role/role.service';

// @Component({
//   selector: 'app-entity-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     RouterModule,
//     IonIcon,
//     IonButton,
//     IonSpinner,
//     IonCheckbox,
//     IonSelect,
//     IonSelectOption,
//     IonInput,
//     IonTextarea
//   ],
//   templateUrl: './entity-form.component.html',
//   styleUrls: ['./entity-form.component.scss']
// })
// export class EntityFormComponent implements OnInit, AfterViewInit {
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private configService = inject(EntityConfigService);
//   private crudService = inject(EntityCrudService);
//   private roleService = inject(RoleService);

//   @ViewChild('firstInput') firstInput!: ElementRef;

//   // ============================================================
//   // INPUTS / OUTPUTS
//   // ============================================================
//   entity = input<string | null>(null);
//   data = input<any>(null);
//   isEdit = input<boolean | null>(null);

//   loading = input(false);
//   saveRequested = output<any>();
//   cancelRequested = output<void>();

//   // ============================================================
//   // ESTADO INTERNO
//   // ============================================================
//   entityName = signal<string>('');
//   isEditing = signal<boolean>(false);
//   editingId = signal<number | null>(null);

//   // Roles disponibles
//   availableRoles: any[] = [];

//   // ============================================================
//   // COMPUTED
//   // ============================================================
//   config = computed((): EntityConfig | null => {
//     return this.configService.getConfig(this.entityName()) || null;
//   });

//   editableFields = computed(() => {
//     const config = this.config();
//     if (!config) return [];

//     const editing = this.isEditing();
//     return config.fields.filter(f => {
//       if (f.hidden) return false;
//       if (f.key === 'id') return false;

//       if (editing && f.showOnEdit === false) return false;
//       if (!editing && f.showOnCreate === false) return false;

//       return true;
//     });
//   });

//   gridColumns = computed(() => {
//     const config = this.config();
//     const cols = config?.formSettings?.columns || 2;
//     return `repeat(${cols}, 1fr)`;
//   });

//   form!: FormGroup;

//   // ============================================================
//   // CONSTRUCTOR
//   // ============================================================
//   constructor() {
//     addIcons({
//       createOutline,
//       closeOutline,
//       saveOutline
//     });

//     // ✅ Sincronizar el input `isEdit` con el signal interno `isEditing`
//     effect(() => {
//       const editFromParent = this.isEdit();
//       if (editFromParent !== null) {
//         this.isEditing.set(editFromParent);
//       }
//     });
//   }

//   // ============================================================
//   // CICLO DE VIDA
//   // ============================================================
//   ngOnInit(): void {
//     this.loadRoles();

//     // ✅ Modo "input" (componente usado embebido en otro componente)
//     if (this.entity()) {
//       this.entityName.set(this.entity()!);
//       const editingMode = this.isEdit() ?? false;
//       this.isEditing.set(editingMode);

//       this.initForm();

//       if (this.data() && editingMode && this.form) {
//         this.form.patchValue(this.data());
//       }
//       return;
//     }

//     // ✅ Modo "ruta" (componente cargado desde el router)
//     this.route.params.subscribe(params => {
//       this.entityName.set(params['entity']);

//       const id = params['id'];
//       if (id) {
//         this.isEditing.set(true);
//         this.editingId.set(parseInt(id));
//         this.loadItem(parseInt(id));
//       }

//       this.initForm();
//     });
//   }

//   ngAfterViewInit(): void {
//     setTimeout(() => {
//       if (this.firstInput) {
//         this.firstInput.nativeElement.focus();
//       }
//     }, 150);
//   }

//   // ============================================================
//   // CARGA DE ROLES
//   // ============================================================
//   loadRoles(): void {
//     this.roleService.getAllRoles().subscribe({
//       next: (roles: any[]) => {
//         this.availableRoles = roles;
//       },
//       error: (err) => {
//         console.error('No se pudieron cargar los roles', err);
//       }
//     });
//   }

//   // ============================================================
//   // CARGA DE ITEM
//   // ============================================================
//   loadItem(id: number): void {
//     const config = this.config();
//     if (!config) return;

//     this.crudService.getById(config, id).subscribe({
//       next: (data) => {
//         if (this.form) {
//           this.form.patchValue(data);
//         }
//       },
//       error: (err) => {
//         console.error('Error cargando item:', err);
//       }
//     });
//   }

//   // ============================================================
//   // INICIALIZACIÓN DEL FORMULARIO
//   // ============================================================
//   initForm(): void {
//     const config = this.config();
//     if (!config) return;

//     const group: any = {};
//     const editing = this.isEditing();
//     const currentData = this.data() || {};   // ✅ data() en lugar de dataInput()

//     config.fields.forEach(field => {
//       if (field.hidden) return;

//       const validators = [];

//       if (field.required && !(editing && field.key === 'password')) {
//         validators.push(Validators.required);
//       }

//       if (field.key === 'roles') {
//         validators.push(Validators.required);
//       }

//       if (field.type === 'email') validators.push(Validators.email);
//       if (field.minLength) validators.push(Validators.minLength(field.minLength));
//       if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));

//       let initialValue = this.getDefaultValue(field.type);

//       if (editing && currentData[field.key] !== undefined && currentData[field.key] !== null) {
//         initialValue = currentData[field.key];
//       }

//       const isDisabled = editing && (field.readonly || field.key === 'password');

//       group[field.key] = new FormControl(
//         { value: initialValue, disabled: isDisabled },
//         validators
//       );
//     });

//     this.form = this.fb.group(group);
//   }

//   private getDefaultValue(type: string): any {
//     switch (type) {
//       case 'boolean': return false;
//       case 'number': return null;
//       case 'date': return null;
//       case 'multiselect': return [];
//       default: return '';
//     }
//   }

//   // ============================================================
//   // ENVÍO DEL FORMULARIO
//   // ============================================================
//   onSubmit(): void {
//     const formValue = this.form.getRawValue();

//     const isUserEntity = this.entityName() === 'users' || this.entityName() === 'UserEntity';

//     if (isUserEntity) {
//       if (!formValue.roles || !Array.isArray(formValue.roles) || formValue.roles.length === 0) {
//         this.form.get('roles')?.setErrors({ required: true });
//         this.form.markAllAsTouched();
//         return;
//       }
//     }

//     if (this.form.valid) {
//       if (this.isEditing() && !formValue.password) {
//         delete formValue.password;
//       }

//       if (isUserEntity && formValue.roles) {
//         formValue.roleIds = formValue.roles.map((roleName: string) => {
//           const foundRole = this.availableRoles.find(r => r.name === roleName);
//           return foundRole ? foundRole.id : null;
//         }).filter((id: number | null) => id !== null);

//         delete formValue.roles;
//       }

//       this.saveRequested.emit(formValue);   // ✅ saveRequested en lugar de onSave
//     } else {
//       this.form.markAllAsTouched();
//     }
//   }

//   cancelar(): void {
//     console.log('❌ Cancelando formulario');
//     if (!this.entity()) {   // ✅ entity() en lugar de entityInput()
//       this.router.navigate(['/admin/entities', this.entityName()]);
//     }
//     this.cancelRequested.emit();   // ✅ cancelRequested en lugar de onCancel
//   }
// }












// src/app/features/admin/dynamic-entity-manager/components/entity-form/entity-form.component.ts

import {
  Component, input, output, inject, computed, signal, effect,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder,
  FormGroup, Validators, FormControl,
  AbstractControl
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

// ✅ Ionic 9
import {
  IonIcon, IonButton, IonSpinner,
  IonCheckbox, IonSelect, IonSelectOption,
  IonInput, IonTextarea
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  createOutline,
  closeOutline,
  saveOutline,
  eyeOutline,        
  eyeOffOutline     
} from 'ionicons/icons';

import { EntityConfigService } from '../../../../../shared/services/sidebar/entity-config.service';
import { EntityCrudService } from '../../../../../shared/services/sidebar/entity-crud.service';
import { EntityConfig } from '../../../admin//models/entity-config';
import { RoleService } from '../../../../services/role/role.service';
import { FieldErrorComponent } from '../../../../../shared/components/messages/field-error/field-error.component';
import { PermissionService } from '../../../../services/permission/permission';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonIcon,
    IonButton,
    IonSpinner,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    FieldErrorComponent
  ],
  templateUrl: './entity-form.component.html',
  styleUrls: ['./entity-form.component.scss']
})
export class EntityFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private configService = inject(EntityConfigService);
  private crudService = inject(EntityCrudService);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);


  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  entity = input<string | null>(null);
  data = input<any>(null);
  isEdit = input<boolean | null>(null);

  loading = input(false);
  saveRequested = output<any>();
  cancelRequested = output<void>();

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  entityName = signal<string>('');
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  showPassword = signal<Record<string, boolean>>({});

  // Roles y permissions disponibles
  availableRoles: any[] = [];
  availablePermissions = signal<any[]>([]);

  // ============================================================
  // COMPUTED
  // ============================================================
  config = computed((): EntityConfig | null => {
    return this.configService.getConfig(this.entityName()) || null;
  });

  // editableFields = computed(() => {
  //   const config = this.config();
  //   if (!config) return [];

  //   const editing = this.isEditing();
  //   return config.fields.filter(f => {
  //     if (f.hidden) return false;
  //     if (f.key === 'id') return false;

  //     if (editing && f.showOnEdit === false) return false;
  //     if (!editing && f.showOnCreate === false) return false;

  //     return true;
  //   });
  // });


  editableFields = computed(() => {
    const config = this.config();
    if (!config) return [];

    const editing = this.isEditing();
    const perms = this.availablePermissions();   // ✅ Signal

    return config.fields
      .filter(f => {
        if (f.hidden) return false;
        if (f.key === 'id') return false;

        if (editing && f.showOnEdit === false) return false;
        if (!editing && f.showOnCreate === false) return false;

        return true;
      })
      .map(f => {
        // ✅ Inyectar opciones dinámicas para "permissions"
        if (f.key === 'permissions') {
          return {
            ...f,
            options: perms.map(p => ({
              label: p.name,     // Ej: "user:read"
              value: p.name      // Ej: "user:read"
            }))
          };
        }
        return f;
      });
  });


  gridColumns = computed(() => {
    const config = this.config();
    const cols = config?.formSettings?.columns || 2;
    return `repeat(${cols}, 1fr)`;
  });

  form!: FormGroup;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons({
      createOutline,
      closeOutline,
      saveOutline,
       eyeOutline,       
      eyeOffOutline  
    });

    // ✅ Sincronizar el input `isEdit` con el signal interno `isEditing`
    effect(() => {
      const editFromParent = this.isEdit();
      if (editFromParent !== null) {
        this.isEditing.set(editFromParent);
      }
    });
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();

    // ✅ Modo "input" (componente usado embebido en otro componente)
    if (this.entity()) {
      this.entityName.set(this.entity()!);
      const editingMode = this.isEdit() ?? false;
      this.isEditing.set(editingMode);

      this.initForm();

      if (this.data() && editingMode && this.form) {
        this.form.patchValue(this.data());
      }
      return;
    }

    // ✅ Modo "ruta" (componente cargado desde el router)
    this.route.params.subscribe(params => {
      this.entityName.set(params['entity']);

      const id = params['id'];
      if (id) {
        this.isEditing.set(true);
        this.editingId.set(parseInt(id));
        this.loadItem(parseInt(id));
      }

      this.initForm();
    });
  }

  // ============================================================
  // CARGA DE ROLES
  // ============================================================
  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles: any[]) => {
        this.availableRoles = roles;
      },
      error: (err) => {
        console.error('No se pudieron cargar los roles', err);
      }
    });
  }

  // ============================================================
  // CARGA DE PERMISOS
  // ============================================================
  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (permissions: any[]) => {
        this.availablePermissions.set(permissions);
      },
      error: (err) => {
        console.error('No se pudieron cargar los permisos', err);
      }
    });
  }

  // ============================================================
  // CARGA DE ITEM
  // ============================================================
  loadItem(id: number): void {
    const config = this.config();
    if (!config) return;

    this.crudService.getById(config, id).subscribe({
      next: (data) => {
        if (this.form) {
          this.form.patchValue(data);
        }
      },
      error: (err) => {
        console.error('Error cargando item:', err);
      }
    });
  }

  // ============================================================
  // INICIALIZACIÓN DEL FORMULARIO
  // ============================================================
  // initForm(): void {
  //   const config = this.config();
  //   if (!config) return;

  //   const group: any = {};
  //   const editing = this.isEditing();
  //   const currentData = this.data() || {};

  //   config.fields.forEach(field => {
  //     if (field.hidden) return;

  //     const validators = [];

  //     if (field.required && !(editing && field.key === 'password')) {
  //       validators.push(Validators.required);
  //     }

  //     // ✅ Roles: obligatorio y no vacío
  //     if (field.key === 'roles') {
  //       validators.push(Validators.required);
  //       validators.push((control: AbstractControl) => {
  //         const value = control.value;
  //         if (!value || !Array.isArray(value) || value.length === 0) {
  //           return { required: true };
  //         }
  //         return null;
  //       });
  //     }

  //     // ✅ Email: doble validación
  //     if (field.type === 'email') {
  //       validators.push(Validators.email);
  //       validators.push(Validators.pattern(
  //         /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/
  //       ));
  //     }

  //     // ✅ Password: contraseña fuerte (solo en creación)
  //     if (field.type === 'password' && !editing) {
  //       validators.push(Validators.minLength(9));
  //       validators.push(Validators.pattern(
  //         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/
  //       ));
  //     }

  //     if (field.minLength) validators.push(Validators.minLength(field.minLength));
  //     if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));

  //     let initialValue = this.getDefaultValue(field.type);

  //     if (editing && currentData[field.key] !== undefined && currentData[field.key] !== null) {
  //       initialValue = currentData[field.key];
  //     }

  //     const isDisabled = editing && (field.readonly || field.key === 'password');

  //     group[field.key] = new FormControl(
  //       { value: initialValue, disabled: isDisabled },
  //       validators
  //     );
  //   });

  //   this.form = this.fb.group(group);
  // }


  initForm(): void {
    const config = this.config();
    if (!config) return;

    const group: any = {};
    const editing = this.isEditing();
    const currentData = this.data() || {};

    config.fields.forEach(field => {
      if (field.hidden) return;

      const validators = [];

      if (field.required && !(editing && field.key === 'password')) {
        validators.push(Validators.required);
      }

      // ✅ Roles: obligatorio y no vacío (UserEntity)
      if (field.key === 'roles') {
        validators.push(Validators.required);
        validators.push((control: AbstractControl) => {
          const value = control.value;
          if (!value || !Array.isArray(value) || value.length === 0) {
            return { required: true };
          }
          return null;
        });
      }

      // ✅ NUEVO: name de RoleEntity (solo en creación)
      if (field.key === 'name' && !editing) {
        validators.push(Validators.minLength(2));
        validators.push(Validators.maxLength(50));
        validators.push(Validators.pattern(/^[A-Z][A-Z_]*$/));
      }

      // ✅ NUEVO: permissions de RoleEntity (obligatorio al menos 1)
      if (field.key === 'permissions') {
        validators.push(Validators.required);
        validators.push((control: AbstractControl) => {
          const value = control.value;
          if (!value || !Array.isArray(value) || value.length === 0) {
            return { required: true };
          }
          return null;
        });
      }

      // ✅ Email: doble validación
      if (field.type === 'email') {
        validators.push(Validators.email);
        validators.push(Validators.pattern(
          /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/
        ));
      }

      // ✅ Password: contraseña fuerte (solo en creación)
      if (field.type === 'password' && !editing) {
        validators.push(Validators.minLength(9));
        validators.push(Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/
        ));
      }

      if (field.minLength) validators.push(Validators.minLength(field.minLength));
      if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));

      let initialValue = this.getDefaultValue(field.type);

      if (editing && currentData[field.key] !== undefined && currentData[field.key] !== null) {
        initialValue = currentData[field.key];
      }

      const isDisabled = editing && (field.readonly || field.key === 'password');

      group[field.key] = new FormControl(
        { value: initialValue, disabled: isDisabled },
        validators
      );
    });

    this.form = this.fb.group(group);
  }


  private getDefaultValue(type: string): any {
    switch (type) {
      case 'boolean': return false;
      case 'number': return null;
      case 'date': return null;
      case 'multiselect': return [];
      default: return '';
    }
  }

  // ============================================================
  // ENVÍO DEL FORMULARIO
  // ============================================================
  onSubmit(): void {
      // ✅ Si el form es inválido, no enviar (por seguridad)
      if (this.form.invalid) {
          console.warn('Formulario inválido, no se envía');
          return;
      }

      const formValue = this.form.getRawValue();
      const isUserEntity = this.entityName() === 'users' || this.entityName() === 'UserEntity';

      if (this.isEditing() && !formValue.password) {
          delete formValue.password;
      }

      if (isUserEntity && formValue.roles) {
          formValue.roleIds = formValue.roles.map((roleName: string) => {
              const foundRole = this.availableRoles.find(r => r.name === roleName);
              return foundRole ? foundRole.id : null;
          }).filter((id: number | null) => id !== null);

          delete formValue.roles;
      }

      this.saveRequested.emit(formValue);
  }


  // ============================================================
  // PASSWORD TOGGLE
  // ============================================================
  togglePassword(key: string): void {
    this.showPassword.update(current => ({
      ...current,
      [key]: !current[key]
    }));
  }

  cancelar(): void {
    console.log('❌ Cancelando formulario');
    if (!this.entity()) {
      this.router.navigate(['/admin/entities', this.entityName()]);
    }
    this.cancelRequested.emit();
  }
}