package com.salon.eventos.repository;

import com.salon.eventos.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {
    List<UserPermission> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM UserPermission up WHERE up.user.id = :userId")
    void deleteByUserId(Long userId);
}

