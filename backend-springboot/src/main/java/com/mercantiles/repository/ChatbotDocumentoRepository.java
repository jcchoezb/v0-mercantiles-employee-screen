package com.mercantiles.repository;

import com.mercantiles.entity.ChatbotDocumento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatbotDocumentoRepository extends JpaRepository<ChatbotDocumento, Long> {
    
    List<ChatbotDocumento> findByClienteId(Long clienteId);
    
    List<ChatbotDocumento> findByConversacionId(Long conversacionId);
    
    List<ChatbotDocumento> findByTipoDocumento(String tipoDocumento);
    
    Page<ChatbotDocumento> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
