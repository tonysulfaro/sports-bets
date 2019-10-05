# A very simple Flask Hello World app for you to get started with...

from datetime import timedelta
from functools import update_wrapper
from flask import make_response, request, current_app
from flask import Flask, request, make_response
import json
import hashlib
import random
import string
import sqlite3
import secrets
from google.oauth2 import id_token
from google.auth.transport import requests

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello from Flask!!'


def user_exists(username):
    conn = sqlite3.connect('sports-bets.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE if not exists logins
                        (id integer primary key, username VARCHAR(255), hash VARCHAR(255), salt VARCHAR(255))''')

    c.execute('select * from logins where username=?', [username])
    result = c.fetchone()

    # Save (commit) the changes
    conn.commit()

    # We can also close the connection if we are done with it.
    # Just be sure any changes have been committed or they will be lost.
    conn.close()

    if result:
        return True
    return False


def create_user(username, password):
    # write changes to db
    conn = sqlite3.connect('sports-bets.db')
    c = conn.cursor()

    try:
        # Create table if not exists
        c.execute('''CREATE TABLE if not exists logins
                        (id integer primary key, username VARCHAR(255), hash VARCHAR(255), salt VARCHAR(255))''')

        # insert user
        letters = string.ascii_lowercase
        salt = ''.join(random.choice(letters) for i in range(14))
        generated_hash = hashlib.sha256(
            (password + salt).encode('utf-8')).hexdigest()
        c.execute(
            '''insert into logins(username,hash,salt) values(?,?,?)''', (username, generated_hash, salt))

        # Save (commit) the changes
        conn.commit()

        # We can also close the connection if we are done with it.
        # Just be sure any changes have been committed or they will be lost.
        conn.close()

        return True

    except Exception as e:
        print(e)
        return False


def authenticate_user(username, password):
    conn = sqlite3.connect('sports-bets.db')
    c = conn.cursor()

    c.execute('''select * from logins where username = ?''', [username])

    user_record = c.fetchone()

    # Save (commit) the changes
    conn.commit()

    # We can also close the connection if we are done with it.
    # Just be sure any changes have been committed or they will be lost.
    conn.close()

    # check if hashes match
    stored_hash = user_record[2]
    stored_salt = user_record[3]

    generated_hash = hashlib.sha256(
        (password + stored_salt).encode('utf-8')).hexdigest()

    if generated_hash == stored_hash:
        return True
    return False


def validate_token(user_token):

    # probably store tokens with users
    pass


def add_bet_to_db(payload):

    try:

        # extract user fields from payload
        game_id = payload['game_id']
        user_id = payload['user_id']
        user_pick = payload['user_pick']
        bet_type = payload['bet_type']
        bet_value = payload['bet_value']
        bet_investment = payload['bet_investment']

        # write changes to db
        conn = sqlite3.connect('sports-bets.db')
        c = conn.cursor()

        # Create table if not exists
        c.execute('''CREATE TABLE if not exists `bets` ( `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `game_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL, `user_pick` TEXT NOT NULL, `bet_type` TEXT NOT NULL, `bet_value` REAL NOT NULL, `bet_investment` REAL NOT NULL )''')

        # insert bet
        c.execute(
            '''insert into bets(game_id,user_id,user_pick,bet_type,bet_value,bet_investment) values(?,?,?,?,?,?)''', (game_id, user_id,user_pick,bet_type,bet_value,bet_investment))

        # Save (commit) the changes
        conn.commit()

        # We can also close the connection if we are done with it.
        # Just be sure any changes have been committed or they will be lost.
        conn.close()

        return True

    except Exception as e:
        print(e)
        return False


@app.route('/login', methods=['GET', 'POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
        return resp

    if request.method == 'POST':  # this block is only entered when the form is submitted

        content = request.json
        print(content)

        username = content['username']
        password = content['password']
        submit_type = content['submit_type']

        #submit_type = request.form['signup']

        resp = make_response()

        # login, auth user then return token if ok
        if submit_type == "login":
            authenticated = authenticate_user(username, password)

            if not authenticated:
                resp = make_response(json.dumps(
                    {"Message": "Authentication Failed", "Authenticated": authenticated}), 401)
            else:
                # spit out token to use as user
                token = secrets.token_urlsafe(24)

                resp = make_response(json.dumps(
                    {"Username": username, "Token": token, "Authenticated": authenticated}), 200)

        # create new user if not exist
        elif submit_type == 'signup':

            if not user_exists(username):

                create_user(username, password)

                resp = make_response(json.dumps(
                    {"Message": "User Creation Success"}), 200)
            else:
                resp = make_response(json.dumps(
                    {"Message": "User Already Exists"}), 409)

        # CORS nonsense
        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
        return resp

    if request.method == 'GET':
        return 'why would you do that'

@app.route('/login/google', methods=['POST', 'OPTIONS'])
def google_login():

    # talk with google to make sure you are who you say you are
    # (Receive token by HTTPS POST)
    # ...

    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        # Or, if multiple clients access the backend server:
        # idinfo = id_token.verify_oauth2_token(token, requests.Request())
        # if idinfo['aud'] not in [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]:
        #     raise ValueError('Could not verify audience.')

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # If auth request is from a G Suite domain:
        # if idinfo['hd'] != GSUITE_DOMAIN_NAME:
        #     raise ValueError('Wrong hosted domain.')

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        userid = idinfo['sub']
    except ValueError:
        # Invalid token
        pass

    token = secrets.token_urlsafe(24)

    return "google time"

@app.route('/bets', methods=['GET', 'POST', 'PUT', 'DELETE'])
def bet_actions():

    json_payload = json.loads(request.json)

    if validate_token(json_payload['token']):
        add_bet_to_db(json_payload)


@app.route('/sql', methods=['GET', 'POST'])
def sql():

    if request.method == 'GET':
        return 'How did you find out about this secret endpoint????'

    elif request.method == 'POST':
        conn = sqlite3.connect('sports-bets.db')
        c = conn.cursor()

        content = request.json
        print(content)

        username = content['username']
        password = content['password']
        query = content['query']

        if username == 'admin' and password == 'dogcatanotherthing':
            c.execute(query)
            result = c.fetchall()
            resp = make_response(json.dumps(result), 200)
            conn.commit()
            conn.close()
            return resp
        else:
            return make_response(json.dumps({"Message": "Unauthorized"}), 401)


@app.after_request  # blueprint can also be app~~
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response


if __name__ == "__main__":
    app.run
