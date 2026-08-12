package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.PanelDTO;
import vn.greenlab.labtests.dto.TestDTO;
import vn.greenlab.labtests.entity.Panel;
import vn.greenlab.labtests.entity.PanelTest;
import vn.greenlab.labtests.entity.Test;
import vn.greenlab.labtests.repository.PanelRepository;
import vn.greenlab.labtests.repository.PanelTestRepository;
import vn.greenlab.labtests.repository.TestRepository;
import vn.greenlab.labtests.repository.PanelCategoryRepository;
import vn.greenlab.labtests.repository.DiscountTypeRepository;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PanelService {

    @Autowired
    private PanelRepository panelRepository;

    @Autowired
    private PanelTestRepository panelTestRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private PanelCategoryRepository panelCategoryRepository;

    @Autowired
    private DiscountTypeRepository discountTypeRepository;

    @Autowired
    private TestService testService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<Panel> findAll(Pageable pageable, String code, String name, Integer panelCategoryId) {
        return panelRepository.findAllByFilters(code, name, panelCategoryId, pageable);
    }

    public Optional<Panel> findById(Integer id) {
        return panelRepository.findById(id);
    }

    public Optional<Panel> findByCode(String code) {
        return panelRepository.findByCode(code);
    }

    public List<PanelTest> findTestsByPanelId(Integer panelId) {
        return panelTestRepository.findByPanelId(panelId);
    }

    @Transactional
    public Panel create(Panel panel) {
        if (panel.getCode() == null || panel.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã gói xét nghiệm là bắt buộc");
        }
        if (panel.getName() == null || panel.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên gói xét nghiệm là bắt buộc");
        }
        if (panel.getPanelCategoryId() == null) {
            throw new RuntimeException("Danh mục gói là bắt buộc");
        }
        if (panelRepository.existsByCode(panel.getCode().trim())) {
            throw new RuntimeException("Mã gói xét nghiệm đã tồn tại");
        }
        
        panel.setCode(panel.getCode().trim().toUpperCase());
        panel.setName(panel.getName().trim());
        panel.setShortDescription(panel.getShortDescription() != null ? panel.getShortDescription().trim() : null);
        
        // Tính giá bán
        calculatePrices(panel);
        
        return panelRepository.save(panel);
    }

    @Transactional
    public Panel update(Integer id, Panel panel) {
        Panel existing = panelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói xét nghiệm"));

        if (panel.getCode() == null || panel.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã gói xét nghiệm là bắt buộc");
        }
        if (panel.getName() == null || panel.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên gói xét nghiệm là bắt buộc");
        }
        if (panel.getPanelCategoryId() == null) {
            throw new RuntimeException("Danh mục gói là bắt buộc");
        }
        if (panelRepository.existsByCodeAndIdNot(panel.getCode().trim(), id)) {
            throw new RuntimeException("Mã gói xét nghiệm đã tồn tại");
        }

        existing.setCode(panel.getCode().trim().toUpperCase());
        existing.setName(panel.getName().trim());
        existing.setShortDescription(panel.getShortDescription() != null ? panel.getShortDescription().trim() : null);
        existing.setPanelCategoryId(panel.getPanelCategoryId());
        existing.setDiscountTypeId(panel.getDiscountTypeId());
        existing.setOriginalPrice(panel.getOriginalPrice());
        existing.setDiscountValue(panel.getDiscountValue());
        
        // Tính giá bán
        calculatePrices(existing);
        
        return panelRepository.save(existing);
    }

    private void calculatePrices(Panel panel) {
        // Nếu có discountType và discountValue thì tính giá giảm
        if (panel.getDiscountTypeId() != null && panel.getDiscountValue() != null) {
            BigDecimal originalPrice = panel.getOriginalPrice() != null ? panel.getOriginalPrice() : BigDecimal.ZERO;
            
            discountTypeRepository.findById(panel.getDiscountTypeId()).ifPresent(discountType -> {
                BigDecimal discountAmount;
                if (discountType.getCalculationMethod() == vn.greenlab.labtests.entity.DiscountType.CalculationMethod.PERCENTAGE) {
                    // Giảm theo %
                    discountAmount = originalPrice.multiply(panel.getDiscountValue()).divide(BigDecimal.valueOf(100));
                } else {
                    // Giảm cố định
                    discountAmount = panel.getDiscountValue();
                }
                panel.setDiscountAmount(discountAmount);
                panel.setSellingPrice(originalPrice.subtract(discountAmount));
            });
        } else {
            // Không có giảm giá
            panel.setSellingPrice(panel.getOriginalPrice());
            panel.setDiscountAmount(BigDecimal.ZERO);
        }
    }

    @Transactional
    public void updateTestCount(Integer panelId) {
        Integer count = panelTestRepository.countByPanelId(panelId);
        panelRepository.updateTestCount(panelId, count);
    }

    @Transactional
    public void delete(Integer id) {
        if (!panelRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy gói xét nghiệm");
        }
        // Xóa các liên kết trước
        panelTestRepository.deleteByPanelId(id);
        panelRepository.deleteById(id);
    }

    public PanelDTO toDTO(Panel entity) {
        PanelDTO.PanelDTOBuilder builder = PanelDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .shortDescription(entity.getShortDescription())
                .panelCategoryId(entity.getPanelCategoryId())
                .discountTypeId(entity.getDiscountTypeId())
                .testCount(entity.getTestCount())
                .originalPrice(entity.getOriginalPrice())
                .sellingPrice(entity.getSellingPrice())
                .discountAmount(entity.getDiscountAmount())
                .discountValue(entity.getDiscountValue())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATE_FORMATTER) : null);

        if (entity.getPanelCategory() != null) {
            builder.panelCategoryName(entity.getPanelCategory().getName());
        } else if (entity.getPanelCategoryId() != null) {
            panelCategoryRepository.findById(entity.getPanelCategoryId())
                    .ifPresent(cat -> builder.panelCategoryName(cat.getName()));
        }

        if (entity.getDiscountType() != null) {
            builder.discountTypeName(entity.getDiscountType().getName());
        } else if (entity.getDiscountTypeId() != null) {
            discountTypeRepository.findById(entity.getDiscountTypeId())
                    .ifPresent(dt -> builder.discountTypeName(dt.getName()));
        }

        // Lấy danh sách tests
        List<TestDTO> tests = panelTestRepository.findByPanelId(entity.getId())
                .stream()
                .map(pt -> {
                    TestDTO dto = new TestDTO();
                    dto.setId(pt.getTestId());
                    dto.setIsPrimary(pt.getIsPrimary());
                    dto.setCreatedAt(pt.getCreatedAt() != null ? pt.getCreatedAt().format(DATE_FORMATTER) : null);
                    testRepository.findById(pt.getTestId()).ifPresent(test -> {
                        dto.setCode(test.getCode());
                        dto.setName(test.getName());
                        dto.setPrice(test.getPrice());
                    });
                    return dto;
                })
                .collect(Collectors.toList());
        builder.tests(tests);

        return builder.build();
    }
}
