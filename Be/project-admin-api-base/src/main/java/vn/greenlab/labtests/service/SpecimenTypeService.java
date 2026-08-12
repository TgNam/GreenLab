package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.SpecimenTypeDTO;
import vn.greenlab.labtests.entity.SpecimenType;
import vn.greenlab.labtests.repository.SpecimenTypeRepository;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class SpecimenTypeService {

    @Autowired
    private SpecimenTypeRepository specimenTypeRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<SpecimenType> findAll(Pageable pageable, String code, String name, Boolean isActive) {
        return specimenTypeRepository.findAllByFilters(code, name, isActive, pageable);
    }

    public Optional<SpecimenType> findById(Integer id) {
        return specimenTypeRepository.findById(id);
    }

    public Optional<SpecimenType> findByCode(String code) {
        return specimenTypeRepository.findByCode(code);
    }

    @Transactional
    public SpecimenType create(SpecimenType specimenType) {
        if (specimenType.getCode() == null || specimenType.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã loại mẫu là bắt buộc");
        }
        if (specimenType.getName() == null || specimenType.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên loại mẫu là bắt buộc");
        }
        if (specimenTypeRepository.existsByCode(specimenType.getCode().trim())) {
            throw new RuntimeException("Mã loại mẫu đã tồn tại");
        }
        specimenType.setCode(specimenType.getCode().trim().toUpperCase());
        specimenType.setName(specimenType.getName().trim());
        specimenType.setIsActive(specimenType.getIsActive() != null ? specimenType.getIsActive() : true);
        return specimenTypeRepository.save(specimenType);
    }

    @Transactional
    public SpecimenType update(Integer id, SpecimenType specimenType) {
        SpecimenType existing = specimenTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại mẫu"));

        if (specimenType.getCode() == null || specimenType.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã loại mẫu là bắt buộc");
        }
        if (specimenType.getName() == null || specimenType.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên loại mẫu là bắt buộc");
        }
        if (specimenTypeRepository.existsByCodeAndIdNot(specimenType.getCode().trim(), id)) {
            throw new RuntimeException("Mã loại mẫu đã tồn tại");
        }

        existing.setCode(specimenType.getCode().trim().toUpperCase());
        existing.setName(specimenType.getName().trim());
        existing.setDescription(specimenType.getDescription());
        existing.setPreparationInstruction(specimenType.getPreparationInstruction());
        existing.setStorageRequirement(specimenType.getStorageRequirement());
        existing.setIsActive(specimenType.getIsActive());
        return specimenTypeRepository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        if (!specimenTypeRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy loại mẫu");
        }
        specimenTypeRepository.deleteById(id);
    }

    public SpecimenTypeDTO toDTO(SpecimenType entity) {
        return SpecimenTypeDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .preparationInstruction(entity.getPreparationInstruction())
                .storageRequirement(entity.getStorageRequirement())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
