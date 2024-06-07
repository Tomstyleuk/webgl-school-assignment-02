import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('webgl')

  const app = new ThreeApp(wrapper)
  app.resize()
  app.render()
}, false)


class ThreeApp {

  /**
   * Size
   */
  static WINDOW_SIZE = {
    width: window.innerWidth,
    height: window.innerHeight
  }


  /**
   * Camera
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: this.WINDOW_SIZE.width / this.WINDOW_SIZE.height,
    near: 0.1,
    far: 1000,
    position: new THREE.Vector3(0, 1, 12),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  }


  /**
   * Directional light
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1,
    position: new THREE.Vector3(0, 10, -1),
  }


  /**
   * Render
   */
  static RENDERER_PARAM = {
    clearColor: '#87CEEB', // sky blue
    width: this.WINDOW_SIZE.width,
    height: this.WINDOW_SIZE.height
  }


  /**
  * Fog
  */
  static FOG_PARAM = {
    color: 0xd3d3d3,
    near: 0,
    far: 24
  };


  /**
   * Material
   */
  static MATERIAL_STANDARD_PARAM = {
    color: 0xffffff
  }


  /**
   * Head
   */
  static HEAD_PARAM = {
    radiusTop: 0.3,
    radiusBottom: 0.3
  }


  /**
   * Blade
   */
  static BLADE_PARAM = {
    count: 3,
    depth: 0.05,
    bevelEnabled: false // 形状に面取りを施す
  }


  /**
   * Fan stand
   */
  static STAND_PARAM = {
    height: 2,
    radius: 0.1
  }


  /**
   * Base
   */
  static BASE_PARAM = {
    height: 0.1,
    radius: 0.5
  }


  /**
   * Fan
   */
  static FAN_PARAM = {
    position: new THREE.Vector3(0, 1, 0)
  }


  renderer;
  scene;
  camera;
  geometry;
  material;
  mesh;
  light;
  controls;

  // Head
  headGeometry;
  headMaterial;
  head;
  headRadius;

  // Blades
  bladeGeometry
  bladeMaterial
  bladeShape
  extrudeSettings
  bladesGroup

  // Stand
  standGeometry
  standMaterial
  stand

  // Base
  baseGeometry
  base

  // Group of the head & blades
  headGroup;

  // Fan (parent group of all parts)
  Fan;

  // Helper
  axesHelper;


  /**
   * constructor
   */
  constructor(wrapper) {

    // Variables for blade rotation speed
    this.bladeSpeed = 0.02;
    this.targetBladeSpeed = 0.20; // Set default to middle speed

    // Blades count
    this.bladeCount = 4

    // Head rotation speed
    this.headDirection = 1;
    this.headRotation = 0;
    this.headRotationSpeed = 0.01;
    this.targetHeadRotationSpeed = this.headRotationSpeed;

    // Flag for head rotation toggle
    this.isHeadRotating = true;

    // Fan flight speed
    this.fanTargetY = ThreeApp.FAN_PARAM.position.y;
    this.initialFanY = ThreeApp.FAN_PARAM.position.y;
    this.fanTargetZ = ThreeApp.FAN_PARAM.position.z;
    this.initialFanZ = ThreeApp.FAN_PARAM.position.z;
    this.time = 0;

    // Controll Fan
    this.buttons = {
      stopAll: document.getElementById('stopAll'),
      triggerHead: document.getElementById('triggerHead'),
      slow: document.getElementById('slow'),
      middle: document.getElementById('middle'),
      fast: document.getElementById('fast')
    };

    this.addClickEvent();


    /**
     * Render
     */
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setClearColor(color)
    this.renderer.setClearAlpha(0.0);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    wrapper.appendChild(this.renderer.domElement)


    // Scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(
      ThreeApp.FOG_PARAM.color,
      ThreeApp.FOG_PARAM.near,
      ThreeApp.FOG_PARAM.far
    );


