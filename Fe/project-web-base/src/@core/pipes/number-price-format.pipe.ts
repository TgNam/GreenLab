import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberPriceFormat'
})
export class NumberPriceFormatPipe implements PipeTransform {

  transform(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Chuyển đổi thành string và loại bỏ tất cả ký tự không phải số
    const numericValue = String(value).replace(/[^\d]/g, '');

    // Nếu không có số nào, trả về empty string
    if (!numericValue) {
      return '';
    }

    // Format với dấu chấm mỗi 3 số
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
