
```
organiflow
├─ .mvn
│  └─ wrapper
│     └─ maven-wrapper.properties
├─ mvnw
├─ mvnw.cmd
├─ pom.xml
└─ src
   ├─ main
   │  ├─ java
   │  │  └─ com
   │  │     └─ sw
   │  │        └─ organiflow
   │  │           ├─ config
   │  │           │  ├─ MongoConfig.java
   │  │           │  └─ SecurityConfig.java
   │  │           ├─ modules
   │  │           │  ├─ auth
   │  │           │  │  ├─ controllers
   │  │           │  │  │  └─ AuthController.java
   │  │           │  │  ├─ dtos
   │  │           │  │  │  ├─ AuthResponse.java
   │  │           │  │  │  └─ LoginRequest.java
   │  │           │  │  ├─ models
   │  │           │  │  │  └─ RefreshToken.java
   │  │           │  │  ├─ repositories
   │  │           │  │  │  └─ RefreshTokenRepository.java
   │  │           │  │  └─ services
   │  │           │  │     ├─ AuthService.java
   │  │           │  │     ├─ CustomUserDetailsService.java
   │  │           │  │     └─ RefreshTokenService.java
   │  │           │  ├─ tenant
   │  │           │  │  ├─ models
   │  │           │  │  │  └─ Tenant.java
   │  │           │  │  └─ repositories
   │  │           │  │     └─ TenantRepository.java
   │  │           │  └─ user
   │  │           │     ├─ controllers
   │  │           │     │  └─ UserController.java
   │  │           │     ├─ dtos
   │  │           │     │  ├─ UserRequest.java
   │  │           │     │  └─ UserResponse.java
   │  │           │     ├─ models
   │  │           │     │  ├─ User.java
   │  │           │     │  └─ UserTenantRole.java
   │  │           │     ├─ repositories
   │  │           │     │  ├─ UserRepository.java
   │  │           │     │  └─ UserTenantRoleRepository.java
   │  │           │     └─ services
   │  │           │        └─ UserService.java
   │  │           ├─ OrganiflowApplication.java
   │  │           ├─ security
   │  │           │  ├─ jwt
   │  │           │  │  ├─ JwtAuthFilter.java
   │  │           │  │  └─ JwtService.java
   │  │           │  └─ util
   │  │           │     ├─ CookieUtils.java
   │  │           │     └─ SecurityUtils.java
   │  │           └─ shared
   │  │              ├─ audit
   │  │              │  └─ AuditDocument.java
   │  │              └─ enums
   │  │                 └─ UserRole.java
   │  └─ resources
   │     ├─ application.properties
   │     ├─ META-INF
   │     │  └─ additional-spring-configuration-metadata.json
   │     ├─ static
   │     └─ templates
   └─ test
      └─ java
         └─ com
            └─ sw
               └─ organiflow
                  └─ OrganiflowApplicationTests.java

```