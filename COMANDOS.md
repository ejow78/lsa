# Manual Oficial de Comandos — LATAM SimRacing Alliance Bot

Guía de referencia y uso para los 17 comandos Slash disponibles en el bot de Discord de **LATAM SimRacing Alliance (LSA)**.

---

## 👑 1. Administración y Gestión (Solo Staff / Admins)

### `/panel-reglas`
Publica el panel oficial con el reglamento y código de conducta de la comunidad, junto con el botón interactivo **`✅ Aceptar Reglamento`** y la reacción automática con tick verde. Al interactuar, asigna de inmediato el rol de **Piloto** para desbloquear el servidor.

* **Permisos requeridos:** Administrador o Moderador.
* **Opciones:**
  * `canal` *(opcional)*: Canal de Discord donde enviar el reglamento (por defecto, el canal configurado `<#1529959238271635496>` o el canal actual).
* **Comportamiento:**
  * Envía el Embed formateado con las secciones del reglamento (Convivencia y Respeto, Fair Play en Pista, y Canales/Mods de Assetto Corsa).
  * Incluye el botón interactivo verde `✅ Aceptar Reglamento` y agrega la reacción `✅` al mensaje.
  * Al pulsar el botón o reaccionar, asigna al usuario el rol **Piloto** (`1529968757131186308`) y le envía un mensaje efímero de confirmación y bienvenida a la pista.
  * Si un usuario retira su reacción `✅`, el rol se le retira automáticamente.

---

### `/panel-roles`
Publica el panel interactivo oficial para que los miembros de la comunidad elijan a qué simuladores juegan y reciban sus roles correspondientes de forma automática.

* **Permisos requeridos:** Administrador o Moderador.
* **Opciones:**
  * `canal` *(opcional)*: Canal de Discord donde enviar el panel (por defecto, el canal actual).
  * `mencion` *(opcional)*: Mención para notificar a los miembros (`@everyone`, `@here` o `Sin mención`).
* **Botones con Emojis del Servidor:**
  1. `<:AC:1538221321391968276>` **Assetto Corsa**
  2. `<:ACC:1538222193995944099>` **ACC**
  3. `<:ACEVO:1538222336292028488>` **AC EVO**
  4. `<:iracing_logo:1538223744571408384>` **iRacing**
  5. `<:LeMansUltimateLogo:1538224347691491428>` **Le Mans Ultimate**
  6. `<:F1logo:1538222743881916486>` **F1**
  7. `<:WRC:1538223219142828092>` **EA Sports WRC**
  8. `<:ACRally:1538224420986814536>` **Assetto Corsa Rally**
  9. `<:DR20:1538227326691573901>` **DiRT Rally 2.0**
* **Comportamiento:**
  * Al pulsar un botón, el bot auto-asigna el rol al usuario de inmediato.
  * Si el usuario ya lo tiene, al volver a pulsar se lo retira (interruptor toggle).
  * Si algún rol no existe en el servidor, el bot lo crea automáticamente.

---

### `/panel-reportes`
Publica el panel oficial con el botón interactivo **`🚨 Enviar Denuncia`** para que los pilotos reporten incidentes en pista.

* **Permisos requeridos:** Administrador o Moderador.
* **Opciones:**
  * `juego` *(opcional)*: `Assetto Corsa (AC)`, `Assetto Corsa Competizione (ACC)` o `Ambos Canales`. Si no lo especificas, el bot te responderá con botones interactivos para elegir dónde publicarlo con 1 clic.
  * `canal` *(opcional)*: Canal de destino si se desea uno personalizado.
* **Canales predeterminados de destino:**
  * Panel AC: `<#1565868265316814858>`
  * Panel ACC: `<#1565868469508120717>`

---

### `/anuncio`
Permite enviar comunicados y avisos con la cuenta del bot a cualquier canal.

* **Permisos requeridos:** Administrador o Moderador.
* **Opciones:**
  * `mensaje` *(obligatorio)*: Texto del anuncio.
  * `canal` *(opcional)*: Canal donde se publicará.
  * `titulo` *(opcional)*: Título del comunicado (activa formato Embed oficial).
  * `formato` *(opcional)*: `Embed Oficial LSA` o `Texto Plano Directo`.
  * `mencion` *(opcional)*: `@everyone`, `@here`, `Rol Alertas LSA` o `Sin mención`.
  * `color` *(opcional)*: `Azul Oficial LSA`, `Rojo Alerta`, `Verde Éxito` o `Dorado`.

---

### `/decir`
Comando directo y rápido para hacer hablar al bot con texto plano sin formato de embed.

* **Permisos requeridos:** Administrador o Moderador.
* **Opciones:**
  * `mensaje` *(obligatorio)*: El texto que enviará el bot.
  * `canal` *(opcional)*: Canal donde se enviará el mensaje (por defecto el canal actual).
* **Ejemplo:**
  ```text
  /decir mensaje: En 15 minutos comienza la sesión de clasificación canal:#anuncios
  ```

---

### `/encuesta`
Crea votaciones oficiales con botones interactivos para la comunidad (elección de circuitos, formato de carreras, horarios, etc.).

* **Permisos requeridos:** Administrador o Moderador.
* **Opciones:**
  * `titulo` *(obligatorio)*: Pregunta o tema de votación.
  * `opcion1` a `opcion5`: Alternativas para votar.
