var CanvasHandlerInstance = null;
var CurrentCanvasWorkerState = "Uninitialized";

function GenerateRandomPointInside(MinY, MaxY, MinX, MaxX) {
  if (
    typeof MinX != "number" ||
    typeof MinY != "number" ||
    typeof MaxX != "number" ||
    typeof MaxY != "number"
  ) {
    throw TypeError("");
  }
  return {
    x: MinX + Math.random() * (MaxX - MinX),
    y: MinY + Math.random() * (MaxY - MinY),
  };
}

class Point {
  constructor(
    X,
    Y,
    MinY,
    MaxY,
    MinX,
    MaxX,
    Speed,
    Angle,
    Size,
    Color,
    CooldownFrames,
  ) {
    if (
      typeof X != "number" ||
      typeof Y != "number" ||
      typeof MinX != "number" ||
      typeof MinY != "number" ||
      typeof MaxX != "number" ||
      typeof MaxY != "number" ||
      typeof Speed != "number" ||
      typeof Angle != "number" ||
      typeof Size != "number" ||
      typeof Color != "string" ||
      typeof CooldownFrames != "number"
    ) {
      throw TypeError("");
    }
    this.X = X;
    this.Y = Y;
    this.MinX = MinX;
    this.MaxX = MaxX;
    this.MinY = MinY;
    this.MaxY = MaxY;
    this.Speed = Speed;
    this.Angle = Angle;
    this.SpeedX = this.Speed * Math.cos(this.Angle);
    this.SpeedY = this.Speed * Math.sin(this.Angle);
    this.Size = Size;
    this.Color = Color;
    this.Acceleration = 0;
    this.State = 0;
    this.FrameCounter = 0;
    this.OriginalSize = Size;
    this.CooldownFrames = CooldownFrames;
  }

  NextPosition() {
    let FinalX = this.X + this.SpeedX;
    let FinalY = this.Y + this.SpeedY;
    if (FinalX <= this.MinX) {
      if (FinalY <= this.MinY) {
        this.Angle = (Math.random() * Math.PI) / 2;
        FinalY = this.MinY;
      } else if (FinalY >= this.MaxY) {
        this.Angle = (-Math.random() * Math.PI) / 2;
        FinalY = this.MaxY;
      } else {
        this.Angle = (Math.random() - 0.5) * Math.PI;
      }
      FinalX = this.MinX;
      this.ChangingAngle = true;
    } else if (FinalX >= this.MaxX) {
      if (FinalY <= this.MinY) {
        this.Angle = ((Math.random() + 1) * Math.PI) / 2;
        FinalY = this.MinY;
      } else if (FinalY >= this.MaxY) {
        this.Angle = (-(Math.random() + 1) * Math.PI) / 2;
        FinalY = this.MaxY;
      } else {
        this.Angle = (Math.random() + 0.5) * Math.PI;
      }
      FinalX = this.MaxX;
      this.ChangingAngle = true;
    } else {
      if (FinalY <= this.MinY) {
        this.Angle = Math.random() * Math.PI;
        FinalY = this.MinY;
        this.ChangingAngle = true;
      } else if (FinalY >= this.MaxY) {
        this.Angle = -(Math.random() * Math.PI);
        FinalY = this.MaxY;
        this.ChangingAngle = true;
      }
    }
    this.X = FinalX;
    this.Y = FinalY;
    if (this.ChangingAngle) {
      this.SetAngle(this.Angle);
    }
    this.Speed *= this.Acceleration;
    this.SpeedX *= this.Acceleration;
    this.SpeedY *= this.Acceleration;
  }

  GetPositionOnCanvas(CanvasWidth, CanvasHeight) {
    if (typeof CanvasWidth != "number" || typeof CanvasHeight != "number") {
      throw TypeError("");
    }
    return { x: this.X, y: CanvasHeight - this.Y };
  }

  SetEscapeDirection(CanvasTargetX, CanvasTargetY, CanvasWidth, CanvasHeight) {
    if (
      typeof CanvasTargetX != "number" ||
      typeof CanvasTargetY != "number" ||
      typeof CanvasWidth != "number" ||
      typeof CanvasHeight != "number"
    ) {
      throw TypeError("");
    }
    let DeltaX = this.X - CanvasTargetX;
    let DeltaY = this.Y - CanvasHeight + CanvasTargetY;
    if (DeltaX > 0) {
      this.Angle = Math.atan(DeltaY / DeltaX);
    } else if (DeltaX < 0) {
      this.Angle = -Math.atan(DeltaY / -DeltaX);
    } else {
      if (DeltaY > 0) {
        this.Angle = Math.PI / 2;
      } else if (DeltaY < 0) {
        this.Angle = -Math.PI / 2;
      }
    }
  }

