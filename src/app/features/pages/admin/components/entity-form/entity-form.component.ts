// // src/app/features/admin/dynamic-entity-manager/components/entity-form/entity-form.component.ts

// import {
//   Component, input, output, inject, computed, signal, effect,
//   OnInit
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormsModule, ReactiveFormsModule, FormBuilder,
//   FormGroup, Validators, FormControl,
//   AbstractControl
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
//   saveOutline,
//   eyeOutline,
//   eyeOffOutline
// } from 'ionicons/icons';

// import { EntityConfigService } from '../../../../../shared/services/sidebar/entity-config.service';
// import { EntityCrudService } from '../../../../../shared/services/sidebar/entity-crud.service';
// import { EntityConfig, EntityField } from '../../../admin//models/entity-config';
// import { RoleService } from '../../../../services/role/role.service';
// import { FieldErrorComponent } from '../../../../../shared/components/messages/field-error/field-error.component';
// import { PermissionService } from '../../../../services/permission/permission';

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
//     IonTextarea,
//     FieldErrorComponent
//   ],
//   templateUrl: './entity-form.component.html',
//   styleUrls: ['./entity-form.component.scss']
// })
// export class EntityFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private configService = inject(EntityConfigService);
//   private crudService = inject(EntityCrudService);
//   private roleService = inject(RoleService);
//   private permissionService = inject(PermissionService);

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
//   showPassword = signal<Record<string, boolean>>({});

//   // Roles y permissions disponibles
//   availableRoles: any[] = [];
//   availablePermissions = signal<any[]>([]);

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
//     const perms = this.availablePermissions();

//     return config.fields
//       .filter(f => {
//         if (f.hidden) return false;
//         if (f.key === 'id') return false;

//         if (editing && f.showOnEdit === false) return false;
//         if (!editing && f.showOnCreate === false) return false;

//         return true;
//       })
//       .map(f => {
//         // ✅ Inyectar opciones dinámicas para "permissions"
//         if (f.key === 'permissions') {
//           return {
//             ...f,
//             options: perms.map(p => ({
//               label: p.name,
//               value: p.name
//             }))
//           };
//         }
//         return f;
//       });
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
//       saveOutline,
//       eyeOutline,
//       eyeOffOutline
//     });

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
//     this.loadPermissions();

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
//   // CARGA DE PERMISOS
//   // ============================================================
//   loadPermissions(): void {
//     this.permissionService.getAllPermissions().subscribe({
//       next: (permissions: any[]) => {
//         this.availablePermissions.set(permissions);
//       },
//       error: (err) => {
//         console.error('No se pudieron cargar los permisos', err);
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
//     const currentData = this.data() || {};

//     config.fields.forEach(field => {
//       if (field.hidden) return;

//       const validators = [];

//       if (field.required && !(editing && field.key === 'password')) {
//         validators.push(Validators.required);
//       }

//       // ✅ Roles: obligatorio y no vacío (UserEntity)
//       if (field.key === 'roles') {
//         validators.push(Validators.required);
//         validators.push((control: AbstractControl) => {
//           const value = control.value;
//           if (!value || !Array.isArray(value) || value.length === 0) {
//             return { required: true };
//           }
//           return null;
//         });
//       }

//       // ✅ name de RoleEntity (solo en creación)
//       // if (field.key === 'name' && !editing) {
//       //   validators.push(Validators.minLength(2));
//       //   validators.push(Validators.maxLength(50));
//       //   validators.push(Validators.pattern(/^[A-Z][A-Z_]*$/));
//       // }

//       // ✅ name de RoleEntity (solo en creación)
//       if (field.key === 'name' && !editing && this.entityName() === 'RoleEntity') {
//         validators.push(Validators.minLength(2));
//         validators.push(Validators.maxLength(50));
//         validators.push(Validators.pattern(/^[A-Z][A-Z_]*$/));
//       }

//       // ✅ permissions de RoleEntity
//       if (field.key === 'permissions' && this.entityName() === 'RoleEntity') {
//         validators.push(Validators.required);
//         validators.push((control: AbstractControl) => {
//           const value = control.value;
//           if (!value || !Array.isArray(value) || value.length === 0) {
//             return { required: true };
//           }
//           return null;
//         });
//       }

