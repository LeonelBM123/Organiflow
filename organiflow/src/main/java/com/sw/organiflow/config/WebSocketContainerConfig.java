package com.sw.organiflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
public class WebSocketContainerConfig {

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();

        // Aumenta el buffer de texto nativo de Tomcat a 512 KB
        container.setMaxTextMessageBufferSize(512 * 1024);

        // Opcional: Aumentar también el buffer binario por si acaso
        container.setMaxBinaryMessageBufferSize(512 * 1024);

        // Tiempo máximo de inactividad (evita desconexiones aleatorias)
        container.setMaxSessionIdleTimeout(300000L); // 5 minutos

        return container;
    }
}