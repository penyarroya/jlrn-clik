// import { Pipe, PipeTransform } from '@angular/core';

// @Pipe({
//   name: 'filterByNextClass'
// })
// export class FilterByNextClassPipe implements PipeTransform {

//   transform(value: unknown, ...args: unknown[]): unknown {
//     return null;
//   }

// }







import { Pipe, PipeTransform } from '@angular/core';

// Definimos la interfaz Course para tipado
interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started' | 'pending';
  nextClass?: Date;
  category: string;
  thumbnail?: string;
}

@Pipe({
  name: 'filterByNextClass'
})
export class FilterByNextClassPipe implements PipeTransform {

  transform(courses: Course[]): Course[] {
    // Si no hay cursos o está vacío, devolvemos array vacío
    if (!courses || courses.length === 0) {
      return [];
    }
    
    // Filtramos solo los cursos que tienen próxima clase (nextClass no es undefined ni null)
    return courses.filter(course => course.nextClass !== undefined && course.nextClass !== null);
  }

}