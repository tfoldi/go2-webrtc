import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

class VoxelWorld {
  scene;
  mesh = new THREE.Mesh();
  material;
  cellSize_X;
  cellSize_Y;
  cellSize_Z;
  tileSize;
  tileTextureWidth;
  tileTextureHeight;
  currCellDataInfo;
  faces = [
    {
      dir: [-1, 0, 0],
      corners: [
        { pos: [0, 1, 0], uv: [0, 1] },
        { pos: [0, 0, 0], uv: [1, 1] },
        { pos: [0, 1, 1], uv: [0, 0] },
        { pos: [0, 0, 1], uv: [1, 0] },
      ],
    },
    {
      dir: [1, 0, 0],
      corners: [
        { pos: [1, 1, 1], uv: [1, 0] },
        { pos: [1, 0, 1], uv: [0, 0] },
        { pos: [1, 1, 0], uv: [1, 1] },
        { pos: [1, 0, 0], uv: [0, 1] },
      ],
    },
    {
      dir: [0, -1, 0],
      corners: [
        { pos: [1, 0, 1], uv: [1, 0] },
        { pos: [0, 0, 1], uv: [0, 0] },
        { pos: [1, 0, 0], uv: [1, 1] },
        { pos: [0, 0, 0], uv: [0, 1] },
      ],
    },
    {
      dir: [0, 1, 0],
      corners: [
        { pos: [0, 1, 1], uv: [0, 0] },
        { pos: [1, 1, 1], uv: [1, 0] },
        { pos: [0, 1, 0], uv: [0, 1] },
        { pos: [1, 1, 0], uv: [1, 1] },
      ],
    },
    {
      dir: [0, 0, -1],
      corners: [
        { pos: [1, 0, 0], uv: [0, 0] },
        { pos: [0, 0, 0], uv: [1, 0] },
        { pos: [1, 1, 0], uv: [0, 1] },
        { pos: [0, 1, 0], uv: [1, 1] },
      ],
    },
    {
      dir: [0, 0, 1],
      corners: [
        { pos: [0, 0, 1], uv: [0, 0] },
        { pos: [1, 0, 1], uv: [1, 0] },
        { pos: [0, 1, 1], uv: [0, 1] },
        { pos: [1, 1, 1], uv: [1, 1] },
      ],
    },
  ];

