package com.salon.eventos.repository;

import com.salon.eventos.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {
    List<UserPermission> findByUserId(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserPermission up WHERE up.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    /**
     * Elimina los overrides "granted=false" para usuarios de un puesto concreto
     * cuando esos permisos se acaban de añadir al rol.  Así las personalizaciones
     * individuales que bloqueaban no impiden el cambio global de rol.
     *
     * Usa nativeQuery para evitar el CROSS JOIN que genera Hibernate con JPQL
     * al acceder a up.user.role en una bulk DELETE sobre PostgreSQL.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM user_permissions " +
                   "WHERE permission_code IN :codes " +
                   "  AND granted = false " +
                   "  AND user_id IN (SELECT id FROM users WHERE role = :role)",
           nativeQuery = true)
    void deleteBlockingOverridesForRole(@Param("role") String role, @Param("codes") List<String> codes);
}

