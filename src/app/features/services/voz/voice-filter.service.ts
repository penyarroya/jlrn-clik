// src/core/services/voz/voice-filter.service.ts
import { Injectable, inject } from '@angular/core';
import { VoiceDictionaryService } from './voice-dictionary.service';
import { DictionaryType } from '../../models/voz/dictionary-type';
import { LoggerService } from '../../../shared/services/loggers/logger.service';
import { SpellingCorrectionService } from './spelling-correction.service';
import { FilterResult } from '../../models/voz/FilterResult-model';
import { DuplicateCheckResult } from '../../models/voz/DuplicateCheckResult-model';
import { DictationResult } from '../../models/voz/DictationResult-model';
import { FieldConfig } from '../../models/voz/FieldConfig-model';
import { VoiceCommandContext } from '../../models/voz/VoiceCommandContext-model';
import { VoiceCommandResult } from '../../models/voz/VoiceCommandResult-model';

@Injectable({ providedIn: 'root' })
export class VoiceFilterService {
  private logger = inject(LoggerService);
  private spellingService = inject(SpellingCorrectionService);
  private dictionary = inject(VoiceDictionaryService);

  // Listas de apellidos normalizados para comparación
  private firstSurnames: string[] = [];
  private secondSurnames: string[] = [];
  private dictionariesLoaded = false;

  private readonly stopWords = new Set([
    'a', 'de', 'en', 'y', 'que', 'la', 'el', 'lo', 'un', 'una', 'es', 'por', 'con',
    'sin', 'sobre', 'entre', 'hasta', 'desde', 'según', 'durante', 'mediante',
    'para', 'te', 'me', 'se', 'nos', 'os', 'si', 'no', 'ya', 'oh', 'ah', 'eh',
    'mmm', 'hmm', 'ahí', 'hay', 'hola', 'adios', 'bueno', 'vaya', 'claro',
    'vale', 'ok', 'si', 'no', 'claro', 'perfecto', 'buenas', 'tardes', 'noches'
  ]);

  private readonly wakeWords = [
    'activar micrófono',
    'encender micrófono',
    'hola voxacción',
    'activar',
    'despertar'
  ];

  private exactDuplicateDelay = 3000;
  private similarDuplicateDelay = 1500;
  private similarityThreshold = 0.8;
  private lastProcessedText = '';
  private lastProcessedTime = 0;

  private readonly letterMap: { [key: string]: string } = {
    'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f',
    'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'ñ': 'ñ', 'o': 'o', 'p': 'p', 'q': 'q',
    'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w',
    'x': 'x', 'y': 'y', 'z': 'z',
    'mayúscula a': 'A', 'mayúscula b': 'B', 'mayúscula c': 'C',
    'mayúscula d': 'D', 'mayúscula e': 'E', 'mayúscula f': 'F',
    'mayúscula g': 'G', 'mayúscula h': 'H', 'mayúscula i': 'I',
    'mayúscula j': 'J', 'mayúscula k': 'K', 'mayúscula l': 'L',
    'mayúscula m': 'M', 'mayúscula n': 'N', 'mayúscula ñ': 'Ñ',
    'mayúscula o': 'O', 'mayúscula p': 'P', 'mayúscula q': 'Q',
    'mayúscula r': 'R', 'mayúscula s': 'S', 'mayúscula t': 'T',
    'mayúscula u': 'U', 'mayúscula v': 'V', 'mayúscula w': 'W',
    'mayúscula x': 'X', 'mayúscula y': 'Y', 'mayúscula z': 'Z',
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
  };

  private readonly numberMap: { [key: string]: string } = {
    'mil novecientos cincuenta y seis': '1956',
    'mil novecientos sesenta y cinco': '1965',
    'mil novecientos ochenta y cinco': '1985',
    'mil novecientos noventa': '1990',
    'dos mil veinticinco': '2025',
    'dos mil veinte': '2020',
    'dos mil diez': '2010',
    'dos mil': '2000',
    'cincuenta y seis': '56',
    'cincuenta y cinco': '55',
    'cincuenta y cuatro': '54',
    'cincuenta y tres': '53',
    'cincuenta y dos': '52',
    'cincuenta y uno': '51',
    'cincuenta': '50',
    'cuarenta y seis': '46',
    'cuarenta y cinco': '45',
    'treinta y seis': '36',
    'treinta y uno': '31',
    'veintiséis': '26',
    'veinticinco': '25',
    'veinticuatro': '24',
    'veintitrés': '23',
    'veintidós': '22',
    'veintiuno': '21',
    'veinte': '20',
    'dieciséis': '16',
    'diez': '10',
    'cincuentayseis': '56',
    'cincuentaycinco': '55',
    'cincuentaycuatro': '54',
    'cincuentaytres': '53',
    'cincuentaydos': '52',
    'cincuentayuno': '51',
    'cuarentayseis': '46',
    'cuarentaycinco': '45',
    'treintayseis': '36',
    'treintayuno': '31',
    'veintiseis': '26',
    'veintitres': '23',
    'veintidos': '22',
    'dieciseis': '16',
    'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
    'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
  };

  private readonly specialMap: { [key: string]: string } = {
    'espacio': ' ',
    'guion': '-',
    'guion bajo': '_',
    'arroba': '@',
    'punto': '.',
    'puno': '.',
    'exclamación': '!',
    'admiración': '!',
    'exclamacion': '!',
    'admiracion': '!',
    'interrogación': '?',
    'interrogacion': '?',
    'asterisco': '*',
    'hashtag': '#',
    'dólar': '$',
    'porcentaje': '%',
    'ampersand': '&',
    'barra': '/',
    'barra inversa': '\\',
    'comilla': '"',
    'apóstrofe': "'",
    'paréntesis abrir': '(',
    'paréntesis cerrar': ')',
    'corchete abrir': '[',
    'corchete cerrar': ']',
    'llave abrir': '{',
    'llave cerrar': '}',
    'menor que': '<',
    'mayor que': '>',
    'igual': '=',
    'más': '+',
    'menos': '-',
    'por': '*',
    'dividido': '/',
  };

  // private readonly finishWords = ['fin', 'terminar', 'listo', 'ok', 'vale', 'hecho', 'completar'];
  // voice-filter.service.ts - Modificado
  private readonly finishWords = ['fin', 'terminar'];

  private readonly commonSynonyms = {
    clear: ['limpiar', 'borrar todo', 'resetear', 'empezar de cero', 'borrar campos'],
    cancel: ['cancelar', 'cancel', 'abortar', 'detener'],
    confirm: ['confirmar', 'aceptar', 'ok', 'vale', 'sí', 'si'],
    reject: ['rechazar', 'cancelar', 'no', 'negativo'],
    help: ['ayuda', 'qué puedo decir', 'opciones', 'comandos', 'ayúdame'],
    back: ['volver', 'atrás', 'regresar', 'retroceder'],
    submit: ['enviar', 'logear', 'acceder', 'entrar', 'iniciar sesión', 'login', 'ingresar', 'acceder al sistema', 'submit', 'send', 'guardar', 'registrar']
  };

