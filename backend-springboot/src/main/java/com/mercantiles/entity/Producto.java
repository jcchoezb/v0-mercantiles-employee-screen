package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "productos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "descripcion_corta", length = 500)
    private String descripcionCorta;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id")
    private CategoriaProducto categoria;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(name = "precio_oferta", precision = 12, scale = 2)
    private BigDecimal precioOferta;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(name = "stock_minimo")
    @Builder.Default
    private Integer stockMinimo = 5;

    @Column(length = 500)
    private String imagen;

    @Column(columnDefinition = "JSON")
    private String imagenes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean destacado = false;

    @Column(columnDefinition = "JSON")
    private String especificaciones;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