  constructor(n, o) {
    (this.scene = n),
      (this.mesh = new THREE.Mesh()),
      (this.tileSize = (o == null ? void 0 : o.tileSize) || 1),
      (this.tileTextureWidth = (o == null ? void 0 : o.tileTextureWidth) || 1),
      (this.tileTextureHeight =
        (o == null ? void 0 : o.tileTextureHeight) || 1),
      (this.material =
        (o == null ? void 0 : o.material) ||
        new THREE.MeshBasicMaterial({ color: 16777215 })),
      (this.currCellDataInfo = void 0),
      (this.cellSize_X = 128),
      (this.cellSize_Y = 128),
      (this.cellSize_Z = 30);
  }
  clearVoxel() {
    this.currCellDataInfo = void 0;
  }
  adjacent(n, o) {
    const { cellSize_X: s, cellSize_Y: c, cellSize_Z: u } = this,
      [l, f, _] = o;
    return l > s || f > c || _ > u ? 0 : this.getVoxel(n, l, f, _);
  }
  calBitForIndex(n, o) {
    return (n >> (7 - o)) & 1;
  }
  getVoxel(n, o, s, c) {
    const { cellSize_X: u, cellSize_Y: l, calBitForIndex: f } = this,
      _ = u * l * c + u * s + o,
      g = Math.floor(_ / 8),
      v = _ % 8;
    return f.call(this, n[g], v);
  }
  generateGeometryData(n, o, s, c) {
    const {
      adjacent: u,
      cellSize_X: l,
      cellSize_Y: f,
      tileSize: _,
      tileTextureWidth: g,
      tileTextureHeight: v,
    } = this,
      T = [],
      E = [],
      y = [];
    (this.cellSize_X = o[0]),
      (this.cellSize_Y = o[1]),
      (this.cellSize_Z = o[2]);
    let S = 0;
    for (let C = 0; C < n.byteLength; C++)
      if (n[C] > 0) {
        const R = n[C];
        for (let A = 0; A < 8; A++)
          if (this.calBitForIndex(R, A)) {
            const O = C * 8 + A;
            S++;
            const L = Math.floor(O / (l * f)),
              P = O % (l * f),
              $ = Math.floor(P / l),
              B = P % l,
              F = (L * s + c) * Math.round(1 / s),
              J = Math.floor((F < -10 ? -10 : F > 20 ? 20 : F) + 10);
            for (const { dir: H, corners: j } of this.faces)
              if (!u.call(this, n, [B + H[0], $ + H[1], L + H[2]])) {
                const he = T.length / 3;
                for (const { pos: Te, uv: re } of j)
                  T.push(Te[0] + B, Te[1] + $, Te[2] + L),
                    E.push(((J + re[0]) * _) / g, 1 - ((1 - re[1]) * _) / v);
                y.push(he, he + 1, he + 2, he + 2, he + 1, he + 3);
              }
          }
      }
    return {
      positionsFloat32Array: new Float32Array(T),
      uvsFloat32Array: new Float32Array(E),
      indices: y,
      pointCount: S,
    };
  }
  updateMeshesForData2() {
    // debugger
    // // set n to the content of vortex_msg1192132805_pointcloud.json
    const { currCellDataInfo, material, scene } = this;
    if (!currCellDataInfo || !scene) return;
    const { geometryData, resolution: resolution, origin } = currCellDataInfo;

    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    scene.remove(this.mesh);

    const positions = convert(geometryData.positions);
    const uvs = convert(geometryData.uvs);
    const indices = convert32(geometryData.indices);
    // debugger
    const buffGeometry = new THREE.BufferGeometry();
    buffGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions || [], 3)
    );
    buffGeometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(uvs || [], 2, !0)
    );
    buffGeometry.setIndex(new THREE.BufferAttribute(indices || [], 1));
    this.mesh = new THREE.Mesh(buffGeometry, material);
    const res = resolution || 0.1;
    this.mesh.scale.set(res, res, res);
    this.mesh.position.set(origin[0] || 0, origin[1] || 0, origin[2] || 0);
    scene.add(this.mesh);
  }
}

function convert(objData) {
  return Uint8Array.from(objData);
}
function convert32(objData) {
  return Uint32Array.from(objData);
}

const scene = new THREE.Scene();
scene.rotation.x -= Math.PI / 2;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  100
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

window.addEventListener(
  "resize",
  function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  },
  false
);

const stats = Stats();
document.body.appendChild(stats.dom);

const gui = new GUI();
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "z", 0, 10);
cameraFolder.open();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
  stats.update();
}

function render() {
  renderer.render(scene, camera);
}

