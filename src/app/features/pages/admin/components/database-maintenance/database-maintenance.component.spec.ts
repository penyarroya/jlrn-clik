import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseMaintenanceComponent } from './database-maintenance.component';

describe('DatabaseMaintenanceComponent', () => {
  let component: DatabaseMaintenanceComponent;
  let fixture: ComponentFixture<DatabaseMaintenanceComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
