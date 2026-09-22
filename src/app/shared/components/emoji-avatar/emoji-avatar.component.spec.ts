import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiAvatarComponent } from './emoji-avatar.component';

describe('EmojiAvatarComponent', () => {
  let component: EmojiAvatarComponent;
  let fixture: ComponentFixture<EmojiAvatarComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EmojiAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
