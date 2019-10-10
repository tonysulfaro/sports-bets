var SESSIONINFO = {
    authenticated: false,
    googleAuthenticated: false,
    googleProfile: null,
    username: null,
    token: null,
    games: {
        cfb: null,
        nfl: null
    },
    endpoints: {
        login: 'https://tony116523.pythonanywhere.com/login',
        token: 'https://tony116523.pythonanywhere.com/token',
        bet: 'https://tony116523.pythonanywhere.com/bets',
    }
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
}

function onSuccess(googleUser) {
    console.log('Logged in as: ' + googleUser.getBasicProfile().getName());

    console.log(googleUser);
    console.log(googleUser.getAuthResponse().id_token);

    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    SESSIONINFO.googleAuthenticated = true;
    SESSIONINFO.googleProfile = profile;

    // update global
    SESSIONINFO.authenticated = true;
    SESSIONINFO.username = profile.getEmail();
    SESSIONINFO.token = 'some token for later';

    document.cookie = `token=${SESSIONINFO.token}`;

    removeLoginScreen();
    showFilteringOptions();
}

function onFailure(error) {
    console.log(error);
    showAlert('failure', 'Google Login Failed');
}

function renderButton() {
    gapi.signin2.render('my-signin2', {
        'scope': 'profile email',
        'width': 'auto',
        'height': 40,
        'longtitle': true,
        'theme': 'dark',
        'onsuccess': onSuccess,
        'onfailure': onFailure
    });
}

function removeLoginScreen() {
    // only modify nav if authenticated
    if (SESSIONINFO.authenticated) {

        var login_form_center = document.getElementById('loginform');

        // enable overflow on body
        document.body.style.overflow = "scroll";
        // show games
        showGames('cfb', 2019, 1);
        showAlert('success', 'Login Sucessful');

        // place user nav links into navbar when authenticated

        // remove main login form when logged in
        login_form_center.parentElement.removeChild(login_form_center);

        // set background to white
        document.body.style.background = 'none';
        // document.body.style.overflow = 'visible';

        // pick what username to fill in based on auth type
        let current_user = "";
        if (SESSIONINFO.googleAuthenticated) {
            current_user = SESSIONINFO.googleProfile.getEmail();
        } else {
            current_user = SESSIONINFO.username;
        }

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
        // remove spinner
        document.getElementById('loading-spinner').parentElement.removeChild(document.getElementById('loading-spinner'));
    }
}

function showFilteringOptions() {
    //add game header
    let game_header = `<h1>Games</h1>
            <div class="form-group">
            <label for="basic-url">Filter by Sport:</label>
            <select class="custom-select" id="sport-type-pick">
                <option value="ncaa-football">NCAA Football</option>
                <option value="nfl">NFL (not implemented yet)</option>
            </select>
            </div>
            <div class="form-group">
            <label for="basic-url">Filter by Season / Week:</label>
            <div class="input-group">
                <select class="custom-select" id="season-year-select">
                    <option value="2019">2019 Season</option>
                    <option value="2018">2018 Season</option>
                </select>
            <select class="custom-select" id="season-week-select">`;

    // add weeks in there for season
    for (let i = 1; i <= 15; ++i) {
        game_header += `<option value="${i}">Week ${i}</option>`;
    }

    game_header += `</select>
                
            </select>
            </div>
            </div>

            <div class="form-group">
            <label for="basic-url">Filter by Game:</label>
         
            <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon3">Game:</span>
            </div>
            <input type="text" class="form-control" id="game-filter" aria-describedby="basic-addon3">
            </div></div>`;

    document.getElementById('userView').insertAdjacentHTML('beforeend', game_header);
}

