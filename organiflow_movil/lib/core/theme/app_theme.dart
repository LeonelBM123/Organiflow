import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

abstract final class AppColors {
  // ── Light (Basado en el Dashboard Neumórfico) ────────────────────────
  static const lBackground = Color(
    0xFFF4F7FB,
  ); // Fondo general ligerísimamente gris/azul
  static const lForeground = Color(0xFF1E2024); // Texto principal oscuro
  static const lCard = Color(
    0xFFFFFFFF,
  ); // Tarjetas en blanco puro para resaltar
  static const lCardForeground = Color(0xFF1E2024);
  static const lPopover = Color(0xFFFFFFFF);
  static const lPopoverForeground = Color(0xFF1E2024);
  static const lPrimary = Color(
    0xFF1877F2,
  ); // El azul vibrante de los botones (T1, Upgrade)
  static const lPrimaryForeground = Color(
    0xFFFFFFFF,
  ); // Texto blanco sobre botones
  static const lSecondary = Color(
    0xFFE8EEF6,
  ); // Gris/azul muy suave para elementos inactivos
  static const lSecondaryForeground = Color(0xFF475569);
  static const lMuted = Color(0xFFF1F5F9);
  static const lMutedForeground = Color(
    0xFF8B95A5,
  ); // Textos secundarios (como el "MORE")
  static const lAccent = Color(
    0xFFE8EEF6,
  ); // Color al pasar el cursor o seleccionar
  static const lAccentForeground = Color(
    0xFF1877F2,
  ); // Texto azul al hacer hover
  static const lDestructive = Color(
    0xFFFF4D4F,
  ); // El rojo/naranja del estado "No Pass"
  static const lBorder = Color(0xFFE2E8F0); // Bordes muy sutiles
  static const lInput = Color(0xFFF1F5F9);
  static const lRing = Color(
    0xFF1877F2,
  ); // Aro de focus del mismo color primario

  // Chart – light (Basado en el gráfico de pastel de la imagen)
  static const chart1 = Color(0xFF1877F2); // Azul (UK)
  static const chart2 = Color(0xFFFF4D4F); // Rosa/Rojo (USA)
  static const chart3 = Color(0xFF10B981); // Verde vibrante (Canada / Pass)
  static const chart4 = Color(0xFF8B5CF6); // Morado (China)
  static const chart5 = Color(0xFF06B6D4); // Cian (Extra)

  // ── Dark (Valores de reserva por si la librería lo exige) ─────────────
  static const dBackground = Color(0xFF0F172A);
  static const dForeground = Color(0xFFF8FAFC);
  static const dCard = Color(0xFF1E293B);
  static const dCardForeground = Color(0xFFF8FAFC);
  static const dPopover = Color(0xFF1E293B);
  static const dPopoverForeground = Color(0xFFF8FAFC);
  static const dPrimary = Color(0xFF3B82F6);
  static const dPrimaryForeground = Color(0xFFFFFFFF);
  static const dSecondary = Color(0xFF334155);
  static const dSecondaryForeground = Color(0xFFF8FAFC);
  static const dMuted = Color(0xFF334155);
  static const dMutedForeground = Color(0xFF94A3B8);
  static const dAccent = Color(0xFF334155);
  static const dAccentForeground = Color(0xFFF8FAFC);
  static const dDestructive = Color(0xFFEF4444);
  static const dBorder = Color(0xFF334155);
  static const dInput = Color(0xFF1E293B);
  static const dRing = Color(0xFF3B82F6);
}

abstract final class AppTheme {
  // ── Radio de bordes (Suaves y redondeados como en la imagen) ─────────
  static const _borderRadius = BorderRadius.all(Radius.circular(12));

  // ══════════════════════════════════════════════════════════════════════
  //  LIGHT THEME
  // ══════════════════════════════════════════════════════════════════════
  static final ShadThemeData light = ShadThemeData(
    brightness: Brightness.light,
    colorScheme: const ShadColorScheme(
      background: AppColors.lBackground,
      foreground: AppColors.lForeground,
      card: AppColors.lCard,
      cardForeground: AppColors.lCardForeground,
      popover: AppColors.lPopover,
      popoverForeground: AppColors.lPopoverForeground,
      primary: AppColors.lPrimary,
      primaryForeground: AppColors.lPrimaryForeground,
      secondary: AppColors.lSecondary,
      secondaryForeground: AppColors.lSecondaryForeground,
      muted: AppColors.lMuted,
      mutedForeground: AppColors.lMutedForeground,
      accent: AppColors.lAccent,
      accentForeground: AppColors.lAccentForeground,
      destructive: AppColors.lDestructive,
      destructiveForeground: AppColors.lPrimaryForeground,
      border: AppColors.lBorder,
      input: AppColors.lInput,
      ring: AppColors.lRing,
      // Color de selección de texto: primary con 20% opacidad
      selection: Color(0x331877F2),
    ),
    radius: _borderRadius,
  );

  // ══════════════════════════════════════════════════════════════════════
  //  DARK THEME
  // ══════════════════════════════════════════════════════════════════════
  static final ShadThemeData dark = ShadThemeData(
    brightness: Brightness.dark,
    colorScheme: const ShadColorScheme(
      background: AppColors.dBackground,
      foreground: AppColors.dForeground,
      card: AppColors.dCard,
      cardForeground: AppColors.dCardForeground,
      popover: AppColors.dPopover,
      popoverForeground: AppColors.dPopoverForeground,
      primary: AppColors.dPrimary,
      primaryForeground: AppColors.dPrimaryForeground,
      secondary: AppColors.dSecondary,
      secondaryForeground: AppColors.dSecondaryForeground,
      muted: AppColors.dMuted,
      mutedForeground: AppColors.dMutedForeground,
      accent: AppColors.dAccent,
      accentForeground: AppColors.dAccentForeground,
      destructive: AppColors.dDestructive,
      destructiveForeground: AppColors.dPrimaryForeground,
      border: AppColors.dBorder,
      input: AppColors.dInput,
      ring: AppColors.dRing,
      // Color de selección de texto: primary con 30% opacidad
      selection: Color(0x4D3B82F6),
    ),
    radius: _borderRadius,
  );
}
