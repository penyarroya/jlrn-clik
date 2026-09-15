// import { Pipe, PipeTransform } from '@angular/core';

// @Pipe({
//   name: 'entityValue',
// })
// export class EntityValuePipe implements PipeTransform {
//   transform(value: unknown, ...args: unknown[]): unknown {
//     return null;
//   }
// }




// src/app/features/admin/dynamic-entity-manager/pipes/entity-value.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'entityValue',
  standalone: true
})
export class EntityValuePipe implements PipeTransform {
  transform(value: any, type?: string): string {
    if (value === undefined || value === null) return '-';
    
    // Booleanos
    if (typeof value === 'boolean') {
      return value ? '✅' : '❌';
    }
    
    // Fechas
    if (value instanceof Date || (typeof value === 'string' && value.includes('T') && !isNaN(Date.parse(value)))) {
      return new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      if (typeof value[0] === 'object') {
        return value.map(item => item.name || item.label || '?').join(', ');
      }
      return value.join(', ');
    }
    
    // Objetos
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Objeto]';
      }
    }
    
    return String(value);
  }
}