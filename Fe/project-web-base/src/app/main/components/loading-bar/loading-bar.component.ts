// src/app/shared/components/loading-bar/loading-bar.component.ts
import { Component, OnInit } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading-bar',
  template: `
    <div class="loading-bar" *ngIf="isLoading | async">
      <div class="progress"></div>
    </div>
  `,
  styleUrls: ['./loading-bar.component.scss']
})
export class LoadingBarComponent implements OnInit {
  isLoading = this.loadingService.isLoading$;
  constructor(private loadingService: LoadingService) {}
  ngOnInit(): void {}
}
