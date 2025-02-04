function deg2rad(angleDeg: number) {
  return (angleDeg * Math.PI) / 180;
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function resizeSmoothCanvas(
  canvas: HTMLCanvasElement,
  clientSize: ISize,
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (window.devicePixelRatio) {
    canvas.style.width = clientSize.width + 'px';
    canvas.style.height = clientSize.height + 'px';
    canvas.height = clientSize.height * window.devicePixelRatio;
    canvas.width = clientSize.width * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}

export function drawImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  imageRect: IRect,
) {
  if (!!image && !!canvas) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(
      image,
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height,
    );
  }
}

export function drawLine(
  canvas: HTMLCanvasElement,
  startPoint: IPoint,
  endPoint: IPoint,
  color = '#111111',
  thickness = 1,
  lineDash?: number[],
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x + 1, endPoint.y + 1);
  ctx.stroke();
  ctx.restore();
}

export function drawRect(
  canvas: HTMLCanvasElement | null,
  rect: IRect,
  color = '#fff',
  thickness = 1,
  lineDash?: number[],
  fillColor?: string,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.stroke();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.restore();
}

export function drawRectWithFill(
  canvas: HTMLCanvasElement | null,
  rect: IRect,
  color = '#fff',
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.fill();
  ctx.restore();
}

export function shadeEverythingButRect(
  canvas: HTMLCanvasElement,
  rect: IRect,
  color = 'rgba(0, 0, 0, 0.7)',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

export function drawPolygon(
  canvas: HTMLCanvasElement | null,
  anchors: IPoint[],
  color = '#fff',
  thickness = 1,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(anchors[0].x, anchors[0].y);
  for (let i = 1; i < anchors.length; i++) {
    ctx.lineTo(anchors[i].x, anchors[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawPolygonWithFill(
  canvas: HTMLCanvasElement | null,
  anchors: IPoint[],
  fillColor = '#fff',
  strokeColor = '#fff',
  thickness = 1,
  lineDash?: number[],
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = thickness;
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.beginPath();
  ctx.moveTo(anchors[0].x, anchors[0].y);
  for (let i = 1; i < anchors.length; i++) {
    ctx.lineTo(anchors[i].x, anchors[i].y);
  }
  ctx.closePath();
  if (thickness > 0) {
    ctx.stroke();
  }
  ctx.fill();
  ctx.restore();
}

export function drawText(
  canvas: HTMLCanvasElement,
  text: string,
  textSize: number,
  anchorPoint: IPoint,
  color = '#ffffff',
  bold = false,
  align = 'center',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'top';
  ctx.font = (bold ? 'bold ' : '') + textSize + 'px Arial';
  ctx.fillText(text, anchorPoint.x, anchorPoint.y);
  ctx.restore();
}

export function drawCircleWithFill(
  canvas: HTMLCanvasElement,
  anchorPoint: IPoint,
  radius: number,
  color = '#ffffff',
  strokeWidth: number,
  strokeColor = '#000',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  const startAngleRad = deg2rad(0);
  const endAngleRad = deg2rad(360);
  ctx.lineWidth = strokeWidth || 0;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(
    anchorPoint.x,
    anchorPoint.y,
    radius,
    startAngleRad,
    endAngleRad,
    false,
  );
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

export function drawCircle(
  canvas: HTMLCanvasElement,
  anchorPoint: IPoint,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  thickness = 20,
  color = '#ffffff',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const startAngleRad = deg2rad(startAngleDeg);
  const endAngleRad = deg2rad(endAngleDeg);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.arc(
    anchorPoint.x,
    anchorPoint.y,
    radius,
    startAngleRad,
    endAngleRad,
    false,
  );
  ctx.stroke();
  ctx.restore();
}
