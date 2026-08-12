package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.PanelCategoryDTO;
import vn.greenlab.labtests.entity.PanelCategory;
import vn.greenlab.labtests.repository.PanelCategoryRepository;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class PanelCategoryService {

    @Autowired
    private PanelCategoryRepository panelCategoryRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<PanelCategory> findAll(Pageable pageable, String code, String name, Boolean isActive, Boolean isFeatured) {
        return panelCategoryRepository.findAllByFilters(code, name, isActive, isFeatured, pageable);
    }

    public Optional<PanelCategory> findById(Integer id) {
        return panelCategoryRepository.findById(id);
    }

    public Optional<PanelCategory> findByCode(String code) {
        return panelCategoryRepository.findByCode(code);
    }

    public Optional<PanelCategory> findBySlug(String slug) {
        return panelCategoryRepository.findBySlug(slug);
    }

    @Transactional
    public PanelCategory create(PanelCategory panelCategory) {
        if (panelCategory.getCode() == null || panelCategory.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã danh mục gói là bắt buộc");
        }
        if (panelCategory.getName() == null || panelCategory.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên danh mục gói là bắt buộc");
        }
        if (panelCategory.getSlug() == null || panelCategory.getSlug().trim().isEmpty()) {
            throw new RuntimeException("Slug là bắt buộc");
        }
        if (panelCategoryRepository.existsByCode(panelCategory.getCode().trim())) {
            throw new RuntimeException("Mã danh mục gói đã tồn tại");
        }
        if (panelCategoryRepository.existsBySlug(panelCategory.getSlug().trim())) {
            throw new RuntimeException("Slug đã tồn tại");
        }
        
        panelCategory.setCode(panelCategory.getCode().trim().toUpperCase());
        panelCategory.setName(panelCategory.getName().trim());
        panelCategory.setSlug(panelCategory.getSlug().trim().toLowerCase());
        panelCategory.setIsActive(panelCategory.getIsActive() != null ? panelCategory.getIsActive() : true);
        panelCategory.setIsFeatured(panelCategory.getIsFeatured() != null ? panelCategory.getIsFeatured() : false);
        panelCategory.setDisplayOrder(panelCategory.getDisplayOrder() != null ? panelCategory.getDisplayOrder() : 0);
        return panelCategoryRepository.save(panelCategory);
    }

    @Transactional
    public PanelCategory update(Integer id, PanelCategory panelCategory) {
        PanelCategory existing = panelCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục gói"));

        if (panelCategory.getCode() == null || panelCategory.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã danh mục gói là bắt buộc");
        }
        if (panelCategory.getName() == null || panelCategory.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên danh mục gói là bắt buộc");
        }
        if (panelCategory.getSlug() == null || panelCategory.getSlug().trim().isEmpty()) {
            throw new RuntimeException("Slug là bắt buộc");
        }
        if (panelCategoryRepository.existsByCodeAndIdNot(panelCategory.getCode().trim(), id)) {
            throw new RuntimeException("Mã danh mục gói đã tồn tại");
        }
        if (panelCategoryRepository.existsBySlugAndIdNot(panelCategory.getSlug().trim(), id)) {
            throw new RuntimeException("Slug đã tồn tại");
        }

        existing.setCode(panelCategory.getCode().trim().toUpperCase());
        existing.setName(panelCategory.getName().trim());
        existing.setSlug(panelCategory.getSlug().trim().toLowerCase());
        existing.setDescription(panelCategory.getDescription());
        existing.setImageUrl(panelCategory.getImageUrl());
        existing.setDisplayOrder(panelCategory.getDisplayOrder());
        existing.setIsFeatured(panelCategory.getIsFeatured());
        existing.setIsActive(panelCategory.getIsActive());
        return panelCategoryRepository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        if (!panelCategoryRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy danh mục gói");
        }
        panelCategoryRepository.deleteById(id);
    }

    public PanelCategoryDTO toDTO(PanelCategory entity) {
        return PanelCategoryDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .displayOrder(entity.getDisplayOrder())
                .isFeatured(entity.getIsFeatured())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