//       // ✅ Email: doble validación
//       if (field.type === 'email') {
//         validators.push(Validators.email);
//         validators.push(Validators.pattern(
//           /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/
//         ));
//       }

//       // ✅ Password: contraseña fuerte (solo en creación)
//       if (field.type === 'password' && !editing) {
//         validators.push(Validators.minLength(9));
//         validators.push(Validators.pattern(
//           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/
//         ));
//       }

//       // ✅ Validaciones para InstitutionEntity
//       if (this.entityName() === 'InstitutionEntity') {

//         // Nombre: 2-200 caracteres
//         if (field.key === 'name') {
//           validators.push(Validators.minLength(2));
//           validators.push(Validators.maxLength(200));
//         }

//         // Teléfono: opcional, formato español (con o sin +34)
//         if (field.key === 'phone') {
//           validators.push((control: AbstractControl) => {
//             const value = control.value;
//             if (!value) return null;
//             const clean = value.replace(/[\s.-]/g, '');
//             const phonePattern = /^(\+?34)?[6-9]\d{8}$/;
//             return phonePattern.test(clean) ? null : { invalidPhone: true };
//           });
//         }

//         // Web: opcional, URL válida
//         if (field.key === 'website') {
//           validators.push((control: AbstractControl) => {
//             const value = control.value;
//             if (!value) return null;
//             const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
//             return urlPattern.test(value) ? null : { invalidUrl: true };
//           });
//         }

//         // Dirección: máximo 300 caracteres
//         if (field.key === 'address') {
//           validators.push(Validators.maxLength(300));
//         }
//       }

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
//     if (this.form.invalid) {
//       console.warn('Formulario inválido, no se envía');
//       return;
//     }

//     const formValue = this.form.getRawValue();
//     const isEditing = this.isEditing();
//     const config = this.config();

//     // ✅ Al crear, eliminar del payload los campos que no se muestran en creación
//     if (!isEditing && config) {
//       config.fields.forEach(field => {
//         if (field.showOnCreate === false && field.key !== 'id') {
//           delete formValue[field.key];
//         }
//       });
//     }

//     const isUserEntity = this.entityName() === 'users' || this.entityName() === 'UserEntity';

//     if (isEditing && !formValue.password) {
//       delete formValue.password;
//     }

//     if (isUserEntity && formValue.roles) {
//       formValue.roleIds = formValue.roles.map((roleName: string) => {
//         const foundRole = this.availableRoles.find(r => r.name === roleName);
//         return foundRole ? foundRole.id : null;
//       }).filter((id: number | null) => id !== null);

//       delete formValue.roles;
//     }

//     this.saveRequested.emit(formValue);
//   }


//   // ============================================================
//   // PASSWORD TOGGLE
//   // ============================================================
//   togglePassword(key: string): void {
//     this.showPassword.update(current => ({
//       ...current,
//       [key]: !current[key]
//     }));
//   }

//   cancelar(): void {
//     console.log('❌ Cancelando formulario');
//     if (!this.entity()) {
//       this.router.navigate(['/admin/entities', this.entityName()]);
//     }
//     this.cancelRequested.emit();
//   }

