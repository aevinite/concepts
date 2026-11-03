// A stable-fluids simulation (Stam 1999) on the GPU, written for Concept 8 "Ink".
// Velocity is advected, given vorticity confinement, made divergence-free with Jacobi pressure
// iterations and a gradient subtract. Dye rides on the velocity. On top of the physics sit two
// exact "mathematical marbling" transforms (Lu, Jaffer et al. 2012): an ink DROP that pushes every
// existing colour outward in rings, and a TINE (comb) stroke. Those two are what make it read as
// Ebru rather than smoke. One GLSL 1.0 source runs on WebGL2 and WebGL1.

export type RGB = [number, number, number];
export type Mode = "light" | "dark";

type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; attach(id: number): number };
type DFBO = { w: number; h: number; read: FBO; write: FBO; swap(): void };
type Fmt = { internal: number; format: number };

const VERT = `
precision highp float;
attribute vec2 aPos;
varying vec2 vUv, vL, vR, vT, vB;
uniform vec2 texel;
void main(){
  vUv = aPos*.5+.5;
  vL = vUv - vec2(texel.x,0.); vR = vUv + vec2(texel.x,0.);
  vT = vUv + vec2(0.,texel.y); vB = vUv - vec2(0.,texel.y);
  gl_Position = vec4(aPos,0.,1.);
}`;

const HEAD = `precision highp float; precision highp sampler2D; varying vec2 vUv, vL, vR, vT, vB;\n`;

const COPY = HEAD + `uniform sampler2D uTex; uniform float uMul; void main(){ gl_FragColor = texture2D(uTex,vUv)*uMul; }`;

const SPLAT_VEL = HEAD + `uniform sampler2D uTarget; uniform float aspect, radius; uniform vec2 point; uniform vec3 color;
void main(){ vec2 p = vUv-point; p.x*=aspect; float g = exp(-dot(p,p)/radius);
  gl_FragColor = vec4(texture2D(uTarget,vUv).xyz + color*g, 1.); }`;

// Dye splats LERP toward the pigment instead of adding, so density never passes 1.
const SPLAT_DYE = HEAD + `uniform sampler2D uTarget; uniform float aspect, radius, amount; uniform vec2 point; uniform vec3 color;
void main(){ vec2 p = vUv-point; p.x*=aspect; float g = exp(-dot(p,p)/radius)*amount;
  gl_FragColor = mix(texture2D(uTarget,vUv), vec4(color,1.), clamp(g,0.,1.)); }`;

const ADVECT = HEAD + `uniform sampler2D uVelocity, uSource; uniform vec2 texel, dyeTexel; uniform float dt, dissipation;
#ifdef MANUAL
vec4 bilerp(sampler2D s, vec2 uv, vec2 ts){ vec2 st = uv/ts-.5; vec2 i = floor(st); vec2 f = fract(st);
  vec4 a = texture2D(s,(i+vec2(.5,.5))*ts), b = texture2D(s,(i+vec2(1.5,.5))*ts), c = texture2D(s,(i+vec2(.5,1.5))*ts), d = texture2D(s,(i+vec2(1.5,1.5))*ts);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
#endif
void main(){
#ifdef MANUAL
  vec2 coord = vUv - dt*bilerp(uVelocity,vUv,texel).xy*texel;
  vec4 r = bilerp(uSource,coord,dyeTexel);
#else
  vec2 coord = vUv - dt*texture2D(uVelocity,vUv).xy*texel;
  vec4 r = texture2D(uSource,coord);
#endif
  gl_FragColor = r/(1.+dissipation*dt); }`;

const DIVERGENCE = HEAD + `uniform sampler2D uVelocity; void main(){
  float L = texture2D(uVelocity,vL).x, R = texture2D(uVelocity,vR).x, T = texture2D(uVelocity,vT).y, B = texture2D(uVelocity,vB).y;
  vec2 C = texture2D(uVelocity,vUv).xy;
  if(vL.x<0.) L=-C.x; if(vR.x>1.) R=-C.x; if(vT.y>1.) T=-C.y; if(vB.y<0.) B=-C.y;
  gl_FragColor = vec4(.5*(R-L+T-B),0.,0.,1.); }`;

