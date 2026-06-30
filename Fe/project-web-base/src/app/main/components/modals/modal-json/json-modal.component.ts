import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';

@Component({
    selector: 'app-json-modal',
    templateUrl: './json-modal.component.html',
    styleUrls: ['./json-modal.component.scss'],
})
export class JsonModalComponent {
    @Input() visible = false;
    @Input() data: any;
    @Input() title: string = '';
    @Input() overflowY: boolean = true;
    @Output() onClose = new EventEmitter<void>();
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() modalDialogClass: string = 'modal-dialog modal-lg';

    @HostListener('document:keydown', ['$event'])
    handleEscapeKey(event: KeyboardEvent) {
        if (this.visible && (event.key === 'Escape' || event.keyCode === 27)) {
            event.preventDefault();
            this.handleClose();
        }
    }

    close() {
        this.onClose.emit();
    }

    handleClose() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.onClose.emit();
    }
    get formattedJson() {
        try {
            return JSON.stringify(
                typeof this.data === 'string' ? JSON.parse(this.data) : this.data,
                null,
                2
            );
        } catch (e) {
            return this.data;
        }
    }

    getSizeFromClass(): string {
        // Map modalDialogClass to size prop for app-modal-content
        if (this.modalDialogClass?.includes('modal-xl')) {
            return 'xl';
        } else if (this.modalDialogClass?.includes('modal-lg')) {
            return 'lg';
        } else if (this.modalDialogClass?.includes('modal-sm')) {
            return 'sm';
        }
        return 'lg'; // default
    }
}
