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


def get_user_from_token(user_token):
    conn = sqlite3.connect('sports-bets.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE if not exists logins
                        (id integer primary key, username VARCHAR(255), hash VARCHAR(255), salt VARCHAR(255))''')

    c.execute('select * from logins where token=?', [user_token])
    result = c.fetchone()

    # Save (commit) the changes
    conn.commit()

    # We can also close the connection if we are done with it.
    # Just be sure any changes have been committed or they will be lost.
    conn.close()

    if result:
        return result
    return False


def create_user(username, password):
    # write changes to db
    conn = sqlite3.connect('sports-bets.db')
    c = conn.cursor()

    try:
        # Create table if not exists
        c.execute('''CREATE TABLE if not exists logins
                        (id integer primary key, username VARCHAR(255), hash VARCHAR(255), salt VARCHAR(255), token VARCHAR(255))''')

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
    # write changes to db
    conn = sqlite3.connect('sports-bets.db')
    c = conn.cursor()

    # Create table if not exists
    c.execute(
        '''select * from logins where token = ?''', [(user_token)])
    # insert bet
    result = c.fetchone()

    # Save (commit) the changes
    conn.commit()

    # We can also close the connection if we are done with it.
    # Just be sure any changes have been committed or they will be lost.
    conn.close()

    print(result is not None)

    return result is not None


def update_user_token(username, token):
    try:
        # write changes to db
        conn = sqlite3.connect('sports-bets.db')
        c = conn.cursor()

        # Create table if not exists
        c.execute(
            '''CREATE TABLE if not exists `bets` ( `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `game_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL, `user_pick` TEXT NOT NULL, `bet_type` TEXT NOT NULL, `bet_value` TEXT NOT NULL, `bet_investment` REAL NOT NULL )''')

        # insert bet
        c.execute(
            '''update logins set token = ? where username = ?''',
            (token, username))

        # Save (commit) the changes
        conn.commit()

        # We can also close the connection if we are done with it.
        # Just be sure any changes have been committed or they will be lost.
        conn.close()

        return True

    except:
        return False


def get_user_bets(user_id):
    try:
        # write changes to db
        conn = sqlite3.connect('sports-bets.db')
        c = conn.cursor()

        # insert bet
        c.execute(
            '''select * from bets where user_id = ?''', [(user_id)])

        # Save (commit) the

        result = c.fetchall()
        conn.commit()

        # We can also close the connection if we are done with it.
        # Just be sure any changes have been committed or they will be lost.
        conn.close()

        return result

    except Exception as e:
        print(e)
        return []


def add_bet_to_db(payload):
    print('write bet to db')

    try:

        # extract user fields from payload
        token = payload['token']
        user_id = get_user_from_token(token)[0]
        game_id = int(payload['game_id'])
        user_pick = payload['user_pick']
        bet_type = payload['bet_type']
        bet_value = payload['bet_type_value']
        bet_investment = float(payload['bet_investment'])



        print(token, user_id, game_id, user_pick, bet_type, bet_value, bet_investment)

        # write changes to db
        conn = sqlite3.connect('sports-bets.db')
        c = conn.cursor()

        # Create table if not exists
        c.execute(
            '''CREATE TABLE if not exists `bets` ( `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `game_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL, `user_pick` TEXT NOT NULL, `bet_type` TEXT NOT NULL, `bet_value` REAL NOT NULL, `bet_investment` REAL NOT NULL )''')

        # insert bet
        c.execute(
            '''insert into bets(game_id,user_id,user_pick,bet_type,bet_value,bet_investment) values(?,?,?,?,?,?)''',
            (game_id, user_id, user_pick, bet_type, bet_value, bet_investment))

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

        # submit_type = request.form['signup']

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

                update_user_token(username, token)
                validate_token(token)

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
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
        return resp

    elif request.method == 'POST':

        # talk with google to make sure you are who you say you are
        # (Receive token by HTTPS POST)
        # ...

        try:

            payload = request.json
            token = payload['token']

            # token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlNGRiZDA2YzA2NjgzY2I0OGRkZGNhNmI4OGMzZTQ3M2I2OTE1YjkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNjk1MzcyMzk0MjMtMW5uNzh0NWs3Z20ybmxnYWZ0Y21pNmY0dXQ5cmNyMmkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2OTUzNzIzOTQyMy0xbm43OHQ1azdnbTJubGdhZnRjbWk2ZjR1dDlyY3IyaS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExNDEwNDMxOTgxNzc4ODYyMDM5OCIsImVtYWlsIjoidG9ueTExNjUyM0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6InktTEc2OTFjTlk2dGFLRzF0d3NkbGciLCJuYW1lIjoidG9ueSBTdWxmYXJvIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BQXVFN21BNm1tY1U2V1V3enhNN0FhRm55UFBXMFZqa0JYT2FpdkFMQkdBY19nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6InRvbnkiLCJmYW1pbHlfbmFtZSI6IlN1bGZhcm8iLCJsb2NhbGUiOiJlbiIsImlhdCI6MTU3MDQxMjg3MiwiZXhwIjoxNTcwNDE2NDcyLCJqdGkiOiIxODZjZTJiOGU1OWZhODBlODY2NDliNDJkOGM0ZmU4ZWMyY2NkYzlmIn0.pTA5ZUcauPVKDukx_iLZIPFJ347GRrIyY3MF-l2SttW10NsBq5bMRnBbkuFFWXzTCxHUlxBrbzI_6TLjQZ8NSkwI-3y0rOmorzGG02kGg3qrTv2jtUdADRSNzBG05sL3qNIQDBepkj0FhKocKQ7nnaD3dKeH7pH_8bpIiWpMmjG9CvY0CVQZ8Jf6S8uxj2ObzUrVznZ_06sQMVU6yD5AodPRiiSFKLOnAouVcvsi30Wweb0S0YW4Ry8b20sigYKKz9a8QDRTBIWvdIfkijud0S4K-PPiAHXx6mV_CSJ9TePTnBSkqBfffRCBrOMhhsl2k5skHQ_sTiyt3r3PXFbTQg'
            CLIENT_ID = '69537239423-1nn78t5k7gm2nlgaftcmi6f4ut9rcr2i.apps.googleusercontent.com'

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
            user_email = idinfo['email']
            user_id = idinfo['sub']

            print('userid', user_email)

            # this is probably bad, don't do this
            if not user_exists(user_email):
                create_user(user_email, user_id)

            token = secrets.token_urlsafe(24)

            update_user_token(user_email, token)

            resp = make_response(json.dumps(
                {"Username": user_email, "Token": token, "Authenticated": True}), 200)

            resp.headers['Content-Type'] = 'application/json'
            resp.headers.add('Access-Control-Allow-Origin', '*')
            resp.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
            resp.headers.add('Access-Control-Allow-Methods',
                             'GET,PUT,POST,DELETE,OPTIONS')
            return resp

        except Exception as e:
            # Invalid token
            print(e)

        resp = make_response(json.dumps(
            {"Message": "Something went horribly wrong here"}), 500)

        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
        return resp


@app.route('/bets', methods=['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'])
def bet_actions():
    print('bet time')

    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
        return resp

    if request.method == 'GET':

        resp = make_response()

        try:
            token = request.args.get('token')
            user_auth_ok = validate_token(token)

            if user_auth_ok:

                user_id = get_user_from_token(token)[0]

                user_bets = get_user_bets(user_id)

                print(user_bets)

                resp = make_response(json.dumps(
                    user_bets), 200)
            else:
                resp = make_response(json.dumps(
                    {"Message": "Invalid Token"}), 401)
        except:
            resp = make_response(json.dumps(
                {"Message": "Something went wrong when getting bets"}), 500)

        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')

        return resp

    elif request.method == 'POST':

        print('time to place bet for real')

        resp = make_response()

        json_payload = request.json
        user_auth_ok = validate_token(json_payload['token'])

        print(json_payload)



        if user_auth_ok:
            print('user auth ok, write bet to db')
            bet_placed = add_bet_to_db(json_payload)

            resp = make_response(json.dumps(
                    {"Message": "Bet Placed", "UserAuthenticated":user_auth_ok, "SourcePayload":json_payload, "BetPlaced":bet_placed}), 201)

            return resp

            if bet_placed:

                print('bet place sucessful')

                resp = make_response(json.dumps(
                    {"Message": "Bet Placed"}), 201)
            else:

                resp = make_response(json.dumps(
                    {"Message": "Something went wrong when placing bet"}), 500)

        else:

            resp = make_response(json.dumps(
                {"Message": "Invalid Token"}), 401)

        # CORS nonsense
        resp.headers['Content-Type'] = 'application/json'
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')

        return resp


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

            resp.headers['Content-Type'] = 'application/json'
            resp.headers.add('Access-Control-Allow-Origin', '*')
            resp.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
            resp.headers.add('Access-Control-Allow-Methods',
                             'GET,PUT,POST,DELETE,OPTIONS')

            return resp
        else:
            return make_response(json.dumps({"Message": "Unauthorized"}), 401)


@app.after_request  # blueprint can also be app~~
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response


if __name__ == "__main__":
    app.run(debug=True)
