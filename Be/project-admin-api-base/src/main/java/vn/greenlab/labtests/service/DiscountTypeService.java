package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.DiscountTypeDTO;
import vn.greenlab.labtests.entity.DiscountType;
import vn.greenlab.labtests.repository.DiscountTypeRepository;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class DiscountTypeService {

    @Autowired
    private DiscountTypeRepository discountTypeRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<DiscountType> findAll(Pageable pageable, String code, String name) {
        return discountTypeRepository.findAllByFilters(code, name, pageable);
    }

    public Optional<DiscountType> findById(Integer id) {
        return discountTypeRepository.findById(id);
    }

    public Optional<DiscountType> findByCode(String code) {
        return discountTypeRepository.findByCode(code);
    }

    @Transactional
    public DiscountType create(DiscountType discountType) {
        if (discountType.getCode() == null || discountType.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã loại giảm giá là bắt buộc");
        }
        if (discountType.getName() == null || discountType.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên loại giảm giá là bắt buộc");
        }
        if (discountTypeRepository.existsByCode(discountType.getCode().trim())) {
            throw new RuntimeException("Mã loại giảm giá đã tồn tại");
        }
        discountType.setCode(discountType.getCode().trim().toUpperCase());
        discountType.setName(discountType.getName().trim());
        return discountTypeRepository.save(discountType);
    }

    @Transactional
    public DiscountType update(Integer id, DiscountType discountType) {
        DiscountType existing = discountTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại giảm giá"));

        if (discountType.getCode() == null || discountType.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã loại giảm giá là bắt buộc");
        }
        if (discountType.getName() == null || discountType.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên loại giảm giá là bắt buộc");
        }
        if (discountTypeRepository.existsByCodeAndIdNot(discountType.getCode().trim(), id)) {
            throw new RuntimeException("Mã loại giảm giá đã tồn tại");
        }

        existing.setCode(discountType.getCode().trim().toUpperCase());
        existing.setName(discountType.getName().trim());
        existing.setCalculationMethod(discountType.getCalculationMethod());
        return discountTypeRepository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        if (!discountTypeRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy loại giảm giá");
        }
        discountTypeRepository.deleteById(id);
    }

    public DiscountTypeDTO toDTO(DiscountType entity) {
        return DiscountTypeDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .calculationMethod(entity.getCalculationMethod() != null ? entity.getCalculationMethod().name() : null)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
