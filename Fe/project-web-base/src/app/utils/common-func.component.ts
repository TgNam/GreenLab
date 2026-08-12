import { NgZone } from "@angular/core";
import * as Mousetrap from 'mousetrap';

export class CommonFunc {
    private static originalMousetrapStopCallback:
        ((this: any, e: KeyboardEvent, element: Element, combo: string) => boolean) | null = null;
    private static mousetrapGlobalBindRefCount = 0;

    /**
 * Kích hoạt ghi đè stopCallback của Mousetrap 
 * để cho phép các phím chức năng hoạt động trong input.
 */
private static enableMousetrapForFunctionKeys(keys: string[]): void {
    const has_function_keys = (keys || []).some(k => /^f\d+$/i.test(k));
    if (!has_function_keys) {
        return;
    }

    // Lưu lại hàm gốc nếu đây là lần đầu tiên kích hoạt
    if (CommonFunc.mousetrapGlobalBindRefCount === 0) {
        CommonFunc.originalMousetrapStopCallback = Mousetrap.prototype.stopCallback;

        // Ghi đè logic: Cho phép phím F đi qua kể cả khi đang focus input
        Mousetrap.prototype.stopCallback = function(e: KeyboardEvent, element: Element, combo: string) {
            // Nếu là phím F1-F12, cho phép chạy (return false để Mousetrap không chặn)
            if (/^f[1-9][0-2]?$/i.test(combo)) {
                return false;
            }
            
            // Với các phím khác, quay về logic gốc (thường là chặn nếu là input)
            if (CommonFunc.originalMousetrapStopCallback) {
                return CommonFunc.originalMousetrapStopCallback.call(this, e, element, combo);
            }
            return false;
        };
    }
    
    CommonFunc.mousetrapGlobalBindRefCount++;
}

    private static disableMousetrapForFunctionKeys(keys: string[]): void {
        const has_function_keys = (keys || []).some(k => /^f\d+$/i.test(k));
        if (!has_function_keys) {
            return;
        }
        CommonFunc.mousetrapGlobalBindRefCount = Math.max(0, CommonFunc.mousetrapGlobalBindRefCount - 1);
        if (CommonFunc.mousetrapGlobalBindRefCount === 0 && CommonFunc.originalMousetrapStopCallback) {
            Mousetrap.prototype.stopCallback = CommonFunc.originalMousetrapStopCallback;
            CommonFunc.originalMousetrapStopCallback = null;
        }
    }

    /**
     * Bind shortcut global bằng Mousetrap ngoài Angular zone để giảm change detection không cần thiết.
     * Callback nhận thêm KeyboardEvent; trả về false → không preventDefault (giữ hành vi trình duyệt, ví dụ F1 trong input).
     */
    static bindMousetrapShortcuts(
        keys: string[],
        ngZone: NgZone,
        onShortcut: (normalizedKey: string, event: KeyboardEvent) => void | boolean
    ): void {
        if (!keys || keys.length === 0) {
            return;
        }
        CommonFunc.enableMousetrapForFunctionKeys(keys);
        // CommonFunc.enableMousetrapForFunctionKeys(keys);
        ngZone.runOutsideAngular(() => {
            keys.forEach(key => {
                Mousetrap.bind(key, (event: KeyboardEvent) => {
                    let should_prevent_default = true;
                    ngZone.run(() => {
                        const result = onShortcut(key.toUpperCase(), event);
                        if (result === false) {
                            should_prevent_default = false;
                        }
                    });
                    if (should_prevent_default && event) {
                        event.preventDefault();
                    }
                    return false;
                });
            });
        });
    }

    /** Unbind shortcut global đã bind bởi Mousetrap. */
    static unbindMousetrapShortcuts(keys: string[]): void {
        if (!keys || keys.length === 0) {
            return;
        }
        keys.forEach(key => Mousetrap.unbind(key));
        CommonFunc.disableMousetrapForFunctionKeys(keys);
    }

