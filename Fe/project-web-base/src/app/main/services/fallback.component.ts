import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  template: ''
})
export class FallbackComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
    const url = this.router.url;


    // bỏ query param nếu có
    const cleanUrl = url.split('?')[0];

    // tách segments
    const segments = cleanUrl.split('/').filter(s => s);

    if (segments.length >= 2) {
      const parentPath = '/' + segments[0];


      this.router.navigateByUrl(parentPath).catch(() => {
        this.router.navigate(['/dashboard']);
      });

    } else {
      // fallback cuối cùng
      this.router.navigate(['/dashboard']);
    }
  }
}