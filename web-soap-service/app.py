from spyne import Application, rpc, ServiceBase, Integer, Unicode, Iterable, Date
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from flask import Flask
from config.config import initialize_database, get_connection
from datetime import datetime

class AvailabilityService(ServiceBase):
    @rpc(Unicode, Unicode, Unicode, _returns=Iterable(Unicode))
    def check_availability(ctx, start_date, end_date, room_type):
        connection = None
        try:
            connection = get_connection()
            cursor = connection.cursor(dictionary=True)

            # Consultar disponibilidad en la base de datos
            query = """
                SELECT room_id, room_number
                FROM availability
                WHERE room_type = %s
                AND available_date BETWEEN %s AND %s
                AND status = 'available'
            """
            cursor.execute(query, (room_type, start_date, end_date))
            rooms = cursor.fetchall()

            results = []
            if rooms:
                for room in rooms:
                    results.append(f"Room {room['room_number']} is available")
            else:
                results.append("No rooms available")

            return results

        except Exception as e:
            print(f"Error checking availability: {e}")
            return ["Error checking availability"]
        finally:
            if connection:
                connection.close()

# Configuración de la aplicación SOAP
soap_app = Application([AvailabilityService], 'luxurystay.availability',
                       in_protocol=Soap11(validator='lxml'),
                       out_protocol=Soap11())
soap_wsgi_app = WsgiApplication(soap_app)

# Configuración de Flask
flask_app = Flask(__name__)
flask_app.wsgi_app = soap_wsgi_app

# Inicializar la base de datos antes de iniciar el servidor
@flask_app.before_first_request
def init_db():
    initialize_database()

if __name__ == '__main__':
    init_db()  # Inicializar la base de datos al arrancar
    flask_app.run(host='0.0.0.0', port=8080)
