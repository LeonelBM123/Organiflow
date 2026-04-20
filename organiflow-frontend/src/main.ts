import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Community license — get yours at: https://www.syncfusion.com/products/communitylicense
registerLicense('Ngo9BigBOggjHTQxAR8/V1JHaF5cWWdCekx0QHxbf1x2ZFxMZF9bRnJPIiBoS35RcEVnWHdccXBWRGRUWEdzVEFe');

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