function showGames(sport, selected_year, selected_week) {

    let cfb_games = {
        game_odds_week: `https://api.sportsdata.io/v3/cfb/odds/json/GameOddsByWeek/${selected_year}/${selected_week}?key=be6928703873487fb703ca9ce13a6bc9`,
        game_scores_week: `https://api.sportsdata.io/v3/cfb/scores/json/GamesByWeek/${selected_year}/${selected_week}?key=be6928703873487fb703ca9ce13a6bc9`
    }

    let loading_spinner = `<div id="loading-spinner" class="d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>`;

    let game_container = document.getElementById('games');
    game_container.innerHTML = "";
    document.getElementById('games').insertAdjacentHTML('beforeend', loading_spinner);

    fetch(cfb_games.game_odds_week)
        .then(function (response) {
            return response.json();
        })
        .then(function (json_response) {

            SESSIONINFO.games.cfb = json_response



            // get latest scores for games
            fetch(cfb_games.game_scores_week)
                .then(function (score_response) {
                    return score_response.json();
                })
                .then(function (score_json_response) {

                    console.log(json_response);

                    // remove spinner
                    document.getElementById('loading-spinner').parentElement.removeChild(document.getElementById('loading-spinner'));

                    json_response.forEach(element => {

                        // game information
                        let game_id = element.GameId;
                        let home_team = element.HomeTeamName;
                        let away_team = element.AwayTeamName;
                        // use score data to link fields together on GameID
                        let home_points = score_json_response.filter(game => game.GameID == game_id)[0].HomeTeamScore;
                        let away_points = score_json_response.filter(game => game.GameID == game_id)[0].AwayTeamScore;
                        // date information
                        let start_date = new Date(Date.parse(element.Day)).toLocaleDateString();
                        let start_time = 'TBD';
                        // odds information
                        // try {

                        var latest_odds = null;
                        var home_money_line = null;
                        var away_money_line = null;
                        var home_point_spread = null;
                        var away_point_spread = null;
                        var home_point_spread_payout = null;
                        var away_point_spread_payout = null;
                        var over_under = null;
                        var over_payout = null;
                        var under_payout = null;

                        // populate fields if odds exist
                        if (element.PregameOdds.length !== 0) {
                            latest_odds = element.PregameOdds[0];
                            home_money_line = latest_odds.HomeMoneyLine;
                            away_money_line = latest_odds.AwayMoneyLine;
                            home_point_spread = latest_odds.HomePointSpread;
                            away_point_spread = latest_odds.AwayPointSpread;
                            home_point_spread_payout = latest_odds.HomePointSpreadPayout;
                            away_point_spread_payout = latest_odds.AwayPointSpreadPayout;
                            over_under = latest_odds.OverUnder;
                            over_payout = latest_odds.OverPayout;
                            under_payout = latest_odds.UnderPayout;
                        }

                        // add time if game has a scheduled time
                        if (element.DateTime != null) {
                            start_time = new Date(Date.parse(element.DateTime)).toLocaleTimeString();
                        }

                        var gameCard = `<div id="${game_id}" class="card">
                                <div class="card-body">
                                    <div class="container">
                                        <div class="row">
                                            <div class="col-sm-9">
                                                <p id="card-game-name"><strong>${away_team} at ${home_team}</strong></p>
                                                <div class="row">
                                                    <div class="col-sm-6">
                                                        <p>Date: ${start_date}
                                                        </p>
                                                        <p>Time: ${start_time}
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
                                                                    <td>${home_team} Money Line</td>
                                                                    <td>${home_money_line}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>${away_team} Money Line</td>
                                                                    <td>${away_money_line}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>${home_team} Point Spread</td>
                                                                    <td>${home_point_spread}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>${away_team} Point Spread</td>
                                                                    <td>${away_point_spread}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>${home_team} Point Spread Payout</td>
                                                                    <td>${home_point_spread_payout}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>${away_team} Point Spread Payout</td>
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

                        // } catch {
                        //     return;
                        // }

                    });
                })

            // filter results on keydown in filter box
            this.document.getElementById('game-filter').addEventListener('keyup', function (event) {
                console.log(event);

                let input = document.getElementById('game-filter');
                let filter = input.value.toUpperCase();
                let game_container = document.getElementById('games');
                let cards = game_container.getElementsByClassName('card');

                console.log(cards);

                for (i = 0; i < cards.length; i++) {
                    let title = cards[i].getElementsByTagName("p")[0]
                    let text_value = title.innerText || title.textContent;

                    // change visibility if it matches search query
                    if (text_value.toUpperCase().indexOf(filter) > -1) {
                        cards[i].style.display = "";
                    } else {
                        cards[i].style.display = "none";
                    }
                }
            });
        });
}

function showStandings() {
    let standings_container = document.getElementById('games');

    fetch(`${SESSIONINFO.endpoints.bet}?token=${SESSIONINFO.token}`)
        .then(function (response) {
            return response.json();
        })
        .then(function (bet_response) {
            console.log(bet_response)

            // remove children
            standings_container.innerHTML = "";

            let head = `<h1>My Bets</h1>`;
            let sample_table =
                `<table class="table">
                    <thead class="thead-dark">
                    <tr>
                        <th scope="col">Date/Time</th>
                        <th scope="col">Game</th>
                        <th scope="col">Pick</th>
                        <th scope="col">Winner</th>
                        <th scope="col">Bet Type</th>
                        <th scope="col">Bet Value</th>
                        <th scope="col">Investment</th>
                        <th scope="col">Net Gain / Loss</th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr>
                        <th scope="row">9/14/19 6:00 PM</th>
                        <td>Arizona State At Michigan State</td>
                        <td>Michigan State</td>
                        <td>Arizona State</td>
                        <td>Money Line</td>
                        <td>+657</td>
                        <td>$20.00</td>
                        <td>-$20.00</td>
                    </tr>`

            // generate view of bets
            bet_response.forEach(bet => {

                let game_id = bet[1];
                let user_pick = bet[3];
                let bet_type = bet[4];
                let bet_type_value = bet[5];
                let investment_amount = bet[6];

                let row_template = `<tr>
                        <th scope="row">9/14/19 6:00 PM</th>
                        <td>${game_id}</td>
                        <td>${user_pick}</td>
                        <td>{winning_team_value}</td>
                        <td>${bet_type}</td>
                        <td>${bet_type_value}</td>
                        <td>$${investment_amount}</td>
                        <td>{calculated_gain_loss}</td>
                    </tr>`
                sample_table += row_template;
            });

            // get sum of all invested money
            let total_investments = 0;
            bet_response.forEach(bet => {
                total_investments += bet[6];
            });

            sample_table += `</tbody><thead class="bg-danger">
                <tr>
                <th scope="col">Totals</th>
                <th scope="col"></th>
                <th scope="col"></th>
                <th scope="col"></th>
                <th scope="col"></th>
                <th scope="col"></th>
                <th scope="col">$${parseFloat(total_investments).toFixed(2)}</th>
                <th scope="col">-$20.00</th>
                </tr>
            </thead>
            </table>`;

            standings_container.insertAdjacentHTML('beforeend', head);
            standings_container.insertAdjacentHTML('beforeend', sample_table);
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
                                    <input type="number" class="form-control" id="bet-type-value">
                                </div>`;
        setBetFormItems(money_line_controls);

    } else if (bet_type == 'money-line') {
        let money_line_controls = `<div class="form-group">
                                    <label for="money-line" class="col-form-label">Money Line:</label>
                                    <input type="number" class="form-control" id="bet-type-value">
                                </div>`;
        setBetFormItems(money_line_controls);

    } else if (bet_type == 'spread') {
        let money_line_controls = `<div class="form-group">
                                    <label for="spread" class="col-form-label">Spread:</label>
                                    <input type="number" class="form-control" id="bet-type-value">
                                </div>`;
        setBetFormItems(money_line_controls);
    }
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
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

                // show spinner on button press
                var login_form_center = document.getElementById('loginform');
                let loading_spinner = `<div id="loading-spinner" class="d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>`;
                login_form_center.insertAdjacentHTML('beforeend', loading_spinner);

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

                    document.cookie = `token=${SESSIONINFO.token}`;

                    removeLoginScreen();
                    showFilteringOptions();

                } catch (error) {
                    console.error('Error:', error);
                    showAlert('failure', 'Something Went Wrong');
                    document.getElementById('loading-spinner').parentElement.removeChild(document.getElementById('loading-spinner'));
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
                if (SESSIONINFO.googleAuthenticated) {
                    signOut();
                }
                window.location.reload();
            }
            // show games on nav click
            else if (event.srcElement.id == 'games-link') {
                if (SESSIONINFO.authenticated) {
                    showGames('cfb', 2019, 1);
                }
            }
            // show standings when authenticated
            else if (event.srcElement.id == 'standings-link') {
                if (!SESSIONINFO.authenticated) {
                    return;
                }

                showStandings();
            }
            // place bet on game list clicked
            else if (event.srcElement.id == 'place-bet') {

                let game_id = event.srcElement.value;
                let betting_game = SESSIONINFO.games.cfb.find(function (element) {
                    return element['GameId'] == game_id;
                });

                // set game name in bet form
                $('#game-name').val(betting_game.AwayTeamName + ' at ' + betting_game.HomeTeamName);
                $('#confirm-bet').val(game_id);

                // add winner pick options in form
                document.getElementById('winner-pick').innerHTML = '';
                document.getElementById('winner-pick').insertAdjacentHTML('beforeend', `<option selected>${betting_game.AwayTeamName}</option>`);
                document.getElementById('winner-pick').insertAdjacentHTML('beforeend', `<option selected>${betting_game.HomeTeamName}</option>`);
            }
            // confirm bet place on modal
            else if (event.srcElement.id == 'confirm-bet') {
                // TODO: actually send request to place bet
                showAlert('success', 'Bet Placed');

                let game_id = event.srcElement.value;
                let user_pick = document.getElementById('winner-pick').value;
                let bet_type = document.getElementById('bet-type-pick').value;
                let bet_type_value = document.getElementById('bet-type-value').value;
                let bet_investment = document.getElementById('investment-amount').value;

                console.log(game_id);
                console.log(user_pick);
                console.log(bet_type);
                console.log(bet_type_value);
                console.log(bet_investment);

                payload = {
                    token: SESSIONINFO.token,
                    game_id: Number(game_id),
                    user_pick: user_pick,
                    bet_type: bet_type,
                    bet_type_value: Number(bet_type_value),
                    bet_investment: Number(bet_investment)
                }

                console.log(payload);

                fetch(SESSIONINFO.endpoints.bet, {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify(payload), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(function (response) {
                        console.log('');
                    })
            }

            // change week
            else if (event.srcElement.id == 'season-week-select') {
                let selected_week = event.srcElement.value;
                let selected_year = document.getElementById('season-year-select').value;
                console.log(selected_week);
                // update view
                showGames('cfb', selected_year, selected_week);
            }

            // change year
            else if (event.srcElement.id == 'season-year-select') {
                let selected_year = event.srcElement.value;
                let selected_week = document.getElementById('season-week-select').value;
                console.log(selected_year);
                // update view
                showGames('cfb', selected_year, selected_week);
            }

        });

        // change modal form on bet type change
        this.document.getElementById('bet-type-pick').addEventListener('change', function (event) {
            let bet_type = event.srcElement.value;
            updateBetForm(bet_type);
        });

    }


};