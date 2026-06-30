import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ossThumbnail',
})
export class OssThumbnailPipe implements PipeTransform {
  transform(
    photoUrl: string | null | undefined,
    width: number = 100,
    height?: number
  ): string {
    if (!photoUrl) {
      return 'assets/images/avatars/avatar-default.png';
    }

    // Thêm height nếu có, hoặc chỉ resize theo width
    const resizeParam = height
      ? `m_fill,w_${width},h_${height}`
      : `w_${width}`;

    return `${photoUrl}?x-oss-process=image/resize,${resizeParam}/quality,q_70`;
  }
}
