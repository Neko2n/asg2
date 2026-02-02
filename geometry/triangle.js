class triangle extends geometry{
  constructor(parent, [r, g, b]){
    super(parent);
    this.vertices = new Float32Array([
      // first 3 elements: position (x, y, z) second 3 elements: color (r, g, b)
                     -0.5, -0.5, 0.0, r*0.9, g*0.9, b*0.93, // a: bottom left
                      0.5, -0.5, 0.0, r, g, b,// b: bottom right
                      0.0,  0.5, 0.0, r*1.1, g*1.11, b*1.05 // c: top point
                  ]);
  }
}
