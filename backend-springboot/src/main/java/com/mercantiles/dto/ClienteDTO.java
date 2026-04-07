package com.mercantiles.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ClienteDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String telefono;
        private String empresa;
        private String direccion;
        private String ciudad;
        private String pais;
        private String avatar;
        private String estado;
        private String fuenteOrigen;
        private String notas;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "El nombre es requerido")
        private String nombre;

        @NotBlank(message = "El apellido es requerido")
        private String apellido;

        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        private String email;

        private String telefono;
        private String empresa;
        private String direccion;
        private String ciudad;
        private String pais;
        private String avatar;
        private String fuenteOrigen;
        private String notas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String nombre;
        private String apellido;
        private String email;
        private String telefono;
        private String empresa;
        private String direccion;
        private String ciudad;
        private String pais;
        private String avatar;
        private String estado;
        private String notas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private Long total;
        private Long activos;
        private Long pendientes;
        private Long inactivos;
    }
}
