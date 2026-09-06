// // import { Service } from '@angular/core';

// // @Service()
// // export class EntityCrud {
// // }




// // src/app/features/admin/dynamic-entity-manager/services/entity-crud.service.ts

// import { Service, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { EntityConfig } from '../../../features/admin/models/entity-config';

// @Service()
// export class EntityCrudService {
//   private http = inject(HttpClient);

//   // ============================================================
//   // MÉTODOS PRIVADOS PARA EXTRACCIÓN DE ID Y URLS
//   // ============================================================

//   /**
//    * Extrae la clave primaria de un objeto o ID
//    */
//   private extractId(config: EntityConfig, rowDataOrId: any): any {
//     console.log('🔍 [extractId] Config:', config.entityName, 'Recibido:', rowDataOrId);
    
//     // 🛡️ Protección contra valores nulos o indefinidos
//     if (rowDataOrId === undefined || rowDataOrId === null) {
//       console.error(`🚨 [extractId] Error: Se intentó extraer la clave primaria para '${config.entityName}', pero el valor recibido es undefined o null.`);
//       return '';
//     }

//     if (typeof rowDataOrId === 'object') {
//       const primaryField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
//       const extracted = rowDataOrId[primaryField];
//       console.log(`🔍 [extractId] Buscando clave primaria '${primaryField}':`, extracted);
//       return extracted;
//     }
    
//     return rowDataOrId;
//   }

//   /**
//    * Obtiene la URL de listado
//    */
//   private getListUrl(config: EntityConfig): string {
//     return config.apiListPath || config.apiPath || `/${config.entityName}`;
//   }

//   /**
//    * Obtiene la URL de detalle
//    */
//   private getDetailUrl(config: EntityConfig, id: any): string {
//     if (config.apiDetailPath) {
//       return config.apiDetailPath(id);
//     }
//     return `${config.apiPath || `/${config.entityName}`}/${id}`;
//   }

//   // ============================================================
//   // MÉTODOS CRUD PÚBLICOS
//   // ============================================================

//   /**
//    * Obtener todos los registros de una entidad
//    */
//   getAll<T = any>(config: EntityConfig): Observable<T[]> {
//     const endpoint = this.getListUrl(config);
//     console.log('📡 GET:', endpoint);
    
//     return this.http.get<any>(endpoint, { withCredentials: true }).pipe(
//       map((response: any) => {
//         console.log('📡 Respuesta cruda:', response);
        
//         // ✅ Manejo de diferentes formatos de respuesta
//         if (Array.isArray(response)) return response;
//         if (response && Array.isArray(response.content)) return response.content;
//         if (response && Array.isArray(response.data)) return response.data;
//         if (response && Array.isArray(response.items)) return response.items;
//         if (response && Array.isArray(response.results)) return response.results;
//         if (response && typeof response === 'object' && Object.keys(response).length > 0) {
//           // Si es un objeto individual, devolverlo como array
//           return [response];
//         }
        
//         return [];
//       })
//     );
//   }

//   /**
//    * Obtener un registro por ID
//    */
//   getById<T = any>(config: EntityConfig, rowOrId: any): Observable<T> {
//     const id = this.extractId(config, rowOrId);
//     const endpoint = this.getDetailUrl(config, id);
//     console.log('📡 GET BY ID:', endpoint);
//     return this.http.get<T>(endpoint, { withCredentials: true });
//   }

//   /**
//    * Crear un nuevo registro
//    */
//   create<T = any>(config: EntityConfig, data: any): Observable<T> {
//     const endpoint = config.apiPath || `/${config.entityName}`;
//     console.log('📡 POST:', endpoint, data);
//     return this.http.post<T>(endpoint, data, { withCredentials: true });
//   }

//   /**
//    * Actualizar un registro existente
//    */
//   update<T = any>(config: EntityConfig, rowOrId: any, data: any): Observable<T> {
//     const id = this.extractId(config, rowOrId);
//     const endpoint = this.getDetailUrl(config, id);
//     console.log('📡 PUT:', endpoint, data);
//     return this.http.put<T>(endpoint, data, { withCredentials: true });
//   }

//   /**
//    * Eliminar un registro
//    */
//   delete<T = void>(config: EntityConfig, rowOrId: any): Observable<T> {
//     const id = this.extractId(config, rowOrId);
//     const endpoint = this.getDetailUrl(config, id);
//     console.log('📡 DELETE:', endpoint);
//     return this.http.delete<T>(endpoint, { withCredentials: true });
//   }

//   /**
//    * Buscar registros con filtros personalizados
//    */
//   search<T = any>(config: EntityConfig, params: any): Observable<T[]> {
//     const endpoint = this.getListUrl(config);
//     console.log('📡 SEARCH:', endpoint, params);
//     return this.http.get<T[]>(endpoint, { 
//       params: params, 
//       withCredentials: true 
//     });
//   }

//   /**
//    * Exportar datos (CSV, Excel, etc.)
//    */
//   export<T = any>(config: EntityConfig, params?: any): Observable<T> {
//     const endpoint = `${this.getListUrl(config)}/export`;
//     console.log('📡 EXPORT:', endpoint, params);
//     return this.http.get<T>(endpoint, { 
//       params: params, 
//       withCredentials: true 
//     });
//   }
// }