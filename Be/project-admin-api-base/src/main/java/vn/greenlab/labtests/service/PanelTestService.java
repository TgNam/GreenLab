package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.PanelTestDTO;
import vn.greenlab.labtests.entity.PanelTest;
import vn.greenlab.labtests.repository.PanelTestRepository;
import vn.greenlab.labtests.repository.TestRepository;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PanelTestService {

    @Autowired
    private PanelTestRepository panelTestRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private PanelService panelService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<PanelTest> findByPanelId(Integer panelId) {
        return panelTestRepository.findByPanelId(panelId);
    }

    public List<PanelTest> findByTestId(Integer testId) {
        return panelTestRepository.findByTestId(testId);
    }

    public Optional<PanelTest> findById(Integer id) {
        return panelTestRepository.findById(id);
    }

    @Transactional
    public PanelTest create(PanelTest panelTest) {
        if (panelTest.getPanelId() == null) {
            throw new RuntimeException("ID gói xét nghiệm là bắt buộc");
        }
        if (panelTest.getTestId() == null) {
            throw new RuntimeException("ID xét nghiệm là bắt buộc");
        }
        if (panelTestRepository.existsByPanelIdAndTestId(panelTest.getPanelId(), panelTest.getTestId())) {
            throw new RuntimeException("Xét nghiệm đã tồn tại trong gói");
        }
        
        panelTest.setIsPrimary(panelTest.getIsPrimary() != null ? panelTest.getIsPrimary() : false);
        PanelTest saved = panelTestRepository.save(panelTest);
        
        // Cập nhật số lượng xét nghiệm trong gói
        panelService.updateTestCount(panelTest.getPanelId());
        
        return saved;
    }

    @Transactional
    public PanelTest update(Integer id, PanelTest panelTest) {
        PanelTest existing = panelTestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy liên kết"));

        existing.setIsPrimary(panelTest.getIsPrimary());
        PanelTest saved = panelTestRepository.save(existing);
        
        // Cập nhật số lượng xét nghiệm trong gói
        panelService.updateTestCount(existing.getPanelId());
        
        return saved;
    }

    @Transactional
    public void delete(Integer id) {
        PanelTest panelTest = panelTestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy liên kết"));
        
        Integer panelId = panelTest.getPanelId();
        panelTestRepository.deleteById(id);
        
        // Cập nhật số lượng xét nghiệm trong gói
        panelService.updateTestCount(panelId);
    }

    @Transactional
    public void addTestsToPanel(Integer panelId, List<Integer> testIds) {
        for (Integer testId : testIds) {
            if (!panelTestRepository.existsByPanelIdAndTestId(panelId, testId)) {
                PanelTest panelTest = new PanelTest();
                panelTest.setPanelId(panelId);
                panelTest.setTestId(testId);
                panelTest.setIsPrimary(false);
                panelTestRepository.save(panelTest);
            }
        }
        // Cập nhật số lượng xét nghiệm trong gói
        panelService.updateTestCount(panelId);
    }

    @Transactional
    public void removeTestsFromPanel(Integer panelId, List<Integer> testIds) {
        for (Integer testId : testIds) {
            panelTestRepository.findByPanelIdAndTestId(panelId, testId)
                    .ifPresent(panelTest -> panelTestRepository.deleteById(panelTest.getId()));
        }
        // Cập nhật số lượng xét nghiệm trong gói
        panelService.updateTestCount(panelId);
    }

    public PanelTestDTO toDTO(PanelTest entity) {
        PanelTestDTO.PanelTestDTOBuilder builder = PanelTestDTO.builder()
                .id(entity.getId())
                .panelId(entity.getPanelId())
                .testId(entity.getTestId())
                .isPrimary(entity.getIsPrimary())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null);

        if (entity.getTest() != null) {
            builder.testCode(entity.getTest().getCode())
                   .testName(entity.getTest().getName());
        } else if (entity.getTestId() != null) {
            testRepository.findById(entity.getTestId())
                    .ifPresent(test -> {
                        builder.testCode(test.getCode());
                        builder.testName(test.getName());
                    });
        }

        return builder.build();
    }
}
