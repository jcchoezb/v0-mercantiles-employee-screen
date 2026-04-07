package com.mercantiles.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ConversacionDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private ClienteInfo cliente;
        private EmpleadoInfo empleado;
        private String estado;
        private String origen;
        private String temaOriginal;
        private String temaDerivado;
        private String motivoDerivacion;
        private String prioridad;
        private String idPublicidad;
        private LocalDateTime fechaInicio;
        private LocalDateTime fechaAsignacion;
        private LocalDateTime fechaCierre;
        private Integer calificacionCliente;
        private String comentarioCierre;
        private MensajeInfo ultimoMensaje;
        private Integer mensajesNoLeidos;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClienteInfo {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String avatar;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmpleadoInfo {
        private Long id;
        private String nombre;
        private String apellido;
        private String avatar;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MensajeInfo {
        private Long id;
        private String contenido;
        private String tipoRemitente;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversacionConMensajes {
        private Response conversacion;
        private List<MensajeDTO.Response> mensajes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CerrarRequest {
        private String comentarioCierre;
    }
}
