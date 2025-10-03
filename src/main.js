import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Pane } from "tweakpane"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"

class App {
  #threejs_ = null
  #camera_ = null

  #scene_ = null
  #clock_ = null
  #controls_ = null

  #cube_ = null
  #sphere_ = null
  #knot_ = null

  constructor() {}

  async initialize() {
    this.#clock_ = new THREE.Clock(true)

    window.addEventListener(
      "resize",
      () => {
        this.#onWindowResize_()
      },
      false
    )

    await this.#setupProject_()

    this.#onWindowResize_()
    this.#raf_()
  }

  async #setupProject_() {
    this.#threejs_ = new THREE.WebGLRenderer({ antialias: true })
    this.#threejs_.shadowMap.enabled = true
    this.#threejs_.shadowMap.type = THREE.PCFSoftShadowMap
    this.#threejs_.toneMapping = THREE.ACESFilmicToneMapping
    this.#threejs_.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.#threejs_.domElement)

    const fov = 70
    const aspect = window.innerWidth / window.innerHeight
    const near = 0.1
    const far = 1000
    this.#camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.#camera_.position.set(2, 1, 2)
    this.#camera_.lookAt(new THREE.Vector3(0, 0, 0))

    this.#controls_ = new OrbitControls(
      this.#camera_,
      this.#threejs_.domElement
    )
    this.#controls_.enableDamping = true
    this.#controls_.target.set(0, 0, 0)

    this.#scene_ = new THREE.Scene()
    this.#scene_.background = new THREE.Color(0x000000)

    //create hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xd3e2e9, 0x856b38, 0.5)
    this.#scene_.add(hemiLight)

    //create a point loght
    const pointLight = new THREE.PointLight(0xffffff, 2, 100)
    pointLight.position.set(0.5, 0.7, 1)
    pointLight.castShadow = true
    this.#scene_.add(pointLight)

    const helper = new THREE.PointLightHelper(pointLight, 0.1)
    this.#scene_.add(helper)

    //create tweakpane
    const pane = new Pane()

    const params = {
      type: "Cube",
    }

    pane
      .addBinding(params, "type", {
        options: {
          Cube: "Cube",
          Sphere: "Sphere",
          Knot: "Knot",
        },
      })
      .on("change", (evt) => {
        this.#cube_.visible = false
        this.#sphere_.visible = false
        this.#knot_.visible = false

        if (evt.value === "Cube") {
          this.#cube_.visible = true
        } else if (evt.value === "Sphere") {
          this.#sphere_.visible = true
        } else {
          this.#knot_.visible = true
        }
      })

    const lightFolder = pane.addFolder({ title: "Light" })
    lightFolder.addBinding(pointLight, "position", {
      x: { min: -2, max: 2 },
      y: { min: -2, max: 2 },
      z: { min: -2, max: 2 },
    })

    const mat = this.#Test_MeshPhongMaterial(pane)

    const cubeGeo = new THREE.BoxGeometry(1, 1, 1, 128, 128, 128)
    this.#cube_ = new THREE.Mesh(cubeGeo, mat)
    this.#cube_.castShadow = true
    this.#cube_.receiveShadow = true
    this.#scene_.add(this.#cube_)

    const sphereGeo = new THREE.SphereGeometry(1, 32, 32)
    this.#sphere_ = new THREE.Mesh(sphereGeo, mat)
    this.#sphere_.castShadow = true
    this.#sphere_.receiveShadow = true
    this.#scene_.add(this.#sphere_)

    const knotGeo = new THREE.TorusKnotGeometry(0.5, 0.1, 100, 16)
    this.#knot_ = new THREE.Mesh(knotGeo, mat)
    this.#knot_.castShadow = true
    this.#knot_.receiveShadow = true
    this.#scene_.add(this.#knot_)

    this.#sphere_.visible = false
    this.#knot_.visible = false
  }

  #Test_MeshPhongMaterial(pane) {
    const mat = new THREE.MeshPhongMaterial({})

    const folder = pane.addFolder({ title: "MeshPhongMaterial" })

    folder.addBinding(mat, "color", { view: "color", color: { tye: "float" } })
    folder.addBinding(mat, "emissive", {
      view: "color",
      color: { type: "float" },
    })
    folder.addBinding(mat, "shininess", { min: 0, max: 1000 })

    return mat
  }

  #Test_MeshLambertMaterial(pane) {
    const loader = new THREE.TextureLoader()
    const map = loader.load("./textures/RED_BRICK_001_1K_BaseColor.jpg")
    map.colorSpace = THREE.SRGBColorSpace

    const normalMap = loader.load("/textures/RED_BRICK_001_1K_Normal.jpg")

    const aoMap = loader.load(
      "./textures/RED_BRICK_001_1K_AmbientOcclusion.jpg"
    )

    const displacementMap = loader.load("textures/displacement.png")

    const rgbeLoader = new RGBELoader()

    const mat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      //map: map,
      //aoMap: aoMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, -1),
    })

    rgbeLoader.load("/skybox/golden_bay_4k.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      //  mat.envMap = texture

      // this.#scene_.background = texture
    })

    const folder = pane.addFolder({ title: "MeshLambertMaterial" })

    folder.addBinding(mat, "color", { view: "color", color: { type: "float" } })
    folder.addBinding(mat, "aoMapIntensity", { min: 0, max: 1 })
    folder.addBinding(mat, "emissive", {
      view: "color",
      color: { type: "float" },
    })

    return mat
  }

  #Test_MeshBasicMaterial(pane) {
    const loader = new THREE.TextureLoader()
    const map = loader.load("./textures/RED_BRICK_001_1K_BaseColor.jpg")
    map.colorSpace = THREE.SRGBColorSpace

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: map,
    })

    const folder = pane.addFolder({ title: "MeshBasicMaterial" })
    folder.addBinding(mat, "color", { view: "color", color: { type: "float" } })
    folder.addBinding(mat, "wireframe")

    return mat
  }

  #onWindowResize_() {
    const dpr = window.devicePixelRatio
    const canvas = this.#threejs_.domElement
    canvas.style.width = window.innerWidth + "px"
    canvas.style.height = window.innerHeight + "px"
    const w = canvas.clientWidth
    const h = canvas.clientHeight

    const aspect = w / h

    this.#threejs_.setSize(w * dpr, h * dpr, false)
    this.#camera_.aspect = aspect
    this.#camera_.updateProjectionMatrix()
  }

  #raf_() {
    requestAnimationFrame((t) => {
      this.#step_(this.#clock_.getDelta())
      this.#render_()
      this.#raf_()
    })
  }

  #render_() {
    this.#threejs_.render(this.#scene_, this.#camera_)
  }

  #step_(timeElapsed) {
    this.#controls_.update(timeElapsed)
  }
}

let APP_ = null

window.addEventListener("DOMContentLoaded", async () => {
  APP_ = new App()
  await APP_.initialize()
})
