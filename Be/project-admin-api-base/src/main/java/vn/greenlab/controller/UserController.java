package vn.greenlab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

import vn.greenlab.exception.NotFoundException;
import vn.greenlab.model.User;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.Response;
import vn.greenlab.model.input.user.UserSearch;
import vn.greenlab.service.UserService;
import vn.greenlab.utils.SearchParamNormalizer;

@RestController
@RequestMapping(value = "/users", name = "Quản lý user")
@Tag(name = "Quản lý user", description = "API quản lý user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping(name = "Danh sách user")
    @Operation(summary = "Lấy danh sách user", description = "Lấy danh sách user có phân trang với các bộ lọc tùy chọn")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<User>>> getAll(
            @Parameter(description = "Số trang, bắt đầu từ 1") @RequestParam(value = "page", required = false, defaultValue = "1") String pageStr,
            @Parameter(description = "Số bản ghi/trang") @RequestParam(value = "size", required = false, defaultValue = "20") String sizeStr,
            @Parameter(description = "Từ khóa tìm kiếm theo tên/email/phone") @RequestParam(value = "keyword", required = false) String keyword,
            @Parameter(description = "Lọc theo email") @RequestParam(value = "email", required = false) String email,
            @Parameter(description = "Lọc theo họ tên") @RequestParam(value = "fullName", required = false) String fullName,
            @Parameter(description = "Lọc theo số điện thoại") @RequestParam(value = "phone", required = false) String phone,
            @Parameter(description = "Lọc theo trạng thái") @RequestParam(value = "isActive", required = false) Boolean isActive,
            @Parameter(description = "Lọc theo loại user") @RequestParam(value = "type", required = false) Integer type,
            @Parameter(description = "Lọc theo nguồn đăng ký") @RequestParam(value = "regSource", required = false) Integer regSource,
            @Parameter(description = "Từ ngày tạo (yyyy-MM-dd)") @RequestParam(value = "createdFrom", required = false) String createdFrom,
            @Parameter(description = "Đến ngày tạo (yyyy-MM-dd)") @RequestParam(value = "createdTo", required = false) String createdTo,
            @Parameter(description = "Trường sắp xếp") @RequestParam(value = "sortBy", required = false, defaultValue = "createTime") String sortBy,
            @Parameter(description = "Hướng sắp xếp asc/desc") @RequestParam(value = "sortDir", required = false, defaultValue = "desc") String sortDir) {

        Integer page = 1;
        try {
            page = Integer.parseInt(pageStr);
            if (page < 1) page = 1;
        } catch (Exception e) {
            page = 1;
        }

        Integer size = 20;
        try {
            size = Integer.parseInt(sizeStr);
            if (size < 1) size = 20;
        } catch (Exception e) {
            size = 20;
        }

        UserSearch search = new UserSearch();
        search.setKeyword(keyword);
        search.setEmail(email);
        search.setFullName(fullName);
        search.setPhone(phone);
        search.setIsActive(isActive);
        search.setType(type);
        search.setRegSource(regSource);
        search.setPage(page);
        search.setSize(size);
        search.setSortBy(sortBy);
        search.setSortDir(sortDir);

        if (createdFrom != null && !createdFrom.isBlank()) {
            search.setCreatedFrom(LocalDateTime.parse(createdFrom + "T00:00:00"));
        }
        if (createdTo != null && !createdTo.isBlank()) {
            search.setCreatedTo(LocalDateTime.parse(createdTo + "T23:59:59"));
        }

        Page<User> result = userService.search(search);
        CustomPageResponse<User> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize());
        Response<CustomPageResponse<User>> response = new Response<>(true, "Thành công", customPage);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/{id}", name = "Chi tiết user")
    @Operation(summary = "Lấy chi tiết user theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<User>> getById(
            @Parameter(description = "ID user", required = true) @PathVariable Long id) {
        Optional<User> user = userService.findById(id);
        if (user.isEmpty()) {
            throw new NotFoundException("User not found");
        }
        Response<User> response = new Response<>(true, "Thành công", user.get());
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping(name = "Tạo user")
    @Operation(summary = "Tạo user mới")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tạo thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<User>> create(@RequestBody User user) {
        User created = userService.create(user);
        Response<User> response = new Response<>(true, "Thành công", created);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @PutMapping(value = "/{id}", name = "Cập nhật user")
    @Operation(summary = "Cập nhật user theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<User>> update(
            @Parameter(description = "ID user", required = true) @PathVariable Long id,
            @RequestBody User user) {
        User updated = userService.update(id, user);
        Response<User> response = new Response<>(true, "Thành công", updated);
        response.setCode(vn.greenlab.model.enums.ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping(value = "/{id}", name = "Xóa user")
    @Operation(summary = "Xóa user theo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Xóa thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
            @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID user", required = true) @PathVariable Long id) {
        Optional<User> exist = userService.findById(id);
        if (exist.isEmpty()) {
            throw new NotFoundException("User not found");
        }
        userService.delete(id);
        return ResponseEntity.ok().build();
    }
}
