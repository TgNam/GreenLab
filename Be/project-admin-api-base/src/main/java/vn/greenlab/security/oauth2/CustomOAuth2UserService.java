package vn.greenlab.security.oauth2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.enums.SocialProvider;
import vn.greenlab.repository.AdministratorRepository;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);
    
    private final AdministratorRepository administratorRepository;

    public CustomOAuth2UserService(AdministratorRepository administratorRepository) {
        this.administratorRepository = administratorRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) {
        log.info("=== CustomOAuth2UserService.loadUser called ===");
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        String email = oAuth2User.getAttribute("email");
        log.info("Got OAuth2User from Google: {}", email);
        return processOAuth2User(oAuth2UserRequest, oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        log.info("Processing OAuth2 user with email: {}", email);
        
        if (email == null || email.isEmpty()) {
            log.warn("Email not found from Google");
            throw new OAuth2LoginException("email_not_found", "Không tìm thấy email từ Google");
        }

        // Yêu cầu 4: Chỉ lấy User đã tồn tại, KHÔNG tạo mới
        Optional<Administrator> adminOpt = administratorRepository.findByEmailIgnoreCase(email);
        if (adminOpt.isEmpty()) {
            log.warn("User not found in database: {}", email);
            throw new OAuth2LoginException("user_not_exist", "Tài khoản không tồn tại trong hệ thống. Vui lòng liên hệ Admin.");
        }

        Administrator admin = adminOpt.get();
        log.info("Found admin: {}, status: {}", admin.getEmail(), admin.getStatus());
        
        if (admin.getStatus() == 0) {
            log.warn("Account is locked: {}", email);
            throw new OAuth2LoginException("account_locked", "Tài khoản của bạn đã bị khóa.");
        }

        // Kiểm tra xem request đang đến từ Google hay Facebook
        String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId();

        // Có thể update providerId nếu lần đầu login bằng mạng xã hội
        if (admin.getProvider() == null || admin.getProviderId() == null) {
            if ("facebook".equalsIgnoreCase(registrationId)) {
                admin.setProvider(SocialProvider.FACEBOOK);
                admin.setProviderId(oAuth2User.getAttribute("id"));
            }else if ("github".equalsIgnoreCase(registrationId)) {
                admin.setProvider(SocialProvider.GITHUB);
                admin.setProviderId(oAuth2User.getAttribute("id"));
            }else if ("twitter".equalsIgnoreCase(registrationId)) {
                admin.setProvider(SocialProvider.TWITTER);

                // BẮT BUỘC: Phải lấy object "data" ra trước, sau đó mới lấy "id"
                Map<String, Object> data = oAuth2User.getAttribute("data");
                if (data != null && data.get("id") != null) {
                    admin.setProviderId(String.valueOf(data.get("id")));
                }

            }
            else {
                admin.setProvider(SocialProvider.GOOGLE);
                admin.setProviderId(oAuth2User.getAttribute("sub"));
            }
            administratorRepository.save(admin);
        }

        log.info("OAuth2 login successful for: {}", email);
        // Trả về Custom Principal (để Success Handler có thể lấy thông tin Admin dễ dàng)
        return new CustomOAuth2User(admin, oAuth2User.getAttributes());
    }
}
