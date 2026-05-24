package com.salon.eventos.service;

import com.salon.eventos.dto.LoginRequest;
import com.salon.eventos.dto.LoginResponse;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.User;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.UserRepository;
import com.salon.eventos.security.CustomUserDetailsService;
import com.salon.eventos.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private PermissionService permissionService;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Set<String> permissions = permissionService.getEffectivePermissions(user);
        String token = jwtUtil.generateToken(userDetails, user.getRole(), permissions);

        Long eventId = null;
        if ("CLIENT".equals(user.getRole())) {
            Optional<Event> event = eventRepository.findByClientUserId(user.getId());
            eventId = event.map(Event::getId).orElse(null);
        }

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .nombre(user.getNombre() != null ? user.getNombre() : user.getUsername())
                .role(user.getRole())
                .eventId(eventId)
                .permissions(permissions)
                .build();
    }

    /**
     * Genera un nuevo token para el usuario con los permisos más recientes de la BD.
     * No requiere contraseña porque el usuario ya está autenticado (tiene JWT válido).
     */
    public LoginResponse refresh(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        Set<String> permissions = permissionService.getEffectivePermissions(user);
        String token = jwtUtil.generateToken(userDetails, user.getRole(), permissions);

        Long eventId = null;
        if ("CLIENT".equals(user.getRole())) {
            Optional<Event> event = eventRepository.findByClientUserId(user.getId());
            eventId = event.map(Event::getId).orElse(null);
        }

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .nombre(user.getNombre() != null ? user.getNombre() : user.getUsername())
                .role(user.getRole())
                .eventId(eventId)
                .permissions(permissions)
                .build();
    }
}
