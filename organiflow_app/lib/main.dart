import 'package:flutter/material.dart';

import 'app.dart';
import 'core/services/notification_bootstrap_service.dart';
import 'injection_container.dart' as di;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationBootstrapService.initialize();
  await di.init();
  runApp(const OrganiflowApp());
}
