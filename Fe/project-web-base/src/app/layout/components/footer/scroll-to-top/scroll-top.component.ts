import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-scroll-top',
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.scss']
})
export class ScrollTopComponent implements OnInit {
  windowScrolled: boolean;
  topOffset: number = 150; // Top offset to display scroll to top button

  constructor(@Inject(DOCUMENT) private document: Document) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (
      window.pageYOffset > this.topOffset ||
      document.documentElement.scrollTop > this.topOffset ||
      document.body.scrollTop > this.topOffset
    ) {
      this.windowScrolled = true;
    } else if (
      (this.windowScrolled && window.pageYOffset) ||
      document.documentElement.scrollTop ||
      document.body.scrollTop < 10
    ) {
      this.windowScrolled = false;
    }
  }

 scrollToTop() {
  const smoothscroll = () => {
    
    const currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
console.log('scroll', currentScroll)
    if (currentScroll > 4) {
      window.requestAnimationFrame(smoothscroll);
      window.scrollTo(0, currentScroll - currentScroll / 8);
    } else {
      // Đảm bảo dừng hẳn và đặt scrollTop = 0
      window.scrollTo(0, 0);
    }
  };

  smoothscroll();
}


  ngOnInit() {}
}
