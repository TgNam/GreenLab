package vn.greenlab.labtests.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.greenlab.labtests.dto.UnitDTO;
import vn.greenlab.labtests.entity.Unit;
import vn.greenlab.labtests.repository.UnitRepository;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class UnitService {

    @Autowired
    private UnitRepository unitRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<Unit> findAll(Pageable pageable, String code, String name, Boolean isActive) {
        return unitRepository.findAllByFilters(code, name, isActive, pageable);
    }

    public Optional<Unit> findById(Integer id) {
        return unitRepository.findById(id);
    }

    public Optional<Unit> findByCode(String code) {
        return unitRepository.findByCode(code);
    }

    @Transactional
    public Unit create(Unit unit) {
        if (unit.getCode() == null || unit.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã đơn vị là bắt buộc");
        }
        if (unit.getName() == null || unit.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên đơn vị là bắt buộc");
        }
        if (unitRepository.existsByCode(unit.getCode().trim())) {
            throw new RuntimeException("Mã đơn vị đã tồn tại");
        }
        unit.setCode(unit.getCode().trim().toUpperCase());
        unit.setName(unit.getName().trim());
        unit.setIsActive(unit.getIsActive() != null ? unit.getIsActive() : true);
        return unitRepository.save(unit);
    }

    @Transactional
    public Unit update(Integer id, Unit unit) {
        Unit existing = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị"));

        if (unit.getCode() == null || unit.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã đơn vị là bắt buộc");
        }
        if (unit.getName() == null || unit.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên đơn vị là bắt buộc");
        }
        if (unitRepository.existsByCodeAndIdNot(unit.getCode().trim(), id)) {
            throw new RuntimeException("Mã đơn vị đã tồn tại");
        }

        existing.setCode(unit.getCode().trim().toUpperCase());
        existing.setName(unit.getName().trim());
        existing.setSymbol(unit.getSymbol());
        existing.setIsActive(unit.getIsActive());
        return unitRepository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        if (!unitRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy đơn vị");
        }
        unitRepository.deleteById(id);
    }

    public UnitDTO toDTO(Unit entity) {
        return UnitDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .symbol(entity.getSymbol())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
