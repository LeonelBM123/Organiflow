import 'package:flutter/material.dart';

class OFAppBar extends StatelessWidget implements PreferredSizeWidget {
  const OFAppBar({
    super.key,
    this.title,
    this.leading,
    this.actions,
    this.showBackButton = false,
    this.customTitle,
    this.centerTitle = false,
    this.backgroundColor,
  });

  final String? title;
  final Widget? leading;
  final List<Widget>? actions;
  final bool showBackButton;
  final Widget? customTitle;
  final bool centerTitle;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      leading: showBackButton ? const BackButton() : leading,
      title: customTitle ?? (title != null ? Text(title!) : null),
      actions: actions,
      centerTitle: centerTitle,
      backgroundColor: backgroundColor,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
