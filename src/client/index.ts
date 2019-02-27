import { IOpponentPaddle, ISize, IPoint } from '../model.js';


// const keys = <HTMLUListElement>document.getElementById('keys');
const leftPaddle = <HTMLDivElement>document.getElementsByClassName('leftPaddle')[0];
const paddleHeight = leftPaddle.clientHeight;
const paddleHalfHeight = paddleHeight / 2;
let currentPaddlePosition = leftPaddle.clientTop;
let clientSize: ISize = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };

window.addEventListener('load', async () => {
  
  /** Represents directions  */
  enum Direction { top, right, bottom, left };

  // Controls the speed of the movement (number of pixels per interval)
  const speed = 5;

  // Two helper variables that contain values during movement with cursor
  // keys. If currently not movement is happening, they are undefined.
  let interval: NodeJS.Timeout;
  let direction: number;

  // Establish connection with socket.io server. Note that this just works
  // because `<script src="/socket.io/socket.io.js"></script>` is in index.html
  const socket = io();

  // Handle ArrowKey message received from server (i.e. user pressed
  // an arrow key in a different browser window).
  socket.on('ArrowKey', pkg => {
    if (!pkg.event) {
      movePaddle(positionToPx(pkg.position));
    } else if (pkg.event === 'keydown') {
      if (!interval) {
        switch (pkg.code) {
          case 'ArrowDown':
            direction = speed;
            startMovingFromPosition(positionToPx(pkg.position));
            break;
          case 'ArrowUp':
            direction = speed * -1;
            startMovingFromPosition(positionToPx(pkg.position));
            break;
        }
      }
    } else {
      stopMoving();
      movePaddle(positionToPx(pkg.position));
    }
  })

  // Listen to keydown event
  document.addEventListener('keydown', event => {
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      const pkg: IOpponentPaddle = {
        code: event.code,
        event: 'keydown',
        position: paddlePositionToPercent()
      }
      // Send ArrowKey message to server
      socket.emit('ArrowKey', pkg);
    }
    // We have to check whether a movement is already in progress. This is
    // necessary because keydown events arrive often when key is
    // continuously pressed.
    if (!interval) {
      switch (event.code) {
        case 'ArrowDown':
          direction = speed;
          startMoving();
          break;
        case 'ArrowUp':
          direction = speed * -1;
          startMoving();
          break;
      }
    }
  });

  // Listen to keyup event
  document.addEventListener('keyup', event => {
    const pkg: IOpponentPaddle = {
      code: event.code,
      event: 'keyup',
      position: paddlePositionToPercent()
    }
    // Send ArrowKey message to server
    socket.emit('ArrowKey', pkg);

    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving();
        break;
    }
  });

  // Setup handler for touch displays (pan operation)
  const hammertime = new Hammer(leftPaddle);
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
  hammertime.on('pan', ev => {
    // Put center of paddle to the center of the user's finger
    movePaddle(ev.center.y - paddleHalfHeight);
    const pkg: IOpponentPaddle = {
      position: paddlePositionToPercent()
    }
    // Send ArrowKey message to server
    socket.emit('ArrowKey', pkg);
  });

  /** Helper function that starts movement when keydown happens */
  function startMoving() {
    // Move paddle every 4ms
    interval = setInterval(() => movePaddle(currentPaddlePosition + direction), 4);
  }

  /** Helper function that starts movement from given Position */
  function startMovingFromPosition(startPosition: number) {
    movePaddle(startPosition);
    startMoving();
  }

  /** Helper function that stops movement when keyup happens */
  function stopMoving() {
    clearInterval(interval);
    interval = direction = undefined;
  }

  /**
   * Helper function that moves the paddle to a given position
   * @param targetPosition Target position. No movement is done if target position is invalid
   */
  function movePaddle(targetPosition: number): void {
    if (targetPosition >= 0 && (targetPosition + paddleHeight) <= clientSize.height) {
      currentPaddlePosition = targetPosition;

      // Note the 'px' at the end of the coordinates for CSS. Don't
      // forget it. Without the 'px', it doesn't work.
      leftPaddle.style.setProperty('top', `${currentPaddlePosition}px`);
    }
  }

  function paddlePositionToPercent() {
    const property = leftPaddle.style.getPropertyValue('top');
    const val = Number.parseFloat(property.trim().substring(0, property.length));
    return val / clientSize.height;
  }

  function positionToPx(percent: number) {
    return percent * clientSize.height;
  }
});