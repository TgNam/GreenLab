package vn.greenlab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.SmsTemplate;
import vn.greenlab.model.enums.SmsOutboxType;
import vn.greenlab.model.input.sms_template.SmsTemplateSearch;
import vn.greenlab.repository.SmsTemplateRepository;
import vn.greenlab.utils.SearchParamValidator;

@Service
public class SmsTemplateService {

    @Autowired
    private SmsTemplateRepository smsTemplateRepository;

    public List<SmsTemplate> findAll() {
        return smsTemplateRepository.findAll();
    }

    public Page<SmsTemplate> search(SmsTemplateSearch searchInput) {
        int normalizedPage = searchInput.getPage() > 0 ? searchInput.getPage() - 1 : 0;
        int normalizedSize = searchInput.getSize() > 0 ? searchInput.getSize() : 50;
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize,
                Sort.by(Sort.Direction.DESC, "createTime"));
        LocalDateTime createTimeFrom = SearchParamValidator.convertLocalDateTime(searchInput.getFrom_time(), false);
        LocalDateTime createTimeTo = SearchParamValidator.convertLocalDateTime(searchInput.getTo_time(), true);
        return smsTemplateRepository.findAllByFilters(
                searchInput.getId(),
                createTimeFrom,
                createTimeTo,
                searchInput.getName(),
                searchInput.getType(),
                searchInput.getRecipientType(),
                searchInput.getActive(),
                pageable);
    }

    public Optional<SmsTemplate> findById(Long id) {
        return smsTemplateRepository.findById(id);
    }

    public SmsTemplate create(SmsTemplate smsTemplate) {
        validateRequired(smsTemplate);

        if (!smsTemplateRepository.findByTypeAndActive(smsTemplate.getType(), true).isEmpty()) {
            throw new BadRequestException("Biểu mẫu SMS cho loại này đã tồn tại");
        }

        smsTemplate.setName(smsTemplate.getName().trim());
        smsTemplate.setContent(smsTemplate.getContent().trim());
        smsTemplate.setCreateTime(LocalDateTime.now());
        smsTemplate.setUpdateTime(LocalDateTime.now());

        return smsTemplateRepository.save(smsTemplate);
    }

    public SmsTemplate update(Long id, SmsTemplate smsTemplate) {
        SmsTemplate existing = smsTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Biểu mẫu SMS không tồn tại"));

        validateRequired(smsTemplate);

        Optional<SmsTemplate> existingByName = smsTemplateRepository.findByName(smsTemplate.getName().trim());
        if (existingByName.isPresent() && existingByName.get().getId() != id) {
            throw new BadRequestException("Tên biểu mẫu SMS đã tồn tại");
        }

        existing.setName(smsTemplate.getName().trim());
        existing.setContent(smsTemplate.getContent().trim());
        existing.setType(smsTemplate.getType());
        existing.setRecipientType(smsTemplate.getRecipientType());
        existing.setUpdateTime(LocalDateTime.now());

        return smsTemplateRepository.save(existing);
    }

    public SmsTemplate setActive(Long id, boolean active) {
        SmsTemplate existing = smsTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Biểu mẫu SMS không tồn tại"));

        existing.setActive(active);
        existing.setUpdateTime(LocalDateTime.now());

        return smsTemplateRepository.save(existing);
    }

    public void delete(Long id) {
        SmsTemplate existing = smsTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Biểu mẫu SMS không tồn tại"));
        smsTemplateRepository.delete(existing);
    }

    public SmsTemplate getTemplate(SmsOutboxType type) {
        return smsTemplateRepository.findByTypeAndActive(type, true).stream().findFirst().orElse(null);
    }

    private void validateRequired(SmsTemplate smsTemplate) {
        if (smsTemplate.getName() == null || smsTemplate.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên biểu mẫu SMS là bắt buộc");
        }
        if (smsTemplate.getContent() == null || smsTemplate.getContent().trim().isEmpty()) {
            throw new BadRequestException("Nội dung biểu mẫu SMS là bắt buộc");
        }
        if (smsTemplate.getType() == null) {
            throw new BadRequestException("Loại biểu mẫu SMS là bắt buộc");
        }
        if (smsTemplate.getRecipientType() == null) {
            throw new BadRequestException("Loại người nhận là bắt buộc");
        }
    }
}
