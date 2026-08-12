import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BaseQueryParamService } from './base-query-param.service';

export class BaseComponent {
  protected pageTitle: string | null = null;
  protected defaultTitle: string = 'Greenlab';

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected queryParamService: BaseQueryParamService,
    protected titleService?: Title
  ) { }

  protected initQueryParams(callback: (params: any) => void | Promise<void>) {
    this.queryParamService.handleOnce(this.activatedRoute, callback);
  }

  /**
   * Set page title
   * @param title - Title to set, if not provided will use this.pageTitle
   * @param defaultTitle - Default title if title is not provided, defaults to 'Greenlab'
   */
  protected setPageTitle(title?: string, defaultTitle?: string): void {
    if (!this.titleService) {
      return; // Skip if titleService is not provided
    }
    const titleToSet = title || this.pageTitle || defaultTitle || this.defaultTitle;
    if (titleToSet) {
      this.titleService.setTitle(titleToSet);
    }
  }

  protected handleFocus(inputType: string, placeholder: string, idCheckbox?: string) {
    const formInputs = document.querySelectorAll('app-form-input');
    for (let i = 0; i < formInputs.length; i++) {
      const formInputEl = formInputs[i] as HTMLElement;
      switch (inputType) {
        case 'text':
          const input = formInputEl.querySelector('input');
          if (input != null) {
            if (input.placeholder.toLowerCase() == placeholder.toLowerCase()) {
              input.focus();
            }
          }
          break;
        case 'select':
          const ngSelect = formInputEl.querySelector('ng-select');
          if (ngSelect) {
            const ngPlaceholder = ngSelect.querySelector('.ng-placeholder') as HTMLElement;
            const ngSelectInput = ngSelect.querySelector('input') as HTMLInputElement;
            if(ngPlaceholder.textContent.toLowerCase() == placeholder.toLowerCase()) {
              ngSelectInput.focus();
            }
          }
          break;
        case 'date':
          const dateAdapter = formInputEl.querySelector('app-datetime-adapter');
            if (dateAdapter) {
              const inputFlatpickr = dateAdapter.querySelector('.ng2-flatpickr-input.form-control.input') as HTMLInputElement;
              if (inputFlatpickr.getAttribute('placeholder').toLowerCase() == placeholder.toLowerCase()) {
                this.focusDate(inputFlatpickr);
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
            if(textarea && textarea.placeholder.toLowerCase() == placeholder.toLowerCase()) {
              textarea.focus();
            }
          break;

      }
    }
  }

  private focusDate(inputFlatpickr: HTMLInputElement): void {
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