  SetAngle(Angle) {
    if (typeof Angle != "number") {
      throw TypeError("");
    }
    this.ChangingAngle = false;
    this.SpeedX = this.Speed * Math.cos(Angle);
    this.SpeedY = this.Speed * Math.sin(Angle);
  }
}

class CanvasHandler {
  constructor(ContainerOffscreenCanvas, FrameRate, ID) {
    if (
      !(ContainerOffscreenCanvas instanceof OffscreenCanvas) ||
      typeof FrameRate != "number" ||
      typeof ID != "number"
    ) {
      throw TypeError("");
    }
    this.Identification = ID;
    this.Canvas = ContainerOffscreenCanvas;
    this.CanvasContext = this.Canvas.getContext("2d");
    this.Points = [];
    this.FrameRate = FrameRate;
    this.RenderInterval = 1000 / FrameRate;
    this.StoppedRendering = false;
    this.IsRendering = false;
    this.GlobalAlpha = 0.7;
    this.State = 0;
    this.Unstoppable = false;
    this.PointColorRed = 240;
    this.PointColorGreen = 240;
    this.PointColorBlue = 240;
    this.DefaultPointColor = `rgb(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue})`;
    this.MaxPointSize = 0;
    this.ExpandFactor = 10;
    this.ExpandDecreaseFactor = Math.pow(
      1 / this.ExpandFactor,
      0.5 / FrameRate,
    );
    this.Transparency = 0.7;
    this.TransparencyDecreaseFactor = 0.1 / FrameRate;
    this.PointAccelerationFactor = Math.pow(1 / 100, 1 / FrameRate);
    this.PointConcentrateAccelerationFactor = Math.pow(
      Math.pow(0.8, 50),
      0.5 / FrameRate,
    );
    this.PointConcentrateInitialSpeedFactor =
      1 - this.PointConcentrateAccelerationFactor;
    this.PointSizeIncrementAdjustFactor =
      (Math.log(32) - Math.log(5)) /
      (Math.log(Math.floor(FrameRate) + 7) - Math.log(5));
    this.PointSizeExpandFactor = 1.8562979903656261724854012740647;
    this.RenderFunction = null;
    this.Timer = null;
    this.PI2 = 2 * Math.PI;
    let i = 0;
    let randompos = null;
    let randomsize = 0;
    for (i = 0; i < (this.Canvas.width * this.Canvas.height) / 2500; i++) {
      randompos = GenerateRandomPointInside(
        0,
        this.Canvas.height,
        0,
        this.Canvas.width,
      );
      randomsize = 1 + 4 * Math.random();
      if (randomsize > this.MaxPointSize) {
        this.MaxPointSize = randomsize;
      }
      this.Points.push(
        new Point(
          randompos.x,
          randompos.y,
          0,
          this.Canvas.height,
          0,
          this.Canvas.width,
          0,
          0,
          randomsize,
          this.DefaultPointColor,
          2 * FrameRate * Math.random(),
        ),
      );
    }
    this.CanvasContext.globalAlpha = this.GlobalAlpha;
  }

  destructor() {
    self.postMessage({
      message: "CanvasHandlerDestroyed",
      id: this.Identification,
    });
    if (this.Timer != null) {
      clearInterval(this.Timer);
    }
    CurrentCanvasWorkerState = "Uninitialized";
  }

  StartRender() {
    this.StoppedRendering = false;
    this.IsRendering = true;
    if (this.Timer == null) {
      this.RenderFunction = this.RenderFrame.bind(this);
      this.Timer = setInterval(() => {
        if (!this.Unstoppable && this.StoppedRendering) {
          return;
        }
        requestAnimationFrame(this.RenderFunction);
      }, this.RenderInterval);
    }
  }

  StopRender() {
    this.StoppedRendering = true;
    this.IsRendering = false;
  }

  CloseCanvas() {
    this.State = 2;
    this.Unstoppable = true;
    this.IsRendering = false;
    if (this.StoppedRendering) {
      this.StartRender();
    }
  }

