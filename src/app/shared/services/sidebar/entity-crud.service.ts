// // src/app/features/admin/dynamic-entity-manager/services/entity-crud.service.ts

// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { EntityConfig } from '../../../features/pages/admin/models/entity-config';

// @Injectable({ providedIn: 'root' })
// export class EntityCrudService {
//   private http = inject(HttpClient);

//   // Extrae dinámicamente la clave primaria (ej. 'userId' o 'id')
//   // private extractId(config: EntityConfig, rowDataOrId: any): any {
//   //   if (typeof rowDataOrId === 'object' && rowDataOrId !== null) {
//   //     const primaryField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
//   //     return rowDataOrId[primaryField];
//   //   }
//   //   return rowDataOrId;
//   // }

//   private extractId(config: EntityConfig, rowDataOrId: any): any {
//     console.log('🔍 [extractId] Config:', config.entityName, 'Recibido:', rowDataOrId);
    
//     // 🛡️ Protección contra valores nulos o indefinidos provenientes de la tabla
//     if (rowDataOrId === undefined || rowDataOrId === null) {
//       console.error(`🚨 [extractId] Error: Se intentó extraer la clave primaria para '${config.entityName}', pero el valor recibido es undefined o null. Revisa el componente que llama a la acción de editar.`);
//       return ''; // Evita que se concatene 'undefined' en la URL
//     }

//     if (typeof rowDataOrId === 'object') {
//       const primaryField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
//       const extracted = rowDataOrId[primaryField];
//       console.log(`🔍 [extractId] Buscando clave primaria '${primaryField}':`, extracted);
//       return extracted;
//     }
    
//     return rowDataOrId;
//   }
  
//   // Obtiene la URL de listado (usa apiListPath si existe, si no apiPath)
//   private getListUrl(config: EntityConfig): string {
//     return config.apiListPath || config.apiPath;
//   }

//   // Obtiene la URL de detalle (usa apiDetailPath dinámico si existe, si no el estándar /path/id)
//   private getDetailUrl(config: EntityConfig, id: any): string {
//     if (config.apiDetailPath) {
//       return config.apiDetailPath(id);
//     }
//     return `${config.apiPath}/${id}`;
//   }

//   getAll(config: EntityConfig): Observable<any[]> {
//     const endpoint = this.getListUrl(config);
//     console.log('📡 GET:', endpoint);
    
//     return this.http.get<any>(endpoint, { withCredentials: true }).pipe(
//       map((response: any) => {
//         console.log('📡 Respuesta cruda:', response);
        
//         if (Array.isArray(response)) return response;
//         if (response && Array.isArray(response.content)) return response.content;
//         if (response && Array.isArray(response.data)) return response.data;
//         if (response && Array.isArray(response.items)) return response.items;
//         if (response && typeof response === 'object' && Object.keys(response).length > 0) return [response];
        
//         return [];
//       })
//     );
//   }

//   getById(config: EntityConfig, rowOrId: any): Observable<any> {
//     const id = this.extractId(config, rowOrId);
//     const endpoint = this.getDetailUrl(config, id);
//     console.log('📡 GET BY ID:', endpoint);
//     return this.http.get<any>(endpoint, { withCredentials: true });
//   }

//   create(config: EntityConfig, data: any): Observable<any> {
//     const id = this.extractId(config, data);
//     const endpoint = config.apiDetailPath ? config.apiDetailPath(id) : config.apiPath;
//     console.log('📡 POST:', endpoint, data);
//     return this.http.post<any>(endpoint, data, { withCredentials: true });
//   }

//   update(config: EntityConfig, rowOrId: any, data: any): Observable<any> {
//     const id = this.extractId(config, rowOrId);
//     const endpoint = this.getDetailUrl(config, id);
//     console.log('📡 PUT:', endpoint, data);
//     return this.http.put<any>(endpoint, data, { withCredentials: true });
//   }

