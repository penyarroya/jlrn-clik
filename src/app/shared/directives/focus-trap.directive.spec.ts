// import { FocusTrapDirective } from './focus-trap.directive';

// describe('FocusTrapDirective', () => {
//   it('should create an instance', () => {
//     const directive = new FocusTrapDirective();
//     expect(directive).toBeTruthy();
//   });
// });






import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FocusTrapDirective } from './focus-trap.directive';

@Component({
  selector: 'app-test',
  template: `<div focusTrap></div>`,
  standalone: true,
  imports: [FocusTrapDirective]
})
class TestComponent {}

describe('FocusTrapDirective', () => {
  it('should create an instance', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent]
    }).createComponent(TestComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