* **Ejemplo:**
  ```text
  /encuesta titulo: ¿Qué circuito corremos este viernes? opcion1: Spa Francorchamps opcion2: Nürburgring opcion3: Monza
  ```

---

## 🏎️ 2. Servidor y Acceso a Pista

### `/servidor`
Muestra el estado en tiempo real del servidor Emperor de Assetto Corsa.

* **Opciones:**
  * `publico` *(opcional)*: Si es `True`, el resultado será visible para todo el canal.
* **Información que incluye:**
  * Cantidad de pilotos conectados sobre el cupo máximo.
  * Lista de pilotos en pista, auto que conducen y su mejor vuelta registrada.
  * Sesión actual (Práctica, Qualy, Carrera) y tiempo restante.
  * Trazado del circuito en orientación horizontal.
  * Botón directo de 1 clic para entrar con **Content Manager**.
  * Botón de acceso a **Live Timing Web** (`https://live.latamsimracing.com/`).

---

### `/link`
Entrega los datos de acceso rápido al servidor para los pilotos.

* **Información que incluye:**
  * Enlace web de 1 clic para Content Manager.
  * Protocolo directo `acmanager://`.
  * Contraseña del servidor.
  * Enlace al nuevo Live Timing (`https://live.latamsimracing.com/`).

---

### `/entrylist`
Muestra los cupos del servidor, cantidad de slots asignados y autos que se encuentran disponibles para ingresar.

---

## 📊 3. Telemetría, Tiempos y Resultados

### `/tiempos`
Tabla de líderes (Hotlaps) con los mejores tiempos de vuelta registrados en el trazado actual.

* **Opciones:**
  * `por_auto` *(opcional)*: `True` para desglosar el ranking comparando cada vehículo utilizado.

---

### `/resultados`
Publica la clasificación completa, vuelta rápida, cantidad de vueltas e incidentes de la última sesión terminada en el servidor.

---

### `/piloto`
Ficha técnica y telemetría personalizada de un piloto en la sesión actual.

* **Opciones:**
  * `nombre` *(opcional)*: Nombre del piloto a consultar (ej: `Javier Weimann`).
* **Información que incluye:**
  * Mejor tiempo de vuelta y vehículo utilizado.
  * Vuelta óptima teórica (suma de mejores sectores).
  * Cantidad de incidentes registrados.
  * Comparativa de autos probados.

---

### `/replay`
Muestra los enlaces de descarga directa de los archivos de repetición oficial **`.acreplay`** de las sesiones recientes para analizarlas en Content Manager.

---

## 🚨 4. Denuncias y Comisariato

### `/reportar`
Abre el formulario modal de denuncia de incidentes para los pilotos.

* **Opciones:**
  * `juego` *(opcional)*: `Assetto Corsa (AC)` o `Assetto Corsa Competizione (ACC)`.
* **Detección inteligente:**
  * Si el piloto ejecuta `/reportar` en `<#1565868265316814858>` (AC) o `<#1565868469508120717>` (ACC), el bot abre directamente el formulario de ese simulador.
  * Si lo ejecuta en otro canal, le muestra botones interactivos para elegir `🏎️ Assetto Corsa` o `🏁 ACC`.
* **Campos del formulario:**
  1. **Tu Nombre de Piloto en Pista:** Nombre y apellido en el simulador.
  2. **Piloto o Auto Denunciado:** Nombre del rival o auto/número.
  3. **Momento Exacto:** Sesión, número de vuelta o minuto de carrera.
  4. **Descripción de lo ocurrido:** Detalle de la maniobra sin necesidad de link de video obligatorio.
* **Canales de recepción de Comisarios:**
  * Denuncias de AC ➔ `<#1565867684673888387>`
  * Denuncias de ACC ➔ `<#1565867710502666251>`
* **Acciones para Comisarios:**
  * **Sancionar:** Abre modal para ingresar penalización y motivo justificado.
  * **Desestimar:** Cierra el caso catalogándolo como lance de carrera no punible.

---

## 🏆 5. Campeonatos y Licencias

### `/campeonato`
Consulta el estado de los campeonatos activos en Emperor Server, fechas de calendario y clasificaciones.

---

### `/tabla`
Muestra las tablas de posiciones y tablas personalizadas configuradas en el bot.

---

### `/licencia`
Genera una imagen gráfica digital tipo carnet oficial de SimRacing con el nombre del piloto, bandera, categoría, nivel de seguridad e historial.

---

## 📌 Canales Oficiales Configurados

| Función | Canal | ID |
| :--- | :--- | :--- |
| **Estado del Servidor en Vivo** | `#servidor` | `1564808711883464805` |
| **Avisos de Pilotos en Pista** | `#avisos-pista` | `1564808847267467395` |
| **Reportes Pilotos (Assetto Corsa)** | `#reportes-ac` | `1565868265316814858` |
| **Reportes Pilotos (ACC)** | `#reportes-acc` | `1565868469508120717` |
| **Comisarios Privado (Assetto Corsa)** | `#comisarios-ac` | `1565867684673888387` |
| **Comisarios Privado (ACC)** | `#comisarios-acc` | `1565867710502666251` |
