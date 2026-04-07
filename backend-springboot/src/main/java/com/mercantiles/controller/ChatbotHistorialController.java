package com.mercantiles.controller;

import com.mercantiles.dto.ApiResponse;
import com.mercantiles.dto.ChatbotHistorialDTO;
import com.mercantiles.dto.PageResponse;
import com.mercantiles.service.ChatbotHistorialService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chatbot-historial")
@RequiredArgsConstructor
public class ChatbotHistorialController {

    private final ChatbotHistorialService historialService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatbotHistorialDTO.HistorialUnificado>>> listarTodo(
            @RequestParam(required = false) String tipo) {
        List<ChatbotHistorialDTO.HistorialUnificado> historial = historialService.listarTodo(tipo);
        return ResponseEntity.ok(ApiResponse.success(historial));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ChatbotHistorialDTO.Stats>> obtenerEstadisticas() {
        ChatbotHistorialDTO.Stats stats = historialService.obtenerEstadisticas();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/citas")
    public ResponseEntity<ApiResponse<PageResponse<ChatbotHistorialDTO.CitaResponse>>> listarCitas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ChatbotHistorialDTO.CitaResponse> response = historialService.listarCitas(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/cotizaciones")
    public ResponseEntity<ApiResponse<PageResponse<ChatbotHistorialDTO.CotizacionResponse>>> listarCotizaciones(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ChatbotHistorialDTO.CotizacionResponse> response = historialService.listarCotizaciones(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/encuestas")
    public ResponseEntity<ApiResponse<PageResponse<ChatbotHistorialDTO.EncuestaResponse>>> listarEncuestas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ChatbotHistorialDTO.EncuestaResponse> response = historialService.listarEncuestas(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/documentos")
    public ResponseEntity<ApiResponse<PageResponse<ChatbotHistorialDTO.DocumentoResponse>>> listarDocumentos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ChatbotHistorialDTO.DocumentoResponse> response = historialService.listarDocumentos(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
