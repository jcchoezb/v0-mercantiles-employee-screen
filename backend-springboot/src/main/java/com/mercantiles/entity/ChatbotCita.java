package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_citas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotCita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conversacion_id")
    private Conversacion conversacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_cita", nullable = false)
    private LocalDateTime fechaCita;

    @Column(nullable = false)
    @Builder.Default
    private Integer duracion = 30;

    @Column(length = 255)
    private String ubicacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoCita estado = EstadoCita.programada;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "recordatorio_enviado", nullable = false)
    @Builder.Default
    private Boolean recordatorioEnviado = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EstadoCita {
        programada, confirmada, completada, cancelada, no_asistio
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
