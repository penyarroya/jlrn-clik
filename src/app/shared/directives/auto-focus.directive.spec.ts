// import { AutoFocusDirective } from './auto-focus.directive';

// describe('AutoFocusDirective', () => {
//   it('should create an instance', () => {
//     const directive = new AutoFocusDirective();
//     expect(directive).toBeTruthy();
//   });
// });






import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AutoFocusDirective } from './auto-focus.directive';

@Component({
  selector: 'app-test',
  template: `<input autoFocus>`,
  standalone: true,  // ← Añadir standalone
  imports: [AutoFocusDirective]  // ← Importar la directiva aquí
})
class TestComponent {}

describe('AutoFocusDirective', () => {
  it('should create an instance', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent]  // ← Solo imports, sin declarations
    }).createComponent(TestComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});