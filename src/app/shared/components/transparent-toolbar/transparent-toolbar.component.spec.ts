import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransparentToolbarComponent } from './transparent-toolbar.component';

describe('TransparentToolbarComponent', () => {
  let component: TransparentToolbarComponent;
  let fixture: ComponentFixture<TransparentToolbarComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TransparentToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
