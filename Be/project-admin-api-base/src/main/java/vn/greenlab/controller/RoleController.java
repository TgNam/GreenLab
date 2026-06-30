package vn.greenlab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import vn.greenlab.model.Administrator;
import vn.greenlab.model.Permission;
import vn.greenlab.model.Role;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.PermissionTreeOutput;
import vn.greenlab.model.output.Response;
import vn.greenlab.model.output.RoleOutput;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.repository.RoleRepository;
import vn.greenlab.service.AdministratorService;
import vn.greenlab.service.PermissionService;
import vn.greenlab.service.RoleService;
import vn.greenlab.utils.SearchParamValidator;
import vn.greenlab.utils.SearchParamNormalizer;

@RestController
@RequestMapping(value = "/roles", name = "Quản lý nhóm quyền")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Quản lý nhóm quyền", description = "API quản lý nhóm quyền và phân quyền")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private AdministratorService administratorService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AdministratorRepository administratorRepository;

    @GetMapping(name = "Danh sách nhóm quyền")
    @Operation(summary = "Lấy danh sách nhóm quyền", description = "Lấy danh sách nhóm quyền có phân trang với các bộ lọc tùy chọn")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<RoleOutput>>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") String pageStr,
            @RequestParam(value = "size", required = false, defaultValue = "20") String sizeStr,
            @RequestParam(value = "createdTimeFrom", required = false) String createdTimeFromStr,
            @RequestParam(value = "createdTimeTo", required = false) String createdTimeToStr,
            @RequestParam(value = "timeType", required = false, defaultValue = "0") String timeTypeStr,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "adminId", required = false) String adminIdStr) {
        
        // Validate và convert parameters (sẽ throw BadRequestException nếu có lỗi)
        SearchParamValidator.RoleSearchParams params = 
                SearchParamValidator.validateAndConvertRoleSearch(
                        pageStr, sizeStr, timeTypeStr, null, adminIdStr,
                        name, description, createdTimeFromStr, createdTimeToStr);
        
        // Normalize string parameters
        String normalizedName = SearchParamNormalizer.normalizeString(params.name);
        String normalizedDescription = SearchParamNormalizer.normalizeString(params.description);
        
        // Normalize page (điều chỉnh để bắt đầu từ 0)
        Integer normalizedPage = SearchParamNormalizer.normalizePage(params.page);
        
        Sort sort = Sort.by("update_time").descending();
        Pageable pageable = PageRequest.of(normalizedPage, params.size, sort);
        
        Page<RoleOutput> result = roleService.search(pageable, params.createdTimeFrom, params.createdTimeTo,
                normalizedName, normalizedDescription, isActive, params.timeType, params.adminId);
        CustomPageResponse<RoleOutput> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize());
        Response<CustomPageResponse<RoleOutput>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);

    }

    @GetMapping(value = "/administrator/{id}", name = "Lấy thông tin chi tiết của quản trị viên")
    @Operation(summary = "Lấy thông tin chi tiết quản trị viên", description = "Lấy thông tin chi tiết của một quản trị viên theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy quản trị viên"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<AdministratorOutput>> getByIdAdmin(
            @Parameter(description = "ID quản trị viên", required = true) @PathVariable Long id) {
        Optional<Administrator> admin = administratorService.findById(id.intValue());
        if (admin.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Response<AdministratorOutput> response = new Response<>(true, "Thành công",
                administratorService.convertToOutput(admin.get()));
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/staffs", name = "Danh sách nhân viên")
    @Operation(summary = "Lấy danh sách nhân viên", description = "Lấy danh sách nhân viên có phân trang với tìm kiếm")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<AdministratorOutput>>> getStaffs(
            @RequestParam(required = false) String searchText,
            @RequestParam(required = false, defaultValue = "1") Integer page) {
        if (page > 0) {
            page = page - 1;
        }
        Pageable pageable = PageRequest.of(page, 20);
        if (searchText != null)
            searchText = searchText.trim();
        Page<Administrator> administrators = administratorRepository.searchAdministratorByTextActive(searchText,
                new ArrayList<>(), pageable);
        // Convert Administrator to AdministratorOutput
        List<AdministratorOutput> administratorOutputs = administrators.getContent().stream()
                .map(administratorService::convertToOutput)
                .collect(Collectors.toList());
        CustomPageResponse<AdministratorOutput> customPage = new CustomPageResponse<>(
                administratorOutputs,
                administrators.getTotalElements(),
                administrators.getTotalPages(),
                administrators.getSize());
        Response<CustomPageResponse<AdministratorOutput>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(value = "/permission", name = "Lấy danh sách quyền")
    @Operation(summary = "Lấy danh sách quyền", description = "Lấy danh sách tất cả các quyền dạng cây")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<PermissionTreeOutput>>> getAllPermissions() {
        List<PermissionTreeOutput> result = permissionService.getAllPermission();
        Response<List<PermissionTreeOutput>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/{id}", name = "Chi tiết nhóm quyền")
    @Operation(summary = "Lấy chi tiết nhóm quyền", description = "Lấy thông tin chi tiết của một nhóm quyền theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy nhóm quyền"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<RoleOutput>> getById(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id) {
        Optional<Role> role = roleService.findById(id.intValue());
        if (role.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Response<RoleOutput> response = new Response<>(true, "Thành công", roleService.convertToOutput(role.get()));
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(name = "Tạo nhóm quyền")
    @Operation(summary = "Tạo nhóm quyền mới", description = "Tạo nhóm quyền mới với thông tin được cung cấp")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tạo nhóm quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<RoleOutput>> create(@RequestBody Role role) {
        Role created = roleService.create(role);
        Response<RoleOutput> response = new Response<>(true, "Thành công", roleService.convertToOutput(created));
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(name = "Clone nhóm quyền", value = "/{id}/clone")
    @Operation(summary = "Clone nhóm quyền", description = "Tạo bản sao của một nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clone nhóm quyền thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy nhóm quyền"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<RoleOutput>> cloneRole(
            @Parameter(description = "ID nhóm quyền cần clone", required = true) @PathVariable Long id) {
        RoleOutput result = roleService.cloneRole(id.intValue());
        Response<RoleOutput> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PutMapping(value = "/{id}", name = "Sửa nhóm quyền")
    @Operation(summary = "Cập nhật nhóm quyền", description = "Cập nhật thông tin của nhóm quyền theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy nhóm quyền"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<RoleOutput>> update(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id, 
            @RequestBody Role roleDetails) {
        Optional<Role> existing = roleService.findById(id.intValue());
        if (existing.isEmpty())
            return ResponseEntity.notFound().build();

        Role toUpdate = existing.get();
        toUpdate.setName(roleDetails.getName());
        toUpdate.setDescription(roleDetails.getDescription());
        toUpdate.setIcon(roleDetails.getIcon());
        toUpdate.setPosition(roleDetails.getPosition());
        toUpdate.setActive(roleDetails.isActive());
        toUpdate.setCreate_time(roleDetails.getCreate_time());
        toUpdate.setUpdate_time(LocalDateTime.now());
        Role updated = roleService.update(toUpdate);
        Response<RoleOutput> response = new Response<>(true, "Thành công", roleService.convertToOutput(updated));
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping(value = "/{id}", name = "Xóa nhóm quyền")
    @Operation(summary = "Xóa nhóm quyền", description = "Xóa một nhóm quyền theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Xóa thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy nhóm quyền"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id) {
        Optional<Role> existing = roleService.findById(id.intValue());
        if (existing.isEmpty())
            return ResponseEntity.notFound().build();
        Optional<Role> roleOpt = roleRepository.findById(id.intValue());
        if (roleOpt.isPresent()) {
            Role role = roleOpt.get();

            // Xóa role khỏi tất cả administrator (2 chiều)
            for (Administrator admin : role.getAdministrators()) {
                admin.getRoles().remove(role);
            }
            role.getAdministrators().clear(); // clear list bên role
            role.getPermissions().clear();
            // Cuối cùng xóa role
            roleRepository.delete(role);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/permissions", name = "Lấy danh sách quyền trong nhóm quyền")
    @Operation(summary = "Lấy danh sách quyền trong nhóm quyền", description = "Lấy danh sách các quyền được gán cho nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy nhóm quyền"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Permission>>> getPermissions(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id) {
        Optional<Role> existing = roleService.findById(id.intValue());
        if (existing.isEmpty())
            return ResponseEntity.notFound().build();
        List<Permission> result = roleService.getPermissionsOfRole(id.intValue());
        Response<List<Permission>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(value = "/search-admin", name = "Tìm kiếm nhân viên")
    @Operation(summary = "Tìm kiếm nhân viên", description = "Tìm kiếm nhân viên để gán vào nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tìm kiếm thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<AdministratorOutput>>> searchAdmin(
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "username", required = false) String username,
            @RequestBody List<Long> adminIds

    ) {
        if(page > 0) {
            page = page - 1;
        }
        // Convert List<Long> to List<Integer>
        List<Integer> adminIdsInt = adminIds.stream()
            .map(Long::intValue)
            .collect(Collectors.toList());
        List<AdministratorOutput> result = administratorService.searchAdmin(adminIdsInt, username, page);
        Response<List<AdministratorOutput>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/{id}/get-admin-in-role", name = "Lấy ds quản trị viên trong nhóm quyền")
    @Operation(summary = "Lấy danh sách quản trị viên trong nhóm quyền", description = "Lấy danh sách các quản trị viên thuộc nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<AdministratorOutput>>> getAdminInRole(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id) {
        List<AdministratorOutput> result = roleService.getAdminInRole(id.intValue());
        Response<List<AdministratorOutput>> response = new Response<>(true, "Thành công", result);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    public static class IdsRequest {
        public List<Long> ids;

        public List<Long> getIds() {
            return ids;
        }

        public void setIds(List<Long> ids) {
            this.ids = ids;
        }
    }

    @PutMapping(value = "/{id}/permissions", name = "Cập nhật quyền trong nhóm quyền")
    @Operation(summary = "Cập nhật quyền trong nhóm quyền", description = "Gán hoặc cập nhật danh sách quyền cho nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật quyền thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> setPermissions(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id, 
            @RequestBody List<Long> ids) {
        // Convert List<Long> to List<Integer>
        List<Integer> idsInt = ids.stream()
            .map(Long::intValue)
            .collect(Collectors.toList());
        roleService.setPermissions(id.intValue(), idsInt);
        return ResponseEntity.ok().build();
    }

    @PutMapping(value = "/{id}/change-status", name = "Sửa trạng thái nhóm quyền")
    @Operation(summary = "Thay đổi trạng thái nhóm quyền", description = "Kích hoạt hoặc vô hiệu hóa nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thay đổi trạng thái thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy nhóm quyền"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> changeStatus(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id) {
        Optional<Role> roleOpt = roleService.findById(id.intValue());
        if (roleOpt.isEmpty())
            return ResponseEntity.notFound().build();
        Role role = roleOpt.get();
        role.setActive(!role.isActive());
        role.setUpdate_time(LocalDateTime.now());
        roleService.update(role);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/{id}/add-admin", name = "Thêm nhân viên vào nhóm quyền")
    @Operation(summary = "Thêm nhân viên vào nhóm quyền", description = "Thêm một nhân viên vào nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thêm nhân viên thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> addAdmin(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id, 
            @Parameter(description = "ID nhân viên", required = true) @RequestParam("adminId") Long adminId) {
        roleService.addAdmin(id.intValue(), adminId.intValue());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping(value = "/{id}/remove-admin", name = "Xóa nhân viên khỏi nhóm quyền")
    @Operation(summary = "Xóa nhân viên khỏi nhóm quyền", description = "Xóa một nhân viên khỏi nhóm quyền")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Xóa nhân viên thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<?> removeAdmin(
            @Parameter(description = "ID nhóm quyền", required = true) @PathVariable Long id, 
            @Parameter(description = "ID nhân viên", required = true) @RequestParam("adminId") Long adminId) {
        roleService.removeAdmin(id.intValue(), adminId.intValue());
        return ResponseEntity.ok().build();
    }

}