  ResizeTo(NewCanvasWidthInPixels, NewCanvasHeightInPixels) {
    if (
      typeof NewCanvasWidthInPixels != "number" ||
      typeof NewCanvasHeightInPixels != "number"
    ) {
      throw TypeError("");
    }
    let i = 0;
    this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
    this.Points = [];
    this.Canvas.width = NewCanvasWidthInPixels;
    this.Canvas.height = NewCanvasHeightInPixels;
    let randompos = null;
    let randomsize = 0;
    for (
      i = 0;
      i < (NewCanvasWidthInPixels * NewCanvasHeightInPixels) / 2500;
      i++
    ) {
      randompos = GenerateRandomPointInside(
        0,
        NewCanvasHeightInPixels,
        0,
        NewCanvasWidthInPixels,
      );
      randomsize = 1 + 4 * Math.random();
      if (randomsize > this.MaxPointSize) {
        this.MaxPointSize = randomsize;
      }
      this.Points.push(
        new Point(
          randompos.x,
          randompos.y,
          0,
          NewCanvasHeightInPixels,
          0,
          NewCanvasWidthInPixels,
          0,
          0,
          randomsize,
          this.DefaultPointColor,
          2 * this.FrameRate * Math.random(),
        ),
      );
    }
    this.CanvasContext.globalAlpha = this.GlobalAlpha;
  }

  MoveToContainer(NewContainerHTMLDivElement) {
    if (!(NewContainerHTMLDivElement instanceof HTMLDivElement)) {
      throw TypeError("");
    }
    this.Container.removeChild(this.Canvas);
    NewContainerHTMLDivElement.appendChild(this.Canvas);
    this.Container = NewContainerHTMLDivElement;
  }

