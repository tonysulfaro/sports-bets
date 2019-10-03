var SESSIONINFO = {
    authenticated: false,
    username: null,
    token: null,
    games: {
        cfb: null,
        nfl: null
    },
    endpoints: {
        login: 'https://tony116523.pythonanywhere.com/login',
        bet: 'https://tony116523.pythonanywhere.com/bet',
        cfb_games: {
            games_this_week: `https://api.sportsdata.io/v3/cfb/odds/json/GameOddsByWeek/2019/6?key=be6928703873487fb703ca9ce13a6bc9`
        }
    }
}

window.onload = function () {
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

                let form_username = document.getElementById('username-input').value;
                let form_password = document.getElementById('password-input').value;

                // payload for login to endpoint
                let payload = {
                    username: form_username,
                    password: form_password,
                    submit_type: "login"
                };

                console.log(SESSIONINFO);

                try {
                    const response = await fetch(SESSIONINFO.endpoints.login, {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify(payload), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const json = await response.json();

                    // update global
                    SESSIONINFO.authenticated = json['Authenticated'];
                    SESSIONINFO.username = json['Username'];
                    SESSIONINFO.token = json['Token'];

                    // only modify nav if authenticated
                    if (SESSIONINFO.authenticated) {

                        // show games
                        showGames();
                        showAlert('success', 'Login Sucessful');

                        // place user nav links into navbar when authenticated

                        // remove main login form when logged in
                        var login_form_center = document.getElementById('loginform');
                        login_form_center.parentElement.removeChild(login_form_center);

                        // set background to white
                        document.body.style.background = 'none';
                        // document.body.style.overflow = 'visible';

                        let current_user = json['Username'];

                        let nav_bar = `<nav class="navbar fixed-top navbar-expand-lg navbar-dark bg-dark">
                            <a class="navbar-brand" href="#">Sports Bet Tracker</a>
                            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                                <span class="navbar-toggler-icon"></span>
                            </button>

                            <div class="collapse navbar-collapse" id="navbarSupportedContent"><ul class="navbar-nav mr-auto">
                                            <li class="nav-item">
                                                <a id="games-link" class="nav-link" href="#">Games <span class="sr-only">(current)</span></a>
                                            </li>
                                            <li class="nav-item">
                                                <a id="standings-link" class="nav-link" href="#">My Standings</a>
                                            </li>
                                        </ul>

                                <form id="loginformnav" class="form-inline my-2 my-lg-0"><span id="current-user" class="navbar-text light">
                                    ${current_user}</span><button id="logout-button" class="btn btn-outline-success my-2 my-sm-0" type="submit" value="logout">Logout</button></form>
                            </div>
                        </nav>`;
                        document.body.insertAdjacentHTML('afterbegin', nav_bar);

                    } else {
                        // display authentication error
                        showAlert('failure', 'Login Failed');
                    }

                } catch (error) {
                    console.error('Error:', error);
                }
            }
            // signup button clicked
            else if (event.srcElement.id == 'signup-button') {

                event.preventDefault();

                let form_username = document.getElementById('username-input').value;
                let form_password = document.getElementById('password-input').value;

                // form validation
                if (form_username == '' || form_password == '') {
                    showAlert('failure', 'username and password cannot be null');
                    return;
                }

                // payload for signup to endpoint
                let payload = {
                    username: form_username,
                    password: form_password,
                    submit_type: "signup"
                };

                // send signup request
                try {
                    const response = await fetch(SESSIONINFO.endpoints.login, {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify(payload), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const json = await response.json();

                    if (response.status === 200) {
                        showAlert('success', 'New User Created');
                    } else {
                        showAlert('failure', json['Message']);
                    }

                } catch (error) {
                    console.error('Error:', error);
                }
            }
            // logout button clicked
            else if (event.srcElement.id == 'logout-button') {
                event.preventDefault();
                window.location.reload();
            }
            // show games on nav click
            else if (event.srcElement.id == 'games-link') {
                if (SESSIONINFO.authenticated) {
                    showGames();
                }
            }
            // show standings when authenticated
            else if (event.srcElement.id == 'standings-link') {
                if (!SESSIONINFO.authenticated) {
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
            // place bet on game list clicked
            else if (event.srcElement.id == 'place-bet') {

                let game_id = event.srcElement.value;
                let betting_game = SESSIONINFO.games.cfb.find(function (element) {
                    return element['GameId'] == game_id;
                });

                // set game name in bet form
                $('#game-name').val(betting_game.AwayTeamName + ' at ' + betting_game.HomeTeamName);

                // add winner pick options in form
                document.getElementById('winner-pick').innerHTML = '';
                document.getElementById('winner-pick').insertAdjacentHTML('beforeend', `<option selected>${betting_game.home_team}</option>`);
                document.getElementById('winner-pick').insertAdjacentHTML('beforeend', `<option selected>${betting_game.away_team}</option>`);
            }
            // confirm bet place on modal
            else if (event.srcElement.id == 'confirm-bet') {
                // TODO: actually send request to place bet
                showAlert('success', 'Bet Placed');
            }

        });

        // change modal form on bet type change
        this.document.getElementById('bet-type-pick').addEventListener('change', function (event) {
            let bet_type = event.srcElement.value;
            updateBetForm(bet_type);
        });

        // filter results on keydown in filter box
        this.document.getElementById('game-filter').addEventListener('keydown', function (event) {
            console.log(event);
        })

    }

    function showAlert(alert_type, message) {

        // hide alerts if present
        $('#failure-alert').hide();
        $('#success-alert').hide();


        if (alert_type == 'success') {
            $('#success-alert-text').text(message);
            $('#success-alert').show();

            // hide alert after time
            setInterval(function () {
                $('#success-alert').hide();
            }, 4000);

        } else if (alert_type == 'failure') {
            $('#failure-alert-text').text(message);
            $('#failure-alert').show();
            // users must manually dismiss error messages
        }
    }

    function updateBetForm(bet_type) {

        let bet_form_controls = document.getElementById('bet-type-items');

        function setBetFormItems(money_line_controls) {
            bet_form_controls.innerHTML = '';
            bet_form_controls.insertAdjacentHTML('beforeend', money_line_controls)
        }

        if (bet_type == 'over-under') {
            let money_line_controls = `<div class="form-group">
                                    <label for="over-under" class="col-form-label">Over Under:</label>
                                    <input type="number" class="form-control" id="over-under">
                                </div>`;
            setBetFormItems(money_line_controls);

        } else if (bet_type == 'money-line') {
            let money_line_controls = `<div class="form-group">
                                    <label for="money-line" class="col-form-label">Money Line:</label>
                                    <input type="number" class="form-control" id="money-line">
                                </div>`;
            setBetFormItems(money_line_controls);

        } else if (bet_type == 'spread') {
            let money_line_controls = `<div class="form-group">
                                    <label for="spread" class="col-form-label">Spread:</label>
                                    <input type="number" class="form-control" id="spread">
                                </div>`;
            setBetFormItems(money_line_controls);
        }
    }

    function showGames() {

        fetch(SESSIONINFO.endpoints.cfb_games.games_this_week)
            .then(function (response) {
                return response.json();
            })
            .then(function (json_response) {

                SESSIONINFO.games.cfb = json_response

                let game_container = document.getElementById('userView');
                game_container.innerHTML = "";

                //add game header
                let game_header = `<h1>Games</h1><select class="custom-select" id="sport-type-pick">
                                    <option value="money-line">NCAA Football</option>
                                    <option value="over-under">NFL</option>
                                </select><label for="basic-url">Filter Results:</label>
                                <div class="input-group mb-3">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="basic-addon3">Game:</span>
                                </div>
                                <input type="text" class="form-control" id="game-filter" aria-describedby="basic-addon3">
                                </div>`;
                game_container.insertAdjacentHTML('beforeend', game_header);

                json_response.forEach(element => {

                    // game information
                    let game_id = element.GameId;
                    let home_team = element.HomeTeamName;
                    let away_team = element.AwayTeamName;
                    let home_points = element.HomeTeamScore;
                    let away_points = element.AwayTeamScore;

                    // date information
                    let start_date = new Date(Date.parse(element.DateTime));
                    let start_year = start_date.getFullYear();
                    let start_month = start_date.getMonth();
                    let start_day = start_date.getDate();
                    let start_hour = start_date.getHours();
                    let start_minute = start_date.getMinutes();

                    // odds information
                    let latest_odds = element.PregameOdds[0];
                    let home_money_line = latest_odds.HomeMoneyLine;
                    let away_money_line = latest_odds.AwayMoneyLine;
                    let home_point_spread = latest_odds.HomePointSpread;
                    let away_point_spread = latest_odds.AwayPointSpread;
                    let home_point_spread_payout = latest_odds.HomePointSpreadPayout;
                    let away_point_spread_payout = latest_odds.AwayPointSpreadPayout;
                    let over_under = latest_odds.OverUnder;
                    let over_payout = latest_odds.OverPayout;
                    let under_payout = latest_odds.UnderPayout;

                    var gameCard = `<div id="${game_id}" class="card">
            <div class="card-body">
                <div class="container">
                    <div class="row">
                        <div class="col-sm-9">
                            <p id="card-game-name"><strong>${away_team} at ${home_team}</strong></p>
                            <div class="row">
                                <div class="col-sm-6">
                                    <p>Start Time: ${start_month}/${start_day}/${start_year} at
                                        ${start_hour}:${start_minute}
                                    </p>
                                    <p><i><strong>Current Score:</strong></i></p>
                                    <p>${home_team}: ${home_points}</p>
                                    <p>${away_team}: ${away_points}</p>
                                </div>
                                <div class="col-sm-6">
                                    <table class="table table-borderless">
                                        <thead>
                                            <th scope="col">Odd Type</th>
                                            <th scope="col">Value</th>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Home Money Line</td>
                                                <td>${home_money_line}</td>
                                            </tr>
                                            <tr>
                                                <td>Away Money Line</td>
                                                <td>${away_money_line}</td>
                                            </tr>
                                            <tr>
                                                <td>Home Point Spread</td>
                                                <td>${home_point_spread}</td>
                                            </tr>
                                            <tr>
                                                <td>Away Point Spread</td>
                                                <td>${away_point_spread}</td>
                                            </tr>
                                            <tr>
                                                <td>Home Point Spread Payout</td>
                                                <td>${home_point_spread_payout}</td>
                                            </tr>
                                            <tr>
                                                <td>Away Point Spread Payout</td>
                                                <td>${away_point_spread_payout}</td>
                                            </tr>
                                            <tr>
                                                <td>Over Under</td>
                                                <td>${over_under}</td>
                                            </tr>
                                            <tr>
                                                <td>Over Payout</td>
                                                <td>${over_payout}</td>
                                            </tr>
                                            <tr>
                                                <td>Under Payout</td>
                                                <td>${under_payout}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                </div>
                            </div>

                        </div>
                        <div class="col-sm-3">
                            <div class="card-actions">
                                <button id="place-bet" value="${game_id}" type="button" class="btn btn-success"
                                    data-toggle="modal" data-target="#exampleModal" data-whatever="@mdo">Place
                                    Bet</button>
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