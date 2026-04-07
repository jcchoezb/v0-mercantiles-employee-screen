package com.mercantiles.service;

import com.mercantiles.dto.ClienteDTO;
import com.mercantiles.dto.PageResponse;
import com.mercantiles.entity.Cliente;
import com.mercantiles.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public PageResponse<ClienteDTO.Response> buscar(String busqueda, String estado, Pageable pageable) {
        Cliente.EstadoCliente estadoEnum = estado != null ? Cliente.EstadoCliente.valueOf(estado) : null;
        Page<Cliente> page = clienteRepository.buscar(busqueda, estadoEnum, pageable);
        List<ClienteDTO.Response> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return PageResponse.from(page, content);
    }

    public List<ClienteDTO.Response> listarTodos() {
        return clienteRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ClienteDTO.Response obtenerPorId(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return mapToResponse(cliente);
    }

    @Transactional
    public ClienteDTO.Response crear(ClienteDTO.CreateRequest request) {
        if (clienteRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Ya existe un cliente con ese email");
        }

        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .empresa(request.getEmpresa())
                .direccion(request.getDireccion())
                .ciudad(request.getCiudad())
                .pais(request.getPais())
                .avatar(request.getAvatar())
                .fuenteOrigen(request.getFuenteOrigen() != null ? request.getFuenteOrigen() : "manual")
                .notas(request.getNotas())
                .estado(Cliente.EstadoCliente.pendiente)
                .build();

        cliente = clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Transactional
    public ClienteDTO.Response actualizar(Long id, ClienteDTO.UpdateRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if (request.getNombre() != null) cliente.setNombre(request.getNombre());
        if (request.getApellido() != null) cliente.setApellido(request.getApellido());
        if (request.getEmail() != null && !request.getEmail().equals(cliente.getEmail())) {
            if (clienteRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Ya existe un cliente con ese email");
            }
            cliente.setEmail(request.getEmail());
        }
        if (request.getTelefono() != null) cliente.setTelefono(request.getTelefono());
        if (request.getEmpresa() != null) cliente.setEmpresa(request.getEmpresa());
        if (request.getDireccion() != null) cliente.setDireccion(request.getDireccion());
        if (request.getCiudad() != null) cliente.setCiudad(request.getCiudad());
        if (request.getPais() != null) cliente.setPais(request.getPais());
        if (request.getAvatar() != null) cliente.setAvatar(request.getAvatar());
        if (request.getEstado() != null) cliente.setEstado(Cliente.EstadoCliente.valueOf(request.getEstado()));
        if (request.getNotas() != null) cliente.setNotas(request.getNotas());

        cliente = clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new RuntimeException("Cliente no encontrado");
        }
        clienteRepository.deleteById(id);
    }

    public ClienteDTO.Stats obtenerEstadisticas() {
        return ClienteDTO.Stats.builder()
                .total(clienteRepository.count())
                .activos(clienteRepository.countByEstado(Cliente.EstadoCliente.activo))
                .pendientes(clienteRepository.countByEstado(Cliente.EstadoCliente.pendiente))
                .inactivos(clienteRepository.countByEstado(Cliente.EstadoCliente.inactivo))
                .build();
    }

    private ClienteDTO.Response mapToResponse(Cliente cliente) {
        return ClienteDTO.Response.builder()
                .id(cliente.getId())
                .nombre(cliente.getNombre())
                .apellido(cliente.getApellido())
                .email(cliente.getEmail())
                .telefono(cliente.getTelefono())
                .empresa(cliente.getEmpresa())
                .direccion(cliente.getDireccion())
                .ciudad(cliente.getCiudad())
                .pais(cliente.getPais())
                .avatar(cliente.getAvatar())
                .estado(cliente.getEstado().name())
                .fuenteOrigen(cliente.getFuenteOrigen())
                .notas(cliente.getNotas())
                .createdAt(cliente.getCreatedAt())
                .updatedAt(cliente.getUpdatedAt())
                .build();
    }
}
