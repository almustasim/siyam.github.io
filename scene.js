import * as THREE from "three";

export function initScene(canvas) {
  if (!canvas) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: "low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080a0b, 0.055);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, 0, 8);

  const core = new THREE.Group();
  scene.add(core);

  const geometry = new THREE.IcosahedronGeometry(1.55, 1);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x30383a, metalness: 0.92, roughness: 0.19,
    clearcoat: 1, clearcoatRoughness: 0.12, flatShading: true
  });
  const crystal = new THREE.Mesh(geometry, material);
  core.add(crystal);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 12),
    new THREE.LineBasicMaterial({ color: 0x5ce0a7, transparent: true, opacity: 0.65 })
  );
  crystal.add(edges);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.72, 1),
    new THREE.MeshBasicMaterial({ color: 0x39c98c, wireframe: true, transparent: true, opacity: 0.11 })
  );
  core.add(wire);

  const rings = [];
  [2.15, 2.45, 2.8].forEach((radius, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.006 + i * 0.001, 8, 180),
      new THREE.MeshBasicMaterial({ color: i === 1 ? 0x45d69a : 0x87928f, transparent: true, opacity: 0.34 - i * 0.06 })
    );
    ring.rotation.set(0.8 + i * 0.5, 0.35 + i * 0.45, i * 0.4);
    core.add(ring);
    rings.push(ring);
  });

  const starCount = window.innerWidth < 700 ? 360 : 850;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 17;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    color: 0xaebbb5, size: 0.018, transparent: true, opacity: 0.58, sizeAttenuation: true
  }));
  scene.add(dust);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xe7fff3, 2.4);
  key.position.set(-4, 5, 6); scene.add(key);
  const emerald = new THREE.PointLight(0x25d58d, 42, 14);
  emerald.position.set(3, 1, 2); scene.add(emerald);
  const blue = new THREE.PointLight(0x6689a0, 18, 12);
  blue.position.set(-4, -2, 1); scene.add(blue);

  const pointer = { x: 0, y: 0 };
  let targetX = 0, targetY = 0, raf = 0, visible = true, disposed = false;
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    core.position.x = width < 700 ? 0 : 1.1;
  };
  const onPointer = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  const render = (time = 0) => {
    if (disposed) return;
    const t = time * 0.001;
    targetX += (pointer.x - targetX) * 0.035;
    targetY += (pointer.y - targetY) * 0.035;
    core.rotation.y = t * 0.12 + targetX * 0.12;
    core.rotation.x = Math.sin(t * 0.22) * 0.08 + targetY * 0.08;
    crystal.rotation.y = t * 0.18;
    wire.rotation.y = -t * 0.11;
    rings.forEach((ring, i) => { ring.rotation.z += (i % 2 ? -1 : 1) * 0.0008; });
    dust.rotation.y = t * 0.008;
    camera.position.x += (targetX * 0.22 - camera.position.x) * 0.025;
    camera.position.y += (-targetY * 0.15 - camera.position.y) * 0.025;
    camera.lookAt(core.position.x * 0.2, 0, 0);
    renderer.render(scene, camera);
  };
  const loop = (time) => {
    render(time);
    if (visible && !reduced) raf = requestAnimationFrame(loop);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !reduced && !raf) raf = requestAnimationFrame(loop);
    if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0.05 });
  observer.observe(canvas);
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  resize();
  if (reduced) render(0);
  else raf = requestAnimationFrame(loop);

  return () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    geometry.dispose(); material.dispose(); dustGeometry.dispose();
    renderer.dispose();
  };
}
