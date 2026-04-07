package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_cotizaciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotCotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String numero;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conversacion_id")
    private Conversacion conversacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(columnDefinition = "JSON", nullable = false)
    private String items;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal impuesto = new BigDecimal("12.00");

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoCotizacion estado = EstadoCotizacion.generada;

    @Column(name = "valida_hasta")
    private LocalDateTime validaHasta;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EstadoCotizacion {
        generada, enviada, aceptada, rechazada, expirada
    }

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
