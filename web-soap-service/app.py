from spyne import Application, rpc, ServiceBase, Integer, Unicode, Iterable, Date
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from flask import Flask
import json

with open('db/availability.json', 'r') as f:
    availability_db = json.load(f)

class AvailabilityService(ServiceBase):
    @rpc(Unicode, Unicode, Unicode, _returns=Iterable(Unicode))
    def check_availability(ctx, start_date, end_date, room_type):
        results = []
        for room in availability_db:
            if room["room_type"] == room_type and room["available_date"] >= start_date and room["available_date"] <= end_date and room["status"] == "available":
                results.append(f"Room {room['room_id']} is available")
        if not results:
            results.append("No rooms available")
        return results


# Configuración de la aplicación SOAP
soap_app = Application([AvailabilityService], 'luxurystay.availability',
                       in_protocol=Soap11(validator='lxml'),
                       out_protocol=Soap11())
soap_wsgi_app = WsgiApplication(soap_app)

# Configuración de Flask
flask_app = Flask(__name__)
flask_app.wsgi_app = soap_wsgi_app

if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', port=8080)
