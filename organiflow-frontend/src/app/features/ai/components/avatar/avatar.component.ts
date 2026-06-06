import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  SimpleChanges,
  input,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { LipSyncCue } from '../../models/assistant.model';

const ARKIT_MUSCLES = [
  'jawOpen', 'mouthFunnel', 'mouthPucker', 'mouthClose',
  'mouthRollLower', 'mouthSmileLeft', 'mouthSmileRight',
  'eyeBlinkLeft', 'eyeBlinkRight',
];

const ARKIT_MAPPING: Record<string, Partial<Record<string, number>>> = {
  A: { jawOpen: 0.0 },
  B: { jawOpen: 0.1 },
  C: { jawOpen: 0.2, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 },
  D: { jawOpen: 0.4 },
  E: { jawOpen: 0.1, mouthFunnel: 0.7 },
  F: { jawOpen: 0.1, mouthPucker: 0.8 },
  G: { jawOpen: 0.1, mouthRollLower: 0.6 },
  H: { jawOpen: 0.2 },
  X: { jawOpen: 0.0 },
};

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas style="width:100%;height:100%;display:block;"></canvas>`,
})
export class AvatarComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly avatarPath    = input<string>('/assets/avatar.glb');
  readonly audioElement  = input<HTMLAudioElement | null>(null);
  readonly lipSyncData   = input<LipSyncCue[] | null>(null);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mixer?: THREE.AnimationMixer;
  private headNode?: THREE.Mesh;
  private targetInfluences: Record<string, number> = {};
  private clock = new THREE.Clock();
  private animId = 0;
  private nextBlink = 0;
  private blinkEndTime = 0;

  ngAfterViewInit(): void {
    this.initRenderer();
    this.loadModel(this.avatarPath());
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['avatarPath'] && !changes['avatarPath'].firstChange) {
      this.loadModel(this.avatarPath());
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    this.renderer?.dispose();
  }

  private initRenderer(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0.3, 1.8);
    this.camera.lookAt(0, 0.2, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    const dir1    = new THREE.DirectionalLight(0xffffff, 1.5);
    dir1.position.set(2, 2, 5);
    const dir2    = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-2, 0, 2);
    this.scene.add(ambient, dir1, dir2);
  }

  private loadModel(path: string): void {
    this.scene?.children
      .filter(c => c.userData['isAvatar'])
      .forEach(c => this.scene.remove(c));
    this.mixer?.stopAllAction();

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(path, gltf => {
      const root = gltf.scene;
      root.userData['isAvatar'] = true;
      root.position.set(-0.6, -2.4, -0.5);
      root.scale.setScalar(1.45);

      root.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.frustumCulled = false;
          if (mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).metalness = 0.1;
            (mesh.material as THREE.MeshStandardMaterial).roughness = 0.7;
          }
          if (child.name.toLowerCase().includes('cornea')) child.visible = false;
          if (child.name === 'Streamoji_Head') this.headNode = mesh;
        }
      });

      this.scene.add(root);
      this.mixer = new THREE.AnimationMixer(root);

      const fbxLoader = new FBXLoader();
      fbxLoader.load('/assets/animacion.fbx', fbx => {
        if (fbx.animations[0]) {
          fbx.animations[0].name = 'Idle';
          const action = this.mixer!.clipAction(fbx.animations[0], root);
          action.reset().fadeIn(0.5).play();
        }
      });
    });
  }

  private animate(): void {
    this.animId = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.mixer?.update(delta);
    this.applyLipSync(delta);
    this.renderer?.render(this.scene, this.camera);
  }

  private applyLipSync(delta: number): void {
    if (!this.headNode?.morphTargetDictionary || !this.headNode?.morphTargetInfluences) return;

    ARKIT_MUSCLES.forEach(m => (this.targetInfluences[m] = 0));

    const audio = this.audioElement();
    const cues  = this.lipSyncData();
    if (audio && cues && !audio.paused) {
      const t   = audio.currentTime;
      const cue = cues.find(c => t >= c.start && t <= c.end);
      const poses = ARKIT_MAPPING[cue?.value ?? 'X'] ?? ARKIT_MAPPING['X'];
      Object.entries(poses).forEach(([m, v]) => (this.targetInfluences[m] = v!));
    }

    const elapsed = this.clock.elapsedTime;
    if (elapsed > this.nextBlink) {
      this.blinkEndTime = elapsed + 0.15;
      this.nextBlink    = elapsed + THREE.MathUtils.randFloat(2, 6);
    }
    if (elapsed < this.blinkEndTime) {
      this.targetInfluences['eyeBlinkLeft']  = 1;
      this.targetInfluences['eyeBlinkRight'] = 1;
    }

    const lerpSpeed = 15;
    ARKIT_MUSCLES.forEach(muscle => {
      const idx = this.headNode!.morphTargetDictionary![muscle];
      if (idx !== undefined) {
        const curr   = this.headNode!.morphTargetInfluences![idx];
        const target = this.targetInfluences[muscle] ?? 0;
        this.headNode!.morphTargetInfluences![idx] = THREE.MathUtils.lerp(curr, target, delta * lerpSpeed);
      }
    });
  }
}
