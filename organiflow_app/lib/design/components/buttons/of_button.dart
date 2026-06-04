import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

enum OFButtonVariant { primary, secondary, outline, ghost, destructive }

enum OFButtonSize { sm, md, lg }

class OFButton extends StatelessWidget {
  const OFButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = OFButtonVariant.primary,
    this.size = OFButtonSize.md,
    this.isLoading = false,
    this.isDisabled = false,
    this.leftIcon,
    this.rightIcon,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final OFButtonVariant variant;
  final OFButtonSize size;
  final bool isLoading;
  final bool isDisabled;
  final Widget? leftIcon;
  final Widget? rightIcon;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final buttonStyle = _style();
    final leadingWidgets = isLoading
        ? const <Widget>[
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 10),
          ]
        : leftIcon != null
        ? <Widget>[leftIcon!, const SizedBox(width: 10)]
        : const <Widget>[];
    final trailingWidgets = rightIcon != null
        ? <Widget>[const SizedBox(width: 10), rightIcon!]
        : const <Widget>[];
    final padding = switch (size) {
      OFButtonSize.sm => const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 10,
      ),
      OFButtonSize.md => const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 14,
      ),
      OFButtonSize.lg => const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 18,
      ),
    };

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [...leadingWidgets, Text(label), ...trailingWidgets],
    );

    final button = ElevatedButton(
      onPressed: isDisabled || isLoading ? null : onPressed,
      style: buttonStyle.copyWith(
        padding: WidgetStatePropertyAll(padding),
        minimumSize: WidgetStatePropertyAll(
          Size(fullWidth ? double.infinity : 0, 0),
        ),
      ),
      child: child,
    );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  ButtonStyle _style() {
    final (background, foreground, border) = switch (variant) {
      OFButtonVariant.primary => (
        AppColors.primary500,
        Colors.white,
        AppColors.primary500,
      ),
      OFButtonVariant.secondary => (
        AppColors.surface3Light,
        AppColors.textPrimaryLight,
        AppColors.surface3Light,
      ),
      OFButtonVariant.outline => (
        Colors.transparent,
        AppColors.textPrimaryLight,
        AppColors.borderDefault,
      ),
      OFButtonVariant.ghost => (
        Colors.transparent,
        AppColors.primary500,
        Colors.transparent,
      ),
      OFButtonVariant.destructive => (
        AppColors.statusRejected,
        Colors.white,
        AppColors.statusRejected,
      ),
    };

    return ElevatedButton.styleFrom(
      elevation: 0,
      backgroundColor: background,
      foregroundColor: foreground,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: border),
      ),
    );
  }
}
