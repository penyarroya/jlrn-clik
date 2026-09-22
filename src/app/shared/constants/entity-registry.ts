// // src/app/features/admin/dynamic-entity-manager/constants/entity-registry.ts

import { environment } from "../../../environments/environment";
import { EntityConfig } from "../../features/pages/admin/models/entity-config";



// import { EntityConfig } from '../models/entity-config';
// import { environment } from '../../../../../environments/environment';

// const API = `${environment.apiGateway}${environment.apiV1}`;

// export const ENTITY_REGISTRY: Record<string, EntityConfig> = {
//   // ============================================================
//   // USUARIOS
//   // ============================================================
//   UserEntity: {
//     entityName: 'UserEntity',
//     apiPath: `${API}/users`,
//     displayName: 'Usuarios',
//     displayField: 'username',
//     icon: '👤',
//     module: 'users',
//     roles: ['SUPER_ADMIN', 'ADMIN'],
//     fields: [
//       { key: 'id', label: 'ID', type: 'number', hidden: true },
//       { key: 'username', label: 'Usuario', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'email', label: 'Email', type: 'email', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'password', label: 'Contraseña', type: 'password', required: true, showOnCreate: true, showOnEdit: false, showInTable: false },
//       { key: 'firstName', label: 'Nombre', type: 'text', required: true, showOnCreate: true, showOnEdit: true, showInTable: true },
//       { key: 'lastName', label: 'Apellidos', type: 'text', required: true, showOnCreate: true, showOnEdit: true, showInTable: true },
//       { key: 'activo', label: 'Activo', type: 'boolean', showOnCreate: false, showOnEdit: true, showInTable: true },
//       { key: 'emailVerified', label: 'Email Verificado', type: 'boolean', readonly: true, showInTable: false },
//       { key: 'roles', label: 'Roles', type: 'text', readonly: true, showInTable: false },
//       { key: 'fechaAlta', label: 'Fecha Alta', type: 'date', readonly: true, showInTable: false },
//       { key: 'fechaActualizacion', label: 'Últ. Actualización', type: 'date', readonly: true, showInTable: false },
//     ],
//     tableSettings: {
//       pageSizeOptions: [5, 10, 25, 50, 100],
//       defaultPageSize: 10,
//       showSearch: true,
//       showActions: true
//     },
//     formSettings: {
//       columns: 2,
//       layout: 'grid'
//     }
//   },

//   // ============================================================
//   // ROLES
//   // ============================================================
//   RoleEntity: {
//     entityName: 'RoleEntity',
//     apiPath: `${API}/roles`,
//     displayName: 'Roles',
//     displayField: 'name',
//     icon: '🛡️',
//     module: 'users',
//     roles: ['SUPER_ADMIN'],
//     fields: [
//       { key: 'id', label: 'ID', type: 'number', hidden: true },
//       { key: 'name', label: 'Nombre', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'description', label: 'Descripción', type: 'textarea', showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'isActive', label: 'Activo', type: 'boolean', showOnCreate: false, showOnEdit: true, showInTable: true },
//       { key: 'createdAt', label: 'Creado', type: 'date', readonly: true, showInTable: false },
//     ],
//     tableSettings: {
//       pageSizeOptions: [5, 10, 25],
//       defaultPageSize: 5,
//       showSearch: true,
//       showActions: true
//     },
//     formSettings: {
//       columns: 1,
//       layout: 'stacked'
//     }
//   },

//   // ============================================================
//   // PERMISOS
//   // ============================================================
//   PermissionEntity: {
//     entityName: 'PermissionEntity',
//     apiPath: `${API}/permissions`,
//     displayName: 'Permisos',
//     displayField: 'name',
//     icon: '🔐',
//     module: 'users',
//     roles: ['SUPER_ADMIN'],
//     fields: [
//       { key: 'id', label: 'ID', type: 'number', hidden: true },
//       { key: 'name', label: 'Nombre', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'resource', label: 'Recurso', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'action', label: 'Acción', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'description', label: 'Descripción', type: 'textarea', showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'createdAt', label: 'Creado', type: 'date', readonly: true, showInTable: false },
//     ],
//     tableSettings: {
//       pageSizeOptions: [5, 10, 25],
//       defaultPageSize: 5,
//       showSearch: true,
//       showActions: true
//     },
//     formSettings: {
//       columns: 2,
//       layout: 'grid'
//     }
//   },

