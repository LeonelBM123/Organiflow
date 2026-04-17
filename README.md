
```
Organiflow
├─ .claude
│  └─ settings.local.json
├─ .claudeignore
├─ CLAUDE.md
├─ docs
│  ├─ FRONTEND_ARCHITECTURE.md
│  └─ skills
│     ├─ crud-fullstack.md
│     ├─ documentar-feature.md
│     ├─ nueva-feature-angular.md
│     └─ nuevo-modulo-backend.md
├─ organiflow
│  ├─ .idea
│  │  ├─ compiler.xml
│  │  ├─ dataSources
│  │  │  ├─ data_sources_history.xml
│  │  │  └─ f3772042-cce5-4905-8037-51ab5c792efb.xml
│  │  ├─ dataSources.local.xml
│  │  ├─ dataSources.xml
│  │  ├─ encodings.xml
│  │  ├─ httpRequests
│  │  │  ├─ 2026-04-13T000209.403.json
│  │  │  ├─ 2026-04-13T001436.403.json
│  │  │  ├─ http-client.cookies
│  │  │  └─ http-requests-log.http
│  │  ├─ jarRepositories.xml
│  │  ├─ misc.xml
│  │  ├─ organiflow.iml
│  │  ├─ swagger-settings.xml
│  │  ├─ vcs.xml
│  │  └─ workspace.xml
│  ├─ .mvn
│  │  └─ wrapper
│  │     └─ maven-wrapper.properties
│  ├─ HELP.md
│  ├─ mvnw
│  ├─ mvnw.cmd
│  ├─ pom.xml
│  ├─ README.md
│  ├─ src
│  │  ├─ main
│  │  │  ├─ java
│  │  │  │  └─ com
│  │  │  │     └─ sw
│  │  │  │        └─ organiflow
│  │  │  │           ├─ config
│  │  │  │           │  ├─ FirebaseConfig.java
│  │  │  │           │  ├─ MongoConfig.java
│  │  │  │           │  └─ SecurityConfig.java
│  │  │  │           ├─ modules
│  │  │  │           │  ├─ auth
│  │  │  │           │  │  ├─ controllers
│  │  │  │           │  │  │  └─ AuthController.java
│  │  │  │           │  │  ├─ dtos
│  │  │  │           │  │  │  ├─ AuthResponse.java
│  │  │  │           │  │  │  ├─ LoginRequest.java
│  │  │  │           │  │  │  ├─ LoginResponse.java
│  │  │  │           │  │  │  └─ TenantSelectionRequest.java
│  │  │  │           │  │  ├─ models
│  │  │  │           │  │  │  └─ RefreshToken.java
│  │  │  │           │  │  ├─ repositories
│  │  │  │           │  │  │  └─ RefreshTokenRepository.java
│  │  │  │           │  │  └─ services
│  │  │  │           │  │     ├─ AuthService.java
│  │  │  │           │  │     ├─ CustomUserDetailsService.java
│  │  │  │           │  │     └─ RefreshTokenService.java
│  │  │  │           │  ├─ notifications
│  │  │  │           │  │  ├─ controllers
│  │  │  │           │  │  │  └─ DeviceController.java
│  │  │  │           │  │  ├─ models
│  │  │  │           │  │  │  └─ UserDevice.java
│  │  │  │           │  │  └─ services
│  │  │  │           │  │     └─ PushNotificationService.java
│  │  │  │           │  ├─ tenant
│  │  │  │           │  │  ├─ models
│  │  │  │           │  │  │  └─ Tenant.java
│  │  │  │           │  │  └─ repositories
│  │  │  │           │  │     └─ TenantRepository.java
│  │  │  │           │  └─ user
│  │  │  │           │     ├─ controllers
│  │  │  │           │     │  └─ UserController.java
│  │  │  │           │     ├─ dtos
│  │  │  │           │     │  ├─ UserRequest.java
│  │  │  │           │     │  └─ UserResponse.java
│  │  │  │           │     ├─ models
│  │  │  │           │     │  ├─ User.java
│  │  │  │           │     │  └─ UserTenantRole.java
│  │  │  │           │     ├─ repositories
│  │  │  │           │     │  ├─ UserRepository.java
│  │  │  │           │     │  └─ UserTenantRoleRepository.java
│  │  │  │           │     └─ services
│  │  │  │           │        └─ UserService.java
│  │  │  │           ├─ OrganiflowApplication.java
│  │  │  │           ├─ security
│  │  │  │           │  ├─ handlers
│  │  │  │           │  │  └─ CustomAuthenticationEntryPoint.java
│  │  │  │           │  ├─ jwt
│  │  │  │           │  │  ├─ JwtAuthFilter.java
│  │  │  │           │  │  └─ JwtService.java
│  │  │  │           │  └─ util
│  │  │  │           │     ├─ CookieUtils.java
│  │  │  │           │     └─ SecurityUtils.java
│  │  │  │           └─ shared
│  │  │  │              ├─ audit
│  │  │  │              │  └─ AuditDocument.java
│  │  │  │              └─ enums
│  │  │  │                 └─ UserRole.java
│  │  │  └─ resources
│  │  │     ├─ application.properties
│  │  │     ├─ META-INF
│  │  │     │  └─ additional-spring-configuration-metadata.json
│  │  │     ├─ static
│  │  │     └─ templates
│  │  └─ test
│  │     └─ java
│  │        └─ com
│  │           └─ sw
│  │              └─ organiflow
│  │                 └─ OrganiflowApplicationTests.java
│  └─ target
│     ├─ classes
│     │  ├─ application.properties
│     │  ├─ com
│     │  │  └─ sw
│     │  │     └─ organiflow
│     │  │        ├─ config
│     │  │        │  ├─ FirebaseConfig.class
│     │  │        │  ├─ MongoConfig.class
│     │  │        │  └─ SecurityConfig.class
│     │  │        ├─ modules
│     │  │        │  ├─ auth
│     │  │        │  │  ├─ controllers
│     │  │        │  │  │  └─ AuthController.class
│     │  │        │  │  ├─ dtos
│     │  │        │  │  │  ├─ AuthResponse$AuthResponseBuilder.class
│     │  │        │  │  │  ├─ AuthResponse.class
│     │  │        │  │  │  ├─ LoginRequest.class
│     │  │        │  │  │  ├─ LoginResponse$LoginResponseBuilder.class
│     │  │        │  │  │  ├─ LoginResponse$TenantInfo$TenantInfoBuilder.class
│     │  │        │  │  │  ├─ LoginResponse$TenantInfo.class
│     │  │        │  │  │  ├─ LoginResponse.class
│     │  │        │  │  │  └─ TenantSelectionRequest.class
│     │  │        │  │  ├─ models
│     │  │        │  │  │  ├─ RefreshToken$RefreshTokenBuilder.class
│     │  │        │  │  │  └─ RefreshToken.class
│     │  │        │  │  ├─ repositories
│     │  │        │  │  │  └─ RefreshTokenRepository.class
│     │  │        │  │  └─ services
│     │  │        │  │     ├─ AuthService.class
│     │  │        │  │     ├─ CustomUserDetailsService.class
│     │  │        │  │     └─ RefreshTokenService.class
│     │  │        │  ├─ notifications
│     │  │        │  │  ├─ controllers
│     │  │        │  │  │  └─ DeviceController.class
│     │  │        │  │  ├─ models
│     │  │        │  │  │  ├─ UserDevice$UserDeviceBuilder.class
│     │  │        │  │  │  └─ UserDevice.class
│     │  │        │  │  └─ services
│     │  │        │  │     └─ PushNotificationService.class
│     │  │        │  ├─ tenant
│     │  │        │  │  ├─ models
│     │  │        │  │  │  ├─ Tenant$Settings$SettingsBuilder.class
│     │  │        │  │  │  ├─ Tenant$Settings.class
│     │  │        │  │  │  ├─ Tenant$TenantBuilder.class
│     │  │        │  │  │  └─ Tenant.class
│     │  │        │  │  └─ repositories
│     │  │        │  │     └─ TenantRepository.class
│     │  │        │  └─ user
│     │  │        │     ├─ controllers
│     │  │        │     │  └─ UserController.class
│     │  │        │     ├─ dtos
│     │  │        │     │  ├─ UserRequest.class
│     │  │        │     │  ├─ UserResponse$UserResponseBuilder.class
│     │  │        │     │  └─ UserResponse.class
│     │  │        │     ├─ models
│     │  │        │     │  ├─ User$UserBuilder.class
│     │  │        │     │  ├─ User.class
│     │  │        │     │  ├─ UserTenantRole$UserTenantRoleBuilder.class
│     │  │        │     │  └─ UserTenantRole.class
│     │  │        │     ├─ repositories
│     │  │        │     │  ├─ UserRepository.class
│     │  │        │     │  └─ UserTenantRoleRepository.class
│     │  │        │     └─ services
│     │  │        │        └─ UserService.class
│     │  │        ├─ OrganiflowApplication.class
│     │  │        ├─ security
│     │  │        │  ├─ handlers
│     │  │        │  │  └─ CustomAuthenticationEntryPoint.class
│     │  │        │  ├─ jwt
│     │  │        │  │  ├─ JwtAuthFilter.class
│     │  │        │  │  └─ JwtService.class
│     │  │        │  └─ util
│     │  │        │     ├─ CookieUtils.class
│     │  │        │     └─ SecurityUtils.class
│     │  │        └─ shared
│     │  │           ├─ audit
│     │  │           │  └─ AuditDocument.class
│     │  │           └─ enums
│     │  │              └─ UserRole.class
│     │  └─ META-INF
│     │     └─ additional-spring-configuration-metadata.json
│     ├─ generated-sources
│     │  └─ annotations
│     ├─ generated-test-sources
│     │  └─ test-annotations
│     └─ test-classes
│        └─ com
│           └─ sw
│              └─ organiflow
│                 └─ OrganiflowApplicationTests.class
├─ organiflow-frontend
│  ├─ .angular
│  │  └─ cache
│  │     └─ 21.2.7
│  │        └─ organiflow-frontend
│  │           ├─ .tsbuildinfo
│  │           ├─ angular-compiler.db
│  │           ├─ angular-compiler.db-lock
│  │           └─ vite
│  │              ├─ com.chrome.devtools.json
│  │              └─ deps
│  │                 ├─ @angular_common.js
│  │                 ├─ @angular_common.js.map
│  │                 ├─ @angular_common_http.js
│  │                 ├─ @angular_common_http.js.map
│  │                 ├─ @angular_core.js
│  │                 ├─ @angular_core.js.map
│  │                 ├─ @angular_forms.js
│  │                 ├─ @angular_forms.js.map
│  │                 ├─ @angular_platform-browser.js
│  │                 ├─ @angular_platform-browser.js.map
│  │                 ├─ @angular_router.js
│  │                 ├─ @angular_router.js.map
│  │                 ├─ chunk-DEZUNF6K.js
│  │                 ├─ chunk-DEZUNF6K.js.map
│  │                 ├─ chunk-LHMWBY26.js
│  │                 ├─ chunk-LHMWBY26.js.map
│  │                 ├─ chunk-ODDQ4QU6.js
│  │                 ├─ chunk-ODDQ4QU6.js.map
│  │                 ├─ chunk-PJVWDKLX.js
│  │                 ├─ chunk-PJVWDKLX.js.map
│  │                 ├─ chunk-XWLC7AVB.js
│  │                 ├─ chunk-XWLC7AVB.js.map
│  │                 ├─ chunk-YX5DSSRB.js
│  │                 ├─ chunk-YX5DSSRB.js.map
│  │                 ├─ ngx-sonner.js
│  │                 ├─ ngx-sonner.js.map
│  │                 ├─ package.json
│  │                 ├─ rxjs.js
│  │                 ├─ rxjs.js.map
│  │                 └─ _metadata.json
│  ├─ .claude
│  │  └─ CLAUDE.md
│  ├─ .editorconfig
│  ├─ .postcssrc.json
│  ├─ .prettierrc
│  ├─ AGENTS.md
│  ├─ angular.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ favicon.ico
│  ├─ README.md
│  ├─ src
│  │  ├─ app
│  │  │  ├─ app.config.ts
│  │  │  ├─ app.html
│  │  │  ├─ app.routes.ts
│  │  │  ├─ app.scss
│  │  │  ├─ app.spec.ts
│  │  │  ├─ app.ts
│  │  │  ├─ core
│  │  │  │  ├─ constants
│  │  │  │  │  └─ api.constants.ts
│  │  │  │  ├─ enums
│  │  │  │  │  └─ user-role.enum.ts
│  │  │  │  ├─ guards
│  │  │  │  │  ├─ auth.guard.ts
│  │  │  │  │  └─ role.guard.ts
│  │  │  │  ├─ interceptors
│  │  │  │  │  ├─ auth.interceptor.ts
│  │  │  │  │  └─ error.interceptor.ts
│  │  │  │  ├─ models
│  │  │  │  │  ├─ auth.model.ts
│  │  │  │  │  └─ user.model.ts
│  │  │  │  └─ services
│  │  │  │     ├─ auth.service.ts
│  │  │  │     ├─ storage.service.ts
│  │  │  │     └─ theme.service.ts
│  │  │  ├─ features
│  │  │  │  ├─ ai
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ auth
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ login
│  │  │  │  │  │  │  ├─ login.component.html
│  │  │  │  │  │  │  ├─ login.component.scss
│  │  │  │  │  │  │  └─ login.component.ts
│  │  │  │  │  │  └─ select-tenant
│  │  │  │  │  │     ├─ select-tenant.component.html
│  │  │  │  │  │     ├─ select-tenant.component.scss
│  │  │  │  │  │     └─ select-tenant.component.ts
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ dashboard
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ admin-dashboard
│  │  │  │  │  │  │  └─ admin-dashboard.component.ts
│  │  │  │  │  │  ├─ officer-dashboard
│  │  │  │  │  │  │  └─ officer-dashboard.component.ts
│  │  │  │  │  │  └─ user-dashboard
│  │  │  │  │  │     └─ user-dashboard.component.ts
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ departments
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ executions
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ forms
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ nodes
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ notifications
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  ├─ tasks
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ models
│  │  │  │  │  └─ services
│  │  │  │  └─ workflows
│  │  │  │     ├─ components
│  │  │  │     ├─ models
│  │  │  │     └─ services
│  │  │  ├─ layouts
│  │  │  │  ├─ admin-layout
│  │  │  │  │  ├─ admin-layout.component.html
│  │  │  │  │  ├─ admin-layout.component.scss
│  │  │  │  │  ├─ admin-layout.component.ts
│  │  │  │  │  └─ components
│  │  │  │  ├─ main-layout
│  │  │  │  ├─ officer-layout
│  │  │  │  │  ├─ components
│  │  │  │  │  ├─ officer-layout.component.html
│  │  │  │  │  ├─ officer-layout.component.scss
│  │  │  │  │  └─ officer-layout.component.ts
│  │  │  │  ├─ public-layout
│  │  │  │  └─ user-layout
│  │  │  │     ├─ components
│  │  │  │     ├─ user-layout.component.html
│  │  │  │     ├─ user-layout.component.scss
│  │  │  │     └─ user-layout.component.ts
│  │  │  └─ shared
│  │  │     ├─ components
│  │  │     ├─ directives
│  │  │     ├─ pipes
│  │  │     ├─ utils
│  │  │     └─ validators
│  │  ├─ assets
│  │  │  ├─ fonts
│  │  │  ├─ icons
│  │  │  ├─ images
│  │  │  └─ styles
│  │  │     ├─ _animations.scss
│  │  │     ├─ _mixins.scss
│  │  │     ├─ _typography.scss
│  │  │     └─ _variables.scss
│  │  ├─ environments
│  │  │  └─ environment.ts
│  │  ├─ index.html
│  │  ├─ main.ts
│  │  ├─ styles.scss
│  │  └─ tailwind.css
│  ├─ tailwind.config.js
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  └─ tsconfig.spec.json
└─ organiflow_movil
   ├─ .dart_tool
   │  ├─ build
   │  │  ├─ asset_graph.json
   │  │  ├─ entrypoint
   │  │  │  ├─ build.dart
   │  │  │  ├─ build.dart.dill
   │  │  │  ├─ build.dart.dill.deps
   │  │  │  └─ build.dart.dill.digest
   │  │  └─ generated
   │  │     └─ organiflow_movil
   │  │        └─ lib
   │  │           ├─ core
   │  │           │  └─ routing
   │  │           │     └─ app_router.riverpod.g.part
   │  │           └─ features
   │  │              └─ auth
   │  │                 ├─ data
   │  │                 │  └─ auth_repository.riverpod.g.part
   │  │                 └─ presentation
   │  │                    └─ provider
   │  │                       └─ auth_controller.riverpod.g.part
   │  ├─ build_resolvers
   │  │  ├─ sdk.sum
   │  │  └─ sdk.sum.deps
   │  ├─ dartpad
   │  │  └─ web_plugin_registrant.dart
   │  ├─ extension_discovery
   │  │  └─ vs_code.json
   │  ├─ hooks_runner
   │  │  ├─ objective_c
   │  │  │  └─ 8e04c28b44
   │  │  │     ├─ .lock
   │  │  │     ├─ dependencies.dependencies_hash_file.json
   │  │  │     ├─ hook.dependencies_hash_file.json
   │  │  │     ├─ hook.dill
   │  │  │     ├─ hook.dill.d
   │  │  │     ├─ input.json
   │  │  │     ├─ out
   │  │  │     ├─ output.json
   │  │  │     ├─ stderr.txt
   │  │  │     └─ stdout.txt
   │  │  └─ shared
   │  │     └─ objective_c
   │  │        ├─ .lock
   │  │        └─ build
   │  │           └─ 8e04c28b44
   │  ├─ native_assets
   │  ├─ native_assets.yaml
   │  ├─ package_config.json
   │  ├─ package_graph.json
   │  ├─ pub
   │  │  └─ bin
   │  │     └─ build_runner
   │  │        └─ build_runner.dart-3.11.1.snapshot
   │  └─ version
   ├─ .env
   ├─ .flutter-plugins-dependencies
   ├─ .idea
   │  ├─ libraries
   │  │  ├─ Dart_SDK.xml
   │  │  └─ KotlinJavaRuntime.xml
   │  ├─ modules.xml
   │  ├─ runConfigurations
   │  │  └─ main_dart.xml
   │  └─ workspace.xml
   ├─ .metadata
   ├─ analysis_options.yaml
   ├─ android
   │  ├─ app
   │  │  ├─ build.gradle.kts
   │  │  └─ src
   │  │     ├─ debug
   │  │     │  └─ AndroidManifest.xml
   │  │     ├─ main
   │  │     │  ├─ AndroidManifest.xml
   │  │     │  ├─ java
   │  │     │  │  └─ io
   │  │     │  │     └─ flutter
   │  │     │  │        └─ plugins
   │  │     │  │           └─ GeneratedPluginRegistrant.java
   │  │     │  ├─ kotlin
   │  │     │  │  └─ com
   │  │     │  │     └─ example
   │  │     │  │        └─ organiflow_movil
   │  │     │  │           └─ MainActivity.kt
   │  │     │  └─ res
   │  │     │     ├─ drawable
   │  │     │     │  └─ launch_background.xml
   │  │     │     ├─ drawable-v21
   │  │     │     │  └─ launch_background.xml
   │  │     │     ├─ mipmap-hdpi
   │  │     │     │  └─ ic_launcher.png
   │  │     │     ├─ mipmap-mdpi
   │  │     │     │  └─ ic_launcher.png
   │  │     │     ├─ mipmap-xhdpi
   │  │     │     │  └─ ic_launcher.png
   │  │     │     ├─ mipmap-xxhdpi
   │  │     │     │  └─ ic_launcher.png
   │  │     │     ├─ mipmap-xxxhdpi
   │  │     │     │  └─ ic_launcher.png
   │  │     │     ├─ values
   │  │     │     │  └─ styles.xml
   │  │     │     └─ values-night
   │  │     │        └─ styles.xml
   │  │     └─ profile
   │  │        └─ AndroidManifest.xml
   │  ├─ build.gradle.kts
   │  ├─ gradle
   │  │  └─ wrapper
   │  │     ├─ gradle-wrapper.jar
   │  │     └─ gradle-wrapper.properties
   │  ├─ gradle.properties
   │  ├─ gradlew
   │  ├─ gradlew.bat
   │  ├─ local.properties
   │  ├─ organiflow_movil_android.iml
   │  └─ settings.gradle.kts
   ├─ ios
   │  ├─ Flutter
   │  │  ├─ AppFrameworkInfo.plist
   │  │  ├─ Debug.xcconfig
   │  │  ├─ ephemeral
   │  │  │  ├─ flutter_lldbinit
   │  │  │  └─ flutter_lldb_helper.py
   │  │  ├─ flutter_export_environment.sh
   │  │  ├─ Generated.xcconfig
   │  │  └─ Release.xcconfig
   │  ├─ Runner
   │  │  ├─ AppDelegate.swift
   │  │  ├─ Assets.xcassets
   │  │  │  ├─ AppIcon.appiconset
   │  │  │  │  ├─ Contents.json
   │  │  │  │  ├─ Icon-App-1024x1024@1x.png
   │  │  │  │  ├─ Icon-App-20x20@1x.png
   │  │  │  │  ├─ Icon-App-20x20@2x.png
   │  │  │  │  ├─ Icon-App-20x20@3x.png
   │  │  │  │  ├─ Icon-App-29x29@1x.png
   │  │  │  │  ├─ Icon-App-29x29@2x.png
   │  │  │  │  ├─ Icon-App-29x29@3x.png
   │  │  │  │  ├─ Icon-App-40x40@1x.png
   │  │  │  │  ├─ Icon-App-40x40@2x.png
   │  │  │  │  ├─ Icon-App-40x40@3x.png
   │  │  │  │  ├─ Icon-App-60x60@2x.png
   │  │  │  │  ├─ Icon-App-60x60@3x.png
   │  │  │  │  ├─ Icon-App-76x76@1x.png
   │  │  │  │  ├─ Icon-App-76x76@2x.png
   │  │  │  │  └─ Icon-App-83.5x83.5@2x.png
   │  │  │  └─ LaunchImage.imageset
   │  │  │     ├─ Contents.json
   │  │  │     ├─ LaunchImage.png
   │  │  │     ├─ LaunchImage@2x.png
   │  │  │     ├─ LaunchImage@3x.png
   │  │  │     └─ README.md
   │  │  ├─ Base.lproj
   │  │  │  ├─ LaunchScreen.storyboard
   │  │  │  └─ Main.storyboard
   │  │  ├─ GeneratedPluginRegistrant.h
   │  │  ├─ GeneratedPluginRegistrant.m
   │  │  ├─ Info.plist
   │  │  ├─ Runner-Bridging-Header.h
   │  │  └─ SceneDelegate.swift
   │  ├─ Runner.xcodeproj
   │  │  ├─ project.pbxproj
   │  │  ├─ project.xcworkspace
   │  │  │  ├─ contents.xcworkspacedata
   │  │  │  └─ xcshareddata
   │  │  │     ├─ IDEWorkspaceChecks.plist
   │  │  │     └─ WorkspaceSettings.xcsettings
   │  │  └─ xcshareddata
   │  │     └─ xcschemes
   │  │        └─ Runner.xcscheme
   │  ├─ Runner.xcworkspace
   │  │  ├─ contents.xcworkspacedata
   │  │  └─ xcshareddata
   │  │     ├─ IDEWorkspaceChecks.plist
   │  │     └─ WorkspaceSettings.xcsettings
   │  └─ RunnerTests
   │     └─ RunnerTests.swift
   ├─ lib
   │  ├─ core
   │  │  ├─ network
   │  │  │  ├─ auth_interceptor.dart
   │  │  │  ├─ dio_provider.dart
   │  │  │  └─ token_storage.dart
   │  │  ├─ routing
   │  │  │  ├─ app_router.dart
   │  │  │  └─ app_router.g.dart
   │  │  └─ theme
   │  │     ├─ app_theme.dart
   │  │     └─ theme_provider.dart
   │  ├─ features
   │  │  ├─ auth
   │  │  │  ├─ data
   │  │  │  │  ├─ auth_repository.dart
   │  │  │  │  ├─ auth_repository.g.dart
   │  │  │  │  └─ models
   │  │  │  │     └─ login_response.dart
   │  │  │  ├─ domain
   │  │  │  │  └─ user_moderl.dart
   │  │  │  └─ presentation
   │  │  │     ├─ provider
   │  │  │     │  ├─ auth_controller.dart
   │  │  │     │  └─ auth_controller.g.dart
   │  │  │     ├─ screens
   │  │  │     │  └─ login_screen.dart
   │  │  │     └─ widgets
   │  │  └─ home
   │  │     ├─ data
   │  │     ├─ domain
   │  │     └─ presentation
   │  │        └─ main_layout_screen.dart
   │  └─ main.dart
   ├─ linux
   │  ├─ CMakeLists.txt
   │  ├─ flutter
   │  │  ├─ CMakeLists.txt
   │  │  ├─ ephemeral
   │  │  │  └─ .plugin_symlinks
   │  │  │     ├─ flutter_secure_storage_linux
   │  │  │     │  ├─ CHANGELOG.md
   │  │  │     │  ├─ LICENSE
   │  │  │     │  ├─ linux
   │  │  │     │  │  ├─ CMakeLists.txt
   │  │  │     │  │  ├─ flutter_secure_storage_linux_plugin.cc
   │  │  │     │  │  └─ include
   │  │  │     │  │     ├─ FHashTable.hpp
   │  │  │     │  │     ├─ flutter_secure_storage_linux
   │  │  │     │  │     │  └─ flutter_secure_storage_linux_plugin.h
   │  │  │     │  │     ├─ json.hpp
   │  │  │     │  │     └─ Secret.hpp
   │  │  │     │  ├─ pubspec.yaml
   │  │  │     │  └─ README.md
   │  │  │     ├─ jni
   │  │  │     │  ├─ analysis_options.yaml
   │  │  │     │  ├─ android
   │  │  │     │  │  ├─ build.gradle
   │  │  │     │  │  ├─ consumer-rules.pro
   │  │  │     │  │  ├─ README.md
   │  │  │     │  │  ├─ settings.gradle
   │  │  │     │  │  └─ src
   │  │  │     │  │     └─ main
   │  │  │     │  │        ├─ AndroidManifest.xml
   │  │  │     │  │        └─ java
   │  │  │     │  │           └─ com
   │  │  │     │  │              └─ github
   │  │  │     │  │                 └─ dart_lang
   │  │  │     │  │                    └─ jni
   │  │  │     │  │                       └─ JniPlugin.java
   │  │  │     │  ├─ bin
   │  │  │     │  │  └─ setup.dart
   │  │  │     │  ├─ CHANGELOG.md
   │  │  │     │  ├─ dart_test.yaml
   │  │  │     │  ├─ example
   │  │  │     │  │  ├─ analysis_options.yaml
   │  │  │     │  │  ├─ android
   │  │  │     │  │  │  ├─ app
   │  │  │     │  │  │  │  ├─ build.gradle
   │  │  │     │  │  │  │  └─ src
   │  │  │     │  │  │  │     ├─ debug
   │  │  │     │  │  │  │     │  └─ AndroidManifest.xml
   │  │  │     │  │  │  │     ├─ main
   │  │  │     │  │  │  │     │  ├─ AndroidManifest.xml
   │  │  │     │  │  │  │     │  ├─ java
   │  │  │     │  │  │  │     │  │  ├─ com
   │  │  │     │  │  │  │     │  │  │  └─ github
   │  │  │     │  │  │  │     │  │  │     └─ dart_lang
   │  │  │     │  │  │  │     │  │  │        └─ jni_example
   │  │  │     │  │  │  │     │  │  │           └─ Toaster.java
   │  │  │     │  │  │  │     │  │  └─ io
   │  │  │     │  │  │  │     │  │     └─ flutter
   │  │  │     │  │  │  │     │  │        └─ plugins
   │  │  │     │  │  │  │     │  ├─ kotlin
   │  │  │     │  │  │  │     │  │  └─ dev
   │  │  │     │  │  │  │     │  │     └─ dart
   │  │  │     │  │  │  │     │  │        └─ jni_example
   │  │  │     │  │  │  │     │  │           └─ MainActivity.kt
   │  │  │     │  │  │  │     │  └─ res
   │  │  │     │  │  │  │     │     ├─ drawable
   │  │  │     │  │  │  │     │     │  └─ launch_background.xml
   │  │  │     │  │  │  │     │     ├─ drawable-v21
   │  │  │     │  │  │  │     │     │  └─ launch_background.xml
   │  │  │     │  │  │  │     │     ├─ mipmap-hdpi
   │  │  │     │  │  │  │     │     │  └─ ic_launcher.png
   │  │  │     │  │  │  │     │     ├─ mipmap-mdpi
   │  │  │     │  │  │  │     │     │  └─ ic_launcher.png
   │  │  │     │  │  │  │     │     ├─ mipmap-xhdpi
   │  │  │     │  │  │  │     │     │  └─ ic_launcher.png
   │  │  │     │  │  │  │     │     ├─ mipmap-xxhdpi
   │  │  │     │  │  │  │     │     │  └─ ic_launcher.png
   │  │  │     │  │  │  │     │     ├─ mipmap-xxxhdpi
   │  │  │     │  │  │  │     │     │  └─ ic_launcher.png
   │  │  │     │  │  │  │     │     ├─ values
   │  │  │     │  │  │  │     │     │  └─ styles.xml
   │  │  │     │  │  │  │     │     └─ values-night
   │  │  │     │  │  │  │     │        └─ styles.xml
   │  │  │     │  │  │  │     └─ profile
   │  │  │     │  │  │  │        └─ AndroidManifest.xml
   │  │  │     │  │  │  ├─ build.gradle
   │  │  │     │  │  │  ├─ gradle
   │  │  │     │  │  │  │  └─ wrapper
   │  │  │     │  │  │  │     └─ gradle-wrapper.properties
   │  │  │     │  │  │  ├─ gradle.properties
   │  │  │     │  │  │  └─ settings.gradle
   │  │  │     │  │  ├─ integration_test
   │  │  │     │  │  │  └─ on_device_jni_test.dart
   │  │  │     │  │  ├─ lib
   │  │  │     │  │  │  └─ main.dart
   │  │  │     │  │  ├─ linux
   │  │  │     │  │  │  ├─ CMakeLists.txt
   │  │  │     │  │  │  ├─ flutter
   │  │  │     │  │  │  │  └─ CMakeLists.txt
   │  │  │     │  │  │  ├─ main.cc
   │  │  │     │  │  │  ├─ my_application.cc
   │  │  │     │  │  │  └─ my_application.h
   │  │  │     │  │  ├─ macos
   │  │  │     │  │  │  ├─ Flutter
   │  │  │     │  │  │  │  ├─ Flutter-Debug.xcconfig
   │  │  │     │  │  │  │  └─ Flutter-Release.xcconfig
   │  │  │     │  │  │  ├─ Podfile
   │  │  │     │  │  │  ├─ Runner
   │  │  │     │  │  │  │  ├─ AppDelegate.swift
   │  │  │     │  │  │  │  ├─ Assets.xcassets
   │  │  │     │  │  │  │  │  └─ AppIcon.appiconset
   │  │  │     │  │  │  │  │     ├─ app_icon_1024.png
   │  │  │     │  │  │  │  │     ├─ app_icon_128.png
   │  │  │     │  │  │  │  │     ├─ app_icon_16.png
   │  │  │     │  │  │  │  │     ├─ app_icon_256.png
   │  │  │     │  │  │  │  │     ├─ app_icon_32.png
   │  │  │     │  │  │  │  │     ├─ app_icon_512.png
   │  │  │     │  │  │  │  │     ├─ app_icon_64.png
   │  │  │     │  │  │  │  │     └─ Contents.json
   │  │  │     │  │  │  │  ├─ Base.lproj
   │  │  │     │  │  │  │  │  └─ MainMenu.xib
   │  │  │     │  │  │  │  ├─ Configs
   │  │  │     │  │  │  │  │  ├─ AppInfo.xcconfig
   │  │  │     │  │  │  │  │  ├─ Debug.xcconfig
   │  │  │     │  │  │  │  │  ├─ Release.xcconfig
   │  │  │     │  │  │  │  │  └─ Warnings.xcconfig
   │  │  │     │  │  │  │  ├─ DebugProfile.entitlements
   │  │  │     │  │  │  │  ├─ Info.plist
   │  │  │     │  │  │  │  ├─ MainFlutterWindow.swift
   │  │  │     │  │  │  │  └─ Release.entitlements
   │  │  │     │  │  │  ├─ Runner.xcodeproj
   │  │  │     │  │  │  │  ├─ project.pbxproj
   │  │  │     │  │  │  │  ├─ project.xcworkspace
   │  │  │     │  │  │  │  │  └─ xcshareddata
   │  │  │     │  │  │  │  │     └─ IDEWorkspaceChecks.plist
   │  │  │     │  │  │  │  └─ xcshareddata
   │  │  │     │  │  │  │     └─ xcschemes
   │  │  │     │  │  │  │        └─ Runner.xcscheme
   │  │  │     │  │  │  └─ Runner.xcworkspace
   │  │  │     │  │  │     ├─ contents.xcworkspacedata
   │  │  │     │  │  │     └─ xcshareddata
   │  │  │     │  │  │        └─ IDEWorkspaceChecks.plist
   │  │  │     │  │  ├─ pubspec.yaml
   │  │  │     │  │  ├─ README.md
   │  │  │     │  │  └─ windows
   │  │  │     │  │     ├─ CMakeLists.txt
   │  │  │     │  │     ├─ flutter
   │  │  │     │  │     │  └─ CMakeLists.txt
   │  │  │     │  │     └─ runner
   │  │  │     │  │        ├─ CMakeLists.txt
   │  │  │     │  │        ├─ flutter_window.cpp
   │  │  │     │  │        ├─ flutter_window.h
   │  │  │     │  │        ├─ main.cpp
   │  │  │     │  │        ├─ resource.h
   │  │  │     │  │        ├─ resources
   │  │  │     │  │        │  └─ app_icon.ico
   │  │  │     │  │        ├─ runner.exe.manifest
   │  │  │     │  │        ├─ Runner.rc
   │  │  │     │  │        ├─ utils.cpp
   │  │  │     │  │        ├─ utils.h
   │  │  │     │  │        ├─ win32_window.cpp
   │  │  │     │  │        └─ win32_window.h
   │  │  │     │  ├─ ffigen.yaml
   │  │  │     │  ├─ ffigen_exts.yaml
   │  │  │     │  ├─ java
   │  │  │     │  │  ├─ build.gradle.kts
   │  │  │     │  │  ├─ gradle
   │  │  │     │  │  │  ├─ libs.versions.toml
   │  │  │     │  │  │  └─ wrapper
   │  │  │     │  │  │     ├─ gradle-wrapper.jar
   │  │  │     │  │  │     └─ gradle-wrapper.properties
   │  │  │     │  │  ├─ gradlew
   │  │  │     │  │  ├─ gradlew.bat
   │  │  │     │  │  ├─ README.md
   │  │  │     │  │  ├─ settings.gradle.kts
   │  │  │     │  │  ├─ src
   │  │  │     │  │  │  └─ main
   │  │  │     │  │  │     └─ java
   │  │  │     │  │  │        └─ com
   │  │  │     │  │  │           └─ github
   │  │  │     │  │  │              └─ dart_lang
   │  │  │     │  │  │                 └─ jni
   │  │  │     │  │  │                    ├─ JniUtils.java
   │  │  │     │  │  │                    ├─ PortCleaner.java
   │  │  │     │  │  │                    ├─ PortContinuation.java
   │  │  │     │  │  │                    └─ PortProxyBuilder.java
   │  │  │     │  │  └─ ~
   │  │  │     │  │     └─ dev
   │  │  │     │  │        ├─ native
   │  │  │     │  │        │  └─ native
   │  │  │     │  │        │     └─ pkgs
   │  │  │     │  │        │        └─ jnigen
   │  │  │     │  │        │           └─ example
   │  │  │     │  │        │              └─ pdfbox_plugin
   │  │  │     │  │        │                 └─ dart_example
   │  │  │     │  │        └─ native2
   │  │  │     │  │           └─ pkgs
   │  │  │     │  │              └─ jnigen
   │  │  │     │  │                 └─ example
   │  │  │     │  │                    └─ pdfbox_plugin
   │  │  │     │  │                       └─ dart_example
   │  │  │     │  ├─ lib
   │  │  │     │  │  ├─ jni.dart
   │  │  │     │  │  ├─ jni_symbols.yaml
   │  │  │     │  │  ├─ src
   │  │  │     │  │  │  ├─ accessors.dart
   │  │  │     │  │  │  ├─ build_util
   │  │  │     │  │  │  │  └─ build_util.dart
   │  │  │     │  │  │  ├─ core_bindings.dart
   │  │  │     │  │  │  ├─ errors.dart
   │  │  │     │  │  │  ├─ jarray.dart
   │  │  │     │  │  │  ├─ jclass.dart
   │  │  │     │  │  │  ├─ jimplementer.dart
   │  │  │     │  │  │  ├─ jni.dart
   │  │  │     │  │  │  ├─ jobject.dart
   │  │  │     │  │  │  ├─ jprimitives.dart
   │  │  │     │  │  │  ├─ jreference.dart
   │  │  │     │  │  │  ├─ jvalues.dart
   │  │  │     │  │  │  ├─ kotlin.dart
   │  │  │     │  │  │  ├─ lang
   │  │  │     │  │  │  │  ├─ jboolean.dart
   │  │  │     │  │  │  │  ├─ jbyte.dart
   │  │  │     │  │  │  │  ├─ jcharacter.dart
   │  │  │     │  │  │  │  ├─ jdouble.dart
   │  │  │     │  │  │  │  ├─ jfloat.dart
   │  │  │     │  │  │  │  ├─ jinteger.dart
   │  │  │     │  │  │  │  ├─ jlong.dart
   │  │  │     │  │  │  │  ├─ jnumber.dart
   │  │  │     │  │  │  │  ├─ jshort.dart
   │  │  │     │  │  │  │  ├─ jstring.dart
   │  │  │     │  │  │  │  └─ lang.dart
   │  │  │     │  │  │  ├─ method_invocation.dart
   │  │  │     │  │  │  ├─ nio
   │  │  │     │  │  │  │  ├─ jbuffer.dart
   │  │  │     │  │  │  │  ├─ jbyte_buffer.dart
   │  │  │     │  │  │  │  └─ nio.dart
   │  │  │     │  │  │  ├─ primitive_jarrays.dart
   │  │  │     │  │  │  ├─ third_party
   │  │  │     │  │  │  │  ├─ generated_bindings.dart
   │  │  │     │  │  │  │  ├─ global_env_extensions.dart
   │  │  │     │  │  │  │  └─ jni_bindings_generated.dart
   │  │  │     │  │  │  ├─ types.dart
   │  │  │     │  │  │  ├─ util
   │  │  │     │  │  │  │  ├─ jiterator.dart
   │  │  │     │  │  │  │  ├─ jlist.dart
   │  │  │     │  │  │  │  ├─ jmap.dart
   │  │  │     │  │  │  │  ├─ jset.dart
   │  │  │     │  │  │  │  └─ util.dart
   │  │  │     │  │  │  └─ version_check.dart
   │  │  │     │  │  └─ _internal.dart
   │  │  │     │  ├─ LICENSE
   │  │  │     │  ├─ linux
   │  │  │     │  │  └─ CMakeLists.txt
   │  │  │     │  ├─ pubspec.yaml
   │  │  │     │  ├─ README.md
   │  │  │     │  ├─ src
   │  │  │     │  │  ├─ CMakeLists.txt
   │  │  │     │  │  ├─ dartjni.c
   │  │  │     │  │  ├─ dartjni.h
   │  │  │     │  │  ├─ include
   │  │  │     │  │  │  ├─ analyze_snapshot_api.h
   │  │  │     │  │  │  ├─ bin
   │  │  │     │  │  │  │  ├─ dart_io_api.h
   │  │  │     │  │  │  │  └─ native_assets_api.h
   │  │  │     │  │  │  ├─ BUILD.gn
   │  │  │     │  │  │  ├─ dart_api.h
   │  │  │     │  │  │  ├─ dart_api_dl.c
   │  │  │     │  │  │  ├─ dart_api_dl.h
   │  │  │     │  │  │  ├─ dart_embedder_api.h
   │  │  │     │  │  │  ├─ dart_native_api.h
   │  │  │     │  │  │  ├─ dart_tools_api.h
   │  │  │     │  │  │  ├─ dart_version.h
   │  │  │     │  │  │  └─ internal
   │  │  │     │  │  │     └─ dart_api_dl_impl.h
   │  │  │     │  │  ├─ jni_constants.h
   │  │  │     │  │  ├─ README.md
   │  │  │     │  │  └─ third_party
   │  │  │     │  │     ├─ global_jni_env.c
   │  │  │     │  │     └─ global_jni_env.h
   │  │  │     │  ├─ test
   │  │  │     │  │  ├─ boxed_test.dart
   │  │  │     │  │  ├─ debug_release_test.dart
   │  │  │     │  │  ├─ exception_test.dart
   │  │  │     │  │  ├─ global_env_test.dart
   │  │  │     │  │  ├─ isolate_test.dart
   │  │  │     │  │  ├─ jarray_test.dart
   │  │  │     │  │  ├─ jbyte_buffer_test.dart
   │  │  │     │  │  ├─ jlist_test.dart
   │  │  │     │  │  ├─ jmap_test.dart
   │  │  │     │  │  ├─ jobject_test.dart
   │  │  │     │  │  ├─ jset_test.dart
   │  │  │     │  │  ├─ jstring_test.dart
   │  │  │     │  │  ├─ load_test.dart
   │  │  │     │  │  ├─ test_util
   │  │  │     │  │  │  └─ test_util.dart
   │  │  │     │  │  ├─ version_check
   │  │  │     │  │  │  ├─ fail_major.dart
   │  │  │     │  │  │  ├─ fail_minor.dart
   │  │  │     │  │  │  └─ pass.dart
   │  │  │     │  │  └─ version_check_test.dart
   │  │  │     │  ├─ third_party
   │  │  │     │  │  └─ jni.h
   │  │  │     │  ├─ tool
   │  │  │     │  │  ├─ generate_ffi_bindings.dart
   │  │  │     │  │  ├─ generate_ide_files.dart
   │  │  │     │  │  ├─ generate_jni_bindings.dart
   │  │  │     │  │  ├─ generate_primitive_arrays.dart
   │  │  │     │  │  └─ wrapper_generators
   │  │  │     │  │     ├─ ffigen_util.dart
   │  │  │     │  │     ├─ generate_c_extensions.dart
   │  │  │     │  │     ├─ generate_dart_extensions.dart
   │  │  │     │  │     ├─ generate_helper_functions.dart
   │  │  │     │  │     └─ logging.dart
   │  │  │     │  └─ windows
   │  │  │     │     └─ CMakeLists.txt
   │  │  │     └─ path_provider_linux
   │  │  │        ├─ AUTHORS
   │  │  │        ├─ CHANGELOG.md
   │  │  │        ├─ example
   │  │  │        │  ├─ integration_test
   │  │  │        │  │  └─ path_provider_test.dart
   │  │  │        │  ├─ lib
   │  │  │        │  │  └─ main.dart
   │  │  │        │  ├─ linux
   │  │  │        │  │  ├─ CMakeLists.txt
   │  │  │        │  │  ├─ flutter
   │  │  │        │  │  │  ├─ CMakeLists.txt
   │  │  │        │  │  │  └─ generated_plugins.cmake
   │  │  │        │  │  ├─ main.cc
   │  │  │        │  │  ├─ my_application.cc
   │  │  │        │  │  └─ my_application.h
   │  │  │        │  ├─ pubspec.yaml
   │  │  │        │  ├─ README.md
   │  │  │        │  └─ test_driver
   │  │  │        │     └─ integration_test.dart
   │  │  │        ├─ lib
   │  │  │        │  ├─ path_provider_linux.dart
   │  │  │        │  └─ src
   │  │  │        │     ├─ get_application_id.dart
   │  │  │        │     ├─ get_application_id_real.dart
   │  │  │        │     ├─ get_application_id_stub.dart
   │  │  │        │     └─ path_provider_linux.dart
   │  │  │        ├─ LICENSE
   │  │  │        ├─ pubspec.yaml
   │  │  │        ├─ README.md
   │  │  │        └─ test
   │  │  │           ├─ get_application_id_test.dart
   │  │  │           └─ path_provider_linux_test.dart
   │  │  ├─ generated_plugins.cmake
   │  │  ├─ generated_plugin_registrant.cc
   │  │  └─ generated_plugin_registrant.h
   │  └─ runner
   │     ├─ CMakeLists.txt
   │     ├─ main.cc
   │     ├─ my_application.cc
   │     └─ my_application.h
   ├─ macos
   │  ├─ Flutter
   │  │  ├─ ephemeral
   │  │  │  ├─ Flutter-Generated.xcconfig
   │  │  │  └─ flutter_export_environment.sh
   │  │  ├─ Flutter-Debug.xcconfig
   │  │  ├─ Flutter-Release.xcconfig
   │  │  └─ GeneratedPluginRegistrant.swift
   │  ├─ Runner
   │  │  ├─ AppDelegate.swift
   │  │  ├─ Assets.xcassets
   │  │  │  └─ AppIcon.appiconset
   │  │  │     ├─ app_icon_1024.png
   │  │  │     ├─ app_icon_128.png
   │  │  │     ├─ app_icon_16.png
   │  │  │     ├─ app_icon_256.png
   │  │  │     ├─ app_icon_32.png
   │  │  │     ├─ app_icon_512.png
   │  │  │     ├─ app_icon_64.png
   │  │  │     └─ Contents.json
   │  │  ├─ Base.lproj
   │  │  │  └─ MainMenu.xib
   │  │  ├─ Configs
   │  │  │  ├─ AppInfo.xcconfig
   │  │  │  ├─ Debug.xcconfig
   │  │  │  ├─ Release.xcconfig
   │  │  │  └─ Warnings.xcconfig
   │  │  ├─ DebugProfile.entitlements
   │  │  ├─ Info.plist
   │  │  ├─ MainFlutterWindow.swift
   │  │  └─ Release.entitlements
   │  ├─ Runner.xcodeproj
   │  │  ├─ project.pbxproj
   │  │  ├─ project.xcworkspace
   │  │  │  └─ xcshareddata
   │  │  │     └─ IDEWorkspaceChecks.plist
   │  │  └─ xcshareddata
   │  │     └─ xcschemes
   │  │        └─ Runner.xcscheme
   │  ├─ Runner.xcworkspace
   │  │  ├─ contents.xcworkspacedata
   │  │  └─ xcshareddata
   │  │     └─ IDEWorkspaceChecks.plist
   │  └─ RunnerTests
   │     └─ RunnerTests.swift
   ├─ organiflow_movil.iml
   ├─ pubspec.lock
   ├─ pubspec.yaml
   ├─ README.md
   ├─ test
   │  └─ widget_test.dart
   ├─ web
   │  ├─ favicon.png
   │  ├─ icons
   │  │  ├─ Icon-192.png
   │  │  ├─ Icon-512.png
   │  │  ├─ Icon-maskable-192.png
   │  │  └─ Icon-maskable-512.png
   │  ├─ index.html
   │  └─ manifest.json
   └─ windows
      ├─ CMakeLists.txt
      ├─ flutter
      │  ├─ CMakeLists.txt
      │  ├─ ephemeral
      │  │  └─ .plugin_symlinks
      │  │     ├─ flutter_secure_storage_windows
      │  │     │  ├─ analysis_options.yaml
      │  │     │  ├─ CHANGELOG.md
      │  │     │  ├─ example
      │  │     │  │  ├─ analysis_options.yaml
      │  │     │  │  ├─ integration_test
      │  │     │  │  │  └─ app_test.dart
      │  │     │  │  ├─ lib
      │  │     │  │  │  └─ main.dart
      │  │     │  │  ├─ pubspec.yaml
      │  │     │  │  ├─ README.md
      │  │     │  │  └─ windows
      │  │     │  │     ├─ CMakeLists.txt
      │  │     │  │     ├─ flutter
      │  │     │  │     │  ├─ CMakeLists.txt
      │  │     │  │     │  ├─ generated_plugins.cmake
      │  │     │  │     │  ├─ generated_plugin_registrant.cc
      │  │     │  │     │  └─ generated_plugin_registrant.h
      │  │     │  │     └─ runner
      │  │     │  │        ├─ CMakeLists.txt
      │  │     │  │        ├─ flutter_window.cpp
      │  │     │  │        ├─ flutter_window.h
      │  │     │  │        ├─ main.cpp
      │  │     │  │        ├─ resource.h
      │  │     │  │        ├─ resources
      │  │     │  │        │  └─ app_icon.ico
      │  │     │  │        ├─ runner.exe.manifest
      │  │     │  │        ├─ Runner.rc
      │  │     │  │        ├─ utils.cpp
      │  │     │  │        ├─ utils.h
      │  │     │  │        ├─ win32_window.cpp
      │  │     │  │        └─ win32_window.h
      │  │     │  ├─ lib
      │  │     │  │  ├─ flutter_secure_storage_windows.dart
      │  │     │  │  └─ src
      │  │     │  │     ├─ flutter_secure_storage_windows_ffi.dart
      │  │     │  │     └─ flutter_secure_storage_windows_stub.dart
      │  │     │  ├─ LICENSE
      │  │     │  ├─ pubspec.yaml
      │  │     │  ├─ README.md
      │  │     │  ├─ test
      │  │     │  │  └─ unit_test.dart
      │  │     │  └─ windows
      │  │     │     ├─ CMakeLists.txt
      │  │     │     ├─ flutter_secure_storage_windows_plugin.cpp
      │  │     │     └─ include
      │  │     │        └─ flutter_secure_storage_windows
      │  │     │           └─ flutter_secure_storage_windows_plugin.h
      │  │     ├─ jni
      │  │     │  ├─ analysis_options.yaml
      │  │     │  ├─ android
      │  │     │  │  ├─ build.gradle
      │  │     │  │  ├─ consumer-rules.pro
      │  │     │  │  ├─ README.md
      │  │     │  │  ├─ settings.gradle
      │  │     │  │  └─ src
      │  │     │  │     └─ main
      │  │     │  │        ├─ AndroidManifest.xml
      │  │     │  │        └─ java
      │  │     │  │           └─ com
      │  │     │  │              └─ github
      │  │     │  │                 └─ dart_lang
      │  │     │  │                    └─ jni
      │  │     │  │                       └─ JniPlugin.java
      │  │     │  ├─ bin
      │  │     │  │  └─ setup.dart
      │  │     │  ├─ CHANGELOG.md
      │  │     │  ├─ dart_test.yaml
      │  │     │  ├─ example
      │  │     │  │  ├─ analysis_options.yaml
      │  │     │  │  ├─ android
      │  │     │  │  │  ├─ app
      │  │     │  │  │  │  ├─ build.gradle
      │  │     │  │  │  │  └─ src
      │  │     │  │  │  │     ├─ debug
      │  │     │  │  │  │     │  └─ AndroidManifest.xml
      │  │     │  │  │  │     ├─ main
      │  │     │  │  │  │     │  ├─ AndroidManifest.xml
      │  │     │  │  │  │     │  ├─ java
      │  │     │  │  │  │     │  │  ├─ com
      │  │     │  │  │  │     │  │  │  └─ github
      │  │     │  │  │  │     │  │  │     └─ dart_lang
      │  │     │  │  │  │     │  │  │        └─ jni_example
      │  │     │  │  │  │     │  │  │           └─ Toaster.java
      │  │     │  │  │  │     │  │  └─ io
      │  │     │  │  │  │     │  │     └─ flutter
      │  │     │  │  │  │     │  │        └─ plugins
      │  │     │  │  │  │     │  ├─ kotlin
      │  │     │  │  │  │     │  │  └─ dev
      │  │     │  │  │  │     │  │     └─ dart
      │  │     │  │  │  │     │  │        └─ jni_example
      │  │     │  │  │  │     │  │           └─ MainActivity.kt
      │  │     │  │  │  │     │  └─ res
      │  │     │  │  │  │     │     ├─ drawable
      │  │     │  │  │  │     │     │  └─ launch_background.xml
      │  │     │  │  │  │     │     ├─ drawable-v21
      │  │     │  │  │  │     │     │  └─ launch_background.xml
      │  │     │  │  │  │     │     ├─ mipmap-hdpi
      │  │     │  │  │  │     │     │  └─ ic_launcher.png
      │  │     │  │  │  │     │     ├─ mipmap-mdpi
      │  │     │  │  │  │     │     │  └─ ic_launcher.png
      │  │     │  │  │  │     │     ├─ mipmap-xhdpi
      │  │     │  │  │  │     │     │  └─ ic_launcher.png
      │  │     │  │  │  │     │     ├─ mipmap-xxhdpi
      │  │     │  │  │  │     │     │  └─ ic_launcher.png
      │  │     │  │  │  │     │     ├─ mipmap-xxxhdpi
      │  │     │  │  │  │     │     │  └─ ic_launcher.png
      │  │     │  │  │  │     │     ├─ values
      │  │     │  │  │  │     │     │  └─ styles.xml
      │  │     │  │  │  │     │     └─ values-night
      │  │     │  │  │  │     │        └─ styles.xml
      │  │     │  │  │  │     └─ profile
      │  │     │  │  │  │        └─ AndroidManifest.xml
      │  │     │  │  │  ├─ build.gradle
      │  │     │  │  │  ├─ gradle
      │  │     │  │  │  │  └─ wrapper
      │  │     │  │  │  │     └─ gradle-wrapper.properties
      │  │     │  │  │  ├─ gradle.properties
      │  │     │  │  │  └─ settings.gradle
      │  │     │  │  ├─ integration_test
      │  │     │  │  │  └─ on_device_jni_test.dart
      │  │     │  │  ├─ lib
      │  │     │  │  │  └─ main.dart
      │  │     │  │  ├─ linux
      │  │     │  │  │  ├─ CMakeLists.txt
      │  │     │  │  │  ├─ flutter
      │  │     │  │  │  │  └─ CMakeLists.txt
      │  │     │  │  │  ├─ main.cc
      │  │     │  │  │  ├─ my_application.cc
      │  │     │  │  │  └─ my_application.h
      │  │     │  │  ├─ macos
      │  │     │  │  │  ├─ Flutter
      │  │     │  │  │  │  ├─ Flutter-Debug.xcconfig
      │  │     │  │  │  │  └─ Flutter-Release.xcconfig
      │  │     │  │  │  ├─ Podfile
      │  │     │  │  │  ├─ Runner
      │  │     │  │  │  │  ├─ AppDelegate.swift
      │  │     │  │  │  │  ├─ Assets.xcassets
      │  │     │  │  │  │  │  └─ AppIcon.appiconset
      │  │     │  │  │  │  │     ├─ app_icon_1024.png
      │  │     │  │  │  │  │     ├─ app_icon_128.png
      │  │     │  │  │  │  │     ├─ app_icon_16.png
      │  │     │  │  │  │  │     ├─ app_icon_256.png
      │  │     │  │  │  │  │     ├─ app_icon_32.png
      │  │     │  │  │  │  │     ├─ app_icon_512.png
      │  │     │  │  │  │  │     ├─ app_icon_64.png
      │  │     │  │  │  │  │     └─ Contents.json
      │  │     │  │  │  │  ├─ Base.lproj
      │  │     │  │  │  │  │  └─ MainMenu.xib
      │  │     │  │  │  │  ├─ Configs
      │  │     │  │  │  │  │  ├─ AppInfo.xcconfig
      │  │     │  │  │  │  │  ├─ Debug.xcconfig
      │  │     │  │  │  │  │  ├─ Release.xcconfig
      │  │     │  │  │  │  │  └─ Warnings.xcconfig
      │  │     │  │  │  │  ├─ DebugProfile.entitlements
      │  │     │  │  │  │  ├─ Info.plist
      │  │     │  │  │  │  ├─ MainFlutterWindow.swift
      │  │     │  │  │  │  └─ Release.entitlements
      │  │     │  │  │  ├─ Runner.xcodeproj
      │  │     │  │  │  │  ├─ project.pbxproj
      │  │     │  │  │  │  ├─ project.xcworkspace
      │  │     │  │  │  │  │  └─ xcshareddata
      │  │     │  │  │  │  │     └─ IDEWorkspaceChecks.plist
      │  │     │  │  │  │  └─ xcshareddata
      │  │     │  │  │  │     └─ xcschemes
      │  │     │  │  │  │        └─ Runner.xcscheme
      │  │     │  │  │  └─ Runner.xcworkspace
      │  │     │  │  │     ├─ contents.xcworkspacedata
      │  │     │  │  │     └─ xcshareddata
      │  │     │  │  │        └─ IDEWorkspaceChecks.plist
      │  │     │  │  ├─ pubspec.yaml
      │  │     │  │  ├─ README.md
      │  │     │  │  └─ windows
      │  │     │  │     ├─ CMakeLists.txt
      │  │     │  │     ├─ flutter
      │  │     │  │     │  └─ CMakeLists.txt
      │  │     │  │     └─ runner
      │  │     │  │        ├─ CMakeLists.txt
      │  │     │  │        ├─ flutter_window.cpp
      │  │     │  │        ├─ flutter_window.h
      │  │     │  │        ├─ main.cpp
      │  │     │  │        ├─ resource.h
      │  │     │  │        ├─ resources
      │  │     │  │        │  └─ app_icon.ico
      │  │     │  │        ├─ runner.exe.manifest
      │  │     │  │        ├─ Runner.rc
      │  │     │  │        ├─ utils.cpp
      │  │     │  │        ├─ utils.h
      │  │     │  │        ├─ win32_window.cpp
      │  │     │  │        └─ win32_window.h
      │  │     │  ├─ ffigen.yaml
      │  │     │  ├─ ffigen_exts.yaml
      │  │     │  ├─ java
      │  │     │  │  ├─ build.gradle.kts
      │  │     │  │  ├─ gradle
      │  │     │  │  │  ├─ libs.versions.toml
      │  │     │  │  │  └─ wrapper
      │  │     │  │  │     ├─ gradle-wrapper.jar
      │  │     │  │  │     └─ gradle-wrapper.properties
      │  │     │  │  ├─ gradlew
      │  │     │  │  ├─ gradlew.bat
      │  │     │  │  ├─ README.md
      │  │     │  │  ├─ settings.gradle.kts
      │  │     │  │  ├─ src
      │  │     │  │  │  └─ main
      │  │     │  │  │     └─ java
      │  │     │  │  │        └─ com
      │  │     │  │  │           └─ github
      │  │     │  │  │              └─ dart_lang
      │  │     │  │  │                 └─ jni
      │  │     │  │  │                    ├─ JniUtils.java
      │  │     │  │  │                    ├─ PortCleaner.java
      │  │     │  │  │                    ├─ PortContinuation.java
      │  │     │  │  │                    └─ PortProxyBuilder.java
      │  │     │  │  └─ ~
      │  │     │  │     └─ dev
      │  │     │  │        ├─ native
      │  │     │  │        │  └─ native
      │  │     │  │        │     └─ pkgs
      │  │     │  │        │        └─ jnigen
      │  │     │  │        │           └─ example
      │  │     │  │        │              └─ pdfbox_plugin
      │  │     │  │        │                 └─ dart_example
      │  │     │  │        └─ native2
      │  │     │  │           └─ pkgs
      │  │     │  │              └─ jnigen
      │  │     │  │                 └─ example
      │  │     │  │                    └─ pdfbox_plugin
      │  │     │  │                       └─ dart_example
      │  │     │  ├─ lib
      │  │     │  │  ├─ jni.dart
      │  │     │  │  ├─ jni_symbols.yaml
      │  │     │  │  ├─ src
      │  │     │  │  │  ├─ accessors.dart
      │  │     │  │  │  ├─ build_util
      │  │     │  │  │  │  └─ build_util.dart
      │  │     │  │  │  ├─ core_bindings.dart
      │  │     │  │  │  ├─ errors.dart
      │  │     │  │  │  ├─ jarray.dart
      │  │     │  │  │  ├─ jclass.dart
      │  │     │  │  │  ├─ jimplementer.dart
      │  │     │  │  │  ├─ jni.dart
      │  │     │  │  │  ├─ jobject.dart
      │  │     │  │  │  ├─ jprimitives.dart
      │  │     │  │  │  ├─ jreference.dart
      │  │     │  │  │  ├─ jvalues.dart
      │  │     │  │  │  ├─ kotlin.dart
      │  │     │  │  │  ├─ lang
      │  │     │  │  │  │  ├─ jboolean.dart
      │  │     │  │  │  │  ├─ jbyte.dart
      │  │     │  │  │  │  ├─ jcharacter.dart
      │  │     │  │  │  │  ├─ jdouble.dart
      │  │     │  │  │  │  ├─ jfloat.dart
      │  │     │  │  │  │  ├─ jinteger.dart
      │  │     │  │  │  │  ├─ jlong.dart
      │  │     │  │  │  │  ├─ jnumber.dart
      │  │     │  │  │  │  ├─ jshort.dart
      │  │     │  │  │  │  ├─ jstring.dart
      │  │     │  │  │  │  └─ lang.dart
      │  │     │  │  │  ├─ method_invocation.dart
      │  │     │  │  │  ├─ nio
      │  │     │  │  │  │  ├─ jbuffer.dart
      │  │     │  │  │  │  ├─ jbyte_buffer.dart
      │  │     │  │  │  │  └─ nio.dart
      │  │     │  │  │  ├─ primitive_jarrays.dart
      │  │     │  │  │  ├─ third_party
      │  │     │  │  │  │  ├─ generated_bindings.dart
      │  │     │  │  │  │  ├─ global_env_extensions.dart
      │  │     │  │  │  │  └─ jni_bindings_generated.dart
      │  │     │  │  │  ├─ types.dart
      │  │     │  │  │  ├─ util
      │  │     │  │  │  │  ├─ jiterator.dart
      │  │     │  │  │  │  ├─ jlist.dart
      │  │     │  │  │  │  ├─ jmap.dart
      │  │     │  │  │  │  ├─ jset.dart
      │  │     │  │  │  │  └─ util.dart
      │  │     │  │  │  └─ version_check.dart
      │  │     │  │  └─ _internal.dart
      │  │     │  ├─ LICENSE
      │  │     │  ├─ linux
      │  │     │  │  └─ CMakeLists.txt
      │  │     │  ├─ pubspec.yaml
      │  │     │  ├─ README.md
      │  │     │  ├─ src
      │  │     │  │  ├─ CMakeLists.txt
      │  │     │  │  ├─ dartjni.c
      │  │     │  │  ├─ dartjni.h
      │  │     │  │  ├─ include
      │  │     │  │  │  ├─ analyze_snapshot_api.h
      │  │     │  │  │  ├─ bin
      │  │     │  │  │  │  ├─ dart_io_api.h
      │  │     │  │  │  │  └─ native_assets_api.h
      │  │     │  │  │  ├─ BUILD.gn
      │  │     │  │  │  ├─ dart_api.h
      │  │     │  │  │  ├─ dart_api_dl.c
      │  │     │  │  │  ├─ dart_api_dl.h
      │  │     │  │  │  ├─ dart_embedder_api.h
      │  │     │  │  │  ├─ dart_native_api.h
      │  │     │  │  │  ├─ dart_tools_api.h
      │  │     │  │  │  ├─ dart_version.h
      │  │     │  │  │  └─ internal
      │  │     │  │  │     └─ dart_api_dl_impl.h
      │  │     │  │  ├─ jni_constants.h
      │  │     │  │  ├─ README.md
      │  │     │  │  └─ third_party
      │  │     │  │     ├─ global_jni_env.c
      │  │     │  │     └─ global_jni_env.h
      │  │     │  ├─ test
      │  │     │  │  ├─ boxed_test.dart
      │  │     │  │  ├─ debug_release_test.dart
      │  │     │  │  ├─ exception_test.dart
      │  │     │  │  ├─ global_env_test.dart
      │  │     │  │  ├─ isolate_test.dart
      │  │     │  │  ├─ jarray_test.dart
      │  │     │  │  ├─ jbyte_buffer_test.dart
      │  │     │  │  ├─ jlist_test.dart
      │  │     │  │  ├─ jmap_test.dart
      │  │     │  │  ├─ jobject_test.dart
      │  │     │  │  ├─ jset_test.dart
      │  │     │  │  ├─ jstring_test.dart
      │  │     │  │  ├─ load_test.dart
      │  │     │  │  ├─ test_util
      │  │     │  │  │  └─ test_util.dart
      │  │     │  │  ├─ version_check
      │  │     │  │  │  ├─ fail_major.dart
      │  │     │  │  │  ├─ fail_minor.dart
      │  │     │  │  │  └─ pass.dart
      │  │     │  │  └─ version_check_test.dart
      │  │     │  ├─ third_party
      │  │     │  │  └─ jni.h
      │  │     │  ├─ tool
      │  │     │  │  ├─ generate_ffi_bindings.dart
      │  │     │  │  ├─ generate_ide_files.dart
      │  │     │  │  ├─ generate_jni_bindings.dart
      │  │     │  │  ├─ generate_primitive_arrays.dart
      │  │     │  │  └─ wrapper_generators
      │  │     │  │     ├─ ffigen_util.dart
      │  │     │  │     ├─ generate_c_extensions.dart
      │  │     │  │     ├─ generate_dart_extensions.dart
      │  │     │  │     ├─ generate_helper_functions.dart
      │  │     │  │     └─ logging.dart
      │  │     │  └─ windows
      │  │     │     └─ CMakeLists.txt
      │  │     └─ path_provider_windows
      │  │        ├─ AUTHORS
      │  │        ├─ CHANGELOG.md
      │  │        ├─ example
      │  │        │  ├─ integration_test
      │  │        │  │  └─ path_provider_test.dart
      │  │        │  ├─ lib
      │  │        │  │  └─ main.dart
      │  │        │  ├─ pubspec.yaml
      │  │        │  ├─ README.md
      │  │        │  ├─ test_driver
      │  │        │  │  └─ integration_test.dart
      │  │        │  └─ windows
      │  │        │     ├─ CMakeLists.txt
      │  │        │     ├─ flutter
      │  │        │     │  ├─ CMakeLists.txt
      │  │        │     │  └─ generated_plugins.cmake
      │  │        │     └─ runner
      │  │        │        ├─ CMakeLists.txt
      │  │        │        ├─ flutter_window.cpp
      │  │        │        ├─ flutter_window.h
      │  │        │        ├─ main.cpp
      │  │        │        ├─ resource.h
      │  │        │        ├─ resources
      │  │        │        │  └─ app_icon.ico
      │  │        │        ├─ runner.exe.manifest
      │  │        │        ├─ Runner.rc
      │  │        │        ├─ run_loop.cpp
      │  │        │        ├─ run_loop.h
      │  │        │        ├─ utils.cpp
      │  │        │        ├─ utils.h
      │  │        │        ├─ win32_window.cpp
      │  │        │        └─ win32_window.h
      │  │        ├─ lib
      │  │        │  ├─ path_provider_windows.dart
      │  │        │  └─ src
      │  │        │     ├─ folders.dart
      │  │        │     ├─ folders_stub.dart
      │  │        │     ├─ guid.dart
      │  │        │     ├─ path_provider_windows_real.dart
      │  │        │     ├─ path_provider_windows_stub.dart
      │  │        │     └─ win32_wrappers.dart
      │  │        ├─ LICENSE
      │  │        ├─ pubspec.yaml
      │  │        ├─ README.md
      │  │        └─ test
      │  │           ├─ guid_test.dart
      │  │           └─ path_provider_windows_test.dart
      │  ├─ generated_plugins.cmake
      │  ├─ generated_plugin_registrant.cc
      │  └─ generated_plugin_registrant.h
      └─ runner
         ├─ CMakeLists.txt
         ├─ flutter_window.cpp
         ├─ flutter_window.h
         ├─ main.cpp
         ├─ resource.h
         ├─ resources
         │  └─ app_icon.ico
         ├─ runner.exe.manifest
         ├─ Runner.rc
         ├─ utils.cpp
         ├─ utils.h
         ├─ win32_window.cpp
         └─ win32_window.h

```