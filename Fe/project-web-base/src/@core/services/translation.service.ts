import { Injectable } from '@angular/core';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable, of, Subscription } from 'rxjs';

export interface Locale {
  lang: string;
  data: Object;
}

@Injectable({
  providedIn: 'root'
})
export class CoreTranslationService {
  /**
   * Constructor
   *
   * @param {TranslateService} _translateService
   */
  private translations = new Map<string, string>();
  constructor(private _translateService: TranslateService) {
    this._translateService.onLangChange.subscribe((event) => {
      // Clear cache khi đổi ngôn ngữ
      this.translations.clear();

      // Lấy ngôn ngữ mới
      let newLang = event.lang;

      // Nếu là 'vn', chuyển thành 'vi'
      if (newLang === 'vn') {
        newLang = 'vi';
      }

      // Lấy cookie lang hiện tại
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : '';
      };

      const cookieLang = getCookie('lang');

      // Nếu cookie chưa tồn tại hoặc khác với ngôn ngữ mới thì set cookie
      if (!cookieLang || cookieLang !== newLang) {
        // Set cookie lang, path=/ để truy cập trên toàn site, thời hạn 365 ngày
        const expires = new Date();
        expires.setDate(expires.getDate() + 365);
        document.cookie = `lang=${newLang};path=/;expires=${expires.toUTCString()}`;
      }
    });

  }
  onLangChange(callback: (event: LangChangeEvent) => void): Subscription {
    return this._translateService.onLangChange.subscribe(callback);
  }
  // Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Translate
   *
   * @param {Locale} args
   */
  translate(...args: Locale[]): void {
    const locales = [...args];

    locales.forEach(locale => {
      // use setTranslation() with the third argument value as true to append translations instead of replacing them
      this._translateService.setTranslation(locale.lang, locale.data, true);
    });
    const defaultLang = locales[0]?.lang || 'vn';
    this._translateService.setDefaultLang(defaultLang);
    this._translateService.use(defaultLang);
  }
  instant(key: string, params?: any): string {
    return this._translateService.instant(key, params);
  }

  get(key: string, params?: any): Observable<string> {
    return new Observable<string>(observer => {
      const lang = this._translateService.currentLang || this._translateService.defaultLang;
      const translations = this._translateService.translations[lang] || {};
      // Hàm hỗ trợ lấy key dạng 'A.B.C'
      const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((res, part) => (res ? res[part] : undefined), obj);
      };

      let translated = getValue(translations, key);
      // Nếu có interpolate params
      if (translated && params) {
        Object.keys(params).forEach(k => {
          translated = translated.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), params[k]);
        });
      }

      if (!translated) {
        translated = key; // fallback nếu không tìm thấy
      }

      observer.next(translated);
      observer.complete();
    });
  }


}
