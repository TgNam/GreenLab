package vn.greenlab.controller;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import vn.greenlab.model.Permission;
import vn.greenlab.repository.PermissionRepository;
import vn.greenlab.service.PermissionService;

/**
 *
 * @author ACC01
 */
@Component
public class PermissionInit {

    @Autowired
    private RequestMappingHandlerMapping requestMappingHandlerMapping;
    @Autowired
    private PermissionService permissionService;
    @Autowired
    private ApplicationContext applicationContext;
    @Autowired
    private PermissionRepository permissionRepo;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private boolean matches(String pattern, String requestUri) {
        return pathMatcher.match(pattern, requestUri);
    }

    /**
     * Loại trừ handler từ thư viện Swagger/OpenAPI (springdoc, springfox,
     * swagger-ui).
     */
    private boolean isSwaggerOrDocHandler(HandlerMethod method) {
        if (method == null)
            return false;
        String name = method.getBeanType().getName();
        return name.startsWith("org.springframework")
                || name.startsWith("org.springdoc")
                || name.startsWith("springfox.")
                || name.startsWith("io.swagger.");
    }

    /** Loại trừ đường dẫn Swagger/OpenAPI (API docs, UI). */
    private boolean isSwaggerPath(String path) {
        if (path == null)
            return false;
        String p = path.startsWith("/") ? path : "/" + path;
        return p.startsWith("/v3/api-docs")
                || p.startsWith("/v2/api-docs")
                || p.startsWith("/swagger-ui")
                || p.startsWith("/swagger-resources")
                || p.startsWith("/webjars/");
    }

    /** Bỏ qua mapping nếu là Swagger/OpenAPI (theo handler hoặc theo path). */
    private boolean shouldExcludeMapping(HandlerMethod method, Set<String> patterns) {
        if (isSwaggerOrDocHandler(method))
            return true;
        if (patterns != null) {
            for (String path : patterns) {
                if (isSwaggerPath(path))
                    return true;
            }
        }
        return false;
    }

    public static List<Permission> unmappedPermission = new CopyOnWriteArrayList<>();
    public static List<Permission> allPermission = new CopyOnWriteArrayList<>();

    @Value("${permission.init}")
    private boolean permissionInit;

    @PostConstruct
    public void initPermissions() {
        if (!permissionInit) {
            return;
        }
        Map<RequestMappingInfo, HandlerMethod> map = requestMappingHandlerMapping.getHandlerMethods();
        List<Permission> mappedPermissions = permissionService.getAllPermissions();

        List<String> controllerUris = new ArrayList<>();
        List<Permission> allPermission = new ArrayList<>();

        // --- B1: Lấy danh sách controller-level URI (bỏ qua Swagger/OpenAPI) ---
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : map.entrySet()) {
            HandlerMethod method = entry.getValue();
            Set<String> patterns = new HashSet<>();
            if (entry.getKey().getPathPatternsCondition() != null) {
                entry.getKey().getPathPatternsCondition().getPatterns()
                        .forEach(p -> patterns.add(p.getPatternString()));
            } else if (entry.getKey().getPatternsCondition() != null) {
                patterns.addAll(entry.getKey().getPatternsCondition().getPatterns());
            }
            if (shouldExcludeMapping(method, patterns)) {
                continue;
            }

            RequestMapping classMapping = method.getBeanType().getAnnotation(RequestMapping.class);
            if (classMapping != null && classMapping.value().length > 0) {
                String baseUri = classMapping.value()[0];
                if (!isSwaggerPath(baseUri) && !controllerUris.contains(baseUri)) {
                    controllerUris.add(baseUri);
                }
            }
        }

