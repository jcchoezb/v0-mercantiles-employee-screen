package com.mercantiles.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String empresa;

    @Column(length = 255)
    private String direccion;

    @Column(length = 100)
    private String ciudad;

    @Column(length = 100)
    private String pais;

    @Column(length = 255)
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoCliente estado = EstadoCliente.pendiente;

    @Column(name = "fuente_origen", length = 50)
    @Builder.Default
    private String fuenteOrigen = "chatbot";

    @Column(name = "id_publicidad", length = 100)
    private String idPublicidad;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EstadoCliente {
        activo, pendiente, inactivo
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

    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }
}
