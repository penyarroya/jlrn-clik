// src/core/services/voz/voice-dictionary.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DictionaryType } from '../../models/voz/dictionary-type';

type DictionaryMap = Map<string, string>;

@Injectable({
  providedIn: 'root'
})
export class VoiceDictionaryService {

  private readonly http = inject(HttpClient);

  /** Ruta base de los diccionarios - ✅ CORREGIDA */
  private readonly BASE_PATH = '/assets/dictionaries';

  /** Caché de diccionarios */
  private readonly dictionaries = new Map<DictionaryType, DictionaryMap>();

  /** Promesas de carga en curso */
  private readonly loading = new Map<DictionaryType, Promise<void>>();

  // ============================================================
  // NORMALIZACIÓN
  // ============================================================

  /**
   * Normaliza un texto para comparaciones.
   *
   * - Minúsculas
   * - Sin tildes
   * - Espacios normalizados
   */
  normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ============================================================
  // CARGA
  // ============================================================

  /**
   * Carga un diccionario si todavía no existe en caché.
   */
  async load(dictionary: DictionaryType): Promise<void> {
    if (this.dictionaries.has(dictionary)) {
      return;
    }

    const currentLoad = this.loading.get(dictionary);
    if (currentLoad) {
      return currentLoad;
    }

    const promise = this.loadDictionary(dictionary);
    this.loading.set(dictionary, promise);

    try {
      await promise;
    } finally {
      this.loading.delete(dictionary);
    }
  }

  /**
   * Carga realmente el JSON.
   */
  private async loadDictionary(dictionary: DictionaryType): Promise<void> {
    const words = await firstValueFrom(
      this.http.get<string[]>(
        `${this.BASE_PATH}/${dictionary}.json`
      )
    );

    if (!Array.isArray(words)) {
      throw new Error(
        `El diccionario "${dictionary}" no tiene un formato válido.`
      );
    }

    const uniqueWords = [...new Set(words)]
      .map(word => word.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));

    const map: DictionaryMap = new Map();

    for (const word of uniqueWords) {
      const key = this.normalize(word);
      if (!map.has(key)) {
        map.set(key, word);
      }
    }

    this.dictionaries.set(dictionary, map);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Obtiene un diccionario ya cargado.
   */
  private getDictionary(dictionary: DictionaryType): DictionaryMap {
    const map = this.dictionaries.get(dictionary);
    if (!map) {
      throw new Error(
        `El diccionario "${dictionary}" no está cargado.`
      );
    }
    return map;
  }

  // ============================================================
  // CONSULTAS
  // ============================================================

  /**
   * Comprueba si una palabra existe.
   */
  async exists(
    dictionary: DictionaryType,
    value: string
  ): Promise<boolean> {
    await this.load(dictionary);
    return this.getDictionary(dictionary)
      .has(this.normalize(value));
  }

  /**
   * Devuelve la palabra original.
   */
  async getOriginal(
    dictionary: DictionaryType,
    value: string
  ): Promise<string | null> {
    await this.load(dictionary);
    return (
      this.getDictionary(dictionary)
        .get(this.normalize(value))
      ?? null
    );
  }

  /**
   * Devuelve todas las claves normalizadas.
   */
  async getNormalizedKeys(
    dictionary: DictionaryType
  ): Promise<string[]> {
    await this.load(dictionary);
    return [
      ...this.getDictionary(dictionary).keys()
    ];
  }

  /**
   * Devuelve todas las palabras originales.
   */
  async getAll(
    dictionary: DictionaryType
  ): Promise<string[]> {
    await this.load(dictionary);
    return [
      ...this.getDictionary(dictionary).values()
    ];
  }

  // ============================================================
  // GESTIÓN DE CACHÉ
  // ============================================================

  /**
   * Precarga varios diccionarios.
   */
  async preload(
    dictionaries: DictionaryType[]
  ): Promise<void> {
    await Promise.all(
      dictionaries.map(d => this.load(d))
    );
  }

  /**
   * Recarga un diccionario.
   */
  async reload(
    dictionary: DictionaryType
  ): Promise<void> {
    this.dictionaries.delete(dictionary);
    await this.load(dictionary);
  }

  /**
   * Elimina un diccionario de la caché.
   */
  unload(
    dictionary: DictionaryType
  ): void {
    this.dictionaries.delete(dictionary);
    this.loading.delete(dictionary);
  }

  /**
   * Limpia toda la caché.
   */
  clear(): void {
    this.dictionaries.clear();
    this.loading.clear();
  }

  // ============================================================
  // INFORMACIÓN
  // ============================================================

  /**
   * Número de elementos cargados.
   *
   * No fuerza la carga.
   */
  size(
    dictionary: DictionaryType
  ): number {
    return this.dictionaries
      .get(dictionary)
      ?.size ?? 0;
  }

  /**
   * Indica si un diccionario ya está cargado.
   */
  isLoaded(
    dictionary: DictionaryType
  ): boolean {
    return this.dictionaries.has(dictionary);
  }

  /**
   * Diccionarios actualmente cargados.
   */
  getLoadedDictionaries(): DictionaryType[] {
    return [
      ...this.dictionaries.keys()
    ];
  }

  /**
   * Estadísticas de la caché.
   */
  stats() {
    return {
      loaded: this.dictionaries.size,
      dictionaries: [...this.dictionaries.entries()]
        .map(([name, map]) => ({
          name,
          words: map.size
        }))
    };
  }
}