package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "conversaciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoConversacion estado = EstadoConversacion.pendiente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrigenConversacion origen = OrigenConversacion.chatbot;

    @Column(name = "tema_original", length = 100)
    private String temaOriginal;

    @Column(name = "tema_derivado", length = 100)
    private String temaDerivado;

    @Column(name = "motivo_derivacion", columnDefinition = "TEXT")
    private String motivoDerivacion;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrioridadConversacion prioridad = PrioridadConversacion.media;

    @Column(name = "id_publicidad", length = 100)
    private String idPublicidad;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "calificacion_cliente")
    private Integer calificacionCliente;

    @Column(name = "comentario_cierre", columnDefinition = "TEXT")
    private String comentarioCierre;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "conversacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<Mensaje> mensajes;

    public enum EstadoConversacion {
        pendiente, activa, en_espera, cerrada
    }

    public enum OrigenConversacion {
        chatbot, publicidad, web, whatsapp
    }

    public enum PrioridadConversacion {
        baja, media, alta, urgente
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        fechaInicio = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
