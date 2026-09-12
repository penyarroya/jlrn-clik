// import { DisableAutofillDirective } from './disable-autofill.directive';

// describe('DisableAutofillDirective', () => {
//   it('should create an instance', () => {
//     const directive = new DisableAutofillDirective();
//     expect(directive).toBeTruthy();
//   });
// });






import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DisableAutofillDirective } from './disable-autofill.directive';

@Component({
  selector: 'app-test',
  template: `<input disableAutofill>`,
  standalone: true,
  imports: [DisableAutofillDirective]
})
class TestComponent {}

describe('DisableAutofillDirective', () => {
  it('should create an instance', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent]
    }).createComponent(TestComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
