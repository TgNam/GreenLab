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
import vn.greenlab.model.Ward;
import vn.greenlab.model.output.WardOutput;
import vn.greenlab.repository.WardRepository;

@Service
public class WardService {

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

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

    public List<Ward> findAll() {
        return wardRepository.findAll(Sort.by("id").ascending());
    }

    private List<Ward> loadWardCache() {
        Optional<List<Ward>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.WARD_LIST, Ward.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Ward> list = wardRepository.findAll(Sort.by("id").ascending());
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.WARD_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    public List<Ward> findListWardOld() {
        Optional<List<Ward>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.WARD_LIST_OLD,
                Ward.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Ward> list = wardRepository.findListWardOld();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.WARD_LIST_OLD, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    public List<Ward> findListWardNew() {
        Optional<List<Ward>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.WARD_LIST, Ward.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Ward> list = wardRepository.findListWardNew();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.WARD_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    private void clearWardCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.WARD_LIST);
    }

    public List<Ward> getWardCache() {
        return loadWardCache();
    }

    public Page<Ward> findAll(Pageable pageable) {
        return wardRepository.findAll(pageable);
    }

    public Page<Ward> findAllWithFilters(Pageable pageable, String name, String id, Integer status, Integer districtId,
            Integer cityId, Integer wardType) {
        Integer idFilter = parseOptionalInt(id);
        return wardRepository.filterWards(
                idFilter,
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                status,
                districtId,
                cityId,
                wardType,
                pageable);
    }

    public Page<WardOutput> findAllWithFiltersWithNames(Pageable pageable, String name, Integer id, Integer status,
            Integer districtId, Integer cityIdOld, Integer cityIdNew, Integer wardType) {
        Integer idFilter = id;
        Page<Object[]> result = wardRepository.filterWardsWithNames(
                idFilter,
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                status,
                districtId,
                cityIdOld,
                cityIdNew,
                wardType,
                pageable);

        List<WardOutput> dtoList = result.getContent().stream()
                .map(row -> {
                    WardOutput dto = new WardOutput();
                    dto.setId(nativeInt(row[0]));
                    dto.setName((String) row[1]);
                    dto.setStatus(nativeInt(row[2]));
                    dto.setDistrict_id(nativeInt(row[3]));
                    dto.setCity_id(nativeInt(row[4]));
                    dto.setDistrict_name(row[5] != null ? (String) row[5] : "");
                    dto.setCity_name(row[6] != null ? (String) row[6] : "");
                    return dto;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, result.getTotalElements());
    }

    /**
     * Tìm phường/xã theo ID từ DB
     * @param id
     * @return
     */
    public Optional<Ward> findById(int id) {
        return wardRepository.findById(id);
    }

    /**
     * Tìm phường/xã theo ID từ cache
     * Nếu không tồn tại trong cache thì query DB và add vào cache
     * @param id
     * @return
     */
    public Ward findByIdFromCache(int id) {
        Optional<Ward> cached = redisCacheComponent.get(RedisCacheComponent.CacheKeys.WARD_LIST_ID_PREFIX + id,
                Ward.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        Ward ward = findById(id).orElse(null);
        if (ward != null) {
            redisCacheComponent.put(RedisCacheComponent.CacheKeys.WARD_LIST_ID_PREFIX + id, ward,
                    RedisCacheComponent.A_DAY * 30);
            return ward;
        }
        return null;
    }

    public List<Ward> findByDistrictId(int districtId) {
        return wardRepository.findByDistrictId(districtId);
    }

    /**
     * Tìm phường/xã theo city_id (map với tỉnh/thành phố).
     */
    public List<Ward> findByCityId(int cityId) {
        return wardRepository.findByCity_id(cityId);
    }

    public Ward create(Ward ward) {
        if (ward.getId() > 0 && wardRepository.findById(ward.getId()).isPresent()) {
            throw new RuntimeException("Mã phường/xã đã tồn tại");
        }
        Ward savedWard = wardRepository.save(ward);
        systemConfigService.incrementLocationVersion();
        clearWardCache();
        return savedWard;
    }

    public Ward update(Ward ward) {
        Ward savedWard = wardRepository.save(ward);
        systemConfigService.incrementLocationVersion();
        clearWardCache();
        return savedWard;
    }

    public void delete(int id) {
        wardRepository.deleteById(id);
        systemConfigService.incrementLocationVersion();
        clearWardCache();
    }

    public Optional<WardOutput> findWardOutputById(int id) {
        Pageable pageable = PageRequest.of(0, 1);
        Page<WardOutput> result = findAllWithFiltersWithNames(pageable, null, id, null, null, null, null, null);
        if (result.getContent().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(result.getContent().get(0));
    }

    /**
     * Tìm danh sách phường/xã chưa được map với city (city_id = 0).
     * Dùng cho việc map phường/xã mới với tỉnh/thành phố.
     */
    public List<Ward> findUnmappedWards() {
        return wardRepository.findUnmappedWards();
    }

    /**
     * Tìm danh sách phường/xã đã được map với city (city_id > 0).
     */
    public List<Ward> findMappedWards() {
        return wardRepository.findMappedWards();
    }

    /**
     * Map một phường/xã với tỉnh/thành phố.
     * Đặt city_id của phường/xã = cityId (cityId > 0).
     *
     * @param wardId id phường/xã cần map
     * @param cityId id tỉnh/thành phố để map vào
     * @return phường/xã đã được cập nhật
     * @throws RuntimeException nếu không tìm thấy phường/xã
     * @throws RuntimeException nếu cityId <= 0
     */
    public Ward mapWardToCity(int wardId, int cityId) {
        if (cityId <= 0) {
            throw new RuntimeException("ID tỉnh/thành phố phải lớn hơn 0");
        }

        Ward ward = wardRepository.findById(wardId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phường/xã với id: " + wardId));

        // Đặt city_id = cityId để map với tỉnh/thành phố mới
        ward.setCity_id(cityId);
        Ward savedWard = wardRepository.save(ward);

        systemConfigService.incrementLocationVersion();
        clearWardCache();

        return savedWard;
    }

    /**
     * Xóa map phường/xã khỏi tỉnh/thành phố.
     * Đặt city_id của phường/xã về 0.
     *
     * @param wardId id phường/xã cần xóa map
     * @return phường/xã đã được cập nhật
     * @throws RuntimeException nếu không tìm thấy phường/xã
     */
    public Ward unmapWardFromCity(int wardId) {
        Ward ward = wardRepository.findById(wardId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phường/xã với id: " + wardId));

        // Đặt city_id về 0 để xóa map
        ward.setCity_id(0);
        Ward savedWard = wardRepository.save(ward);

        systemConfigService.incrementLocationVersion();
        clearWardCache();

        return savedWard;
    }
}
