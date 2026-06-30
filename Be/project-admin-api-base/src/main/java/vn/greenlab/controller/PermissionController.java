package vn.greenlab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.pattern.PathPattern;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

import vn.greenlab.model.Permission;
import vn.greenlab.model.input.PermissionInput;
import vn.greenlab.model.input.PermissionSearchRequest;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.PermissionOutput;
import vn.greenlab.model.output.PermissionTreeOutput;
import vn.greenlab.model.output.Response;
import vn.greenlab.model.output.RoleOutput;
import vn.greenlab.repository.PermissionRepository;
import vn.greenlab.service.PermissionService;
import vn.greenlab.service.RoleService;
import vn.greenlab.utils.SearchParamNormalizer;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping(value = "/permissions", name = "Quản lý quyền")
@Tag(name = "Quản lý quyền", description = "API quản lý quyền và phân quyền")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private RequestMappingHandlerMapping handlerMapping;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RoleService roleService;

    /**
     * Get all permissions
     */
    @PostMapping(name = "Danh sách quyền")
    @Operation(summary = "Lấy danh sách quyền", description = "Lấy danh sách quyền có phân trang với các bộ lọc tùy chọn")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Map<String, Object>>> getAllPermissions(
            @RequestBody PermissionSearchRequest permission) {
        // Normalize page (điều chỉnh để bắt đầu từ 0)
        try {
            if (permission.getPage() != null && permission.getPage() > 0) {
                permission.setPage(permission.getPage() - 1);
            } else if (permission.getPage() == null) {
                permission.setPage(0);
            }

            // Normalize string parameters
            permission.setName(SearchParamNormalizer.normalizeString(permission.getName()));
            permission.setUri(SearchParamNormalizer.normalizeString(permission.getUri()));
            permission.setMethod(SearchParamNormalizer.normalizeString(permission.getMethod()));
            permission.setUsername(SearchParamNormalizer.normalizeString(permission.getUsername()));

            Map<String, Object> permissions = permissionService.searchPermission(permission);
            Response<Map<String, Object>> response = new Response<>(true, "Thành công", permissions);
            response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
            return ResponseEntity.ok().body(response);

        } catch (Exception e) {
            e.printStackTrace();
            Response<Map<String, Object>> response = new Response<>(false, "Lỗi: " + e.getMessage(), null);
            response.setCode(vn.greenlab.model.enums.ErrorCode.BAD_REQUEST);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping(value = "/unmap", name = "Lấy danh sách quyền chưa map")
    @Operation(summary = "Lấy danh sách quyền chưa map", description = "Lấy danh sách các quyền chưa được map vào hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<Permission>>> unmappedPermission(
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "20") Integer size,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "uri", required = false) String uri) {

        Pageable pageable = PageRequest.of(page, size);

        // lọc linh hoạt: nếu name==null thì bỏ qua điều kiện name, tương tự uri
        List<Permission> filtered = PermissionInit.unmappedPermission.stream()
                .filter(up -> {
                    boolean matchName = true;
                    boolean matchUri = true;
                    if (name != null && !name.isBlank()) {
                        String un = up.getName() == null ? "" : up.getName().trim();
                        matchName = un.toLowerCase().contains(name.trim().toLowerCase());
                    }
                    if (uri != null && !uri.isBlank()) {
                        String uu = up.getUri() == null ? "" : up.getUri().trim();
                        matchUri = uu.toLowerCase().contains(uri.trim().toLowerCase());
                    }
                    return matchName && matchUri;
                })
                .collect(Collectors.toList());

        // phân trang thủ công (slice)
        int total = filtered.size();
        int start = (int) pageable.getOffset(); // page * size
        int end = Math.min(start + pageable.getPageSize(), total);
        List<Permission> pageContent = (start > end) ? List.of() : filtered.subList(start, end);

        Page<Permission> permissions = new PageImpl<>(pageContent, pageable, total);
        CustomPageResponse<Permission> customPage = new CustomPageResponse<>(
                permissions.getContent(),
                permissions.getTotalElements(),
                permissions.getTotalPages(),
                permissions.getSize());
        Response<CustomPageResponse<Permission>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok(response);
    }

    /**
     * Get permission by ID
     */
    @GetMapping(value = "/{id}", name = "Lấy chi tiết quyền")
    @Operation(summary = "Lấy chi tiết quyền", description = "Lấy thông tin chi tiết của một quyền theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quyền"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Permission>> getPermissionById(
            @Parameter(description = "ID quyền", required = true) @PathVariable Integer id) {
        Optional<Permission> permission = permissionService.getPermissionById(id);
        Response<Permission> response = new Response<>(true, "Thành công", permission.get());
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/administrators", name = "Lấy danh sách nhân viên có quyền")
    @Operation(summary = "Lấy danh sách nhân viên có quyền", description = "Lấy danh sách các nhân viên có quyền cụ thể")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<AdministratorOutput>>> getAdministratorsByPermission(
            @Parameter(description = "ID quyền", required = true) @RequestParam Integer permissionId) {
        List<AdministratorOutput> administrators = permissionService.findAdministratorsByPermission(permissionId);
        Response<List<AdministratorOutput>> response = new Response<>(true, "Thành công", administrators);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/roles-by-permission", name = "Lấy danh sách nhóm quyền có quyền")
    @Operation(summary = "Lấy danh sách nhóm quyền có quyền", description = "Lấy danh sách các nhóm quyền có quyền cụ thể")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<RoleOutput>>> getRolesByPermission(
            @Parameter(description = "ID quyền", required = true) @RequestParam Integer permissionId) {
        List<RoleOutput> roles = permissionService.findRolesByPermission(permissionId);
        Response<List<RoleOutput>> response = new Response<>(true, "Thành công", roles);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(value = "/add-permission-to-role", name = "Thêm quyền vào nhóm quyền")
    @Operation(summary = "Thêm quyền vào nhóm quyền", description = "Thêm một quyền vào nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thêm quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> addPermissionToRole(@RequestBody Map<String, Integer> request) {
        Integer permissionId = request.get("permissionId");
        Integer roleId = request.get("roleId");
        permissionService.addPermissionToRole(permissionId, roleId);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/remove-permission-from-role", name = "Xóa quyền khỏi nhóm quyền")
    @Operation(summary = "Xóa quyền khỏi nhóm quyền", description = "Xóa một quyền khỏi nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Xóa quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> removePermissionFromRole(@RequestBody Map<String, Integer> request) {
        Integer permissionId = request.get("permissionId");
        Integer roleId = request.get("roleId");
        permissionService.removePermissionFromRole(permissionId, roleId);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/admin-by-roles", name = "Lấy danh sách nhân viên có nhóm quyền")
    @Operation(summary = "Lấy danh sách nhân viên có nhóm quyền", description = "Lấy danh sách các nhân viên thuộc nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<AdministratorOutput>>> getAdminByRoles(
            @Parameter(description = "ID nhóm quyền", required = true) @RequestParam Integer roleId) {
        List<AdministratorOutput> roles = roleService.getAdminInRole(roleId);
        Response<List<AdministratorOutput>> response = new Response<>(true, "Thành công", roles);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/roles")
    @Operation(summary = "Lấy danh sách tất cả nhóm quyền", description = "Lấy danh sách tất cả các nhóm quyền trong hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<RoleOutput>>> getRoles() {
        List<RoleOutput> roleOutputs = roleService.findRoleList();
        Response<List<RoleOutput>> response = new Response<>(true, "Thành công", roleOutputs);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    /**
     * Update permission
     */
    @PutMapping(value = "/{id}", name = "Cập nhật quyền")
    @Operation(summary = "Cập nhật quyền", description = "Cập nhật thông tin của quyền theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quyền"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Permission>> updatePermission(
            @Parameter(description = "ID quyền", required = true) @PathVariable Integer id,
            @RequestBody Permission permissionDetails) {
        try {
            Optional<Permission> permission = permissionService.getPermissionById(id);
            if (permission.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Permission permissionToUpdate = permission.get();
            permissionToUpdate.setName(permissionDetails.getName());
            permissionToUpdate.setUri(permissionDetails.getUri());
            permissionToUpdate.setMethod(permissionDetails.getMethod());
            permissionToUpdate.setParent_id(permissionDetails.getParent_id());
            permissionToUpdate.setSkip(permissionDetails.isSkip());

            Permission updatedPermission = permissionService.updatePermission(permissionToUpdate);
            Response<Permission> response = new Response<>(true, "Thành công", updatedPermission);
            response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
            return ResponseEntity.ok().body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Delete permission
     */
    @DeleteMapping(value = "/{id}", name = "Xóa quyền")
    @Operation(summary = "Xóa quyền", description = "Xóa một quyền theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Xóa thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quyền"),
            @ApiResponse(responseCode = "500", description = "Lỗi máy chủ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Void> deletePermission(
            @Parameter(description = "ID quyền", required = true) @PathVariable Integer id) {
        try {
            Optional<Permission> permission = permissionService.getPermissionById(id);
            if (permission.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            PermissionInit.unmappedPermission.add(permission.get());
            permissionService.deletePermission(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get permissions for administrator
     */
    @GetMapping(value = "/admin/{adminId}", name = "Lấy quyền của nhân viên")
    @Operation(summary = "Lấy quyền của nhân viên", description = "Lấy danh sách các quyền được gán cho nhân viên")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Permission>>> getPermissionsForAdministrator(
            @Parameter(description = "ID nhân viên", required = true) @PathVariable Integer adminId) {
        List<Permission> permissions = permissionService.getPermissionsForAdministrator(adminId);
        Response<List<Permission>> response = new Response<>(true, "Thành công", permissions);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(value = "/map", name = "Map quyền")
    @Operation(summary = "Map quyền", description = "Map các quyền chưa được map vào hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Map quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> mapPermission(@RequestBody List<PermissionInput> permissionInputs) {
        // TODO: process POST request
        permissionService.mapPermission(permissionInputs, PermissionInit.unmappedPermission);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/scan-by-uri-unmapped", name = "Lấy danh sách quyền chưa map có cùng quyền cha")
    @Operation(summary = "Lấy danh sách quyền chưa map có cùng quyền cha", description = "Quét và lấy danh sách các quyền chưa map có cùng URI cha")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Map<String, Object>> scanPermissionsByUri(
            @Parameter(description = "URI để quét", required = true) @RequestParam("uri") String uri) {

        String normalized = uri.startsWith("/") ? uri : "/" + uri;

        // 1️⃣ Lấy mapping controller -> list URI
        Map<String, List<String>> controllerMap = getControllerUriMap();
        Map<String, String> controllerBaseMap = getControllerBaseUriMap();

        String matchedController = null;
        String controllerUri = null;

        // 2️⃣ Tìm controller chứa URI này (best match)
        for (var entry : controllerMap.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (normalized.startsWith(pattern)) {
                    matchedController = entry.getKey();
                    controllerUri = pattern; // lưu URI gốc của controller
                }
            }
            if (matchedController != null)
                break;
        }
        final String finalControllerUri = controllerUri;
        if (matchedController == null) {
            Map<String, Object> map = new HashMap<>();
            map.put("parents", new ArrayList<>());
            map.put("result", new ArrayList<>());
            return ResponseEntity.ok().body(map);
        }

        // 3️⃣ Lấy tất cả URI của controller
        List<String> controllerUris = controllerMap.get(matchedController);
        String uriController = controllerBaseMap.get(matchedController);
        Map<String, Object> result = new HashMap<>();
        AtomicBoolean hasParent = new AtomicBoolean(false);
        List<Permission> permissions = permissionRepository.findPermissionParent();

        Permission parentPermission = permissions.stream()
                .filter(p -> p.getUri().trim().contains(uriController.trim()))
                .findFirst()
                .orElse(null);

        if (parentPermission != null) {
            PermissionOutput permissionOutput = new PermissionOutput();
            permissionOutput.setCreateTime(parentPermission.getCreate_time());
            permissionOutput.setHidden(parentPermission.isHidden());
            permissionOutput.setId(parentPermission.getId());
            permissionOutput.setMethod(parentPermission.getMethod());
            permissionOutput.setName(parentPermission.getName());
            permissionOutput.setParent(true);
            permissionOutput.setSkip(parentPermission.isSkip());
            permissionOutput.setUpdateTime(parentPermission.getUpdate_time());
            permissionOutput.setUri(parentPermission.getUri());
            result.put("parentPermission", permissionOutput);
            hasParent.set(true);
        }

        List<PermissionOutput> res;

        List<Permission> matched = PermissionInit.unmappedPermission.stream()
                .filter(p -> controllerUris.contains(p.getUri()))
                .toList();

        Optional<Permission> getParent = matched.stream()
                .filter(p -> p.getUri().trim().equals(uriController.trim()) && "GET".equalsIgnoreCase(p.getMethod()))
                .findFirst();

        if (getParent.isEmpty()) {
            getParent = matched.stream()
                    .filter(p -> p.getUri().trim().equals(uriController.trim()))
                    .findFirst();
        }

        String parentUri = getParent.map(Permission::getUri).orElse(null);
        String parentMethod = getParent.map(Permission::getMethod).orElse(null);

        res = matched.stream()
                .map(p -> {
                    PermissionOutput out = new PermissionOutput();
                    out.setId(p.getId());
                    out.setName(p.getName());
                    out.setUri(p.getUri());
                    out.setMethod(p.getMethod());
                    out.setSkip(p.isSkip());
                    out.setHidden(p.isHidden());
                    out.setCreateTime(p.getCreate_time());
                    out.setUpdateTime(p.getUpdate_time());

                    if (parentUri != null && parentUri.equals(p.getUri())
                            && parentMethod != null && parentMethod.equalsIgnoreCase(p.getMethod())) {
                        out.setParent(true);
                    }

                    return out;
                })
                .toList();

        result.put("result", res);

        return ResponseEntity.ok(result);
    }

    public Map<String, List<String>> getControllerUriMap() {
        Map<String, List<String>> controllerUriMap = new HashMap<>();

        Map<RequestMappingInfo, HandlerMethod> map = handlerMapping.getHandlerMethods();
        map.forEach((info, method) -> {
            String controllerName = method.getBeanType().getSimpleName(); // Ví dụ: AdministratorController

            Set<String> patterns = new HashSet<>();
            if (info.getPathPatternsCondition() != null)
                info.getPathPatternsCondition().getPatterns().forEach(p -> patterns.add(p.getPatternString()));
            else if (info.getPatternsCondition() != null)
                patterns.addAll(info.getPatternsCondition().getPatterns());

            controllerUriMap
                    .computeIfAbsent(controllerName, k -> new ArrayList<>())
                    .addAll(patterns);
        });

        return controllerUriMap;
    }

    public Map<String, String> getControllerBaseUriMap() {
        Map<String, String> controllerBaseUriMap = new HashMap<>();

        Map<RequestMappingInfo, HandlerMethod> map = handlerMapping.getHandlerMethods();
        for (HandlerMethod method : map.values()) {
            Class<?> controllerClass = method.getBeanType();
            String controllerName = controllerClass.getSimpleName();

            // Lấy annotation @RequestMapping từ class
            RequestMapping mapping = controllerClass.getAnnotation(RequestMapping.class);
            if (mapping != null && mapping.value().length > 0) {
                // Chỉ lấy URI đầu tiên (cũng có thể join nhiều URI nếu cần)
                String baseUri = mapping.value()[0];
                controllerBaseUriMap.put(controllerName, baseUri);
            }
        }

        return controllerBaseUriMap;
    }

}
