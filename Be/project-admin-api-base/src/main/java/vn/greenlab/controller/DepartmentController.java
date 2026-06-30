package vn.greenlab.controller;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import vn.greenlab.model.Department;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.Response;
import vn.greenlab.repository.DepartmentRepository;
import vn.greenlab.service.DepartmentService;
import vn.greenlab.utils.SearchParamValidator;
import vn.greenlab.utils.SearchParamNormalizer;

@RestController
@RequestMapping(value = "/departments", name = "Quản lý phòng ban")
@Tag(name = "Quản lý phòng ban", description = "API quản lý phòng ban")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping(name = "Danh sách phòng ban")
    @Operation(summary = "Lấy danh sách phòng ban", description = "Lấy danh sách phòng ban có phân trang với các bộ lọc tùy chọn")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<Department>>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") String pageStr,
            @RequestParam(value = "size", required = false, defaultValue = "20") String sizeStr,
            @RequestParam(value = "createdTimeFrom", required = false) String createdTimeFromStr,
            @RequestParam(value = "createdTimeTo", required = false) String createdTimeToStr,
            @RequestParam(value = "timeType", required = false, defaultValue = "0") String timeTypeStr,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "shortName", required = false) String shortName,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {

        SearchParamValidator.DepartmentSearchParams params =
                SearchParamValidator.validateAndConvertDepartmentSearch(
                        pageStr, sizeStr, timeTypeStr,
                        name, shortName, createdTimeFromStr, createdTimeToStr);

        String normalizedName = SearchParamNormalizer.normalizeString(params.name);
        String normalizedShortName = SearchParamNormalizer.normalizeString(params.shortName);
        Integer normalizedPage = SearchParamNormalizer.normalizePage(params.page);

        Sort sort = Sort.by("create_time").descending();
        Pageable pageable = PageRequest.of(normalizedPage, params.size, sort);

        Page<Department> result = departmentService.findAll(
                pageable, params.id, params.createdTimeFrom, params.createdTimeTo,
                normalizedName, normalizedShortName, isActive, params.timeType);

        CustomPageResponse<Department> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize());
        Response<CustomPageResponse<Department>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/{id}", name = "Chi tiết phòng ban")
    @Operation(summary = "Lấy chi tiết phòng ban", description = "Lấy thông tin chi tiết của một phòng ban theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Department>> getById(
            @Parameter(description = "ID phòng ban", required = true) @PathVariable Long id) {
        Optional<Department> department = departmentService.findById(id);
        if (department.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Response<Department> response = new Response<>(true, "Thành công", department.get());
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(name = "Tạo phòng ban")
    @Operation(summary = "Tạo phòng ban mới", description = "Tạo phòng ban mới với thông tin được cung cấp")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tạo phòng ban thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Department>> create(@RequestBody Department department) {
        Department created = departmentService.create(department);
        Response<Department> response = new Response<>(true, "Thành công", created);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PutMapping(value = "/{id}", name = "Cập nhật phòng ban")
    @Operation(summary = "Cập nhật phòng ban", description = "Cập nhật thông tin của phòng ban theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Department>> update(
            @Parameter(description = "ID phòng ban", required = true) @PathVariable Long id,
            @RequestBody Department department) {
        Optional<Department> existing = departmentService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Department updated = departmentService.update(id, department);
        Response<Department> response = new Response<>(true, "Thành công", updated);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping(value = "/{id}", name = "Xóa phòng ban")
    @Operation(summary = "Xóa phòng ban", description = "Xóa một phòng ban theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Xóa thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID phòng ban", required = true) @PathVariable Long id) {
        Optional<Department> existing = departmentService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        departmentRepository.deleteById(id);
        departmentService.getDepartmentCache();
        return ResponseEntity.noContent().build();
    }
}
