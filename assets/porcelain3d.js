/* 骨质瓷 · 3D 材质演示
   用 three.js 车削出一个骨质瓷瓶，支持拖动旋转、自动缓慢旋转、背光强度联动。
   载入失败时保留页面原有的 CSS 示意图（不报错）。 */
import * as THREE from "three";
import { RoomEnvironment } from "./RoomEnvironment.js";

(function () {
  "use strict";

  var stage = document.getElementById("materialStage");
  var canvas = document.getElementById("porcelainCanvas");
  var slider = document.getElementById("glowRange");
  if (!stage || !canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (err) {
    return; // 没有 WebGL：保留 CSS 花瓶
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.1, 7.4);
  camera.lookAt(0, 0, 0);

  // 环境反射：柔和的棚拍光，让瓷面有细腻的高光
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  pmrem.dispose();

  // 灯光
  var ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  var key = new THREE.DirectionalLight(0xfff6e8, 2.4);
  key.position.set(2.4, 3.2, 3.6);
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xbcd8ff, 1.8);
  rim.position.set(-3, 1.6, -2.2);
  scene.add(rim);

  var backlight = new THREE.PointLight(0xfff0d6, 0, 6, 2);
  backlight.position.set(0, 0.1, -1.9);
  scene.add(backlight);

  // 背光柔光片（在物体后方，营造透亮的漫射）
  var glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 512;
  var gctx = glowCanvas.getContext("2d");
  var grad = gctx.createRadialGradient(256, 256, 10, 256, 256, 256);
  grad.addColorStop(0, "rgba(255,246,225,0.95)");
  grad.addColorStop(0.35, "rgba(255,240,210,0.42)");
  grad.addColorStop(1, "rgba(255,240,210,0)");
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 512, 512);
  var glowTex = new THREE.CanvasTexture(glowCanvas);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  var glowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 7.5),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.5 })
  );
  glowPlane.position.set(0, 0.1, -2.2);
  scene.add(glowPlane);

  // 接触阴影
  var shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 256;
  var sctx = shadowCanvas.getContext("2d");
  var sgrad = sctx.createRadialGradient(128, 128, 8, 128, 128, 120);
  sgrad.addColorStop(0, "rgba(0,10,30,0.55)");
  sgrad.addColorStop(0.55, "rgba(0,10,30,0.22)");
  sgrad.addColorStop(1, "rgba(0,10,30,0)");
  sctx.fillStyle = sgrad;
  sctx.fillRect(0, 0, 256, 256);
  var shadowTex = new THREE.CanvasTexture(shadowCanvas);
  var shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.06, 0.1);
  scene.add(shadow);

  // 车削轮廓：小圈足、圆肩、细颈、微外撇的口沿
  var profile = [
    [0.00, -1.02], [0.34, -1.02], [0.44, -0.99], [0.58, -0.90],
    [0.74, -0.72], [0.86, -0.46], [0.93, -0.16], [0.95, 0.08],
    [0.91, 0.32], [0.82, 0.54], [0.66, 0.72], [0.47, 0.84],
    [0.34, 0.93], [0.29, 1.02], [0.30, 1.10], [0.35, 1.15],
    [0.31, 1.17]
  ].map(function (p) { return new THREE.Vector2(p[0], p[1]); });

  var spline = new THREE.SplineCurve(profile);
  var lathePoints = spline.getPoints(140);
  var geometry = new THREE.LatheGeometry(lathePoints, 128);

  var material = new THREE.MeshPhysicalMaterial({
    color: 0xfff8ec,
    roughness: 0.26,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.32,
    transmission: 0.55,
    thickness: 0.75,
    ior: 1.46,
    attenuationColor: new THREE.Color(0xffe4bd),
    attenuationDistance: 1.15,
    side: THREE.DoubleSide,
    envMapIntensity: 1.0,
    emissive: new THREE.Color(0xffdcae),
    emissiveIntensity: 0.18
  });

  var vase = new THREE.Mesh(geometry, material);
  vase.scale.setScalar(1.0);
  vase.position.y = 0.02;
  scene.add(vase);

  // 内部一点暖光，暗示胎体的透
  var core = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xffdfae, transparent: true, opacity: 0.16, depthWrite: false })
  );
  core.position.y = 0.15;
  vase.add(core);

  // ---------- 交互：拖动旋转 ----------
  var targetY = -0.5, targetX = 0.08;
  var currentY = targetY, currentX = targetX;
  var dragging = false, lastX = 0, lastY = 0, idleAt = 0;

  function onDown(event) {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.classList.add("dragging");
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function onMove(event) {
    if (!dragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    targetY += dx * 0.009;
    targetX = Math.max(-0.45, Math.min(0.55, targetX + dy * 0.005));
  }
  function onUp() {
    dragging = false;
    stage.classList.remove("dragging");
    idleAt = performance.now();
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", function () { if (dragging) onUp(); });

  // 键盘也能转
  canvas.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") targetY -= 0.18;
    if (event.key === "ArrowRight") targetY += 0.18;
    if (event.key === "ArrowUp") targetX = Math.max(-0.45, targetX - 0.1);
    if (event.key === "ArrowDown") targetX = Math.min(0.55, targetX + 0.1);
  });

  // ---------- 背光强度 ----------
  function applyGlow(value) {
    var g = Math.max(0.15, Math.min(1, value / 100));
    backlight.intensity = g * 13;
    glowPlane.material.opacity = 0.06 + g * 0.86;
    glowPlane.scale.setScalar(0.85 + g * 0.3);
    renderer.toneMappingExposure = 0.78 + g * 0.55;
    material.attenuationDistance = 2.6 - g * 1.5;
    material.emissiveIntensity = 0.03 + g * 0.26;
    shadow.material.opacity = 0.85 - g * 0.25;
  }
  if (slider) {
    applyGlow(Number(slider.value) || 66);
    slider.addEventListener("input", function () { applyGlow(Number(slider.value)); });
  } else {
    applyGlow(66);
  }

  // ---------- 尺寸 ----------
  function resize() {
    var rect = stage.getBoundingClientRect();
    var w = Math.max(1, rect.width);
    var h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // ---------- 渲染循环 ----------
  var running = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(stage);
  }

  var last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!running) return;

    if (!dragging && !reduceMotion && now - idleAt > 2600) {
      targetY += dt * 0.22;
    }

    currentY += (targetY - currentY) * 0.09;
    currentX += (targetX - currentX) * 0.09;
    vase.rotation.y = currentY;
    vase.rotation.x = currentX * 0.6;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  stage.classList.add("has-3d");
})();
