import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, NgZone, ElementRef, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-switch',
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchComponent implements OnChanges, OnInit, OnDestroy {
    @Input() title: string = '';
    @Input() checked: boolean = false;
    @Input() isChange: boolean = true;
    @Input() size?: 'small' | 'medium' | 'large';
    @Input() disabled: boolean = false;
    @Output() onToggle = new EventEmitter<boolean>();

    private clickListener: ((e: Event) => void) | null = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private elementRef: ElementRef
    ) {}

    ngOnInit(): void {
        // Use zone.js native API to completely bypass zone patching
        const nativeAddEventListener = (window as any).__zone_symbol__addEventListener || 
            HTMLElement.prototype.addEventListener.bind(this.elementRef.nativeElement);
        
        const switchElement = this.elementRef.nativeElement.querySelector('.switch');
        if (switchElement) {
            this.clickListener = (e: Event) => {
                e.stopPropagation();
                this.handleClick();
            };
            
            // Attach listener bypassing Zone.js completely
            if ((window as any).__zone_symbol__addEventListener) {
                switchElement.__zone_symbol__addEventListener('click', this.clickListener, false);
            } else {
                // Fallback: run outside angular
                this.ngZone.runOutsideAngular(() => {
                    switchElement.addEventListener('click', this.clickListener);
                });
            }
        }
    }

    ngOnDestroy(): void {
        // Clean up listener
        if (this.clickListener) {
            const switchElement = this.elementRef.nativeElement.querySelector('.switch');
            if (switchElement) {
                const nativeRemove = (window as any).__zone_symbol__removeEventListener;
                if (nativeRemove) {
                    switchElement.__zone_symbol__removeEventListener('click', this.clickListener, false);
                } else {
                    switchElement.removeEventListener('click', this.clickListener);
                }
            }
            this.clickListener = null;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // When checked input changes, update view
        if (changes['checked']) {
            this.cdr.markForCheck();
        }
    }

    private handleClick(): void {
        if (this.disabled) {
            return;
        }
        
        if (this.isChange) {
            this.checked = !this.checked;
        }
        
        // Run emit inside Angular zone to trigger change detection
        this.ngZone.run(() => {
            this.onToggle.emit(this.checked);
        });
        
        // Update this component's view
        this.cdr.markForCheck();
    }

    // Keep for backwards compatibility
    toggleSwitch() {
        this.handleClick();
    }
}
