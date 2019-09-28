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


@app.route('/bets', methods=['GET', 'POST', 'PUT', 'DELETE'])
def bet_actions():

    user_token = request.args.get('token')

    if validate_token(user_token):
        pass


@app.after_request  # blueprint can also be app~~
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response


if __name__ == "__main__":
    app.run
