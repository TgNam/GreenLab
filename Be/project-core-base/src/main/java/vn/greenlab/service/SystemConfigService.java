package vn.greenlab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.greenlab.model.enums.SystemConfigKey;
import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.SystemConfig;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.repository.SystemConfigRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.json.JSONObject;
import vn.greenlab.utils.SearchParamNormalizer;
import vn.greenlab.utils.SearchParamValidator;

@Service
public class SystemConfigService {
    @Autowired
    private SystemConfigRepository systemConfigRepository;

    public String getByConfigKey(SystemConfigKey configKey) {
        Optional<SystemConfig> systemConfig = systemConfigRepository.findByKey(configKey);
        if (systemConfig.isPresent()) {
            return systemConfig.get().getValue();
        }
        else {
            return getDefaultValue(configKey);
        }
    }

    public String getDefaultValue(SystemConfigKey configKey) {
        switch(SystemConfigKey.VERSION_CONFIG) {
            case VERSION_CONFIG:
                return "{\"location\": \"1.0.0\"}";
            case PRICE_POLICY_DEFAULT:
                return "2023";
            default:
                return null;
        }
    }

    public Page<SystemConfig> getAllSystemConfig(Integer page, Integer size, String name , String value, SystemConfigKey key, Boolean isActive,
                                                 String timeFrom, String timeTo, String typeSort) {
        page = SearchParamNormalizer.normalizePage(page);
        String sortField = "create_time";
        Sort.Direction sortDirection = Sort.Direction.DESC;

        if (typeSort != null) {
            String upperTypeSort = typeSort.toUpperCase();

            if (upperTypeSort.contains("UPDATETIME")) {
                sortField = "update_time";
            } else if (upperTypeSort.contains("CREATEDTIME")) {
                sortField = "create_time";
            }
        }

        Sort sort = Sort.by(sortDirection, sortField);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SystemConfig> systemConfigs = systemConfigRepository.findByFilters(key, isActive,
                SearchParamValidator.convertLocalDateTime(timeFrom, false),
                SearchParamValidator.convertLocalDateTime(timeTo, true),
                typeSort, name, value, pageable);

        return systemConfigs;
    }

    public Optional<SystemConfig> findConfigByKey(SystemConfigKey key) {
        return systemConfigRepository.findByKey(key);
    }

    @Transactional
    public SystemConfig create(SystemConfig config) {
        config.setCreate_time(LocalDateTime.now());
        config.setUpdate_time(LocalDateTime.now());
        return systemConfigRepository.save(config);
    }
    @Transactional
    public SystemConfig update(SystemConfigKey key, SystemConfig config) {
        Optional<SystemConfig> existingOpt = systemConfigRepository.findByKey(key);
        if (existingOpt.isEmpty()) {
            throw new BadRequestException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND);
        }
        SystemConfig existing = existingOpt.get();
        existing.setValue(config.getValue());
        existing.setName(config.getName());
        existing.setNote(config.getNote());
        existing.setActive(config.isActive());
        existing.setUpdate_time(LocalDateTime.now());
        existing.setUpdated_by(config.getUpdated_by());
        return systemConfigRepository.save(existing);
    }

    @Transactional
    public void delete(SystemConfigKey key) {
        systemConfigRepository.deleteByKey(key);
    }

    public List<SystemConfig> findAll() {
        return systemConfigRepository.findAll();
    }
    @Transactional
    public void changeActiveStatus(SystemConfigKey configKey,long adminId,boolean active) {
        Optional<SystemConfig> systemConfig = systemConfigRepository.findByKey(configKey);
        if (systemConfig.isPresent()) {
            SystemConfig systemConfigExisting = systemConfig.get();
            systemConfigExisting.setActive(active);
            systemConfigExisting.setUpdate_time(LocalDateTime.now());
            systemConfigExisting.setUpdated_by(Math.toIntExact(adminId));
            systemConfigRepository.save(systemConfigExisting);
        }else {
            throw new BadRequestException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND);
        }
    }

    @Transactional
    public void incrementLocationVersion() {
        Optional<SystemConfig> configOpt = systemConfigRepository.findByKey(SystemConfigKey.VERSION_CONFIG);
        
        String currentValue;
        if (configOpt.isPresent()) {
            currentValue = configOpt.get().getValue();
        } else {
            // Create new config with default value
            currentValue = getDefaultValue(SystemConfigKey.VERSION_CONFIG);
        }
        
        try {
            JSONObject jsonObject = new JSONObject(currentValue);
            String locationVersion = jsonObject.optString("location", "1.0.0");
            
            // Increment version: split by ".", increment last part
            String[] parts = locationVersion.split("\\.");
            if (parts.length >= 3) {
                try {
                    int lastPart = Integer.parseInt(parts[parts.length - 1]);
                    lastPart++;
                    parts[parts.length - 1] = String.valueOf(lastPart);
                    locationVersion = String.join(".", parts);
                } catch (NumberFormatException e) {
                    // If parsing fails, reset to 1.0.1
                    locationVersion = "1.0.1";
                }
            } else {
                // If format is wrong, reset to 1.0.1
                locationVersion = "1.0.1";
            }
            
            jsonObject.put("location", locationVersion);
            String newValue = jsonObject.toString();
            
            if (configOpt.isPresent()) {
                // Update existing config
                SystemConfig existing = configOpt.get();
                existing.setValue(newValue);
                existing.setUpdate_time(LocalDateTime.now());
                systemConfigRepository.save(existing);
            } else {
                // Create new config
                SystemConfig newConfig = new SystemConfig();
                newConfig.setKey(SystemConfigKey.VERSION_CONFIG);
                newConfig.setName("Danh sách cấu hình các phiên bản");
                newConfig.setValue(newValue);
                newConfig.setActive(true);
                newConfig.setCreate_time(LocalDateTime.now());
                newConfig.setUpdate_time(LocalDateTime.now());
                systemConfigRepository.save(newConfig);
            }
        } catch (Exception e) {
            // If JSON parsing fails, create/update with default incremented version
            String newValue = "{\"location\": \"1.0.1\"}";
            if (configOpt.isPresent()) {
                SystemConfig existing = configOpt.get();
                existing.setValue(newValue);
                existing.setUpdate_time(LocalDateTime.now());
                systemConfigRepository.save(existing);
            } else {
                SystemConfig newConfig = new SystemConfig();
                newConfig.setKey(SystemConfigKey.VERSION_CONFIG);
                newConfig.setName("Danh sách cấu hình các phiên bản");
                newConfig.setValue(newValue);
                newConfig.setActive(true);
                newConfig.setCreate_time(LocalDateTime.now());
                newConfig.setUpdate_time(LocalDateTime.now());
                systemConfigRepository.save(newConfig);
            }
        }
    }

}
