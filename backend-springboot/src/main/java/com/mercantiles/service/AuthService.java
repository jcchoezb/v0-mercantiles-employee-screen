package com.mercantiles.service;

import com.mercantiles.dto.AuthDTO;
import com.mercantiles.entity.Empleado;
import com.mercantiles.repository.EmpleadoRepository;
import com.mercantiles.security.CustomUserDetails;
import com.mercantiles.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmpleadoRepository empleadoRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        Empleado empleado = empleadoRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        empleado.setUltimoAcceso(LocalDateTime.now());
        empleadoRepository.save(empleado);

        CustomUserDetails userDetails = new CustomUserDetails(empleado);
        String token = jwtService.generateToken(userDetails);

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .empleado(mapToEmpleadoDTO(empleado))
                .build();
    }

    public AuthDTO.EmpleadoDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return mapToEmpleadoDTO(userDetails.getEmpleado());
    }

    public Empleado getCurrentEmpleado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getEmpleado();
    }

    @Transactional
    public void cambiarPassword(AuthDTO.CambiarPasswordRequest request) {
        Empleado empleado = getCurrentEmpleado();

        if (!passwordEncoder.matches(request.getPasswordActual(), empleado.getPassword())) {
            throw new RuntimeException("Contraseña actual incorrecta");
        }

        empleado.setPassword(passwordEncoder.encode(request.getPasswordNueva()));
        empleadoRepository.save(empleado);
    }

    private AuthDTO.EmpleadoDTO mapToEmpleadoDTO(Empleado empleado) {
        return AuthDTO.EmpleadoDTO.builder()
                .id(empleado.getId())
                .nombre(empleado.getNombre())
                .apellido(empleado.getApellido())
                .email(empleado.getEmail())
                .telefono(empleado.getTelefono())
                .avatar(empleado.getAvatar())
                .rol(empleado.getRol().getNombre())
                .estado(empleado.getEstado().name())
                .build();
    }
}
