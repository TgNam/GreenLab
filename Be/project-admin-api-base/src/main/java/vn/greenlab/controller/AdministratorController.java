package vn.greenlab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.io.File;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import vn.greenlab.exception.NotFoundException;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.Department;
import vn.greenlab.model.Role;
import vn.greenlab.model.WorkArea;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.enums.OSSType;
import vn.greenlab.model.enums.Position;
import vn.greenlab.model.input.AdministratorInput;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.RoleDetailOutput;
import vn.greenlab.model.output.RoleOutput;
import vn.greenlab.model.output.Response;
import vn.greenlab.repository.DepartmentRepository;
import vn.greenlab.repository.WorkAreaRepository;
import vn.greenlab.service.AdministratorService;
import vn.greenlab.service.RoleService;
import vn.greenlab.utils.AuthUtils;
import vn.greenlab.utils.PasswordUtils;
import vn.greenlab.utils.SearchParamValidator;
import vn.greenlab.utils.TextUtils;
import vn.greenlab.utils.SearchParamNormalizer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping(value = "/administrators", name = "Quản lý nhân viên")
@Tag(name = "Quản lý nhân viên", description = "API quản lý quản trị viên và nhân viên")
public class AdministratorController {

    @Autowired
    private AdministratorService administratorService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private WorkAreaRepository workAreaRepository;

    @Autowired
    private AuthUtils authUtils;

    @Value("${admin}")
    private String adminEmail;