  RenderFrame() {
    let i = 0;
    if (this.State == 0) {
      let CanvasCenterX = this.Canvas.width / 2;
      let CanvasCenterY = this.Canvas.height / 2;
      let pos = null;
      let selected = null;
      let SizedX = 0;
      let SizedY = 0;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        pos = selected.GetPositionOnCanvas(
          this.Canvas.width,
          this.Canvas.height,
        );
        SizedX = CanvasCenterX + this.ExpandFactor * (pos.x - CanvasCenterX);
        SizedY = CanvasCenterY + this.ExpandFactor * (pos.y - CanvasCenterY);
        if (
          SizedX < 0 ||
          SizedX > this.Canvas.width ||
          SizedY < 0 ||
          SizedY > this.Canvas.height
        ) {
          continue;
        }
        this.CanvasContext.beginPath();
        this.CanvasContext.arc(SizedX, SizedY, selected.Size, 0, this.PI2);
        this.CanvasContext.fillStyle = selected.Color;
        this.CanvasContext.fill();
        this.CanvasContext.closePath();
      }
      this.ExpandFactor *= this.ExpandDecreaseFactor;
      if (this.ExpandFactor <= 1) {
        this.State = 1;
      }
    } else if (this.State == 1) {
      let pos = null;
      let selected = null;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        pos = selected.GetPositionOnCanvas(
          this.Canvas.width,
          this.Canvas.height,
        );
        this.CanvasContext.beginPath();
        this.CanvasContext.arc(pos.x, pos.y, selected.Size, 0, this.PI2);
        this.CanvasContext.fillStyle = selected.Color;
        this.CanvasContext.fill();
        this.CanvasContext.closePath();
        if (selected.Speed < 0.5 / this.FrameRate) {
          if (selected.CooldownFrames <= 0) {
            selected.Speed = 100 / this.FrameRate;
            selected.Acceleration = this.PointAccelerationFactor;
            selected.CooldownFrames = this.FrameRate * Math.random();
            selected.SetAngle(Math.random() * this.PI2);
          }
          selected.CooldownFrames--;
        }
        selected.NextPosition();
      }
    } else if (this.State == 2) {
      let selected = null;
      let CanvasCenterX = this.Canvas.width / 2;
      let CanvasCenterY = this.Canvas.height / 2;
      let TargetAngle = 0;
      let TargetDistance = 0;
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        if (selected.X < CanvasCenterX) {
          TargetAngle = -Math.atan(
            (selected.Y - CanvasCenterY) / (CanvasCenterX - selected.X),
          );
        } else if (selected.X > CanvasCenterX) {
          TargetAngle =
            Math.PI +
            Math.atan(
              (selected.Y - CanvasCenterY) / (selected.X - CanvasCenterX),
            );
        } else if (selected.Y > CanvasCenterY) {
          TargetAngle = -Math.PI / 2;
        } else {
          TargetAngle = Math.PI / 2;
        }
        TargetDistance = Math.sqrt(
          (selected.X - CanvasCenterX) * (selected.X - CanvasCenterX) +
            (selected.Y - CanvasCenterY) * (selected.Y - CanvasCenterY),
        );
        selected.Acceleration = this.PointConcentrateAccelerationFactor;
        selected.Speed =
          TargetDistance * this.PointConcentrateInitialSpeedFactor;
        selected.SetAngle(TargetAngle);
        selected.CooldownFrames = this.FrameRate * Math.random();
        selected.FrameCounter = 0;
      }
      this.State = 3;
    } else if (this.State == 3) {
      let pos = null;
      let selected = null;
      let gradient = null;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      this.CanvasContext.globalAlpha = this.Transparency;
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        pos = selected.GetPositionOnCanvas(
          this.Canvas.width,
          this.Canvas.height,
        );
        gradient = this.CanvasContext.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          selected.Size,
        );
        gradient.addColorStop(
          0,
          `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${1 - (2 * selected.FrameCounter) / this.FrameRate})`,
        );
        gradient.addColorStop(1, selected.Color);
        this.CanvasContext.beginPath();
        this.CanvasContext.arc(pos.x, pos.y, selected.Size, 0, this.PI2);
        this.CanvasContext.fillStyle = gradient;
        this.CanvasContext.fill();
        this.CanvasContext.closePath();
        if (selected.CooldownFrames <= 0) {
          if (selected.State == 0) {
            selected.Size +=
              (this.PointSizeIncrementAdjustFactor * selected.OriginalSize) /
              (selected.FrameCounter + 5);
            if (selected.FrameCounter > this.FrameRate) {
              selected.State = 1;
            }
            selected.FrameCounter++;
          } else if (selected.State == 1) {
            selected.NextPosition();
          }
        } else {
          selected.CooldownFrames--;
        }
      }
      this.CanvasContext.globalAlpha = this.GlobalAlpha;
      this.Transparency -= this.TransparencyDecreaseFactor;
      if (this.Transparency < 0.2) {
        this.State = 4;
        this.Transparency = 1;
      }
    } else if (this.State == 4) {
      if (this.Transparency < 0) {
        this.destructor();
        return;
      }
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      this.CanvasContext.globalAlpha = this.Transparency;
      this.CanvasContext.beginPath();
      this.CanvasContext.arc(
        this.Canvas.width / 2,
        this.Canvas.height / 2,
        this.MaxPointSize * (this.PointSizeExpandFactor + 1),
        0,
        this.PI2,
      );
      this.CanvasContext.fillStyle = this.DefaultPointColor;
      this.CanvasContext.fill();
      this.CanvasContext.closePath();
      this.CanvasContext.globalAlpha = this.GlobalAlpha;
      this.Transparency -= 0.5 / this.FrameRate;
    }
  }
}

self.onmessage = function (event) {
  const message = event.data;
  if (message.message == "Start") {
    if (CurrentCanvasWorkerState != "Uninitialized") {
      console.warn(
        "Attemptting to create a new instance while another one is present.",
      );
      return;
    }
    CanvasHandlerInstance = new CanvasHandler(
      message.canvas,
      message.framerate,
      message.id,
    );
    CanvasHandlerInstance.StartRender();
    CurrentCanvasWorkerState = "Running";
  } else if (message.message == "Resize") {
    if (CurrentCanvasWorkerState != "Running") {
      return;
    }
    CanvasHandlerInstance.ResizeTo(message.width, message.height);
  } else if (message.message == "Continue") {
    if (CurrentCanvasWorkerState != "Stopped") {
      return;
    }
    CanvasHandlerInstance.StartRender();
    CurrentCanvasWorkerState = "Running";
  } else if (message.message == "Stop") {
    if (CurrentCanvasWorkerState != "Running") {
      return;
    }
    CanvasHandlerInstance.StopRender();
    CurrentCanvasWorkerState = "Stopped";
  } else if (message.message == "Terminate") {
    if (CurrentCanvasWorkerState == "Uninitialized") {
      return;
    }
    CanvasHandlerInstance.CloseCanvas();
  } else if (message.message == "State") {
    self.postMessage({ message: "State", state: CurrentCanvasWorkerState });
  }
};
