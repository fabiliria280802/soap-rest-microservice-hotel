import os
import mysql.connector
from dotenv import load_dotenv
from mysql.connector import Error

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'luxurystay_availability')
}

def initialize_database():
    connection = None
    try:
        # Crear conexión inicial sin base de datos
        connection = mysql.connector.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password']
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            # Crear base de datos si no existe
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_config['database']}")
            print(f"Base de datos {db_config['database']} verificada/creada")
            
            # Usar la base de datos
            cursor.execute(f"USE {db_config['database']}")
            
            # Crear tabla si no existe
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS availability (
                    room_id INT PRIMARY KEY AUTO_INCREMENT,
                    room_number INT NOT NULL,
                    room_type VARCHAR(50) NOT NULL,
                    available_date DATE NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'available',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_room_date (room_number, available_date)
                )
            """)
            print("Tabla availability verificada/creada")
            
            # Verificar si hay datos existentes
            cursor.execute("SELECT COUNT(*) as count FROM availability")
            result = cursor.fetchone()
            
            # Insertar datos de prueba si la tabla está vacía
            if result['count'] == 0:
                cursor.execute("""
                    INSERT INTO availability (room_number, room_type, available_date, status)
                    VALUES
                        (101, 'standard', '2024-03-20', 'available'),
                        (102, 'standard', '2024-03-20', 'available'),
                        (201, 'deluxe', '2024-03-20', 'available'),
                        (202, 'deluxe', '2024-03-20', 'available'),
                        (301, 'suite', '2024-03-20', 'available')
                """)
                connection.commit()
                print("Datos de prueba insertados")
            
            return create_pool()
            
    except Error as e:
        print(f"Error durante la inicialización de la base de datos: {e}")
        raise e
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def create_pool():
    """Crear y retornar un pool de conexiones"""
    try:
        pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="availability_pool",
            pool_size=5,
            **db_config
        )
        print("Pool de conexiones creado exitosamente")
        return pool
    except Error as e:
        print(f"Error al crear el pool de conexiones: {e}")
        raise e

def get_connection():
    """Obtener una conexión del pool"""
    try:
        return create_pool().get_connection()
    except Error as e:
        print(f"Error al obtener conexión del pool: {e}")
        raise e

def close_connection(connection):
    """Cerrar una conexión específica"""
    if connection:
        try:
            connection.close()
            print("Conexión cerrada correctamente")
        except Error as e:
            print(f"Error al cerrar la conexión: {e}")
