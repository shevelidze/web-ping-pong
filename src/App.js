import React from 'react';
import './App.css';


class App extends React.Component {
  constructor() {
    super();

    this.initialBallSpeed = 0.2;
    this.initialBallAcceleration = 0.1;

    this.ballSpeed = this.initialBallSpeed;
    this.ballAcceleration = this.initialBallAcceleration;

    this.racketWidth = 200;
    this.racketHeight = 10;
    this.racketBottom = 50;
    this.ballRadius = 10;

    this.baseRacketLeft = 0;
    this.baseBallLeft = 0;
    this.baseBallTop = 0;

    this.racketIsMovingLeft = false;
    this.racketIsMovingRight = false;

    this.state = {
      racketLeft: 0,
      darkThemeIsEnabled: true,
      ballTop: this.baseBallLeft,
      ballLeft: this.baseBallLeft,
      score: 0,
      loseBoxIsHidden: true
    };

    this.pressedKeys = new Set();
  }
  onKeyDown(event) {
    let direction, speed = 1.5;
    if (event.key === 'ArrowLeft') {
      direction = -1;
      this.racketIsMovingRight = false;
      this.racketIsMovingLeft = true;
    } else if (event.key === 'ArrowRight') {
      direction = 1;
      this.racketIsMovingRight = true;
      this.racketIsMovingLeft = false;
    } else {
      return;
    }
    let animationStart = performance.now();
    requestAnimationFrame(function renderFrame(time) {
      let newRacketLeft = this.baseRacketLeft + direction * speed * (time - animationStart);
      if (newRacketLeft < 0) {
        newRacketLeft = 0;
      }
      else if (newRacketLeft > window.innerWidth - this.racketWidth) {
        newRacketLeft = window.innerWidth - this.racketWidth;
      }
      this.setState({
        racketLeft: newRacketLeft
      });
      if (
        this.pressedKeys.has(event.key) &&
        !(
          (direction > 0 && !this.racketIsMovingRight) ||
          (direction < 0 && !this.racketIsMovingLeft)
        )) {
        requestAnimationFrame(renderFrame.bind(this));
      } else {
        this.baseRacketLeft = this.state.racketLeft;
      }
    }.bind(this));
  }
  toggleTheme() {
    sessionStorage.setItem('darkThemeIsEnabled', Number(!this.state.darkThemeIsEnabled));
    this.setState({ darkThemeIsEnabled: !this.state.darkThemeIsEnabled })
  }
  saveBallPosition() {
    this.baseBallLeft = this.state.ballLeft;
    this.baseBallTop = this.state.ballTop;
  }
  startBallMove(directionX, directionY) {
    let animationStart = performance.now();
    requestAnimationFrame((function drawFrame(time) {
      let newBallTop = this.baseBallTop + this.ballSpeed * directionY * (time - animationStart),
        newBallLeft = this.baseBallLeft + this.ballSpeed * directionX * (time - animationStart);
      if (
        newBallTop > (
          window.innerHeight - this.ballRadius * 2 -
          this.racketBottom - this.racketHeight
        ) &&
        newBallLeft > this.state.racketLeft &&
        newBallLeft < this.state.racketLeft + this.racketWidth - this.ballRadius * 2 &&
        directionY === 1
      ) {
        this.setState({ score: this.state.score + 1 });
        this.ballSpeed += this.ballAcceleration;
        this.ballAcceleration *= 0.9;
        console.log(this.ballSpeed, this.ballAcceleration)
        this.saveBallPosition();
        this.startBallMove(directionX, -directionY);
      } else if (newBallTop < 0) {
        this.saveBallPosition();
        this.startBallMove(directionX, -directionY);
      } else if (newBallTop > window.innerHeight - this.ballRadius * 2) {
        this.setState({ loseBoxIsHidden: false });
      } else if (newBallLeft < 0 || newBallLeft > window.innerWidth - this.ballRadius * 2) {
        this.saveBallPosition();
        this.startBallMove(-directionX, directionY);
      } else {
        this.setState({
          ballTop: newBallTop,
          ballLeft: newBallLeft,
        });
        requestAnimationFrame(drawFrame.bind(this));
      }
    }).bind(this));
  }
  getRandomBallLeft() {
    return Math.random() * (window.innerWidth - this.ballRadius * 2);
  }
  restartGame() {
    this.baseBallLeft = this.getRandomBallLeft();
    this.baseBallTop = 0;
    this.setState({
      loseBoxIsHidden: true,
      ballTop: 0,
      ballLeft: this.baseBallLeft,
      score: 0
    });
    this.ballAcceleration = this.initialBallAcceleration;
    this.ballSpeed = this.initialBallSpeed;
    this.startBallMove(1, 1);
  }
  componentDidMount() {
    this.baseBallLeft = this.getRandomBallLeft();
    this.setState({ ballLeft: this.baseBallLeft });
    this.startBallMove(1, 1);
    document.documentElement.addEventListener(
      'keydown',
      (event) => {
        if (!this.pressedKeys.has(event.key)) {
          this.pressedKeys.add(event.key);
          this.onKeyDown(event);
        }
      }
    );
    document.documentElement.addEventListener(
      'keyup',
      (event) => {
        this.pressedKeys.delete(event.key);
      }
    );
    let darkThemeStatusFromSessionStorage = sessionStorage.getItem('darkThemeIsEnabled');
    if (darkThemeStatusFromSessionStorage !== undefined) {
      this.setState({ darkThemeIsEnabled: Boolean(Number(darkThemeStatusFromSessionStorage)) });
    }
  }
  render() {
    let backgroundColor, foregroundColor;
    if (this.state.darkThemeIsEnabled) {
      backgroundColor = 'black';
      foregroundColor = 'white';
    } else {
      backgroundColor = 'white'
      foregroundColor = 'black'
    }
    return (
      <div
        id="root"
        style={
          {
            '--background-color': backgroundColor,
            '--foreground-color': foregroundColor,
            '--racket-left': this.state.racketLeft + 'px',
            '--ball-left': this.state.ballLeft + 'px',
            '--ball-top': this.state.ballTop + 'px',
            '--racket-width': this.racketWidth + 'px',
            '--racket-bottom': this.racketBottom + 'px',
            '--ball-size': this.ballRadius * 2 + 'px'
          }
        }
      >
        <div id="ball"></div>
        <div id="racket"></div>
        <div id="score">Score: {this.state.score}</div>
        <div
          id="mode"
          className={this.state.darkThemeIsEnabled ? 'sun' : 'moon'}
          onClick={this.toggleTheme.bind(this)}
        ></div>
        <div id="lose-box" className={this.state.loseBoxIsHidden ? 'hidden' : ''}>
          <div>You lose!</div>
          <div id="replay-button" onClick={this.restartGame.bind(this)}>Play again</div>
        </div>
      </div >
    );
  }
}

export default App;