import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CoreConfigService } from '@core/services/config.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-multi-select',
    templateUrl: './multi-select.component.html',
    styleUrls: ['./multi-select.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: true
        }
    ]
})
export class MultiSelectComponent implements ControlValueAccessor {
    @Input() options: { label: string; value: any }[] = [];
    @Input() placeholder = 'Chọn...';
    @Output() change = new EventEmitter<any[]>();
    constructor(private _coreConfigService: CoreConfigService) { }

    selectedValues: any[] = [];
    isOpen = false;
    currentSkin: string = 'light';
    private _unsubscribeAll = new Subject<void>();

    // ControlValueAccessor
    onChange: any = () => { };
    onTouched: any = () => { };

    writeValue(value: any[]): void {
        this.selectedValues = value || [];
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }

    isSelected(value: any): boolean {
        return this.selectedValues.includes(value);
    }

    toggleSelection(value: any) {
        if (this.isSelected(value)) {
            this.selectedValues = this.selectedValues.filter(v => v !== value);
        } else {
            this.selectedValues.push(value);
        }

        this.onChange(this.selectedValues);
        this.change.emit(this.selectedValues);
    }

    getSelectedLabels(): string {
        const selectedOptions = this.options.filter(o => this.selectedValues.includes(o.value));
        return selectedOptions.map(o => o.label).join(', ') || this.placeholder;
    }

    ngOnInit(): void {
        // Theo dõi thay đổi theme (skin)
        this._coreConfigService
            .getConfig()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(config => {
                this.currentSkin = config.layout.skin;
                // Gắn class theme vào <html> để CSS hoạt động nếu bạn cần
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(this.currentSkin);
            });
    }

    toggleSelectAll(event: MouseEvent): void {
        event.stopPropagation();

        if (this.areAllSelected()) {
            this.selectedValues = [];
        } else {
            this.selectedValues = this.options.map(o => o.value);
        }
        this.onChange(this.selectedValues);
        this.change.emit(this.selectedValues);
    }

    areAllSelected(): boolean {
        return this.selectedValues.length === this.options.length;
    }

}
