// import { Service } from '@angular/core';

// @Service()
// export class RoleService {
// }



import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  // Construye la URL utilizando apiV1 ('/api/v1') + '/roles'
  private apiUrl = `${environment.apiGateway}${environment.apiV1}/roles`;

  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}