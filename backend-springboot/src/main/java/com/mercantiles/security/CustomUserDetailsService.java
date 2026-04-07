package com.mercantiles.security;

import com.mercantiles.entity.Empleado;
import com.mercantiles.repository.EmpleadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final EmpleadoRepository empleadoRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Empleado empleado = empleadoRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Empleado no encontrado: " + email));
        
        return new CustomUserDetails(empleado);
    }
}
