package vn.greenlab.component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.redis.connection.RedisStringCommands;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.types.Expiration;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Cache Redis qua chuỗi: {@link String}, {@link Object} (JSON) hoặc {@link List} (JSON array).
 */
@Component
@RequiredArgsConstructor
public class RedisCacheComponent {

    /** Số giây trong 1 ngày (dùng TTL Redis theo pattern {@code A_DAY * 30}). */
    public static final int A_DAY = 60 * 60 * 24;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public static final class CacheKeys {
        private CacheKeys() {
        }

        public static final String CFG_TEST_CATEGORY = "cfg_test_category:all";
        public static final String CFG_TEST_CATEGORY_ID_PREFIX = "cfg_test_category:id:";
        public static final String DOCTOR_SELECT = "doctor:select";
        public static final String DOCTOR_ID_PREFIX = "doctor:id:";
        public static final String DOCTOR_AND_CONFIG_ID_PREFIX = "doctor:with_config:id:";
        public static final String DOCTOR_CONFIG_DOCTOR_ID_PREFIX = "doctor_config:id:";
        public static final String CFG_TEST = "cfg_test";
        public static final String CFG_TEST_ID_PREFIX = "cfg_test:id:";
        public static final String ADMINISTRATOR_LIST = "administrator:all";
        public static final String ADMINISTRATOR_ID_PREFIX = "administrator:id:";
        public static final String ADMINISTRATOR_BASE_INFO_LIST = "administrator:base";
        public static final String PROFILE = "profile:all";
        public static final String PROFILE_ID_PREFIX = "profile:id:";
        public static final String DISTRICT_LIST = "district:all:old";
        public static final String WARD_LIST_OLD = "ward:all:old";
        public static final String WARD_LIST = "ward:all:new";
        public static final String WARD_LIST_ID_PREFIX = "ward:id:";
        public static final String SAMPLE_TYPE = "sample_type:all";
        public static final String INSTRUMENT = "instrument:all";
        public static final String DEPARTMENT_LIST = "department:all";
        public static final String CITY_LIST = "city:all:new";
        public static final String CITY_LIST_OLD = "city:all:old";
        public static final String CITY_LIST_ID_PREFIX = "city:id:";
        public static final String WORK_AREA = "work_area:all";
        public static final String AREA = "area:all";
    }

    public void put(String key, String value) {
        if (key == null || value == null) {
            return;
        }
        redisTemplate.opsForValue().set(key, value);
    }

    public boolean setIfAbsent(String key, String value, Duration ttl) {
        if (key == null || value == null) return false;
        Boolean result = redisTemplate.opsForValue().setIfAbsent(key, value, ttl);
        return Boolean.TRUE.equals(result);
    }

    public void multiPut(Map<String, Object> map, int durationSeconds) {
        if (map == null || map.isEmpty()) return;
        final int timeout = durationSeconds <= 0 ? 20 * 60 : durationSeconds;
        redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            map.forEach((k, v) -> {
                byte[] key = redisTemplate.getStringSerializer().serialize(k);
                byte[] value = redisTemplate.getStringSerializer().serialize(toJson(v));
    
                if (key != null && value != null) {
                    // Thay thế setEx bằng set với Expiration
                    connection.set(key, value, 
                        Expiration.seconds(timeout), 
                        RedisStringCommands.SetOption.upsert());
                }
            });
            return null;
        });
    }

    public void put(String key, String value, Duration ttl) {
        if (key == null || value == null) {
            return;
        }
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            put(key, value);
            return;
        }
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    /**
     * Ghi {@link Object} hoặc {@link List} (và các kiểu JSON-khả dụng khác) dưới dạng JSON, TTL theo giây.
     */
    public void put(String key, Object value, int expireSeconds) {
        if (key == null || value == null) {
            return;
        }
        String payload = toJson(value);
        if (expireSeconds <= 0) {
            redisTemplate.opsForValue().set(key, payload);
        } else {
            redisTemplate.opsForValue().set(key, payload, Duration.ofSeconds(expireSeconds));
        }
    }

    /**
     * Ghi object/list dưới dạng JSON với TTL.
     */
    public void put(String key, Object value, Duration ttl) {
        if (key == null || value == null) {
            return;
        }
        String payload = toJson(value);
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            redisTemplate.opsForValue().set(key, payload);
        } else {
            redisTemplate.opsForValue().set(key, payload, ttl);
        }
    }

    private String toJson(Object value) {
        if (value instanceof String) {
            return (String) value;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Không serialize Redis value sang JSON", e);
        }
    }

    public Optional<String> get(String key) {
        if (key == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    /**
     * Redis MGET: đọc nhiều giá trị string trong một lần, cùng thứ tự với {@code keys}.
     * Key không tồn tại → phần tử tương ứng là {@code null}.
     */
    public List<String> multiGet(Collection<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }
        List<String> values = redisTemplate.opsForValue().multiGet(keys);
        return values != null ? values : List.of();
    }

    /**
     * MGET rồi deserialize JSON sang {@code type} (cùng cách ghi với {@link #put(String, Object, int)}).
     * Key không có hoặc JSON không đọc được → phần tử tương ứng {@code null}.
     */
    public <T> LinkedList<T> multiGet(Collection<String> keys, Class<T> type) {
        if (keys == null || keys.isEmpty() || type == null) {
            return new LinkedList<>();
        }
        List<String> raw = multiGet(keys);
        LinkedList<T> out = new LinkedList<>();
        for (String json : raw) {
            if (json == null) {
                out.add(null);
                continue;
            }
            try {
                if (type == String.class) {
                    out.add(type.cast(json));
                } else {
                    out.add(objectMapper.readValue(json, type));
                }
            } catch (JsonProcessingException e) {
                out.add(null);
            }
        }
        return out;
    }

    /**
     * Đọc JSON thành object (không dùng cho {@link String} đã lưu thuần bằng {@link #put(String, String)} — dùng {@link #get(String)}).
     */
    public <T> Optional<T> get(String key, Class<T> type) {
        return get(key).flatMap(json -> {
            if (type == String.class) {
                return Optional.of(type.cast(json));
            }
            try {
                return Optional.of(objectMapper.readValue(json, type));
            } catch (JsonProcessingException e) {
                return Optional.empty();
            }
        });
    }

    /**
     * Đọc JSON array thành {@link List} (ví dụ {@code getList(key, MyDto.class)}).
     */
    public <T> Optional<List<T>> getList(String key, Class<T> elementType) {
        return get(key).flatMap(json -> {
            try {
                return Optional.of(objectMapper.readValue(json,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, elementType)));
            } catch (JsonProcessingException e) {
                return Optional.empty();
            }
        });
    }

    /**
     * Đọc JSON phức tạp (generic) qua {@link TypeReference}.
     */
    public <T> Optional<T> get(String key, TypeReference<T> typeReference) {
        return get(key).flatMap(json -> {
            try {
                return Optional.of(objectMapper.readValue(json, typeReference));
            } catch (JsonProcessingException e) {
                return Optional.empty();
            }
        });
    }

    /**
     * @return true nếu key tồn tại và đã xóa
     */
    public boolean delete(String key) {
        if (key == null) {
            return false;
        }
        Boolean deleted = redisTemplate.delete(key);
        return Boolean.TRUE.equals(deleted);
    }
}
