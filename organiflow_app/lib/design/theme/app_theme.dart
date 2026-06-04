import 'package:flutter/material.dart';

import '../utils/component_decorations.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary500,
      brightness: Brightness.light,
      primary: AppColors.primary500,
      surface: AppColors.surface2Light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.canvasBgLight,
      textTheme: AppTypography.textTheme(AppColors.textPrimaryLight),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface2Light,
        border: ComponentDecorations.inputBorder(),
        enabledBorder: ComponentDecorations.inputBorder(),
        focusedBorder: ComponentDecorations.inputBorder(
          color: AppColors.primary500,
        ),
        errorBorder: ComponentDecorations.inputBorder(
          color: AppColors.statusRejected,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface2Light,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.borderDefault),
        ),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary500,
      brightness: Brightness.dark,
      primary: AppColors.primary500,
      surface: AppColors.surface1Dark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.canvasBgDark,
      textTheme: AppTypography.textTheme(AppColors.textPrimaryDark),
    );
  }
}