const init = ({
  renderParent,
  scene = new THREE.Scene(),
  renderer = new THREE.WebGLRenderer({ antialias: !0, alpha: !0 }),
  camera = new THREE.PerspectiveCamera(50),
  controls = new OrbitControls(camera, renderer.domElement),
  ambientLight = new THREE.AmbientLight(16777215),
  gridHelper = new THREE.GridHelper(40, 40, 8947848),
  gridHelperGroup = new THREE.Group(),
  viewType = 1,
  stats = Stats(),
  showStats = !1,
  currCameraPosition = new THREE.Vector3(0, 0, 0),
  firstViewTargetPoint = new THREE.Mesh(),
  firstViewTargetPosition = new THREE.Vector3(4, 0, 0),
  firstCameraPosition = new THREE.Vector3(-1.2, 0, 1),
  thirdViewInitPosition = new THREE.Vector3(-3, 0, 3),
}) => {
  if (!renderParent) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)),
    (scene.background = new THREE.Color(2631720));
  const A = renderParent.clientWidth || 0,
    O = renderParent.clientHeight || 0;
  renderer.setSize(A, O),
    (renderer.shadowMap.enabled = !0),
    renderParent.appendChild(renderer.domElement),
    (scene.fog = viewType === 1 ? null : new THREE.Fog(2631720, 0.015, 20)),
    (camera.aspect = A / O),
    camera.updateProjectionMatrix(),
    viewType === 1
      ? camera.position.copy(thirdViewInitPosition)
      : camera.position.copy(firstCameraPosition),
    currCameraPosition.copy(thirdViewInitPosition),
    scene.add(camera);
  const L = new THREE.BoxGeometry(0.1, 0.1, 0.1),
    P = new THREE.MeshBasicMaterial({
      color: 16711680,
      transparent: !0,
      opacity: 0,
    });
  (firstViewTargetPoint.geometry = L),
    (firstViewTargetPoint.material = P),
    firstViewTargetPoint.position.copy(firstViewTargetPosition),
    scene.add(firstViewTargetPoint),
    (controls.enableDamping = !0),
    (controls.enabled = viewType === 1),
    (controls.enablePan = !1),
    (controls.minPolarAngle = 0.2),
    (controls.maxPolarAngle = (Math.PI / 4) * 3),
    showStats &&
    (document.body.appendChild(stats.dom),
      (stats.dom.style.top = "80px"),
      (stats.dom.style.left = "115px")),
    gridHelperGroup.add(gridHelper),
    gridHelper.rotateX(Math.PI / 2),
    scene.add(gridHelperGroup),
    scene.add(ambientLight);
  // this.loadModel();
  const tileSize = 32,
    tileTextureWidth = 1024,
    tileTextureHeight = 32;
  const textureLoader = new THREE.TextureLoader().load(
    "./models/axisColor4.png"
  );
  textureLoader.magFilter = THREE.NearestFilter;
  textureLoader.minFilter = THREE.NearestFilter;
  const worldMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader,
    side: THREE.DoubleSide,
    transparent: !1,
  });
  const pointVoxelWorld = new VoxelWorld(scene, {
    tileSize,
    tileTextureWidth,
    tileTextureHeight,
    material: worldMaterial,
  });
  const pointUpdated = !1;
  // window.addEventListener("resize", this.resize.bind(this));
  return {
    pointVoxelWorld,
    pointUpdated,
  };
};

const { pointVoxelWorld, pointUpdated } = init({
  renderParent: document.body,
  scene,
  camera: camera,
  controls,
  renderer,
});

animate()


window.getBinaryData = (filepath) => {
  return fetch(filepath)
    .then(response => {
if (!response.ok) {
    console.error('Fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        url: filepath
    });
    throw new Error(`Failed to fetch data from ${filepath} (Status: ${response.status})`);
}
      return response.arrayBuffer();
    })
    .then(arrayBuffer => {
      return new Uint8Array(arrayBuffer);
    })
    .catch(error => {
      throw error;
    });
};

const threeJSWorker = new Worker(
  new URL("/assets/three.worker.js", self.location)
);
window._threejsworker = threeJSWorker;
threeJSWorker.onmessage = (re) => {
  console.log("Binary Data", re);
  pointVoxelWorld.currCellDataInfo = re.data
  pointVoxelWorld.updateMeshesForData2()
}

setInterval(() => {
  try {
    console.warn("TICK");
    window
      .getBinaryData(`/assets/example.bin`)
      .then((vortexBinaryData) => {
        const _jsonLength = vortexBinaryData[0];
        const _jsonOffset = 4;
        const _jsonString = String.fromCharCode.apply(
          null,
          vortexBinaryData.slice(
            _jsonOffset,
            _jsonOffset + _jsonLength
          )
        );
        const jsonOBJ = JSON.parse(_jsonString);
        threeJSWorker.postMessage({
          resolution: jsonOBJ.data.resolution,
          origin: jsonOBJ.data.origin,
          width: jsonOBJ.data.width,
          data: vortexBinaryData.slice(_jsonOffset + _jsonLength),
        });
      });
  } catch (e) {
    console.error("ERROR DURING VERTEX LOAD", e);
  }
}, 1000)
