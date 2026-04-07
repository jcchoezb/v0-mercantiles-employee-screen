package com.mercantiles.service;

import com.mercantiles.dto.ConversacionDTO;
import com.mercantiles.dto.MensajeDTO;
import com.mercantiles.entity.*;
import com.mercantiles.repository.ConversacionRepository;
import com.mercantiles.repository.MensajeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversacionService {

    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final AuthService authService;

    public List<ConversacionDTO.Response> listarPendientes() {
        return conversacionRepository.findPendientes().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ConversacionDTO.Response> listarMisConversaciones() {
        Empleado empleado = authService.getCurrentEmpleado();
        return conversacionRepository.findActivasByEmpleado(empleado.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ConversacionDTO.ConversacionConMensajes obtenerConMensajes(Long id) {
        Conversacion conversacion = conversacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        
        List<Mensaje> mensajes = mensajeRepository.findByConversacionIdOrderByCreatedAtAsc(id);
        
        return ConversacionDTO.ConversacionConMensajes.builder()
                .conversacion(mapToResponse(conversacion))
                .mensajes(mensajes.stream().map(this::mapMensajeToResponse).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public ConversacionDTO.Response tomarConversacion(Long id) {
        Conversacion conversacion = conversacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        
        if (conversacion.getEstado() != Conversacion.EstadoConversacion.pendiente) {
            throw new RuntimeException("La conversación ya fue tomada");
        }

        Empleado empleado = authService.getCurrentEmpleado();
        conversacion.setEmpleado(empleado);
        conversacion.setEstado(Conversacion.EstadoConversacion.activa);
        conversacion.setFechaAsignacion(LocalDateTime.now());
        
        conversacion = conversacionRepository.save(conversacion);
        return mapToResponse(conversacion);
    }

    @Transactional
    public MensajeDTO.Response enviarMensaje(MensajeDTO.CreateRequest request) {
        Conversacion conversacion = conversacionRepository.findById(request.getConversacionId())
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        
        Empleado empleado = authService.getCurrentEmpleado();
        
        Mensaje mensaje = Mensaje.builder()
                .conversacion(conversacion)
                .tipoRemitente(Mensaje.TipoRemitente.empleado)
                .remitenteId(empleado.getId())
                .contenido(request.getContenido())
                .tipoContenido(request.getTipoContenido() != null ? 
                        Mensaje.TipoContenido.valueOf(request.getTipoContenido()) : 
                        Mensaje.TipoContenido.texto)
                .urlArchivo(request.getUrlArchivo())
                .leido(false)
                .build();
        
        mensaje = mensajeRepository.save(mensaje);
        
        // Marcar mensajes del cliente como leídos
        mensajeRepository.marcarLeidosByConversacion(conversacion.getId());
        
        return mapMensajeToResponse(mensaje);
    }

    @Transactional
    public ConversacionDTO.Response cerrarConversacion(Long id, ConversacionDTO.CerrarRequest request) {
        Conversacion conversacion = conversacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        
        conversacion.setEstado(Conversacion.EstadoConversacion.cerrada);
        conversacion.setFechaCierre(LocalDateTime.now());
        if (request != null && request.getComentarioCierre() != null) {
            conversacion.setComentarioCierre(request.getComentarioCierre());
        }
        
        conversacion = conversacionRepository.save(conversacion);
        return mapToResponse(conversacion);
    }

    private ConversacionDTO.Response mapToResponse(Conversacion conv) {
        List<Mensaje> mensajesNoLeidos = mensajeRepository.findNoLeidosByConversacion(conv.getId());
        Mensaje ultimoMensaje = conv.getMensajes() != null && !conv.getMensajes().isEmpty() ?
                conv.getMensajes().get(conv.getMensajes().size() - 1) : null;

        return ConversacionDTO.Response.builder()
                .id(conv.getId())
                .cliente(ConversacionDTO.ClienteInfo.builder()
                        .id(conv.getCliente().getId())
                        .nombre(conv.getCliente().getNombre())
                        .apellido(conv.getCliente().getApellido())
                        .email(conv.getCliente().getEmail())
                        .avatar(conv.getCliente().getAvatar())
                        .build())
                .empleado(conv.getEmpleado() != null ? ConversacionDTO.EmpleadoInfo.builder()
                        .id(conv.getEmpleado().getId())
                        .nombre(conv.getEmpleado().getNombre())
                        .apellido(conv.getEmpleado().getApellido())
                        .avatar(conv.getEmpleado().getAvatar())
                        .build() : null)
                .estado(conv.getEstado().name())
                .origen(conv.getOrigen().name())
                .temaOriginal(conv.getTemaOriginal())
                .temaDerivado(conv.getTemaDerivado())
                .motivoDerivacion(conv.getMotivoDerivacion())
                .prioridad(conv.getPrioridad().name())
                .idPublicidad(conv.getIdPublicidad())
                .fechaInicio(conv.getFechaInicio())
                .fechaAsignacion(conv.getFechaAsignacion())
                .fechaCierre(conv.getFechaCierre())
                .calificacionCliente(conv.getCalificacionCliente())
                .comentarioCierre(conv.getComentarioCierre())
                .ultimoMensaje(ultimoMensaje != null ? ConversacionDTO.MensajeInfo.builder()
                        .id(ultimoMensaje.getId())
                        .contenido(ultimoMensaje.getContenido())
                        .tipoRemitente(ultimoMensaje.getTipoRemitente().name())
                        .createdAt(ultimoMensaje.getCreatedAt())
                        .build() : null)
                .mensajesNoLeidos(mensajesNoLeidos.size())
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }

    private MensajeDTO.Response mapMensajeToResponse(Mensaje msg) {
        String nombreRemitente = null;
        if (msg.getTipoRemitente() == Mensaje.TipoRemitente.empleado && msg.getConversacion().getEmpleado() != null) {
            nombreRemitente = msg.getConversacion().getEmpleado().getNombreCompleto();
        } else if (msg.getTipoRemitente() == Mensaje.TipoRemitente.cliente) {
            nombreRemitente = msg.getConversacion().getCliente().getNombreCompleto();
        } else if (msg.getTipoRemitente() == Mensaje.TipoRemitente.bot) {
            nombreRemitente = "Chatbot";
        }

        return MensajeDTO.Response.builder()
                .id(msg.getId())
                .conversacionId(msg.getConversacion().getId())
                .tipoRemitente(msg.getTipoRemitente().name())
                .remitenteId(msg.getRemitenteId())
                .remitenteNombre(nombreRemitente)
                .contenido(msg.getContenido())
                .tipoContenido(msg.getTipoContenido().name())
                .urlArchivo(msg.getUrlArchivo())
                .leido(msg.getLeido())
                .fechaLeido(msg.getFechaLeido())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
