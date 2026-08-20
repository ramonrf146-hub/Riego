# Riego

Control de riego desde la PC o el teléfono. La web (Next.js, export estático) muestra las zonas,
permite regar a demanda y programar horarios; Node-RED ejecuta las órdenes sobre relés Modbus.

Demo (sin actuadores, estado en el navegador): https://ramonrf146-hub.github.io/Riego/

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build   # genera la web estática en out/
```

## Conectar con Node-RED y Modbus

### 1. Node-RED

1. Instalar Node-RED y el nodo Modbus:
   ```bash
   npm install -g --unsafe-perm node-red
   cd ~/.node-red && npm install node-red-contrib-modbus
   ```
2. Importar `node-red/riego-flow.json` (menú ☰ → Import → clipboard) y hacer Deploy.
3. En el nodo de configuración **PLC riego** poner el host y puerto del esclavo Modbus TCP
   (o cambiar `clienttype` a serial y elegir el puerto `/dev/ttyUSB0` si el conversor es RS-485).

El flow expone:

| Endpoint | Uso |
| --- | --- |
| `GET /riego/estado` | Estado de todas las zonas |
| `POST /riego/zona/:id` | `{ running, durationMinutes, schedule }` |

El nodo **Relé de zona** (`modbus-flex-write`) escribe la coil correspondiente con función 5.
El mapa zona → coil está en la función **Zonas por defecto**:

```js
const COILS = { 'zona-1': 0, 'zona-2': 1, 'zona-3': 2 };
```

Node-RED es el dueño del estado: corta el riego al vencer la duración y arranca las zonas
programadas, así que sigue regando aunque no haya ningún navegador abierto.

### 2. La web

Abrir la app, desplegar el indicador de conexión debajo del título y cargar la URL de Node-RED
(por ejemplo `http://192.168.1.50:1880`). Se guarda en el navegador. Sin URL, la app funciona sola
y guarda el estado localmente (modo maqueta).

> **Importante:** un navegador no deja que una página HTTPS (GitHub Pages) llame a un Node-RED por
> HTTP en la LAN. Para uso real conviene servir la web desde el propio Node-RED: copiar el contenido
> de `out/` a una carpeta y apuntar `httpStatic` en `~/.node-red/settings.js`:
>
> ```js
> httpStatic: '/home/pi/riego-web/',
> ```
>
> Luego se entra por `http://IP-del-Node-RED:1880/` desde la PC o el teléfono.
> Para ese caso conviene construir sin prefijo de ruta: `npm run build` (sin `NEXT_PUBLIC_BASE_PATH`).

### 3. Hardware

- Módulo de relés Modbus TCP (o RTU + conversor RS-485/USB), una coil por electroválvula.
- Electroválvulas de 24 V AC/DC con su fuente; los relés solo conmutan, no alimentan.
- Verificar el `unitid` (por defecto 1) y las direcciones de coil del módulo antes de regar de verdad.

## Deploy

Cada push a `main` publica `out/` en GitHub Pages mediante `.github/workflows/deploy.yml`.
