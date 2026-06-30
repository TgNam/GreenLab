import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CoreTranslationService } from '@core/services/translation.service';
import { SystemConfig, SystemConfigService } from '../systemconfig.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-systemconfig-create',
    templateUrl: './systemconfig-create.component.html',
    styleUrls: ['./systemconfig-create.component.scss']
})
export class SystemConfigCreateComponent implements OnChanges, OnDestroy {
    @Input() visible = false;
    @Input() mode: 'view' | 'edit' = 'view';
    @Input() saving = false;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<SystemConfig>();
    private destroy$ = new Subject<void>();

    public errMsg: Array<{ type: string; label: string }> = [];
    public systemconfig: any = {
        name: '',
        value: '',
        key: null,
        active: true,
    };

    unusedKeyList: any[] = [];
    unusedKeyOptions: any[] = [];

    constructor(
        private _systemConfigService: SystemConfigService,
        private translate: CoreTranslationService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        const v = changes['visible'];
        if (v) {
            if (v.currentValue === true) {
                // Reset form khi mở modal (cả lần đầu và các lần sau)
                this.resetForm();
                // Luôn gọi lại API để lấy danh sách key mới nhất
                this.getUnusedKeyList();
            }

            if (v.currentValue === false) {
                // Reset form khi đóng modal
                this.resetForm();
            }
        }
    }

    getUnusedKeyList(): void {
        this._systemConfigService.getUnusedKeyList().subscribe(
            (data: any[]) => {
                this.unusedKeyList = data;
                // Tạo options cho select từ unusedKeyList
                this.unusedKeyOptions = data.map(k => ({ 
                    label: `${k.description} : ${k.key}`, 
                    value: k.key 
                }));
            },
            (error) => {

            }
        );
    }

    onSelectionChange(type: string, value: any): void {
        switch (type) {
            case 'key':
                this.systemconfig.key = value;
                this.validateParam('key', value);
                break;
        }
    }

    private addError(type: string, label: string) {
        if (!this.errMsg.some(e => e.type === type)) {
            this.errMsg = [...this.errMsg, { type, label }];
        }
    }

    private removeError(type: string) {
        this.errMsg = this.errMsg.filter(err => err.type !== type);
    }

    validateParam(type: string, value: any) {
        if (!Array.isArray(this.errMsg)) {
            this.errMsg = [];
        }

        const val = value !== null && value !== undefined ? String(value).trim() : '';

        switch (type) {
            case 'key': {
                if (!val) {
                    this.addError('key', this.translate.instant('SYSTEMCONFIG.KEY_REQUIRED'));
                } else {
                    this.removeError('key');
                }
                break;
            }
            case 'name': {
                if (!val) {
                    this.addError('name', this.translate.instant('SYSTEMCONFIG.NAME_REQUIRED'));
                } else {
                    this.removeError('name');
                }
                break;
            }
            case 'value': {
                if (!val) {
                    this.addError('value', this.translate.instant('SYSTEMCONFIG.VALUE_REQUIRED'));
                } else {
                    this.removeError('value');
                }
                break;
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    changeStatus(event) {
        if (event.target) {
            this.systemconfig.active = event.target.checked;
        }
    }

    onClose() {
        this.resetForm();
        this.close.emit();
    }

    resetForm() {
        this.systemconfig = {
            name: '',
            value: '',
            key: null,
            note: '',
            active: true,
        };
        this.errMsg = [];
    }

    onSave() {
        if (this.systemconfig) {
            this.save.emit(this.systemconfig);
            this.resetForm();
        }
    }
}