const CURL = HEAD + `uniform sampler2D uVelocity; void main(){
  float L = texture2D(uVelocity,vL).y, R = texture2D(uVelocity,vR).y, T = texture2D(uVelocity,vT).x, B = texture2D(uVelocity,vB).x;
  gl_FragColor = vec4(.5*(R-L-T+B),0.,0.,1.); }`;

const VORTICITY = HEAD + `uniform sampler2D uVelocity, uCurl; uniform float curl, dt; void main(){
  float L = texture2D(uCurl,vL).x, R = texture2D(uCurl,vR).x, T = texture2D(uCurl,vT).x, B = texture2D(uCurl,vB).x, C = texture2D(uCurl,vUv).x;
  vec2 f = .5*vec2(abs(T)-abs(B), abs(R)-abs(L)); f /= length(f)+.0001; f *= curl*C; f.y *= -1.;
  vec2 v = texture2D(uVelocity,vUv).xy + f*dt; v = clamp(v,-1000.,1000.);
  gl_FragColor = vec4(v,0.,1.); }`;

const PRESSURE = HEAD + `uniform sampler2D uPressure, uDivergence; void main(){
  float L = texture2D(uPressure,vL).x, R = texture2D(uPressure,vR).x, T = texture2D(uPressure,vT).x, B = texture2D(uPressure,vB).x;
  float d = texture2D(uDivergence,vUv).x;
  gl_FragColor = vec4((L+R+B+T-d)*.25,0.,0.,1.); }`;

const GRADIENT = HEAD + `uniform sampler2D uPressure, uVelocity; void main(){
  float L = texture2D(uPressure,vL).x, R = texture2D(uPressure,vR).x, T = texture2D(uPressure,vT).x, B = texture2D(uPressure,vB).x;
  vec2 v = texture2D(uVelocity,vUv).xy - vec2(R-L,T-B);
  gl_FragColor = vec4(v,0.,1.); }`;

// The headline is a solid in the bath: velocity is held at zero inside the letters.
const OBSTACLE = HEAD + `uniform sampler2D uVelocity, uMask; uniform vec4 maskRect; void main(){
  vec2 m = (vUv-maskRect.xy)/maskRect.zw; float k = 0.;
  if(m.x>0.&&m.x<1.&&m.y>0.&&m.y<1.) k = smoothstep(.45,.95,texture2D(uMask,m).a);
  gl_FragColor = vec4(texture2D(uVelocity,vUv).xy*(1.-k),0.,1.); }`;

// Mathematical marbling: an ink drop of radius r at c moves every point p outside it to
// c + (p-c)*sqrt(1 + r^2/|p-c|^2). We need the inverse to sample: c + (p-c)*sqrt(1 - r^2/|p-c|^2).
const DROP = HEAD + `uniform sampler2D uSource; uniform vec2 point, dyeTexel; uniform float aspect, radius, density; uniform vec3 color;
void main(){
  vec2 p = vUv-point; p.x*=aspect; float d = length(p);
  float k = sqrt(max(1.-radius*radius/max(d*d,1e-8),0.));
  vec2 s = p*k; s.x/=aspect;
  vec4 outside = texture2D(uSource, point+s);
  float aa = dyeTexel.y*1.5;
  float inside = smoothstep(radius+aa, radius-aa, d);
  gl_FragColor = mix(outside, vec4(color*density,density), inside); }`;

// A tine (comb) stroke: every point slides along dir by z*lambda/(dist+lambda), dist = distance to
// the nearest tooth line. Distance is constant along dir, so the inverse is exact.
const TINE = HEAD + `uniform sampler2D uSource; uniform vec2 dir, origin; uniform float aspect, z, lambda, spacing, alternate;
void main(){
  vec2 p = vUv-origin; p.x*=aspect;
  vec2 n = vec2(-dir.y,dir.x);
  float t = dot(p,n);
  float sgn = 1.;
  if(spacing>0.){ float k = floor(t/spacing+.5); t = t-k*spacing; if(alternate>.5) sgn = mod(k,2.)<.5?1.:-1.; }
  float f = z*lambda/(abs(t)+lambda)*sgn;
  vec2 s = dir*f; s.x/=aspect;
  gl_FragColor = texture2D(uSource, vUv-s); }`;

