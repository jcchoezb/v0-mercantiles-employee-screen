package com.mercantiles.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        private String email;

        @NotBlank(message = "La contraseña es requerida")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private String token;
        private String tipo;
        private EmpleadoDTO empleado;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmpleadoDTO {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String telefono;
        private String avatar;
        private String rol;
        private String estado;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CambiarPasswordRequest {
        @NotBlank(message = "La contraseña actual es requerida")
        private String passwordActual;

        @NotBlank(message = "La nueva contraseña es requerida")
        private String passwordNueva;
    }
}
