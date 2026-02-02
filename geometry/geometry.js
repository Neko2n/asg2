class geometry {
  constructor(parent) {
    this.vertices = new Float32Array();
    this.modelMatrix = new Matrix4();
    this.translation = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.size = [0.0, 0.0, 0.0];
    this.origin = [0.0, 0.0, 0.0];
    this.children = [];
    if (parent instanceof geometry) {
      this.parent = parent;
      parent.children.push(this);
    }
  }

  // Translates the geometry from its current position.
  translate(x, y, z) {
    const [ox, oy, oz] = this.translation;
    this.translation = [x, y, z];
    const [dx, dy, dz] = [x-ox, y-oy, z-oz];
    for (const child of this.children) {
      const [cx, cy, cz] = child.translation;
      child.translate(cx+dx, cy+dy, cz+dz);
    }
  }


  // Rotates the geometry around its local origin. 
  // If it has a parent, this is the parent's position. Otherwise, this is (0, 0, 0)
  rotate(x, y, z) {
    while (x < 0) {
      x += 360;
    }
    while (y < 0) {
      y += 360;
    }
    while (z < 0) {
      z += 360;
    }
    const [ox, oy, oz] = this.rotation;
    [x, y, z] = [x % 360, y % 360, z % 360];
    this.rotation = [x, y, z];
    const [dx, dy, dz] = [x-ox, y-oy, z-oz];
    for (const child of this.children) {
      const [cx, cy, cz] = child.rotation;
      child.rotate(cx+dx, cy+dy, cz+dz);
    }
  }

  // Scales the geometry from its local origin.
  // If it has a parent, this is the parent's position. Otherwise, this is (0, 0, 0)
  // Also scales with its parent's scale.
  scale(x, y, z) {
    this.size = [x, y, z];
  }

  // Returns the compiled model matrix of this geometry.
  getMatrix() {
    let model = new Matrix4().set(this.modelMatrix);
    const [tx, ty, tz] = this.translation;
    model.multiply(new Matrix4().setTranslate(tx, ty, tz));
    const [rx, ry, rz] = this.rotation;
    let rotate = new Matrix4().rotate(rx, 1, 0, 0).rotate(ry, 0, 1, 0).rotate(rz, 0, 0, 1);
    model.multiply(rotate);
    const [sx, sy, sz] = this.size;
    model.multiply(new Matrix4().setScale(sx, sy, sz));
    return model;
  }

  // Draws the geometry shape.
  draw() {
    const matrix = this.getMatrix();
    let u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 6);
    // for (const child of this.children) {
    //   child.draw();
    // }
  }
}
