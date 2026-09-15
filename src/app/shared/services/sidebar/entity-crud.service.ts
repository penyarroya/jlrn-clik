// // src/app/features/admin/dynamic-entity-manager/services/entity-crud.service.ts

// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';  // 👈 NUEVO IMPORT
// import { EntityConfig } from '../../../features/admin/models/entity-config';

// @Injectable({ providedIn: 'root' })
// export class EntityCrudService {
//   private http = inject(HttpClient);

//   getAll(config: EntityConfig): Observable<any[]> {
//     console.log('📡 GET:', config.apiPath);
    
//     return this.http.get<any>(config.apiPath, { withCredentials: true }).pipe(
//       map((response: any) => {
//         console.log('📡 Respuesta cruda:', response);
//         console.log('📡 Tipo:', typeof response);
//         console.log('📡 Es array?', Array.isArray(response));
        
//         // ✅ Si la respuesta es un array, devolverlo directamente
//         if (Array.isArray(response)) {
//           console.log('✅ Es un array, devolviendo directamente');
//           return response;
//         }
        
//         // ✅ Si la respuesta es un objeto con 'content' (Spring Data Page)
//         if (response && typeof response === 'object' && response.content && Array.isArray(response.content)) {
//           console.log('✅ Usando response.content (Spring Page)');
//           return response.content;
//         }
        
//         // ✅ Si la respuesta es un objeto con 'data'
//         if (response && response.data && Array.isArray(response.data)) {
//           console.log('✅ Usando response.data');
//           return response.data;
//         }
        
//         // ✅ Si la respuesta es un objeto con 'items'
//         if (response && response.items && Array.isArray(response.items)) {
//           console.log('✅ Usando response.items');
//           return response.items;
//         }
        
//         // ✅ Si es un objeto simple (no array), convertirlo a array
//         if (response && typeof response === 'object' && Object.keys(response).length > 0) {
//           console.log('✅ Convirtiendo objeto a array');
//           return [response];
//         }
        
//         // ✅ Cualquier otro caso, devolver array vacío
//         console.log('⚠️ No se pudo extraer datos, devolviendo []');
//         return [];
//       })
//     );
//   }

//   getById(config: EntityConfig, id: number): Observable<any> {
//     console.log('📡 GET BY ID:', `${config.apiPath}/${id}`);
//     return this.http.get<any>(`${config.apiPath}/${id}`, { withCredentials: true });
//   }

//   create(config: EntityConfig, data: any): Observable<any> {
//     console.log('📡 POST:', config.apiPath, data);
//     return this.http.post<any>(config.apiPath, data, { withCredentials: true });
//   }

//   update(config: EntityConfig, id: number, data: any): Observable<any> {
//     console.log('📡 PUT:', `${config.apiPath}/${id}`, data);
//     return this.http.put<any>(`${config.apiPath}/${id}`, data, { withCredentials: true });
//   }

//   delete(config: EntityConfig, id: number): Observable<void> {
//     console.log('📡 DELETE:', `${config.apiPath}/${id}`);
//     return this.http.delete<void>(`${config.apiPath}/${id}`, { withCredentials: true });
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

  // Extrae dinámicamente la clave primaria (ej. 'userId' o 'id')
  // private extractId(config: EntityConfig, rowDataOrId: any): any {
  //   if (typeof rowDataOrId === 'object' && rowDataOrId !== null) {
  //     const primaryField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
  //     return rowDataOrId[primaryField];
  //   }
  //   return rowDataOrId;
  // }

  private extractId(config: EntityConfig, rowDataOrId: any): any {
    console.log('🔍 [extractId] Config:', config.entityName, 'Recibido:', rowDataOrId);
    
    // 🛡️ Protección contra valores nulos o indefinidos provenientes de la tabla
    if (rowDataOrId === undefined || rowDataOrId === null) {
      console.error(`🚨 [extractId] Error: Se intentó extraer la clave primaria para '${config.entityName}', pero el valor recibido es undefined o null. Revisa el componente que llama a la acción de editar.`);
      return ''; // Evita que se concatene 'undefined' en la URL
    }

    if (typeof rowDataOrId === 'object') {
      const primaryField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
      const extracted = rowDataOrId[primaryField];
      console.log(`🔍 [extractId] Buscando clave primaria '${primaryField}':`, extracted);
      return extracted;
    }
    
    return rowDataOrId;
  }
  
  // Obtiene la URL de listado (usa apiListPath si existe, si no apiPath)
  private getListUrl(config: EntityConfig): string {
    return config.apiListPath || config.apiPath;
  }

  // Obtiene la URL de detalle (usa apiDetailPath dinámico si existe, si no el estándar /path/id)
  private getDetailUrl(config: EntityConfig, id: any): string {
    if (config.apiDetailPath) {
      return config.apiDetailPath(id);
    }
    return `${config.apiPath}/${id}`;
  }

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

  getById(config: EntityConfig, rowOrId: any): Observable<any> {
    const id = this.extractId(config, rowOrId);
    const endpoint = this.getDetailUrl(config, id);
    console.log('📡 GET BY ID:', endpoint);
    return this.http.get<any>(endpoint, { withCredentials: true });
  }

  create(config: EntityConfig, data: any): Observable<any> {
    const id = this.extractId(config, data);
    const endpoint = config.apiDetailPath ? config.apiDetailPath(id) : config.apiPath;
    console.log('📡 POST:', endpoint, data);
    return this.http.post<any>(endpoint, data, { withCredentials: true });
  }

  update(config: EntityConfig, rowOrId: any, data: any): Observable<any> {
    const id = this.extractId(config, rowOrId);
    const endpoint = this.getDetailUrl(config, id);
    console.log('📡 PUT:', endpoint, data);
    return this.http.put<any>(endpoint, data, { withCredentials: true });
  }

  delete(config: EntityConfig, rowOrId: any): Observable<void> {
    const id = this.extractId(config, rowOrId);
    const endpoint = this.getDetailUrl(config, id);
    console.log('📡 DELETE:', endpoint);
    return this.http.delete<void>(endpoint, { withCredentials: true });
  }
}