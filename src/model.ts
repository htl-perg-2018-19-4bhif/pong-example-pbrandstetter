export interface IOpponentPaddle {
  code?: string,
  event?: string,
  position: number // from 0 to 100 percent
}

export interface IPoint {
  x: number;
  y: number
}

export interface ISize {
  width: number;
  height: number;
}