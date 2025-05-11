import Geometry from '@core/Geometry';
import PlaneGeometry from '@geometries/PlaneGeometry';

export default class BoxGeometry extends Geometry {
  constructor(
    width = 1,
    height = 1,
    depth = 1,
    widthSegments = 1,
    heightSegments = 1,
    depthSegments = 1
  ) {
    super();

    const wSegs = widthSegments;
    const hSegs = heightSegments;
    const dSegs = depthSegments;

    // Calculate total number of vertices and indices
    const num =
      (wSegs + 1) * (hSegs + 1) * 2 + (wSegs + 1) * (dSegs + 1) * 2 + (hSegs + 1) * (dSegs + 1) * 2;
    const numIndices = (wSegs * hSegs * 2 + wSegs * dSegs * 2 + hSegs * dSegs * 2) * 6;

    // Generate empty arrays once
    const position = new Float32Array(num * 3);
    const normal = new Float32Array(num * 3);
    const uv = new Float32Array(num * 2);
    const index = num > 65536 ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

    let i = 0;
    let ii = 0;

    // Create a temporary PlaneGeometry instance to use its buildPlane method
    const plane = new PlaneGeometry();

    // Build each side of the box
    plane.buildPlane(
      position,
      normal,
      uv,
      index,
      depth,
      height,
      width,
      dSegs,
      hSegs,
      2,
      1,
      0,
      -1,
      -1,
      i,
      ii
    ); // px
    i += (dSegs + 1) * (hSegs + 1);
    ii += dSegs * hSegs;

    plane.buildPlane(
      position,
      normal,
      uv,
      index,
      depth,
      height,
      -width,
      dSegs,
      hSegs,
      2,
      1,
      0,
      1,
      -1,
      i,
      ii
    ); // nx
    i += (dSegs + 1) * (hSegs + 1);
    ii += dSegs * hSegs;

    plane.buildPlane(
      position,
      normal,
      uv,
      index,
      width,
      depth,
      height,
      wSegs,
      dSegs,
      0,
      2,
      1,
      1,
      1,
      i,
      ii
    ); // py
    i += (wSegs + 1) * (dSegs + 1);
    ii += wSegs * dSegs;

    plane.buildPlane(
      position,
      normal,
      uv,
      index,
      width,
      depth,
      -height,
      wSegs,
      dSegs,
      0,
      2,
      1,
      1,
      -1,
      i,
      ii
    ); // ny
    i += (wSegs + 1) * (dSegs + 1);
    ii += wSegs * dSegs;

    plane.buildPlane(
      position,
      normal,
      uv,
      index,
      width,
      height,
      depth,
      wSegs,
      hSegs,
      0,
      1,
      2,
      1,
      -1,
      i,
      ii
    ); // pz
    i += (wSegs + 1) * (hSegs + 1);
    ii += wSegs * hSegs;

    plane.buildPlane(
      position,
      normal,
      uv,
      index,
      width,
      height,
      -depth,
      wSegs,
      hSegs,
      0,
      1,
      2,
      -1,
      -1,
      i,
      ii
    ); // nz

    this.setAttribute('position', position, 3);
    this.setAttribute('normal', normal, 3);
    this.setAttribute('uv', uv, 2);
    this.setIndex(index);
  }
}
