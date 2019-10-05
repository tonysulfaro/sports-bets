from google.oauth2 import id_token
from google.auth.transport import requests

request = requests.Request()

token = b'114104319817788620398'

id_info = id_token.verify_oauth2_token(
    token, request, 'my-client-id.example.com')

if id_info['iss'] != 'https://accounts.google.com':
    raise ValueError('Wrong issuer.')

userid = id_info['sub']