//   // ============================================================
//   // PERFILES DE USUARIO
//   // ============================================================
//   UserProfile: {
//     entityName: 'UserProfile',
//     apiPath: `${API}/profiles`,
//     displayName: 'Perfiles',
//     displayField: 'fullName',
//     icon: '📋',
//     module: 'users',
//     roles: ['SUPER_ADMIN', 'ADMIN'],
//     fields: [
//       { key: 'id', label: 'ID', type: 'number', hidden: true },
//       { key: 'userId', label: 'ID Usuario', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'firstName', label: 'Nombre', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'lastName', label: 'Apellidos', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'phone', label: 'Teléfono', type: 'text', showInTable: true, showOnCreate: true, showOnEdit: true },
//       { key: 'bio', label: 'Biografía', type: 'textarea', showInTable: false, showOnCreate: true, showOnEdit: true },
//       { key: 'avatar', label: 'Avatar', type: 'text', showInTable: false, showOnCreate: true, showOnEdit: true },
//       { key: 'birthDate', label: 'Fecha Nacimiento', type: 'date', showInTable: false, showOnCreate: true, showOnEdit: true },
//       { key: 'createdAt', label: 'Creado', type: 'date', readonly: true, showInTable: false },
//     ],
//     tableSettings: {
//       pageSizeOptions: [5, 10, 25, 50],
//       defaultPageSize: 10,
//       showSearch: true,
//       showActions: true
//     },
//     formSettings: {
//       columns: 2,
//       layout: 'grid'
//     }
//   },

//   // ... y así sucesivamente para las 23 entidades
// };

// // ============================================================
// // HELPERS
// // ============================================================

// export function getEntityConfig(entityName: string): EntityConfig | undefined {
//   return ENTITY_REGISTRY[entityName];
// }

// export function getEntityList(roles?: string[]): { label: string; value: string; icon: string }[] {
//   return Object.values(ENTITY_REGISTRY)
//     .filter(config => {
//       if (!roles || roles.length === 0) return true;
//       if (!config.roles || config.roles.length === 0) return true;
//       return config.roles.some(role => roles.includes(role));
//     })
//     .map(config => ({
//       label: config.displayName,
//       value: config.entityName,
//       icon: config.icon || '📄'
//     }));
// }

// export function getEntityListGrouped(roles?: string[]): { [key: string]: any[] } {
//   const groups: { [key: string]: any[] } = {};
  
//   Object.values(ENTITY_REGISTRY)
//     .filter(config => {
//       if (!roles || roles.length === 0) return true;
//       if (!config.roles || config.roles.length === 0) return true;
//       return config.roles.some(role => roles.includes(role));
//     })
//     .forEach(config => {
//       const moduleKey = config.module || 'otros';
//       if (!groups[moduleKey]) {
//         groups[moduleKey] = [];
//       }
//       groups[moduleKey].push({
//         label: config.displayName,
//         value: config.entityName,
//         icon: config.icon || '📄'
//       });
//     });
  
//   return groups;
// }








// src/app/features/admin/dynamic-entity-manager/constants/entity-registry.ts



const API = `${environment.apiGateway}${environment.apiV1}`;