const DISPLAY = HEAD + `uniform sampler2D uDye, uVelocity, uMask; uniform vec4 maskRect; uniform vec2 dyeTexel, res;
uniform float mode, time; uniform vec3 paper, paperDeep, sea, seaDeep, spark;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float maskAt(vec2 uv){ vec2 m=(uv-maskRect.xy)/maskRect.zw; if(m.x<0.||m.x>1.||m.y<0.||m.y>1.) return 0.; return texture2D(uMask,m).a; }
vec3 pig(vec4 d){ return d.rgb/max(d.a,.0001); }
void main(){
  vec4 d = texture2D(uDye,vUv);
  float a = clamp(d.a,0.,1.);
  float m = maskAt(vUv);
  vec2 px = vUv*res;
  if(mode<.5){
    // Ebru: opaque pigment floating on size, printed onto laid paper.
    float grain = noise(px*.55)*.6 + noise(px*.09)*.4;
    float laid = .5+.5*sin(px.y*1.1);
    vec3 pap = mix(paperDeep, paper, .55+.45*vUv.y) * (.975 + .03*grain) * (.995+.006*laid);
    vec3 c = pig(d);
    vec4 l = texture2D(uDye,vUv-vec2(dyeTexel.x*1.5,0.)), r = texture2D(uDye,vUv+vec2(dyeTexel.x*1.5,0.));
    vec4 t = texture2D(uDye,vUv+vec2(0.,dyeTexel.y*1.5)), b = texture2D(uDye,vUv-vec2(0.,dyeTexel.y*1.5));
    vec3 gx = pig(r)-pig(l), gy = pig(t)-pig(b);
    float edge = clamp((length(gx)+length(gy))*1.6,0.,1.);
    float cov = smoothstep(.06,.46,a);
    vec3 ink = c*(1.-.28*edge);
    ink *= .955 + .06*grain;
    vec3 col = mix(pap, ink, cov*.96);
    col = mix(col, pap, smoothstep(.05,.7,m)*.94);
    gl_FragColor = vec4(col,1.);
  } else {
    // Night sea: light is emitted where the water is disturbed and fades back into the dark.
    vec2 q = vUv*vec2(res.x/res.y,1.)*3.;
    float caus = noise(q*2.+vec2(time*.05,-time*.04)) * noise(q*3.3-vec2(time*.03,time*.06));
    vec3 col = mix(seaDeep, sea, smoothstep(0.,1.,vUv.y*.7+.15)) + vec3(.0,.03,.04)*caus;
    vec3 c = pig(d);
    vec3 bloom = vec3(0.); float ba = 0.;
    for(int i=0;i<8;i++){ float an = float(i)*.785398; vec2 o = vec2(cos(an),sin(an))*dyeTexel*9.;
      vec4 s = texture2D(uDye, vUv+o); bloom += s.rgb; ba += s.a; }
    bloom /= 8.;
    // light, not paint: bright at low density, a white-hot core where it is dense
    col += c*(1.-exp(-a*2.6))*.95 + vec3(.85,1.,.97)*pow(a,5.)*.35 + bloom*.3;
    float speed = length(texture2D(uVelocity,vUv).xy);
    // plankton: tiny round points that flash where the water moves
    vec2 cell = floor(px/6.);
    float h = hash(cell);
    vec2 jit = vec2(hash(cell+7.1), hash(cell+3.3))*.6+.2;
    float dotm = smoothstep(.22,.0,length(fract(px/6.)-jit));
    float tw = step(.93,h)*(.55+.45*sin(time*4.+h*60.));
    col += spark * dotm * tw * smoothstep(30.,300.,speed) * 1.1;
    col += spark * dotm * step(.994,h) * (.12+.08*sin(time*1.3+h*20.));
    // a moon path: glitter on the water, top right
    float path = exp(-pow((vUv.x-.8+.04*sin(vUv.y*9.+time*.4))/.055,2.)) * smoothstep(.15,1.,vUv.y);
    vec2 gc = floor(px/5.);
    float gd = smoothstep(.3,.0,length(fract(px/5.)-.5));
    col += spark * gd * step(.9, hash(gc+floor(time*2.5))) * path * .6;
    col += vec3(.02,.06,.06) * path * .6;
    col = mix(col, mix(seaDeep,sea,.4), smoothstep(.05,.7,m)*.9);
    float vig = smoothstep(1.25,.35,length(vUv-.5));
    gl_FragColor = vec4(col*(.78+.22*vig),1.);
  }
}`;

