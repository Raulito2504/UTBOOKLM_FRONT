## Flujo de trabajo con Git y estrategia de branching

Para el control de versiones del frontend de UTBookLM se utiliza la estrategia **GitFlow**, porque permite organizar el trabajo por funcionalidades, mantener una rama estable para entregas y preparar versiones de forma ordenada. Esta estrategia me resulta útil como estudiante de Ingeniería en Desarrollo de Software porque refleja un flujo de trabajo profesional y, al mismo tiempo, facilita dividir el desarrollo en partes pequeñas y manejables.

GitFlow define dos ramas principales:

- **main**: contiene la versión estable y lista para entrega o despliegue.
- **develop**: concentra la integración de los cambios del frontend y funciona como base para el desarrollo de nuevas funcionalidades.

A partir de `develop` se crean ramas de trabajo específicas para el frontend, normalmente una por pantalla o bloque funcional. Por ejemplo:

- **feature/auth-ui**: desarrollo de login, registro y cierre de sesión.
- **feature/dashboard-ui**: desarrollo del panel principal.
- **feature/documents-ui**: subida y listado de documentos.
- **feature/rag-chat-ui**: interfaz del chat con documentos.
- **feature/flashcards-ui**: interfaz de tarjetas de estudio.
- **feature/streaks-ui**: vista de progreso y racha.
- **feature/rooms-ui**: interfaz de salas colaborativas.
- **feature/webtour-ui**: interfaz para administrar fuentes web.
- **feature/notifications-ui**: componentes visuales de notificaciones.

El flujo de trabajo consiste en crear cada rama `feature/*` desde `develop`, implementar la funcionalidad de forma aislada y, cuando esté lista y probada, integrarla nuevamente en `develop` mediante un pull request. De esta forma, cada cambio puede revisarse y probarse sin afectar el resto de la aplicación.

Cuando el frontend esté listo para una entrega o demo, se puede crear una rama **release/*** desde `develop`, por ejemplo `release/0.1.0`, con el objetivo de estabilizar la versión, corregir detalles finales y preparar el código para producción o presentación. Una vez validada la release, esta se fusiona con `main` y también regresa a `develop` para mantener ambas ramas sincronizadas.

En caso de detectarse un error crítico en una versión ya liberada, se utiliza una rama **hotfix/*** creada desde `main`, por ejemplo `hotfix/fix-login-bug`, para aplicar una corrección urgente. Después de resolver el problema, el cambio se integra tanto en `main` como en `develop` para que la corrección no se pierda en futuras versiones.

Esta estrategia se eligió porque permite separar claramente el trabajo en desarrollo del código estable, facilita la organización por funcionalidades y mantiene un orden coherente entre frontend y backend. Además, ayuda a documentar un proceso de desarrollo más profesional, con ramas claras, nombres descriptivos y un control de versiones fácil de entender y mantener.