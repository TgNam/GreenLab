package vn.greenlab.security.oauth2;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import vn.greenlab.model.Administrator;

import java.util.Collection;
import java.util.Map;

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
    public Collection<? extends GrantedAuthority> getAuthorities() { return null; } // Thêm roles nếu cần

    @Override
    public String getName() { return administrator.getEmail(); }
}
