use actix_web::{web, App, HttpServer};
use db::get_db_pool;
use handlers::{create_room, update_room_status};

mod db;
mod handlers;
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db_pool = get_db_pool().await;

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db_pool.clone()))
            .route("/rooms", web::post().to(create_room))
            .route("/rooms/{room_id}", web::patch().to(update_room_status))
    })
    .bind(("127.0.0.1", 4000))?
    .run()
    .await
}


