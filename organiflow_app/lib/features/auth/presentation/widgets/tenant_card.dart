import 'package:flutter/material.dart';

import '../../../../design/components/cards/of_tenant_card.dart';
import '../../domain/entities/tenant_entity.dart';

class TenantCard extends StatelessWidget {
  const TenantCard({
    super.key,
    required this.tenant,
    required this.selected,
    this.onTap,
  });

  final TenantEntity tenant;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return OFTenantCard(
      tenantName: tenant.name,
      role: tenant.role,
      isSelected: selected,
      onTap: onTap,
    );
  }
}
