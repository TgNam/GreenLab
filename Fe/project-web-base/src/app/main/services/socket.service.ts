import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket;

  constructor(url: string) {
    this.socket = io(url);
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  // Method to listen for events from the server using Observables
  on(event: string): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on(event, (data) => {
        observer.next(data);
      });
    });
  }

}