package com.salon.eventos.controller;

import com.salon.eventos.dto.LoginRequest;
import com.salon.eventos.dto.LoginResponse;
import com.salon.eventos.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Refresca el token del usuario autenticado con los permisos actuales de la BD.
     * Útil cuando un admin cambia los permisos de un puesto y el usuario quiere
     * que los cambios se apliquen sin tener que hacer logout/login.
     */
    @GetMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(Authentication auth) {
        return ResponseEntity.ok(authService.refresh(auth.getName()));
    }
}

