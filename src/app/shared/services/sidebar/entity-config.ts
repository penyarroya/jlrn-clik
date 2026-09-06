// // import { Service } from '@angular/core';

// // @Service()
// // export class EntityConfig {
// // }




// // src/app/features/admin/dynamic-entity-manager/services/entity-config.service.ts

// import { Service, inject } from '@angular/core';
// import { AuthService } from '../../../core/services/auth.service';
// import { EntityConfig } from '../../../features/models/entity-config/entity-config';

// // ============================================================
// // CONSTANTES - Debes ajustarlas según tu proyecto
// // ============================================================

// // ✅ Define la interfaz de tu registro de entidades
// interface EntityRegistry {
//   [key: string]: EntityConfig;
// }

// // ✅ Ajusta estas funciones según tu proyecto
// // Si tienes un archivo de constantes, impórtalo
// // import { getEntityConfig, ENTITY_REGISTRY, getEntityList, getEntityListGrouped } from '../../../shared/constants/entity-registry';

// // ============================================================
// // SERVICIO
// // ============================================================

// @Service()
// export class EntityConfigService {
//   private authService = inject(AuthService);

//   /**
//    * Obtener configuración de una entidad específica
//    */
//   getConfig(entityName: string): EntityConfig | null {
//     // ✅ Ajusta según tu implementación
//     // return getEntityConfig(entityName) || null;
//     return this.getConfigs().find(config => config.entityName === entityName) || null;
//   }

//   /**
//    * Obtener todas las configuraciones de entidades
//    */
//   getConfigs(): EntityConfig[] {
//     // ✅ Ajusta según tu implementación
//     // return Object.values(ENTITY_REGISTRY);
//     return this.getEntityRegistry();
//   }

//   /**
//    * Obtener configuraciones filtradas por roles del usuario
//    */
//   getFilteredConfigs(): EntityConfig[] {
//     const user = this.authService.currentUser();
//     const roles = user?.roles || [];
    
//     return this.getConfigs().filter((config: EntityConfig) => {
//       if (!config.roles || config.roles.length === 0) return true;
//       return config.roles.some((role: string) => roles.includes(role));
//     });
//   }

//   /**
//    * Obtener lista de entidades (simplificada)
//    */
//   getEntityList(): { label: string; value: string; icon?: string; module?: string }[] {
//     const user = this.authService.currentUser();
//     const roles = user?.roles || [];
    
//     return this.getFilteredConfigs().map(config => ({
//       label: config.displayName || config.entityName,
//       value: config.entityName,
//       icon: config.icon || '📄',
//       module: config.module || 'general'
//     }));
//   }

//   /**
//    * Obtener lista de entidades agrupadas por módulo
//    */
//   getEntityListGrouped(): { module: string; entities: { label: string; value: string; icon?: string }[] }[] {
//     const entities = this.getEntityList();
//     const grouped: { [key: string]: { label: string; value: string; icon?: string }[] } = {};
    
//     entities.forEach(entity => {
//       const module = entity.module || 'general';
//       if (!grouped[module]) {
//         grouped[module] = [];
//       }
//       grouped[module].push({
//         label: entity.label,
//         value: entity.value,
//         icon: entity.icon
//       });
//     });
    
//     return Object.keys(grouped).map(module => ({
//       module,
//       entities: grouped[module]
//     }));
//   }

//   /**
//    * Obtener campos de una entidad
//    */
//   getFields(entityName: string): EntityConfig['fields'] {
//     const config = this.getConfig(entityName);
//     return config?.fields || [];
//   }

//   /**
//    * Obtener campos visibles de una entidad
//    */
//   getVisibleFields(entityName: string): EntityConfig['fields'] {
//     const fields = this.getFields(entityName);
//     return fields.filter((f: any) => !f.hidden);
//   }

//   /**
//    * Obtener campos editables de una entidad
//    */
//   getEditableFields(entityName: string): EntityConfig['fields'] {
//     const fields = this.getFields(entityName);
//     return fields.filter((f: any) => !f.readonly && !f.hidden);
//   }

//   // ============================================================
//   // MÉTODOS PRIVADOS (AJUSTA SEGÚN TU PROYECTO)
//   // ============================================================

//   /**
//    * Registro de entidades (ejemplo)
//    * Reemplaza esto con tu implementación real
//    */
//   private getEntityRegistry(): EntityConfig[] {
//     // ✅ Aquí debes devolver tu lista de entidades
//     // Puedes importar desde un archivo de constantes
//     return [
//       // Ejemplo:
//       // {
//       //   entityName: 'users',
//       //   displayName: 'Usuarios',
//       //   icon: 'person-outline',
//       //   module: 'admin',
//       //   roles: ['admin'],
//       //   fields: [...]
//       // },
//       // {
//       //   entityName: 'products',
//       //   displayName: 'Productos',
//       //   icon: 'cube-outline',
//       //   module: 'catalog',
//       //   roles: ['admin', 'manager'],
//       //   fields: [...]
//       // }
//     ];
//   }
// }