class Prog {
  p: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null> = {};
  constructor(private gl: WebGLRenderingContext, vs: WebGLShader, fsSrc: string, defines = "") {
    const fs = compile(gl, gl.FRAGMENT_SHADER, defines + fsSrc);
    const p = gl.createProgram()!;
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(p));
    this.p = p;
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i)!.name; this.u[name] = gl.getUniformLocation(p, name); }
  }
  use() { this.gl.useProgram(this.p); return this; }
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader: " + gl.getShaderInfoLog(s));
  return s;
}

export type FluidOptions = { simRes: number; dyeRes: number; pressureIters: number; curl: number };

export class Fluid {
  gl: WebGLRenderingContext;
  mode: Mode = "light";
  velocityDissipation = 0.25;
  dyeDissipation = 0.02;
  opts: FluidOptions;
  colors = { paper: [0.96, 0.925, 0.86] as RGB, paperDeep: [0.93, 0.885, 0.8] as RGB, sea: [0.02, 0.11, 0.12] as RGB, seaDeep: [0.004, 0.035, 0.045] as RGB, spark: [0.55, 1, 0.92] as RGB };
  maskRect: [number, number, number, number] = [0, 0, 0, 0];

  private type: number;
  private rgba: Fmt; private rg: Fmt; private r: Fmt;
  private linear: boolean;
  private vs: WebGLShader;
  private P: Record<string, Prog> = {};
  private velocity!: DFBO; private dye!: DFBO; private pressure!: DFBO;
  private divergence!: FBO; private curlF!: FBO;
  private maskTex: WebGLTexture;
  private hasMask = false;

