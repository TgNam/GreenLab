package vn.greenlab.labtests.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.greenlab.labtests.entity.SpecimenType;
import vn.greenlab.labtests.service.SpecimenTypeService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = "/specimen-types", name = "Quản lý loại mẫu xét nghiệm")
public class SpecimenTypeController {

    @Autowired
    private SpecimenTypeService specimenTypeService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {
        
        if (page > 0) page = page - 1;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<SpecimenType> result = specimenTypeService.findAll(pageable, code, name, isActive);
        
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
        return specimenTypeService.findById(id)
                .map(st -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "Thành công");
                    response.put("data", st);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "Không tìm thấy loại mẫu");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody SpecimenType specimenType) {
        try {
            SpecimenType created = specimenTypeService.create(specimenType);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo loại mẫu thành công");
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
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id, @RequestBody SpecimenType specimenType) {
        try {
            SpecimenType updated = specimenTypeService.update(id, specimenType);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật loại mẫu thành công");
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
            specimenTypeService.delete(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa loại mẫu thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
