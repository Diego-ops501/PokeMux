# PokeMux 2.0 — Guía en español

[README en español](README.es.md) · [Português](MANUAL.md) · [English](MANUAL.en.md)

## Primeros pasos

1. Descarga e instala [PokeMux 2.0 para Windows](https://github.com/Diego-ops501/PokeMux/releases/tag/v2.0.0).
2. Abre **Ajustes → Aspecto y juego** y elige **ES**.
3. En **Ajustes → Cuentas**, registra hasta cuatro cuentas e inicia sesión. Resuelve CAPTCHA/2FA manualmente dentro del juego. Windows cifra las credenciales localmente.
4. Pulsa el nombre de una cuenta para enfocarla, **Cuadrícula** para ver las pantallas o **Resumen** para ver el dashboard. Las sesiones se conservan.

## Resumen y hunts

Las tarjetas muestran Pokémon, hunt, XP/h, dólares netos/h, capturas y suministros. Para estimar su duración se necesitan al menos diez minutos de consumo medido. Se destacan cuentas desconectadas, inactivas o sin combate y suministros bajos. Los datos desconocidos no se consideran ceros válidos.

**Abrir cuenta** muestra el juego y su Análisis. **Recomendar hunt** usa el Pokémon principal de esa cuenta. El foco en XP evalúa solo XP; el foco en dólares evalúa ingresos netos. Viajar ejecuta el comando de la cuenta seleccionada y mantiene la pantalla actual y la ventana de recomendaciones. Entrar al Resumen cierra el Análisis; pulsa **Análisis** para abrirlo.

Las capturas importantes incluyen shiny, IV 160+ o Legendaria+. Selecciona **Todas las capturas** para incluir las comunes. Ajustes → Resumen permite habilitar secciones opcionales y cambiar el orden.

## Inventario e IV

**Inventario** muestra las cuentas conectadas una al lado de otra, con desplazamiento y páginas independientes. Todo/Pokémon/Poké Balls/Objetos filtran todas las columnas. Busca por nombre, cuenta, rareza o IV. Los Pokémon se ordenan por rareza e IV; los objetos por valor unitario NPC.

Se consulta al abrir y al pulsar **Actualizar**, no continuamente durante el farm. Los objetos muestran el precio NPC y el menor precio unitario anunciado en el mercado; se indican consultas antiguas o no disponibles. Con IV activo, pasa el cursor, selecciona o usa Tab en un Pokémon para calcular con la sesión de su propietario. Se informa si faltan atributos. Pulsa el nombre de la cuenta para abrir su juego.

## Mercado y alertas

El Mercado elige automáticamente una cuenta conectada disponible. Reúne inventarios y anuncios propios, con filtro por propietario y enlaces. La búsqueda de Pokémon empieza con todos. La ordenación convierte dollars/diamonds con la cotización activa del diamante. El mercado abierto se actualiza cada 60 segundos; la caché completa de Pokémon, aproximadamente cada cinco minutos. Los límites del juego pausan consultas y conservan datos en caché.

**Comparar con el mercado** usa especie/forma, shiny, rareza y márgenes ajustables de IV, nivel y calidad. Muestra muestra consultada, mínimo, mediana, solicitudes y precio sugerido si hay comparables completos. Ampliar a toda la especie requiere un clic. Los precios no incluyen tasas; las solicitudes no son ventas realizadas.

Configura hasta 10 alertas por cuenta/personaje en **Mercado → Alertas**. Se consultan cada 60 segundos mientras la aplicación está abierta, incluso con Mercado cerrado. La primera consulta es silenciosa; los anuncios repetidos no generan avisos nuevos. Configura voz, notificaciones de Windows y Discord opcional en **Ajustes → Avisos del farm**.

## Ajustes, rendimiento y actualizaciones

Panel central con búsqueda y ocho categorías; los cambios se guardan automáticamente. Eco limita el juego visible a 15 FPS, los demás a 2 FPS y las pantallas en Resumen a 1 FPS; temporizadores y conexiones permanecen activos. El juego integrado dispone de PT/EN; al elegir ES en la aplicación, el juego utiliza EN.

Las actualizaciones conservan sesiones, historial y preferencias. Descarga e instalación requieren confirmación y validan SHA-512. Los backups excluyen credenciales y webhook. Consulta el [manual detallado en portugués](MANUAL.md), las [FAQ](FAQ.md), los [cambios](CHANGELOG.md) y los [créditos](NOTICE.md).