  // ============================================================
  // CARGA DE DICCIONARIOS
  // ============================================================

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.dictionary.load(DictionaryType.SURNAMES);
    this.firstSurnames = await this.dictionary.getNormalizedKeys(DictionaryType.SURNAMES);
    this.secondSurnames = this.firstSurnames;
    this.dictionariesLoaded = true;
    this.logger.log(`✅ Apellidos cargados: ${this.firstSurnames.length}`);
  }

  // ============================================================
  // CORRECCIÓN DE NOMBRES COMPUESTOS (USANDO DICCIONARIO)
  // ============================================================

  /**
   * Separa nombres compuestos como "GarciaLopez" → "Garcia Lopez"
   * usando el diccionario de apellidos.
   */
  correctCompoundName(value: string): string {
    if (!value) return value;

    // Primero, intentar separar CamelCase (ej. "GarciaLopez")
    let result = value.replace(/([a-záéíóú])([A-ZÁÉÍÓÚ])/g, '$1 $2');
    if (result !== value) {
      return this.capitalizeWords(result);
    }

    // Si el diccionario no está cargado, devolver capitalizado
    if (!this.dictionariesLoaded || this.firstSurnames.length === 0) {
      return this.capitalizeWords(value);
    }

    const lower = value.toLowerCase();
    // Buscar combinaciones de apellidos en el diccionario
    for (const first of this.firstSurnames) {
      if (lower.startsWith(first)) {
        const rest = lower.slice(first.length);
        for (const second of this.secondSurnames) {
          if (rest === second) {
            return this.capitalizeWords(first + ' ' + second);
          }
        }
        // También intentar con apellidos compuestos como "Del" + "Pino"
        // Podrías ampliar la lógica aquí
      }
    }

    return this.capitalizeWords(value);
  }

  private capitalizeWords(text: string): string {
    return text.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // ============================================================
  // MÉTODOS DE FILTRADO
  // ============================================================
  
  // filterTranscript(transcript: string, isMuted: boolean): FilterResult {
  //   const trimmed = transcript.toLowerCase().trim();

  //   // ✅ EXCEPCIÓN: "ayuda" nunca debe ser ignorada por muteo
  //   if (trimmed === 'ayuda' || 
  //       trimmed === 'help' || 
  //       trimmed.includes('ayuda') ||
  //       trimmed.includes('help')) {
  //     return { valid: true, text: trimmed, isWakeWord: false };
  //   }

  //   if (isMuted) {
  //     if (this.isWakeWord(trimmed)) {
  //       return { valid: true, text: trimmed, isWakeWord: true };
  //     }
  //     return { valid: false, reason: 'muted' };
  //   }

  //   if (trimmed.length < 3) {
  //     this.logger.debug(`⏭️ Texto demasiado corto (${trimmed.length}):`, trimmed);
  //     return { valid: false, reason: 'too_short' };
  //   }

  //   if (!/[a-záéíóú]/.test(trimmed)) {
  //     this.logger.debug('⏭️ Texto sin letras:', trimmed);
  //     return { valid: false, reason: 'no_letters' };
  //   }

  //   const isDictationCommand = this.isDictationCommand(trimmed);

  //   if (!isDictationCommand && /^[0-9\s.,;:!?]+$/.test(trimmed)) {
  //     this.logger.debug('⏭️ Texto numérico/simbólico:', trimmed);
  //     return { valid: false, reason: 'numeric_only' };
  //   }

  //   const words = trimmed.split(/\s+/);
  //   const meaningfulWords = words.filter(w => w.length > 2 && !this.stopWords.has(w));

  //   if (!isDictationCommand && meaningfulWords.length === 0) {
  //     this.logger.debug('⏭️ Sin palabras significativas:', trimmed);
  //     return { valid: false, reason: 'no_meaningful_words' };
  //   }

  //   if (!isDictationCommand && words.length <= 2 && words.every(w => this.stopWords.has(w))) {
  //     this.logger.debug('⏭️ Solo stopwords:', trimmed);
  //     return { valid: false, reason: 'only_stopwords' };
  //   }

  //   const now = Date.now();
  //   const duplicateCheck = this.checkDuplicates(trimmed, now);
  //   if (!duplicateCheck.valid) {
  //     this.logger.debug(`⏳ Duplicado (${duplicateCheck.reason}):`, trimmed);
  //     return { valid: false, reason: duplicateCheck.reason, similarity: duplicateCheck.similarity };
  //   }

  //   this.lastProcessedText = trimmed;
  //   this.lastProcessedTime = now;

  //   return { valid: true, text: trimmed };
  // }











  filterTranscript(transcript: string, isMuted: boolean): FilterResult {
    const trimmed = transcript.toLowerCase().trim();

    // ✅ EXCEPCIÓN: "ayuda" nunca debe ser ignorada por muteo
    if (trimmed === 'ayuda' || 
        trimmed === 'help' || 
        trimmed.includes('ayuda') ||
        trimmed.includes('help')) {
      return { valid: true, text: trimmed, isWakeWord: false };
    }

    // 🔥 NUEVO: Permitir mensajes que contengan dígitos (OTP, códigos, etc.)
    // SIN CONTROL DE DUPLICADOS, para que los eventos parciales lleguen en tiempo real.
    if (/\d/.test(trimmed)) {
      if (isMuted) {
        if (this.isWakeWord(trimmed)) {
          return { valid: true, text: trimmed, isWakeWord: true };
        }
        return { valid: false, reason: 'muted' };
      }
      // ✅ No aplicamos control de duplicados, solo actualizamos el último texto procesado
      this.lastProcessedText = trimmed;
      this.lastProcessedTime = Date.now();
      return { valid: true, text: trimmed, isWakeWord: false };
    }

    // ============================================================
    // FILTRO ORIGINAL (para mensajes sin dígitos)
    // ============================================================
    if (isMuted) {
      if (this.isWakeWord(trimmed)) {
        return { valid: true, text: trimmed, isWakeWord: true };
      }
      return { valid: false, reason: 'muted' };
    }

    if (trimmed.length < 3) {
      this.logger.debug(`⏭️ Texto demasiado corto (${trimmed.length}):`, trimmed);
      return { valid: false, reason: 'too_short' };
    }

    if (!/[a-záéíóú]/.test(trimmed)) {
      this.logger.debug('⏭️ Texto sin letras:', trimmed);
      return { valid: false, reason: 'no_letters' };
    }

    const isDictationCommand = this.isDictationCommand(trimmed);

    if (!isDictationCommand && /^[0-9\s.,;:!?]+$/.test(trimmed)) {
      this.logger.debug('⏭️ Texto numérico/simbólico:', trimmed);
      return { valid: false, reason: 'numeric_only' };
    }

    const words = trimmed.split(/\s+/);
    const meaningfulWords = words.filter(w => w.length > 2 && !this.stopWords.has(w));

    if (!isDictationCommand && meaningfulWords.length === 0) {
      this.logger.debug('⏭️ Sin palabras significativas:', trimmed);
      return { valid: false, reason: 'no_meaningful_words' };
    }

    if (!isDictationCommand && words.length <= 2 && words.every(w => this.stopWords.has(w))) {
      this.logger.debug('⏭️ Solo stopwords:', trimmed);
      return { valid: false, reason: 'only_stopwords' };
    }

    const now = Date.now();
    const duplicateCheck = this.checkDuplicates(trimmed, now);
    if (!duplicateCheck.valid) {
      this.logger.debug(`⏳ Duplicado (${duplicateCheck.reason}):`, trimmed);
      return { valid: false, reason: duplicateCheck.reason, similarity: duplicateCheck.similarity };
    }

    this.lastProcessedText = trimmed;
    this.lastProcessedTime = now;

    return { valid: true, text: trimmed };
  }








  //
  public isWakeWord(text: string): boolean {
    return this.wakeWords.some(word => text.includes(word));
  }

  private isDictationCommand(text: string): boolean {
    const dictationKeywords = [
      'dictar', 'deletrear', 'usuario', 'contraseña',
      'clave', 'nombre', 'email', 'correo'
    ];
    return dictationKeywords.some(keyword => text.includes(keyword));
  }

  private checkDuplicates(transcript: string, now: number): DuplicateCheckResult {
    // ✅ LISTA BLANCA: comandos que nunca deben filtrarse como duplicados
    const neverFilterCommands = [
      'confirmar', 'confirm', 'enviar', 'registrar', 'login', 
      'volver', 'atrás', 'cancelar', 'aceptar', 'verificar', 'validar',
      'nombre', 'correo', 'contraseña', 'ayuda', 'limpiar', 'borrar'
    ];

    // Si el comando está en la lista blanca, NUNCA filtrarlo
    if (neverFilterCommands.some(cmd => transcript.includes(cmd))) {
      return { valid: true };
    }

    // Resto del filtro original
    if (transcript === this.lastProcessedText) {
      if ((now - this.lastProcessedTime) < this.exactDuplicateDelay) {
        return { valid: false, reason: 'exact_duplicate' };
      }
      return { valid: true };
    }

    if (this.lastProcessedText && (now - this.lastProcessedTime) < this.similarDuplicateDelay) {
      const similarity = this.calculateSimilarity(transcript, this.lastProcessedText);
      if (similarity > this.similarityThreshold) {
        return { valid: false, reason: 'similar_duplicate', similarity };
      }
    }

    return { valid: true };
  }

  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const longerLength = longer.length;
    if (longerLength === 0) return 1;
    const distance = this.levenshteinDistance(longer, shorter);
    return (longerLength - distance) / longerLength;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // ============================================================
  // CONVERSIÓN DE VOZ A TEXTO
  // ============================================================
  convertVoiceToText(text: string): string {
    const clean = text.toLowerCase().trim();
    if (!clean) return '';

    if (this.numberMap[clean]) return this.numberMap[clean];
    if (this.specialMap[clean]) return this.specialMap[clean];
    if (this.letterMap[clean]) return this.letterMap[clean];

    if (clean.length === 1 && /[a-zA-Z0-9]/.test(clean)) {
      return clean;
    }

    return text;
  }


  //
  // convertPhraseToText(phrase: string, capitalizeFirst = true): string {
  //   const processedPhrase = this.processSpacedLetters(phrase);
  //   if (processedPhrase !== phrase) {
  //     let finalText = processedPhrase;
  //     if (capitalizeFirst && finalText.length > 0) {
  //       finalText = finalText.charAt(0).toUpperCase() + finalText.slice(1);
  //     }
  //     return finalText;
  //   }

  //   const words = phrase.trim().split(/\s+/);
  //   const result: string[] = [];

  //   for (const word of words) {
  //     const converted = this.convertVoiceToText(word);
  //     if (converted === word) {
  //       const combinedMap = { ...this.letterMap, ...this.numberMap, ...this.specialMap };
  //       if (combinedMap[word.toLowerCase()]) {
  //         result.push(combinedMap[word.toLowerCase()]);
  //       } else {
  //         result.push(word);
  //       }
  //     } else {
  //       result.push(converted);
  //     }
  //   }

  //   let finalText = result.join(' ');
  //   if (capitalizeFirst && finalText.length > 0) {
  //     finalText = finalText.charAt(0).toUpperCase() + finalText.slice(1);
  //   }

  //   return finalText;
  // }



  //
  convertPhraseToText(phrase: string, capitalizeFirst = true): string {
    // Primero, separar letras sueltas
    const processedPhrase = this.processSpacedLetters(phrase);
    
    // Dividir en palabras
    const words = processedPhrase.trim().split(/\s+/);
    const result: string[] = [];

    for (const word of words) {
      // 🔥 Intentar convertir cada palabra individualmente
      const converted = this.convertVoiceToText(word);
      if (converted !== word) {
        // Si se convirtió (ej. "tres" → "3"), usamos el resultado
        result.push(converted);
      } else {
        // Si no, revisamos si está en los mapas combinados (letras, especiales)
        const combinedMap = { ...this.letterMap, ...this.numberMap, ...this.specialMap };
        if (combinedMap[word.toLowerCase()]) {
          result.push(combinedMap[word.toLowerCase()]);
        } else {
          result.push(word);
        }
      }
    }

    let finalText = result.join(' ');
    if (capitalizeFirst && finalText.length > 0) {
      finalText = finalText.charAt(0).toUpperCase() + finalText.slice(1);
    }
    return finalText;
  }




  private processSpecialCharsFallback(text: string): string {
    let result = text;
    const fallbackMap: { [key: string]: string } = {
      'admiración': '!', 'exclamación': '!', 'admiracion': '!', 'exclamacion': '!',
      'interrogación': '?', 'interrogacion': '?',
      'punto': '.', 'puno': '.',
      'coma': ',', 'punto y coma': ';', 'dos puntos': ':',
      'guion': '-', 'guion bajo': '_', 'arroba': '@',
      'asterisco': '*', 'hashtag': '#', 'dólar': '$', 'porcentaje': '%',
      'ampersand': '&', 'barra': '/', 'espacio': ' ',
    };
    for (const [key, value] of Object.entries(fallbackMap)) {
      if (result.toLowerCase().includes(key)) {
        result = result.replace(new RegExp(key, 'gi'), value);
        console.log(`🔤 Fallback: "${key}" → "${value}"`);
      }
    }
    return result;
  }

  private correctPhoneticErrors(text: string): string {
    const corrections: { [key: string]: string } = {
      'ube': 'v',
    };
    let result = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
      result = result.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }
    return result;
  }

  private processCapitalizationCommands(text: string): string {
    const words = text.split(/\s+/);
    const result: string[] = [];
    let i = 0;
    const commandSet = new Set(['mayuscula', 'mayusculas', 'mayúscula', 'mayúsculas']);

    while (i < words.length) {
      const word = words[i];
      const lower = word.toLowerCase();

      if (commandSet.has(lower)) {
        if (i + 1 < words.length) {
          const nextWord = words[i + 1];
          if (nextWord.length === 1) {
            result.push(`§${nextWord}`);
          } else {
            const firstLetter = nextWord.charAt(0);
            const rest = nextWord.slice(1);
            result.push(`§${firstLetter}${rest}`);
          }
          i += 2;
          continue;
        } else {
          i++;
          continue;
        }
      } else {
        result.push(word);
        i++;
      }
    }

    return result.join(' ');
  }

  /**
   * Une secuencias de letras sueltas (ej. "g a m o s a" → "gamosa")
   * pero respeta palabras completas ("Ortiz Rodriguez" → "Ortiz Rodriguez")
   */
  private processSpacedLetters(text: string): string {
    const words = text.split(/\s+/);
    const result: string[] = [];
    let i = 0;

    while (i < words.length) {
      const current = words[i];

      // Si es una letra suelta
      if (current.length === 1 && /[a-zA-Z]/.test(current)) {
        let letters = current;
        let j = i + 1;

        while (j < words.length && words[j].length === 1 && /[a-zA-Z]/.test(words[j])) {
          letters += words[j];
          j++;
        }

        if (letters.length > 1) {
          result.push(letters);
          i = j;
          continue;
        }
      }

      result.push(current);
      i++;
    }

    return result.join(' ');
  }

  // ============================================================
  // NORMALIZACIÓN DE CAMPOS
  // ============================================================

  normalizeFieldValue(value: string, type: FieldConfig['type'], options?: {
    capitalize?: boolean;
    capitalizeEachWord?: boolean;
  }): string {
    let normalized = value.trim();

    if (type === 'email') {
      let email = this.processSpacedLetters(normalized);
      email = email.toLowerCase()
        .replace(/arroba/g, '@')
        .replace(/punto/g, '.')
        .replace(/guion bajo/g, '_')
        .replace(/guion/g, '-')
        .replace(/espacio/g, ' ');

      const segments = email.split(/([@._-])/);
      const processedSegments = segments.map(segment => {
        if (/^[@._-]$/.test(segment)) return segment;
        const words = segment.trim().split(/\s+/);
        if (words.length > 0 && words.every(w => w.length === 1 && /[a-zA-Záéíóúüñ]/.test(w))) {
          return words.join('');
        }
        return segment;
      });

      email = processedSegments.join('').replace(/\s/g, '');
      email = this.removeConsecutiveDuplicates(email);
      email = email.toLowerCase();
      console.log(`🔤 Email final: "${email}"`);
      return email;
    }

    if (type === 'password') {
      let password = normalized.replace(/\s/g, '');
      console.log(`🔤 Password final: "${password}"`);
      return password;
    }

    // Para campos de texto (nombre propio, apellidos, etc.)
    const shouldCapitalize = options?.capitalize !== undefined ? options.capitalize : true;
    const shouldCapitalizeEachWord = options?.capitalizeEachWord || false;

    // Primero, unir letras sueltas
    normalized = this.processSpacedLetters(normalized);

    // ✅ Si estamos capitalizando cada palabra (firstName, lastName), aplicar separación de apellidos
    if (shouldCapitalizeEachWord) {
      normalized = this.correctCompoundName(normalized);
    }

    if (shouldCapitalize && normalized.length > 0) {
      if (shouldCapitalizeEachWord) {
        normalized = normalized
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
      }
    }

    return normalized;
  }

  // ============================================================
  // MÉTODO PRINCIPAL DE PROCESAMIENTO DE DICTADO (CORREGIDO)
  // ============================================================
  // processDictationPhrase(text: string, context?: 'username' | 'password' | 'email' | 'text' | 'fullName', capitalize = true): DictationResult {
  //   let effectiveContext = context;
  //   if (context === 'fullName') effectiveContext = 'username';

  //   let processed = text.toLowerCase().trim();
  //   const original = processed;

  //   console.log('🔍 processDictationPhrase - Original:', original);

  //   // ✅ PROCESAR ESPACIOS PARA EMAIL
  //   if (effectiveContext === 'email') {
  //     processed = this.processSpacedLetters(processed);
  //   }

  //   processed = this.spellingService.applyCorrections(processed);
  //   console.log(`🔍 Después de correcciones del backend: "${processed}"`);

  //   processed = this.removeFinishWords(processed);
  //   processed = this.correctPhoneticErrors(processed);

  //   // ============================================================
  //   // 🔥 FILTRAR PALABRAS DE RELLENO (ANTES DE CAPITALIZAR)
  //   // ============================================================
  //   const removeWords = ['con', 'de', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'en', 'por', 'sin', 'para', 'a', 'ante', 'bajo', 'cabe', 'contra', 'desde', 'durante', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'según', 'sobre', 'tras', 'versus', 'vía'];

  //   const hasMayuscula = /mayúscula|mayuscula/i.test(processed);
  //   const hasMinuscula = /minúscula|minuscula/i.test(processed);

  //   if (hasMayuscula || hasMinuscula) {
  //     const words = processed.split(' ');
  //     let commandFound = false;
  //     const filtered: string[] = [];

  //     for (const word of words) {
  //       const lowerWord = word.toLowerCase();
  //       if (/^mayúscula$|^mayuscula$|^minúscula$|^minuscula$/i.test(lowerWord)) {
  //         commandFound = true;
  //         filtered.push(word);
  //       } else if (commandFound) {
  //         if (!removeWords.includes(lowerWord) && lowerWord.length > 0) {
  //           filtered.push(word);
  //         }
  //         if (!removeWords.includes(lowerWord)) {
  //           commandFound = false;
  //         }
  //       } else {
  //         filtered.push(word);
  //       }
  //     }

  //     processed = filtered.join(' ');
  //     console.log(`🔤 Después de filtrar palabras de relleno: "${processed}"`);
  //   }

  //   // ============================================================
  //   // CAPITALIZACIÓN MANUAL (AHORA DESPUÉS DEL FILTRO)
  //   // ============================================================
  //   processed = this.processCapitalizationCommands(processed);

  //   // ============================================================
  //   // 🔥 CORREGIR "d e v" → "dev" - UNA SOLA VEZ
  //   // ============================================================
  //   if (effectiveContext === 'email') {
  //     processed = processed.replace(/\bde\s+(?=[a-z])/gi, 'd ');
  //     processed = processed.replace(/\bde\b(?=\s+[a-z])/gi, 'd');
  //     processed = processed.replace(/\bde\s+v\b/gi, 'd v');
  //     processed = processed.replace(/\bd\s+e\s+v\b/gi, 'dev');
  //     processed = processed.replace(/\bde\s+ev\b/gi, 'dev');
  //     processed = processed.replace(/\bdeev\b/gi, 'dev');
  //     processed = processed.replace(/\bde\s+v\b/gi, 'dev');
  //     processed = processed.replace(/\bd e v\b/gi, 'dev');
  //   }

  //   // ============================================================
  //   // REEMPLAZOS DE NÚMEROS, ESPECIALES Y LETRAS
  //   // ============================================================
  //   const sortedNumberKeys = Object.keys(this.numberMap).sort((a, b) => b.length - a.length);
  //   for (const key of sortedNumberKeys) {
  //     processed = processed.replace(new RegExp(key, 'g'), this.numberMap[key]);
  //   }
  //   for (const [key, value] of Object.entries(this.specialMap)) {
  //     processed = processed.replace(new RegExp(key, 'g'), value);
  //   }
  //   for (const [key, value] of Object.entries(this.letterMap)) {
  //     processed = processed.replace(new RegExp(key, 'g'), value);
  //   }
  //   processed = this.processSpecialCharsFallback(processed);

  //   // ============================================================
  //   // LIMPIAR ACENTOS Y ESPACIOS
  //   // ============================================================
  //   processed = processed
  //     .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
  //     .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
  //     .replace(/\s+/g, ' ')
  //     .trim();

  //   // ============================================================
  //   // UNIR SOLO SECUENCIAS DE LETRAS SUELTAS
  //   // ============================================================
  //   const words = processed.split(/\s+/);
  //   const resultParts: string[] = [];
  //   let i = 0;

  //   while (i < words.length) {
  //     const current = words[i];
  //     if (current.length === 1 && /[a-zA-Z0-9]/.test(current)) {
  //       let letters = current;
  //       let j = i + 1;
  //       while (j < words.length && words[j].length === 1 && /[a-zA-Z0-9]/.test(words[j])) {
  //         letters += words[j];
  //         j++;
  //       }
  //       if (letters.length > 1) {
  //         resultParts.push(letters);
  //         i = j;
  //         continue;
  //       }
  //     }
  //     resultParts.push(current);
  //     i++;
  //   }
  //   processed = resultParts.join(' ');

  //   // ============================================================
  //   // REEMPLAZAR SIGNOS DE PUNTUACIÓN AL FINAL
  //   // ============================================================
  //   const punctuationWords: { [key: string]: string } = {
  //     'admiración': '!', 'exclamación': '!', 'admiracion': '!', 'exclamacion': '!',
  //     'interrogación': '?', 'interrogacion': '?',
  //     'punto': '.', 'puno': '.',
  //     'coma': ',', 'punto y coma': ';', 'dos puntos': ':',
  //     'guion': '-', 'guion bajo': '_',
  //   };
  //   for (const [word, symbol] of Object.entries(punctuationWords)) {
  //     const regex = new RegExp(`\\s*${word}\\s*$`, 'i');
  //     if (regex.test(processed)) {
  //       processed = processed.replace(regex, symbol);
  //       console.log(`🔤 Reemplazo final: "${word}" → "${symbol}"`);
  //     }
  //   }

  //   let finalText = processed;

  //   // ============================================================
  //   // CAPITALIZACIÓN MANUAL (marcador §)
  //   // ============================================================
  //   let hasManualCapitalization = false;
  //   if (finalText.includes('§')) {
  //     finalText = finalText.replace(/§([a-zA-Záéíóúüñ])/g, (match, letter) => letter.toUpperCase());
  //     finalText = finalText.replace(/§/g, '');
  //     hasManualCapitalization = true;
  //     console.log(`🔤 Después de capitalización manual: "${finalText}"`);
  //   }

  //   // ============================================================
  //   // FILTROS POR CONTEXTO
  //   // ============================================================
  //   if (effectiveContext === 'username') {
  //     finalText = finalText.replace(/[^a-zA-Z0-9._@!?-]/g, '');
  //     finalText = finalText.replace(/\s/g, '');
  //     if (!hasManualCapitalization) {
  //       finalText = finalText.toLowerCase();
  //     }
  //   }

  //   if (effectiveContext === 'password') {
  //     finalText = finalText.replace(/\s/g, '');
  //   }

  //   // ============================================================
  //   // 🔥 EMAIL - PROCESAMIENTO CORREGIDO (sin duplicar .com)
  //   // ============================================================
  //   if (effectiveContext === 'email') {
  //     let email = this.processSpacedLetters(finalText);

  //     // Correcciones específicas
  //     email = email.replace(/\bde\s+ev\b/gi, 'dev');
  //     email = email.replace(/\bde\s+v\b/gi, 'dev');
  //     email = email.replace(/\bdeev\b/gi, 'dev');
  //     email = email.replace(/\bd\s+e\s+v\b/gi, 'dev');

  //     // Convertir palabras clave
  //     email = email
  //       .toLowerCase()
  //       .replace(/arroba/g, '@')
  //       .replace(/guion bajo/g, '_')
  //       .replace(/guion/g, '-')
  //       .replace(/espacio/g, ' ');

  //     // 🔥 CONVERTIR "punto [extension]" ANTES de cualquier otra cosa
  //     email = email
  //       .replace(/punto\s+com\b/gi, '.com')
  //       .replace(/punto\s+es\b/gi, '.es')
  //       .replace(/punto\s+cat\b/gi, '.cat')
  //       .replace(/punto\s+org\b/gi, '.org')
  //       .replace(/punto\s+net\b/gi, '.net')
  //       .replace(/punto\s+info\b/gi, '.info')
  //       .replace(/punto\s+eu\b/gi, '.eu')
  //       .replace(/punto\s+([a-z]{2,3})\b/gi, '.$1');

  //     // Ahora reemplazar "punto" suelto por "."
  //     email = email.replace(/\bpunto\b/gi, '.');

  //     // Limpiar espacios múltiples
  //     email = email.replace(/\s+/g, ' ').trim();

  //     // Normalizar dominios CONOCIDOS SOLO si NO tienen extensión
  //     email = email
  //       .replace(/\bgmail\b(?![.\s]*\w+)/gi, 'gmail.com')
  //       .replace(/\bhotmail\b(?![.\s]*\w+)/gi, 'hotmail.com')
  //       .replace(/\boutlook\b(?![.\s]*\w+)/gi, 'outlook.com')
  //       .replace(/\byahoo\b(?![.\s]*\w+)/gi, 'yahoo.com');

  //     // Eliminar espacios restantes
  //     email = email.replace(/\s/g, '');

  //     // Eliminar duplicados de extensión
  //     let previousEmail = '';
  //     let maxIterations = 10;
  //     while (previousEmail !== email && maxIterations > 0) {
  //       previousEmail = email;
  //       email = email
  //         .replace(/\.com\.com/g, '.com')
  //         .replace(/\.es\.es/g, '.es')
  //         .replace(/\.cat\.cat/g, '.cat')
  //         .replace(/\.org\.org/g, '.org')
  //         .replace(/\.net\.net/g, '.net')
  //         .replace(/\.info\.info/g, '.info')
  //         .replace(/\.eu\.eu/g, '.eu')
  //         .replace(/\.com\.es/g, '.es')
  //         .replace(/\.es\.com/g, '.es')
  //         .replace(/\.com\.org/g, '.org')
  //         .replace(/\.org\.com/g, '.org')
  //         .replace(/\.com\.net/g, '.net')
  //         .replace(/\.net\.com/g, '.net');
  //       maxIterations--;
  //     }

  //     // Eliminar puntos dobles
  //     email = email.replace(/\.\.+/g, '.');

  //     // Asegurar que solo hay un @
  //     const parts = email.split('@');
  //     if (parts.length > 2) {
  //       email = parts[0] + '@' + parts.slice(1).join('');
  //     }

  //     // Si hay @ pero no dominio, añadir .com
  //     if (email.includes('@') && !email.includes('.')) {
  //       email = email + '.com';
  //     }

  //     console.log(`🔤 Email final: "${email}"`);
  //     finalText = email;
  //   }

  //   // CONTEXTO 'text' (nombre propio y apellidos): separar apellidos compuestos
  //   if (!hasManualCapitalization && effectiveContext === 'text' && finalText.length > 0) {
  //     finalText = this.correctCompoundName(finalText);
  //     finalText = this.capitalizeWords(finalText);
  //   }

  //   const resultPartsArray = finalText.split(/\s+/);

  //   const result: DictationResult = {
  //     success: finalText.length > 0,
  //     text: finalText,
  //     originalText: original,
  //     processedText: finalText,
  //     parts: resultPartsArray.length > 1 ? resultPartsArray : undefined
  //   };

  //   console.log(`🔤 Dictado procesado: "${original}" → "${finalText}"`);
  //   return result;
  // }















  processDictationPhrase(text: string, context?: 'username' | 'password' | 'email' | 'text' | 'fullName', capitalize = true): DictationResult {
    let effectiveContext = context;
    if (context === 'fullName') effectiveContext = 'username';

    let processed = text.toLowerCase().trim();
    const original = processed;

    console.log('🔍 processDictationPhrase - Original:', original);

    // ✅ PROCESAR ESPACIOS PARA EMAIL
    if (effectiveContext === 'email') {
      processed = this.processSpacedLetters(processed);
    }

    processed = this.spellingService.applyCorrections(processed);
    console.log(`🔍 Después de correcciones del backend: "${processed}"`);

    processed = this.removeFinishWords(processed);
    processed = this.correctPhoneticErrors(processed);

    // ============================================================
    // 🔥 FILTRAR PALABRAS DE RELLENO (ANTES DE CAPITALIZAR)
    // ============================================================
    const removeWords = ['con', 'de', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'en', 'por', 'sin', 'para', 'a', 'ante', 'bajo', 'cabe', 'contra', 'desde', 'durante', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'según', 'sobre', 'tras', 'versus', 'vía'];

    const hasMayuscula = /mayúscula|mayuscula/i.test(processed);
    const hasMinuscula = /minúscula|minuscula/i.test(processed);

    if (hasMayuscula || hasMinuscula) {
      const words = processed.split(' ');
      let commandFound = false;
      const filtered: string[] = [];

      for (const word of words) {
        const lowerWord = word.toLowerCase();
        if (/^mayúscula$|^mayuscula$|^minúscula$|^minuscula$/i.test(lowerWord)) {
          commandFound = true;
          filtered.push(word);
        } else if (commandFound) {
          if (!removeWords.includes(lowerWord) && lowerWord.length > 0) {
            filtered.push(word);
          }
          if (!removeWords.includes(lowerWord)) {
            commandFound = false;
          }
        } else {
          filtered.push(word);
        }
      }

      processed = filtered.join(' ');
      console.log(`🔤 Después de filtrar palabras de relleno: "${processed}"`);
    }

    // ============================================================
    // CAPITALIZACIÓN MANUAL (AHORA DESPUÉS DEL FILTRO)
    // ============================================================
    processed = this.processCapitalizationCommands(processed);

    // ============================================================
    // 🔥 CORREGIR "d e v" → "dev" - UNA SOLA VEZ
    // ============================================================
    if (effectiveContext === 'email') {
      processed = processed.replace(/\bde\s+(?=[a-z])/gi, 'd ');
      processed = processed.replace(/\bde\b(?=\s+[a-z])/gi, 'd');
      processed = processed.replace(/\bde\s+v\b/gi, 'd v');
      processed = processed.replace(/\bd\s+e\s+v\b/gi, 'dev');
      processed = processed.replace(/\bde\s+ev\b/gi, 'dev');
      processed = processed.replace(/\bdeev\b/gi, 'dev');
      processed = processed.replace(/\bde\s+v\b/gi, 'dev');
      processed = processed.replace(/\bd e v\b/gi, 'dev');
    }

    // ============================================================
    // REEMPLAZOS DE NÚMEROS, ESPECIALES Y LETRAS
    // ============================================================
    const sortedNumberKeys = Object.keys(this.numberMap).sort((a, b) => b.length - a.length);
    for (const key of sortedNumberKeys) {
      processed = processed.replace(new RegExp(key, 'g'), this.numberMap[key]);
    }
    for (const [key, value] of Object.entries(this.specialMap)) {
      processed = processed.replace(new RegExp(key, 'g'), value);
    }
    for (const [key, value] of Object.entries(this.letterMap)) {
      processed = processed.replace(new RegExp(key, 'g'), value);
    }
    processed = this.processSpecialCharsFallback(processed);

    // ============================================================
    // LIMPIAR ACENTOS Y ESPACIOS
    // ============================================================
    processed = processed
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
      .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
      .replace(/\s+/g, ' ')
      .trim();

    // ============================================================
    // UNIR SOLO SECUENCIAS DE LETRAS SUELTAS
    // ============================================================
    const words = processed.split(/\s+/);
    const resultParts: string[] = [];
    let i = 0;

    while (i < words.length) {
      const current = words[i];
      if (current.length === 1 && /[a-zA-Z0-9]/.test(current)) {
        let letters = current;
        let j = i + 1;
        while (j < words.length && words[j].length === 1 && /[a-zA-Z0-9]/.test(words[j])) {
          letters += words[j];
          j++;
        }
        if (letters.length > 1) {
          resultParts.push(letters);
          i = j;
          continue;
        }
      }
      resultParts.push(current);
      i++;
    }
    processed = resultParts.join(' ');

    // ============================================================
    // REEMPLAZAR SIGNOS DE PUNTUACIÓN AL FINAL
    // ============================================================
    const punctuationWords: { [key: string]: string } = {
      'admiración': '!', 'exclamación': '!', 'admiracion': '!', 'exclamacion': '!',
      'interrogación': '?', 'interrogacion': '?',
      'punto': '.', 'puno': '.',
      'coma': ',', 'punto y coma': ';', 'dos puntos': ':',
      'guion': '-', 'guion bajo': '_',
    };
    for (const [word, symbol] of Object.entries(punctuationWords)) {
      const regex = new RegExp(`\\s*${word}\\s*$`, 'i');
      if (regex.test(processed)) {
        processed = processed.replace(regex, symbol);
        console.log(`🔤 Reemplazo final: "${word}" → "${symbol}"`);
      }
    }

    let finalText = processed;

    // ============================================================
    // CAPITALIZACIÓN MANUAL (marcador §)
    // ============================================================
    let hasManualCapitalization = false;
    if (finalText.includes('§')) {
      finalText = finalText.replace(/§([a-zA-Záéíóúüñ])/g, (match, letter) => letter.toUpperCase());
      finalText = finalText.replace(/§/g, '');
      hasManualCapitalization = true;
      console.log(`🔤 Después de capitalización manual: "${finalText}"`);
    }

    // ============================================================
    // FILTROS POR CONTEXTO
    // ============================================================
    // if (effectiveContext === 'username') {
    //   finalText = finalText.replace(/[^a-zA-Z0-9._@!?-]/g, '');
    //   finalText = finalText.replace(/\s/g, '');
    //   if (!hasManualCapitalization) {
    //     finalText = finalText.toLowerCase();
    //   }
    // }

    // if (effectiveContext === 'password') {
    //   finalText = finalText.replace(/\s/g, '');
    // }



    if (effectiveContext === 'username') {
      finalText = finalText.replace(/[^a-zA-Z0-9._@!?-]/g, '');
      finalText = finalText.replace(/\s/g, '');
      if (!hasManualCapitalization) {
        finalText = finalText.toLowerCase();
      }
    }

    if (effectiveContext === 'password') {
      // ✅ Eliminar guiones automáticos entre letra y número (ej. "Cornella-56" → "Cornella56")
      finalText = finalText.replace(/([a-zA-Z])\-(\d)/g, '$1$2');
      // ✅ Eliminar guiones automáticos entre número y letra (ej. "56-Cornella" → "56Cornella")
      finalText = finalText.replace(/(\d)\-([a-zA-Z])/g, '$1$2');
      // ✅ Eliminar espacios
      finalText = finalText.replace(/\s/g, '');
    }

    // ============================================================
    // 🔥 EMAIL - PROCESAMIENTO CORREGIDO (sin duplicar .com)
    // ============================================================
    // if (effectiveContext === 'email') {
    //   let email = this.processSpacedLetters(finalText);

    //   // ✅ NUEVA CORRECCIÓN: "e uve" → "ev" (para gamosadev@gmail.com)
    //   email = email
    //     .replace(/e\s+uve/g, 'ev')
    //     .replace(/e\s+ube/g, 'ev')
    //     .replace(/eube/g, 'ev')
    //     .replace(/é\s+uve/g, 'ev')
    //     .replace(/e\s+v\b/g, 'ev');

    //   // Correcciones específicas
    //   email = email.replace(/\bde\s+ev\b/gi, 'dev');
    //   email = email.replace(/\bde\s+v\b/gi, 'dev');
    //   email = email.replace(/\bdeev\b/gi, 'dev');
    //   email = email.replace(/\bd\s+e\s+v\b/gi, 'dev');

    //   // Convertir palabras clave
    //   email = email
    //     .toLowerCase()
    //     .replace(/arroba/g, '@')
    //     .replace(/guion bajo/g, '_')
    //     .replace(/guion/g, '-')
    //     .replace(/espacio/g, ' ');

    //   // 🔥 CONVERTIR "punto [extension]" ANTES de cualquier otra cosa
    //   email = email
    //     .replace(/punto\s+com\b/gi, '.com')
    //     .replace(/punto\s+es\b/gi, '.es')
    //     .replace(/punto\s+cat\b/gi, '.cat')
    //     .replace(/punto\s+org\b/gi, '.org')
    //     .replace(/punto\s+net\b/gi, '.net')
    //     .replace(/punto\s+info\b/gi, '.info')
    //     .replace(/punto\s+eu\b/gi, '.eu')
    //     .replace(/punto\s+([a-z]{2,3})\b/gi, '.$1');

    //   // Ahora reemplazar "punto" suelto por "."
    //   email = email.replace(/\bpunto\b/gi, '.');

    //   // Limpiar espacios múltiples
    //   email = email.replace(/\s+/g, ' ').trim();

    //   // Normalizar dominios CONOCIDOS SOLO si NO tienen extensión
    //   email = email
    //     .replace(/\bgmail\b(?![.\s]*\w+)/gi, 'gmail.com')
    //     .replace(/\bhotmail\b(?![.\s]*\w+)/gi, 'hotmail.com')
    //     .replace(/\boutlook\b(?![.\s]*\w+)/gi, 'outlook.com')
    //     .replace(/\byahoo\b(?![.\s]*\w+)/gi, 'yahoo.com');

    //   // Eliminar espacios restantes
    //   email = email.replace(/\s/g, '');

    //   // Eliminar duplicados de extensión
    //   let previousEmail = '';
    //   let maxIterations = 10;
    //   while (previousEmail !== email && maxIterations > 0) {
    //     previousEmail = email;
    //     email = email
    //       .replace(/\.com\.com/g, '.com')
    //       .replace(/\.es\.es/g, '.es')
    //       .replace(/\.cat\.cat/g, '.cat')
    //       .replace(/\.org\.org/g, '.org')
    //       .replace(/\.net\.net/g, '.net')
    //       .replace(/\.info\.info/g, '.info')
    //       .replace(/\.eu\.eu/g, '.eu')
    //       .replace(/\.com\.es/g, '.es')
    //       .replace(/\.es\.com/g, '.es')
    //       .replace(/\.com\.org/g, '.org')
    //       .replace(/\.org\.com/g, '.org')
    //       .replace(/\.com\.net/g, '.net')
    //       .replace(/\.net\.com/g, '.net');
    //     maxIterations--;
    //   }

    //   // Eliminar puntos dobles
    //   email = email.replace(/\.\.+/g, '.');

    //   // Asegurar que solo hay un @
    //   const parts = email.split('@');
    //   if (parts.length > 2) {
    //     email = parts[0] + '@' + parts.slice(1).join('');
    //   }

    //   // Si hay @ pero no dominio, añadir .com
    //   if (email.includes('@') && !email.includes('.')) {
    //     email = email + '.com';
    //   }

    //   console.log(`🔤 Email final: "${email}"`);
    //   finalText = email;
    // }




    if (effectiveContext === 'email') {
      let email = this.processSpacedLetters(finalText);

      // ✅ CORRECCIÓN: "e uve" → "ev" (para gamosadev@gmail.com)
      email = email
        .replace(/e\s+uve/g, 'ev')
        .replace(/e\s+ube/g, 'ev')
        .replace(/eube/g, 'ev')
        .replace(/é\s+uve/g, 'ev')
        .replace(/e\s+v\b/g, 'ev');

      // Correcciones específicas (de, ev, etc.)
      email = email.replace(/\bde\s+ev\b/gi, 'dev');
      email = email.replace(/\bde\s+v\b/gi, 'dev');
      email = email.replace(/\bdeev\b/gi, 'dev');
      email = email.replace(/\bd\s+e\s+v\b/gi, 'dev');

      // Convertir palabras clave
      email = email
        .toLowerCase()
        .replace(/arroba/g, '@')
        .replace(/guion bajo/g, '_')
        .replace(/guion/g, '-')
        .replace(/espacio/g, ' ');

      // 🔥 CONVERTIR "punto [extension]" SOLO si se dice explícitamente
      email = email
        .replace(/punto\s+com\b/gi, '.com')
        .replace(/punto\s+es\b/gi, '.es')
        .replace(/punto\s+cat\b/gi, '.cat')
        .replace(/punto\s+org\b/gi, '.org')
        .replace(/punto\s+net\b/gi, '.net')
        .replace(/punto\s+info\b/gi, '.info')
        .replace(/punto\s+eu\b/gi, '.eu')
        .replace(/punto\s+([a-z]{2,3})\b/gi, '.$1');

      // Ahora reemplazar "punto" suelto por "."
      email = email.replace(/\bpunto\b/gi, '.');

      // Limpiar espacios múltiples
      email = email.replace(/\s+/g, ' ').trim();

      // ❌ ELIMINADO: No normalizar dominios automáticamente
      // email = email
      //   .replace(/\bgmail\b(?![.\s]*\w+)/gi, 'gmail.com')
      //   .replace(/\bhotmail\b(?![.\s]*\w+)/gi, 'hotmail.com')
      //   .replace(/\boutlook\b(?![.\s]*\w+)/gi, 'outlook.com')
      //   .replace(/\byahoo\b(?![.\s]*\w+)/gi, 'yahoo.com');

      // Eliminar espacios restantes
      email = email.replace(/\s/g, '');

      // Eliminar duplicados de extensión (solo si el usuario dijo una extensión)
      let previousEmail = '';
      let maxIterations = 10;
      while (previousEmail !== email && maxIterations > 0) {
        previousEmail = email;
        email = email
          .replace(/\.com\.com/g, '.com')
          .replace(/\.es\.es/g, '.es')
          .replace(/\.cat\.cat/g, '.cat')
          .replace(/\.org\.org/g, '.org')
          .replace(/\.net\.net/g, '.net')
          .replace(/\.info\.info/g, '.info')
          .replace(/\.eu\.eu/g, '.eu')
          .replace(/\.com\.es/g, '.es')
          .replace(/\.es\.com/g, '.es')
          .replace(/\.com\.org/g, '.org')
          .replace(/\.org\.com/g, '.org')
          .replace(/\.com\.net/g, '.net')
          .replace(/\.net\.com/g, '.net');
        maxIterations--;
      }

      // Eliminar puntos dobles
      email = email.replace(/\.\.+/g, '.');

      // Asegurar que solo hay un @
      const parts = email.split('@');
      if (parts.length > 2) {
        email = parts[0] + '@' + parts.slice(1).join('');
      }

      // ❌ ELIMINADO: No añadir .com automáticamente
      // if (email.includes('@') && !email.includes('.')) {
      //   email = email + '.com';
      // }

      console.log(`🔤 Email final: "${email}"`);
      finalText = email;
    }

    // CONTEXTO 'text' (nombre propio y apellidos): separar apellidos compuestos
    if (!hasManualCapitalization && effectiveContext === 'text' && finalText.length > 0) {
      finalText = this.correctCompoundName(finalText);
      finalText = this.capitalizeWords(finalText);
    }

    const resultPartsArray = finalText.split(/\s+/);

    const result: DictationResult = {
      success: finalText.length > 0,
      text: finalText,
      originalText: original,
      processedText: finalText,
      parts: resultPartsArray.length > 1 ? resultPartsArray : undefined
    };

    console.log(`🔤 Dictado procesado: "${original}" → "${finalText}"`);
    return result;
  }














  //
  private removeConsecutiveDuplicates(text: string): string {
    if (!text || text.length < 2) return text;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      if (i === 0 || text[i] !== text[i - 1]) {
        result += text[i];
      }
    }
    return result;
  }

  private normalizeSpacedLetters(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return trimmed;
    const cleaned = trimmed.replace(/[^a-zA-Záéíóúüñ\s]/g, '');
    const words = cleaned.split(/\s+/);
    if (words.every(w => w.length === 1 && /[a-zA-Záéíóúüñ]/.test(w))) {
      return words.join('');
    }
    return cleaned;
  }

  // ============================================================
  // MÉTODOS DE FINALIZACIÓN (VERSIÓN MEJORADA)
  // ============================================================

  // removeFinishWords(text: string): string {
  //   let clean = text;
  //   for (const word of this.finishWords) {
  //     // Eliminar la palabra al final de la frase
  //     const regex = new RegExp(`\\s*${word}\\s*$`, 'gi');
  //     clean = clean.replace(regex, '');
  //     // También eliminar si está al principio o en medio (menos común)
  //     const regexMiddle = new RegExp(`\\b${word}\\b`, 'gi');
  //     clean = clean.replace(regexMiddle, '');
  //   }
  //   return clean.replace(/\s+/g, ' ').trim();
  // }





  // voice-filter.service.ts - removeFinishWords() MEJORADO

  removeFinishWords(text: string): string {
    let clean = text;
    
    // ✅ Eliminar "fin" o "terminar" al final de la frase
    clean = clean.replace(/\s+(fin|terminar)$/i, '');
    
    // ✅ Eliminar "fin" o "terminar" al principio de la frase
    clean = clean.replace(/^(fin|terminar)\s+/i, '');
    
    // ✅ Eliminar "fin" o "terminar" en medio de la frase
    clean = clean.replace(/\s+(fin|terminar)\s+/gi, ' ');
    
    // ✅ Eliminar "fin" o "terminar" como palabra completa en cualquier posición
    clean = clean.replace(/\b(fin|terminar)\b/gi, '');
    
    // ✅ Limpiar espacios extras
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
  }


  
  
  
  
  // containsFinishWords(text: string): boolean {
  //   const normalized = text.toLowerCase().trim();
    
  //   // ✅ Si el texto es exactamente una palabra de finalización
  //   if (this.finishWords.includes(normalized)) {
  //     return true;
  //   }
    
  //   // ✅ Si el texto contiene una palabra de finalización como palabra completa
  //   // en cualquier posición (principio, medio o final)
  //   return this.finishWords.some(word => {
  //     // Palabra exacta
  //     if (normalized === word) return true;
  //     // Empieza con "palabra "
  //     if (normalized.startsWith(word + ' ')) return true;
  //     // Termina con " palabra"
  //     if (normalized.endsWith(' ' + word)) return true;
  //     // Contiene " palabra " en medio
  //     if (normalized.includes(' ' + word + ' ')) return true;
  //     return false;
  //   });
  // }






  // voice-filter.service.ts - containsFinishWords() CORREGIDO

  containsFinishWords(text: string): boolean {
    const normalized = text.toLowerCase().trim();
    
    // Si el texto es exactamente "fin" o "terminar"
    if (normalized === 'fin' || normalized === 'terminar') {
      return true;
    }
    
    // ✅ Si el texto termina con " fin" o " terminar" (CORREGIDO)
    if (normalized.endsWith(' fin') || normalized.endsWith(' terminar')) {
      return true;
    }
    
    // ✅ Si el texto empieza con "fin " o "terminar "
    if (normalized.startsWith('fin ') || normalized.startsWith('terminar ')) {
      return true;
    }
    
    // ✅ Si el texto contiene " fin " o " terminar "
    if (normalized.includes(' fin ') || normalized.includes(' terminar ')) {
      return true;
    }
    
    // ✅ Usar regex para palabras completas (más robusto)
    const finishRegex = /\b(fin|terminar)\b/;
    return finishRegex.test(normalized);
  }





  getFinishWords(): string[] {
    return [...this.finishWords];
  }

  // ============================================================
  // COMANDOS COMUNES
  // ============================================================

  isClearCommand(text: string): boolean { return this.commonSynonyms.clear.some(s => text.toLowerCase().includes(s)); }
  isCancelCommand(text: string): boolean { return this.commonSynonyms.cancel.some(s => text.toLowerCase().includes(s)); }
  isConfirmCommand(text: string): boolean { return this.commonSynonyms.confirm.some(s => text.toLowerCase().includes(s)); }
  isRejectCommand(text: string): boolean { return this.commonSynonyms.reject.some(s => text.toLowerCase().includes(s)); }
  isHelpCommand(text: string): boolean { return this.commonSynonyms.help.some(s => text.toLowerCase().includes(s)); }
  isBackCommand(text: string): boolean { return this.commonSynonyms.back.some(s => text.toLowerCase().includes(s)); }
  isSubmitCommand(text: string): boolean { return this.commonSynonyms.submit.some(s => text.toLowerCase().includes(s)); }

  getSynonymsFor(command: keyof typeof this.commonSynonyms): string[] {
    return this.commonSynonyms[command] || [];
  }

  getCommonCommands(): { [key: string]: string[] } {
    return { ...this.commonSynonyms };
  }

  // ============================================================
  // UTILITARIOS
  // ============================================================

  isValidVoiceCommand(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const allCommands = [
      ...this.commonSynonyms.clear,
      ...this.commonSynonyms.cancel,
      ...this.commonSynonyms.confirm,
      ...this.commonSynonyms.reject,
      ...this.commonSynonyms.help,
      ...this.commonSynonyms.back,
      ...this.commonSynonyms.submit
    ];
    return allCommands.some(cmd => lower.includes(cmd));
  }

  getCommandType(text: string): string | null {
    const lower = text.toLowerCase().trim();
    if (this.isClearCommand(lower)) return 'clear';
    if (this.isCancelCommand(lower)) return 'cancel';
    if (this.isConfirmCommand(lower)) return 'confirm';
    if (this.isRejectCommand(lower)) return 'reject';
    if (this.isHelpCommand(lower)) return 'help';
    if (this.isBackCommand(lower)) return 'back';
    if (this.isSubmitCommand(lower)) return 'submit';
    return null;
  }

  // ============================================================
  // PROCESAMIENTO DE COMANDOS
  // ============================================================

  processCommand(
    text: string,
    context: VoiceCommandContext,
    currentField?: string | null,
    isDictating?: boolean
  ): VoiceCommandResult {
    const lower = text.toLowerCase().trim();

    if (context.customCommands) {
      for (const [key, handler] of Object.entries(context.customCommands)) {
        if (lower.includes(key)) {
          const result = handler(lower);
          if (result !== undefined) {
            return { handled: true, action: 'custom' };
          }
        }
      }
    }

    if (this.isHelpCommand(lower)) {
      return { handled: true, action: 'help', message: this.buildHelpMessage(context) };
    }

    if (this.isClearCommand(lower)) {
      if (context.onClear) context.onClear();
      return { handled: true, action: 'clear', message: 'Campos limpiados' };
    }

    if (this.isCancelCommand(lower)) {
      if (context.onCancel) context.onCancel();
      return { handled: true, action: 'cancel', message: 'Operación cancelada' };
    }

    if (this.isBackCommand(lower)) {
      if (context.onNavigate) context.onNavigate('/');
      return { handled: true, action: 'back', message: 'Volviendo atrás' };
    }

    if (this.isSubmitCommand(lower)) {
      if (context.onSubmit) context.onSubmit();
      return { handled: true, action: 'submit', message: 'Enviando...' };
    }

    if (isDictating && currentField) {
      return this.processDictationCommand(lower, currentField, context);
    }

    const fieldCommand = this.findFieldCommand(lower, context);
    if (fieldCommand) {
      return {
        handled: true,
        action: 'dictate',
        target: fieldCommand.field,
        message: `Dictando para ${fieldCommand.label}`
      };
    }

    const quickCommand = this.findQuickCommand(lower, context);
    if (quickCommand) {
      return {
        handled: true,
        action: 'dictate',
        target: quickCommand.field,
        value: quickCommand.value,
        message: `${quickCommand.label} completado`
      };
    }

    return { handled: false, message: 'No entendí el comando' };
  }

  private processDictationCommand(
    text: string,
    fieldName: string,
    context: VoiceCommandContext
  ): VoiceCommandResult {
    const field = context.fields.find(f => f.name === fieldName);
    if (!field) {
      return { handled: false, action: 'dictate', target: fieldName };
    }

    if (this.containsFinishWords(text)) {
      const cleanText = this.removeFinishWords(text);
      let finalValue = cleanText;
      if (field.type === 'email') {
        finalValue = this.processDictationPhrase(cleanText, 'email', false).text;
      } else if (field.type === 'password') {
        finalValue = this.processDictationPhrase(cleanText, 'password', false).text;
      } else {
        finalValue = this.processDictationPhrase(cleanText, 'text', true).text;
      }
      return {
        handled: true,
        action: 'dictate',
        target: fieldName,
        value: finalValue,
        message: `Dictado finalizado: ${finalValue}`,
        isFinish: true
      };
    }

    if (text.includes('borrar') || text.includes('eliminar')) {
      return { handled: true, action: 'dictate', target: fieldName, value: '__DELETE__', message: 'Borrado' };
    }

    if (text.includes('limpiar todo') || text.includes('borrar todo')) {
      return { handled: true, action: 'dictate', target: fieldName, value: '__CLEAR__', message: 'Campo limpiado' };
    }

    if (text.includes('mostrar') || text.includes('ver') || text.includes('leer')) {
      return { handled: true, action: 'dictate', target: fieldName, value: '__SHOW__', message: 'Mostrando valor actual' };
    }

    let processedText = text;
    if (field.type === 'email') {
      processedText = this.processDictationPhrase(text, 'email', false).text;
    } else if (field.type === 'password') {
      processedText = this.processDictationPhrase(text, 'password', false).text;
    } else {
      processedText = this.processDictationPhrase(text, 'text', true).text;
    }

    if (!processedText || processedText === text) {
      processedText = this.convertPhraseToText(text);
    }

    return {
      handled: true,
      action: 'dictate',
      target: fieldName,
      value: processedText,
      message: `Añadido: ${processedText}`
    };
  }

  private findFieldCommand(text: string, context: VoiceCommandContext): { field: string; label: string } | null {
    for (const field of context.fields) {
      for (const synonym of field.synonyms) {
        if (text === synonym || text.includes(synonym + ' ') || text.includes(' ' + synonym)) {
          return { field: field.name, label: field.label };
        }
      }
    }
    return null;
  }

  private findQuickCommand(text: string, context: VoiceCommandContext): { field: string; label: string; value: string } | null {
    for (const field of context.fields) {
      const pattern = new RegExp(`^(${field.synonyms.join('|')})\\s+(.+)$`);
      const match = text.match(pattern);
      if (match) {
        return { field: field.name, label: field.label, value: match[2].trim() };
      }
    }
    return null;
  }

  private buildHelpMessage(context: VoiceCommandContext): string {
    const fieldNames = context.fields.map(f => `"${f.synonyms[0]}"`).join('", "');
    let message = `Puedes decir el nombre del campo para escribir: "${fieldNames}". `;
    if (context.onSubmit) message += 'Di "enviar" o "login" para continuar. ';
    if (context.onClear) message += 'Di "limpiar" para borrar los campos. ';
    if (context.onCancel) message += 'Di "cancelar" para cancelar. ';
    message += 'Di "ayuda" para repetir estos comandos.';
    return message;
  }

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================

  configure(options: { exactDuplicateDelay?: number; similarDuplicateDelay?: number; similarityThreshold?: number; }): void {
    if (options.exactDuplicateDelay !== undefined) this.exactDuplicateDelay = options.exactDuplicateDelay;
    if (options.similarDuplicateDelay !== undefined) this.similarDuplicateDelay = options.similarDuplicateDelay;
    if (options.similarityThreshold !== undefined) this.similarityThreshold = options.similarityThreshold;
    this.logger.debug('⚙️ VoiceFilterService configurado:', {
      exactDuplicateDelay: this.exactDuplicateDelay,
      similarDuplicateDelay: this.similarDuplicateDelay,
      similarityThreshold: this.similarityThreshold
    });
  }

  getConfig() {
    return {
      exactDuplicateDelay: this.exactDuplicateDelay,
      similarDuplicateDelay: this.similarDuplicateDelay,
      similarityThreshold: this.similarityThreshold
    };
  }

  reset(): void {
    this.lastProcessedText = '';
    this.lastProcessedTime = 0;
    this.logger.debug('🔄 Filtro de voz reiniciado');
  }
}