    @GetMapping(name = "Danh sách quản trị viên")
    @Operation(summary = "Lấy danh sách quản trị viên", description = "Lấy danh sách quản trị viên có phân trang với các bộ lọc tùy chọn")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<AdministratorOutput>>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") String pageStr,
            @RequestParam(value = "size", required = false, defaultValue = "20") String sizeStr,
            @RequestParam(value = "id", required = false) String idStr,
            @RequestParam(value = "timeType", required = false, defaultValue = "0") String timeTypeStr,
            @RequestParam(value = "createdFrom", required = false) String createdFromStr,
            @RequestParam(value = "createdTo", required = false) String createdToStr,
            @RequestParam(value = "managerId", required = false) String managerIdStr,
            @RequestParam(value = "department_id", required = false) String departmentId,
            @RequestParam(value = "workAreaId", required = false) String workAreaId,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {

        // Validate và convert parameters (sẽ throw BadRequestException nếu có lỗi)
        SearchParamValidator.AdministratorSearchParams params = SearchParamValidator
                .validateAndConvertAdministratorSearch(
                        pageStr, sizeStr, timeTypeStr, idStr, managerIdStr,
                        departmentId, workAreaId, name, username, phone,
                        createdFromStr, createdToStr);

        // Normalize string parameters
        String normalizedDepartmentId = SearchParamNormalizer.normalizeString(params.departmentId);
        String normalizedWorkAreaId = SearchParamNormalizer.normalizeString(params.workAreaId);
        String normalizedUsername = SearchParamNormalizer.normalizeString(params.username);
        String normalizedPhone = SearchParamNormalizer.normalizeString(params.phone);
        String normalizedName = SearchParamNormalizer.normalizeString(params.name);

        // Normalize page (điều chỉnh để bắt đầu từ 0)
        Integer normalizedPage = SearchParamNormalizer.normalizePage(params.page);

        Sort sort = Sort.by("update_time").descending();
        Pageable pageable = PageRequest.of(normalizedPage, params.size, sort);

        Page<AdministratorOutput> result = administratorService.findAll(
                pageable, params.id, params.createdFrom, params.createdTo,
                normalizedName, normalizedPhone, isActive, params.managerId,
                normalizedDepartmentId, normalizedWorkAreaId, normalizedUsername, params.timeType);

        CustomPageResponse<AdministratorOutput> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize());
        Response<CustomPageResponse<AdministratorOutput>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/{id}", name = "Lấy thông tin chi tiết của quản trị viên")
    @Operation(summary = "Lấy thông tin chi tiết quản trị viên", description = "Lấy thông tin chi tiết của một quản trị viên theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<AdministratorOutput>> getById(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable Integer id) {
        Optional<Administrator> admin = administratorService.findById(id);
        if (admin.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Response<AdministratorOutput> response = new Response<>(true, "Thành công",
                administratorService.convertToOutput(admin.get()));
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(value = "/search-admin", name = "Tìm kiếm nhân viên để chọn quản lý")
    @Operation(summary = "Tìm kiếm nhân viên để chọn quản lý", description = "Tìm kiếm nhân viên để gán làm quản lý")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tìm kiếm thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<AdministratorOutput>>> searchAdmin(
            @RequestParam(value = "page", required = false, defaultValue = "1") String pageStr,
            @RequestParam(value = "username", required = false) String username,
            @RequestBody List<Integer> adminIds) {

        // Validate và convert parameters
        Integer page = 1;
        try {
            page = Integer.parseInt(pageStr);
            if (page > 0) {
                page = page - 1;
            }
        } catch (Exception e) {
        }
        // Normalize username

        // Normalize page (điều chỉnh để bắt đầu từ 0)
        Integer normalizedPage = SearchParamNormalizer.normalizePage(page);

        List<AdministratorOutput> result = administratorService.searchAdmin(adminIds, username, normalizedPage);
        Response<List<AdministratorOutput>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(name = "Tạo quản trị viên")
    @Operation(summary = "Tạo quản trị viên mới", description = "Tạo quản trị viên mới với thông tin được cung cấp bao gồm ảnh đại diện và chữ ký số")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tạo quản trị viên thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - số điện thoại, tên đăng nhập hoặc email đã tồn tại"),
            @ApiResponse(responseCode = "500", description = "Lỗi máy chủ - tải file thất bại"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> create(@ModelAttribute AdministratorInput body) {
        // Validate input format
        SearchParamValidator.validateAdministratorInput(
                body.getPhone(), body.getUser_name(), body.getEmail(),
                body.getDepartment_id(), body.getWork_area_id());

        // Normalize string fields
        String normalizedPhone = SearchParamNormalizer.normalizeString(body.getPhone());
        String normalizedUsername = SearchParamNormalizer.normalizeString(body.getUser_name());
        String normalizedEmail = SearchParamNormalizer.normalizeString(body.getEmail());
        String normalizedStartBarcode = SearchParamNormalizer.normalizeString(body.getStart_barcode());

        // Check duplicate
        if (normalizedPhone != null && administratorService.findByPhone(normalizedPhone).isPresent()) {
            throw new NotFoundException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        if (!TextUtils.isNullOrEmpty(normalizedStartBarcode) && administratorService.existsByStartBarcode(normalizedStartBarcode)) {
            throw new NotFoundException(ErrorCode.START_BARCODE_ALREADY_EXISTS);
        }

        if (normalizedUsername != null && administratorService.findByUsername(normalizedUsername).isPresent()) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Tên hiển thị đã tồn tại");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        if (normalizedEmail != null && administratorService.findByEmail(normalizedEmail).isPresent()) {
            throw new NotFoundException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        Administrator admin = new Administrator();
        admin.setId(administratorService.genId(8));
        admin.setDepartment_id(SearchParamNormalizer.normalizeString(body.getDepartment_id()));
        admin.setWork_area_id(SearchParamNormalizer.normalizeString(body.getWork_area_id()));
        admin.setUser_name(normalizedUsername);
        admin.setEmail(normalizedEmail);
        admin.setPhone(normalizedPhone);
        admin.setStatus(body.getStatus());
        admin.setFull_name(SearchParamNormalizer.normalizeString(body.getFull_name()));
        admin.setPosition(!TextUtils.isNullOrEmpty(body.getPosition()) ? Position.valueOf(body.getPosition()) : null);
        admin.setCreate_time(LocalDateTime.now());
        admin.setUpdate_time(LocalDateTime.now());
        admin.setStart_barcode(body.getStart_barcode());
        admin.setPassword(passwordEncoder.encode(body.getPassword()));
        if (body.getPhoto() != null && !body.getPhoto().isEmpty()) {
            // Validate image file type
            SearchParamValidator.validateImageFile(body.getPhoto(), "photo");
            OSSType type = OSSType.AVATAR_STAFF;
            try {
                String fileName = System.currentTimeMillis() + "_" + body.getPhoto().getOriginalFilename();
                Path uploadDir = Paths.get(type.getPath() + "/");
                Files.createDirectories(uploadDir);

                Path filePath = uploadDir.resolve(fileName);
                Files.copy(body.getPhoto().getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                // Gọi OSS upload (nếu cần)
                // File file = filePath.toFile();
                // admin.setPhoto(alibabaOSSClient.uploadFile(file, fileName, type, admin.getId(), admin.getId()));

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi lưu ảnh"));
            }
        }
        if (body.getDigital_signature() != null && !body.getDigital_signature().isEmpty()) {
            // Validate image file type
            SearchParamValidator.validateImageFile(body.getDigital_signature(), "digital_signature");
            OSSType type = OSSType.DIGITAL_SIGNATURE;
            try {
                String fileName = System.currentTimeMillis() + "_" + body.getDigital_signature().getOriginalFilename();
                Path uploadDir = Paths.get(type.getPath() + "/");
                Files.createDirectories(uploadDir);

                Path filePath = uploadDir.resolve(fileName);
                Files.copy(body.getDigital_signature().getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                // Gọi OSS upload (nếu cần)
                // File file = filePath.toFile();
                // admin.setDigital_signature(alibabaOSSClient.uploadFile(file, fileName, type, admin.getId(), admin.getId()));

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi lưu ảnh"));
            }
        }
        administratorService.update(admin);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/positions", name = "Lấy danh sách chức vụ")
    @Operation(summary = "Lấy danh sách chức vụ", description = "Lấy danh sách chức vụ")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách chức vụ thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Map<Position, String>>> getPositions() {
        Map<Position, String> positions = Position.getPositions;
        Response<Map<Position, String>> response = new Response<>(true, "Thành công", positions);
        return ResponseEntity.ok(response);
    }
    

    @PutMapping(value = "/{id}", name = "Sửa thông tin quản trị viên")
    @Operation(summary = "Cập nhật thông tin quản trị viên", description = "Cập nhật thông tin của quản trị viên theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - số điện thoại hoặc tên đăng nhập đã tồn tại"),
            @ApiResponse(responseCode = "500", description = "Lỗi máy chủ - tải file thất bại"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable Integer id,
            @ModelAttribute AdministratorInput body) {
        Optional<Administrator> adminOpt = administratorService.findById(id);
        if (adminOpt.isEmpty())
            return ResponseEntity.notFound().build();
        Administrator admin = adminOpt.get();

        // Validate input format
        SearchParamValidator.validateAdministratorInput(
                body.getPhone(), body.getUser_name(), body.getEmail(),
                body.getDepartment_id(), body.getWork_area_id());

        // Normalize string fields
        String normalizedPhone = SearchParamNormalizer.normalizeString(body.getPhone());
        String normalizedUsername = SearchParamNormalizer.normalizeString(body.getUser_name());
        String normalizedEmail = SearchParamNormalizer.normalizeString(body.getEmail());
        String normalizedStartBarcode = SearchParamNormalizer.normalizeString(body.getStart_barcode());

        // Check duplicate
        if (normalizedPhone != null && !normalizedPhone.equals(admin.getPhone())
                && administratorService.findByPhone(normalizedPhone).isPresent()) {
            throw new NotFoundException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        if (normalizedUsername != null && !normalizedUsername.equals(admin.getUser_name())
                && administratorService.findByUsername(normalizedUsername).isPresent()) {
            throw new NotFoundException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        if (!TextUtils.isNullOrEmpty(normalizedStartBarcode) && !normalizedStartBarcode.equals(admin.getStart_barcode())
                && administratorService.existsByStartBarcode(normalizedStartBarcode)) {
            throw new NotFoundException(ErrorCode.START_BARCODE_ALREADY_EXISTS);
        }

        admin.setUser_name(normalizedUsername);
        admin.setEmail(normalizedEmail);
        admin.setPhone(normalizedPhone);
        admin.setStatus(body.getStatus());
        admin.setFull_name(SearchParamNormalizer.normalizeString(body.getFull_name()));
        admin.setPosition(body.getPosition() != null && !body.getPosition().isEmpty() ? Position.valueOf(body.getPosition()) : null);
        admin.setDepartment_id(SearchParamNormalizer.normalizeString(body.getDepartment_id()));
        admin.setWork_area_id(SearchParamNormalizer.normalizeString(body.getWork_area_id()));
        admin.setStart_barcode(body.getStart_barcode());
        admin.setUpdate_time(LocalDateTime.now());
        if (body.getPassword() != null && !body.getPassword().trim().equals("")) {
            if (admin.getSalt() == null || admin.getSalt().isEmpty()) {
                admin.setPassword(passwordEncoder.encode(body.getPassword()));
            } else {
                admin.setPassword(PasswordUtils.md5WithSalt(body.getPassword(), admin.getSalt()));
            }
        }
        if (body.getPhoto() != null && !body.getPhoto().isEmpty()) {
            // Validate image file type
            SearchParamValidator.validateImageFile(body.getPhoto(), "photo");
            OSSType type = OSSType.AVATAR_STAFF;
            try {
                String fileName = System.currentTimeMillis() + "_" + body.getPhoto().getOriginalFilename();
                Path uploadDir = Paths.get(type.getPath() + "/");
                Files.createDirectories(uploadDir);

                Path filePath = uploadDir.resolve(fileName);
                Files.copy(body.getPhoto().getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                // Gọi OSS upload (nếu cần)
                // File file = filePath.toFile();
                // admin.setPhoto(alibabaOSSClient.uploadFile(file, fileName, type, admin.getId(), admin.getId()));

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi lưu ảnh"));
            }
        } 

        if (body.getDigital_signature() != null && !body.getDigital_signature().isEmpty()) {
            // Validate image file type
            SearchParamValidator.validateImageFile(body.getDigital_signature(), "digital_signature");
            OSSType type = OSSType.DIGITAL_SIGNATURE;
            try {
                String fileName = System.currentTimeMillis() + "_"
                        + body.getDigital_signature().getOriginalFilename();
                Path uploadDir = Paths.get(type.getPath() + "/");
                Files.createDirectories(uploadDir);

                Path filePath = uploadDir.resolve(fileName);
                Files.copy(body.getDigital_signature().getInputStream(), filePath,
                        StandardCopyOption.REPLACE_EXISTING);

                // Gọi OSS upload (nếu cần)
                // File file = filePath.toFile();
                // admin.setDigital_signature(alibabaOSSClient.uploadFile(file, fileName, type, admin.getId(), admin.getId()));

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi lưu ảnh"));
            }
        } 
        if (body.isClear_photo()) {
            admin.setPhoto(null);
        }
        if (body.isClear_digital_signature()) {
            admin.setDigital_signature(null);
        }

        Response<AdministratorOutput> response = new Response<>(true, "Thành công", administratorService.update(admin));
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok(response);

    }

    @PutMapping(value = "/{id}/assign-manager", name = "Chọn quản lý cho nhân viên viên")
    @Operation(summary = "Gán quản lý cho nhân viên", description = "Chọn quản lý cho một nhân viên cụ thể")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Gán quản lý thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<AdministratorOutput>> assignManager(
            @Parameter(description = "ID nhân viên", required = true) @PathVariable Integer id,
            @Parameter(description = "ID quản lý", required = true) @RequestParam Integer managerId) {
        // TODO: process PUT request
        Response<AdministratorOutput> response = new Response<>(true, "Thành công",
                administratorService.assignManager(id, managerId));
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{id}/change-status", name = "Sửa trạng thái quản trị viên")
    @Operation(summary = "Thay đổi trạng thái quản trị viên", description = "Kích hoạt hoặc vô hiệu hóa quản trị viên")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thay đổi trạng thái thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> changeStatus(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable Integer id) {
        Optional<Administrator> adminOpt = administratorService.findById(id);
        if (adminOpt.isEmpty())
            return ResponseEntity.notFound().build();
        Administrator admin = adminOpt.get();
        admin.setStatus(admin.getStatus() == 1 ? 0 : 1);
        if (admin.getStatus() == 0) {
            admin.getRoles().clear();
            admin.setRoleIds(null);
        }
        admin.setUpdate_time(LocalDateTime.now());
        administratorService.update(admin);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/{id}/roles", name = "Lấy danh sách quyền của quản trị viên")
    @Operation(summary = "Lấy danh sách quyền của quản trị viên", description = "Lấy danh sách các quyền được gán cho quản trị viên")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách quyền thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Role>>> getRoles(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable Integer id) {
        Optional<Administrator> admin = administratorService.findById(id);
        Response<List<Role>> response = new Response<>(true, "Thành công", admin.get().getRoles());
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    public static class IdsRequest {
        public List<Integer> ids;

        public List<Integer> getIds() {
            return ids;
        }

        public void setIds(List<Integer> ids) {
            this.ids = ids;
        }
    }

    @GetMapping(value = "/get-all-roles", name = "Lấy danh sách quyền")
    @Operation(summary = "Lấy danh sách quyền", description = "Lấy danh sách tất cả các quyền có trong hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách quyền thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> getAllRoles(
            @Parameter(description = "ID quản trị viên", required = true) @RequestParam(value = "adminId") Integer adminId,
            HttpServletRequest request) {
        Optional<Administrator> adminOpt = administratorService.findById(adminId);
        if (adminOpt.isEmpty()) {
            throw new NotFoundException(ErrorCode.ADMIN_NOT_FOUND);
        }
        Map<String, Object> result = new HashMap<>();
        Integer actorAdminId = authUtils.getAdminId(request);
        List<RoleOutput> roles = roleService.findRoleList();
        Optional<Administrator> currentAdminOpt = actorAdminId != null ? administratorService.findById(actorAdminId) : Optional.empty();
        result.put("adminRoles", adminOpt.get().getRoles().stream().map(roleService::convertToOutput).toList());
        result.put("result", roles);
        String ids = roles.stream()
                .map(RoleOutput::getId)
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        result.put("adminRoleIds",
                currentAdminOpt.isEmpty() || currentAdminOpt.get().getRoleIds() == null || currentAdminOpt.get().getRoleIds().isEmpty()
                        || adminEmail.contains(currentAdminOpt.get().getEmail()) ? ids
                                : currentAdminOpt.get().getRoleIds());
        Response<Map<String, Object>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/get-all-roles-can-set", name = "Lấy danh sách quyền có thể cấp")
    @Operation(summary = "Lấy danh sách quyền có thể cấp", description = "Lấy danh sách các quyền mà quản trị viên có thể cấp cho người khác")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách quyền thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> getAllRolesCanSet(
            @Parameter(description = "ID quản trị viên", required = true) @RequestParam(value = "adminId") Integer adminId) {
        Optional<Administrator> adminOpt = administratorService.findById(adminId);
        if (adminOpt.isEmpty()) {
            throw new NotFoundException(ErrorCode.ADMIN_NOT_FOUND);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("adminRoleIds", adminOpt.get().getRoleIds());
        result.put("result", roleService.findRoleList());
        Response<Map<String, Object>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/get-all-roles-detail", name = "Lấy danh sách quyền chi tiết")
    @Operation(summary = "Lấy danh sách quyền chi tiết", description = "Lấy danh sách quyền với thông tin chi tiết đầy đủ")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách quyền thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> getAllRolesDetail(
            @Parameter(description = "ID quản trị viên", required = true) @RequestParam(value = "adminId") Integer adminId,
            HttpServletRequest request) {
        Optional<Administrator> adminOpt = administratorService.findById(adminId);
        if (adminOpt.isEmpty()) {
            throw new NotFoundException(ErrorCode.ADMIN_NOT_FOUND);
        }
        Map<String, Object> result = new HashMap<>();
        Integer actorAdminId = authUtils.getAdminId(request);
        List<RoleDetailOutput> roles = roleService.findRoleDetailList();
        Optional<Administrator> currentAdminOpt = actorAdminId != null ? administratorService.findById(actorAdminId) : Optional.empty();
        result.put("adminRoles", adminOpt.get().getRoles().stream().map(roleService::convertToOutput).toList());
        result.put("result", roles);
        String ids = roles.stream()
                .map(RoleDetailOutput::getId)
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        result.put("adminRoleIds",
                currentAdminOpt.isEmpty() || currentAdminOpt.get().getRoleIds() == null || currentAdminOpt.get().getRoleIds().isEmpty()
                        || adminEmail.contains(currentAdminOpt.get().getEmail()) ? ids
                                : currentAdminOpt.get().getRoleIds());
        Response<Map<String, Object>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PutMapping(value = "/{adminId}/assign-role", name = "Cập nhật quyền cho quản trị viên")
    @Operation(summary = "Cập nhật quyền cho quản trị viên", description = "Gán hoặc cập nhật danh sách quyền cho quản trị viên")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> setRoles(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable("adminId") Integer adminId,
            @RequestBody List<Integer> ids,
            HttpServletRequest request) {
        if (adminId == null || ids == null)
            return ResponseEntity.badRequest().build();
        Integer actorAdminId = authUtils.getAdminId(request);
        administratorService.setRoles(adminId, ids, actorAdminId);
        return ResponseEntity.ok().build();
    }

    @PutMapping(value = "/{adminId}/assign-role-can-set", name = "Cập nhật quyền có thể cấp cho quản trị viên")
    @Operation(summary = "Cập nhật quyền có thể cấp", description = "Cập nhật danh sách quyền mà quản trị viên có thể cấp cho người khác")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> setRolesCanAssign(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable("adminId") Integer adminId,
            @RequestBody List<Integer> ids) {
        if (adminId == null || ids == null)
            return ResponseEntity.badRequest().build();
        administratorService.setRolesCanAssign(adminId, ids);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/get-departments", name = "Tìm kiếm phòng ban")
    @Operation(summary = "Lấy danh sách phòng ban", description = "Lấy danh sách tất cả các phòng ban trong hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách phòng ban thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Department>>> searchDepartment() {
        List<Department> result = departmentRepository.findAll();
        Response<List<Department>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/get-workareas", name = "Tìm kiếm khu vực")
    @Operation(summary = "Lấy danh sách khu vực", description = "Lấy danh sách tất cả các khu vực làm việc trong hệ thống")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách khu vực thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<WorkArea>>> searchWorkArea() {
        List<WorkArea> result = workAreaRepository.findAll();
        Response<List<WorkArea>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }
}
