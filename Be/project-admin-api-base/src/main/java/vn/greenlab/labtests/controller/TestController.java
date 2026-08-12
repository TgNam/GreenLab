package vn.greenlab.labtests.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.greenlab.labtests.entity.Test;
import vn.greenlab.labtests.service.TestService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = "/tests", name = "Quản lý xét nghiệm")
public class TestController {

    @Autowired
    private TestService testService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "testCategoryId", required = false) Integer testCategoryId,
            @RequestParam(value = "specimenTypeId", required = false) Integer specimenTypeId,
            @RequestParam(value = "unitId", required = false) Integer unitId,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {
        
        if (page > 0) page = page - 1;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Test> result = testService.findAll(pageable, code, name, testCategoryId, specimenTypeId, unitId, isActive);
        
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
        return testService.findById(id)
                .map(t -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "Thành công");
                    response.put("data", t);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "Không tìm thấy xét nghiệm");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Test test) {
        try {
            Test created = testService.create(test);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo xét nghiệm thành công");
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
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id, @RequestBody Test test) {
        try {
            Test updated = testService.update(id, test);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật xét nghiệm thành công");
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
            testService.delete(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa xét nghiệm thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
