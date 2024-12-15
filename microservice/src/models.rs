use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Room {
    pub room_id: String,
    pub room_number: i32,
    pub room_type: String,
    pub status: String,
}

impl Room {
    pub fn new(room_number: i32, room_type: String, status: String) -> Self {
        Room {
            room_id: Uuid::new_v4().to_string(),
            room_number,
            room_type,
            status,
        }
    }
}
