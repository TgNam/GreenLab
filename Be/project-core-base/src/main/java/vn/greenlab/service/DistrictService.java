package vn.greenlab.service;

import java.util.List;

import java.util.Optional;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.PageImpl;

import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Pageable;

import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;

import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.model.District;

import vn.greenlab.model.output.DistrictOutput;

import vn.greenlab.repository.DistrictRepository;

@Service

public class DistrictService {

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    private List<District> loadDistrictCache() {
        Optional<List<District>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.DISTRICT_LIST, District.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<District> list = findAll();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.DISTRICT_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    private void clearDistrictCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.DISTRICT_LIST);
    }

    public List<District> getDistrictCache() {
        return loadDistrictCache();
    }

    private static Integer parseOptionalInt(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return null;
        }

    }

    /**
     * Native SQL row values are not always {@link Number} (e.g. MySQL may return
     * {@link String} for numeric columns).
     */
    private static int nativeInt(Object o) {
        if (o == null) {
            return 0;
        }
        if (o instanceof Number n) {
            return n.intValue();
        }
        if (o instanceof Boolean b) {
            return b ? 1 : 0;
        }
        if (o instanceof String s) {
            String t = s.trim();
            if (t.isEmpty()) {
                return 0;
            }
            return Integer.parseInt(t);
        }
        throw new IllegalArgumentException("Cannot convert to int: " + o.getClass().getName());
    }

    public List<District> findAll() {
        return districtRepository.findAll(Sort.by("id").ascending());
    }

    public Page<District> findAll(Pageable pageable) {
        return districtRepository.findAll(pageable);
    }

    public Page<District> findAllWithFilters(Pageable pageable, String name, Integer id, Integer status,
            Integer cityId) {
        Integer idFilter = (id);
        Integer cityNum = (cityId);
        int cityIdParam = cityNum != null ? cityNum : 0;
        return districtRepository.filterDistricts(
                idFilter,
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                status,
                cityIdParam,
                pageable);
    }

    public Page<DistrictOutput> findAllWithFiltersWithCityName(Pageable pageable, String name, Integer id,
            Integer status, Integer cityId) {
        Integer idFilter = id;
        Integer cityFilter = cityId;
        Page<Object[]> result = districtRepository.filterDistrictsWithCityName(
                idFilter,
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                status,
                cityFilter,
                pageable);

        List<DistrictOutput> dtoList = result.getContent().stream()
                .map(row -> {
                    DistrictOutput dto = new DistrictOutput();
                    dto.setId(nativeInt(row[0]));
                    dto.setName((String) row[1]);
                    dto.setStatus(nativeInt(row[2]));
                    dto.setCity_id(nativeInt(row[3]));
                    dto.setCity_name(row[4] != null ? (String) row[4] : "");
                    return dto;
                })
                .collect(Collectors.toList());
        return new PageImpl<>(dtoList, pageable, result.getTotalElements());
    }

    public Optional<District> findById(int id) {
        return districtRepository.findById(id);
    }

    public Optional<District> findByIdAndCityId(int id, int cityId) {
        return districtRepository.findByIdAndCityId(id, cityId);
    }

    public List<District> findByCityId(int cityId) {
        return districtRepository.findByCityId(cityId);
    }

    public List<District> findByName(String cityId, String districtName) {
        int cityIdInt = 0;
        if (cityId != null && !cityId.trim().isEmpty()) {
            Integer p = parseOptionalInt(cityId);
            cityIdInt = p != null ? p : 0;
        }
        return districtRepository.findByCityIdAndDistrictName(cityIdInt, districtName);
    }

    public District create(District district) {
        if (district.getId() > 0 &&
                districtRepository.findById(district.getId()).isPresent()) {
            throw new RuntimeException("Mã quận/huyện đã tồn tại");
        }
        District savedDistrict = districtRepository.save(district);
        systemConfigService.incrementLocationVersion();
        clearDistrictCache();
        return savedDistrict;
    }

    public District update(District district) {
        District savedDistrict = districtRepository.save(district);
        systemConfigService.incrementLocationVersion();
        clearDistrictCache();
        return savedDistrict;
    }

    public void delete(int id) {
        districtRepository.deleteById(id);
        systemConfigService.incrementLocationVersion();
        clearDistrictCache();
    }

    public Page<DistrictOutput> searchDistricts(Pageable pageable, String searchText, String cityId) {
        Integer cityFilter = parseOptionalInt(cityId);
        Page<Object[]> result = districtRepository.searchDistrictsByText(searchText, cityFilter, pageable);
        List<DistrictOutput> dtoList = result.getContent().stream()
                .map(row -> {
                    DistrictOutput dto = new DistrictOutput();
                    dto.setId(nativeInt(row[0]));
                    dto.setName((String) row[1]);
                    dto.setStatus(nativeInt(row[2]));
                    dto.setCity_id(nativeInt(row[3]));
                    dto.setCity_name(row[4] != null ? (String) row[4] : "");
                    return dto;
                })
                .collect(Collectors.toList());
        return new PageImpl<>(dtoList, pageable, result.getTotalElements());
    }

    public Optional<DistrictOutput> findDistrictOutputById(int id) {
        Pageable pageable = PageRequest.of(0, 1);
        Page<DistrictOutput> result = findAllWithFiltersWithCityName(pageable, null, id, null, null);
        if (result.getContent().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(result.getContent().get(0));
    }
}