  /** Returns null when the device can't render to float/half-float textures. */
  static create(canvas: HTMLCanvasElement, opts: FluidOptions): Fluid | null {
    try {
      const params: WebGLContextAttributes = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false, powerPreference: "high-performance" };
      let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
      const isGL2 = !!gl;
      if (!gl) gl = (canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)) as WebGL2RenderingContext | null;
      if (!gl) return null;
      return new Fluid(gl, isGL2, opts);
    } catch (e) {
      console.warn("[ink] WebGL fluid unavailable, using the paper fallback.", e);
      return null;
    }
  }

  /** True on a software rasteriser (SwiftShader, llvmpipe): the bath then runs lighter. */
  soft = false;

  private constructor(gl: WebGLRenderingContext, isGL2: boolean, opts: FluidOptions) {
    this.gl = gl;
    try {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const name = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      this.soft = /swiftshader|llvmpipe|software|softpipe/i.test(name);
    } catch { /* unknown renderer: assume hardware */ }
    if (this.soft) opts = { ...opts, simRes: 64, dyeRes: 512, pressureIters: 10 };
    this.opts = opts;
    let halfType: number;
    let linear: boolean;
    if (isGL2) {
      const g2 = gl as WebGL2RenderingContext;
      g2.getExtension("EXT_color_buffer_float");
      linear = true; // half-float linear filtering is core in WebGL2
      halfType = g2.HALF_FLOAT;
      this.rgba = this.pick({ internal: g2.RGBA16F, format: g2.RGBA }, halfType, isGL2);
      this.rg = this.pick({ internal: g2.RG16F, format: g2.RG }, halfType, isGL2);
      this.r = this.pick({ internal: g2.R16F, format: g2.RED }, halfType, isGL2);
    } else {
      const hf = gl.getExtension("OES_texture_half_float");
      if (!hf) throw new Error("no half float");
      linear = !!gl.getExtension("OES_texture_half_float_linear");
      halfType = hf.HALF_FLOAT_OES;
      this.rgba = this.rg = this.r = { internal: gl.RGBA, format: gl.RGBA };
      if (!this.supports(this.rgba, halfType)) throw new Error("half float not renderable");
    }
    this.type = halfType;
    this.linear = linear;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const man = linear ? "" : "#define MANUAL\n";
    const src: Record<string, string> = { copy: COPY, splatVel: SPLAT_VEL, splatDye: SPLAT_DYE, divergence: DIVERGENCE, curl: CURL, vorticity: VORTICITY, pressure: PRESSURE, gradient: GRADIENT, obstacle: OBSTACLE, drop: DROP, tine: TINE, display: DISPLAY };
    for (const k in src) this.P[k] = new Prog(gl, this.vs, src[k]);
    this.P.advect = new Prog(gl, this.vs, ADVECT, man);

    this.maskTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    this.initFramebuffers();
    const err = gl.getError();
    if (err && err !== gl.CONTEXT_LOST_WEBGL) console.warn("[ink] gl error at init", err);
  }

  private supports(f: Fmt, type: number) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, 4, 4, 0, f.format, type, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(t); gl.deleteFramebuffer(fb);
    return ok;
  }

  private pick(f: Fmt, type: number, isGL2: boolean): Fmt {
    const gl = this.gl as WebGL2RenderingContext;
    if (this.supports(f, type)) return f;
    if (!isGL2) throw new Error("format");
    if (f.internal === gl.R16F) return this.pick({ internal: gl.RG16F, format: gl.RG }, type, isGL2);
    if (f.internal === gl.RG16F) return this.pick({ internal: gl.RGBA16F, format: gl.RGBA }, type, isGL2);
    throw new Error("no renderable half-float format");
  }

  private res(base: number) {
    const gl = this.gl;
    let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(base), max = Math.round(base * aspect);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: max, h: min } : { w: min, h: max };
  }

  private fbo(w: number, h: number, f: Fmt, filter: number): FBO {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, this.type, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, attach(id: number) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  }

  private dfbo(w: number, h: number, f: Fmt, filter: number): DFBO {
    let a = this.fbo(w, h, f, filter), b = this.fbo(w, h, f, filter);
    return { w, h, get read() { return a; }, set read(v) { a = v; }, get write() { return b; }, set write(v) { b = v; }, swap() { const t = a; a = b; b = t; } };
  }

  private resized(target: DFBO, w: number, h: number, f: Fmt, filter: number): DFBO {
    if (target.w === w && target.h === h) return target;
    const next = this.dfbo(w, h, f, filter);
    const P = this.P.copy.use();
    this.gl.uniform2f(P.u.texel, 1 / w, 1 / h);
    this.gl.uniform1i(P.u.uTex, target.read.attach(0));
    this.gl.uniform1f(P.u.uMul, 1);
    this.blit(next.read);
    this.free(target.read); this.free(target.write);
    return next;
  }

  private free(f: FBO) { this.gl.deleteTexture(f.tex); this.gl.deleteFramebuffer(f.fbo); }

  initFramebuffers() {
    const gl = this.gl;
    const sim = this.res(this.opts.simRes), dye = this.res(this.opts.dyeRes);
    const lin = this.linear ? gl.LINEAR : gl.NEAREST;
    if (!this.velocity) {
      this.dye = this.dfbo(dye.w, dye.h, this.rgba, lin);
      this.velocity = this.dfbo(sim.w, sim.h, this.rg, lin);
    } else {
      this.dye = this.resized(this.dye, dye.w, dye.h, this.rgba, lin);
      this.velocity = this.resized(this.velocity, sim.w, sim.h, this.rg, lin);
      this.free(this.divergence); this.free(this.curlF); this.free(this.pressure.read); this.free(this.pressure.write);
    }
    this.divergence = this.fbo(sim.w, sim.h, this.r, gl.NEAREST);
    this.curlF = this.fbo(sim.w, sim.h, this.r, gl.NEAREST);
    this.pressure = this.dfbo(sim.w, sim.h, this.r, gl.NEAREST);
  }

  private blit(target: FBO | null) {
    const gl = this.gl;
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  get aspect() { return this.gl.drawingBufferWidth / this.gl.drawingBufferHeight; }

  setMask(source: TexImageSource | null, rect?: [number, number, number, number]) {
    const gl = this.gl;
    if (!source) { this.hasMask = false; return; }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.hasMask = true;
    if (rect) this.maskRect = rect;
  }

  step(dt: number) {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    const v = this.velocity;
    const tx = 1 / v.w, ty = 1 / v.h;

    let P = this.P.curl.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform1i(P.u.uVelocity, v.read.attach(0));
    this.blit(this.curlF);

    P = this.P.vorticity.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform1i(P.u.uVelocity, v.read.attach(0));
    gl.uniform1i(P.u.uCurl, this.curlF.attach(1));
    gl.uniform1f(P.u.curl, this.opts.curl);
    gl.uniform1f(P.u.dt, dt);
    this.blit(v.write); v.swap();

    P = this.P.divergence.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform1i(P.u.uVelocity, v.read.attach(0));
    this.blit(this.divergence);

    P = this.P.copy.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform1i(P.u.uTex, this.pressure.read.attach(0));
    gl.uniform1f(P.u.uMul, 0.8);
    this.blit(this.pressure.write); this.pressure.swap();

    P = this.P.pressure.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform1i(P.u.uDivergence, this.divergence.attach(0));
    for (let i = 0; i < this.opts.pressureIters; i++) {
      gl.uniform1i(P.u.uPressure, this.pressure.read.attach(1));
      this.blit(this.pressure.write); this.pressure.swap();
    }

    P = this.P.gradient.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform1i(P.u.uPressure, this.pressure.read.attach(0));
    gl.uniform1i(P.u.uVelocity, v.read.attach(1));
    this.blit(v.write); v.swap();

    P = this.P.advect.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform2f(P.u.dyeTexel, tx, ty);
    gl.uniform1i(P.u.uVelocity, v.read.attach(0));
    gl.uniform1i(P.u.uSource, v.read.attach(0));
    gl.uniform1f(P.u.dt, dt);
    gl.uniform1f(P.u.dissipation, this.velocityDissipation);
    this.blit(v.write); v.swap();

    if (this.hasMask) {
      P = this.P.obstacle.use();
      gl.uniform2f(P.u.texel, tx, ty);
      gl.uniform1i(P.u.uVelocity, v.read.attach(0));
      gl.uniform1i(P.u.uMask, this.attachMask(1));
      gl.uniform4fv(P.u.maskRect, this.maskRect);
      this.blit(v.write); v.swap();
    }

    P = this.P.advect.use();
    gl.uniform2f(P.u.texel, tx, ty);
    gl.uniform2f(P.u.dyeTexel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform1i(P.u.uVelocity, v.read.attach(0));
    gl.uniform1i(P.u.uSource, this.dye.read.attach(1));
    gl.uniform1f(P.u.dissipation, this.dyeDissipation);
    this.blit(this.dye.write); this.dye.swap();
  }

  private attachMask(id: number) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, this.maskTex); return id; }

  /** x, y in 0..1 (y up). dx, dy = velocity to add (texels/s). */
  splat(x: number, y: number, dx: number, dy: number, color: RGB | null, radius: number, amount = 1) {
    const gl = this.gl;
    let P = this.P.splatVel.use();
    gl.uniform2f(P.u.texel, 1 / this.velocity.w, 1 / this.velocity.h);
    gl.uniform1i(P.u.uTarget, this.velocity.read.attach(0));
    gl.uniform1f(P.u.aspect, this.aspect);
    gl.uniform2f(P.u.point, x, y);
    gl.uniform3f(P.u.color, dx, dy, 0);
    gl.uniform1f(P.u.radius, radius / 100);
    this.blit(this.velocity.write); this.velocity.swap();
    if (!color) return;
    P = this.P.splatDye.use();
    gl.uniform2f(P.u.texel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform1i(P.u.uTarget, this.dye.read.attach(0));
    gl.uniform1f(P.u.aspect, this.aspect);
    gl.uniform2f(P.u.point, x, y);
    gl.uniform3f(P.u.color, color[0], color[1], color[2]);
    gl.uniform1f(P.u.radius, radius / 100 * 0.6);
    gl.uniform1f(P.u.amount, amount);
    this.blit(this.dye.write); this.dye.swap();
  }

  /** An Ebru drop. radius is a fraction of the screen height. */
  drop(x: number, y: number, radius: number, color: RGB, density = 1) {
    const gl = this.gl;
    const P = this.P.drop.use();
    gl.uniform2f(P.u.texel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform2f(P.u.dyeTexel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform1i(P.u.uSource, this.dye.read.attach(0));
    gl.uniform1f(P.u.aspect, this.aspect);
    gl.uniform2f(P.u.point, x, y);
    gl.uniform1f(P.u.radius, radius);
    gl.uniform3f(P.u.color, color[0], color[1], color[2]);
    gl.uniform1f(P.u.density, density);
    this.blit(this.dye.write); this.dye.swap();
  }

  /** A comb stroke. dir is a unit vector in screen space (y up); spacing 0 = a single stylus line. */
  tine(dirX: number, dirY: number, originX: number, originY: number, z: number, lambda: number, spacing: number, alternate = false) {
    const gl = this.gl;
    const P = this.P.tine.use();
    gl.uniform2f(P.u.texel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform1i(P.u.uSource, this.dye.read.attach(0));
    gl.uniform1f(P.u.aspect, this.aspect);
    const l = Math.hypot(dirX, dirY) || 1;
    gl.uniform2f(P.u.dir, dirX / l, dirY / l);
    gl.uniform2f(P.u.origin, originX, originY);
    gl.uniform1f(P.u.z, z);
    gl.uniform1f(P.u.lambda, lambda);
    gl.uniform1f(P.u.spacing, spacing);
    gl.uniform1f(P.u.alternate, alternate ? 1 : 0);
    this.blit(this.dye.write); this.dye.swap();
  }

  /** Multiply the dye (k < 1 thins the bath; 0 skims it clean). */
  fade(k: number, velocityToo = false) {
    const gl = this.gl;
    const P = this.P.copy.use();
    gl.uniform2f(P.u.texel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform1i(P.u.uTex, this.dye.read.attach(0));
    gl.uniform1f(P.u.uMul, k);
    this.blit(this.dye.write); this.dye.swap();
    if (velocityToo) {
      gl.uniform1i(P.u.uTex, this.velocity.read.attach(0));
      this.blit(this.velocity.write); this.velocity.swap();
    }
  }

  render(time: number, withMask = true) {
    const gl = this.gl;
    const P = this.P.display.use();
    gl.uniform2f(P.u.texel, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(P.u.uDye, this.dye.read.attach(0));
    gl.uniform1i(P.u.uVelocity, this.velocity.read.attach(1));
    gl.uniform1i(P.u.uMask, this.attachMask(2));
    gl.uniform4fv(P.u.maskRect, this.hasMask && withMask ? this.maskRect : [-9, -9, 1, 1]);
    gl.uniform2f(P.u.dyeTexel, 1 / this.dye.w, 1 / this.dye.h);
    gl.uniform2f(P.u.res, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(P.u.mode, this.mode === "dark" ? 1 : 0);
    gl.uniform1f(P.u.time, time);
    const c = this.colors;
    gl.uniform3fv(P.u.paper, c.paper); gl.uniform3fv(P.u.paperDeep, c.paperDeep);
    gl.uniform3fv(P.u.sea, c.sea); gl.uniform3fv(P.u.seaDeep, c.seaDeep); gl.uniform3fv(P.u.spark, c.spark);
    this.blit(null);
  }
}