    /** Chuẩn hóa text label/placeholder để so khớp (bỏ dấu *, khoảng trắng thừa). */
    private static normalizeFocusLabel(text: string): string {
        if (!text) return '';
        return text
            .replace(/\u00a0/g, ' ')
            .replace(/\s*\*\s*$/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    /**
     * Handle focus on form inputs based on input type and placeholder
     * @param inputType - Type of input: 'text', 'select', 'date', 'radio', 'checkbox', 'textarea'
     * @param placeholder - Placeholder text to match
     * @param idCheckbox - Optional ID for checkbox input type
     */
    static handleFocus(inputType: string, placeholder: string, idCheckbox?: string, ngZone?: NgZone): void {
        const formInputs = document.querySelectorAll('app-form-input');
        for (let i = 0; i < formInputs.length; i++) {
            const formInputEl = formInputs[i] as HTMLElement;
            switch (inputType) {
                case 'text':    
                    const inputs = formInputEl.querySelectorAll('input');
                    for (let i = 0; i < inputs.length; i++) {
                        const input = inputs[i] as HTMLInputElement;
                        if (input.placeholder.toLowerCase() == placeholder.toLowerCase()) {
                            console.log('focus', placeholder);
                            input.focus();
                        }
                    }
                    break;
                case 'select': {
                    const ngSelect = formInputEl.querySelector('ng-select');
                    if (!ngSelect) {
                        break;
                    }
                    const ngSelectHost = ngSelect as HTMLElement;
                    const targetNorm = CommonFunc.normalizeFocusLabel(placeholder);

                    const labelEl = formInputEl.querySelector('label');
                    const labelNorm = CommonFunc.normalizeFocusLabel(labelEl?.textContent ?? '');

                    const phEl = ngSelect.querySelector('.ng-placeholder') as HTMLElement | null;
                    const phNorm = CommonFunc.normalizeFocusLabel(phEl?.textContent ?? '');

                    // Khớp theo placeholder (khi chưa chọn) hoặc theo <label> của app-form-input (khi đã có giá trị, .ng-placeholder thường không còn)
                    const matches =
                        (phNorm !== '' && phNorm === targetNorm) ||
                        (labelNorm !== '' && labelNorm === targetNorm);
                    if (!matches) {
                        break;
                    }

                    const ngSelectInput =
                        (ngSelect.querySelector('.ng-input input') as HTMLInputElement) ||
                        (ngSelect.querySelector('input[type="text"]') as HTMLInputElement) ||
                        (ngSelect.querySelector('input') as HTMLInputElement);
                    if (!ngSelectInput || ngSelectInput.disabled) {
                        break;
                    }

                    ngSelectInput.focus();

                    const tryOpenDropdown = (): void => {
                        const arrowDown = new KeyboardEvent('keydown', {
                            key: 'ArrowDown',
                            code: 'ArrowDown',
                            which: 40,
                            keyCode: 40,
                            bubbles: true,
                            cancelable: true
                        });
                        ngSelectInput.dispatchEvent(arrowDown);

                        // Một số phiên bản @ng-select không mở bằng ArrowDown — gõ mousedown lên container
                        if (!ngSelectHost.classList.contains('ng-select-opened')) {
                            const container = ngSelectHost.querySelector('.ng-select-container') as HTMLElement | null;
                            container?.dispatchEvent(
                                new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })
                            );
                        }
                    };

                    setTimeout(() => {
                        if (ngZone) {
                            ngZone.run(tryOpenDropdown);
                        } else {
                            tryOpenDropdown();
                        }
                    }, 0);
                    return;
                }
                case 'autocomplete':
                    const formInputs = document.querySelectorAll('app-user-autocomplete');
                    for (let i = 0; i < formInputs.length; i++) {
                        const formInputEl = formInputs[i] as HTMLElement;
                        const ngSelect = formInputEl.querySelector('ng-select');
                        if (ngSelect) {
                            const ngPlaceholder = ngSelect.querySelector('.ng-placeholder') as HTMLElement;
                            const ngSelectInput = ngSelect.querySelector('input') as HTMLInputElement;
                            if (ngPlaceholder && ngPlaceholder.textContent && ngPlaceholder.textContent.toLowerCase() == placeholder.toLowerCase()) {
                                ngSelectInput.focus();
                            }
                        }
                    }
                    break;
                case 'normal-autocomplete':
                    const normalFormInputs = document.querySelectorAll('app-generic-autocomplete');
                    for (let i = 0; i < normalFormInputs.length; i++) {
                        const formInputEl = normalFormInputs[i] as HTMLElement;
                        const ngSelect = formInputEl.querySelector('ng-select');
                        if (ngSelect) {
                            const ngPlaceholder = ngSelect.querySelector('.ng-placeholder') as HTMLElement;
                            const ngSelectInput = ngSelect.querySelector('input') as HTMLInputElement;
                            if (ngPlaceholder && ngPlaceholder.textContent && ngPlaceholder.textContent.toLowerCase() == placeholder.toLowerCase()) {
                                ngSelectInput.focus();
                            }
                        }
                    }
                    break;
                case 'doctor-autocomplete':
                    const doctorFormInputs = document.querySelectorAll('app-doctor-select');
                    for (let i = 0; i < doctorFormInputs.length; i++) {
                        const formInputEl = doctorFormInputs[i] as HTMLElement;
                        const ngSelects = formInputEl.querySelectorAll('ng-select');
                        for (let j = 0; j < ngSelects.length; j++) {
                            const ngSelect = ngSelects[j] as HTMLElement;
                            const ngPlaceholder = ngSelect.querySelector('.ng-placeholder') as HTMLElement;
                            const ngSelectInput = ngSelect.querySelector('input') as HTMLInputElement;
                            if (ngPlaceholder && ngPlaceholder.textContent && ngPlaceholder.textContent.toLowerCase() == placeholder.toLowerCase()) {
                                ngSelectInput.focus();
                            }
                        }
                    }

                    break;
                case 'date':
                    const dateAdapter = formInputEl.querySelector('app-datetime-adapter');
                    if (dateAdapter) {
                        const inputFlatpickr = dateAdapter.querySelector('.ng2-flatpickr-input.form-control.input') as HTMLInputElement;
                        const placeholderAttr = inputFlatpickr?.getAttribute('placeholder');
                        if (inputFlatpickr && placeholderAttr && placeholderAttr.toLowerCase() == placeholder.toLowerCase()) {
                            CommonFunc.focusDate(inputFlatpickr);
                        }
                    }
                    break;
                case 'radio':
                    let radioInputs = formInputEl.querySelectorAll('input[type="radio"]');
                    if (radioInputs.length > 0) {
                        for (let i = 0; i < radioInputs.length; i++) {
                            const radioInput = radioInputs[i] as HTMLInputElement;
                            if (radioInput.checked) {
                                radioInput.focus();
                                break;
                            }
                        }
                    }
                    break;
                case 'checkbox':
                    const checkbox = document.getElementById(idCheckbox) as HTMLInputElement;
                    if (checkbox) {
                        checkbox.focus();
                    }
                    break;
                case 'textarea':
                    const textarea = formInputEl.querySelector('textarea');
                    if (textarea && textarea.placeholder.toLowerCase() == placeholder.toLowerCase()) {
                        textarea.focus();
                    }
                    break;

            }
        }
    }

