package vn.greenlab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.greenlab.exception.NotFoundException;
import vn.greenlab.model.User;
import vn.greenlab.model.input.user.UserSearch;
import vn.greenlab.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public Page<User> search(UserSearch search) {
        Sort sort = Sort.by(
                Sort.Direction.fromString(
                        search.getSortDir() == null || search.getSortDir().isBlank() ? "desc" : search.getSortDir()
                ),
                search.getSortBy() == null || search.getSortBy().isBlank() ? "createTime" : search.getSortBy()
        );
        Pageable pageable = PageRequest.of(search.getPage() <= 0 ? 0 : search.getPage() - 1, search.getSize() <= 0 ? 20 : search.getSize(), sort);

        String kw = search.getKeyword() == null ? null : search.getKeyword().trim();
        if (kw != null && kw.isEmpty()) kw = null;

        String email = search.getEmail() == null ? null : search.getEmail().trim();
        if (email != null && email.isEmpty()) email = null;

        String fullName = search.getFullName() == null ? null : search.getFullName().trim();
        if (fullName != null && fullName.isEmpty()) fullName = null;

        String phone = search.getPhone() == null ? null : search.getPhone().trim();
        if (phone != null && phone.isEmpty()) phone = null;

        LocalDateTime from = search.getCreatedFrom();
        LocalDateTime to = search.getCreatedTo();

        return userRepository.search(kw, email, fullName, phone, search.getIsActive(), search.getType(), search.getRegSource(), from, to, pageable);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User create(User user) {
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User update(Long id, User user) {
        User exist = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        exist.setEmail(user.getEmail());
        exist.setFullName(user.getFullName());
        exist.setPhone(user.getPhone());
        exist.setAddress(user.getAddress());
        exist.setNote(user.getNote());
        exist.setPatientIds(user.getPatientIds());
        exist.setPhoto(user.getPhoto());
        exist.setRegSource(user.getRegSource());
        exist.setSalt(user.getSalt());
        exist.setStatus(user.getStatus());
        exist.setType(user.getType());
        exist.setUpdateTime(LocalDateTime.now());
        exist.setLastLoginIp(user.getLastLoginIp());
        exist.setEmailVerified(user.getEmailVerified());
        exist.setPhoneVerified(user.getPhoneVerified());
        exist.setLastLoginTime(user.getLastLoginTime());
        return userRepository.save(exist);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
