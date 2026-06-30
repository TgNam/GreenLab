package vn.greenlab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.Department;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.repository.DepartmentRepository;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    private List<Department> loadDepartmentCache() {
        Optional<List<Department>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.DEPARTMENT_LIST, Department.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Department> list = departmentRepository.findAll();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.DEPARTMENT_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    private void clearDepartmentCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.DEPARTMENT_LIST);
    }

    public List<Department> getDepartmentCache() {
        return loadDepartmentCache();
    }

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public Page<Department> findAll(Pageable pageable, Long id, LocalDateTime createTimeFrom,
            LocalDateTime createTimeTo,
            String name, String shortName, Boolean isActive, Integer timeType) {
        Integer status = null;
        if (isActive != null) {
            status = isActive ? 1 : 0;
        }

        return departmentRepository.findAllByFilters(id, createTimeFrom, createTimeTo,
                name, shortName, status, timeType, pageable);
    }

    public Optional<Department> findById(Long id) {
        return departmentRepository.findById(id);
    }

    public Department save(Department department) {
        return departmentRepository.save(department);
    }

    public Department create(Department department) {
        // Kiểm tra tên phòng ban bắt buộc
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên phòng ban là bắt buộc");
        }

        // Kiểm tra tên viết tắt bắt buộc
        if (department.getShort_name() == null || department.getShort_name().trim().isEmpty()) {
            throw new BadRequestException("Tên viết tắt là bắt buộc");
        }

        // Kiểm tra tên phòng ban đã tồn tại chưa
        List<Department> existingByName = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equalsIgnoreCase(department.getName().trim()))
                .toList();

        if (!existingByName.isEmpty()) {
            throw new BadRequestException("Tên phòng ban đã tồn tại");
        }

        // Kiểm tra tên viết tắt đã tồn tại chưa (case-insensitive)
        String trimmedShortName = department.getShort_name().trim();
        Optional<Department> existingByShortName = departmentRepository.findByShortNameIgnoreCase(trimmedShortName);
        if (existingByShortName.isPresent()) {
            throw new BadRequestException("Tên viết tắt đã tồn tại");
        }

        department.setName(department.getName().trim());
        department.setShort_name(trimmedShortName);
        department.setCreate_time(LocalDateTime.now());
        department.setUpdate_time(LocalDateTime.now());

        Department savedDepartment = departmentRepository.save(department);
        clearDepartmentCache();
        return savedDepartment;
    }

    public Department update(Long id, Department department) {
        Department existingDepartment = departmentRepository.findById(id)
                .orElseThrow(() -> new BadRequestException(ErrorCode.DEPARTMENT_NOT_FOUND));

        // Kiểm tra tên phòng ban bắt buộc
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên phòng ban là bắt buộc");
        }

        // Kiểm tra tên viết tắt bắt buộc
        if (department.getShort_name() == null || department.getShort_name().trim().isEmpty()) {
            throw new BadRequestException("Tên viết tắt là bắt buộc");
        }

        // Kiểm tra tên phòng ban đã tồn tại chưa (trừ phòng ban hiện tại)
        List<Department> existingByName = departmentRepository.findAll().stream()
                .filter(d -> d.getId() != id &&
                        d.getName().equalsIgnoreCase(department.getName().trim()))
                .toList();

        if (!existingByName.isEmpty()) {
            throw new BadRequestException("Tên phòng ban đã tồn tại");
        }

        // Kiểm tra tên viết tắt đã tồn tại chưa (trừ phòng ban hiện tại,
        // case-insensitive)
        String trimmedShortName = department.getShort_name().trim();
        Optional<Department> existingByShortName = departmentRepository
                .findByShortNameIgnoreCaseAndIdNot(trimmedShortName, id);

        if (existingByShortName.isPresent()) {
            throw new BadRequestException("Tên viết tắt đã tồn tại");
        }

        existingDepartment.setName(department.getName().trim());
        existingDepartment.setShort_name(trimmedShortName);
        existingDepartment.setStatus(department.getStatus());
        existingDepartment.setUpdate_time(LocalDateTime.now());

        Department updatedDepartment = departmentRepository.save(existingDepartment);
        clearDepartmentCache();
        return updatedDepartment;
    }

    // public void delete(Long id) {
    // Department department = departmentRepository.findById(id)
    // .orElseThrow(() -> new BadRequestException(ErrorCode.DEPARTMENT_NOT_FOUND));
    //
    // departmentRepository.delete(department);
    // }
}
