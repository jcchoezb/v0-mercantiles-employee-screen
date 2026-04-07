package com.mercantiles.repository;

import com.mercantiles.entity.Mensaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {
    
    List<Mensaje> findByConversacionIdOrderByCreatedAtAsc(Long conversacionId);
    
    Page<Mensaje> findByConversacionId(Long conversacionId, Pageable pageable);
    
    @Query("SELECT m FROM Mensaje m WHERE m.conversacion.id = :conversacionId AND m.leido = false AND m.tipoRemitente = 'cliente'")
    List<Mensaje> findNoLeidosByConversacion(Long conversacionId);
    
    @Modifying
    @Query("UPDATE Mensaje m SET m.leido = true WHERE m.conversacion.id = :conversacionId AND m.tipoRemitente = 'cliente'")
    void marcarLeidosByConversacion(Long conversacionId);
    
    @Query("SELECT COUNT(m) FROM Mensaje m WHERE m.conversacion.id = :conversacionId")
    Long countByConversacion(Long conversacionId);
}
