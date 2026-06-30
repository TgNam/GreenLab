package vn.greenlab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.EmailTemplate;
import vn.greenlab.model.enums.EmailOutboxType;
import vn.greenlab.model.input.email_template.EmailTemplateSearch;
import vn.greenlab.repository.EmailTemplateRepository;
import vn.greenlab.utils.SearchParamValidator;

@Service
public class EmailTemplateService {

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    public List<EmailTemplate> findAll() {
        return emailTemplateRepository.findAll();
    }

    public Page<EmailTemplate> findAll(Pageable pageable, Long id, String createTimeFromStr, String createTimeToStr,
            String name, EmailOutboxType type, Boolean active) {
        LocalDateTime createTimeFrom = SearchParamValidator.convertLocalDateTime(createTimeFromStr, false);
        LocalDateTime createTimeTo = SearchParamValidator.convertLocalDateTime(createTimeToStr, true);
        return emailTemplateRepository.findAllByFilters(id, createTimeFrom, createTimeTo,
                name, type, active, pageable);
    }

    public Page<EmailTemplate> search(EmailTemplateSearch searchInput) {
        int normalizedPage = searchInput.getPage() > 0 ? searchInput.getPage() - 1 : 0;
        int normalizedSize = searchInput.getSize() > 0 ? searchInput.getSize() : 50;
        Pageable pageable = org.springframework.data.domain.PageRequest.of(normalizedPage, normalizedSize,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createTime"));
        LocalDateTime createTimeFrom = SearchParamValidator.convertLocalDateTime(searchInput.getFrom_time(), false);
        LocalDateTime createTimeTo = SearchParamValidator.convertLocalDateTime(searchInput.getTo_time(), true);
        return emailTemplateRepository.findAllByFilters(
                searchInput.getId(),
                createTimeFrom,
                createTimeTo,
                searchInput.getName(),
                searchInput.getType(),
                searchInput.getActive(),
                pageable);
    }

    public Optional<EmailTemplate> findById(Long id) {
        return emailTemplateRepository.findById(id);
    }

    public Optional<EmailTemplate> findByName(String name) {
        return emailTemplateRepository.findByName(name);
    }

    public List<EmailTemplate> findByActive(boolean active) {
        return emailTemplateRepository.findByActive(active);
    }

    public EmailTemplate save(EmailTemplate emailTemplate) {
        return emailTemplateRepository.save(emailTemplate);
    }

    public EmailTemplate create(EmailTemplate emailTemplate) {
        // Validate required fields
        if (emailTemplate.getName() == null || emailTemplate.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên mẫu email là bắt buộc");
        }

        if (emailTemplate.getContent() == null || emailTemplate.getContent().trim().isEmpty()) {
            throw new BadRequestException("Nội dung mẫu email là bắt buộc");
        }

        if (emailTemplate.getType() == null) {
            throw new BadRequestException("Mẫu email là bắt buộc");
        }

        // Check if name already exists
        if (emailTemplateRepository.findByTypeAndActive(emailTemplate.getType(), true).size() > 0) {
            throw new BadRequestException("Mẫu email đã tồn tại");
        }

        // Set timestamps
        emailTemplate.setName(emailTemplate.getName().trim());
        emailTemplate.setContent(emailTemplate.getContent().trim());
        emailTemplate.setCreateTime(LocalDateTime.now());
        emailTemplate.setUpdateTime(LocalDateTime.now());

        return emailTemplateRepository.save(emailTemplate);
    }

    public EmailTemplate update(Long id, EmailTemplate emailTemplate) {
        EmailTemplate existingTemplate = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Mẫu email không tồn tại"));

        // Validate required fields
        if (emailTemplate.getName() == null || emailTemplate.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên mẫu email là bắt buộc");
        }

        if (emailTemplate.getContent() == null || emailTemplate.getContent().trim().isEmpty()) {
            throw new BadRequestException("Nội dung mẫu email là bắt buộc");
        }

        if (emailTemplate.getType() == null) {
            throw new BadRequestException("Loại mẫu email là bắt buộc");
        }

        // Check if name already exists (excluding current template)
        Optional<EmailTemplate> existingByName = emailTemplateRepository.findByName(emailTemplate.getName().trim());
        if (existingByName.isPresent() && existingByName.get().getId() != id) {
            throw new BadRequestException("Tên mẫu email đã tồn tại");
        }

        // Update fields
        existingTemplate.setName(emailTemplate.getName().trim());
        existingTemplate.setContent(emailTemplate.getContent().trim());
        existingTemplate.setType(emailTemplate.getType());
        // existingTemplate.setActive(emailTemplate.isActive());
        existingTemplate.setUpdateTime(LocalDateTime.now());

        return emailTemplateRepository.save(existingTemplate);
    }

    public EmailTemplate toggleActive(Long id) {
        EmailTemplate existingTemplate = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Mẫu email không tồn tại"));

        existingTemplate.setActive(!existingTemplate.isActive());
        existingTemplate.setUpdateTime(LocalDateTime.now());

        return emailTemplateRepository.save(existingTemplate);
    }

    public EmailTemplate setActive(Long id, boolean active) {
        EmailTemplate existingTemplate = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Mẫu email không tồn tại"));

        existingTemplate.setActive(active);
        existingTemplate.setUpdateTime(LocalDateTime.now());

        return emailTemplateRepository.save(existingTemplate);
    }

    public void delete(Long id) {
        EmailTemplate existingTemplate = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Mẫu email không tồn tại"));

        emailTemplateRepository.delete(existingTemplate);
    }

    public EmailTemplate getTemplate(EmailOutboxType type) {
        return emailTemplateRepository.findByTypeAndActive(type, true).stream().findFirst().orElse(null);
    }
}