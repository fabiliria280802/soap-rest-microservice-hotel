use sqlx::mysql::{MySqlPool, MySqlPoolOptions}; // Importar MySqlPoolOptions
use std::env;
use uuid::Uuid;

pub async fn initialize_database() -> Result<MySqlPool, sqlx::Error> {
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Extraer la URL raíz sin el nombre de la base de datos
    let db_name = database_url.split('/').last().expect("Invalid DATABASE_URL format");
    let root_url = database_url.replace(&format!("/{}", db_name), "");

    // Conectar sin seleccionar la base de datos
    let pool_root = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&root_url)
        .await?;

    println!("Connected to MySQL server");

    // Crear la base de datos si no existe
    sqlx::query(&format!("CREATE DATABASE IF NOT EXISTS {}", db_name))
        .execute(&pool_root)
        .await?;

    println!("Database {} ensured", db_name);

    // Conectar ahora a la base de datos específica
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Connected to database {}", db_name);

    // Crear la tabla si no existe
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS rooms (
            room_id VARCHAR(36) PRIMARY KEY,
            room_number INT NOT NULL,
            room_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    println!("Table 'rooms' ensured");

    // Insertar datos de prueba
    let test_data = vec![
        ("101", "single", "available"),
        ("102", "double", "maintenance"),
        ("103", "suite", "available"),
        ("104", "single", "available"),
        ("105", "double", "maintenance"),
        ("106", "suite", "available"),
        ("107", "single", "available"),
        ("108", "double", "maintenance"),
        ("109", "suite", "available"),
        ("110", "single", "available"),
        ("111", "double", "maintenance"),
        ("112", "suite", "available"),
        ("113", "single", "available"),
        ("114", "double", "maintenance"),
        ("115", "suite", "available"),
        ("116", "single", "available"),
        ("117", "double", "maintenance"),
        ("118", "suite", "available"),
        ("119", "single", "available"),
        ("120", "double", "maintenance"),
        ("121", "suite", "available"),
    ];

    for (room_number, room_type, status) in test_data {
        sqlx::query(
            r#"
            INSERT INTO rooms (room_id, room_number, room_type, status)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE room_number = VALUES(room_number)
            "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(room_number)
        .bind(room_type)
        .bind(status)
        .execute(&pool)
        .await?;
    }

    println!("Test data ensured");
    println!("Database initialization completed successfully");

    Ok(pool)
}
