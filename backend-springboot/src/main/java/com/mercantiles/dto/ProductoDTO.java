package com.mercantiles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductoDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String sku;
        private String nombre;
        private String descripcion;
        private String descripcionCorta;
        private Long categoriaId;
        private String categoriaNombre;
        private BigDecimal precio;
        private BigDecimal precioOferta;
        private Integer stock;
        private Integer stockMinimo;
        private String imagen;
        private String imagenes;
        private Boolean activo;
        private Boolean destacado;
        private String especificaciones;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "El SKU es requerido")
        private String sku;

        @NotBlank(message = "El nombre es requerido")
        private String nombre;

        private String descripcion;
        private String descripcionCorta;
        private Long categoriaId;

        @NotNull(message = "El precio es requerido")
        @Positive(message = "El precio debe ser positivo")
        private BigDecimal precio;

        private BigDecimal precioOferta;
        private Integer stock;
        private Integer stockMinimo;
        private String imagen;
        private String imagenes;
        private Boolean destacado;
        private String especificaciones;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String sku;
        private String nombre;
        private String descripcion;
        private String descripcionCorta;
        private Long categoriaId;
        private BigDecimal precio;
        private BigDecimal precioOferta;
        private Integer stock;
        private Integer stockMinimo;
        private String imagen;
        private String imagenes;
        private Boolean activo;
        private Boolean destacado;
        private String especificaciones;
    }
}
