package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "mensajes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversacion_id", nullable = false)
    private Conversacion conversacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_remitente", nullable = false)
    private TipoRemitente tipoRemitente;

    @Column(name = "remitente_id")
    private Long remitenteId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_contenido", nullable = false)
    @Builder.Default
    private TipoContenido tipoContenido = TipoContenido.texto;

    @Column(name = "url_archivo", length = 500)
    private String urlArchivo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean leido = false;

    @Column(name = "fecha_leido")
    private LocalDateTime fechaLeido;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum TipoRemitente {
        cliente, empleado, bot
    }

    public enum TipoContenido {
        texto, imagen, archivo, audio
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
