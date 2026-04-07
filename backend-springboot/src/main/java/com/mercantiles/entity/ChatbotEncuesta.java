package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_encuestas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotEncuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conversacion_id")
    private Conversacion conversacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "tipo_encuesta", nullable = false, length = 50)
    private String tipoEncuesta;

    @Column(columnDefinition = "JSON", nullable = false)
    private String respuestas;

    @Column(precision = 3, scale = 1)
    private Double puntuacion;

    @Column(columnDefinition = "TEXT")
    private String comentarios;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
