# OAuth2 Login Documentation - GreenLab

## Mục lục
1. [Tổng quan luồng hoạt động](#1-tổng-quan-luồng-hoạt-động)
2. [Frontend Components](#2-frontend-components)
   - [2.1 auth-login-v2.component.ts](#21-auth-login-v2componentts)
   - [2.2 authentication.service.ts](#22-authenticationservicets)
   - [2.3 app.component.ts](#23-appcomponentts)
   - [2.4 oauth2-redirect.component.ts](#24-oauth2-redirectcomponentts)
3. [Backend Components](#3-backend-components)
   - [3.1 CustomOAuth2UserService.java](#31-customoauth2userservicejava)
   - [3.2 CustomOAuth2User.java](#32-customoauth2userjava)
   - [3.3 OAuth2LoginException.java](#33-oauth2loginexceptionjava)
   - [3.4 OAuth2AuthenticationSuccessHandler.java](#34-oauth2authenticationsuccesshandlerjava)
   - [3.5 OAuth2AuthenticationFailureHandler.java](#35-oauth2authenticationfailurehandlerjava)
   - [3.6 HttpCookieOAuth2AuthorizationRequestRepository.java](#36-httpcookieoauth2authorizationrequestrepositoryjava)
4. [Chi tiết luồng hoạt động](#4-chi-tiết-luồng-hoạt-động)
5. [Các lỗi thường gặp](#5-các-lỗi-thường-gặp)

---

## 1. Tổng quan luồng hoạt động

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Angular)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User nhấn "Login with Google"                                         │
│     └── loginWithGoogle()                                                   │
│         └── window.location.href = /oauth2/authorization/google             │
│                                                                             │
│  2. Sau khi OAuth2 thành công, BE redirect về:                            │
│     └── /pages?error=xxx&message=yyy (nếu lỗi)                             │
│     └── /pages (nếu thành công - token trong cookie)                       │
│                                                                             │
│  3. OAuth2RedirectComponent đọc query params và redirect sang /login     │
│                                                                             │
│  4. AuthLoginV2Component nhận error params → hiển thị thông báo lỗi      │
│                                                                             │
│  5. AppComponent sync currentUser từ /auth/me nếu:                        │
│     └── Có token trong cookie                                               │
│     └── KHÔNG có currentUser trong localStorage                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Spring Boot)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /oauth2/authorization/google                                               │
│  └── Spring Security OAuth2 Client                                          │
│      └── CustomOAuth2UserService.loadUser()                                │
│          ├── Gọi Google API lấy thông tin user                              │
│          ├── Kiểm tra user có trong DB không                                │
│          ├── Kiểm tra status của user                                       │
│          └── Trả về CustomOAuth2User hoặc throw OAuth2LoginException      │
│                                                                             │
│  Thành công → OAuth2AuthenticationSuccessHandler                          │
│  └── Tạo JWT token                                                          │
│  └── Set cookie "token"                                                     │
│  └── Redirect về FE với cookie                                              │
│                                                                             │
│  Thất bại → OAuth2AuthenticationFailureHandler                             │
│  └── Redirect về FE với error params                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Components

### 2.1 auth-login-v2.component.ts

**Đường dẫn:** `Fe/project-web-base/src/app/main/authentication/auth-login-v2/auth-login-v2.component.ts`

#### 2.1.1 Hàm `loginWithGoogle()` (Dòng 269-273)

```typescript
loginWithGoogle() {
  const googleLoginUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  const redirectUri = encodeURIComponent(`${environment.frontendUrl}/pages`);
  window.location.href = `${googleLoginUrl}?redirect_uri=${redirectUri}`;
}
```

**Mục đích:** Bắt đầu quá trình OAuth2 login với Google.

**Giải thích từng dòng:**
| Dòng | Mục đích |
|------|----------|
| `googleLoginUrl` | URL endpoint của BE để bắt đầu OAuth2 flow |
| `redirectUri` | URL mà BE sẽ redirect về sau khi login (encode để tránh lỗi) |
| `window.location.href` | Chuyển hướng trình duyệt đến BE |

**Lưu ý:** Redirect URI là `/pages` - không phải `/login`. Đây là endpoint trung gian để xử lý OAuth2 redirect.

---

#### 2.1.2 Hàm `checkOAuth2Error()` (Dòng 193-209)

```typescript
private checkOAuth2Error(): void {
  this._route.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
    if (params['error']) {
      const errorCode = params['error'];
      let message = params['message'];
      
      if (!message) {
        message = this.getOAuth2ErrorMessage(errorCode);
      }
      
      this.error = message;
      this.cdr.detectChanges();
    }
  });
}
```

**Mục đích:** Đọc error params từ URL khi OAuth2 redirect về và hiển thị thông báo lỗi.

**Giải thích:**
| Dòng | Mục đích |
|------|----------|
| `_route.queryParams` | Lắng nghe query parameters từ URL |
| `params['error']` | Error code từ BE (vd: `account_locked`, `user_not_exist`) |
| `params['message']` | Error message từ BE (đã encode) |
| `this.error = message` | Gán message để hiển thị trên UI |
| `cdr.detectChanges()` | Trigger Angular change detection để update UI ngay |

---

#### 2.1.3 Hàm `getOAuth2ErrorMessage()` (Dòng 214-222)

```typescript
private getOAuth2ErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'user_not_exist': 'Tài khoản không tồn tại trong hệ thống. Vui lòng liên hệ Admin.',
    'account_locked': 'Tài khoản của bạn đã bị khóa.',
    'email_not_found': 'Không tìm thấy email từ Google.',
    'login_failed': 'Đăng nhập Google thất bại.'
  };
  return errorMessages[errorCode] || 'Đăng nhập thất bại. Vui lòng thử lại.';
}
```

**Mục đích:** Map error code từ BE sang message tiếng Việt để hiển thị cho user.

**Các error codes:**
| Error Code | Message |
|------------|---------|
| `user_not_exist` | User không tồn tại trong DB |
| `account_locked` | User bị khóa (status = 0) |
| `email_not_found` | Google không trả về email |
| `login_failed` | Lỗi chung |

---

### 2.2 authentication.service.ts

**Đường dẫn:** `Fe/project-web-base/src/app/auth/service/authentication.service.ts`

#### 2.2.1 Hàm `hasToken()` (Dòng 39-41)

```typescript
public hasToken(): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith('token='));
}
```

**Mục đích:** Kiểm tra xem browser có lưu JWT token trong cookie không.

**Giải thích:**
| Dòng | Mục đích |
|------|----------|
| `document.cookie` | Lấy tất cả cookies của domain hiện tại |
| `split(';')` | Tách thành mảng các cookie |
| `some(c => c.trim().startsWith('token='))` | Kiểm tra có cookie nào bắt đầu bằng `token=` |

**Tại sao cần hàm này?**
- OAuth2 login thành công → BE set JWT vào cookie
- FE cần biết có token hay không để quyết định có gọi `/auth/me` hay không
- Tránh gọi API không cần thiết khi không có token

---

#### 2.2.2 Hàm `getCurrentUser()` (Dòng 146-171)

```typescript
getCurrentUser(): Observable<any> {
  return this._http.get<any>(`${environment.apiUrl}/auth/me`, { withCredentials: true }).pipe(
    map(res => {
      if (res && res.success && res.data) {
        const user: User = {
          id: res.data.id,
          email: res.data.email,
          password: '',
          firstName: '',
          lastName: '',
          fullName: res.data.fullName,
          avatar: res.data.avatar,
          role: Role.Admin
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }
      return null;
    }),
    catchError(err => {
      console.log('getCurrentUser error:', err);
      return throwError(() => err);
    })
  );
}
```

**Mục đích:** Gọi API `/auth/me` để lấy thông tin user từ JWT token trong cookie.

**Giải thích:**
| Dòng | Mục đích |
|------|----------|
| `{ withCredentials: true }` | Gửi cookie cùng request (quan trọng!) |
| `localStorage.setItem('currentUser', ...)` | Lưu user vào localStorage để reuse |
| `this.currentUserSubject.next(user)` | Emit user mới cho các subscribers |

**Lưu ý quan trọng:**
- `{ withCredentials: true }` bắt buộc phải có để gửi JWT cookie
- Không có option này, request sẽ không gửi cookie → authentication fail

---

#### 2.2.3 Hàm `logout()` (Dòng 177-183)

```typescript
logout() {
  document.cookie = "token=; Max-Age=0; path=/";
  localStorage.removeItem('currentUser');
  this.currentUserSubject.next(null);
}
```

**Mục đích:** Xóa token cookie và clear user data khi logout.

---

### 2.3 app.component.ts

**Đường dẫn:** `Fe/project-web-base/src/app/app.component.ts`

#### 2.3.1 Hàm `syncCurrentUserFromBackend()` (Dòng 254-269)

```typescript
private syncCurrentUserFromBackend(): void {
  const currentUser = this._authService.currentUserValue;
  // Only call /auth/me if cookie has token AND currentUser is not set
  if (!currentUser && this._authService.hasToken()) {
    this._authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          console.log('User synced from backend:', user);
        }
      },
      error: (err) => {
        console.log('No valid session or /auth/me failed:', err);
      }
    });
  }
}
```

**Mục đích:** Sync thông tin user từ BE sau khi OAuth2 redirect về.

**Điều kiện để gọi API:**
| Điều kiện | Giá trị | Giải thích |
|-----------|---------|------------|
| `!currentUser` | true | Chưa có user trong localStorage |
| `hasToken()` | true | Có JWT token trong cookie |

**Tại sao cần cả 2 điều kiện?**
- Có `currentUser` → User đã login, không cần sync
- Không có `hasToken()` → Không có JWT, gọi `/auth/me` sẽ fail

---

### 2.4 oauth2-redirect.component.ts

**Đường dẫn:** `Fe/project-web-base/src/app/main/authentication/oauth2-redirect/oauth2-redirect.component.ts`

```typescript
@Component({
  selector: 'app-oauth2-redirect',
  template: `<div class="text-center p-5"><p>Đang xử lý...</p></div>`
})
export class OAuth2RedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    const message = this.route.snapshot.queryParamMap.get('message');
    
    // Redirect to login with query params preserved
    this.router.navigate(['/login'], {
      queryParams: { error, message },
      queryParamsHandling: 'merge'
    });
  }
}
```

**Mục đích:** Component trung gian để xử lý OAuth2 redirect.

**Vấn đề được giải quyết:**
- BE redirect về `/pages?error=xxx`
- Angular route redirect (`redirectTo`) KHÔNG giữ query params
- Nên cần component này để đọc params và redirect sang `/login`

**Luồng:**
```
/pages?error=account_locked&message=Tài%20khoản...
        ↓
OAuth2RedirectComponent đọc params
        ↓
/login?error=account_locked&message=Tài%20khoản...
        ↓
AuthLoginV2Component hiển thị lỗi
```

---

## 3. Backend Components

### 3.1 CustomOAuth2UserService.java

**Đường dẫn:** `Be/project-admin-api-base/src/main/java/vn/greenlab/security/oauth2/CustomOAuth2UserService.java`

#### 3.1.1 Hàm `loadUser()` (Dòng 27-33)

```java
@Override
public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) {
    log.info("=== CustomOAuth2UserService.loadUser called ===");
    OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
    String email = oAuth2User.getAttribute("email");
    log.info("Got OAuth2User from Google: {}", email);
    return processOAuth2User(oAuth2UserRequest, oAuth2User);
}
```

**Mục đích:** Entry point - được gọi bởi Spring Security khi nhận OAuth2 callback từ Google.

**Giải thích:**
| Dòng | Mục đích |
|------|----------|
| `super.loadUser()` | Gọi implementation của Spring, gửi request đến Google API để lấy user info |
| `oAuth2User.getAttribute("email")` | Lấy email từ response của Google |
| `processOAuth2User()` | Validate và xử lý user |

---

#### 3.1.2 Hàm `processOAuth2User()` (Dòng 35-69)

```java
private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
    String email = oAuth2User.getAttribute("email");
    
    // 1. Kiểm tra email có tồn tại không
    if (email == null || email.isEmpty()) {
        throw new OAuth2LoginException("email_not_found", "Không tìm thấy email từ Google");
    }

    // 2. Tìm user trong database
    Optional<Administrator> adminOpt = administratorRepository.findByEmailIgnoreCase(email);
    if (adminOpt.isEmpty()) {
        throw new OAuth2LoginException("user_not_exist", "Tài khoản không tồn tại trong hệ thống. Vui lòng liên hệ Admin.");
    }

    // 3. Kiểm tra status của user
    Administrator admin = adminOpt.get();
    if (admin.getStatus() == 0) {
        throw new OAuth2LoginException("account_locked", "Tài khoản của bạn đã bị khóa.");
    }

    // 4. Update provider info nếu cần
    if (admin.getProvider() == null || admin.getProviderId() == null) {
        admin.setProvider(SocialProvider.GOOGLE);
        admin.setProviderId(oAuth2User.getAttribute("sub"));
        administratorRepository.save(admin);
    }

    // 5. Trả về custom principal
    return new CustomOAuth2User(admin, oAuth2User.getAttributes());
}
```

**Mục đích:** Validate user và trả về principal cho Spring Security.

**Validation steps:**
| Step | Kiểm tra | Exception |
|------|----------|-----------|
| 1 | Email có tồn tại không | `email_not_found` |
| 2 | User có trong DB không | `user_not_exist` |
| 3 | User có bị khóa không | `account_locked` |
| 4 | Update provider info | - |

---

### 3.2 CustomOAuth2User.java

**Đường dẫn:** `Be/project-admin-api-base/src/main/java/vn/greenlab/security/oauth2/CustomOAuth2User.java`

```java
public class CustomOAuth2User implements OAuth2User {
    private final Administrator administrator;
    private final Map<String, Object> attributes;

    public CustomOAuth2User(Administrator administrator, Map<String, Object> attributes) {
        this.administrator = administrator;
        this.attributes = attributes;
    }

    public Administrator getAdministrator() { return administrator; }

    @Override
    public Map<String, Object> getAttributes() { return attributes; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return null; }

    @Override
    public String getName() { return administrator.getEmail(); }
}
```

**Mục đích:** Custom Principal chứa thông tin Administrator.

**Tại sao cần class này?**
- Spring Security OAuth2 mặc định chỉ có `OAuth2User` với attributes từ Google
- Cần gắn thêm thông tin `Administrator` từ database
- `getAdministrator()` cho phép handler truy cập DB entity dễ dàng

---

### 3.3 OAuth2LoginException.java

**Đường dẫn:** `Be/project-admin-api-base/src/main/java/vn/greenlab/security/oauth2/OAuth2LoginException.java`

```java
public class OAuth2LoginException extends OAuth2AuthenticationException {
    private final String errorCode;

    public OAuth2LoginException(String errorCode, String message) {
        super(new OAuth2Error(errorCode, message, null), message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
```

**Mục đích:** Custom exception mang theo error code và message.

**Tại sao không dùng `OAuth2AuthenticationException` trực tiếp?**
- Spring Security 6.2.x có bug `StackOverflowError` khi so sánh `OAuth2Error` objects
- Custom exception với `equals()` và `hashCode()` riêng tránh được bug này
- `errorCode` giúp FE xác định loại lỗi dễ dàng hơn

---

### 3.4 OAuth2AuthenticationSuccessHandler.java

**Đường dẫn:** `Be/project-admin-api-base/src/main/java/vn/greenlab/security/oauth2/OAuth2AuthenticationSuccessHandler.java`

```java
@Override
public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                   Authentication authentication) throws IOException {
    // 1. Đọc redirect URI từ cookie
    Optional<String> redirectUri = HttpCookieOAuth2AuthorizationRequestRepository
            .getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
            .map(Cookie::getValue);

    String targetUrl = redirectUri.orElse("/");

    // 2. Lấy thông tin Administrator
    CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
    Administrator admin = oAuth2User.getAdministrator();

    // 3. Update last login IP
    admin.setLast_login_ip(getClientIp(request));
    administratorRepository.save(admin);

    // 4. Tạo JWT token
    Map<String, Object> claims = new HashMap<>();
    claims.put("email", admin.getEmail());
    claims.put("id", admin.getId());
    Map<String, Object> tokenMap = jwtService.generateToken(
        admin.getUser_name() != null ? admin.getUser_name() : admin.getEmail(), 
        claims, 
        false
    );
    String token = (String) tokenMap.get("token");
    Date expiryDate = (Date) tokenMap.get("expiryDate");
    long maxAge = (expiryDate.getTime() - System.currentTimeMillis()) / 1000;

    // 5. Set JWT vào cookie
    ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie.from("token", token)
            .path("/")
            .maxAge(maxAge);

    if (!isLocalhostHost(request)) {
        cookieBuilder.sameSite("Lax").secure(true).domain("greenlab.io.vn");
    } else {
        cookieBuilder.sameSite("Lax");
    }
    response.addHeader(HttpHeaders.SET_COOKIE, cookieBuilder.build().toString());

    // 6. Cleanup cookies
    httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

    // 7. Redirect về FE
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
}
```

**Mục đích:** Xử lý khi OAuth2 login thành công.

**Các bước thực hiện:**
| Step | Hành động | Chi tiết |
|------|-----------|----------|
| 1 | Đọc redirect URI | Từ cookie đã lưu khi bắt đầu OAuth2 |
| 2 | Lấy Admin | Từ `CustomOAuth2User.getAdministrator()` |
| 3 | Update last login | Ghi nhận IP đăng nhập |
| 4 | Tạo JWT | Dùng `JwtService.generateToken()` |
| 5 | Set cookie | Cookie `token` với maxAge từ JWT expiry |
| 6 | Cleanup | Xóa OAuth2 temp cookies |
| 7 | Redirect | Về FE URL |

**Cookie settings:**
| Env | Settings |
|-----|----------|
| localhost | `sameSite=Lax` |
| production | `sameSite=Lax`, `secure=true`, `domain=greenlab.io.vn` |

---

### 3.5 OAuth2AuthenticationFailureHandler.java

**Đường dẫn:** `Be/project-admin-api-base/src/main/java/vn/greenlab/security/oauth2/OAuth2AuthenticationFailureHandler.java`

```java
@Override
public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                    AuthenticationException exception) throws IOException {
    // 1. Đọc redirect URI từ cookie
    Optional<String> redirectUri = HttpCookieOAuth2AuthorizationRequestRepository
            .getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
            .map(Cookie::getValue);

    String baseUrl = redirectUri.orElse("/");

    // 2. Extract error info
    String errorCode = "login_failed";
    String errorMessage = "Đăng nhập thất bại. Vui lòng thử lại.";

    if (exception instanceof OAuth2LoginException oauth2Ex) {
        errorCode = oauth2Ex.getErrorCode();
        errorMessage = oauth2Ex.getMessage();
    }

    // 3. Build redirect URL với params
    String targetUrl = UriComponentsBuilder
            .fromUriString(baseUrl)
            .queryParam("error", errorCode)
            .queryParam("message", errorMessage)
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUriString();

    // 4. Cleanup và redirect
    httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
}
```

**Mục đích:** Xử lý khi OAuth2 login thất bại.

**Error handling:**
| Exception Type | Error Code | Message |
|----------------|------------|---------|
| `OAuth2LoginException` | Từ exception | Từ exception |
| Other exception | `login_failed` | Exception message |

---

### 3.6 HttpCookieOAuth2AuthorizationRequestRepository.java

**Đường dẫn:** `Be/project-admin-api-base/src/main/java/vn/greenlab/security/oauth2/HttpCookieOAuth2AuthorizationRequestRepository.java`

#### 3.6.1 Interface Implementation

```java
public class HttpCookieOAuth2AuthorizationRequestRepository 
    implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
```

**Mục đích:** Lưu trữ OAuth2 authorization request và redirect URI trong cookies thay vì session.

**Tại sao dùng Cookie thay vì Session?**
- OAuth2 flow có thể qua nhiều redirects
- Cookie được gửi kèm mọi request
- Không phụ thuộc vào server session storage

---

#### 3.6.2 Hàm `saveAuthorizationRequest()` (Dòng 28-40)

```java
@Override
public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, 
                                    HttpServletRequest request, HttpServletResponse response) {
    if (authorizationRequest == null) {
        deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
        return;
    }

    // Lưu OAuth2 request vào cookie
    addCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, 
              serialize(authorizationRequest), cookieExpireSeconds);
    
    // Lưu redirect URI vào cookie
    String redirectUriAfterLogin = request.getParameter("redirect_uri");
    if (StringUtils.isNotBlank(redirectUriAfterLogin)) {
        addCookie(response, REDIRECT_URI_PARAM_COOKIE_NAME, 
                  redirectUriAfterLogin, cookieExpireSeconds);
    }
}
```

**Cookies được tạo:**
| Cookie Name | Nội dung | Expires |
|-------------|---------|---------|
| `oauth2_auth_request` | Serialized OAuth2AuthorizationRequest | 180s |
| `redirect_uri` | URL FE để redirect về | 180s |

---

#### 3.6.3 Hàm `serialize()` / `deserialize()` (Dòng 87-93)

```java
private String serialize(Object object) {
    return Base64.getUrlEncoder().encodeToString(SerializationUtils.serialize(object));
}

private Object deserialize(String cookie) {
    return SerializationUtils.deserialize(Base64.getUrlDecoder().decode(cookie));
}
```

**Mục đích:** Encode/decode OAuth2AuthorizationRequest object thành string để lưu trong cookie.

**Lý do cần encode:**
- Cookie không lưu được Java objects
- `SerializationUtils.serialize()` convert object → bytes
- `Base64.getUrlEncoder()` convert bytes → URL-safe string

---

## 4. Chi tiết luồng hoạt động

### 4.1 OAuth2 Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FULL OAUTH2 FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. FRONTEND → BACKEND: Bắt đầu OAuth2
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ User nhấn "Login with Google"                                            │
   │                                                                          │
   │ GET /oauth2/authorization/google?redirect_uri=http://localhost:4200/pages│
   │                                                                          │
   │ Cookie: redirect_uri=http://localhost:4200/pages                         │
   └─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
2. BACKEND → GOOGLE: Chuyển hướng đến Google
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ 302 Redirect to:                                                        │
   │ https://accounts.google.com/o/oauth2/v2/auth?                             │
   │   client_id=xxx&                                                         │
   │   redirect_uri=http://localhost:8081/api-admin/login/oauth2/code/google& │
   │   response_type=code&                                                    │
   │   scope=email%20profile                                                   │
   └─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
3. GOOGLE → BACKEND: Callback với authorization code
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ GET /login/oauth2/code/google?code=xxx                                    │
   │                                                                          │
   │ Spring Security OAuth2 Client nhận code, gọi Google API đổi code lấy   │
   │ access token và user info                                               │
   └─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
4. BACKEND: CustomOAuth2UserService.loadUser()
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ ✓ Gọi Google API lấy user info: { email, name, picture, sub }           │
   │ ✓ Tìm user trong DB theo email                                          │
   │ ✓ Kiểm tra status (0 = khóa, 1 = active)                               │
   │ ✓ Update provider info nếu cần                                         │
   │                                                                          │
   │ Thành công → Trả về CustomOAuth2User                                   │
   │ Thất bại → Throw OAuth2LoginException với error code                   │
   └─────────────────────────────────────────────────────────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                         ▼                           ▼
5a. SUCCESS                          5b. FAILURE
   ┌────────────────────────────────┐    ┌────────────────────────────────┐
   │ OAuth2AuthenticationSuccessHandler│    │ OAuth2AuthenticationFailureHandler│
   │                                 │    │                                │
   │ 1. Đọc redirect_uri từ cookie  │    │ 1. Extract error code & msg   │
   │ 2. Tạo JWT token               │    │ 2. Build URL với query params  │
   │ 3. Set cookie "token"          │    │ 3. Redirect về FE              │
   │ 4. Update last_login_ip        │    │    /pages?error=xxx&message=yyy│
   │ 5. Redirect về FE              │    │                                │
   │    (cookie được gửi kèm)       │    │                                │
   └────────────────────────────────┘    └────────────────────────────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
6. FRONTEND: Xử lý redirect
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                                                                           │
   │ TRƯỜNG HỢP THÀNH CÔNG:                                                   │
   │ ─────────────────────────                                                  │
   │ /pages (với cookie "token" trong browser)                                  │
   │        ↓                                                                  │
   │ OAuth2RedirectComponent đọc cookie (không có error params)                │
   │        ↓                                                                  │
   │ Redirect sang /login (không có params)                                     │
   │        ↓                                                                  │
   │ AppComponent.syncCurrentUserFromBackend()                                 │
   │   - Kiểm tra: !currentUser && hasToken() → true                          │
   │   - Gọi /auth/me với { withCredentials: true }                          │
   │   - Lưu user vào localStorage                                            │
   │   - Redirect sang /dashboard                                             │
   │                                                                           │
   │ TRƯỜNG HỢP THẤT BẠI:                                                     │
   │ ───────────────────────                                                  │
   │ /pages?error=account_locked&message=Tài%20khoản%20đã%20bị%20khóa         │
   │        ↓                                                                  │
   │ OAuth2RedirectComponent đọc error & message                               │
   │        ↓                                                                  │
   │ Redirect sang /login?error=account_locked&message=Tài%20khoản%20đã%20bị%20khóa│
   │        ↓                                                                  │
   │ AuthLoginV2Component.checkOAuth2Error()                                   │
   │   - Đọc params['error'] và params['message']                             │
   │   - Hiển thị thông báo lỗi trên form                                     │
   │                                                                           │
   └─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Các lỗi thường gặp

### 5.1 StackOverflowError khi login

**Nguyên nhân:** Bug trong Spring Security 6.2.x khi so sánh `OAuth2Error` objects.

**Giải pháp:** Sử dụng `OAuth2LoginException` custom thay vì `OAuth2AuthenticationException`.

---

### 5.2 FE không hiển thị lỗi

**Nguyên nhân:** Redirect URI không khớp route.

**Kiểm tra:**
1. FE redirect đến `/pages` nhưng không có route này
2. Query params bị mất khi redirect

**Giải pháp:** Tạo `OAuth2RedirectComponent` để preserve query params.

---

### 5.3 Cookie không được set

**Nguyên nhân:** Cookie settings không đúng cho môi trường.

**Kiểm tra:**
- Localhost: `sameSite=Lax` (không cần `secure`)
- Production: `sameSite=Lax`, `secure=true`, `domain=xxx`

---

### 5.4 `/auth/me` trả về 401

**Nguyên nhân:** Request không gửi kèm cookie.

**Kiểm tra:**
```typescript
this._http.get(url, { withCredentials: true })  // ← Cần có option này
```

---

## 6. API Endpoints

### 6.1 OAuth2 Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/oauth2/authorization/google` | GET | Bắt đầu OAuth2 flow với Google |
| `/login/oauth2/code/google` | GET | Callback từ Google |

### 6.2 Authentication Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/auth/me` | GET | Lấy thông tin user hiện tại (từ JWT cookie) |
| `/auth/login` | POST | Login thường (username/password) |

---

## 7. Database Schema

### 7.1 Administrator Table

```sql
SELECT id, email, user_name, status, provider, provider_id, last_login_ip
FROM administrators
WHERE email = 'xxx@example.com';
```

| Column | Type | Mô tả |
|--------|------|--------|
| id | BIGINT | Primary key |
| email | VARCHAR | Email (unique) |
| user_name | VARCHAR | Username |
| status | INT | 0 = locked, 1 = active |
| provider | ENUM | GOOGLE, FACEBOOK, etc. |
| provider_id | VARCHAR | ID từ OAuth provider |
| last_login_ip | VARCHAR | IP đăng nhập cuối |
