use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Room {
    #[serde(default = "generate_uuid")]
    pub room_id: String,
    pub room_number: i32,
    pub room_type: String,
    pub status: String,
    #[serde(skip_deserializing)]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(skip_deserializing)]
    pub updated_at: Option<DateTime<Utc>>,
}

fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

impl Room {
    pub fn new(room_number: i32, room_type: String, status: String) -> Self {
        Room {
            room_id: generate_uuid(),
            room_number,
            room_type,
            status,
            created_at: None,
            updated_at: None,
        }
    }
}
