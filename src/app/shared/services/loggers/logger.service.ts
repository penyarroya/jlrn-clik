// // core/services/logger.service.ts
// import { Injectable } from '@angular/core';
// import { environment } from '../../../../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class LoggerService {
//   log(...args: any[]): void {
//     if (environment.enableLogs) {
//       console.log(...args);
//     }
//   }

//   error(...args: any[]): void {
//     if (environment.enableLogs) {
//       console.error(...args);
//     }
//   }

//   warn(...args: any[]): void {
//     if (environment.enableLogs) {
//       console.warn(...args);
//     }
//   }

//   info(...args: any[]): void {
//     if (environment.enableLogs) {
//       console.info(...args);
//     }
//   }
// }




// src/core/services/logger.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isEnabled = environment.enableLogs !== false;

  log(...args: any[]): void {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  error(...args: any[]): void {
    if (this.isEnabled) {
      console.error(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  // Para logs de desarrollo con más detalle
  debug(...args: any[]): void {
    if (this.isEnabled && !environment.production) {
      console.debug(...args);
    }
  }

  // Para logs de rendimiento
  time(label: string): void {
    if (this.isEnabled && !environment.production) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isEnabled && !environment.production) {
      console.timeEnd(label);
    }
  }

  group(label: string): void {
    if (this.isEnabled && !environment.production) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isEnabled && !environment.production) {
      console.groupEnd();
    }
  }
}