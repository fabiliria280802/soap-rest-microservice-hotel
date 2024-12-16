use actix_web::{web, App, HttpServer}; // Importa App, HttpServer y web
use db::initialize_database;          // Asegúrate de importar initialize_database
use handlers::{create_room, update_room_status, get_room, get_rooms}; // Importa los handlers

mod db;        // Asegúrate de tener estos módulos declarados
mod handlers;
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    match initialize_database().await {
        Ok(db_pool) => {
            println!(" ✅ Database initialized, starting server...");

            let server_address = "127.0.0.1";
            let server_port = 4000;

            println!(" 🚀 Server running at http://{}:{}", server_address, server_port);
            println!(" 📝 Microservice endpoint: http://{}:{}/rooms", server_address, server_port);
            HttpServer::new(move || {
                App::new()
                    .app_data(web::Data::new(db_pool.clone()))
                    .route("/rooms", web::post().to(create_room))
                    .route("/rooms/{room_id}", web::get().to(get_room))
                    .route("/rooms/{room_id}", web::patch().to(update_room_status))
                    .route("/rooms", web::get().to(get_rooms))
            })
            .bind((server_address, server_port))?
            .run()
            .await
        }
        Err(err) => {
            eprintln!("Failed to initialize database: {:?}", err);
            std::process::exit(1);
        }
    }
}