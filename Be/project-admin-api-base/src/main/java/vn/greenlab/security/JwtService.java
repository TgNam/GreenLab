package vn.greenlab.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import vn.greenlab.model.Administrator;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.service.AdministratorService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expirationMs:86400000}")
    private long jwtExpirationMs;

    @Autowired
    private AdministratorRepository administratorRepository;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Map<String, Object> generateToken(String subject, Map<String, Object> extraClaims, boolean rememberMe) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);
        Date realExpiry = rememberMe ? new Date(expiry.getTime() + 604800000) : expiry;
        String token = Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(realExpiry)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("expiryDate", realExpiry);
        return result;
    }

    public boolean isTokenValid(String token, Long staffId) {
        if (isTokenExpired(token)) {
            return false;
        }
        //namtn tạm comment lại, sau này chạy lên production sẽ mở ra
        // Integer activeAdmin = administratorRepository.checkActiveStatus(staffId);
        // if (activeAdmin == null || 0 == activeAdmin) {
        //     return false;
        // }
        return true;
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
