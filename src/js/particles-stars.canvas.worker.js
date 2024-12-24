var CanvasHandlerInstance = null;
var CurrentCanvasWorkerState = "Uninitialized";

function GenerateRandomPointInsideViewCone(
  CanvasWidth,
  CanvasHeight,
  CanvasDistanceToViewPoint,
  MinZ,
  MaxZ,
) {
  if (
    typeof CanvasWidth != "number" ||
    typeof CanvasHeight != "number" ||
    typeof CanvasDistanceToViewPoint != "number" ||
    typeof MinZ != "number" ||
    typeof MaxZ != "number"
  ) {
    throw TypeError("");
  }
  let Z = (MaxZ - MinZ) * Math.random() + MinZ;
  let ViewRectangleWidth = (Z / CanvasDistanceToViewPoint) * CanvasWidth;
  let ViewRectangleHeight = (Z / CanvasDistanceToViewPoint) * CanvasHeight;
  return {
    x: ViewRectangleWidth * (Math.random() - 0.5),
    y: ViewRectangleHeight * (Math.random() - 0.5),
    z: Z,
  };
}

//Generate random numbers and sort in descending order in segements
//Having more segements will generate faster but the numbers will be more equally distributed
function GenerateRandomSortedNumberArray(
  MinimumValue,
  MaximumValue,
  Length,
  SegementCount,
) {
  if (
    typeof MinimumValue != "number" ||
    typeof MaximumValue != "number" ||
    typeof Length != "number" ||
    typeof SegementCount != "number"
  ) {
    throw TypeError("");
  }
  if (SegementCount > Length || SegementCount - Math.floor(SegementCount) > 0) {
    throw RangeError("");
  }
  let Result = [];
  let i = 0;
  let j = 0;
  let k = 0;
  let temp = 0;
  let seglength = Length / SegementCount;
  let valueseglength = (MaximumValue - MinimumValue) / SegementCount;
  let segstart = 0;
  let segend = 0;
  for (i = SegementCount - 1; i >= 0; i--) {
    segstart = Math.floor(i * seglength);
    segend = Math.floor((i + 1) * seglength) - 1;
    for (j = segstart; j <= segend; j++) {
      Result.push(MinimumValue + valueseglength * (Math.random() + i));
    }
  }
  for (k = 0; k < SegementCount; k++) {
    segstart = Math.floor(k * seglength);
    segend = Math.floor((k + 1) * seglength) - 1;
    for (i = segend; i > segstart; i--) {
      for (j = segstart; j < i; j++) {
        if (Result[j] < Result[j + 1]) {
          temp = Result[j];
          Result[j] = Result[j + 1];
          Result[j + 1] = temp;
        }
      }
    }
  }
  return Result;
}

//GenerateRandomSortedNumberArray() when Length=SegementCount
function GenerateEquidistributionSortedRandomNumbers(
  MinimumValue,
  MaximumValue,
  Count,
) {
  if (
    typeof MinimumValue != "number" ||
    typeof MaximumValue != "number" ||
    typeof Count != "number"
  ) {
    throw TypeError("");
  }
  let Result = [];
  let i = 0;
  for (i = Count - 1; i >= 0; i--) {
    Result.push(
      MinimumValue +
        ((MaximumValue - MinimumValue) / Count) * (Math.random() + i),
    );
  }
  return Result;
}

function GenerateRandomColor() {
  let ProbablityNumber = Math.random();
  if (ProbablityNumber < 0.85) {
    //By default 85% of the stars are white points. Decrease this value to see more colourful points at the cost of CPU usage.
    return { special: false, color1: "#fff", color2: "", color3: "" };
  } else if (ProbablityNumber < 0.9) {
    //By default 0.9-0.85=0.05=5% of all points are light orange.
    return {
      special: true,
      color1: "#fff",
      color2: "#ffb66c",
      color3: "#ffb66c00",
    };
  } else if (ProbablityNumber < 0.95) {
    //By default 0.95-0.9=0.05=5% of all points are light blue.
    return {
      special: true,
      color1: "#fff",
      color2: "#91c8ff",
      color3: "#91c8ff00",
    };
  } else {
    //By default 1-0.95=0.05=5% of all points are light red.
    return {
      special: true,
      color1: "#fff",
      color2: "#ff7878",
      color3: "#ff787800",
    };
  }
}

