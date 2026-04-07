package com.mercantiles.controller;

import com.mercantiles.dto.ApiResponse;
import com.mercantiles.dto.AuthDTO;
import com.mercantiles.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDTO.LoginResponse>> login(
            @Valid @RequestBody AuthDTO.LoginRequest request) {
        try {
            AuthDTO.LoginResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response, "Login exitoso"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Credenciales inválidas"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDTO.EmpleadoDTO>> getCurrentUser() {
        AuthDTO.EmpleadoDTO empleado = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(empleado));
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<ApiResponse<Void>> cambiarPassword(
            @Valid @RequestBody AuthDTO.CambiarPasswordRequest request) {
        try {
            authService.cambiarPassword(request);
            return ResponseEntity.ok(ApiResponse.success(null, "Contraseña actualizada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // El logout se maneja en el cliente eliminando el token
        return ResponseEntity.ok(ApiResponse.success(null, "Sesión cerrada"));
    }
}
