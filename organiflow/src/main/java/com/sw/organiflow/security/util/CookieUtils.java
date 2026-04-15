package com.sw.organiflow.security.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CookieUtils {

    @Value("${app.cookie.secure:true}")
    private boolean secure;

    @Value("${app.cookie.same-site:Strict}")
    private String sameSite;

    public static final String ACCESS_TOKEN_COOKIE  = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    /**
     * Agrega el access token como cookie HttpOnly.
     * maxAge en segundos.
     */
    public void addAccessTokenCookie(HttpServletResponse response, String token, long maxAgeMs) {
        addCookie(response, ACCESS_TOKEN_COOKIE, token, (int) (maxAgeMs / 1000));
    }

    /**
     * Agrega el refresh token como cookie HttpOnly con mayor duración.
     */
    public void addRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeMs) {
        addCookie(response, REFRESH_TOKEN_COOKIE, token, (int) (maxAgeMs / 1000));
    }

    /**
     * Borra ambas cookies (logout).
     */
    public void clearAuthCookies(HttpServletResponse response) {
        addCookie(response, ACCESS_TOKEN_COOKIE, "", 0);
        addCookie(response, REFRESH_TOKEN_COOKIE, "", 0);
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);       // No accesible desde JS — protege contra XSS
        cookie.setSecure(secure);       // Solo HTTPS en prod (false en local)
        cookie.setPath("/");            // Disponible en todo el dominio
        cookie.setMaxAge(maxAge);       // 0 = borrar, -1 = session cookie

        // SameSite=Strict: la cookie no se envía en requests cross-site
        // Usamos el header Set-Cookie manualmente para poder agregar SameSite
        // (la API de jakarta.servlet.Cookie no lo soporta aún)
        response.addHeader(
                "Set-Cookie",
                String.format(
                        "%s=%s; Max-Age=%d; Path=/; HttpOnly%s; SameSite=%s",
                        name,
                        value,
                        maxAge,
                        secure ? "; Secure" : "",
                        sameSite
                )
        );
    }
}