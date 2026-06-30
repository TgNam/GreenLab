import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { TcpClientService } from './tcp-client.service';

const MSG_TCP_UNAVAILABLE = 'TCP Client chưa chạy. Vui lòng khởi động TCP Client.';
const MSG_TCP_CONNECT_DEFAULT = 'Không thể kết nối TCP Client.';
const MSG_SEND_CONNECT_DEFAULT = 'Gửi lệnh kết nối thất bại';
const MSG_SEND_DIAL_DEFAULT = 'Gửi lệnh gọi lại thất bại';

export type TcpFlowErrorKey =
  | 'tcp_unavailable'
  | 'tcp_connect_failed'
  | 'tcp_send_failed'
  | 'empty_phone';

/**
 * Kết quả một luồng TCP (CONNECT softphone hoặc quay số).
 * {@link ok} === true: đã sẵn sàng / đã gửi lệnh thành công.
 */
export interface TcpFlowResult {
  ok: boolean;
  /** true khi vừa gửi {@code send('CONNECT')} thành công (trước đó chưa connected). */
  didSendConnect?: boolean;
  errorKey?: TcpFlowErrorKey;
  message?: string;
}

/**
 * Gom luồng kiểm tra TCP Client + connect + gửi lệnh (CONNECT / quay số),
 * dùng chung giữa màn đơn hàng BN và quản lý cuộc gọi.
 */
@Injectable({
  providedIn: 'root'
})
export class TcpSoftphoneFlowService {
  constructor(private tcp: TcpClientService) {}

  /**
   * Đảm bảo kết nối softphone: kiểm tra status → nếu cần thì {@link TcpClientService#connect} rồi {@code send('CONNECT')}.
   * Nếu đã connected: trả về {@code ok: true} (không gửi lại CONNECT), {@code didSendConnect: false}.
   */
  connectSoftphone(): Observable<TcpFlowResult> {
    return this.tcp.getStatus().pipe(
      switchMap(status => {
        if (!status.available) {
          return of<TcpFlowResult>({
            ok: false,
            errorKey: 'tcp_unavailable',
            message: MSG_TCP_UNAVAILABLE
          });
        }
        if (status.connected) {
          return of<TcpFlowResult>({ ok: true, didSendConnect: false });
        }
        return this.tcp.connect().pipe(
          switchMap(() =>
            this.tcp.send('CONNECT').pipe(
              map((): TcpFlowResult => ({ ok: true, didSendConnect: true })),
              catchError(
                (err): Observable<TcpFlowResult> =>
                  of({
                    ok: false,
                    errorKey: 'tcp_send_failed',
                    message: TcpSoftphoneFlowService.msgOrDefault(err, MSG_SEND_CONNECT_DEFAULT)
                  })
              )
            )
          ),
          catchError(
            (err): Observable<TcpFlowResult> =>
              of({
                ok: false,
                errorKey: 'tcp_connect_failed',
                message: TcpSoftphoneFlowService.msgOrDefault(err, MSG_TCP_CONNECT_DEFAULT)
              })
          )
        );
      })
    );
  }

  /**
   * Gửi lệnh quay số {@code $}{@code phone} (giống {@code sendRecallCommand} trên call-management).
   * @param onDialSuccess gọi sau khi {@code send} thành công (vd: đánh dấu callback).
   */
  dialPhone(
    phone: string,
    options?: { onDialSuccess?: () => void }
  ): Observable<TcpFlowResult> {
    const trimmed = (phone || '').trim();
    if (!trimmed) {
      return of<TcpFlowResult>({
        ok: false,
        errorKey: 'empty_phone',
        message: 'Vui lòng nhập số điện thoại cần gọi lại.'
      });
    }

    return this.tcp.getStatus().pipe(
      switchMap(status => {
        if (!status.available) {
          return of<TcpFlowResult>({
            ok: false,
            errorKey: 'tcp_unavailable',
            message: MSG_TCP_UNAVAILABLE
          });
        }

        const doSend = () =>
          this.tcp.send(`$${trimmed}`).pipe(
            map((): TcpFlowResult => {
              try {
                options?.onDialSuccess?.();
              } catch (e) {
                console.error(e);
              }
              return { ok: true };
            }),
            catchError(
              (err): Observable<TcpFlowResult> =>
                of({
                  ok: false,
                  errorKey: 'tcp_send_failed',
                  message: TcpSoftphoneFlowService.msgOrDefault(err, MSG_SEND_DIAL_DEFAULT)
                })
            )
          );

        if (!status.connected) {
          return this.tcp.connect().pipe(
            switchMap(() => doSend()),
            catchError(
              (err): Observable<TcpFlowResult> =>
                of({
                  ok: false,
                  errorKey: 'tcp_connect_failed',
                  message: TcpSoftphoneFlowService.msgOrDefault(err, MSG_TCP_CONNECT_DEFAULT)
                })
            )
          );
        }

        return doSend();
      })
    );
  }

  private static msgOrDefault(err: any, fallback: string): string {
    const m = err?.error?.message || err?.message;
    return m && String(m).trim() ? String(m) : fallback;
  }
}
