package vn.greenlab.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
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
import vn.greenlab.model.SmsTemplate;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.enums.SmsOutboxType;
import vn.greenlab.model.enums.SmsRecipientType;
import vn.greenlab.model.input.sms_template.SmsTemplateSearch;
import vn.greenlab.model.output.CustomPageResponse;
import vn.greenlab.model.output.Response;
import vn.greenlab.service.SmsTemplateService;

@RestController
@RequestMapping(value = "/sms-templates", name = "Quản lý biểu mẫu SMS")
@Tag(name = "Quản lý biểu mẫu SMS", description = "API quản lý biểu mẫu SMS")
public class SmsTemplateController {

    @Autowired
    private SmsTemplateService smsTemplateService;

    @GetMapping(name = "Danh sách biểu mẫu SMS")
    @Operation(summary = "Danh sách biểu mẫu SMS", description = "Lấy danh sách biểu mẫu SMS có phân trang và bộ lọc")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<CustomPageResponse<SmsTemplate>>> list(
            @ParameterObject @ModelAttribute SmsTemplateSearch searchInput) {
        var result = smsTemplateService.search(searchInput);
        CustomPageResponse<SmsTemplate> customPage = new CustomPageResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getSize()
        );
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", customPage));
    }

    @GetMapping(value = "/types", name = "Danh sách loại biểu mẫu SMS")
    @Operation(summary = "Danh sách loại biểu mẫu SMS", description = "Lấy danh sách loại biểu mẫu SMS từ enum SmsOutboxType")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Map<String, String>>>> getTemplateTypes() {
        List<Map<String, String>> result = Arrays.stream(SmsOutboxType.values())
            .map(t -> Map.of("value", t.name(), "label", t.getDescription()))
            .toList();
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", result));
    }

    @GetMapping(value = "/recipient-types", name = "Danh sách loại người nhận SMS")
    @Operation(summary = "Danh sách loại người nhận SMS", description = "Lấy danh sách loại người nhận từ enum SmsRecipientType")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<List<Map<String, String>>>> getRecipientTypes() {
        List<Map<String, String>> result = Arrays.stream(SmsRecipientType.values())
            .map(t -> Map.of("value", t.name(), "label", t.getDescription()))
            .toList();
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", result));
    }

    @GetMapping(value = "/{id}", name = "Chi tiết biểu mẫu SMS")
    @Operation(summary = "Chi tiết biểu mẫu SMS", description = "Lấy thông tin chi tiết biểu mẫu SMS theo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy")
    })
    public ResponseEntity<Response<SmsTemplate>> detail(
            @Parameter(description = "ID biểu mẫu SMS", required = true) @PathVariable Long id) {
        Optional<SmsTemplate> template = smsTemplateService.findById(id);
        if (template.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", template.get()));
    }

    @PostMapping(name = "Tạo biểu mẫu SMS")
    @Operation(summary = "Tạo biểu mẫu SMS", description = "Tạo mới biểu mẫu SMS")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<SmsTemplate>> create(@RequestBody SmsTemplate smsTemplate) {
        SmsTemplate created = smsTemplateService.create(smsTemplate);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", created));
    }

    @PutMapping(value = "/{id}", name = "Cập nhật biểu mẫu SMS")
    @Operation(summary = "Cập nhật biểu mẫu SMS", description = "Cập nhật biểu mẫu SMS")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<SmsTemplate>> update(
            @Parameter(description = "ID biểu mẫu SMS", required = true) @PathVariable Long id,
            @RequestBody SmsTemplate smsTemplate) {
        SmsTemplate updated = smsTemplateService.update(id, smsTemplate);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", updated));
    }

    @PatchMapping(value = "/{id}/active", name = "Cập nhật trạng thái active biểu mẫu SMS")
    @Operation(summary = "Cập nhật active", description = "Cập nhật trường active của biểu mẫu SMS")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<SmsTemplate>> updateActive(
            @Parameter(description = "ID biểu mẫu SMS", required = true) @PathVariable Long id,
            @RequestParam boolean active) {
        SmsTemplate updated = smsTemplateService.setActive(id, active);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", updated));
    }

    @DeleteMapping(value = "/{id}", name = "Xóa biểu mẫu SMS")
    @Operation(summary = "Xóa biểu mẫu SMS", description = "Xóa biểu mẫu SMS theo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực"),
        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<Response<Void>> delete(
            @Parameter(description = "ID biểu mẫu SMS", required = true) @PathVariable Long id) {
        smsTemplateService.delete(id);
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công"));
    }
}
