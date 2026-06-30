package vn.greenlab.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.model.Area;
import vn.greenlab.repository.AreaRepository;

@Service
public class AreaService {

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    private List<Area> loadAreaCache() {
        Optional<List<Area>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.AREA, Area.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<Area> list = findAllActive();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.AREA, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    public List<Area> getAreaCache() {
        return loadAreaCache();
    }

    private void clearAreaCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.AREA);
    }

    public List<Area> findAll() {
        return areaRepository.findAll(Sort.by("id").ascending());
    }

    public List<Area> findAllActive() {
        return areaRepository.findAllActive();
    }

    public Page<Area> findAll(Pageable pageable) {
        return areaRepository.findAll(pageable);
    }

    public Optional<Area> findById(Long id) {
        return areaRepository.findById(id);
    }

    public Optional<Area> findByCode(String code) {
        return areaRepository.findByCode(code);
    }

    public Area create(Area area) {
        Area savedArea = areaRepository.save(area);
        clearAreaCache();
        return savedArea;
    }

    public Area update(Area area) {
        Area savedArea = areaRepository.save(area);
        clearAreaCache();
        return savedArea;
    }

    public void delete(Long id) {
        areaRepository.deleteById(id);
        clearAreaCache();
    }
}
