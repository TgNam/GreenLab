package vn.greenlab.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
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
import vn.greenlab.model.EmailTemplate;
import vn.greenlab.model.enums.EmailOutboxType;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.input.email_template.EmailTemplateSearch;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.Response;
import vn.greenlab.service.EmailTemplateService;

@RestController
@RequestMapping(value = "/email-templates", name = "Quản lý mẫu email")
@Tag(name = "Quản lý mẫu email", description = "API Quản lý mẫu email")
public class EmailTemplateController {

    @Autowired
    private EmailTemplateService emailTemplateService;

    @GetMapping(name = "Danh sách mẫu email")
    @Operation(summary = "Danh sách mẫu email", description = "Lấy danh sách mẫu email có phân trang và bộ lọc")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<EmailTemplate>>> list(
            @ParameterObject @ModelAttribute EmailTemplateSearch searchInput) {
        var result = emailTemplateService.search(searchInput);
        CustomPageResponse<EmailTemplate> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize()
        );
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", customPage));
    }

    @GetMapping(value = "/{id}", name = "Chi tiết mẫu email")
    @Operation(summary = "Chi tiết mẫu email", description = "Lấy thông tin chi tiết mẫu email theo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy")
    })
    public ResponseEntity<Response<EmailTemplate>> detail(
            @Parameter(description = "ID mẫu email", required = true) @PathVariable Long id) {
        Optional<EmailTemplate> template = emailTemplateService.findById(id);
        if (template.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", template.get()));
    }

    @PostMapping(name = "Tạo mẫu email")
    @Operation(summary = "Tạo mẫu email", description = "Tạo mới mẫu email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<EmailTemplate>> create(@RequestBody EmailTemplate emailTemplate) {
        EmailTemplate created = emailTemplateService.create(emailTemplate);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", created));
    }

    @PutMapping(value = "/{id}", name = "Cập nhật mẫu email")
    @Operation(summary = "Cập nhật mẫu email", description = "Cập nhật mẫu email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<EmailTemplate>> update(
            @Parameter(description = "ID mẫu email", required = true) @PathVariable Long id,
            @RequestBody EmailTemplate emailTemplate) {
        EmailTemplate updated = emailTemplateService.update(id, emailTemplate);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", updated));
    }

    @PatchMapping(value = "/{id}/active", name = "Cập nhật trạng thái active mẫu email")
    @Operation(summary = "Cập nhật active", description = "Cập nhật trường active của mẫu email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<EmailTemplate>> updateActive(
            @Parameter(description = "ID mẫu email", required = true) @PathVariable Long id,
            @RequestParam boolean active) {
        EmailTemplate updated = emailTemplateService.setActive(id, active);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", updated));
    }

    @DeleteMapping(value = "/{id}", name = "Xóa mẫu email")
    @Operation(summary = "Xóa mẫu email", description = "Xóa mẫu email theo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Void>> delete(
            @Parameter(description = "ID mẫu email", required = true) @PathVariable Long id) {
        emailTemplateService.delete(id);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công"));
    }

    @GetMapping(value = "/types", name = "Danh sách loại mẫu email")
    @Operation(summary = "Danh sách loại mẫu email", description = "Lấy danh sách loại mẫu email từ enum EmailOutboxType")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Map<String, String>>>> getTemplateTypes() {
        List<Map<String, String>> result = Arrays.stream(EmailOutboxType.values())
            .map(t -> Map.of("value", t.name(), "label", t.getDescription()))
            .toList();
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", result));
    }
}