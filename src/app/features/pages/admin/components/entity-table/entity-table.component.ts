// src/app/features/admin/dynamic-entity-manager/components/entity-table/entity-table.component.ts

import {
  Component, input, output, computed, model, inject, effect, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// ✅ Ionic 9
import {
  IonIcon,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  closeOutline,
  arrowBackOutline,
  addOutline,
  createOutline,
  trashOutline,
  archiveOutline,
  chevronBackOutline,
  chevronForwardOutline,
  chevronBackCircleOutline,
  chevronForwardCircleOutline
} from 'ionicons/icons';

import { EntityConfig } from '../../models/entity-config';
import { EntityValuePipe } from '../../../../../shared/pipes/entity-value.pipe';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonButton,
    IonSpinner,
    EntityValuePipe
],
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss']
})
export class EntityTableComponent {
  private http = inject(HttpClient);

  // Inputs
  config = input<EntityConfig | null>(null);
  showActions = input(true);

  // Estado interno
  data = signal<any[]>([]);
  loading = signal(false);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(10);
  searchTerm = model('');

  // Outputs
  editRequested = output<any>();
  deleteRequested = output<any>();
  createRequested = output<void>();
  backRequested = output<void>();

  // Opciones de paginación (por defecto)
  readonly defaultPageSizeOptions = [5, 10, 25, 50, 100];

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons({
      searchOutline,
      closeOutline,
      arrowBackOutline,
      addOutline,
      createOutline,
      trashOutline,
      archiveOutline,
      chevronBackOutline,
      chevronForwardOutline,
      chevronBackCircleOutline,
      chevronForwardCircleOutline
    });

    effect(() => {
      const cfg = this.config();
      const page = this.pageIndex();
      const size = this.pageSize();
      const search = this.searchTerm();

      if (cfg) {
        this.fetchData(cfg.apiPath, page, size, search);
      }
    });
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  private fetchData(apiPath: string, page: number, size: number, search: string): void {
    this.loading.set(true);

    this.http.get<any>(apiPath).subscribe({
      next: (response) => {
        const items = Array.isArray(response)
          ? response
          : (response.content || response.data || []);
        this.data.set(items);
        this.total.set(response.totalElements || items.length);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos de la entidad:', err);
        this.data.set([]);
        this.total.set(0);
        this.loading.set(false);
      }
    });
  }

  // ============================================================
  // COMPUTED
  // ============================================================
  visibleFields = computed(() => {
    const config = this.config();
    if (!config) return [];

    return config.fields.filter(f => {
      if (f.hidden) return false;
      if (f.showInTable === false) return false;
      return true;
    });
  });

  editableFields = computed(() => {
    const config = this.config();
    if (!config) return [];

    return config.fields.filter(f => {
      if (f.key === 'id' || f.readonly) return false;
      if (f.showOnEdit === false) return false;
      return true;
    });
  });

  displayedColumns = computed(() => {
    const fields = this.visibleFields().map(f => f.key);
    if (this.showActions() && this.config()?.tableSettings?.showActions !== false) {
      return [...fields, 'actions'];
    }
    return fields;
  });

  // ============================================================
  // PAGINACIÓN
  // ============================================================
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize()));
  }

  get pageSizeOptions(): number[] {
    return this.config()?.tableSettings?.pageSizeOptions || this.defaultPageSizeOptions;
  }

  get canGoPrev(): boolean {
    return this.pageIndex() > 0;
  }

  get canGoNext(): boolean {
    return this.pageIndex() < this.totalPages - 1;
  }

  get rangeLabel(): string {
    const total = this.total();
    const size = this.pageSize();
    const page = this.pageIndex();

    if (total === 0 || size === 0) return `0 de ${total}`;

    const start = page * size;
    const end = start < total
      ? Math.min(start + size, total)
      : start + size;

    return `${start + 1} – ${end} de ${total}`;
  }

  // ============================================================
  // ACCIONES DE BÚSQUEDA
  // ============================================================
  onSearchInput(): void {
    this.pageIndex.set(0);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.pageIndex.set(0);
  }

  // ============================================================
  // ACCIONES DE PAGINACIÓN
  // ============================================================
  goFirst(): void {
    if (this.canGoPrev) this.pageIndex.set(0);
  }

  goPrev(): void {
    if (this.canGoPrev) this.pageIndex.update(p => p - 1);
  }

  goNext(): void {
    if (this.canGoNext) this.pageIndex.update(p => p + 1);
  }

  goLast(): void {
    if (this.canGoNext) this.pageIndex.set(this.totalPages - 1);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
  }

  // ============================================================
  // RECARGA
  // ============================================================
  reload(): void {
    const cfg = this.config();
    if (cfg) {
      this.fetchData(cfg.apiPath, this.pageIndex(), this.pageSize(), this.searchTerm());
    }
  }

  // ============================================================
  // ACCIONES DE FILA
  // ============================================================
  handleDelete(row: any): void {
    console.log('🗑️ [EntityTable] handleDelete llamado con:', row);
    this.deleteRequested.emit(row);
  }

  handleEdit(row: any): void {
    console.log('✏️ [EntityTable] handleEdit llamado con:', row);
    this.editRequested.emit(row);
  }

  onCreate(): void {
    this.createRequested.emit();
  }

  goBack(): void {
    this.backRequested.emit();
    // Si quieres que además navegue por defecto:
    // window.history.back();
  }
}