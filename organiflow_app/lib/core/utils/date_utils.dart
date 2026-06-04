import 'package:intl/intl.dart';

class OFDateUtils {
  static String relative(DateTime dateTime) {
    final difference = DateTime.now().difference(dateTime);
    if (difference.inMinutes < 1) {
      return 'Hace instantes';
    }
    if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes} min';
    }
    if (difference.inHours < 24) {
      return 'Hace ${difference.inHours} h';
    }
    if (difference.inDays < 7) {
      return 'Hace ${difference.inDays} dias';
    }
    return DateFormat('dd/MM/yyyy').format(dateTime);
  }
}
