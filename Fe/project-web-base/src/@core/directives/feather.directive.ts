import { Directive, ElementRef, Input, AfterViewInit, OnChanges } from '@angular/core';
import feather from 'feather-icons';

@Directive({
  selector: '[featherIcon]'
})
export class FeatherIconDirective implements AfterViewInit, OnChanges {

  @Input('featherIcon') icon: string = '';

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges() {
    this.render();
  }

  render() {
    const svg = feather.icons[this.icon]?.toSvg({
      class: this.el.nativeElement.getAttribute('class') || ''
    });

    if (svg) {
      this.el.nativeElement.innerHTML = svg;
    }
  }
}
