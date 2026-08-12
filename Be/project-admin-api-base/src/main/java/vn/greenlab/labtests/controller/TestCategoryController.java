package vn.greenlab.labtests.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.greenlab.labtests.dto.TestCategoryDTO;
import vn.greenlab.labtests.entity.TestCategory;
import vn.greenlab.labtests.service.TestCategoryService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = "/test-categories", name = "Quản lý loại xét nghiệm")
public class TestCategoryController {

    @Autowired
    private TestCategoryService testCategoryService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {
        
        if (page > 0) page = page - 1; // Convert to 0-based index
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<TestCategory> result = testCategoryService.findAll(pageable, code, name, isActive);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thành công");
        response.put("data", result.getContent());
        
        Map<String, Object> meta = new HashMap<>();
        meta.put("currentPage", result.getNumber() + 1);
        meta.put("totalPages", result.getTotalPages());
        meta.put("totalElements", result.getTotalElements());
        meta.put("size", result.getSize());
        response.put("meta", meta);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return testCategoryService.findById(id)
                .map(tc -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "Thành công");
                    response.put("data", tc);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "Không tìm thấy loại xét nghiệm");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody TestCategory testCategory) {
        try {
            TestCategory created = testCategoryService.create(testCategory);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo loại xét nghiệm thành công");
            response.put("data", created);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id, @RequestBody TestCategory testCategory) {
        try {
            TestCategory updated = testCategoryService.update(id, testCategory);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật loại xét nghiệm thành công");
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        try {
            testCategoryService.delete(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa loại xét nghiệm thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
