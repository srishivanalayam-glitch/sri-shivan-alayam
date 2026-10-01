import * as THREE from 'three';

/** A single walking route keeps both forward and reverse trips inside the doors.
 * Station-to-station jumps follow every intervening segment, even when interrupted.
 */
export class TempleNavigation {
  constructor(camera, model, stops, { onStatus, onArrival, onMovement, reducedMotion }) {
    Object.assign(this, { camera, stops, onStatus, onArrival, onMovement, reducedMotion });
    this.distance = 0;
    this.active = 0;
    this.moving = null;
    this.overview = false;
    this.returning = null;
    this.guided = false;
    this.dwell = 0;
    this.rail = [];
    this.stationDistances = [];
    this.target = new THREE.Vector3();
    this.aimCamera = new THREE.PerspectiveCamera();
    const pointFor = i => {
      const point = model.getObjectByName(stops[i][0]).getWorldPosition(new THREE.Vector3());
      if (i === 0) point.set(0, 3.3, matchMedia('(max-width:700px)').matches ? 40 : 34);
      if (i === 5) point.z = -10.3;
      return point;
    };
    const append = (point, look, station) => {
      const previous = this.rail.at(-1);
      const distance = previous ? previous.distance + previous.point.distanceTo(point) : 0;
      this.rail.push({ point, look: new THREE.Vector3(...look), distance });
      if (station !== undefined) this.stationDistances[station] = distance;
    };
    append(pointFor(0), stops[0][4], 0);
    append(new THREE.Vector3(0, 1.8, 17), [0, 2.5, 7]);
    append(new THREE.Vector3(0, 1.8, 9.5), [0, 2.5, -3]);
    for (let i = 1; i < stops.length; i++) append(pointFor(i), stops[i][4], i);
  }

  sample(distance, position, target) {
    distance = THREE.MathUtils.clamp(distance, 0, this.rail.at(-1).distance);
    let index = 1;
    while (index < this.rail.length - 1 && this.rail[index].distance < distance) index++;
    const a = this.rail[index - 1], b = this.rail[index];
    const t = (distance - a.distance) / (b.distance - a.distance);
    position.lerpVectors(a.point, b.point, t);
    target.lerpVectors(a.look, b.look, t);
  }

  choose(index, instant = false) {
    this.active = THREE.MathUtils.clamp(index, 0, this.stops.length - 1);
    const end = this.stationDistances[this.active];
    if (instant || this.reducedMotion() || Math.abs(end - this.distance) < .02 && !this.overview) {
      this.finish();
      return;
    }
    this.moving = { from: this.distance, end, elapsed: 0, duration: THREE.MathUtils.clamp(Math.abs(end - this.distance) / 3.4, 1.5, 18) };
    // Only the high overview camera fades back to the route; walking is continuous.
    this.returning = this.overview ? { elapsed: 0, moved: false } : null;
    this.overview = false;
    this.dwell = 0;
    this.onMovement(true);
    this.onStatus(`Walking to ${this.stops[this.active][1]}`);
  }

  finish() {
    this.distance = this.stationDistances[this.active];
    this.moving = null;
    this.returning = null;
    this.overview = false;
    this.sample(this.distance, this.camera.position, this.target);
    this.camera.lookAt(new THREE.Vector3(...this.stops[this.active][4]));
    this.onMovement(false);
    this.onStatus(`Arrived: ${this.stops[this.active][1]}`);
    this.onArrival(this.active);
    this.dwell = 0;
  }

  pause() {
    // If paused in the first half of an overview return, retain overview mode;
    // the next journey must still return to the rail rather than jump into a roof.
    if (this.returning && !this.returning.moved) this.overview = true;
    this.moving = null;
    this.returning = null;
    this.onMovement(false);
    this.onStatus('Paused. Choose a place to continue.');
  }

  update(dt) {
    if (this.returning) {
      this.returning.elapsed += dt;
      const progress = Math.min(this.returning.elapsed / .6, 1);
      if (progress >= .5 && !this.returning.moved) {
        this.sample(this.distance, this.camera.position, this.target);
        this.camera.lookAt(this.target);
        this.returning.moved = true;
      }
      if (progress === 1) this.returning = null;
      return Math.abs(progress * 2 - 1);
    }
    if (this.moving) {
      this.moving.elapsed += dt;
      const progress = Math.min(this.moving.elapsed / this.moving.duration, 1);
      const ease = progress * progress * (3 - 2 * progress);
      this.distance = THREE.MathUtils.lerp(this.moving.from, this.moving.end, ease);
      this.sample(this.distance, this.camera.position, this.target);
      this.aimCamera.position.copy(this.camera.position);
      this.aimCamera.lookAt(this.target);
      this.camera.quaternion.slerp(this.aimCamera.quaternion, 1 - Math.exp(-dt * 5));
      if (progress === 1) this.finish();
    }
    return 1;
  }
}
