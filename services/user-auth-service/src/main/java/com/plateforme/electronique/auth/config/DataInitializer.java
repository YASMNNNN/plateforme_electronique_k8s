package com.plateforme.electronique.auth.config;

import com.plateforme.electronique.auth.entity.User;
import com.plateforme.electronique.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    public static final UUID USER_DEMO_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createUserIfNotExists(null, "admin@example.com", "admin1234", "Amel", "Dabbabi", User.Role.ADMIN);
        createUserIfNotExists(null, "yasminegr432@gmail.com", "yassmine123", "Yassmine", "Grassa", User.Role.ADMIN);
        createUserIfNotExists(USER_DEMO_ID, "user@example.com", "user1234", "Jean", "Dupont", User.Role.USER);
    }

    private void createUserIfNotExists(UUID fixedId, String email, String password, String firstName, String lastName, User.Role role) {
        if (userRepository.existsByEmail(email)) {
            log.info("{} user {} already exists, skipping.", role, email);
            return;
        }
        User.UserBuilder builder = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .firstName(firstName)
                .lastName(lastName)
                .role(role)
                .active(true);
        if (fixedId != null) {
            builder.id(fixedId);
        }
        userRepository.save(builder.build());
        log.info("Created {} user: {}", role, email);
    }
}
