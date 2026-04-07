package com.mercantiles.repository;

import com.mercantiles.entity.ChatbotCita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatbotCitaRepository extends JpaRepository<ChatbotCita, Long> {
    
    List<ChatbotCita> findByClienteId(Long clienteId);
    
    List<ChatbotCita> findByConversacionId(Long conversacionId);
    
    List<ChatbotCita> findByEstado(ChatbotCita.EstadoCita estado);
    
    @Query("SELECT c FROM ChatbotCita c WHERE c.fechaCita BETWEEN :inicio AND :fin ORDER BY c.fechaCita ASC")
    List<ChatbotCita> findByFechaCitaBetween(LocalDateTime inicio, LocalDateTime fin);
    
    @Query("SELECT c FROM ChatbotCita c WHERE c.fechaCita > CURRENT_TIMESTAMP AND c.recordatorioEnviado = false")
    List<ChatbotCita> findPendientesRecordatorio();
    
    Page<ChatbotCita> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
