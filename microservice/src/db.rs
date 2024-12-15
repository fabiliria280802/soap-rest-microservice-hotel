use sqlx::{sqlite::SqlitePool, Pool};

pub async fn get_db_pool() -> Pool<sqlx::Sqlite> {
    dotenv::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    SqlitePool::connect(&database_url).await.unwrap()
}
