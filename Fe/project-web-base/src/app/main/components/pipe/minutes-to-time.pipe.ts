import { Pipe, PipeTransform } from "@angular/core";
import { CoreTranslationService } from '@core/services/translation.service';

@Pipe({
  name: 'minutesToTime',
  pure: false // ✅ Thêm để pipe tự cập nhật khi đổi ngôn ngữ
})
export class MinutesToTimePipe implements PipeTransform {
  constructor(private _translationService: CoreTranslationService) {} // ✅ Inject translation service

  transform(value: number | null | undefined): string {
    if (value == null || isNaN(value) || value < 0) return '';

    const totalMinutes = Math.floor(value);
    
    // Tính số ngày (1 ngày = 1440 phút)
    const days = Math.floor(totalMinutes / 1440);
    const remainingAfterDays = totalMinutes % 1440;
    
    // Tính số giờ còn lại
    const hours = Math.floor(remainingAfterDays / 60);
    
    // Tính số phút còn lại
    const minutes = remainingAfterDays % 60;

    // Tạo mảng các phần tử để hiển thị
    const parts: string[] = [];
    
    if (days > 0) {
      // ✅ Sử dụng translation service
      const dayLabel = this._translationService.instant('COMMON.DAY') || 'ngày';
      parts.push(`${days} ${dayLabel}`);
    }
    
    if (hours > 0) {
      // ✅ Sử dụng translation service
      const hourLabel = this._translationService.instant('COMMON.HOUR') || 'giờ';
      parts.push(`${hours} ${hourLabel}`);
    }
    
    if (minutes > 0) {
      // ✅ Sử dụng translation service
      const minuteLabel = this._translationService.instant('COMMON.MINUTE') || 'phút';
      parts.push(`${minutes} ${minuteLabel}`);
    }

    // ✅ Sử dụng translation service cho "0 phút"
    if (parts.length === 0) {
      const zeroMinuteLabel = this._translationService.instant('COMMON.ZERO_MINUTE') || '0 phút';
      return zeroMinuteLabel;
    }

    return parts.join(' ') + (days > 0 || hours > 0 ? ' (' + value + ' ' + this._translationService.instant('COMMON.MINUTE') + ')' : '');
  }
}

