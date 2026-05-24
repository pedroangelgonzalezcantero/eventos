package com.salon.eventos;

import com.salon.eventos.entity.User;
import com.salon.eventos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableScheduling
public class EventosApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventosApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository,
                                      PasswordEncoder passwordEncoder,
                                      @Value("${app.admin-password:admin123}") String adminPassword) {
        return args -> {
            // Crear usuario admin (oficina) por defecto si no existe
            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setEmail("admin@salon.com");
                admin.setNombre("Administrador");
                admin.setRole("OFFICE");
                admin.setActive(true);
                userRepository.save(admin);
                System.out.println("✅ Usuario admin creado: admin / " + adminPassword);
            }
            // Crear usuarios de departamento
            createIfNotExists(userRepository, passwordEncoder, "cocina", "cocina123", "Cocina", "KITCHEN");
            createIfNotExists(userRepository, passwordEncoder, "dj", "dj123", "DJ", "DJ");
            createIfNotExists(userRepository, passwordEncoder, "sala", "sala123", "Sala", "FLOOR");
            System.out.println("🎉 Salon de Celebraciones - Sistema iniciado correctamente");
            System.out.println("📡 API en: http://localhost:8080");
            System.out.println("🗄️  H2 Console: http://localhost:8080/h2-console");
        };
    }

    private void createIfNotExists(UserRepository repo, PasswordEncoder encoder,
                                    String username, String rawPwd, String nombre, String role) {
        if (!repo.existsByUsername(username)) {
            User u = new User();
            u.setUsername(username);
            u.setPassword(encoder.encode(rawPwd));
            u.setNombre(nombre);
            u.setRole(role);
            u.setActive(true);
            repo.save(u);
        }
    }
}
