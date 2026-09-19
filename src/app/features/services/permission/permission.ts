import { inject, Service } from '@angular/core';   // ← quitar Injectable
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Service()
export class PermissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiGateway}${environment.apiV1}/permissions`;

  getAllPermissions(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}