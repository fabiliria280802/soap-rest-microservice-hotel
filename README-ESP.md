# Sistema de reservación de hoteles LuxuryStay

Este proyecto es una solución para la gestión centralizada de reservas y disponibilidad de habitaciones para la cadena hotelera **LuxuryStay**. El sistema está dividido en tres servicios independientes que trabajan en conjunto:

1. **Servicio Web SOAP (Consulta de Disponibilidad)**: Gestiona la disponibilidad de habitaciones.
2. **API REST (Gestión de Reservas)**: Gestiona la creación, consulta y cancelación de reservas.
3. **Microservicio (Gestión de Inventario)**: Permite registrar y actualizar el estado de las habitaciones.

Nota: Este proyecto esta desarrollado en Node.js y Rust. Si quieres ver el proyecto en inglés, puedes ver el archivo [README.md](README.md).
---

## **Estructura del Proyecto**

```plaintext
soap-rest-microservice-hotel/
├── api-rest/           # API REST para reservas
├── microservice/       # Microservicio de inventario
└── web-soap-service/   # Servicio Web SOAP de disponibilidad
```

---

## **Requisitos Previos**
- Node.js (para api-rest y microservice).
- Cargo (para microservice).
- Python 3.x (para web-soap-service).
- Docker (opcional, para contenedores).
Note:
---

## **Descripción de Servicios**

1. **Servicio Web SOAP (Consulta de Disponibilidad)**
- **Funcionalidad**: Permite consultar la disponibilidad de habitaciones por tipo, fechas y estado.
- **Tecnología**: Python con Spyne y Flask. Para más información, ver el archivo [web-soap-service README](web-soap-service/README.md).
- **Puerto por defecto**: 8080.

2. **API REST (Gestión de Reservas)**
- **Funcionalidad**: Permite crear, consultar y cancelar reservas.
- **Tecnología**: Node.js con Express. Para más información, ver el archivo [api-rest README](api-rest/README.md).
- **Puerto por defecto**: 3000.

3. **Microservicio (Gestión de Inventario)**
- **Funcionalidad**: Permite registrar y actualizar el estado de las habitaciones.
- **Tecnología**: Cargo (Rust) con Actix Web. Para más información, ver el archivo [microservice README](microservice/README.md).
- **Puerto por defecto**: 4000.

---

## **Instrucciones de Instalación y Ejecución**

1. Clona el repositorio: `git clone https://github.com/fabiliria280802/soap-rest-microservice-hotel.git`
2. Navega al directorio del proyecto: `cd soap-rest-microservice-hotel`
3. Instala las dependencias para cada servicio(debes correr los comandos en el orden indicado y en diferentes terminales):
**Pasos para api-rest**
- `cd api-rest`
- `npm install`

**Pasos para microservice**
- `cd microservice`
- `cargo build`

**Pasos para web-soap-service**
- `cd web-soap-service`
- `npm installt`

---

## **Ejecución de Pruebas**
- **API REST**: `npm run test` (en el directorio api-rest)
- **Microservicio**: `cargo test` (en el directorio microservice)
- **Servicio Web SOAP**: `npm run test` (en el directorio web-soap-service)

