var USERINFO = {
    authenticated: false,
    username: null,
    token: null
}

window.onload = function () {
    this.console.log('doing stuff on load');

    new Bets();
}

const Bets = function () {

    installListeners();

    function installListeners() {
        // auth buttons
        this.document.addEventListener('click', async function (event) {

            // login button clicked
            if (event.srcElement.id == 'login-button') {

                event.preventDefault();
                console.log('login time');

                console.log('lets try to login at the endpoint')

                let login_url = 'http://localhost:5000/login';

                let form_username = document.getElementById('username-input').value;
                let form_password = document.getElementById('password-input').value;

                console.log(form_username, form_password);

                let payload = {
                    username: form_username,
                    password: form_password,
                    submit_type: "login"
                };

                console.log('payload')
                console.log(payload)

                try {
                    const response = await fetch(login_url, {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify(payload), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const json = await response.json();
                    console.log('Success:', json);

                    // update global
                    USERINFO['authenticated'] = json['Authenticated'];
                    USERINFO['username'] = json['Username'];
                    USERINFO['token'] = json['Token'];

                    // only modify nav if authenticated
                    if (USERINFO['authenticated']) {
                        console.log('authenticated');

                        // show games
                        showGames();

                        // show alert
                        $('#login-failure-alert').hide();
                        $('#login-success-alert').show();

                        var login_form = document.getElementById('loginform');
                        login_form.innerHTML = '';
                        let current_user = json['Username'];
                        let current_user_label = `<span class="navbar-text light">
                ` + current_user + `</span>`;
                        let logout_button = `<button id="logout-button" class="btn btn-outline-success my-2 my-sm-0" type="submit"
                    value="logout">Logout</button>`;

                        login_form.insertAdjacentHTML('beforeend', current_user_label)
                        login_form.insertAdjacentHTML('beforeend', logout_button)

                    } else {
                        // display authentication error
                        $('#login-failure-alert').show();
                    }

                } catch (error) {
                    console.error('Error:', error);
                }
            }
            // signup button clicked
            else if (event.srcElement.id == 'signup-button') {

                event.preventDefault();
                console.log('signup time');

                console.log('lets try to signup at the endpoint')

                let login_url = 'http://localhost:5000/login';

                let form_username = document.getElementById('username-input').value;
                let form_password = document.getElementById('password-input').value;

                console.log(form_username, form_password);

                let payload = {
                    username: form_username,
                    password: form_password,
                    submit_type: "signup"
                };

                console.log('payload')
                console.log(payload)

                try {
                    const response = await fetch(login_url, {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify(payload), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const json = await response.json();
                    console.log('Success:', json);

                    if (response.status === 200) {
                        alert('new user creation successful')
                    } else {
                        alert('Error ' + json['Message'])
                    }

                } catch (error) {
                    console.error('Error:', error);
                }
            }
            // logout button clicked
            else if (event.srcElement.id == 'logout-button') {

                event.preventDefault();
                console.log('logging out');
                window.location.reload();
            }
            // show games on nav click
            else if (event.srcElement.id == 'games-link') {
                if (USERINFO['authenticated']) {
                    showGames();
                }
            }
            // show standings when authenticated
            else if (event.srcElement.id == 'standings-link') {
                if (!USERINFO['authenticated']) {
                    return;
                }

                let standings_container = document.getElementById('userView');

                // remove children
                standings_container.innerHTML = "";

                let head = `<h1>My Bets</h1>`;
                let sample_table =
                    `<table class="table">
                    <thead class="thead-dark">
                    <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Game</th>
                        <th scope="col">Pick</th>
                        <th scope="col">Winner</th>
                        <th scope="col">Ratio</th>
                        <th scope="col">Investment</th>
                        <th scope="col">Value</th>
                        <th scope="col">Net Gain / Loss</th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr>
                        <th scope="row">9/14/19</th>
                        <td>Arizona State At Michigan State</td>
                        <td>Michigan State</td>
                        <td>Arizona State</td>
                        <td>2:1</td>
                        <td>$20.00</td>
                        <td>-$40.00</td>
                        <td>-$40.00</td>
                    </tr>
                    </tbody>

                    <thead class="bg-danger">
                        <tr>
                        <th scope="col">Totals</th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                        <th scope="col">$20.00</th>
                        <th scope="col">-$40.00</th>
                        <th scope="col">-$40.00</th>
                        </tr>
                    </thead>
                    </table>`;

                standings_container.insertAdjacentHTML('beforeend', head);
                standings_container.insertAdjacentHTML('beforeend', sample_table);
            }
        });
    }

    function showGames() {
        let url = 'https://api.collegefootballdata.com/games?year=2019&seasonType=regular&week=3';

        fetch(url)
            .then(function (response) {
                return response.json();
            })
            .then(function (json_response) {
                console.log(json_response);

                let game_container = document.getElementById('userView');
                game_container.innerHTML = "";

                //add game header
                let game_header = `<h1>Games</h1>`;
                game_container.insertAdjacentHTML('beforeend', game_header);

                json_response.forEach(element => {

                    let home_team = element['home_team'];
                    let away_team = element['away_team'];
                    let start_date = element['start_date'];
                    let home_points = element['home_points'];
                    let away_points = element['away_points'];

                    var gameCard = `
                            <div class="card">
                            <div class="card-header">
                                ` + away_team + ' at ' + home_team + `
                            </div>
                            <div class="card-body">
                                <div class="container">
                                    <div class="row">
                                        <div class="col-sm-9">

                                            <p>Start Time: ` + start_date + `</p>
                                            <h3>Current Score</h3>
                                            <p>` + home_team + " : " + home_points + `</p>
                                            <p>` + away_team + " : " + away_points + `</p>

                                        </div>
                                        <div class="col-sm-3">
                                            <div class="card-actions">
                                                <button type="button" class="btn btn-success">Place Bet</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>`;
                    game_container.insertAdjacentHTML('beforeend', gameCard);

                });
            })
    }
};