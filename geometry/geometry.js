class geometry {
  constructor(parent) {
    this.vertices = new Float32Array();
    this.matrix = new Matrix4();
    this._translation = [0.0, 0.0, 0.0];
    this._rotation = [0.0, 0.0, 0.0];
    this._scale = [1.0, 1.0, 1.0];
    this._pivot = [0.0, 0.0, 0.0];
    this._children = [];
    if (parent instanceof geometry) {
      this.parent = parent;
      parent._children.push(this);
      this._updateMatrix();
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

  // Returns the geometry's pivot.
  getPivot() {
    return this._pivot;
  }

  // Draws the geometry shape.
  render() {
    let u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 6);
  }

  _updateMatrix() {
    this.matrix.setIdentity();
    const hasParent = (this.parent instanceof geometry);
    const [tx, ty, tz] = this.getTranslate();
    const [rx, ry, rz] = this.getRotate();
    const [sx, sy, sz] = this.getScale();
    const [px, py, pz] = this.getPivot();
    let [psx, psy, psz] = [1.0, 1.0, 1.0];

    // Shift into parent space
    if (hasParent) {
      this.matrix.multiply(this.parent.matrix);
      [psx, psy, psz] = this.parent.getScale();
      this.matrix.scale(1.0 / psx, 1.0 / psy, 1.0 / psz);
    }

    // Translate the pivot in local space
    this.matrix.translate(tx * psx, ty * psy, tz * psz);

    // Rotate around the pivot
    this.matrix.rotate(rx, 1, 0, 0).rotate(ry, 0, 1, 0).rotate(rz, 0, 0, 1);

    // Apply world-space scale
    this.matrix.scale(sx === 0 ? 0.001 : sx, sy === 0 ? 0.001 : sy, sz === 0 ? 0.001 : sz);

    // Shift origin to pivot
    this.matrix.translate(-px, -py, -pz);

    for (const child of this._children) {
      child._updateMatrix();
    }
  }
}
