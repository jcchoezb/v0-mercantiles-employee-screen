package com.mercantiles.controller;

import com.mercantiles.dto.ApiResponse;
import com.mercantiles.dto.ClienteDTO;
import com.mercantiles.dto.PageResponse;
import com.mercantiles.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ClienteDTO.Response>>> listar(
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("asc") ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ClienteDTO.Response> response = clienteService.buscar(busqueda, estado, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ClienteDTO.Response>>> listarTodos() {
        List<ClienteDTO.Response> clientes = clienteService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success(clientes));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ClienteDTO.Stats>> obtenerEstadisticas() {
        ClienteDTO.Stats stats = clienteService.obtenerEstadisticas();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClienteDTO.Response>> obtenerPorId(@PathVariable Long id) {
        try {
            ClienteDTO.Response cliente = clienteService.obtenerPorId(id);
            return ResponseEntity.ok(ApiResponse.success(cliente));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClienteDTO.Response>> crear(
            @Valid @RequestBody ClienteDTO.CreateRequest request) {
        try {
            ClienteDTO.Response cliente = clienteService.crear(request);
            return ResponseEntity.ok(ApiResponse.success(cliente, "Cliente creado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClienteDTO.Response>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteDTO.UpdateRequest request) {
        try {
            ClienteDTO.Response cliente = clienteService.actualizar(id, request);
            return ResponseEntity.ok(ApiResponse.success(cliente, "Cliente actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        try {
            clienteService.eliminar(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Cliente eliminado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
