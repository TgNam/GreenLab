package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.TestDTO;
import vn.greenlab.labtests.entity.Test;
import vn.greenlab.labtests.entity.SpecimenType;
import vn.greenlab.labtests.entity.TestCategory;
import vn.greenlab.labtests.entity.Unit;
import vn.greenlab.labtests.repository.TestRepository;
import vn.greenlab.labtests.repository.SpecimenTypeRepository;
import vn.greenlab.labtests.repository.TestCategoryRepository;
import vn.greenlab.labtests.repository.UnitRepository;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class TestService {

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private TestCategoryRepository testCategoryRepository;

    @Autowired
    private SpecimenTypeRepository specimenTypeRepository;

    @Autowired
    private UnitRepository unitRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<Test> findAll(Pageable pageable, String code, String name, Integer testCategoryId, 
                              Integer specimenTypeId, Integer unitId, Boolean isActive) {
        return testRepository.findAllByFilters(code, name, testCategoryId, specimenTypeId, unitId, isActive, pageable);
    }

    public Optional<Test> findById(Integer id) {
        return testRepository.findById(id);
    }

    public Optional<Test> findByCode(String code) {
        return testRepository.findByCode(code);
    }

    @Transactional
    public Test create(Test test) {
        if (test.getCode() == null || test.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã xét nghiệm là bắt buộc");
        }
        if (test.getName() == null || test.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên xét nghiệm là bắt buộc");
        }
        if (test.getTestCategoryId() == null) {
            throw new RuntimeException("Loại xét nghiệm là bắt buộc");
        }
        if (test.getSpecimenTypeId() == null) {
            throw new RuntimeException("Loại mẫu là bắt buộc");
        }
        if (test.getUnitId() == null) {
            throw new RuntimeException("Đơn vị là bắt buộc");
        }
        if (testRepository.existsByCode(test.getCode().trim())) {
            throw new RuntimeException("Mã xét nghiệm đã tồn tại");
        }
        
        test.setCode(test.getCode().trim().toUpperCase());
        test.setName(test.getName().trim());
        test.setShortName(test.getShortName() != null ? test.getShortName().trim() : null);
        test.setIsActive(test.getIsActive() != null ? test.getIsActive() : true);
        return testRepository.save(test);
    }

    @Transactional
    public Test update(Integer id, Test test) {
        Test existing = testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xét nghiệm"));

        if (test.getCode() == null || test.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã xét nghiệm là bắt buộc");
        }
        if (test.getName() == null || test.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên xét nghiệm là bắt buộc");
        }
        if (test.getTestCategoryId() == null) {
            throw new RuntimeException("Loại xét nghiệm là bắt buộc");
        }
        if (test.getSpecimenTypeId() == null) {
            throw new RuntimeException("Loại mẫu là bắt buộc");
        }
        if (test.getUnitId() == null) {
            throw new RuntimeException("Đơn vị là bắt buộc");
        }
        if (testRepository.existsByCodeAndIdNot(test.getCode().trim(), id)) {
            throw new RuntimeException("Mã xét nghiệm đã tồn tại");
        }

        existing.setCode(test.getCode().trim().toUpperCase());
        existing.setName(test.getName().trim());
        existing.setShortName(test.getShortName() != null ? test.getShortName().trim() : null);
        existing.setDescription(test.getDescription());
        existing.setMethod(test.getMethod());
        existing.setTestCategoryId(test.getTestCategoryId());
        existing.setSpecimenTypeId(test.getSpecimenTypeId());
        existing.setUnitId(test.getUnitId());
        existing.setNormalValueMin(test.getNormalValueMin());
        existing.setNormalValueMax(test.getNormalValueMax());
        existing.setNormalValueText(test.getNormalValueText());
        existing.setPrice(test.getPrice());
        existing.setIsActive(test.getIsActive());
        return testRepository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        if (!testRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy xét nghiệm");
        }
        testRepository.deleteById(id);
    }

    public TestDTO toDTO(Test entity) {
        TestDTO.TestDTOBuilder builder = TestDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .shortName(entity.getShortName())
                .description(entity.getDescription())
                .method(entity.getMethod())
                .testCategoryId(entity.getTestCategoryId())
                .specimenTypeId(entity.getSpecimenTypeId())
                .unitId(entity.getUnitId())
                .normalValueMin(entity.getNormalValueMin())
                .normalValueMax(entity.getNormalValueMax())
                .normalValueText(entity.getNormalValueText())
                .price(entity.getPrice())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATE_FORMATTER) : null);

        if (entity.getTestCategory() != null) {
            builder.testCategoryName(entity.getTestCategory().getName());
        } else if (entity.getTestCategoryId() != null) {
            testCategoryRepository.findById(entity.getTestCategoryId())
                    .ifPresent(cat -> builder.testCategoryName(cat.getName()));
        }

        if (entity.getSpecimenType() != null) {
            builder.specimenTypeName(entity.getSpecimenType().getName());
        } else if (entity.getSpecimenTypeId() != null) {
            specimenTypeRepository.findById(entity.getSpecimenTypeId())
                    .ifPresent(spec -> builder.specimenTypeName(spec.getName()));
        }

        if (entity.getUnit() != null) {
            builder.unitName(entity.getUnit().getName())
                   .unitSymbol(entity.getUnit().getSymbol());
        } else if (entity.getUnitId() != null) {
            unitRepository.findById(entity.getUnitId())
                    .ifPresent(unit -> builder.unitName(unit.getName()).unitSymbol(unit.getSymbol()));
        }

        return builder.build();
    }
}
