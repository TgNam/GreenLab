import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CoreTranslationService } from '@core/services/translation.service';
import { SystemConfig } from '../systemconfig.service';

@Component({
  selector: 'app-systemconfig-update',
  templateUrl: './systemconfig-update.component.html',
  styleUrls: ['./systemconfig-update.component.scss']
})
export class SystemConfigUpdateComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() mode: 'view' | 'edit' = 'view';
  @Input() systemconfig?: SystemConfig;
  @Input() saving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<SystemConfig>();
  public errMsg: Array<{ type: string; label: string }> = [];

  constructor(
    private translate: CoreTranslationService
  ) {}

  ngOnInit() {
    this.checkAndParseJson();
    if (this.systemconfig) {
      this.validateParam('name', this.systemconfig.name);
      this.validateParam('value', this.systemconfig.value);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['systemconfig'] && !changes['systemconfig'].firstChange) {
      this.checkAndParseJson();
      this.errMsg = [];
      if (this.systemconfig) {
        this.validateParam('name', this.systemconfig.name);
        this.validateParam('value', this.systemconfig.value);
      }
    }
    if (changes['visible']) {
      if (changes['visible'].currentValue === false) {
        this.errMsg = [];
      } else if (changes['visible'].currentValue === true && this.systemconfig) {
        // Validate khi mở modal
        this.validateParam('name', this.systemconfig.name);
        this.validateParam('value', this.systemconfig.value);
      }
    }
  }

  checkAndParseJson() {
    if (this.systemconfig?.value) {
      this.isValidJson = this.isJsonString(this.systemconfig.value);
      if (this.isValidJson) {
        try {
          this.parsedJsonData = JSON.parse(this.systemconfig.value);
        } catch (error) {
          this.isValidJson = false;
          this.parsedJsonData = null;
        }
      } else {
        this.parsedJsonData = null;
      }
    } else {
      this.isValidJson = false;
      this.parsedJsonData = null;
    }
  }

  onValueChange() {
    this.checkAndParseJson();
    if (this.systemconfig?.value !== undefined) {
      this.validateParam('value', this.systemconfig.value);
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

  changeStatus(event) {
    if (event.target && this.systemconfig) {
      this.systemconfig.active = event.target.checked;
    }
  }

  // JSON Tree properties
  public isJsonMode = false;
  public jsonTreeData: any = null;
  public jsonError: string = '';
  public jsonTreeItems: any[] = [];
  
  // JSON Viewer properties
  public isValidJson: boolean = false;
  public parsedJsonData: any = null;

  onClose() {
    this.close.emit();
  }

  onSave() {
    if (this.systemconfig) {
      // Đảm bảo active luôn là boolean
      if (this.systemconfig.active === null || this.systemconfig.active === undefined) {
        this.systemconfig.active = true;
      }
      // Nếu đang ở JSON mode, convert JSON tree về string
      if (this.isJsonMode && this.jsonTreeData) {
        this.systemconfig.value = JSON.stringify(this.jsonTreeData, null, 2);
      }
      this.save.emit(this.systemconfig);
    }
  }

  // JSON Tree methods
  toggleJsonMode() {
    this.isJsonMode = !this.isJsonMode;
    if (this.isJsonMode) {
      this.parseJsonToTree();
    } else {
      this.resetJsonMode();
    }
  }

  parseJsonToTree() {
    try {
      if (this.systemconfig?.value) {
        this.jsonTreeData = JSON.parse(this.systemconfig.value);
        this.jsonError = '';
        this.jsonTreeItems = this.getJsonTreeItems(this.jsonTreeData);
      } else {
        this.jsonTreeData = {};
        this.jsonTreeItems = [];
      }
    } catch (error) {
      this.jsonError = 'JSON không hợp lệ: ' + error.message;
      this.jsonTreeData = null;
      this.jsonTreeItems = [];
    }
  }

  getJsonTreeItems(data: any): any[] {
    if (!data || typeof data !== 'object') return [];
    
    return Object.keys(data).map(key => ({
      key,
      value: data[key],
      type: this.getType(data[key]),
      expanded: false,
      children: this.getChildren(data[key])
    }));
  }

  getChildren(value: any): any[] {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map((item, index) => ({
          key: `[${index}]`,
          value: item,
          type: this.getType(item),
          expanded: false
        }));
      } else {
        return Object.keys(value).map(key => ({
          key,
          value: value[key],
          type: this.getType(value[key]),
          expanded: false
        }));
      }
    }
    return [];
  }

  getType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  toggleNode(index: number) {
    if (this.jsonTreeItems[index]) {
      this.jsonTreeItems[index].expanded = !this.jsonTreeItems[index].expanded;
    }
  }

  resetJsonMode() {
    this.isJsonMode = false;
    this.jsonTreeData = null;
    this.jsonError = '';
  }

  updateJsonTree() {
    if (this.isJsonMode && this.jsonTreeData && this.systemconfig) {
      this.systemconfig.value = JSON.stringify(this.jsonTreeData, null, 2);
    }
  }

  isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}
