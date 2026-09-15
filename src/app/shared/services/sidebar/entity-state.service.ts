// import { Service } from '@angular/core';

// @Service()
// export class EntityStateService {
// }




// src/app/features/admin/dynamic-entity-manager/services/entity-state.service.ts

import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EntityStateService {
  // Estado global
  private entityName = signal<string>('');
  private loading = signal(false);
  private data = signal<any[]>([]);
  private total = signal(0);
  private selectedId = signal<number | null>(null);
  private selectedData = signal<any | null>(null);
  private searchTerm = signal('');
  private pageIndex = signal(0);
  private pageSize = signal(10);
  private formVisible = signal(false);
  private formMode = signal<'create' | 'edit' | null>(null);
  private error = signal<string | null>(null);

  // Computed
  isLoading = this.loading.asReadonly();
  dataList = this.data.asReadonly();
  totalItems = this.total.asReadonly();
  selectedIdValue = this.selectedId.asReadonly();
  selectedDataValue = this.selectedData.asReadonly();
  searchTermValue = this.searchTerm.asReadonly();
  pageIndexValue = this.pageIndex.asReadonly();
  pageSizeValue = this.pageSize.asReadonly();
  isFormVisible = this.formVisible.asReadonly();
  formModeValue = this.formMode.asReadonly();
  errorValue = this.error.asReadonly();

  // Getters
  getEntityName() { return this.entityName(); }
  
  // Setters
  setEntityName(name: string) { this.entityName.set(name); }
  setLoading(value: boolean) { this.loading.set(value); }
  setData(data: any[]) { this.data.set(data); }
  setTotal(total: number) { this.total.set(total); }
  setSelectedId(id: number | null) { this.selectedId.set(id); }
  setSelectedData(data: any | null) { this.selectedData.set(data); }
  setSearchTerm(term: string) { this.searchTerm.set(term); }
  setPageIndex(index: number) { this.pageIndex.set(index); }
  setPageSize(size: number) { this.pageSize.set(size); }
  setError(error: string | null) { this.error.set(error); }

  // Formulario
  openCreateForm() {
    this.selectedId.set(null);
    this.selectedData.set(null);
    this.formMode.set('create');
    this.formVisible.set(true);
  }

  openEditForm(id: number, data?: any) {
    this.selectedId.set(id);
    if (data) this.selectedData.set(data);
    this.formMode.set('edit');
    this.formVisible.set(true);
  }

  closeForm() {
    this.formVisible.set(false);
    this.formMode.set(null);
    this.selectedId.set(null);
    this.selectedData.set(null);
  }

  reset() {
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
    this.loading.set(false);
  }

  updatePagination(pageIndex: number, pageSize: number) {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }
}