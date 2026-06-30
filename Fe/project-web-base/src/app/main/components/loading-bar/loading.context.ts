import { HttpContextToken } from '@angular/common/http';

// Giá trị mặc định là false (vẫn hiện loading)
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);