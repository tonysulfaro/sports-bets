console.log('hello from script.js')

var user_authenticated = true;

function getGames() {
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

function getStandings(){
    if (!user_authenticated){
        return;
    }

    let standings_container = document.getElementById('userView');

    // remove children
    standings_container.innerHTML = "";

    let head = `<h1>My Bets</h1>`;
    let sample_table = `<table class="table">

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

getGames();