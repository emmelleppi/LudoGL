export async function loadCubeLUT(url) {
  const text = await fetch(url).then(r => r.text());
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  let size = 0;
  let domainMin = [0, 0, 0],
    domainMax = [1, 1, 1];
  const data = [];

  for (let line of lines) {
    const parts = line.split(/\s+/);
    if (parts[0] === 'LUT_3D_SIZE') {
      size = parseInt(parts[1]);
    } else if (parts[0] === 'DOMAIN_MIN') {
      domainMin = parts.slice(1).map(parseFloat);
    } else if (parts[0] === 'DOMAIN_MAX') {
      domainMax = parts.slice(1).map(parseFloat);
    } else if (parts.length === 3) {
      data.push(+parts[0], +parts[1], +parts[2]);
    }
  }

  if (size === 0 || data.length !== size * size * size * 3) {
    throw new Error('Invalid .cube LUT');
  }

  return {
    size,
    domainMin,
    domainMax,
    data: new Float32Array(data),
  };
}
