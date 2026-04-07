package com.mercantiles.controller;

import com.mercantiles.dto.ApiResponse;
import com.mercantiles.dto.ConversacionDTO;
import com.mercantiles.dto.MensajeDTO;
import com.mercantiles.service.ConversacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conversaciones")
@RequiredArgsConstructor
public class ConversacionController {

    private final ConversacionService conversacionService;

    @GetMapping("/pendientes")
    public ResponseEntity<ApiResponse<List<ConversacionDTO.Response>>> listarPendientes() {
        List<ConversacionDTO.Response> conversaciones = conversacionService.listarPendientes();
        return ResponseEntity.ok(ApiResponse.success(conversaciones));
    }

    @GetMapping("/mis-conversaciones")
    public ResponseEntity<ApiResponse<List<ConversacionDTO.Response>>> listarMisConversaciones() {
        List<ConversacionDTO.Response> conversaciones = conversacionService.listarMisConversaciones();
        return ResponseEntity.ok(ApiResponse.success(conversaciones));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversacionDTO.ConversacionConMensajes>> obtener(@PathVariable Long id) {
        try {
            ConversacionDTO.ConversacionConMensajes conversacion = conversacionService.obtenerConMensajes(id);
            return ResponseEntity.ok(ApiResponse.success(conversacion));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/tomar")
    public ResponseEntity<ApiResponse<ConversacionDTO.Response>> tomarConversacion(@PathVariable Long id) {
        try {
            ConversacionDTO.Response conversacion = conversacionService.tomarConversacion(id);
            return ResponseEntity.ok(ApiResponse.success(conversacion, "Conversación asignada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/mensajes")
    public ResponseEntity<ApiResponse<MensajeDTO.Response>> enviarMensaje(
            @Valid @RequestBody MensajeDTO.CreateRequest request) {
        try {
            MensajeDTO.Response mensaje = conversacionService.enviarMensaje(request);
            return ResponseEntity.ok(ApiResponse.success(mensaje));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/cerrar")
    public ResponseEntity<ApiResponse<ConversacionDTO.Response>> cerrarConversacion(
            @PathVariable Long id,
            @RequestBody(required = false) ConversacionDTO.CerrarRequest request) {
        try {
            ConversacionDTO.Response conversacion = conversacionService.cerrarConversacion(id, request);
            return ResponseEntity.ok(ApiResponse.success(conversacion, "Conversación cerrada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
