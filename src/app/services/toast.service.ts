import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastSubject = new Subject<ToastMessage>();
  private counter = 0;

  readonly toast$ = this.toastSubject.asObservable();

  success(text: string) {
    this.emit('success', text);
  }

  error(text: string) {
    this.emit('error', text);
  }

  info(text: string) {
    this.emit('info', text);
  }

  private emit(type: ToastType, text: string) {
    this.counter += 1;
    this.toastSubject.next({ id: this.counter, type, text });
  }
}
