package com.salon.eventos.controller;

import com.salon.eventos.entity.User;
import com.salon.eventos.entity.UserPermission;
import com.salon.eventos.repository.UserPermissionRepository;
import com.salon.eventos.repository.UserRepository;
import com.salon.eventos.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PermissionService permissionService;
    @Autowired private UserPermissionRepository userPermissionRepository;

    /** Listar todo el personal (no clientes) */
    @GetMapping("/staff")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<Map<String, Object>>> getStaff() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .filter(u -> !"CLIENT".equals(u.getRole()))
                        .map(this::toMap)
                        .collect(Collectors.toList())
        );
    }

    /** Todos los usuarios incluyendo clientes */
    @GetMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .map(this::toMap)
                        .collect(Collectors.toList())
        );
    }

    /** Crear nuevo usuario */
    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (userRepository.existsByUsername(username)) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "El usuario ya existe");
            return ResponseEntity.badRequest().body(err);
        }
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(body.get("password")))
                .nombre(body.get("nombre"))
                .email(body.get("email"))
                .role(body.get("role"))
                .active(true)
                .build();
        return ResponseEntity.ok(toMap(userRepository.save(user)));
    }

    /** Actualizar datos básicos de usuario */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id,
                                                          @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (body.containsKey("nombre")) user.setNombre(body.get("nombre"));
        if (body.containsKey("email"))  user.setEmail(body.get("email"));
        if (body.containsKey("role") && body.get("role") != null && !body.get("role").trim().isEmpty()) {
            user.setRole(body.get("role"));
        }
        if (body.containsKey("password") && body.get("password") != null && !body.get("password").trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(body.get("password")));
        }
        return ResponseEntity.ok(toMap(userRepository.save(user)));
    }

    /** Activar / desactivar usuario */
    @PutMapping("/{id}/active")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable Long id,
                                                            @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setActive(body.getOrDefault("active", !user.isActive()));
        return ResponseEntity.ok(toMap(userRepository.save(user)));
    }

    /** Restablecer contraseña */
    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setPassword(passwordEncoder.encode(body.get("password")));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    /** Obtener permisos efectivos de un usuario */
    @GetMapping("/{id}/permissions")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> getUserPermissions(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Set<String> effective = permissionService.getEffectivePermissions(user);
        List<UserPermission> overrides = userPermissionRepository.findByUserId(id);
        Map<String, Boolean> overrideMap = overrides.stream()
                .collect(Collectors.toMap(UserPermission::getPermissionCode, UserPermission::isGranted));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", id);
        result.put("role", user.getRole());
        result.put("effectivePermissions", effective);
        result.put("overrides", overrideMap);
        return ResponseEntity.ok(result);
    }

    /**
     * Guardar permisos individuales.
     * Body: { "TABLES_VIEW": true, "INVOICES_VIEW": false, ... }
     */
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> saveUserPermissions(@PathVariable Long id,
                                                                    @RequestBody Map<String, Boolean> permissions) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        permissionService.saveUserPermissions(user, permissions);
        return getUserPermissions(id);
    }

    /** Eliminar usuario */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("nombre", u.getNombre() != null ? u.getNombre() : u.getUsername());
        m.put("email", u.getEmail() != null ? u.getEmail() : "");
        m.put("role", u.getRole());
        m.put("active", u.isActive());
        return m;
    }
}
