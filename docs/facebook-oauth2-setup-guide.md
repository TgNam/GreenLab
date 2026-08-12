# Hướng dẫn cấu hình Facebook OAuth2 Login

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Các bước tạo Facebook App](#2-các-bước-tạo-facebook-app)
3. [Cấu hình Backend](#3-cấu-hình-backend)
4. [Cấu hình Frontend](#4-cấu-hình-frontend)
5. [Kiểm tra và Troubleshooting](#5-kiểm-tra-voubleshooting)
6. [Giải thích Redirect URI](#6-giải-thích-redirect-uri)
7. [Cấu hình Production](#7-cấu-hình-production)

---

## 1. Tổng quan

Facebook OAuth2 sử dụng cùng flow như Google OAuth2 đã được implement. Chỉ cần:

1. Tạo Facebook App trên Meta for Developers
2. Thêm cấu hình vào `application.properties`
3. Thêm nút Login with Facebook ở Frontend

**Không cần thay đổi code Java** vì đã dùng `CustomOAuth2UserService` generic cho mọi OAuth2 provider.

---

## 2. Các bước tạo Facebook App

### 2.1 Đăng nhập Meta for Developers

1. Truy cập: https://developers.facebook.com/
2. Đăng nhập bằng tài khoản Facebook
3. Vào **My Apps** → **Create App**

### 2.2 Tạo App mới

1. Chọn **Consumer** (hoặc **None** nếu không có sẵn)
2. Click **Next**

### 2.3 Điền thông tin App

| Field | Value |
|-------|-------|
| App name | `GreenLab Admin` |
| App Contact Email | Email của bạn |

3. Click **Create App**

### 2.4 Lấy App Credentials

1. Vào **Settings** → **Basic**
2. Copy các thông tin:

| Field | Mô tả |
|-------|-------|
| **App ID** | Client ID |
| **App Secret** | Client Secret |

---

## 3. Cấu hình Backend

### 3.1 Thêm vào application.properties

Mở file: `Be/project-admin-api-base/src/main/resources/application.properties`

**Thêm vào cuối file:**

```properties
# Social login - Facebook
spring.security.oauth2.client.registration.facebook.client-id=VUI_LONG_THAY_BANG_APP_ID_CUA_BAN
spring.security.oauth2.client.registration.facebook.client-secret=VUI_LONG_THAY_BANG_APP_SECRET_CUA_BAN
spring.security.oauth2.client.registration.facebook.scope=email,public_profile
spring.security.oauth2.client.registration.facebook.redirect-uri=http://localhost:8081/api-admin/oauth2/code/facebook
spring.security.oauth2.client.provider.facebook.authorization-uri=https://www.facebook.com/v18.0/dialog/oauth
spring.security.oauth2.client.provider.facebook.token-uri=https://graph.facebook.com/v18.0/oauth/access_token
spring.security.oauth2.client.provider.facebook.user-info-uri=https://graph.facebook.com/me?fields=id,name,email,picture
```

### 3.2 Cấu hình cho Production

Khi deploy lên server, cần thêm redirect URI production:

```properties
# Production redirect URIs
spring.security.oauth2.client.registration.facebook.redirect-uri={baseUrl}/api-admin/oauth2/code/facebook
```

---

## 4. Cấu hình Frontend

### 4.1 Hàm loginWithFacebook

Method `loginWithFacebook()` đã được thêm vào `auth-login-v2.component.ts`:

```typescript
loginWithFacebook() {
  const facebookLoginUrl = `${environment.apiUrl}/oauth2/authorization/facebook`;
  const redirectUri = encodeURIComponent(`${environment.frontendUrl}/pages`);
  window.location.href = `${facebookLoginUrl}?redirect_uri=${redirectUri}`;
}
```

### 4.2 Button trong template

Button đã được thêm vào `auth-login-v2.component.html`:

```html
<div class="social-login-buttons">
  <button type="button" class="btn btn-google btn-block" (click)="loginWithGoogle()" rippleEffect>
    <img src="assets/images/pages/login/google-logo-search-new-svgrepo-com.svg" alt="Google" class="social-btn-icon" />
    <span>Đăng nhập bằng Google</span>
  </button>
  <button type="button" class="btn btn-facebook btn-block" (click)="loginWithFacebook()" rippleEffect>
    <img src="assets/images/pages/login/facebook.svg" alt="Facebook" class="social-btn-icon" />
    <span>Đăng nhập bằng Facebook</span>
  </button>
</div>
```

### 4.3 Error messages cho OAuth2

Hàm `getOAuth2ErrorMessage()` đã được cập nhật:

```typescript
private getOAuth2ErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'user_not_exist': 'Tài khoản không tồn tại trong hệ thống. Vui lòng liên hệ Admin.',
    'account_locked': 'Tài khoản của bạn đã bị khóa.',
    'email_not_found': 'Không tìm thấy email từ nhà cung cấp.',
    'login_failed': 'Đăng nhập thất bại. Vui lòng thử lại.'
  };
  return errorMessages[errorCode] || 'Đăng nhập thất bại. Vui lòng thử lại.';
}
```

---

## 5. Kiểm tra và Troubleshooting

### 5.1 Các lỗi thường gặp

#### Lỗi: `redirect_uri_mismatch`

**Nguyên nhân:** Redirect URI trong Facebook App không khớp với URI trong config hoặc URI mặc định của Spring Security.

**Giải pháp:**
1. Vào Meta for Developers → App → Facebook Login → Settings
2. Trong **Valid OAuth Redirect URIs**, thêm CẢ HAI URIs:
   ```
   http://localhost:8081/api-admin/oauth2/code/facebook
   http://localhost:8081/login/oauth2/code/facebook
   ```
3. URI phải khớp hoàn toàn (bao gồm cả trailing slash nếu có)

#### Lỗi: `App not live`

**Nguyên nhân:** App đang ở chế độ Development, chưa được duyệt.

**Giải pháp:**
1. Thêm test users trong **Roles** → **Test Users** (cho development)
2. Hoặc hoàn thành **App Review** cho các permissions cần thiết (cho production)

#### Lỗi: `Facebook SDK error`

**Nguyên nhân:** Facebook SDK JavaScript conflict hoặc thiếu config.

**Giải pháp:**
- Không cần Facebook JS SDK nếu dùng OAuth2 Server-side flow như project này

### 5.2 Checklist trước khi test

- [ ] App đã được activate
- [ ] Facebook Login product đã được thêm
- [ ] **Valid OAuth Redirect URIs** đã thêm CẢ 2 URIs:
  - [ ] `http://localhost:8081/api-admin/oauth2/code/facebook`
  - [ ] `http://localhost:8081/login/oauth2/code/facebook`
- [ ] App ID và App Secret đã được thêm vào properties
- [ ] Frontend button đã được thêm
- [ ] Server đã restart sau khi thêm config

### 5.3 Test locally

1. Start BE: `mvn spring-boot:run`
2. Start FE: `ng serve`
3. Mở http://localhost:4200/login
4. Click "Đăng nhập bằng Facebook"
5. Login bằng Facebook account (test user nếu app chưa duyệt)
6. Kiểm tra:
   - Token cookie được set
   - User redirected về dashboard
   - Thông tin user hiển thị đúng

---

## 6. Giải thích Redirect URI

### 6.1 Tại sao cần đăng ký redirect URI?

**Facebook (và các OAuth2 provider khác) yêu cầu redirect URI phải được đăng ký trước** vì lý do bảo mật:

- Ngăn chặn tấn công **redirect_uri_mismatch**
- Chỉ cho phép redirect về URIs được chấp nhận
- Bảo vệ users khỏi bị redirect đến malicious sites

### 6.2 Redirect URI mặc định của Spring Security

Spring Security có redirect URI mặc định cho mỗi OAuth2 provider:

```
{baseUrl}/login/oauth2/code/{registrationId}
```

Ví dụ:
- Google: `http://localhost:8081/login/oauth2/code/google`
- Facebook: `http://localhost:8081/login/oauth2/code/facebook`

### 6.3 Redirect URI trong application.properties

Khi bạn cấu hình:

```properties
spring.security.oauth2.client.registration.facebook.redirect-uri=http://localhost:8081/api-admin/oauth2/code/facebook
```

Spring Security sẽ dùng URI này thay vì default.

### 6.4 Tại sao Google hoạt động dù xóa redirect-uri config?

Vì bạn đã đăng ký **CẢ HAI** URIs trên Google Console:

```
http://localhost:8081/api-admin/oauth2/code/google  ← config của bạn
http://localhost:8081/login/oauth2/code/google       ← default của Spring
```

Cả hai đều được chấp nhận, nên khi xóa config, nó vẫn hoạt động với default URI.

### 6.5 Tại sao Facebook cần cả 2 URIs?

| Trường hợp | URI được sử dụng | Có trong Meta Console? |
|------------|------------------|------------------------|
| Có config `redirect-uri` | `/api-admin/oauth2/code/facebook` | Cần đăng ký |
| Xóa config | `/login/oauth2/code/facebook` | Cần đăng ký |

**Giải pháp:** Đăng ký CẢ HAI URIs trên Meta for Developers để đảm bảo hoạt động trong mọi trường hợp.

### 6.6 Sơ đồ Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OAUTH2 REDIRECT URI FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER nhấn "Đăng nhập Facebook"
   └── loginWithFacebook()
       └── window.location.href = "/oauth2/authorization/facebook"

2. SPRING SECURITY nhận request /oauth2/authorization/facebook
   └── OAuth2AuthorizationRequestRedirectFilter xử lý
   └── Lấy ClientRegistration từ repository

3. SPRING SECURITY tạo AUTHORIZATION REQUEST
   └── Đọc redirect-uri từ ClientRegistration:
       - Nếu có: spring.security.oauth2.client.registration.facebook.redirect-uri
         → Dùng giá trị này
       - Nếu không: Dùng default
         → {baseUrl}/login/oauth2/code/{registrationId}

   └── Redirect đến Facebook:
       https://www.facebook.com/v18.0/dialog/oauth?
           client_id=XXX&
           redirect_uri=http://localhost:8081/api-admin/oauth2/code/facebook&
           scope=email,public_profile

4. USER đăng nhập trên Facebook

5. FACEBOOK kiểm tra redirect_uri
   └── Khớp với Valid OAuth Redirect URIs? → Tiếp tục
   └── Không khớp? → Lỗi redirect_uri_mismatch

6. FACEBOOK redirect về redirect_uri với code
   └── GET http://localhost:8081/api-admin/oauth2/code/facebook?code=XXX

7. SPRING SECURITY OAuth2 Login AuthenticationFilter nhận request
   └── Xử lý authentication
   └── Gọi Facebook API lấy access_token và user info

8. CustomOAuth2UserService.loadUser() được gọi
   └── Lấy email từ Facebook response
   └── Tìm user trong database
   └── Kiểm tra status
   └── Trả về CustomOAuth2User

9. OAuth2AuthenticationSuccessHandler xử lý
   └── Tạo JWT
   └── Set cookie
   └── Redirect về FE
```

---

## 7. Cấu hình Production

### 7.1 Meta for Developers - Production

1. Hoàn thành **App Review** cho các permissions cần thiết
2. Thêm domain của production vào **App Domains**
3. Cập nhật **Valid OAuth Redirect URIs** với production URLs:

```
https://admin.greenlab.io.vn/api-admin/oauth2/code/facebook
https://admin.greenlab.io.vn/login/oauth2/code/facebook
```

### 7.2 Application Properties - Production

```properties
# Production - sử dụng environment variables
spring.security.oauth2.client.registration.facebook.client-id=${FB_CLIENT_ID}
spring.security.oauth2.client.registration.facebook.client-secret=${FB_CLIENT_SECRET}
spring.security.oauth2.client.registration.facebook.redirect-uri=${APP_BASE_URL}/api-admin/oauth2/code/facebook
```

### 7.3 Frontend Environment

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://admin.greenlab.io.vn/api-admin',
  frontendUrl: 'https://admin.greenlab.io.vn'
};
```

---

## 8. So sánh Google vs Facebook

| Aspect | Google | Facebook |
|--------|--------|----------|
| Endpoint | `/oauth2/authorization/google` | `/oauth2/authorization/facebook` |
| Default Callback | `/login/oauth2/code/google` | `/login/oauth2/code/facebook` |
| Custom Callback | Theo config `redirect-uri` | Theo config `redirect-uri` |
| Scope | `openid,profile,email` | `email,public_profile` |
| User Info | `email`, `name`, `picture` | `id`, `name`, `email`, `picture` |
| User ID Field | `sub` | `id` |
| App Console | Google Cloud Console | Meta for Developers |

---

## 9. Bảo mật

### 9.1 Các lưu ý quan trọng

1. **Không share credentials:**
   - Không commit App Secret vào git
   - Sử dụng environment variables hoặc secrets manager

2. **Validate redirect URIs:**
   - Chỉ chấp nhận URIs từ domain của bạn
   - Cấu hình đầy đủ cả development và production URIs

3. **Rate Limiting:**
   - Facebook có giới hạn API calls
   - Implement caching nếu cần

4. **Token Security:**
   - JWT token được lưu trong HTTP-only cookie
   - SameSite=Lax để tránh CSRF

### 9.2 OAuth2 Security Checklist

- [ ] HTTPS được sử dụng (production)
- [ ] Redirect URIs được validate đầy đủ
- [ ] State parameter được sử dụng (có trong Spring Security)
- [ ] Token expiration được set hợp lý
- [ ] Refresh token flow được implement nếu cần
