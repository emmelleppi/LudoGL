import Geometry from '@core/Geometry';

export class OBJParser {
  constructor() {
    // No need for instance variables anymore
  }

  async parseOBJ(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return this._parseOBJText(text);
    } catch (error) {
      console.error('Error parsing OBJ file:', error);
      throw error;
    }
  }

  _parseOBJText(objText) {
    const positionsRaw = [];
    const uvsRaw = [];
    const normalsRaw = [];

    const positions = [];
    const uvs = [];
    const normals = [];
    const indices = [];

    const vertexMap = new Map(); // key: "v/vt/vn" → index

    const lines = objText.split('\n');

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 0) continue;

      switch (parts[0]) {
        case 'v':
          positionsRaw.push(parts.slice(1).map(Number));
          break;
        case 'vt':
          // OBJ format can have 3 UV coordinates, we only need 2 (u,v)
          const uv = parts.slice(1).map(Number);
          uvsRaw.push([uv[0], Math.abs(uv[1])]); // Flip Y coordinate
          break;
        case 'vn':
          normalsRaw.push(parts.slice(1).map(Number));
          break;
        case 'f':
          for (let i = 1; i <= 3; i++) {
            const [v, vt, vn] = parts[i].split('/').map(str => (str ? parseInt(str) - 1 : NaN));
            const key = `${v}/${vt}/${vn}`;
            if (!vertexMap.has(key)) {
              vertexMap.set(key, positions.length / 3); // new index

              positions.push(...positionsRaw[v]);
              if (!isNaN(vt) && uvsRaw[vt]) uvs.push(...uvsRaw[vt]);
              if (!isNaN(vn) && normalsRaw[vn]) normals.push(...normalsRaw[vn]);
            }
            indices.push(vertexMap.get(key));
          }
          break;
      }
    }

    const geometry = new Geometry();
    geometry.setAttribute('position', new Float32Array(positions), 3);
    if (normals.length > 0) {
      geometry.setAttribute('normal', new Float32Array(normals), 3);
    }
    if (uvs.length > 0) {
      geometry.setAttribute('uv', new Float32Array(uvs), 2);
    }
    geometry.setIndex(new Uint16Array(indices));

    return geometry;
  }
}
