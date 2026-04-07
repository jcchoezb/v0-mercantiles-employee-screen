package com.mercantiles.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ChatbotHistorialDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CitaResponse {
        private Long id;
        private Long conversacionId;
        private Long clienteId;
        private String clienteNombre;
        private String titulo;
        private String descripcion;
        private LocalDateTime fechaCita;
        private Integer duracion;
        private String ubicacion;
        private String estado;
        private String notas;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CotizacionResponse {
        private Long id;
        private String numero;
        private Long conversacionId;
        private Long clienteId;
        private String clienteNombre;
        private String items;
        private BigDecimal subtotal;
        private BigDecimal impuesto;
        private BigDecimal descuento;
        private BigDecimal total;
        private String estado;
        private LocalDateTime validaHasta;
        private String notas;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EncuestaResponse {
        private Long id;
        private Long conversacionId;
        private Long clienteId;
        private String clienteNombre;
        private String tipoEncuesta;
        private String respuestas;
        private Double puntuacion;
        private String comentarios;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentoResponse {
        private Long id;
        private Long conversacionId;
        private Long clienteId;
        private String clienteNombre;
        private String tipoDocumento;
        private String titulo;
        private String url;
        private Long tamanoBytes;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistorialUnificado {
        private Long id;
        private String tipo;
        private Long conversacionId;
        private Long clienteId;
        private String clienteNombre;
        private String titulo;
        private String descripcion;
        private String estado;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private Long totalCitas;
        private Long totalCotizaciones;
        private Long totalEncuestas;
        private Long totalDocumentos;
        private Double promedioCalificacion;
    }
}
