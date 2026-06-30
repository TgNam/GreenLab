package vn.greenlab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.enums.SystemConfigKey;
import vn.greenlab.model.SystemConfig;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.Response;
import vn.greenlab.service.SystemConfigService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/config/system-configs", name = "Quản lý cấu hình hệ thống")
@Tag(name = "Quản lý cấu hình hệ thống", description = "API quản lý cấu hình hệ thống")
public class SystemConfigController {
    @Autowired
    SystemConfigService systemConfigService;

    @GetMapping(value = "/list", name = "Danh sách cấu hình hệ thống")
    @Operation(summary = "Lấy danh sách cấu hình hệ thống", description = "Lấy danh sách cấu hình hệ thống có phân trang với các bộ lọc tùy chọn")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<SystemConfig>>> getAllConfigs(
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "50") Integer size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String value,
            @RequestParam(required = false) SystemConfigKey key,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String timeFrom,
            @RequestParam(required = false) String timeTo,
            @RequestParam(required = false, defaultValue = "createdTime") String typeSort) {
        Page<SystemConfig> result = systemConfigService.getAllSystemConfig(page, size, name, value, key, isActive, timeFrom,
                        timeTo, typeSort);
        CustomPageResponse<SystemConfig> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize()
        );
        Response<CustomPageResponse<SystemConfig>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/detail/{key}", name = "Lấy cấu hình cụ thể theo key")
    @Operation(summary = "Lấy cấu hình cụ thể theo key", description = "Lấy thông tin chi tiết của một cấu hình hệ thống theo key")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy cấu hình"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public Response<SystemConfig> getConfig(
            @Parameter(description = "Key cấu hình hệ thống", required = true) @PathVariable SystemConfigKey key) {
        Optional<SystemConfig> config = systemConfigService.findConfigByKey(key);
        return config.map(systemConfig -> new Response<>(true, ErrorCode.SUCCESS, "Thành công", systemConfig))
                        .orElseGet(() -> new Response<>(false, ErrorCode.NOT_FOUND, "Cấu hình không tồn tại", null));
    }

    @PostMapping(value = "/create",name = "Tạo mới cấu hình hệ thống")
    @Operation(summary = "Tạo mới cấu hình hệ thống", description = "Tạo cấu hình hệ thống mới")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tạo cấu hình thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public Response<SystemConfig> createConfig(@RequestAttribute("ADMIN_ID") Long adminId,
            @RequestBody SystemConfig config) {
        config.setCreated_by(Math.toIntExact(adminId));
        config.setUpdated_by(config.getCreated_by());
        SystemConfig created = systemConfigService.create(config);
        return new Response<>(true, ErrorCode.SUCCESS, "Tạo cấu hình thành công", created);
    }

    @PutMapping(value = "/update/{key}", name = "Sửa cấu hình hệ thống")
    @Operation(summary = "Cập nhật cấu hình hệ thống", description = "Cập nhật thông tin của cấu hình hệ thống theo key")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy cấu hình"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<SystemConfig>> updateConfig(@RequestAttribute("ADMIN_ID") Long adminId,
            @Parameter(description = "Key cấu hình hệ thống", required = true) @PathVariable SystemConfigKey key, 
            @RequestBody SystemConfig config) {
        config.setUpdated_by(Math.toIntExact(adminId));
        SystemConfig updated = systemConfigService.update(key, config);
        Response<SystemConfig> response = new Response<>(true, ErrorCode.SUCCESS, "Cập nhật cấu hình thành công", updated);
        return ResponseEntity.ok().body(response);
    }

//    @PutMapping(value = "/{key}/change-status", name = "Cập nhật trạng thái cấu hình hệ thống")
//    public Response changeStatusConfig(@RequestAttribute("ADMIN_ID") Long adminId,
//            @PathVariable SystemConfigKey key, @RequestParam(required = false) Boolean isActive) {
//        systemConfigService.changeActiveStatus(key, adminId, isActive);
//        return new Response(true, ErrorCode.SUCCESS, "Cập nhật trạng thái cấu hình thành công");
//    }

    @DeleteMapping(value = "/delete/{key}", name = "Xóa cấu hình hệ thống")
    @Operation(summary = "Xóa cấu hình hệ thống", description = "Xóa cấu hình hệ thống theo key")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Xóa cấu hình thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy cấu hình"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public Response deleteConfig(
            @Parameter(description = "Key cấu hình hệ thống", required = true) @PathVariable SystemConfigKey key) {
        systemConfigService.delete(key);
        return new Response(true, ErrorCode.SUCCESS, "Xóa cấu hình thành công");
    }

    @GetMapping(value = "/keys", name = "Lấy tất cả key trong hệ thống")
    @Operation(summary = "Lấy tất cả key trong hệ thống", description = "Lấy danh sách tất cả các key cấu hình có trong hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> getAllKeys() {
        SystemConfigKey[] arr = SystemConfigKey.values();
        List<Map<String, String>> configs = new ArrayList<>();
        for (int i = 0; i < arr.length; i++) {
            Map<String, String> configNameValue = new HashMap<>();
            configNameValue.put("name", arr[i].toString());
            configNameValue.put("value", arr[i].toString());
            configs.add(configNameValue);
        }
        Response<List<Map<String, String>>> response = new Response<>(true, ErrorCode.SUCCESS, "Thành công", configs);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/keys/unused", name = "Lấy tất cả key chưa được sử dụng trong hệ thống")
    @Operation(summary = "Lấy danh sách key chưa được sử dụng", description = "Lấy danh sách các key cấu hình chưa được sử dụng trong hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Map<String, String>>>> getUnusedKeys() {
        List<SystemConfig> configs = systemConfigService.findAll();
        Set<SystemConfigKey> usedKeys = configs.stream()
                .map(SystemConfig::getKey)
                .collect(Collectors.toSet());
        List<Map<String, String>> unusedKeys = Arrays.stream(SystemConfigKey.values())
                .filter(key -> !usedKeys.contains(key))
                .map(key -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("key", key.name());
                    map.put("description", key.getDescription());
                    return map;
                })
                .collect(Collectors.toList());
        Response<List<Map<String, String>>> response = new Response<>(true, ErrorCode.SUCCESS, "Thành công", unusedKeys);
        return ResponseEntity.ok().body(response);
    }

}
