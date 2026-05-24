package com.salon.eventos.security;

import com.salon.eventos.entity.User;
import com.salon.eventos.repository.UserRepository;
import com.salon.eventos.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PermissionService permissionService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        if (!user.isActive()) {
            throw new UsernameNotFoundException("Usuario desactivado: " + username);
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        // Rol base (para compatibilidad con hasRole())
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        // Permisos efectivos (para hasAuthority())
        permissionService.getEffectivePermissions(user)
                .forEach(code -> authorities.add(new SimpleGrantedAuthority(code)));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }
}