class Point {
  constructor(
    X,
    Y,
    Z,
    MinimumZ,
    Speed,
    Size,
    CanvasWidth,
    CanvasHeight,
    CanvasDistanceToViewPoint,
    HasSpecialColor,
    Color,
    SecondaryColor,
    FadeColor,
    CooldownFrames,
  ) {
    if (
      typeof X != "number" ||
      typeof Y != "number" ||
      typeof Z != "number" ||
      typeof MinimumZ != "number" ||
      typeof CanvasWidth != "number" ||
      typeof CanvasHeight != "number" ||
      typeof CanvasDistanceToViewPoint != "number" ||
      typeof Speed != "number" ||
      typeof Size != "number" ||
      typeof HasSpecialColor != "boolean" ||
      typeof Color != "string" ||
      typeof SecondaryColor != "string" ||
      typeof FadeColor != "string" ||
      typeof CooldownFrames != "number"
    ) {
      throw TypeError("");
    }
    if (
      Z < MinimumZ ||
      CanvasDistanceToViewPoint <= 0 ||
      CanvasHeight <= 0 ||
      CanvasWidth <= 0
    ) {
      throw RangeError("");
    }
    this.X = X;
    this.Y = Y;
    this.Z = Z;
    this.MinimumZ = MinimumZ;
    this.CanvasWidth = CanvasWidth;
    this.CanvasHeight = CanvasHeight;
    this.CanvasDistanceToViewPoint = CanvasDistanceToViewPoint;
    this.Speed = Speed;
    this.Size = Size;
    this.HasSpecialColor = HasSpecialColor;
    this.Color = Color;
    this.SecondaryColor = SecondaryColor;
    this.FadeColor = FadeColor;
    this.CooldownFrames = CooldownFrames;
  }

  NextPosition() {
    this.Z -= this.Speed;
  }

  GetPositionOnCanvas() {
    let FinalX = (this.X / this.Z) * this.CanvasDistanceToViewPoint;
    let FinalY = (this.Y / this.Z) * this.CanvasDistanceToViewPoint;
    return {
      x: FinalX + this.CanvasWidth / 2,
      y: this.CanvasHeight / 2 - FinalY,
    };
  }

  GetSizeFromViewPoint() {
    return (this.CanvasDistanceToViewPoint / this.Z) * this.Size;
  }

  IsInViewCone() {
    return (
      this.Z >= this.MinimumZ &&
      Math.abs(this.X) / this.Z <
        this.CanvasWidth / 2 / this.CanvasDistanceToViewPoint &&
      Math.abs(this.Y) / this.Z <
        this.CanvasHeight / 2 / this.CanvasDistanceToViewPoint
    );
  }

