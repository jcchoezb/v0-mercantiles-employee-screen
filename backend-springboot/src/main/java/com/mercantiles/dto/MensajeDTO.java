package com.mercantiles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MensajeDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long conversacionId;
        private String tipoRemitente;
        private Long remitenteId;
        private String remitenteNombre;
        private String contenido;
        private String tipoContenido;
        private String urlArchivo;
        private Boolean leido;
        private LocalDateTime fechaLeido;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "El ID de conversación es requerido")
        private Long conversacionId;

        @NotBlank(message = "El contenido es requerido")
        private String contenido;

        private String tipoContenido;
        private String urlArchivo;
    }
}
