package vn.greenlab.model.input;

import lombok.Data;

@Data
public class AuthDtos {
    @Data
    public static class AdminLoginRequest {
        private String usernameOrEmail;
        private String password;
        private boolean rememberMe;
    }

    @Data
    public static class UserLoginRequest {
        private String phoneOrEmail;
        private String password;
    }

    @Data
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
    }

    @Data
    public static class ForgotPasswordRequest {
        /** Email nhân viên đã đăng ký trong hệ thống */
        private String email;
    }

    @Data
    public static class TokenResponse {
        private String token;
        private String adminName;
        private String adminAvatar;

        public TokenResponse(String token) {
            this.token = token;
        }

        public TokenResponse(String token, String adminName, String adminAvatar) {
            this.token = token;
            this.adminName = adminName;
            this.adminAvatar = adminAvatar;
        }
    }
}
