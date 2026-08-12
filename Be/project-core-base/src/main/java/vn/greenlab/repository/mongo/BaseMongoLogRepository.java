package vn.greenlab.repository.mongo;

import java.lang.reflect.Field;
import java.util.List;

import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

public abstract class BaseMongoLogRepository<E> {

    @Autowired
    @Qualifier("historyMongoTemplate")
    private MongoTemplate historyMongoTemplate;
    private Class<E> entityClass;

    public BaseMongoLogRepository(Class<E> entityClass) {
        this.entityClass = entityClass;
    }

    /**
     * Lấy về đối tượng database để thực hiện các hành động
     *
     * @return Đối tượng database
     */
    public MongoTemplate getMongo() {
        return historyMongoTemplate;
    }

    /**
     * Lấy về entity class để dùng trong các query
     *
     * @return Entity class
     */
    protected Class<E> getEntityClass() {
        return entityClass;
    }

    /**
     * Random id cho đối tượng
     *
     * @return
     */
    public String genId() {
        String id = "";
        do {
            id = RandomStringUtils.randomNumeric(12);
            while (id.startsWith("0")) {
                id = id.substring(1);
            }
        } while (this.exists(id));
        return id;
    }

    /**
     * Random id cho đối tượng
     *
     * @return
     */
    public String genId(String pre) {
        String id = "";
        do {
            id = RandomStringUtils.randomNumeric(12);
            while (id.startsWith("0")) {
                id = id.substring(1);
            }
            id = pre + id;
        } while (this.exists(id));
        return id;
    }

    /**
     * Random id cho đối tượng 6 ký tự
     *
     * @return
     */
    public String genId6() {
        String id = "";
        do {
            id = RandomStringUtils.randomNumeric(6).toLowerCase();
        } while (this.exists(id));
        return id;
    }

    /**
     * Finds the ID field of the entity using reflection
     * @return The ID field, or null if not found
     */
    private Field getIdField(Class<?> clazz) {
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            // Check for Spring Data MongoDB @Id annotation
            if (field.isAnnotationPresent(org.springframework.data.annotation.Id.class)) {
                return field;
            }
            // Check for Jakarta Persistence @Id annotation (for compatibility)
            if (field.isAnnotationPresent(jakarta.persistence.Id.class)) {
                return field;
            }
        }
        // Check parent classes
        Class<?> superClass = clazz.getSuperclass();
        while (superClass != null && superClass != Object.class) {
            Field[] superFields = superClass.getDeclaredFields();
            for (Field field : superFields) {
                if (field.isAnnotationPresent(org.springframework.data.annotation.Id.class) ||
                    field.isAnnotationPresent(jakarta.persistence.Id.class)) {
                    return field;
                }
            }
            superClass = superClass.getSuperclass();
        }
        return null;
    }

    /**
     * Lưu object vào database, nếu không có id hệ thống sẽ tự random id
     *
     * @param object object cần lưu
     */
    public <S extends E> void save(S object) {
        if (object == null) {
            return;
        }
        
        // Find the ID field using reflection
        Field idField = getIdField(object.getClass());
        if (idField != null) {
            try {
                idField.setAccessible(true);
                Object currentId = idField.get(object);
                
                // Check if ID is null or empty string
                boolean needsId = false;
                if (currentId == null) {
                    needsId = true;
                } else if (currentId instanceof String && ((String) currentId).trim().isEmpty()) {
                    needsId = true;
                }
                
                // Generate ID if needed
                if (needsId) {
                    String newId = genId();
                    idField.set(object, newId);
                }
            } catch (IllegalAccessException e) {
                System.err.println("Cannot access ID field for entity " + object.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }
        
        historyMongoTemplate.save(object);
    }

    public <S extends E> void saveAll(List<S> objects) {
        if (objects == null || objects.isEmpty()) {
            return;
        }
        
        // Generate IDs for entities that don't have one
        Field idField = null;
        for (S object : objects) {
            if (object == null) {
                continue;
            }
            
            // Find ID field once (assuming all objects are of the same type)
            if (idField == null) {
                idField = getIdField(object.getClass());
            }
            
            if (idField != null) {
                try {
                    idField.setAccessible(true);
                    Object currentId = idField.get(object);
                    
                    // Check if ID is null or empty string
                    boolean needsId = false;
                    if (currentId == null) {
                        needsId = true;
                    } else if (currentId instanceof String && ((String) currentId).trim().isEmpty()) {
                        needsId = true;
                    }
                    
                    // Generate ID if needed
                    if (needsId) {
                        String newId = genId();
                        idField.set(object, newId);
                    }
                } catch (IllegalAccessException e) {
                    System.err.println("Cannot access ID field for entity " + object.getClass().getSimpleName() + ": " + e.getMessage());
                }
            }
        }
        
        historyMongoTemplate.insert(objects, getEntityClass());
    }
    /**
     * Tìm object theo id
     *
     * @param id Id cần tìm
     * @return Object có id tương ứng hoặc null nếu không tồn tại
     */
    public E find(String id) {
        return historyMongoTemplate.findById(id, entityClass);
    }

    /**
     * Kiểm tra object có tồn tại không
     *
     * @param id Id cần kiểm tra
     * @return True / false: có tồn tại hay không
     */
    public boolean exists(String id) {
        return this.find(id) != null;
    }

    /**
     * Đếm tổng số object trong collection
     *
     * @return Tổng số object
     */
    public long count() {
        return historyMongoTemplate.count(new Query(), entityClass);
    }

    public long total(Criteria cri) {
        return historyMongoTemplate.count(new Query(cri), entityClass);
    }

    /**
     * Tìm kiếm theo query
     *
     * @param query
     * @return
     */
    public List<E> find(Query query) {
        return getMongo().find(query, entityClass);
    }

    /**
     * Đếm theo query
     *
     * @param query
     * @return
     */
    public long count(Query query) {
        return historyMongoTemplate.count(query, entityClass);
    }

    /**
     * Xóa object theo id
     *
     * @param id Id cần xóa
     */
    public void delete(String id) {
        historyMongoTemplate.remove(new Query(new Criteria("id").is(id)),
                entityClass);
    }

    public void deletes(List<String> id) {
        historyMongoTemplate.remove(new Query(new Criteria("id").in(id)),
                entityClass);
    }

    /**
     * Xóa theo query
     *
     * @param query
     */
    public void delete(Query query) {
        historyMongoTemplate.remove(query, entityClass);
    }

    /**
     * Xóa object
     *
     * @param entity object cần xóa
     */
    public void delete(E entity) {
        historyMongoTemplate.remove(entity);
    }

    public List<E> getByStringQuerry(String sql) {
        return getMongo().find(new BasicQuery(sql), entityClass);
    }

    public void insert(List<E> listEntity) {
        getMongo().insert(listEntity, getEntityClass());
    }

    /**
     * Tìm kiếm một object theo query
     */
    public E findOne(Query query) {
        return getMongo().findOne(query, entityClass);
    }

}
