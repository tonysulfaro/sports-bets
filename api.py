# A very simple Flask Hello World app for you to get started with...

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

    result = c.execute('''select * from logins where username = ?''', username)

    # Save (commit) the changes
    conn.commit()

    # We can also close the connection if we are done with it.
    # Just be sure any changes have been committed or they will be lost.
    conn.close()

    return False


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':  # this block is only entered when the form is submitted
        username = request.form.get('username')
        password = request.form.get('password')

        if not user_exists(username):

            create_user(username, password)

            # spit out token to use as user
            token = secrets.token_urlsafe(24)

            resp = make_response(json.dumps(
                {"token": token}), 200)
            resp.headers['Content-Type'] = 'application/json'
            resp.headers.add('Access-Control-Allow-Origin', '*')
            resp.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
            resp.headers.add('Access-Control-Allow-Methods',
                             'GET,PUT,POST,DELETE,OPTIONS')

            return resp
        else:
            resp = make_response(json.dumps(
                {"Error": "User Already Exists"}), 401)
            resp.headers['Content-Type'] = 'application/json'
            resp.headers.add('Access-Control-Allow-Origin', '*')
            resp.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
            resp.headers.add('Access-Control-Allow-Methods',
                             'GET,PUT,POST,DELETE,OPTIONS')

            return resp

    if request.method == 'GET':
        return 'why would you do that'


if __name__ == "__main__":
    app.run()
