import Plane from '@math/Plane';
import Vector3 from '@math/Vector3';

export default class Frustum {
  constructor() {
    this.planes = [
      new Plane(), // near
      new Plane(), // far
      new Plane(), // left
      new Plane(), // right
      new Plane(), // top
      new Plane(), // bottom
    ];
    this._point = new Vector3(); // Reusable vector for intersection tests
  }

  setFromProjectionMatrix(m) {
    const planes = this.planes;
    const me = m;
    const me0 = me[0],
      me1 = me[1],
      me2 = me[2],
      me3 = me[3];
    const me4 = me[4],
      me5 = me[5],
      me6 = me[6],
      me7 = me[7];
    const me8 = me[8],
      me9 = me[9],
      me10 = me[10],
      me11 = me[11];
    const me12 = me[12],
      me13 = me[13],
      me14 = me[14],
      me15 = me[15];

    // Near plane
    planes[0].setComponents(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();
    // Far plane
    planes[1].setComponents(-me3 + me2, -me7 + me6, -me11 + me10, -me15 + me14).normalize();
    // Left plane
    planes[2].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
    // Right plane
    planes[3].setComponents(-me3 + me0, -me7 + me4, -me11 + me8, -me15 + me12).normalize();
    // Top plane
    planes[4].setComponents(-me3 + me1, -me7 + me5, -me11 + me9, -me15 + me13).normalize();
    // Bottom plane
    planes[5].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
  }

  intersectsBox(box) {
    const planes = this.planes;
    const min = box.min;
    const max = box.max;
    const point = this._point;

    for (let i = 0; i < 6; i++) {
      const plane = planes[i];
      const normal = plane.normal;

      // Get the vertex of the box that's farthest in the direction of the plane normal
      point.x = normal.x > 0 ? max.x : min.x;
      point.y = normal.y > 0 ? max.y : min.y;
      point.z = normal.z > 0 ? max.z : min.z;

      // If the farthest point is behind the plane, the box is outside the frustum
      if (plane.distanceToPoint(point) < 0) {
        return false;
      }
    }

    return true;
  }
}