    /**
     * Focus on date input and set selection to hour part
     * @param inputFlatpickr - The flatpickr input element
     */
    private static focusDate(inputFlatpickr: HTMLInputElement): void {
        if (!inputFlatpickr) return;

        inputFlatpickr.focus();

        // Use setTimeout to ensure focus is complete before setting selection
        // Need longer delay to allow flatpickr to process the focus event
        setTimeout(() => {
            const value = inputFlatpickr.value || '';

            // Flatpickr format is "HH:MM dd/mm/yyyy" - hour is always at position 0-2
            // If input has a value, focus on hour part (first 2 characters: HH)
            if (value && value.trim() !== '' && value !== 'HH:MM dd/mm/yyyy') {
                // Check if format starts with hour (HH:MM pattern at beginning)
                if (value.match(/^\d{2}:\d{2}/)) {
                    // Format is "HH:MM ..." - hour is at position 0-2
                    inputFlatpickr.setSelectionRange(0, 2);
                } else {
                    // Try to find hour pattern in the value (could be "dd/mm/yyyy HH:MM" format)
                    const hourMatch = value.match(/(\d{2}):\d{2}/);
                    if (hourMatch && hourMatch.index !== undefined) {
                        // Set selection to hour part (2 characters)
                        inputFlatpickr.setSelectionRange(hourMatch.index, hourMatch.index + 2);
                    } else {
                        // Fallback: focus at start
                        inputFlatpickr.setSelectionRange(0, 2);
                    }
                }
            } else {
                // If empty or placeholder, focus at start (will show placeholder and focus on HH)
                inputFlatpickr.setSelectionRange(0, 2);
            }
        }, 100); // Increased delay to ensure flatpickr has processed the focus
    }
}