//   // entity-form.component.ts
//   isFieldReadonly(field: EntityField): boolean {
//     return !!(field.readonly || (field.readonlyOnEdit && this.isEditing()));
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
import { HttpClient } from '@angular/common/http';

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
import { EntityConfig, EntityField } from '../../../admin//models/entity-config';
import { RoleService } from '../../../../services/role/role.service';
import { FieldErrorComponent } from '../../../../../shared/components/messages/field-error/field-error.component';
import { PermissionService } from '../../../../services/permission/permission';
import { environment } from '../../../../../../environments/environment';

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
  private http = inject(HttpClient);

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

  // Instituciones disponibles (para CourseEntity)
  availableInstitutions = signal<{ id: number; name: string }[]>([]);

  // Cursos disponibles (para CollectionEntity)
  availableCourses = signal<{ id: number; title: string }[]>([]);

  // Opciones genéricas por key (para optionsSource)
  selectOptions = signal<Record<string, { label: string; value: any }[]>>({});

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
  //   const perms = this.availablePermissions();
  //   const institutions = this.availableInstitutions();

  //   return config.fields
  //     .filter(f => {
  //       if (f.hidden) return false;
  //       if (f.key === 'id') return false;

  //       if (editing && f.showOnEdit === false) return false;
  //       if (!editing && f.showOnCreate === false) return false;

  //       return true;
  //     })
  //     .map(f => {
  //       // ✅ Inyectar opciones dinámicas para "permissions"
  //       if (f.key === 'permissions') {
  //         return {
  //           ...f,
  //           options: perms.map(p => ({
  //             label: p.name,
  //             value: p.name
  //           }))
  //         };
  //       }

  //       // ✅ Inyectar opciones dinámicas para "institutionId"
  //       if (f.key === 'institutionId') {
  //         return {
  //           ...f,
  //           options: institutions.map(i => ({
  //             label: i.name,
  //             value: i.id
  //           }))
  //         };
  //       }

  //       return f;
  //     });
  // });



  editableFields = computed(() => {
    const config = this.config();
    if (!config) return [];

    const editing = this.isEditing();
    const perms = this.availablePermissions();
    const dynamicOptions = this.selectOptions();   // ✅ CAMBIO

    return config.fields
      .filter(f => {
        if (f.hidden) return false;
        if (f.key === 'id') return false;

        if (editing && f.showOnEdit === false) return false;
        if (!editing && f.showOnCreate === false) return false;

        return true;
      })
      .map(f => {
        // ✅ Permissions (caso especial)
        if (f.key === 'permissions') {
          return {
            ...f,
            options: perms.map(p => ({
              label: p.name,
              value: p.name
            }))
          };
        }

        // ✅ CUALQUIER select/multiselect con optionsSource
        if ((f.type === 'select' || f.type === 'multiselect') && f.optionsSource) {
          return {
            ...f,
            options: dynamicOptions[f.key] || []
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
      
      this.loadSelectOptionsIfNeeded();
      this.initForm();

      if (this.data() && editingMode && this.form) {
        this.form.patchValue(this.data());
      }
      return;
    }

    // ✅ Modo "ruta" (componente cargado desde el router)
    this.route.params.subscribe(params => {
      this.entityName.set(params['entity']);

      this.loadSelectOptionsIfNeeded();

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
  // CARGA DE INSTITUCIONES (solo si la entidad tiene institutionId)
  // ============================================================
  // loadInstitutionsIfNeeded(): void {
  //   const config = this.config();
  //   if (!config) return;

  //   // Solo cargar si hay un campo institutionId
  //   const hasInstitutionField = config.fields.some(f => f.key === 'institutionId');
  //   if (!hasInstitutionField) return;

  //   const url = `${environment.apiGateway}${environment.apiV1}/universilab/institutions/active/ordered`;

  //   this.http.get<any[]>(url).subscribe({
  //     next: (institutions) => {
  //       this.availableInstitutions.set(institutions);
  //     },
  //     error: (err) => {
  //       console.error('Error cargando instituciones activas:', err);
  //     }
  //   });
  // }



  // ============================================================
  // CARGA DE OPCIONES DINÁMICAS (institutions, courses, etc.)
  // ============================================================
  loadSelectOptionsIfNeeded(): void {
    const config = this.config();
    if (!config) return;

    // Detectar todos los campos con optionsSource
    const fieldsWithSource = config.fields.filter(
      f => (f.type === 'select' || f.type === 'multiselect') && f.optionsSource
    );

    if (fieldsWithSource.length === 0) return;

    fieldsWithSource.forEach(field => {
      this.loadOptionsForSource(field.optionsSource!, field.key);
    });
  }
  

  // private loadOptionsForSource(source: string, fieldKey: string): void {
  //   const baseUrl = `${environment.apiGateway}${environment.apiV1}/universilab`;

  //   switch (source) {
  //     case 'institutions': {
  //       const url = `${baseUrl}/institutions/active/ordered`;
  //       this.http.get<any[]>(url).subscribe({
  //         next: (data) => {
  //           this.availableInstitutions.set(data);
  //           this.selectOptions.update(current => ({
  //             ...current,
  //             [fieldKey]: data.map(i => ({ label: i.name, value: i.id }))
  //           }));
  //         },
  //         error: (err) => console.error('Error cargando instituciones:', err)
  //       });
  //       break;
  //     }

  //     case 'courses': {
  //       const url = `${baseUrl}/courses/active`;
  //       this.http.get<any[]>(url).subscribe({
  //         next: (data) => {
  //           this.availableCourses.set(data);
  //           this.selectOptions.update(current => ({
  //             ...current,
  //             [fieldKey]: data.map(c => ({ label: c.title, value: c.id }))
  //           }));
  //         },
  //         error: (err) => console.error('Error cargando cursos:', err)
  //       });
  //       break;
  //     }

  //     case 'collections': {
  //       const url = `${baseUrl}/collections`;
  //       this.http.get<any[]>(url).subscribe({
  //         next: (data) => {
  //           this.selectOptions.update(current => ({
  //             ...current,
  //             [fieldKey]: data.map(c => ({ label: c.title, value: c.id }))
  //           }));
  //         },
  //         error: (err) => console.error('Error cargando colecciones:', err)
  //       });
  //       break;
  //     }

  //     case 'topics': {
  //       const url = `${baseUrl}/topics`;
  //       this.http.get<any[]>(url).subscribe({
  //         next: (data) => {
  //           this.selectOptions.update(current => ({
  //             ...current,
  //             [fieldKey]: data.map(t => ({ label: t.title, value: t.id }))
  //           }));
  //         },
  //         error: (err) => console.error('Error cargando temas:', err)
  //       });
  //       break;
  //     }

  //     case 'subtopics': {                                      // ✅ NUEVO
  //       const url = `${baseUrl}/subtopics`;
  //       this.http.get<any[]>(url).subscribe({
  //         next: (data) => {
  //           this.selectOptions.update(current => ({
  //             ...current,
  //             [fieldKey]: data.map(s => ({ label: s.title, value: s.id }))
  //           }));
  //         },
  //         error: (err) => console.error('Error cargando subtemas:', err)
  //       });
  //       break;
  //     }

  //     default:
  //       console.warn(`optionsSource desconocido: ${source}`);
  //   }
  // }



  private loadOptionsForSource(source: string, fieldKey: string): void {
    const baseUrl = `${environment.apiGateway}${environment.apiV1}/universilab`;

    switch (source) {
      case 'institutions': {
        const url = `${baseUrl}/institutions/active/ordered`;
        this.http.get<any[]>(url).subscribe({
          next: (data) => {
            this.availableInstitutions.set(data);
            this.selectOptions.update(current => ({
              ...current,
              [fieldKey]: data.map(i => ({ label: i.name, value: i.id }))
            }));
          },
          error: (err) => console.error('Error cargando instituciones:', err)
        });
        break;
      }

      case 'courses': {
        const url = `${baseUrl}/courses/active`;
        this.http.get<any[]>(url).subscribe({
          next: (data) => {
            this.availableCourses.set(data);
            this.selectOptions.update(current => ({
              ...current,
              [fieldKey]: data.map(c => ({ label: c.title, value: c.id }))
            }));
          },
          error: (err) => console.error('Error cargando cursos:', err)
        });
        break;
      }

      case 'collections': {
        const url = `${baseUrl}/collections`;
        this.http.get<any[]>(url).subscribe({
          next: (data) => {
            this.selectOptions.update(current => ({
              ...current,
              [fieldKey]: data.map(c => ({ label: c.title, value: c.id }))
            }));
          },
          error: (err) => console.error('Error cargando colecciones:', err)
        });
        break;
      }

      case 'topics': {
        const url = `${baseUrl}/topics`;
        this.http.get<any[]>(url).subscribe({
          next: (data) => {
            this.selectOptions.update(current => ({
              ...current,
              [fieldKey]: data.map(t => ({ label: t.title, value: t.id }))
            }));
          },
          error: (err) => console.error('Error cargando temas:', err)
        });
        break;
      }

      case 'subtopics': {
        const url = `${baseUrl}/subtopics`;
        this.http.get<any[]>(url).subscribe({
          next: (data) => {
            this.selectOptions.update(current => ({
              ...current,
              [fieldKey]: data.map(s => ({ label: s.title, value: s.id }))
            }));
          },
          error: (err) => console.error('Error cargando subtemas:', err)
        });
        break;
      }

      case 'pages': {                                          // ✅ NUEVO
        const url = `${baseUrl}/pages`;
        this.http.get<any[]>(url).subscribe({
          next: (data) => {
            this.selectOptions.update(current => ({
              ...current,
              [fieldKey]: data.map(p => ({ label: p.title, value: p.id }))
            }));
          },
          error: (err) => console.error('Error cargando páginas:', err)
        });
        break;
      }

      default:
        console.warn(`optionsSource desconocido: ${source}`);
    }
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

  //     // ✅ Roles: obligatorio y no vacío (UserEntity)
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

  //     // ✅ name de RoleEntity (solo en creación)
  //     if (field.key === 'name' && !editing && this.entityName() === 'RoleEntity') {
  //       validators.push(Validators.minLength(2));
  //       validators.push(Validators.maxLength(50));
  //       validators.push(Validators.pattern(/^[A-Z][A-Z_]*$/));
  //     }

  //     // ✅ permissions de RoleEntity
  //     if (field.key === 'permissions' && this.entityName() === 'RoleEntity') {
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

  //     // ✅ Validaciones para InstitutionEntity
  //     if (this.entityName() === 'InstitutionEntity') {

  //       if (field.key === 'name') {
  //         validators.push(Validators.minLength(2));
  //         validators.push(Validators.maxLength(200));
  //       }

  //       if (field.key === 'phone') {
  //         validators.push((control: AbstractControl) => {
  //           const value = control.value;
  //           if (!value) return null;
  //           const clean = value.replace(/[\s.-]/g, '');
  //           const phonePattern = /^(\+?34)?[6-9]\d{8}$/;
  //           return phonePattern.test(clean) ? null : { invalidPhone: true };
  //         });
  //       }

  //       if (field.key === 'website') {
  //         validators.push((control: AbstractControl) => {
  //           const value = control.value;
  //           if (!value) return null;
  //           const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
  //           return urlPattern.test(value) ? null : { invalidUrl: true };
  //         });
  //       }

  //       if (field.key === 'address') {
  //         validators.push(Validators.maxLength(300));
  //       }
  //     }

  //     if (field.minLength) validators.push(Validators.minLength(field.minLength));
  //     if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));

  //     let initialValue = field.defaultValue !== undefined 
  //       ? field.defaultValue 
  //       : this.getDefaultValue(field.type);

  //     if (editing && currentData[field.key] !== undefined && currentData[field.key] !== null) {
  //       initialValue = currentData[field.key];
  //     }

  //     // ✅ AÑADIDO: incluir readonlyOnEdit
  //     const isDisabled = editing && (field.readonly || field.readonlyOnEdit || field.key === 'password');

  //     group[field.key] = new FormControl(
  //       { value: initialValue, disabled: isDisabled },
  //       validators
  //     );
  //   });

  //   this.form = this.fb.group(group);
  // }

  //
  private getDefaultValue(type: string): any {
    switch (type) {
      case 'boolean': return false;
      case 'number': return null;
      case 'date': return null;
      case 'multiselect': return [];
      default: return '';
    }
  }


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

      // ✅ name de RoleEntity (solo en creación)
      if (field.key === 'name' && !editing && this.entityName() === 'RoleEntity') {
        validators.push(Validators.minLength(2));
        validators.push(Validators.maxLength(50));
        validators.push(Validators.pattern(/^[A-Z][A-Z_]*$/));
      }

      // ✅ permissions de RoleEntity
      if (field.key === 'permissions' && this.entityName() === 'RoleEntity') {
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

      // ✅ Validaciones para InstitutionEntity
      if (this.entityName() === 'InstitutionEntity') {

        if (field.key === 'name') {
          validators.push(Validators.minLength(2));
          validators.push(Validators.maxLength(200));
        }

        if (field.key === 'phone') {
          validators.push((control: AbstractControl) => {
            const value = control.value;
            if (!value) return null;
            const clean = value.replace(/[\s.-]/g, '');
            const phonePattern = /^(\+?34)?[6-9]\d{8}$/;
            return phonePattern.test(clean) ? null : { invalidPhone: true };
          });
        }

        if (field.key === 'website') {
          validators.push((control: AbstractControl) => {
            const value = control.value;
            if (!value) return null;
            const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
            return urlPattern.test(value) ? null : { invalidUrl: true };
          });
        }

        if (field.key === 'address') {
          validators.push(Validators.maxLength(300));
        }
      }

      // ✅ NUEVO: Validaciones para ResourceEntity
      if (this.entityName() === 'ResourceEntity') {
        if (field.key === 'url') {
          validators.push((control: AbstractControl) => {
            const value = control.value;
            if (!value) return null;
            const valid = /^(https?:\/\/|www\.|\/).+/.test(value);
            return valid ? null : { invalidUrl: true };
          });
        }
      }

      if (field.minLength) validators.push(Validators.minLength(field.minLength));
      if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));

      let initialValue = field.defaultValue !== undefined 
        ? field.defaultValue 
        : this.getDefaultValue(field.type);

      if (editing && currentData[field.key] !== undefined && currentData[field.key] !== null) {
        initialValue = currentData[field.key];
      }

      // ✅ AÑADIDO: incluir readonlyOnEdit
      const isDisabled = editing && (field.readonly || field.readonlyOnEdit || field.key === 'password');

      group[field.key] = new FormControl(
        { value: initialValue, disabled: isDisabled },
        validators
      );
    });

    this.form = this.fb.group(group);
  }




  // ============================================================
  // ENVÍO DEL FORMULARIO
  // ============================================================
  // onSubmit(): void {
  //   if (this.form.invalid) {
  //     console.warn('Formulario inválido, no se envía');
  //     return;
  //   }

  //   const formValue = this.form.getRawValue();
  //   const isEditing = this.isEditing();
  //   const config = this.config();

  //   // ✅ Al crear, eliminar del payload los campos que no se muestran en creación
  //   if (!isEditing && config) {
  //     config.fields.forEach(field => {
  //       if (field.showOnCreate === false && field.key !== 'id') {
  //         delete formValue[field.key];
  //       }
  //     });
  //   }

  //   const isUserEntity = this.entityName() === 'users' || this.entityName() === 'UserEntity';

  //   if (isEditing && !formValue.password) {
  //     delete formValue.password;
  //   }

  //   if (isUserEntity && formValue.roles) {
  //     formValue.roleIds = formValue.roles.map((roleName: string) => {
  //       const foundRole = this.availableRoles.find(r => r.name === roleName);
  //       return foundRole ? foundRole.id : null;
  //     }).filter((id: number | null) => id !== null);

  //     delete formValue.roles;
  //   }

  //   this.saveRequested.emit(formValue);
  // }


  // ============================================================
  // ENVÍO DEL FORMULARIO
  // ============================================================
  onSubmit(): void {
    if (this.form.invalid) {
      console.warn('⚠️ Formulario inválido, no se envía');
      return;
    }

    const formValue = this.form.getRawValue();
    const isEditing = this.isEditing();
    const config = this.config();

    // ✅ Limpieza de campos según visibilidad y auditoría
    if (config) {
      config.fields.forEach(field => {
        // Al crear: eliminar campos no visibles en create
        if (!isEditing && field.showOnCreate === false && field.key !== 'id') {
          delete formValue[field.key];
        }

        // Al editar: eliminar campos no visibles en edit
        if (isEditing && field.showOnEdit === false && field.key !== 'id') {
          delete formValue[field.key];
        }

        // Eliminar siempre los campos de auditoría (readonly)
        if (field.key === 'createdAt' || field.key === 'updatedAt') {
          delete formValue[field.key];
        }
      });
    }

    // ✅ LOG TEMPORAL para verificar el payload
    console.log('📤 Payload a enviar:', JSON.stringify(formValue, null, 2));

    const isUserEntity = this.entityName() === 'users' || this.entityName() === 'UserEntity';

    // ✅ Al editar, si password está vacío, no enviarlo
    if (isEditing && !formValue.password) {
      delete formValue.password;
    }

    // ✅ UserEntity: convertir roles (nombres) a roleIds (números)
    if (isUserEntity && formValue.roles) {
      formValue.roleIds = formValue.roles
        .map((roleName: string) => {
          const foundRole = this.availableRoles.find(r => r.name === roleName);
          return foundRole ? foundRole.id : null;
        })
        .filter((id: number | null) => id !== null);

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

  isFieldReadonly(field: EntityField): boolean {
    return !!(field.readonly || (field.readonlyOnEdit && this.isEditing()));
  }
}