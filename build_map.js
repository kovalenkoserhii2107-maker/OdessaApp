const fs = require('fs');

const data = JSON.parse(fs.readFileSync('districts.json', 'utf8'));

let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

const polygonsByDistrict = {};

data.forEach(d => {
  const name = d.name.split(',')[0];
  const geo = d.geojson;
  
  let polygons = [];
  if (geo.type === 'Polygon') {
    polygons = geo.coordinates;
  } else if (geo.type === 'MultiPolygon') {
    polygons = geo.coordinates.flat();
  }

  polygonsByDistrict[name] = polygons;

  polygons.forEach(ring => {
    ring.forEach(coord => {
      const lon = coord[0];
      const lat = coord[1];
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
  });
});

const width = 1000;
const height = (maxLat - minLat) / (maxLon - minLon) * width;

const cosLat = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
const adjustedHeight = height / cosLat;

function project(lon, lat) {
  const x = ((lon - minLon) / (maxLon - minLon)) * width;
  const y = adjustedHeight - ((lat - minLat) / (maxLat - minLat)) * adjustedHeight;
  return { x, y };
}

let svgPaths = '';

const colorMap = {
  'Київський район': 'var(--titp-accent-yellow)',
  'Приморський район': 'var(--titp-accent-red)',
  'Пересипський район': 'var(--titp-accent-blue)',
  'Хаджибейський район': '#555'
};

const labelMap = {
  'Київський район': 'Киевский',
  'Приморський район': 'Приморский',
  'Пересипський район': 'Суворовский',
  'Хаджибейський район': 'Малиновский'
};

Object.entries(polygonsByDistrict).forEach(([name, polygons]) => {
  let pathStr = '';
  polygons.forEach(ring => {
    ring.forEach((coord, i) => {
      const pt = project(coord[0], coord[1]);
      if (i === 0) pathStr += `M ${pt.x} ${pt.y} `;
      else pathStr += `L ${pt.x} ${pt.y} `;
    });
    pathStr += 'Z ';
  });
  
  const fill = colorMap[name] || '#666';
  const label = labelMap[name] || name;

  svgPaths += `      <g className="district-group">
        <path d="${pathStr}" fill="${fill}" opacity="0.3" stroke="${fill}" strokeWidth="2" strokeLinejoin="round" />
        <title>${label}</title>
      </g>\n`;
});

const reactComponent = `import React from 'react';

export default function OdessaMap({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox="0 0 ${width} ${adjustedHeight}" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' }}>
${svgPaths}
        {children}
      </svg>
      <style>{\`
        .district-group path {
          transition: opacity 0.2s, stroke-width 0.2s;
          cursor: crosshair;
        }
        .district-group:hover path {
          opacity: 0.6;
          stroke-width: 4;
        }
      \`}</style>
    </div>
  );
}
`;

fs.writeFileSync('src/components/OdessaMap.tsx', reactComponent);
console.log('Created OdessaMap.tsx');
