import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Registrar la licencia de Syncfusion.
// Obtén tu clave gratuita en: https://www.syncfusion.com/products/communitylicense
registerLicense('Ngo9BigBOggjHTQxAR8/V1JHaF5cWWdCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdlWXtcdXRWR2ZdVUx1VkdWYEo=');

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
