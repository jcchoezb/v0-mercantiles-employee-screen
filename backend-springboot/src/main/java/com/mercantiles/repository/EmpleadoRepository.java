package com.mercantiles.repository;

import com.mercantiles.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    
    Optional<Empleado> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<Empleado> findByEstado(Empleado.EstadoEmpleado estado);
    
    @Query("SELECT e FROM Empleado e WHERE e.rol.nombre = :rolNombre")
    List<Empleado> findByRolNombre(String rolNombre);
    
    @Query("SELECT e FROM Empleado e WHERE " +
           "LOWER(e.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(e.apellido) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :busqueda, '%'))")
    List<Empleado> buscar(String busqueda);
}
