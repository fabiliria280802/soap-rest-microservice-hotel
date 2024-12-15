use actix_web::{web, HttpResponse, Responder};
use sqlx::MySqlPool;
use sqlx::query as sql_query;

use crate::models::Room;

pub async fn create_room(
    room: web::Json<Room>,
    db_pool: web::Data<MySqlPool>,
) -> impl Responder {
    let new_room = Room::new(room.room_number, room.room_type.clone(), room.status.clone());

    match sql_query(
        "INSERT INTO rooms (room_id, room_number, room_type, status) VALUES (?, ?, ?, ?)"
    )
    .bind(&new_room.room_id)
    .bind(&new_room.room_number)
    .bind(&new_room.room_type)
    .bind(&new_room.status)
    .execute(db_pool.get_ref())
    .await {
        Ok(_) => HttpResponse::Created().json(new_room),
        Err(e) => {
            println!("Error creating room: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn update_room_status(
    path: web::Path<String>,
    status: web::Json<String>,
    db_pool: web::Data<MySqlPool>,
) -> impl Responder {
    match sql_query("UPDATE rooms SET status = ? WHERE room_id = ?")
    .bind(status.into_inner())
    .bind(path.into_inner())
    .execute(db_pool.get_ref())
    .await {
        Ok(result) if result.rows_affected() > 0 => HttpResponse::Ok().finish(),
        Ok(_) => HttpResponse::NotFound().finish(),
        Err(e) => {
            println!("Error updating room status: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
