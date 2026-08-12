import { Pipe, PipeTransform } from '@angular/core';
import { CoreTranslationService } from '@core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false // để khi đổi ngôn ngữ, pipe tự cập nhật
})
export class TranslatePipe implements PipeTransform {
  constructor(private _translationService: CoreTranslationService) {}

  transform(key: string, interpolateParams?: any): string {
    if (!key) return '';

    let translated = key;

    this._translationService.get(key, interpolateParams).subscribe((res: string) => {
      translated = res;
    });

    return translated;
  }
}
