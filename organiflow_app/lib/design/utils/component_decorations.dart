import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class ComponentDecorations {
  static OutlineInputBorder inputBorder({
    Color color = AppColors.borderDefault,
  }) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: color),
    );
  }

  static BoxDecoration panelDecoration({bool highlighted = false}) {
    return BoxDecoration(
      color: AppColors.surface2Light,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(
        color: highlighted ? AppColors.primary500 : AppColors.borderDefault,
      ),
      boxShadow: [
        BoxShadow(
          color: AppColors.primary500.withValues(alpha: 0.08),
          blurRadius: 24,
          offset: const Offset(0, 12),
        ),
      ],
    );
  }
}