    // Camera
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    )
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position)
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt)


    // Light
    this.light = new THREE.DirectionalLight(0xffffff, 2);
    this.light.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position).normalize();
    this.light.position.copy(new THREE.Vector3(0, 5, 10));
    this.scene.add(this.light);


    /**
     * Create Head
     */
    this.headGeometry = new THREE.CylinderGeometry(ThreeApp.HEAD_PARAM.radiusTop, ThreeApp.HEAD_PARAM.radiusBottom, this.headRadius, 22);
    this.headMaterial = new THREE.MeshStandardMaterial({ color: ThreeApp.MATERIAL_STANDARD_PARAM.color, emissive: 0x000000 });
    this.head = new THREE.Mesh(this.headGeometry, this.headMaterial);
    this.head.position.y = 1;
    this.head.position.z = 0;
    this.head.rotation.x = Math.PI / 2;



    /**
     * Blade shape
     */
    this.bladeShape = new THREE.Shape();
    this.bladeShape.moveTo(0, 0);
    this.bladeShape.lineTo(0.1, 0.2);
    this.bladeShape.lineTo(0.2, 0.6);
    this.bladeShape.lineTo(0.1, 1.0);
    this.bladeShape.lineTo(-0.1, 1.1);
    this.bladeShape.lineTo(-0.2, 0.6);
    this.bladeShape.lineTo(-0.15, 0.2);
    this.bladeShape.lineTo(0, 0);

    this.extrudeSettings = {
      depth: ThreeApp.BLADE_PARAM.depth,
      bevelEnabled: ThreeApp.BLADE_PARAM.bevelEnabled
    };
    this.bladeGeometry = new THREE.ExtrudeGeometry(this.bladeShape, this.extrudeSettings);
    this.bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });


    /**
     * Create 3 blades and add to the head
     */
    this.bladesGroup = new THREE.Group();
    for (let i = 0; i < this.bladeCount; i++) {
      const angle = (i / this.bladeCount) * Math.PI * 2;
      const blade = this.createBlade(angle);
      this.bladesGroup.add(blade);
    }
    this.bladesGroup.position.y = 1;
    this.bladesGroup.position.z = 0.44;


    /**
     * Stand
    */
    this.standGeometry = new THREE.CylinderGeometry(ThreeApp.STAND_PARAM.radius, ThreeApp.STAND_PARAM.radius, ThreeApp.STAND_PARAM.height, 32);
    this.standMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.stand = new THREE.Mesh(this.standGeometry, this.standMaterial);
    this.stand.position.y = 0;


    /**
     * Base
     */
    this.baseGeometry = new THREE.CylinderGeometry(ThreeApp.BASE_PARAM.radius, ThreeApp.BASE_PARAM.radius, ThreeApp.BASE_PARAM.height, 32);
    this.base = new THREE.Mesh(this.baseGeometry, this.standMaterial);
    this.base.position.y = -1;


    /**
     * Add the head & blades in a group
     */
    this.headGroup = new THREE.Group();
    this.headGroup.add(this.head, this.bladesGroup);


    /**
     * Add all parts to the scene
     */
    this.scene.add(this.headGroup);
    this.scene.add(this.stand);
    this.scene.add(this.base);


    /**
     * Wrap all parts into one parent group
     */
    this.Fan = new THREE.Group()
    this.Fan.add(this.headGroup, this.stand, this.base)
    this.Fan.position.copy(ThreeApp.FAN_PARAM.position)
    this.scene.add(this.Fan)


    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true


    // Helper
    this.axesHelper = new THREE.AxesHelper(10);
    // this.scene.add(this.axesHelper);


    this.render = this.render.bind(this)


    // Set default speed and update button styles
    this.setSpeed(this.targetBladeSpeed);
    this.updateButtonStyles(this.buttons.middle);
  }


  /**
   * Create a blade and rotate it to the correct angle
   */
  createBlade(angle) {
    const blade = new THREE.Mesh(this.bladeGeometry, this.bladeMaterial);
    blade.position.set(0, 0, 0);
    blade.rotation.z = angle;
    return blade;
  }


  /**
   * Resize
   */
  resize() {
    window.addEventListener('resize', () => {
      // カメラのパラメータが変更されたときは行列を更新する
      this.camera.updateProjectionMatrix();
      this.camera.aspect = window.innerWidth / window.innerHeight;

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }, false);
  }


  /**
   * Update button styles
   */
  updateButtonStyles(activeButton) {
    Object.values(this.buttons).forEach(btn => {
      btn.classList.remove('active');
    });

    if (activeButton) {
      activeButton.classList.add('active');
    }
  }


  /**
   * Add click event to each button
   */
  addClickEvent() {
    this.buttons.stopAll.addEventListener('click', () => this.stopAllActions());
    this.buttons.triggerHead.addEventListener('click', () => this.triggerHeadAction());
    this.buttons.slow.addEventListener('click', () => this.setSpeed(0.10));
    this.buttons.middle.addEventListener('click', () => this.setSpeed(0.20));
    this.buttons.fast.addEventListener('click', () => this.setSpeed(0.4));
  }

  stopAllActions() {
    this.setSpeed(0);
    this.isHeadRotating = false;
    this.updateButtonStyles(this.buttons.stopAll);
    this.time = 0
  }

  triggerHeadAction() {
    if (this.targetBladeSpeed > 0) {
      this.isHeadRotating = !this.isHeadRotating;
      this.updateButtonStyles(this.buttons.triggerHead);
    }
  }

  setSpeed(speed) {
    this.targetBladeSpeed = speed;
    let smoothness;

    // Update button styles based on speed
    if (speed === 0.10) {
      this.updateButtonStyles(this.buttons.slow);
      smoothness = 0.0001;
      setTimeout(() => {
        this.fanTargetY = this.initialFanY + 1;
        this.fanTargetZ = this.initialFanZ;
      }, 1000);
    } else if (speed === 0.20) {
      this.updateButtonStyles(this.buttons.middle);
      smoothness = 0.03;
      setTimeout(() => {
        this.fanTargetY = this.initialFanY + 2;
        this.fanTargetZ = this.initialFanZ - 2;
      }, 1000);
    } else if (speed === 0.4) {
      this.updateButtonStyles(this.buttons.fast);
      smoothness = 0.05;
      setTimeout(() => {
        this.fanTargetY = this.initialFanY + 5;
        this.fanTargetZ = this.initialFanZ - 9.5;
      }, 1000);
    } else {
      this.updateButtonStyles(null);
      smoothness = 0.05;
      this.fanTargetY = this.initialFanY;
      this.fanTargetZ = this.initialFanZ;
    }

    this.smoothness = smoothness;
  }


  render() {
    requestAnimationFrame(this.render);

    // Rotate the blades
    this.bladesGroup.rotation.z -= this.bladeSpeed;

    // Smoothly adjust the blade & head rotation speed to the target speede
    this.bladeSpeed = THREE.MathUtils.lerp(this.bladeSpeed, this.targetBladeSpeed, 0.02);
    this.headRotationSpeed = THREE.MathUtils.lerp(this.headRotationSpeed, this.targetHeadRotationSpeed, 0.05);

    // Rotate the head within the range of -90 to 90 degrees
    if (this.isHeadRotating) {
      this.headRotation += this.headRotationSpeed * this.headDirection;
      if (this.headRotation > Math.PI / 2 || this.headRotation < -Math.PI / 2) {
        this.headDirection *= -1;
      }
      this.headGroup.rotation.y = this.headRotation;
    }

    // Smoothly move the fan to the target Y position
    this.Fan.position.y = THREE.MathUtils.lerp(this.Fan.position.y, this.fanTargetY, 0.02);
    this.Fan.position.z = THREE.MathUtils.lerp(this.Fan.position.z, this.fanTargetZ, 0.02);

    this.time += 0.03;
    const floatOffset = this.targetBladeSpeed === 0 ? 0 : Math.sin(this.time) * 0.2;
    this.Fan.position.y = THREE.MathUtils.lerp(this.Fan.position.y, this.fanTargetY + floatOffset, this.smoothness);
    this.Fan.position.z = THREE.MathUtils.lerp(this.Fan.position.z, this.fanTargetZ + floatOffset, this.smoothness);


    this.controls.update()

    this.renderer.render(this.scene, this.camera)
  }
}
