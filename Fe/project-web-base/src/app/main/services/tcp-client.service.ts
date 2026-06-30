import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface TcpStatusResponse {
  connected: boolean;
}

export interface TcpSendResponse {
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TcpClientService {
  private readonly baseUrl: string;
  private eventSource: EventSource | null = null;
  private receivedMessages$ = new Subject<string>();

  constructor(private http: HttpClient) {
    this.baseUrl = (environment as any).tcpClientUrl || 'http://localhost:5000';
  }

  /**
   * Kiểm tra trạng thái kết nối TCP tới WinForms.
   */
  getStatus(): Observable<{ connected: boolean; available: boolean }> {
    return this.http.get<TcpStatusResponse>(`${this.baseUrl}/tcp/status`).pipe(
      map(res => ({ connected: res?.connected ?? false, available: true })),
      catchError(() => of({ connected: false, available: false }))
    );
  }

  /**
   * Gửi message qua TCP tới WinForms.
   */
  send(message: string): Observable<TcpSendResponse> {
    return this.http.post<TcpSendResponse>(`${this.baseUrl}/tcp/send`, { message });
  }

  /**
   * Kết nối thủ công (nếu TCP Client chưa kết nối).
   */
  connect(): Observable<TcpSendResponse> {
    return this.http.post<TcpSendResponse>(`${this.baseUrl}/tcp/connect`, {});
  }

  /**
   * Subscribe nhận message từ WinForms (qua TCP Client SSE).
   * Gọi subscribeToReceivedMessages() khi vào trang, unsubscribe khi rời.
   */
  subscribeToReceivedMessages(): Observable<string> {
    if (this.eventSource) {
      return this.receivedMessages$.asObservable();
    }
    const url = `${this.baseUrl}/tcp/events`;
    this.eventSource = new EventSource(url);
    this.eventSource.onmessage = (ev) => {
      const msg = ev?.data ?? '';
      if (msg && msg !== 'connected') {
        this.receivedMessages$.next(msg);
      }
    };
    this.eventSource.onerror = () => {
      // Không đóng EventSource - trình duyệt sẽ tự reconnect khi TCP Client chạy lại
      // Chỉ đóng khi gọi unsubscribeFromReceivedMessages() (rời trang)
    };
    return this.receivedMessages$.asObservable();
  }

  /**
   * Ngắt kết nối SSE khi rời trang.
   */
  unsubscribeFromReceivedMessages(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
