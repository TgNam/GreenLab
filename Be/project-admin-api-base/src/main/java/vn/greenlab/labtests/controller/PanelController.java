package vn.greenlab.labtests.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.greenlab.labtests.entity.Panel;
import vn.greenlab.labtests.entity.PanelTest;
import vn.greenlab.labtests.dto.PanelDTO;
import vn.greenlab.labtests.service.PanelService;
import vn.greenlab.labtests.service.PanelTestService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/panels", name = "Quản lý gói xét nghiệm")
public class PanelController {

    @Autowired
    private PanelService panelService;

    @Autowired
    private PanelTestService panelTestService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "panelCategoryId", required = false) Integer panelCategoryId) {
        
        if (page > 0) page = page - 1;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Panel> result = panelService.findAll(pageable, code, name, panelCategoryId);
        
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
        return panelService.findById(id)
                .map(p -> {
                    PanelDTO dto = panelService.toDTO(p);
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "Thành công");
                    response.put("data", dto);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "Không tìm thấy gói xét nghiệm");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @GetMapping("/{id}/tests")
    public ResponseEntity<Map<String, Object>> getTestsByPanelId(@PathVariable Integer id) {
        List<PanelTest> tests = panelTestService.findByPanelId(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thành công");
        response.put("data", tests);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Panel panel) {
        try {
            Panel created = panelService.create(panel);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo gói xét nghiệm thành công");
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
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id, @RequestBody Panel panel) {
        try {
            Panel updated = panelService.update(id, panel);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật gói xét nghiệm thành công");
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
            panelService.delete(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa gói xét nghiệm thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Panel-Test relationship endpoints
    @PostMapping("/{id}/tests")
    public ResponseEntity<Map<String, Object>> addTests(
            @PathVariable Integer id, 
            @RequestBody List<Integer> testIds) {
        try {
            panelTestService.addTestsToPanel(id, testIds);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Thêm xét nghiệm vào gói thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}/tests")
    public ResponseEntity<Map<String, Object>> removeTests(
            @PathVariable Integer id, 
            @RequestBody List<Integer> testIds) {
        try {
            panelTestService.removeTestsFromPanel(id, testIds);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa xét nghiệm khỏi gói thành công");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