export const ENTITY_REGISTRY: Record<string, EntityConfig> = {
  // ============================================================
  // MÓDULO USUARIOS (7 entidades)
  // ============================================================
  
  UserEntity: {
    entityName: 'UserEntity',
    apiPath: `${API}/users`,
    // apiListPath: `${API}/users/all`,                       // descomenta si tu backend lo requiere
    // apiDetailPath: (id: number) => `${API}/users/${id}`,   // descomenta si aplica
    displayName: 'Usuarios',
    displayField: 'username',
    icon: '👤',
    module: 'users',
    roles: ['SUPER_ADMIN'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'username', label: 'Usuario', type: 'text', required: true, 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true,
        readonlyOnEdit: true
      },
      { key: 'email', label: 'Email', type: 'email', required: true, 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { key: 'password', label: 'Contraseña', type: 'password', required: true, 
        showOnCreate: true, 
        showOnEdit: false, 
        showInTable: false 
      },
      { key: 'roles', label: 'Roles', type: 'multiselect', 
        options: [
          { label: 'Super Admin', value: 'SUPER_ADMIN' },
          { label: 'Admin', value: 'ADMIN' },
          { label: 'Moderator', value: 'MODERATOR' },
          { label: 'Manager', value: 'MANAGER' },
          { label: 'User', value: 'USER' }
        ],
        showOnCreate: true, 
        showOnEdit: true, 
        showInTable: true 
      },
      { key: 'firstName', label: 'Nombre', type: 'text', required: true, 
        showOnCreate: true, 
        showOnEdit: false, 
        showInTable: false
      },
      { key: 'lastName', label: 'Apellidos', type: 'text', required: true, 
        showOnCreate: true, 
        showOnEdit: false, 
        showInTable: false
      },
      { key: 'activo', label: 'Activo', type: 'boolean', 
        showOnCreate: false, 
        showOnEdit: true, 
        showInTable: true 
      },
      { key: 'emailVerified', label: 'Email Verificado', type: 'boolean', readonly: true, 
        showOnCreate: false,
        showOnEdit: false, 
        showInTable: false  
      },
      { key: 'fechaAlta', label: 'Fecha Alta', type: 'date', readonly: true, 
        showInTable: true,
        showOnCreate: false, 
        showOnEdit: false
      },
      { key: 'fechaActualizacion', label: 'Últ. Actualización', type: 'date', readonly: true, 
        showInTable: false,
         showOnCreate: false, 
        showOnEdit: false
      },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50, 100], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },
  
  RoleEntity: {
    entityName: 'RoleEntity',
    apiPath: `${API}/roles`,
    displayName: 'Roles',
    displayField: 'name',
    icon: '🛡️',
    module: 'users',
    roles: ['SUPER_ADMIN'],

    // ✅ NUEVAS PROPS
    canCreate: false,   // ❌ No se pueden crear roles
    canEdit: true,      // ✅ Se pueden editar (solo permisos)
    canDelete: false,   // ❌ No se pueden eliminar roles

    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { 
        key: 'name', 
        label: 'Nombre', 
        type: 'text', 
        required: true, 
        showInTable: true, 
        showOnCreate: false,
        showOnEdit: false
      },
      { 
        key: 'permissions', 
        label: 'Permisos', 
        type: 'multiselect',
        showInTable: false,
        showOnCreate: false,
        showOnEdit: true
      },
      { 
        key: 'userCount', 
        label: 'Usuarios', 
        type: 'number', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false
      },
      { 
        key: 'systemRole', 
        label: 'Sistema', 
        type: 'boolean', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false
      },
    ],
    tableSettings: { 
      pageSizeOptions: [5, 10, 25], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },
    formSettings: { 
      columns: 1, 
      layout: 'stacked' 
    }
  },

  PermissionEntity: {
  entityName: 'PermissionEntity',
  apiPath: `${API}/permissions`,
  displayName: 'Permisos',
  displayField: 'name',
  icon: '🔐',
  module: 'users',
  roles: ['SUPER_ADMIN'],

  // ✅ SOLO LECTURA
  canCreate: false,
  canEdit: false,
  canDelete: false,

  fields: [
    { 
      key: 'id', 
      label: 'ID', 
      type: 'number', 
      hidden: true 
    },
    { 
      key: 'name', 
      label: 'Nombre', 
      type: 'text', 
      showInTable: true 
    },
    { 
      key: 'category', 
      label: 'Categoría', 
      type: 'text', 
      showInTable: true 
    },
    { 
      key: 'action', 
      label: 'Acción', 
      type: 'text', 
      showInTable: true 
    },
    { 
      key: 'roleCount', 
      label: 'Roles', 
      type: 'number', 
      showInTable: true 
    },
    { 
      key: 'corePermission', 
      label: 'Core', 
      type: 'boolean', 
      showInTable: true 
    },
    ],

    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },

    formSettings: { 
      columns: 1, 
      layout: 'stacked' 
    }
  },

  UserProfile: {
    entityName: 'UserProfile',
    apiPath: `${API}/profiles`,
    apiListPath: `${API}/profiles/entity-manager`,
    apiDetailPath: (userId: number) => `${API}/profiles/${userId}`,
    displayName: 'Perfiles de Usuario',
    displayField: 'firstName',
    icon: '📋',
    module: 'users',
    roles: ['SUPER_ADMIN', 'ADMIN'],

    canCreate: false,
    canEdit: true,
    canDelete: false,

    fields: [
      { 
        key: 'userId', 
        label: 'ID Usuario', 
        type: 'number', 
        required: true, 
        isPrimaryKey: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true, 
        readonlyOnEdit: true 
      },
      { 
        key: 'username', 
        label: 'Usuario', 
        type: 'text', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'userEmail', 
        label: 'Email', 
        type: 'email', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'firstName', 
        label: 'Nombre', 
        type: 'text', 
        required: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'lastName', 
        label: 'Apellidos', 
        type: 'text', 
        required: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'phone', 
        label: 'Teléfono', 
        type: 'text', 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },

      // ✅ NUEVO: Avatar con emoji
      { 
        key: 'avatarEmoji', 
        label: 'Avatar', 
        type: 'select',
        options: [
          // 😀 Personas
          { label: '👤 Persona',    value: '👤' },
          { label: '👨 Hombre',     value: '👨' },
          { label: '👩 Mujer',      value: '👩' },
          { label: '🧑 Neutro',     value: '🧑' },
          { label: '🧙 Mago',       value: '🧙' },
          { label: '🧛 Vampiro',    value: '🧛' },
          { label: '🧜 Sirena',     value: '🧜' },
          { label: '🦸 Superhéroe', value: '🦸' },

          // 🐾 Animales
          { label: '🐺 Lobo',       value: '🐺' },
          { label: '🦊 Zorro',      value: '🦊' },
          { label: '🦁 León',       value: '🦁' },
          { label: '🐯 Tigre',      value: '🐯' },
          { label: '🐼 Panda',      value: '🐼' },
          { label: '🐨 Koala',      value: '🐨' },
          { label: '🐸 Rana',       value: '🐸' },
          { label: '🦉 Búho',       value: '🦉' },
          { label: '🦅 Águila',     value: '🦅' },
          { label: '🐢 Tortuga',    value: '🐢' },
          { label: '🐙 Pulpo',      value: '🐙' },
          { label: '🦄 Unicornio',  value: '🦄' },
          { label: '🐲 Dragón',     value: '🐲' },
          { label: '🐦 Colibrí',    value: '🐦' },
          { label: '🦋 Mariposa',   value: '🦋' },

          // 🌟 Cosas
          { label: '⭐ Estrella',    value: '⭐' },
          { label: '🌙 Luna',       value: '🌙' },
          { label: '☀️ Sol',        value: '☀️' },
          { label: '🔥 Fuego',      value: '🔥' },
          { label: '⚡ Rayo',        value: '⚡' },
          { label: '💎 Diamante',   value: '💎' },
          { label: '🎯 Diana',      value: '🎯' },
          { label: '🚀 Cohete',     value: '🚀' },
          { label: '🎨 Paleta',     value: '🎨' },
          { label: '📚 Libros',     value: '📚' },
          { label: '💻 Código',     value: '💻' },
          { label: '☕ Café',        value: '☕' },
          { label: '🎮 Gaming',     value: '🎮' },

          // 🌈 Símbolos
          { label: '❤️ Corazón',    value: '❤️' },
          { label: '💙 Azul',       value: '💙' },
          { label: '💚 Verde',      value: '💚' },
          { label: '💜 Morado',     value: '💜' },
          { label: '🌈 Arcoíris',   value: '🌈' },
          { label: '✨ Destellos',  value: '✨' },
        ],
        showInTable: false, 
        showOnCreate: false, 
        showOnEdit: true 
      },

      // ⚠️ LEGACY: avatar por imagen (por si algún usuario lo tiene guardado)
      { 
        key: 'avatarUrl', 
        label: 'Avatar (imagen, legacy)', 
        type: 'select',
        options: [
          { label: '🐦 Colibrí',   value: '/assets/img/perfiles/Colibri.jpg' },
          { label: '🦅 Águila',    value: '/assets/img/perfiles/Aguila.jpg' },
          { label: '🐺 Lobo',      value: '/assets/img/perfiles/Lobo.jpg' },
          { label: '🦁 León',      value: '/assets/img/perfiles/Leon.jpg' },
          { label: '🐯 Tigre',     value: '/assets/img/perfiles/Tigre.jpg' },
          { label: '🦋 Mariposa',  value: '/assets/img/perfiles/Mariposa.jpg' },
        ],
        showInTable: false, 
        showOnCreate: false, 
        showOnEdit: true 
      },

      { 
        key: 'enabled', 
        label: 'Activo', 
        type: 'boolean', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
    ],

    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },

    formSettings: { 
      columns: 2, 
      layout: 'grid' 
    }
  },

  UserPreference: {
    entityName: 'UserPreference',
    apiPath: `${API}/users/preferences`,
    apiListPath: `${API}/users/preferences/all`,
    apiDetailPath: (userId: number) => `${API}/users/preferences/${userId}`,
    displayName: 'Preferencias',
    displayField: 'userId',
    icon: '⚙️',
    module: 'users',
    roles: ['SUPER_ADMIN', 'ADMIN'],

    // ✅ Preferencias auto-creadas, no eliminables
    canCreate: false,
    canEdit: true,
    canDelete: false,

    fields: [
      { 
        key: 'userId', 
        label: 'ID Usuario', 
        type: 'number', 
        required: true, 
        isPrimaryKey: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true, 
        readonlyOnEdit: true 
      },
      { 
        key: 'theme', 
        label: 'Tema', 
        type: 'select', 
        options: [
          { label: '☀️ Claro',    value: 'LIGHT' },
          { label: '🌙 Oscuro',   value: 'DARK' }
        ], 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'lastPage', 
        label: 'Última Página', 
        type: 'text', 
        maxLength: 255,
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'selectedInstitutionId', 
        label: 'Institución', 
        type: 'number', 
        min: 0, 
        step: 1,                                        // ✅ NUEVO
        showInTable: false, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'defaultVoice', 
        label: 'Voz', 
        type: 'text', 
        maxLength: 20, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'defaultSpeed', 
        label: 'Velocidad', 
        type: 'number', 
        min: 0.1, 
        max: 2.0, 
        step: 0.1,                                      // ✅ NUEVO
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'defaultLanguage', 
        label: 'Idioma', 
        type: 'text', 
        maxLength: 5, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'defaultSilenceDuration', 
        label: 'Silencio (seg)', 
        type: 'number', 
        min: 0.0, 
        max: 2.0, 
        step: 0.1,                                      // ✅ NUEVO
        showInTable: false, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'totalStep', 
        label: 'Total Pasos', 
        type: 'number', 
        min: 1, 
        step: 1,                                        // ✅ NUEVO
        showInTable: false, 
        showOnCreate: false, 
        showOnEdit: true 
      },
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: false, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'updatedAt', 
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'version', 
        label: 'Versión', 
        type: 'number', 
        hidden: true 
      },
    ],

    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },

    formSettings: { 
      columns: 2, 
      layout: 'grid' 
    }
  },
  
  // ============================================================
  // MÓDULO UNIVERSILAB (16 entidades)
  // ============================================================
  InstitutionEntity: {
    entityName: 'InstitutionEntity',
    apiPath: `${API}/universilab/institutions`,
    displayName: 'Instituciones',
    displayField: 'name',
    icon: '🏛️',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { 
        key: 'name', 
        label: 'Nombre', 
        type: 'text', 
        required: true, 
        minLength: 2,
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'email', 
        label: 'Email', 
        type: 'email', 
        required: true, 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'phone', 
        label: 'Teléfono', 
        type: 'text', 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'address', 
        label: 'Dirección', 
        type: 'textarea', 
        maxLength: 300,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'website', 
        label: 'Web', 
        type: 'text', 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'isActive', 
        label: 'Activa', 
        type: 'boolean', 
        showOnCreate: false, 
        showOnEdit: true, 
        showInTable: true 
      },
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false,
        showOnEdit: false  
      },
      { 
        key: 'updatedAt', 
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: true,       // ← Mostrar en la tabla
        showOnCreate: false, 
        showOnEdit: false 
      },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  CourseEntity: {
    entityName: 'CourseEntity',
    apiPath: `${API}/universilab/courses`,
    displayName: 'Cursos',
    displayField: 'title',
    icon: '📚',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { 
        key: 'title', 
        label: 'Título', 
        type: 'text', 
        required: true, 
        minLength: 2,
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'description', 
        label: 'Descripción', 
        type: 'textarea', 
        maxLength: 2000,                       
        showInTable: false,                   
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'institutionId', 
        label: 'Institución', 
        type: 'select', 
        required: true, 
        readonlyOnEdit: true,                  
        optionsSource: 'institutions',  
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'level', 
        label: 'Nivel', 
        type: 'select', 
        required: true,                        
        options: [
          { label: 'Principiante', value: 'BEGINNER' },
          { label: 'Intermedio', value: 'INTERMEDIATE' },
          { label: 'Avanzado', value: 'ADVANCED' },
          { label: 'Experto', value: 'EXPERT' }
        ],
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'visibility', 
        label: 'Visibilidad', 
        type: 'select', 
        options: [
          { label: 'Público', value: 'PUBLIC' },
          { label: 'Privado', value: 'PRIVATE' },
          { label: 'Oculto', value: 'HIDDEN' }
        ],
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'estimatedHours', 
        label: 'Horas Estimadas', 
        type: 'number', 
        min: 0, 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'maxWeeks', 
        label: 'Semanas Máximas', 
        type: 'number', 
        min: 0, 
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'language', 
        label: 'Idioma', 
        type: 'text', 
        maxLength: 10,                         
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'enrollmentType', 
        label: 'Tipo de Inscripción', 
        type: 'text', 
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'isActive', 
        label: 'Activo', 
        type: 'boolean', 
        showOnCreate: false, 
        showOnEdit: true, 
        showInTable: true 
      },
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'updatedAt', 
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  CollectionEntity: {
    entityName: 'CollectionEntity',
    apiPath: `${API}/universilab/collections`,
    displayName: 'Colecciones',
    displayField: 'title',                    
    icon: '📁',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    fields: [
      { 
        key: 'id', 
        label: 'ID',
        type: 'number', 
        hidden: true 
      },
      { 
        key: 'title',                         
        label: 'Título', 
        type: 'text', 
        required: true, 
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'description', 
        label: 'Descripción', 
        type: 'textarea', 
        maxLength: 1000,
        showInTable: false,          
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'icon',                           
        label: 'Icono', 
        type: 'select',              // ← CAMBIO: era 'text'
        defaultValue: '📁',          // ← NUEVO
        options: [                   // ← NUEVO
          { label: '📁 Carpeta', value: '📁' },
          { label: '📚 Libros', value: '📚' },
          { label: '📖 Libro abierto', value: '📖' },
          { label: '📝 Notas', value: '📝' },
          { label: '🎓 Graduación', value: '🎓' },
          { label: '💡 Idea', value: '💡' },
          { label: '🔬 Ciencia', value: '🔬' },
          { label: '🧪 Laboratorio', value: '🧪' },
          { label: '💻 Código', value: '💻' },
          { label: '🎨 Arte', value: '🎨' },
          { label: '🎵 Música', value: '🎵' },
          { label: '🌍 Mundo', value: '🌍' },
          { label: '⭐ Favorito', value: '⭐' },
          { label: '🏆 Logro', value: '🏆' },
        ],
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'courseId', 
        label: 'Curso', 
        type: 'select',   
        required: true, 
        optionsSource: 'courses',
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'order', 
        label: 'Orden', 
        type: 'number', 
        required: true, 
        defaultValue: 0,
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'isRequired',                     
        label: 'Obligatoria', 
        type: 'boolean', 
        defaultValue: true,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'estimatedHours',                 
        label: 'Horas estimadas', 
        type: 'number',
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false,   
        showOnEdit: false 
      },
      { 
        key: 'updatedAt',                      
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false,   
        showOnEdit: false  
      },
    ],
    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },
    formSettings: { columns: 2, layout: 'grid' }
  },

  TopicEntity: {
    entityName: 'TopicEntity',
    apiPath: `${API}/universilab/topics`,
    displayName: 'Temas',
    displayField: 'title',
    icon: '📖',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    fields: [
      { 
        key: 'id', 
        label: 'ID', 
        type: 'number', 
        hidden: true 
      },
      { 
        key: 'title', 
        label: 'Título', 
        type: 'text', 
        required: true, 
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'description', 
        label: 'Descripción', 
        type: 'textarea', 
        maxLength: 1000,
        showInTable: false,          
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'collectionId', 
        label: 'Colección', 
        type: 'select',
        required: true, 
        optionsSource: 'collections',
        readonlyOnEdit: true,        
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'order', 
        label: 'Orden', 
        type: 'number', 
        required: true,               
        defaultValue: 0,              
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'estimatedMinutes',      
        label: 'Minutos estimados', 
        type: 'number', 
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'isPublished',           
        label: 'Publicado', 
        type: 'boolean', 
        defaultValue: true,
        showOnCreate: false, 
        showOnEdit: true, 
        showInTable: true 
      },
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false,          
        showOnEdit: false             
      },
      { 
        key: 'updatedAt',             
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false,
        showOnEdit: false
      },
    ],
    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },
    formSettings: { columns: 2, layout: 'grid' }
  },

  SubtopicEntity: {
    entityName: 'SubtopicEntity',
    apiPath: `${API}/universilab/subtopics`,
    displayName: 'Subtemas',
    displayField: 'title',
    icon: '📄',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    fields: [
      { 
        key: 'id', 
        label: 'ID', 
        type: 'number', 
        hidden: true 
      },
      { 
        key: 'title', 
        label: 'Título', 
        type: 'text', 
        required: true, 
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'summary',                   
        label: 'Resumen', 
        type: 'textarea', 
        maxLength: 500,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'content', 
        label: 'Contenido', 
        type: 'textarea', 
        maxLength: 10000,
        showInTable: false,                // ← oculto en tabla (es enorme)
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'topicId', 
        label: 'Tema', 
        type: 'select',                   
        required: true, 
        optionsSource: 'topics',           
        readonlyOnEdit: true,              // ← coherente con jerarquía
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'order', 
        label: 'Orden', 
        type: 'number', 
        required: true, 
        defaultValue: 0, 
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'estimatedMinutes',           
        label: 'Minutos estimados', 
        type: 'number', 
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'isPublished',                // ← CAMBIO (era 'isActive')
        label: 'Publicado', 
        type: 'boolean', 
        defaultValue: true,
        showOnCreate: false, 
        showOnEdit: true, 
        showInTable: true 
      },
      { 
        key: 'authorId',                  
        label: 'ID del autor', 
        type: 'number',
        min: 0,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'authorName',                 
        label: 'Nombre del autor', 
        type: 'text',
        maxLength: 100,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      // ✅ Accesibilidad
      { 
        key: 'hasAudioDescription',        
        label: 'Audiodescripción', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'hasSignLanguage',            
        label: 'Lengua de signos', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'hasTranscript',              
        label: 'Transcripción', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'hasAlternativeText',         
        label: 'Texto alternativo', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      // ✅ Solo lectura (métricas)
      { 
        key: 'views',                     
        label: 'Vistas', 
        type: 'number', 
        readonly: true,
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'likes',                      
        label: 'Me gusta', 
        type: 'number', 
        readonly: true,
        showInTable: true, 
        showOnCreate: false, 
        showOnEdit: false 
      },
      // ✅ Auditoría
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'updatedAt',                 
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false, 
        showOnEdit: false 
      },
    ],
    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },
    formSettings: { columns: 2, layout: 'grid' }
  },

  PageEntity: {
    entityName: 'PageEntity',
    apiPath: `${API}/universilab/pages`,
    displayName: 'Páginas',
    displayField: 'title',
    icon: '📝',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    fields: [
      { 
        key: 'id', 
        label: 'ID', 
        type: 'number', 
        hidden: true 
      },
      { 
        key: 'title', 
        label: 'Título', 
        type: 'text', 
        required: true, 
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'content', 
        label: 'Contenido', 
        type: 'textarea', 
        maxLength: 10000,
        showInTable: false,            // ← oculto en tabla (es enorme)
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'subtopicId', 
        label: 'Subtema', 
        type: 'select',                
        required: true, 
        optionsSource: 'subtopics',   
        readonlyOnEdit: true,          // ← coherente con jerarquía
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'type',                   // ← NUEVO (obligatorio)
        label: 'Tipo', 
        type: 'select', 
        required: true, 
        defaultValue: 'TEXT',
        options: [
          { label: 'Texto',        value: 'TEXT' },
          { label: 'Vídeo',        value: 'VIDEO' },
          { label: 'Cuestionario', value: 'QUIZ' },
          { label: 'Ejercicio',    value: 'EXERCISE' },
          { label: 'Interactivo',  value: 'INTERACTIVE' },
        ],
        readonlyOnEdit: true, 
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'order', 
        label: 'Orden', 
        type: 'number', 
        required: true, 
        defaultValue: 0, 
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'estimatedMinutes',       // ← NUEVO
        label: 'Minutos estimados', 
        type: 'number', 
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'isPublished', 
        label: 'Publicada', 
        type: 'boolean', 
        defaultValue: true,
        showOnCreate: false, 
        showOnEdit: true, 
        showInTable: true 
      },
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'updatedAt',              // ← NUEVO
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false, 
        showOnEdit: false 
      },
    ],
    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },
    formSettings: { columns: 2, layout: 'grid' }
  },

  ResourceEntity: {
    entityName: 'ResourceEntity',
    apiPath: `${API}/universilab/resources`,
    displayName: 'Recursos',
    displayField: 'title',
    icon: '📎',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { 
        key: 'id', 
        label: 'ID', 
        type: 'number', 
        hidden: true 
      },
      { 
        key: 'title', 
        label: 'Título', 
        type: 'text', 
        required: true, 
        maxLength: 200,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'type', 
        label: 'Tipo', 
        type: 'select', 
        required: true, 
        defaultValue: 'PDF',
        options: [
          { label: '🎥 Vídeo',       value: 'VIDEO' },
          { label: '📄 PDF',         value: 'PDF' },
          { label: '🎵 Audio',       value: 'AUDIO' },
          { label: '🖼️ Imagen',      value: 'IMAGE' },
          { label: '📃 Documento',   value: 'DOCUMENT' },
          { label: '🔗 Enlace',      value: 'LINK' },
          { label: '🎮 Interactivo', value: 'INTERACTIVE' },
        ],
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'url', 
        label: 'URL', 
        type: 'text', 
        required: true, 
        maxLength: 500,
        placeholder: 'https://... o /assets/...',
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'subtopicId', 
        label: 'Subtema', 
        type: 'select', 
        optionsSource: 'subtopics', 
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'pageId', 
        label: 'Página', 
        type: 'select', 
        optionsSource: 'pages', 
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'order', 
        label: 'Orden', 
        type: 'number', 
        required: true, 
        defaultValue: 0,
        min: 0,
        showInTable: true, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      // ✅ Accesibilidad
      { 
        key: 'hasTranscript', 
        label: 'Transcripción', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'hasCaption', 
        label: 'Subtítulos', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      { 
        key: 'hasAudioDescription', 
        label: 'Audiodescripción', 
        type: 'boolean', 
        defaultValue: false,
        showInTable: false, 
        showOnCreate: true, 
        showOnEdit: true 
      },
      // ✅ Auditoría
      { 
        key: 'createdAt', 
        label: 'Creado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false, 
        showOnEdit: false 
      },
      { 
        key: 'updatedAt', 
        label: 'Actualizado', 
        type: 'date', 
        readonly: true, 
        showInTable: false,
        showOnCreate: false, 
        showOnEdit: false 
      },
    ],
    tableSettings: { 
      pageSizeOptions: [5, 10, 25, 50], 
      defaultPageSize: 10, 
      showSearch: true, 
      showActions: true 
    },
    formSettings: { columns: 2, layout: 'grid' }
  },

  CommentEntity: {
    entityName: 'CommentEntity',
    apiPath: `${API}/universilab/comments`,
    displayName: 'Comentarios',
    displayField: 'content',
    icon: '💬',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'content', label: 'Contenido', type: 'textarea', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'userId', label: 'Usuario', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'pageId', label: 'Página', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'parentId', label: 'Comentario Padre', type: 'number', showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'isApproved', label: 'Aprobado', type: 'boolean', showOnCreate: false, showOnEdit: true, showInTable: true },
      { key: 'createdAt', label: 'Creado', type: 'date', readonly: true, showInTable: false },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  ContributionEntity: {
    entityName: 'ContributionEntity',
    apiPath: `${API}/universilab/contributions`,
    displayName: 'Contribuciones',
    displayField: 'title',
    icon: '🤝',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'title', label: 'Título', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'description', label: 'Descripción', type: 'textarea', showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'userId', label: 'Usuario', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'pageId', label: 'Página', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'status', label: 'Estado', type: 'select', options: [
        { label: 'Pendiente', value: 'PENDING' },
        { label: 'Aprobado', value: 'APPROVED' },
        { label: 'Rechazado', value: 'REJECTED' }
      ], showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'createdAt', label: 'Creado', type: 'date', readonly: true, showInTable: false },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  EnrollmentEntity: {
    entityName: 'EnrollmentEntity',
    apiPath: `${API}/universilab/enrollments`,
    displayName: 'Inscripciones',
    displayField: 'id',
    icon: '📋',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'userId', label: 'Usuario', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'courseId', label: 'Curso', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'status', label: 'Estado', type: 'select', options: [
        { label: 'Activo', value: 'ACTIVE' },
        { label: 'Completado', value: 'COMPLETED' },
        { label: 'Cancelado', value: 'CANCELLED' }
      ], showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'progress', label: 'Progreso', type: 'number', min: 0, max: 100, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'enrolledAt', label: 'Inscrito', type: 'date', readonly: true, showInTable: false },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  BadgeEntity: {
    entityName: 'BadgeEntity',
    apiPath: `${API}/universilab/badges`,
    displayName: 'Insignias',
    displayField: 'name',
    icon: '🏅',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'name', label: 'Nombre', type: 'text', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'description', label: 'Descripción', type: 'textarea', showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'icon', label: 'Icono', type: 'text', showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'criteria', label: 'Criterios', type: 'json', showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'isActive', label: 'Activa', type: 'boolean', showOnCreate: false, showOnEdit: true, showInTable: true },
      { key: 'createdAt', label: 'Creado', type: 'date', readonly: true, showInTable: false },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  UserBadgeEntity: {
    entityName: 'UserBadgeEntity',
    apiPath: `${API}/universilab/user-badges`,
    displayName: 'Insignias Usuario',
    displayField: 'id',
    icon: '⭐',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'userId', label: 'Usuario', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'badgeId', label: 'Insignia', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'earnedAt', label: 'Obtenida', type: 'date', readonly: true, showInTable: false },
      { key: 'progress', label: 'Progreso', type: 'number', min: 0, max: 100, showInTable: true, showOnCreate: true, showOnEdit: true },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  },

  UserProgressEntity: {
    entityName: 'UserProgressEntity',
    apiPath: `${API}/universilab/user-progress`,
    displayName: 'Progreso Usuario',
    displayField: 'id',
    icon: '📊',
    module: 'universilab',
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    fields: [
      { key: 'id', label: 'ID', type: 'number', hidden: true },
      { key: 'userId', label: 'Usuario', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'pageId', label: 'Página', type: 'number', required: true, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'completed', label: 'Completado', type: 'boolean', showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'timeSpent', label: 'Tiempo (min)', type: 'number', min: 0, showInTable: true, showOnCreate: true, showOnEdit: true },
      { key: 'lastAccessed', label: 'Último Acceso', type: 'date', readonly: true, showInTable: false },
    ],
    tableSettings: { pageSizeOptions: [5, 10, 25, 50], defaultPageSize: 10, showSearch: true, showActions: true },
    formSettings: { columns: 2, layout: 'grid' }
  }
};

// ============================================================
// HELPERS
// ============================================================

export function getEntityConfig(entityName: string): EntityConfig | undefined {
  return ENTITY_REGISTRY[entityName];
}

export function getEntityList(roles?: string[]): { label: string; value: string; icon: string }[] {
  return Object.values(ENTITY_REGISTRY)
    .filter(config => {
      if (!roles || roles.length === 0) return true;
      if (!config.roles || config.roles.length === 0) return true;
      return config.roles.some(role => roles.includes(role));
    })
    .map(config => ({
      label: config.displayName,
      value: config.entityName,
      icon: config.icon || '📄'
    }));
}



export function getEntityListGrouped(roles?: string[]): Record<string, { label: string; value: string; icon: string }[]> {
  const groups: Record<string, { label: string; value: string; icon: string }[]> = {};

  Object.values(ENTITY_REGISTRY)
    .filter(config => {
      if (!roles || roles.length === 0) return true;
      if (!config.roles || config.roles.length === 0) return true;
      return config.roles.some((role: string) => roles.includes(role));
    })
    .forEach(config => {
      const moduleName = config.module || 'general';
      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push({
        label: config.displayName,
        value: config.entityName,
        icon: config.icon || '📄'
      });
    });

  return groups;
}