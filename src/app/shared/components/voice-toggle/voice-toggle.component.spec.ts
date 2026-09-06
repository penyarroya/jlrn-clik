import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceToggleComponent } from './voice-toggle.component';

describe('VoiceToggleComponent', () => {
  let component: VoiceToggleComponent;
  let fixture: ComponentFixture<VoiceToggleComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VoiceToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
