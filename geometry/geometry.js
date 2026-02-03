class geometry {
  constructor(parent) {
    this.vertices = new Float32Array();
    this.matrix = new Matrix4();
    this.modelMatrix = new Matrix4();
    this._translation = [0.0, 0.0, 0.0];
    this._rotation = [0.0, 0.0, 0.0];
    this._scale = [1.0, 1.0, 1.0];
    this._pivot = [0.0, 0.0, 0.0];
    this._children = [];
    if (parent instanceof geometry) {
      this.parent = parent;
      parent._children.push(this);
      const [ptx, pty, ptz] = this.parent._translation;
      const [prx, pry, prz] = this.parent._rotation;
      this.matrix.rotate(prx, pry, prz);
      this.matrix.translate(ptx, pty, ptz);
    }
  }

  // Sets the geometry's translation.
  translate(x, y, z) {
    this._translation = [x, y, z];
    this._updateMatrix();
  }

  // Sets the geometry's rotation.
  rotate(x, y, z) {
    [x, y, z] = [((x % 360) + 360) % 360, ((y % 360) + 360) % 360, ((z % 360) + 360) % 360];
    this._rotation = [x, y, z];
    this._updateMatrix();
  }

  // Sets the geometry's size.
  scale(x, y, z) {
    this._scale = [x, y, z];
    this._updateMatrix();
  }

  // Sets the geometry's pivot.
  pivot(x, y, z) {
    this._pivot = [x, y, z];
    this._updateMatrix();
  }

  // Returns the geometry's translation in local space.
  getTranslate() {
    return this._translation;
  }

  // Returns the geometry's rotation in local space.
  getRotate() {
    return this._rotation;
  }

  // Returns the geometry's scale.
  getScale() {
    return this._scale;
  }

  // Returns the geometry's translation in world space.
  getWorldTranslate() {
    let [x, y, z] = this._translation;
    if (this.parent instanceof geometry) {
      let [px, py, pz] = this.parent.getWorldTranslate();
      [x, y, z] = [x + px, y + py, z + pz];
    }
    return [x, y, z];
  }

  // Returns the geometry's rotation in world space.
  getWorldRotate() {
    let [x, y, z] = this._rotation;
    if (this.parent instanceof geometry) {
      let [px, py, pz] = this.parent.getWorldRotate();
      [x, y, z] = [x + px, y + py, z + pz];
    }
    return [x, y, z];
  }

  // Draws the geometry shape.
  render() {
    let u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 6);
  }

  // Updates the matrix of this geometry.
  _updateMatrix() {
    this.matrix.setIdentity();
    const hasParent = (this.parent instanceof geometry);
    const [tx, ty, tz] = this.getTranslate();
    const [rx, ry, rz] = this.getRotate();
    const [sx, sy, sz] = this.getScale();
    const [px, py, pz] = this._pivot;
    let [psx, psy, psz] = [1.0, 1.0, 1.0];
    if (hasParent) {
      const [ptx, pty, ptz] = this.parent.getWorldTranslate();
      const [prx, pry, prz] = this.parent.getWorldRotate();
      const [ppx, ppy, ppz] = this.parent._pivot;
      [psx, psy, psz] = this.parent.getScale();
      this.matrix.translate(ptx, pty, ptz);
      this.matrix.rotate(prx, 1, 0, 0).rotate(pry, 0, 1, 0).rotate(prz, 0, 0, 1);
    }
    this.matrix.translate(tx*psx, ty*psy, tz*psz);
    this.matrix.translate(px, py, pz);
    this.matrix.rotate(rx, 1, 0, 0).rotate(ry, 0, 1, 0).rotate(rz, 0, 0, 1);
    this.matrix.translate(-px, -py, -pz);
    this.matrix.scale(sx, sy, sz);
    for (const child of this._children) {
      child._updateMatrix();
    }
  }
}
