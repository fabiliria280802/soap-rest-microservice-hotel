use actix_web::{web, HttpResponse, Responder};
use sqlx::SqlitePool;

use crate::models::Room;

pub async fn create_room(
    room: web::Json<Room>,
    db_pool: web::Data<SqlitePool>,
) -> impl Responder {
    let new_room = Room::new(room.room_number, room.room_type.clone(), room.status.clone());

    let query = sqlx::query!(
        "INSERT INTO rooms (room_id, room_number, room_type, status) VALUES (?, ?, ?, ?)",
        new_room.room_id,
        new_room.room_number,
        new_room.room_type,
        new_room.status
    )
    .execute(db_pool.get_ref())
    .await;

    match query {
        Ok(_) => HttpResponse::Created().json(new_room),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn update_room_status(
    path: web::Path<String>,
    status: web::Json<String>,
    db_pool: web::Data<SqlitePool>,
) -> impl Responder {
    let query = sqlx::query!(
        "UPDATE rooms SET status = ? WHERE room_id = ?",
        status.into_inner(),
        path.into_inner()
    )
    .execute(db_pool.get_ref())
    .await;

    match query {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}
