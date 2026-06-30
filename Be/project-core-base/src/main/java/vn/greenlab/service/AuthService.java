package vn.greenlab.service;

import lombok.AllArgsConstructor;
import lombok.Data;

import org.springframework.util.DigestUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.greenlab.model.Administrator;
import vn.greenlab.repository.AdministratorRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;
import vn.greenlab.exception.BadRequestException;
import vn.greenlab.exception.NotFoundException;
import vn.greenlab.model.enums.LogAdminType;
import vn.greenlab.model.enums.EmailOutboxType;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.utils.PasswordUtils;
import vn.greenlab.utils.TextUtils;

@Service
public class AuthService {

    private final AdministratorRepository administratorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdministratorService administratorService;

    // @Autowired
    // private EmailOutboxService emailOutboxService;

    // @Autowired
    // private LogAdminService logAdminService;

    public AuthService(AdministratorRepository administratorRepository,
            PasswordEncoder passwordEncoder, AdministratorService administratorService) {
        this.administratorRepository = administratorRepository;
        this.passwordEncoder = passwordEncoder;
        this.administratorService = administratorService;
    }

    public Optional<AuthResult> authenticateAdministrator(String usernameOrEmail, String rawPassword) {
        Optional<Administrator> adminOpt = administratorRepository.findByUser_name(usernameOrEmail);
        if (adminOpt.isEmpty()) {
            adminOpt = administratorRepository.findByEmail(usernameOrEmail);
        }
        if (adminOpt.isEmpty()) {
            return Optional.empty();
        }

        Administrator admin = adminOpt.get();
        if (!matchesPassword(rawPassword, admin.getPassword(), admin.getSalt())) {
            return Optional.empty();
        }

        return Optional.of(new AuthResult("ADMIN", admin.getId(), admin.getUser_name(), admin.getEmail()));
    }

    /**
     * Đổi mật khẩu admin: kiểm tra mật khẩu hiện tại (MD5+salt hoặc BCrypt), lưu mật khẩu mới dạng BCrypt.
     */
    @Transactional
    public void changeAdministratorPassword(int administratorId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException(ErrorCode.PASSWORD_NEW_EMPTY);
        }
        Administrator admin = administratorRepository.findById(administratorId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ADMIN_NOT_FOUND));
        if (admin.getStatus() == 0) {
            throw new BadRequestException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (!matchesPassword(currentPassword, admin.getPassword(), admin.getSalt())) {
            throw new BadRequestException(ErrorCode.WRONG_PASSWORD);
        }
        admin.setPassword(passwordEncoder.encode(newPassword));
        admin.setSalt(RandomStringUtils.randomAlphanumeric(25));
        admin.setUpdate_time(LocalDateTime.now());
        admin.setChange_password_time(LocalDateTime.now());
        administratorRepository.save(admin);
        administratorService.clearAdministratorCache(admin.getId());
    }

    /**
     * Quên mật khẩu: tìm nhân viên theo email, sinh mật khẩu 8 ký tự (chữ thường, chữ hoa, số), lưu BCrypt.
     * Trả về payload HTML để gửi mail sau này; không trả mật khẩu ra API công khai.
     */
    @Transactional
    public void resetAdministratorPasswordByEmail(String emailInput) {
        if (!TextUtils.validateEmail(emailInput)) {
            throw new BadRequestException(ErrorCode.INVALID_EMAIL_FORMAT);
        }
        emailInput = emailInput.trim().toLowerCase();
        Optional<Administrator> adminOpt = administratorRepository.findByEmail(emailInput);
        if (adminOpt.isEmpty()) {
            throw new BadRequestException(ErrorCode.ACCOUNT_NOT_EXISTS);
        }
        Administrator admin = adminOpt.get();
        if (admin.getStatus() == 0) {
            throw new BadRequestException(ErrorCode.ACCOUNT_LOCKED);
        }

        String plainPassword = PasswordUtils.generateRandomPassword8Chars();
        admin.setPassword(passwordEncoder.encode(plainPassword));
        admin.setSalt(RandomStringUtils.randomAlphanumeric(25));
        admin.setUpdate_time(LocalDateTime.now());
        admin.setChange_password_time(LocalDateTime.now());
        administratorRepository.save(admin);
        administratorService.clearAdministratorCache(admin.getId());
        // try {
        //     EmailOutboxType type = EmailOutboxType.STAFF_RESETPASSWORD;
        //     String subject = type.getDescription();
        //     emailOutboxService.send(type, admin.getEmail(), subject, Map.of("password", plainPassword), 0);
        // } catch (Exception e) {
        //     logAdminService.add(TextUtils.getDetailError(e), admin.getEmail(),
        //     "Có lỗi khi gửi email: " + TextUtils.getDetailError(e), LogAdminType.EXCEPTION, 0, "System");
        // }
    }


    private boolean matchesPassword(String raw, String storedHash, String salt) {
        if (storedHash == null) {
            return false;
        }
        // BCrypt/MCF hash — verify even when `salt` cột còn giá trị (legacy MD5 từng dùng cột salt).
        if (storedHash.startsWith("$2")) {
            return passwordEncoder.matches(raw, storedHash);
        }
        if (salt != null && !salt.isEmpty()) {
            return DigestUtils.md5DigestAsHex((raw + salt).getBytes()).equals(storedHash);
        }
        return passwordEncoder.matches(raw, storedHash);
    }

    @Data
    @AllArgsConstructor
    public static class AuthResult {

        private String type;
        private long id;
        private String subject;
        private String email;
    }
}
