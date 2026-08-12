import { Component, Input } from '@angular/core';
import { Lightbox } from 'ngx-lightbox';
import { CoreTranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.component.html', 
  styleUrls: ['./image-preview.component.scss'],
})
export class ImagePreviewComponent {
  @Input() src!: string;
  @Input() fullSrc?: string;
   @Input() defaultSrc?: string = 'assets/images/avatars/avatar-default.png';
  @Input() alt = '';
  @Input() width = 80;
  @Input() height = 80;
  @Input() square: boolean = false;
  @Input() title?: string;

  constructor(
    private lightbox: Lightbox,
    private translate: CoreTranslationService
  ) {}

  get imageTitle(): string {
    return this.title || this.translate.instant('RESULT_IMAGE.CLICK_TO_VIEW') || 'Click vào để xem';
  }

  openLightbox(): void {
    const album = [
      {
        src: this.fullSrc || this.src,
        caption: this.alt,
        thumb: this.src,
      },
    ];
    this.lightbox.open(album, 0);
  }
}
