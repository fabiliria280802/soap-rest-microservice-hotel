---
title: README
layout: template
filename: README.md
---

# LuxuryStay Hotel Reservation System

This project is a solution for centralized reservation and room availability management for the **LuxuryStay** hotel chain. The system is divided into three independent services that work together:

1. **SOAP Web Service (Availability Query)**: Manages room availability.
2. **REST API (Reservation Management)**: Manages the creation, query, and cancellation of reservations.
3. **Microservice (Inventory Management)**: Allows registering and updating room status.

Note: This project is developed in Node.js, Python, and Rust. If you want to see the project in Spanish, you can check the [README-ESP.md](README-ESP.md) file.
---

## **Project Structure**

```plaintext
soap-rest-microservice-hotel/
├── api-rest/           # REST API for reservations
├── microservice/       # Inventory microservice
└── web-soap-service/   # SOAP Web Service for availability
```

---

## **Prerequisites**
- Node.js (for api-rest)
- Cargo (for microservice)
- Python 3.x (for web-soap-service)
- Docker (optional, for containers)
Note:
---

## **Service Description**

1. **SOAP Web Service (Availability Query)**
- **Functionality**: Allows querying room availability by type, dates, and status.
- **Technology**: Python with Spyne and Flask. For more information, see [web-soap-service README](web-soap-service/README.md).
- **Default port**: 8080.

2. **REST API (Reservation Management)**
- **Functionality**: Allows creating, querying, and canceling reservations.
- **Technology**: Node.js with Express. For more information, see [api-rest README](api-rest/README.md).
- **Default port**: 3000.

3. **Microservice (Inventory Management)**
- **Functionality**: Allows registering and updating room status.
- **Technology**: Cargo (Rust) with Actix Web. For more information, see [microservice README](microservice/README.md).
- **Default port**: 4000.

---

## **Installation and Execution Instructions**

1. Clone the repository: `git clone https://github.com/fabiliria280802/soap-rest-microservice-hotel.git`
2. Navigate to the project directory: `cd soap-rest-microservice-hotel`
3. Install dependencies for each service (you must run the commands in the indicated order and in different terminals):
**Steps for api-rest**
- `cd api-rest`
- `npm install`

**Steps for microservice**
- `cd microservice`
- `cargo build`

**Steps for web-soap-service**
- `cd web-soap-service`
- `pip install -r requirements.txt`

---

## **Running Tests**
- **REST API**: `npm run test` (in the api-rest directory)
- **Microservice**: `cargo test` (in the microservice directory)
- **SOAP Web Service**: `python -m web_soap_service.app` (in the web-soap-service directory)
