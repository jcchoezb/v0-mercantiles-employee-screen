package com.mercantiles.security;

import com.mercantiles.entity.Empleado;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final Empleado empleado;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + empleado.getRol().getNombre().toUpperCase())
        );
    }

    @Override
    public String getPassword() {
        return empleado.getPassword();
    }

    @Override
    public String getUsername() {
        return empleado.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return empleado.getEstado() != Empleado.EstadoEmpleado.suspendido;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return empleado.getEstado() == Empleado.EstadoEmpleado.activo;
    }
}
