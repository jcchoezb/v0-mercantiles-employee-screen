package com.mercantiles.service;

import com.mercantiles.dto.ChatbotHistorialDTO;
import com.mercantiles.dto.PageResponse;
import com.mercantiles.entity.*;
import com.mercantiles.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotHistorialService {

    private final ChatbotCitaRepository citaRepository;
    private final ChatbotCotizacionRepository cotizacionRepository;
    private final ChatbotEncuestaRepository encuestaRepository;
    private final ChatbotDocumentoRepository documentoRepository;

    public PageResponse<ChatbotHistorialDTO.CitaResponse> listarCitas(Pageable pageable) {
        Page<ChatbotCita> page = citaRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<ChatbotHistorialDTO.CitaResponse> content = page.getContent().stream()
                .map(this::mapCitaToResponse)
                .collect(Collectors.toList());
        return PageResponse.from(page, content);
    }

    public PageResponse<ChatbotHistorialDTO.CotizacionResponse> listarCotizaciones(Pageable pageable) {
        Page<ChatbotCotizacion> page = cotizacionRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<ChatbotHistorialDTO.CotizacionResponse> content = page.getContent().stream()
                .map(this::mapCotizacionToResponse)
                .collect(Collectors.toList());
        return PageResponse.from(page, content);
    }

    public PageResponse<ChatbotHistorialDTO.EncuestaResponse> listarEncuestas(Pageable pageable) {
        Page<ChatbotEncuesta> page = encuestaRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<ChatbotHistorialDTO.EncuestaResponse> content = page.getContent().stream()
                .map(this::mapEncuestaToResponse)
                .collect(Collectors.toList());
        return PageResponse.from(page, content);
    }

    public PageResponse<ChatbotHistorialDTO.DocumentoResponse> listarDocumentos(Pageable pageable) {
        Page<ChatbotDocumento> page = documentoRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<ChatbotHistorialDTO.DocumentoResponse> content = page.getContent().stream()
                .map(this::mapDocumentoToResponse)
                .collect(Collectors.toList());
        return PageResponse.from(page, content);
    }

    public List<ChatbotHistorialDTO.HistorialUnificado> listarTodo(String tipo) {
        List<ChatbotHistorialDTO.HistorialUnificado> historial = new ArrayList<>();

        if (tipo == null || tipo.equals("cita")) {
            citaRepository.findAll().forEach(cita -> historial.add(
                    ChatbotHistorialDTO.HistorialUnificado.builder()
                            .id(cita.getId())
                            .tipo("cita")
                            .conversacionId(cita.getConversacion() != null ? cita.getConversacion().getId() : null)
                            .clienteId(cita.getCliente().getId())
                            .clienteNombre(cita.getCliente().getNombreCompleto())
                            .titulo(cita.getTitulo())
                            .descripcion(cita.getDescripcion())
                            .estado(cita.getEstado().name())
                            .createdAt(cita.getCreatedAt())
                            .build()
            ));
        }

        if (tipo == null || tipo.equals("cotizacion")) {
            cotizacionRepository.findAll().forEach(cot -> historial.add(
                    ChatbotHistorialDTO.HistorialUnificado.builder()
                            .id(cot.getId())
                            .tipo("cotizacion")
                            .conversacionId(cot.getConversacion() != null ? cot.getConversacion().getId() : null)
                            .clienteId(cot.getCliente().getId())
                            .clienteNombre(cot.getCliente().getNombreCompleto())
                            .titulo("Cotización #" + cot.getNumero())
                            .descripcion("Total: $" + cot.getTotal())
                            .estado(cot.getEstado().name())
                            .createdAt(cot.getCreatedAt())
                            .build()
            ));
        }

        if (tipo == null || tipo.equals("encuesta")) {
            encuestaRepository.findAll().forEach(enc -> historial.add(
                    ChatbotHistorialDTO.HistorialUnificado.builder()
                            .id(enc.getId())
                            .tipo("encuesta")
                            .conversacionId(enc.getConversacion() != null ? enc.getConversacion().getId() : null)
                            .clienteId(enc.getCliente().getId())
                            .clienteNombre(enc.getCliente().getNombreCompleto())
                            .titulo("Encuesta: " + enc.getTipoEncuesta())
                            .descripcion("Puntuación: " + enc.getPuntuacion())
                            .estado("completada")
                            .createdAt(enc.getCreatedAt())
                            .build()
            ));
        }

        if (tipo == null || tipo.equals("documento")) {
            documentoRepository.findAll().forEach(doc -> historial.add(
                    ChatbotHistorialDTO.HistorialUnificado.builder()
                            .id(doc.getId())
                            .tipo("documento")
                            .conversacionId(doc.getConversacion() != null ? doc.getConversacion().getId() : null)
                            .clienteId(doc.getCliente().getId())
                            .clienteNombre(doc.getCliente().getNombreCompleto())
                            .titulo(doc.getTitulo())
                            .descripcion("Tipo: " + doc.getTipoDocumento())
                            .estado("generado")
                            .createdAt(doc.getCreatedAt())
                            .build()
            ));
        }

        historial.sort(Comparator.comparing(ChatbotHistorialDTO.HistorialUnificado::getCreatedAt).reversed());
        return historial;
    }

    public ChatbotHistorialDTO.Stats obtenerEstadisticas() {
        return ChatbotHistorialDTO.Stats.builder()
                .totalCitas(citaRepository.count())
                .totalCotizaciones(cotizacionRepository.count())
                .totalEncuestas(encuestaRepository.count())
                .totalDocumentos(documentoRepository.count())
                .promedioCalificacion(encuestaRepository.promedioPuntuacionGeneral())
                .build();
    }

    private ChatbotHistorialDTO.CitaResponse mapCitaToResponse(ChatbotCita cita) {
        return ChatbotHistorialDTO.CitaResponse.builder()
                .id(cita.getId())
                .conversacionId(cita.getConversacion() != null ? cita.getConversacion().getId() : null)
                .clienteId(cita.getCliente().getId())
                .clienteNombre(cita.getCliente().getNombreCompleto())
                .titulo(cita.getTitulo())
                .descripcion(cita.getDescripcion())
                .fechaCita(cita.getFechaCita())
                .duracion(cita.getDuracion())
                .ubicacion(cita.getUbicacion())
                .estado(cita.getEstado().name())
                .notas(cita.getNotas())
                .createdAt(cita.getCreatedAt())
                .build();
    }

    private ChatbotHistorialDTO.CotizacionResponse mapCotizacionToResponse(ChatbotCotizacion cot) {
        return ChatbotHistorialDTO.CotizacionResponse.builder()
                .id(cot.getId())
                .numero(cot.getNumero())
                .conversacionId(cot.getConversacion() != null ? cot.getConversacion().getId() : null)
                .clienteId(cot.getCliente().getId())
                .clienteNombre(cot.getCliente().getNombreCompleto())
                .items(cot.getItems())
                .subtotal(cot.getSubtotal())
                .impuesto(cot.getImpuesto())
                .descuento(cot.getDescuento())
                .total(cot.getTotal())
                .estado(cot.getEstado().name())
                .validaHasta(cot.getValidaHasta())
                .notas(cot.getNotas())
                .createdAt(cot.getCreatedAt())
                .build();
    }

    private ChatbotHistorialDTO.EncuestaResponse mapEncuestaToResponse(ChatbotEncuesta enc) {
        return ChatbotHistorialDTO.EncuestaResponse.builder()
                .id(enc.getId())
                .conversacionId(enc.getConversacion() != null ? enc.getConversacion().getId() : null)
                .clienteId(enc.getCliente().getId())
                .clienteNombre(enc.getCliente().getNombreCompleto())
                .tipoEncuesta(enc.getTipoEncuesta())
                .respuestas(enc.getRespuestas())
                .puntuacion(enc.getPuntuacion())
                .comentarios(enc.getComentarios())
                .createdAt(enc.getCreatedAt())
                .build();
    }

    private ChatbotHistorialDTO.DocumentoResponse mapDocumentoToResponse(ChatbotDocumento doc) {
        return ChatbotHistorialDTO.DocumentoResponse.builder()
                .id(doc.getId())
                .conversacionId(doc.getConversacion() != null ? doc.getConversacion().getId() : null)
                .clienteId(doc.getCliente().getId())
                .clienteNombre(doc.getCliente().getNombreCompleto())
                .tipoDocumento(doc.getTipoDocumento())
                .titulo(doc.getTitulo())
                .url(doc.getUrl())
                .tamanoBytes(doc.getTamanoBytes())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
