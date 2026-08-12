package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.TestCategoryDTO;
import vn.greenlab.labtests.entity.TestCategory;
import vn.greenlab.labtests.repository.TestCategoryRepository;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class TestCategoryService {

    @Autowired
    private TestCategoryRepository testCategoryRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<TestCategory> findAll(Pageable pageable, String code, String name, Boolean isActive) {
        return testCategoryRepository.findAllByFilters(code, name, isActive, pageable);
    }

    public Optional<TestCategory> findById(Integer id) {
        return testCategoryRepository.findById(id);
    }

    public Optional<TestCategory> findByCode(String code) {
        return testCategoryRepository.findByCode(code);
    }

    @Transactional
    public TestCategory create(TestCategory testCategory) {
        if (testCategory.getCode() == null || testCategory.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã loại xét nghiệm là bắt buộc");
        }
        if (testCategory.getName() == null || testCategory.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên loại xét nghiệm là bắt buộc");
        }
        if (testCategoryRepository.existsByCode(testCategory.getCode().trim())) {
            throw new RuntimeException("Mã loại xét nghiệm đã tồn tại");
        }
        testCategory.setCode(testCategory.getCode().trim().toUpperCase());
        testCategory.setName(testCategory.getName().trim());
        testCategory.setIsActive(testCategory.getIsActive() != null ? testCategory.getIsActive() : true);
        return testCategoryRepository.save(testCategory);
    }

    @Transactional
    public TestCategory update(Integer id, TestCategory testCategory) {
        TestCategory existing = testCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại xét nghiệm"));

        if (testCategory.getCode() == null || testCategory.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã loại xét nghiệm là bắt buộc");
        }
        if (testCategory.getName() == null || testCategory.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên loại xét nghiệm là bắt buộc");
        }
        if (testCategoryRepository.existsByCodeAndIdNot(testCategory.getCode().trim(), id)) {
            throw new RuntimeException("Mã loại xét nghiệm đã tồn tại");
        }

        existing.setCode(testCategory.getCode().trim().toUpperCase());
        existing.setName(testCategory.getName().trim());
        existing.setDescription(testCategory.getDescription());
        existing.setIsActive(testCategory.getIsActive());
        return testCategoryRepository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        if (!testCategoryRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy loại xét nghiệm");
        }
        testCategoryRepository.deleteById(id);
    }

    public TestCategoryDTO toDTO(TestCategory entity) {
        return TestCategoryDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