  DistanceToViewPoint() {
    return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
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
    this.GlobalAlpha = 1;
    this.State = 0;
    this.Unstoppable = false;
    this.PointColorRed = 0;
    this.PointColorGreen = 0;
    this.PointColorBlue = 0;
    this.CanvasDistanceToViewPoint = 100;
    this.MinimumZ = this.CanvasDistanceToViewPoint / 10;
    this.MaxZ = 1100;
    this.PointGenerationBufferHeight = 100;
    this.InitializationMinimumZ = this.MaxZ - this.PointGenerationBufferHeight;
    this.PointSpeed = 50 / FrameRate;
    this.PointSpeedPerSecond = 50;
    this.FrameCounter = 0;
    this.RenderFunction = null;
    this.Timer = null;
    this.PreviousTime = 0;
    this.PI2 = 2 * Math.PI;
    let i = 0;
    let randompos = null;
    let randomcolor = null;
    for (
      i = 0;
      i <
      (ContainerOffscreenCanvas.width * ContainerOffscreenCanvas.height) / 2500;
      i++
    ) {
      randompos = GenerateRandomPointInsideViewCone(
        ContainerOffscreenCanvas.width,
        ContainerOffscreenCanvas.height,
        this.CanvasDistanceToViewPoint,
        this.MaxZ - this.PointGenerationBufferHeight,
        this.MaxZ,
      );
      randomcolor = GenerateRandomColor();
      if (randomcolor.special) {
        this.Points.push(
          new Point(
            randompos.x,
            randompos.y,
            randompos.z,
            this.MinimumZ,
            this.PointSpeed,
            20 + 20 * Math.random(),
            ContainerOffscreenCanvas.width,
            ContainerOffscreenCanvas.height,
            this.CanvasDistanceToViewPoint,
            randomcolor.special,
            randomcolor.color1,
            randomcolor.color2,
            randomcolor.color3,
            FrameRate * Math.random(),
          ),
        );
      } else {
        this.Points.push(
          new Point(
            randompos.x,
            randompos.y,
            randompos.z,
            this.MinimumZ,
            this.PointSpeed,
            10 + 10 * Math.random(),
            ContainerOffscreenCanvas.width,
            ContainerOffscreenCanvas.height,
            this.CanvasDistanceToViewPoint,
            randomcolor.special,
            randomcolor.color1,
            randomcolor.color2,
            randomcolor.color3,
            FrameRate * Math.random(),
          ),
        );
      }
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
    this.PreviousTime = Date.now();
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
    this.State = 1;
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
    let randomcolor = null;
    let randomz = GenerateEquidistributionSortedRandomNumbers(
      this.InitializationMinimumZ,
      this.MaxZ,
      Math.ceil((NewCanvasWidthInPixels * NewCanvasHeightInPixels) / 2500),
    );
    for (
      i = 0;
      i < (NewCanvasWidthInPixels * NewCanvasHeightInPixels) / 2500;
      i++
    ) {
      randompos = GenerateRandomPointInsideViewCone(
        this.Canvas.width,
        this.Canvas.height,
        this.CanvasDistanceToViewPoint,
        randomz[i],
        randomz[i] + 1,
      );
      randomcolor = GenerateRandomColor();
      if (randomcolor.special) {
        this.Points.push(
          new Point(
            randompos.x,
            randompos.y,
            randompos.z,
            this.MinimumZ,
            this.PointSpeed,
            20 + 20 * Math.random(),
            this.Canvas.width,
            this.Canvas.height,
            this.CanvasDistanceToViewPoint,
            randomcolor.special,
            randomcolor.color1,
            randomcolor.color2,
            randomcolor.color3,
            this.FrameRate * Math.random(),
          ),
        );
      } else {
        this.Points.push(
          new Point(
            randompos.x,
            randompos.y,
            randompos.z,
            this.MinimumZ,
            this.PointSpeed,
            10 + 10 * Math.random(),
            this.Canvas.width,
            this.Canvas.height,
            this.CanvasDistanceToViewPoint,
            randomcolor.special,
            randomcolor.color1,
            randomcolor.color2,
            randomcolor.color3,
            this.FrameRate * Math.random(),
          ),
        );
      }
    }
    this.CanvasContext.globalAlpha = this.GlobalAlpha;
  }

  RenderFrame() {
    let i = 0;
    const now = Date.now();
    let deltatime = now - this.PreviousTime;
    this.PreviousTime = now;
    if (this.State == 0) {
      let pos = null;
      let selected = null;
      let gradient = null;
      let size = 0;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      if (this.InitializationMinimumZ > this.MinimumZ) {
        this.InitializationMinimumZ -= 100 / this.FrameRate;
        if (this.InitializationMinimumZ < this.MinimumZ) {
          this.InitializationMinimumZ = this.MinimumZ;
        }
      }
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        selected.Z -= (deltatime / 1000) * this.PointSpeedPerSecond;
        if (selected.IsInViewCone()) {
          if (selected.Z > this.MaxZ - this.PointGenerationBufferHeight) {
            continue;
          } else if (
            selected.Z >
            this.MaxZ - this.PointGenerationBufferHeight - 100
          ) {
            this.CanvasContext.globalAlpha =
              (this.GlobalAlpha *
                (this.MaxZ - this.PointGenerationBufferHeight - selected.Z)) /
              100;
          } else if (selected.Z < this.MinimumZ + 100) {
            this.CanvasContext.globalAlpha =
              (this.GlobalAlpha * (selected.Z - this.MinimumZ)) / 100;
          }
          pos = selected.GetPositionOnCanvas();
          size = selected.GetSizeFromViewPoint();
          if (selected.HasSpecialColor) {
            //Drawing shapes with gradient is CPU intensive, so if the point radius on the canvas (the screen) is smaller than 6 pixels, use low model which does not use gradient.
            if (size < 6) {
              this.CanvasContext.beginPath();
              this.CanvasContext.arc(pos.x, pos.y, size * 0.75, 0, this.PI2);
              this.CanvasContext.fillStyle = selected.SecondaryColor;
              this.CanvasContext.fill();
              this.CanvasContext.closePath();
              this.CanvasContext.beginPath();
              this.CanvasContext.arc(pos.x, pos.y, size / 4, 0, this.PI2);
              this.CanvasContext.fillStyle = selected.Color;
              this.CanvasContext.fill();
              this.CanvasContext.closePath();
            } else {
              gradient = this.CanvasContext.createRadialGradient(
                pos.x,
                pos.y,
                0,
                pos.x,
                pos.y,
                size,
              );
              gradient.addColorStop(0, selected.Color);
              gradient.addColorStop(0.5, selected.SecondaryColor);
              gradient.addColorStop(1, selected.FadeColor);
              this.CanvasContext.beginPath();
              this.CanvasContext.arc(pos.x, pos.y, size, 0, this.PI2);
              this.CanvasContext.fillStyle = gradient;
              this.CanvasContext.fill();
              this.CanvasContext.closePath();
            }
          } else {
            this.CanvasContext.beginPath();
            this.CanvasContext.arc(
              pos.x,
              pos.y,
              selected.GetSizeFromViewPoint(),
              0,
              this.PI2,
            );
            this.CanvasContext.fillStyle = selected.Color;
            this.CanvasContext.fill();
            this.CanvasContext.closePath();
          }
          this.CanvasContext.globalAlpha = this.GlobalAlpha;
        } else {
          pos = GenerateRandomPointInsideViewCone(
            this.Canvas.width,
            this.Canvas.height,
            this.CanvasDistanceToViewPoint,
            this.MaxZ - this.PointGenerationBufferHeight,
            this.MaxZ,
          );
          selected.X = pos.x;
          selected.Y = pos.y;
          selected.Z = pos.z;
          if (selected.HasSpecialColor) {
            selected.Size = 20 + 20 * Math.random();
          } else {
            selected.Size = 10 + 10 * Math.random();
          }
          this.Points.unshift(this.Points.splice(i, 1)[0]);
        }
      }
    } else if (this.State == 1) {
      let pos = null;
      let selected = null;
      let gradient = null;
      let EndFrame = 4 * this.FrameRate;
      let size = 0;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        selected.Z -= (deltatime / 1000) * this.PointSpeedPerSecond;
        if (selected.IsInViewCone()) {
          if (selected.Z > this.MaxZ - this.PointGenerationBufferHeight) {
            continue;
          } else if (
            selected.Z >
            this.MaxZ - this.PointGenerationBufferHeight - 100
          ) {
            this.CanvasContext.globalAlpha =
              (((this.GlobalAlpha *
                (this.MaxZ - this.PointGenerationBufferHeight - selected.Z)) /
                100) *
                (EndFrame - this.FrameCounter)) /
              EndFrame;
          } else if (selected.Z < this.MinimumZ + 100) {
            this.CanvasContext.globalAlpha =
              (((selected.Z - this.MinimumZ) / 100) *
                (EndFrame - this.FrameCounter)) /
              EndFrame;
          } else {
            this.CanvasContext.globalAlpha =
              (EndFrame - this.FrameCounter) / EndFrame;
          }
          pos = selected.GetPositionOnCanvas();
          size = selected.GetSizeFromViewPoint();
          if (selected.HasSpecialColor) {
            //Drawing shapes with gradient is CPU intensive, so if the point radius on the canvas (the screen) is smaller than 6 pixels, use low model which does not use gradient.
            if (size < 6) {
              this.CanvasContext.beginPath();
              this.CanvasContext.arc(pos.x, pos.y, size * 0.75, 0, this.PI2);
              this.CanvasContext.fillStyle = selected.SecondaryColor;
              this.CanvasContext.fill();
              this.CanvasContext.closePath();
              this.CanvasContext.beginPath();
              this.CanvasContext.arc(pos.x, pos.y, size / 4, 0, this.PI2);
              this.CanvasContext.fillStyle = selected.Color;
              this.CanvasContext.fill();
              this.CanvasContext.closePath();
            } else {
              gradient = this.CanvasContext.createRadialGradient(
                pos.x,
                pos.y,
                0,
                pos.x,
                pos.y,
                size,
              );
              gradient.addColorStop(0, selected.Color);
              gradient.addColorStop(0.5, selected.SecondaryColor);
              gradient.addColorStop(1, selected.FadeColor);
              this.CanvasContext.beginPath();
              this.CanvasContext.arc(pos.x, pos.y, size, 0, this.PI2);
              this.CanvasContext.fillStyle = gradient;
              this.CanvasContext.fill();
              this.CanvasContext.closePath();
            }
          } else {
            this.CanvasContext.beginPath();
            this.CanvasContext.arc(
              pos.x,
              pos.y,
              selected.GetSizeFromViewPoint(),
              0,
              this.PI2,
            );
            this.CanvasContext.fillStyle = selected.Color;
            this.CanvasContext.fill();
            this.CanvasContext.closePath();
          }
          this.CanvasContext.globalAlpha = this.GlobalAlpha;
        }
      }
      this.FrameCounter++;
      if (this.FrameCounter > EndFrame) {
        this.destructor();
        return;
      }
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