        // --- B2: Duyệt qua toàn bộ mapping để build allPermission ---
        // First pass: collect all permission names and track controllers
        Map<String, Set<String>> permissionNameToControllers = new HashMap<>();
        List<PermissionNameInfo> permissionNameInfos = new ArrayList<>();

        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : map.entrySet()) {
            RequestMappingInfo info = entry.getKey();
            HandlerMethod method = entry.getValue();

            Set<String> patterns = new HashSet<>();
            if (info.getPathPatternsCondition() != null) {
                info.getPathPatternsCondition().getPatterns().forEach(p -> patterns.add(p.getPatternString()));
            } else if (info.getPatternsCondition() != null) {
                patterns.addAll(info.getPatternsCondition().getPatterns());
            }
            if (shouldExcludeMapping(method, patterns)) {
                continue;
            }

            Set<RequestMethod> methods = info.getMethodsCondition().getMethods();
            String mappingName = getMappingName(method);
            String controllerName = getControllerName(method);

            // Track permission name and controller
            String key = mappingName.toLowerCase().trim();
            permissionNameToControllers.computeIfAbsent(key, k -> new HashSet<>()).add(controllerName);

            // Store info for building permissions
            for (String url : patterns) {
                if (methods.isEmpty()) {
                    permissionNameInfos.add(new PermissionNameInfo(mappingName, controllerName, url, "GROUP"));
                } else {
                    for (RequestMethod m : methods) {
                        permissionNameInfos.add(new PermissionNameInfo(mappingName, controllerName, url, m.name()));
                    }
                }
            }
        }

        // Second pass: build permissions with unique names when conflicts exist
        for (PermissionNameInfo info : permissionNameInfos) {
            String uniqueName = info.mappingName;
            String key = info.mappingName.toLowerCase().trim();

            // If this permission name appears in multiple controllers, add controller
            // context
            Set<String> controllers = permissionNameToControllers.get(key);
            if (controllers != null && controllers.size() > 1) {
                // Check if name already has context (to avoid double-adding)
                if (!uniqueName.contains("(") && !uniqueName.contains("[")) {
                    uniqueName = info.mappingName + " (" + info.controllerName + ")";
                }
            }

            if ("GROUP".equals(info.method)) {
                unmappedPermission.add(buildPermission(uniqueName, info.url, info.method));
            } else {
                unmappedPermission.add(buildPermission(uniqueName, info.url, info.method));
                allPermission.add(buildPermission(uniqueName, info.url, info.method));
            }
        }

        // --- B3: Tạo permission cha trước ---
        List<Permission> dbPermissions = permissionRepo.findAll();
        List<Permission> newPermissions = new ArrayList<>();

        for (String baseUri : controllerUris) {
            boolean exists = dbPermissions.stream()
                    .anyMatch(p -> p.getUri().equals(baseUri) && p.getMethod().equals("GROUP"));

            if (!exists) {
                // 🔹 Lấy tên hiển thị từ @RequestMapping(name = "...")
                String displayName = null;
                for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : map.entrySet()) {
                    HandlerMethod method = entry.getValue();
                    RequestMapping classMapping = method.getBeanType().getAnnotation(RequestMapping.class);
                    if (classMapping != null && classMapping.value().length > 0
                            && classMapping.value()[0].equals(baseUri)) {
                        displayName = classMapping.name(); // lấy name từ annotation
                        break;
                    }
                }

                // 🔹 Nếu không có name → fallback dùng URI viết hoa
                if (displayName == null || displayName.isBlank()) {
                    displayName = baseUri.replace("/", "").toUpperCase();
                }

                Permission parentPerm = new Permission();
                parentPerm.setName(displayName);
                parentPerm.setUri(baseUri);
                parentPerm.setMethod("GROUP");
                parentPerm.setParent_id(0);
                parentPerm.setHidden(false);
                parentPerm.setSkip(false);
                parentPerm.setCreate_time(LocalDateTime.now());
                parentPerm.setUpdate_time(LocalDateTime.now());

                permissionRepo.save(parentPerm);
                dbPermissions.add(parentPerm);
            }
        }

        // --- B4: Cập nhật parent_id cho các quyền cha đã tồn tại nhưng không còn là
        // quyền cha nữa ---
        dbPermissions = permissionRepo.findAll(); // reload để có ID cha
        List<Permission> permissionsToUpdate = new ArrayList<>();

        // Kiểm tra các quyền có method = "GROUP" và parent_id = 0 (quyền cha cũ)
        // nhưng URI của chúng không còn trong controllerUris → không còn là quyền cha
        // nữa
        // bỏ logic này
        // for (Permission existingPerm : dbPermissions) {
        // if ("GROUP".equals(existingPerm.getMethod()) && existingPerm.getParent_id()
        // == 0) {
        // // Nếu URI này không còn trong controllerUris → không còn là quyền cha
        // boolean isStillParent = controllerUris.contains(existingPerm.getUri());
        // if (!isStillParent) {
        // // Tìm parent mới cho quyền này
        // String matchedControllerUri = controllerUris.stream()
        // .filter(baseUri -> matches(baseUri + "/**", existingPerm.getUri()))
        // .findFirst()
        // .orElse(null);

        // if (matchedControllerUri != null) {
        // Permission newParent = dbPermissions.stream()
        // .filter(p -> p.getUri().equals(matchedControllerUri)
        // && "GROUP".equals(p.getMethod())
        // && p.getParent_id() == 0)
        // .findFirst()
        // .orElse(null);
        // if (newParent != null) {
        // existingPerm.setParent_id(newParent.getId());
        // existingPerm.setUpdate_time(LocalDateTime.now());
        // permissionsToUpdate.add(existingPerm);
        // } else {
        // // Không tìm thấy parent, giữ parent_id = 0
        // existingPerm.setParent_id(0);
        // existingPerm.setUpdate_time(LocalDateTime.now());
        // permissionsToUpdate.add(existingPerm);
        // }
        // } else {
        // // Không match với controller nào, giữ parent_id = 0
        // existingPerm.setParent_id(0);
        // existingPerm.setUpdate_time(LocalDateTime.now());
        // permissionsToUpdate.add(existingPerm);
        // }
        // }
        // }
        // }

        // --- B5: Tạo permission con và cập nhật parent_id cho các quyền con
        // ---
        PermissionInit.allPermission = allPermission;
        for (Permission newPerm : allPermission) {

            Permission existingPerm = dbPermissions.stream()
                    .filter(p -> p.getUri().equals(newPerm.getUri()) && p.getMethod().equals(newPerm.getMethod()))
                    .findFirst()
                    .orElse(null);

            if (existingPerm == null) {
                if ("GROUP".equals(newPerm.getMethod())) {
                    newPerm.setParent_id(0); // Quyền cha thì không đi tìm cha khác
                } else {
                    // Quyền mới, cần tạo
                    List<String> matchedControllerUri = controllerUris.stream()
                            .filter(baseUri -> matches(baseUri + "/**", newPerm.getUri()))
                            .collect(Collectors.toList());

                    if (matchedControllerUri == null || matchedControllerUri.isEmpty()) {
                        newPerm.setParent_id(0);
                    } else {
                        // Chọn baseUri cha (nếu nhiều, lấy chuỗi dài nhất)
                        String baseUriForParent = matchedControllerUri.size() > 1
                                ? matchedControllerUri.stream()
                                        .max(Comparator.comparingInt(String::length))
                                        .orElse(null)
                                : matchedControllerUri.get(0);

                        Permission parent = null;
                        if (baseUriForParent != null) {
                            parent = dbPermissions.stream()
                                    .filter(p -> p.getUri().equals(baseUriForParent)
                                            && "GROUP".equals(p.getMethod())
                                            && p.getParent_id() == 0)
                                    .findFirst()
                                    .orElse(null);

                            // Nếu chưa có quyền cha tương ứng, tạo mới (lượt insert thứ nhất cho GROUP)
                            if (parent == null) {
                                String displayName = null;
                                for (Map.Entry<RequestMappingInfo, HandlerMethod> entry2 : map.entrySet()) {
                                    HandlerMethod method2 = entry2.getValue();
                                    RequestMapping classMapping2 = method2.getBeanType()
                                            .getAnnotation(RequestMapping.class);
                                    if (classMapping2 != null && classMapping2.value().length > 0
                                            && classMapping2.value()[0].equals(baseUriForParent)) {
                                        displayName = classMapping2.name();
                                        break;
                                    }
                                }
                                if (displayName == null || displayName.isBlank()) {
                                    displayName = baseUriForParent.replace("/", "").toUpperCase();
                                }
                                Permission parentPerm = new Permission();
                                parentPerm.setName(displayName);
                                parentPerm.setUri(baseUriForParent);
                                parentPerm.setMethod("GROUP");
                                parentPerm.setParent_id(0);
                                parentPerm.setHidden(false);
                                parentPerm.setSkip(false);
                                parentPerm.setCreate_time(LocalDateTime.now());
                                parentPerm.setUpdate_time(LocalDateTime.now());

                                parent = permissionRepo.save(parentPerm);
                                dbPermissions.add(parent);
                            }
                        }

                        newPerm.setParent_id(parent != null ? parent.getId() : 0);
                    }
                }

                newPermissions.add(newPerm);
            } else {
                // // Quyền đã tồn tại, kiểm tra và cập nhật parent_id nếu cần
                // List<String> matchedControllerUriList = controllerUris.stream()
                // .filter(baseUri -> matches(baseUri + "/**", newPerm.getUri()))
                // .collect(Collectors.toList());
                // // String matchedControllerUri = controllerUris.stream()
                // // .filter(baseUri -> matches(baseUri + "/**", existingPerm.getUri()))
                // // .findFirst()
                // // .orElse(null);

                // Integer expectedParentId = 0;
                // if (matchedControllerUriList != null && !matchedControllerUriList.isEmpty())
                // {
                // String matchedControllerUri = matchedControllerUriList.size() > 1
                // ? matchedControllerUriList.stream()
                // .max(Comparator.comparingInt(String::length))
                // .orElse(null)
                // : matchedControllerUriList.get(0);
                // Permission parent = dbPermissions.stream()
                // .filter(p -> p.getUri().equals(matchedControllerUri)
                // && "GROUP".equals(p.getMethod())
                // && p.getParent_id() == 0)
                // .findFirst()
                // .orElse(null);

                // if (parent == null) {
                // // Nếu chưa có quyền cha, tạo mới giống như bước trên
                // String displayName = null;
                // for (Map.Entry<RequestMappingInfo, HandlerMethod> entry2 : map.entrySet()) {
                // HandlerMethod method2 = entry2.getValue();
                // RequestMapping classMapping2 =
                // method2.getBeanType().getAnnotation(RequestMapping.class);
                // if (classMapping2 != null && classMapping2.value().length > 0
                // && classMapping2.value()[0].equals(matchedControllerUri)) {
                // displayName = classMapping2.name();
                // break;
                // }
                // }
                // if (displayName == null || displayName.isBlank()) {
                // displayName = matchedControllerUri.replace("/", "").toUpperCase();
                // }
                // Permission parentPerm = new Permission();
                // parentPerm.setName(displayName);
                // parentPerm.setUri(matchedControllerUri);
                // parentPerm.setMethod("GROUP");
                // parentPerm.setParent_id(0);
                // parentPerm.setHidden(false);
                // parentPerm.setSkip(false);
                // parentPerm.setCreate_time(LocalDateTime.now());
                // parentPerm.setUpdate_time(LocalDateTime.now());

                // parent = permissionRepo.save(parentPerm);
                // dbPermissions.add(parent);
                // }

                // if (parent != null) {
                // if (existingPerm.getUri().contains("price-poli")) {
                // expectedParentId = parent.getId();
                // }
                // }
                // }

                // // Nếu parent_id hiện tại khác với parent_id mong đợi → cần cập nhật
                // if (existingPerm.getParent_id() != expectedParentId) {
                // existingPerm.setParent_id(expectedParentId);
                // existingPerm.setUpdate_time(LocalDateTime.now());
                // permissionsToUpdate.add(existingPerm);
                // }
            }
        }

        // Lưu các thay đổi
        if (!permissionsToUpdate.isEmpty()) {
            permissionRepo.saveAll(permissionsToUpdate);
        }
        if (!newPermissions.isEmpty()) {
            permissionRepo.saveAll(newPermissions);
        }

    }

    private Permission buildPermission(String name, String url, String httpMethod) {
        Permission p = new Permission();
        p.setName(name);
        p.setUri(url);
        p.setMethod(httpMethod);
        p.setSkip(false);
        p.setCreate_time(LocalDateTime.now());
        p.setUpdate_time(LocalDateTime.now());
        p.setParent_id(0);
        return p;
    }

    /**
     * Lấy tên (name) từ annotation @GetMapping, @PostMapping,
     * @RequestMapping,...
     */
    private String getMappingName(HandlerMethod method) {
        // Kiểm tra từng annotation cụ thể
        GetMapping getMapping = method.getMethodAnnotation(GetMapping.class);
        if (getMapping != null && getMapping.name() != null && !getMapping.name().isEmpty()) {
            return getMapping.name();
        }

        PostMapping postMapping = method.getMethodAnnotation(PostMapping.class);
        if (postMapping != null && postMapping.name() != null && !postMapping.name().isEmpty()) {
            return postMapping.name();
        }

        PutMapping putMapping = method.getMethodAnnotation(PutMapping.class);
        if (putMapping != null && putMapping.name() != null && !putMapping.name().isEmpty()) {
            return putMapping.name();
        }

        DeleteMapping deleteMapping = method.getMethodAnnotation(DeleteMapping.class);
        if (deleteMapping != null && deleteMapping.name() != null && !deleteMapping.name().isEmpty()) {
            return deleteMapping.name();
        }

        PatchMapping patchMapping = method.getMethodAnnotation(PatchMapping.class);
        if (patchMapping != null && patchMapping.name() != null && !patchMapping.name().isEmpty()) {
            return patchMapping.name();
        }

        RequestMapping requestMapping = method.getMethodAnnotation(RequestMapping.class);
        if (requestMapping != null && requestMapping.name() != null && !requestMapping.name().isEmpty()) {
            return requestMapping.name();
        }

        // Mặc định: dùng tên hàm nếu không có name trong annotation
        return method.getMethod().getName();
    }

    /**
     * Lấy tên controller từ @RequestMapping annotation hoặc tên class
     */
    private String getControllerName(HandlerMethod method) {
        RequestMapping classMapping = method.getBeanType().getAnnotation(RequestMapping.class);
        if (classMapping != null && classMapping.name() != null && !classMapping.name().isEmpty()) {
            return classMapping.name();
        }
        // Fallback: dùng tên class (bỏ package và "Controller" suffix)
        String className = method.getBeanType().getSimpleName();
        if (className.endsWith("Controller")) {
            return className.substring(0, className.length() - "Controller".length());
        }
        return className;
    }

    /**
     * Helper class to store permission name information during collection phase
     */
    private static class PermissionNameInfo {

        String mappingName;
        String controllerName;
        String url;
        String method;

        PermissionNameInfo(String mappingName, String controllerName, String url, String method) {
            this.mappingName = mappingName;
            this.controllerName = controllerName;
            this.url = url;
            this.method = method;
        }
    }

}
