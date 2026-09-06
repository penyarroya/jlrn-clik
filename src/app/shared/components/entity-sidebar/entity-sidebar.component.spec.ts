import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitySidebarComponent } from './entity-sidebar.component';

describe('EntitySidebarComponent', () => {
  let component: EntitySidebarComponent;
  let fixture: ComponentFixture<EntitySidebarComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
