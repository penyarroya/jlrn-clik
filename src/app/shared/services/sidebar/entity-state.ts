// import { Service } from '@angular/core';

// @Service()
// export class EntityState {
// }




// src/app/features/admin/dynamic-entity-manager/services/entity-state.service.ts

import { Service, signal, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Service()
export class EntityStateService {
  // ============================================================
  // ESTADO PRIVADO CON SIGNALS
  // ============================================================
  
  // Datos principales
  private entityName = signal<string>('');
  private loading = signal<boolean>(false);
  private data = signal<any[]>([]);
  private total = signal<number>(0);
  
  // Selección
  private selectedId = signal<number | null>(null);
  private selectedData = signal<any | null>(null);
  
  // Búsqueda y paginación
  private searchTerm = signal<string>('');
  private pageIndex = signal<number>(0);
  private pageSize = signal<number>(10);
  
  // Formulario
  private formVisible = signal<boolean>(false);
  private formMode = signal<'create' | 'edit' | 'view' | null>(null);
  
  // Errores
  private error = signal<string | null>(null);
  private success = signal<string | null>(null);

  // ============================================================
  // SEÑALES PÚBLICAS DE SOLO LECTURA
  // ============================================================
  
  // Datos
  readonly isLoading = this.loading.asReadonly();
  readonly dataList = this.data.asReadonly();
  readonly totalItems = this.total.asReadonly();
  readonly currentEntity = this.entityName.asReadonly();
  
  // Selección
  readonly selectedIdValue = this.selectedId.asReadonly();
  readonly selectedDataValue = this.selectedData.asReadonly();
  
  // Filtros
  readonly searchTermValue = this.searchTerm.asReadonly();
  readonly pageIndexValue = this.pageIndex.asReadonly();
  readonly pageSizeValue = this.pageSize.asReadonly();
  
  // Formulario
  readonly isFormVisible = this.formVisible.asReadonly();
  readonly formModeValue = this.formMode.asReadonly();
  
  // Estado
  readonly errorValue = this.error.asReadonly();
  readonly successValue = this.success.asReadonly();

  // ============================================================
  // SEÑALES COMPUTADAS
  // ============================================================
  
  /**
   * Total de páginas basado en el total de items y el tamaño de página
   */
  readonly totalPages = computed(() => {
    return Math.ceil(this.total() / this.pageSize());
  });

  /**
   * Indica si hay datos disponibles
   */
  readonly hasData = computed(() => {
    return this.data().length > 0;
  });

  /**
   * Indica si está en modo edición
   */
  readonly isEditing = computed(() => {
    return this.formMode() === 'edit';
  });

  /**
   * Indica si está en modo creación
   */
  readonly isCreating = computed(() => {
    return this.formMode() === 'create';
  });

  /**
   * Indica si está en modo visualización
   */
  readonly isViewing = computed(() => {
    return this.formMode() === 'view';
  });

  /**
   * Datos filtrados (para búsqueda local)
   */
  readonly filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.data();
    return this.data().filter(item => {
      return Object.values(item).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  });

  // ============================================================
  // GETTERS
  // ============================================================
  
  getEntityName(): string {
    return this.entityName();
  }

  getSelectedId(): number | null {
    return this.selectedId();
  }

  getSelectedData(): any | null {
    return this.selectedData();
  }

  getSearchTerm(): string {
    return this.searchTerm();
  }

  getPageIndex(): number {
    return this.pageIndex();
  }

  getPageSize(): number {
    return this.pageSize();
  }

  // ============================================================
  // SETTERS
  // ============================================================
  
  setEntityName(name: string): void {
    this.entityName.set(name);
  }

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setData(data: any[]): void {
    this.data.set(data);
  }

  setTotal(total: number): void {
    this.total.set(total);
  }

  setSelectedId(id: number | null): void {
    this.selectedId.set(id);
  }

  setSelectedData(data: any | null): void {
    this.selectedData.set(data);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setPageIndex(index: number): void {
    this.pageIndex.set(index);
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  setSuccess(message: string | null): void {
    this.success.set(message);
  }

  // ============================================================
  // MÉTODOS DEL FORMULARIO
  // ============================================================
  
  /**
   * Abrir formulario de creación
   */
  openCreateForm(): void {
    this.selectedId.set(null);
    this.selectedData.set(null);
    this.formMode.set('create');
    this.formVisible.set(true);
    this.error.set(null);
  }

  /**
   * Abrir formulario de edición
   */
  openEditForm(id: number, data?: any): void {
    this.selectedId.set(id);
    if (data) this.selectedData.set(data);
    this.formMode.set('edit');
    this.formVisible.set(true);
    this.error.set(null);
  }

  /**
   * Abrir vista de detalle
   */
  openViewForm(id: number, data?: any): void {
    this.selectedId.set(id);
    if (data) this.selectedData.set(data);
    this.formMode.set('view');
    this.formVisible.set(true);
    this.error.set(null);
  }

  /**
   * Cerrar formulario
   */
  closeForm(): void {
    this.formVisible.set(false);
    this.formMode.set(null);
    this.selectedId.set(null);
    this.selectedData.set(null);
  }

  // ============================================================
  // MÉTODOS DE RESET
  // ============================================================
  
  /**
   * Resetear todo el estado
   */
  reset(): void {
    this.data.set([]);
    this.total.set(0);
    this.selectedId.set(null);
    this.selectedData.set(null);
    this.searchTerm.set('');
    this.pageIndex.set(0);
    this.pageSize.set(10);
    this.formVisible.set(false);
    this.formMode.set(null);
    this.error.set(null);
    this.success.set(null);
    this.loading.set(false);
  }

  /**
   * Resetear filtros y paginación
   */
  resetFilters(): void {
    this.searchTerm.set('');
    this.pageIndex.set(0);
  }

  /**
   * Resetear el formulario
   */
  resetForm(): void {
    this.selectedId.set(null);
    this.selectedData.set(null);
    this.formMode.set(null);
    this.error.set(null);
  }

  // ============================================================
  // MÉTODOS DE PAGINACIÓN
  // ============================================================
  
  /**
   * Actualizar paginación
   */
  updatePagination(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  /**
   * Ir a la página siguiente
   */
  nextPage(): void {
    const current = this.pageIndex();
    if (current < this.totalPages() - 1) {
      this.pageIndex.set(current + 1);
    }
  }

  /**
   * Ir a la página anterior
   */
  previousPage(): void {
    const current = this.pageIndex();
    if (current > 0) {
      this.pageIndex.set(current - 1);
    }
  }

  /**
   * Ir a una página específica
   */
  goToPage(page: number): void {
    const totalPages = this.totalPages();
    if (page >= 0 && page < totalPages) {
      this.pageIndex.set(page);
    }
  }

  // ============================================================
  // MÉTODOS DE SELECCIÓN
  // ============================================================
  
  /**
   * Seleccionar un item por ID
   */
  selectItem(id: number | null): void {
    this.selectedId.set(id);
    if (id !== null) {
      const item = this.data().find(item => item.id === id);
      this.selectedData.set(item || null);
    } else {
      this.selectedData.set(null);
    }
  }

  /**
   * Deseleccionar el item actual
   */
  deselectItem(): void {
    this.selectedId.set(null);
    this.selectedData.set(null);
  }

  // ============================================================
  // MÉTODOS DE MANEJO DE ERRORES
  // ============================================================
  
  /**
   * Mostrar un error
   */
  showError(message: string): void {
    this.error.set(message);
    this.success.set(null);
  }

  /**
   * Mostrar un mensaje de éxito
   */
  showSuccess(message: string): void {
    this.success.set(message);
    this.error.set(null);
  }

  /**
   * Limpiar mensajes de error y éxito
   */
  clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }

  // ============================================================
  // MÉTODOS DE ACTUALIZACIÓN DE DATOS
  // ============================================================
  
  /**
   * Agregar un item a la lista
   */
  addItem(item: any): void {
    this.data.update(current => [...current, item]);
    this.total.update(current => current + 1);
  }

  /**
   * Actualizar un item en la lista
   */
  updateItem(id: number, newData: any): void {
    this.data.update(current => 
      current.map(item => item.id === id ? { ...item, ...newData } : item)
    );
  }

  /**
   * Eliminar un item de la lista
   */
  removeItem(id: number): void {
    this.data.update(current => current.filter(item => item.id !== id));
    this.total.update(current => current - 1);
  }

  /**
   * Reemplazar toda la lista
   */
  replaceItems(items: any[]): void {
    this.data.set(items);
    this.total.set(items.length);
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  
  /**
   * Convertir señales a observables (para usar con RxJS)
   */
  toObservable<T>(signal: any): any {
    return toObservable(signal);
  }
}