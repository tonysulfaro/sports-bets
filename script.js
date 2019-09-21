console.log('hello from script.js')

function getGames() {
    let url = 'https://api.collegefootballdata.com/games?year=2019&seasonType=regular&week=3';

    fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (json_response) {
            console.log(json_response);

            let game_container = document.getElementById('games');

            json_response.forEach(element => {

                let home_team = element['home_team'];
                let away_team = element['away_team'];
                let start_date = element['start_date'];
                let home_points = element['home_points'];
                let away_points = element['away_points'];

                var gameCard = `<div class="card">
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

getGames();