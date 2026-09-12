// import { Directive } from '@angular/core';

// @Directive({
//   selector: '[appEntityField]',
// })
// export class EntityFieldDirective {
// }


// src/app/features/admin/dynamic-entity-manager/directives/entity-field.directive.ts

import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { EntityField } from '../../features/admin/models/entity-config';

@Directive({
  selector: '[appEntityField]',
  standalone: true
})
export class EntityFieldDirective {
  @Input() set appEntityField(field: EntityField) {
    // Lógica para renderizar campos dinámicamente
    // Puede ser extendida para manejar tipos de campo personalizados
  }
}