//   delete(config: EntityConfig, rowOrId: any): Observable<void> {
//     const id = this.extractId(config, rowOrId);
//     const endpoint = this.getDetailUrl(config, id);
//     console.log('📡 DELETE:', endpoint);
//     return this.http.delete<void>(endpoint, { withCredentials: true });
//   }
// }









// src/app/features/admin/dynamic-entity-manager/services/entity-crud.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EntityConfig } from '../../../features/pages/admin/models/entity-config';

@Injectable({ providedIn: 'root' })
export class EntityCrudService {
  private http = inject(HttpClient);

  /**
   * Extrae dinámicamente la clave primaria (ej. 'userId' o 'id').
   * Acepta tanto el objeto completo como el id directo.
   */
  private extractId(config: EntityConfig, rowDataOrId: any): any {
    console.log('🔍 [extractId] Config:', config.entityName, 'Recibido:', rowDataOrId);

    // 🛡️ Protección contra valores nulos o indefinidos
    if (rowDataOrId === undefined || rowDataOrId === null) {
      console.error(
        `🚨 [extractId] Error: Se intentó extraer la clave primaria para '${config.entityName}', ` +
        `pero el valor recibido es undefined o null.`
      );
      return '';
    }

    if (typeof rowDataOrId === 'object') {
      const primaryField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
      const extracted = rowDataOrId[primaryField];
      console.log(`🔍 [extractId] Buscando clave primaria '${primaryField}':`, extracted);
      return extracted;
    }

    return rowDataOrId;
  }

  /**
   * Obtiene la URL de listado (usa apiListPath si existe, si no apiPath).
   */
  private getListUrl(config: EntityConfig): string {
    return config.apiListPath || config.apiPath;
  }

  /**
   * Obtiene la URL de detalle (usa apiDetailPath dinámico si existe, si no el estándar /path/id).
   */
  private getDetailUrl(config: EntityConfig, id: any): string {
    if (config.apiDetailPath) {
      return config.apiDetailPath(id);
    }
    return `${config.apiPath}/${id}`;
  }

  // ============================================================
  // GET ALL
  // ============================================================
  getAll(config: EntityConfig): Observable<any[]> {
    const endpoint = this.getListUrl(config);
    console.log('📡 GET:', endpoint);

    return this.http.get<any>(endpoint, { withCredentials: true }).pipe(
      map((response: any) => {
        console.log('📡 Respuesta cruda:', response);

        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.content)) return response.content;
        if (response && Array.isArray(response.data)) return response.data;
        if (response && Array.isArray(response.items)) return response.items;
        if (response && typeof response === 'object' && Object.keys(response).length > 0) return [response];

        return [];
      })
    );
  }

  // ============================================================
  // GET BY ID
  // ============================================================
  getById(config: EntityConfig, rowOrId: any): Observable<any> {
    const id = this.extractId(config, rowOrId);
    const endpoint = this.getDetailUrl(config, id);
    console.log('📡 GET BY ID:', endpoint);
    return this.http.get<any>(endpoint, { withCredentials: true });
  }

  // ============================================================
  // CREATE
  // ============================================================
  create(config: EntityConfig, data: any): Observable<any> {
    // ✅ POST siempre va a apiPath (no hay id todavía)
    const endpoint = config.apiPath;
    console.log('📡 POST:', endpoint, data);
    return this.http.post<any>(endpoint, data, { withCredentials: true });
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update(config: EntityConfig, rowOrId: any, data: any): Observable<any> {
    const id = this.extractId(config, rowOrId);
    const endpoint = this.getDetailUrl(config, id);
    console.log('📡 PUT:', endpoint, data);
    return this.http.put<any>(endpoint, data, { withCredentials: true });
  }

  // ============================================================
  // DELETE
  // ============================================================
  delete(config: EntityConfig, rowOrId: any): Observable<void> {
    const id = this.extractId(config, rowOrId);
    const endpoint = this.getDetailUrl(config, id);
    console.log('📡 DELETE:', endpoint);
    return this.http.delete<void>(endpoint, { withCredentials: true });
  }
}