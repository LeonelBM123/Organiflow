import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

enum OFSnackbarType { success, error, warning, info }

class OFSnackbar {
  static void show(
    BuildContext context, {
    required String message,
    OFSnackbarType type = OFSnackbarType.info,
    Duration duration = const Duration(seconds: 3),
    VoidCallback? action,
    String? actionLabel,
  }) {
    final color = switch (type) {
      OFSnackbarType.success => AppColors.statusCompleted,
      OFSnackbarType.error => AppColors.statusRejected,
      OFSnackbarType.warning => AppColors.warningToast,
      OFSnackbarType.info => AppColors.primary500,
    };

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: duration,
        backgroundColor: color,
        content: Text(message),
        action: action != null && actionLabel != null
            ? SnackBarAction(label: actionLabel, onPressed: action)
            : null,
      ),
    );
  }
}
