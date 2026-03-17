const Audio = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    currentMusic: null,
    musicPlaying: false,
    muted: false,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.35;
            this.musicGain.connect(this.masterGain);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.5;
    },

    play(name) {
        if (!this.ctx || this.muted) return;
        this.resume();
        const sfx = this._sfxDefs[name];
        if (sfx) sfx.call(this);
    },

    playMusic(name) {
        if (!this.ctx) return;
        this.resume();
        this.stopMusic();
        if (name === 'battle') this._startBattleMusic();
        else if (name === 'menu') this._startMenuMusic();
        else if (name === 'map') this._startMapMusic();
    },

    stopMusic() {
        this.musicPlaying = false;
        if (this._musicTimer) { clearTimeout(this._musicTimer); this._musicTimer = null; }
        if (this.currentMusic) {
            try { this.currentMusic.forEach(n => { try { n.stop(); } catch(e){} }); } catch(e) {}
            this.currentMusic = null;
        }
    },

    // --- SFX definitions ---
    _sfxDefs: {
        hit() {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sawtooth'; o.frequency.value = 200;
            o.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
            g.gain.setValueAtTime(0.3, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            o.connect(g); g.connect(this.sfxGain);
            o.start(); o.stop(this.ctx.currentTime + 0.15);
        },
        skill() {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'square'; o.frequency.value = 300;
            o.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);
            o.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
            g.gain.setValueAtTime(0.2, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
            o.connect(g); g.connect(this.sfxGain);
            o.start(); o.stop(this.ctx.currentTime + 0.25);
        },
        click() {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine'; o.frequency.value = 800;
            g.gain.setValueAtTime(0.15, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            o.connect(g); g.connect(this.sfxGain);
            o.start(); o.stop(this.ctx.currentTime + 0.05);
        },
        swordClash() {
            const t = this.ctx.currentTime;
            // Metallic clash: high-freq burst + noise
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'square'; o.frequency.value = 1800;
            o.frequency.exponentialRampToValueAtTime(400, t + 0.08);
            g.gain.setValueAtTime(0.2, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            o.connect(g); g.connect(this.sfxGain);
            o.start(t); o.stop(t + 0.12);
            // Ring
            const o2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            o2.type = 'sine'; o2.frequency.value = 3200;
            g2.gain.setValueAtTime(0.08, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o2.connect(g2); g2.connect(this.sfxGain);
            o2.start(t); o2.stop(t + 0.2);
        },
        arrowShoot() {
            const t = this.ctx.currentTime;
            const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
            const src = this.ctx.createBufferSource(); src.buffer = buf;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.18, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 2;
            src.connect(bp); bp.connect(g); g.connect(this.sfxGain);
            src.start(t); src.stop(t + 0.08);
            // Whoosh
            const o = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            o.type = 'sine'; o.frequency.value = 600;
            o.frequency.exponentialRampToValueAtTime(200, t + 0.15);
            g2.gain.setValueAtTime(0.06, t + 0.02);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            o.connect(g2); g2.connect(this.sfxGain);
            o.start(t); o.stop(t + 0.15);
        },
        arrowHit() {
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sawtooth'; o.frequency.value = 300;
            o.frequency.exponentialRampToValueAtTime(100, t + 0.06);
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
            o.connect(g); g.connect(this.sfxGain);
            o.start(t); o.stop(t + 0.08);
        },
        magicCast() {
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine'; o.frequency.value = 300;
            o.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
            o.frequency.exponentialRampToValueAtTime(600, t + 0.35);
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            o.connect(g); g.connect(this.sfxGain);
            o.start(t); o.stop(t + 0.4);
            // Shimmer
            const o2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            o2.type = 'sine'; o2.frequency.value = 800;
            o2.frequency.linearRampToValueAtTime(1600, t + 0.3);
            g2.gain.setValueAtTime(0.06, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            o2.connect(g2); g2.connect(this.sfxGain);
            o2.start(t); o2.stop(t + 0.35);
        },
        shieldBlock() {
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle'; o.frequency.value = 250;
            o.frequency.exponentialRampToValueAtTime(80, t + 0.1);
            g.gain.setValueAtTime(0.25, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            o.connect(g); g.connect(this.sfxGain);
            o.start(t); o.stop(t + 0.15);
            // Thud
            const o2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            o2.type = 'sine'; o2.frequency.value = 120;
            o2.frequency.exponentialRampToValueAtTime(40, t + 0.12);
            g2.gain.setValueAtTime(0.2, t);
            g2.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            o2.connect(g2); g2.connect(this.sfxGain);
            o2.start(t); o2.stop(t + 0.12);
        },
        death() {
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sawtooth'; o.frequency.value = 180;
            o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            o.connect(g); g.connect(this.sfxGain);
            o.start(t); o.stop(t + 0.4);
        },
        heal() {
            const t = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            notes.forEach((freq, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sine'; o.frequency.value = freq;
                const start = t + i * 0.08;
                g.gain.setValueAtTime(0.1, start);
                g.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
                o.connect(g); g.connect(this.sfxGain);
                o.start(start); o.stop(start + 0.2);
            });
        },
        levelUp() {
            const t = this.ctx.currentTime;
            const notes = [392, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
            notes.forEach((freq, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sine'; o.frequency.value = freq;
                const start = t + i * 0.1;
                g.gain.setValueAtTime(0.12, start);
                g.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
                o.connect(g); g.connect(this.sfxGain);
                o.start(start); o.stop(start + 0.25);
            });
        }
    },

    // --- Dark Rock Music Engine ---
    // Procedural generation inspired by heavy/dark rock (distorted power chords, driving drums, dark melodies)

    _createDistortion(amount) {
        const curve = new Float32Array(this.ctx.sampleRate);
        for (let i = 0; i < curve.length; i++) {
            const x = (i * 2) / curve.length - 1;
            curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
        }
        const ws = this.ctx.createWaveShaper();
        ws.curve = curve;
        ws.oversample = '4x';
        return ws;
    },

    _playNote(freq, startTime, duration, type, gainVal, dest) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type || 'sawtooth';
        o.frequency.value = freq;
        g.gain.setValueAtTime(gainVal || 0.15, startTime);
        g.gain.setValueAtTime(gainVal || 0.15, startTime + duration * 0.7);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        o.connect(g); g.connect(dest || this.musicGain);
        o.start(startTime); o.stop(startTime + duration);
        return o;
    },

    _startBattleMusic() {
        this.musicPlaying = true;
        this.currentMusic = [];
        const bpm = 140;
        const beatDur = 60 / bpm;
        const barDur = beatDur * 4;

        // Dark rock progression in D minor / drop D feel
        // Power chord roots: D2, C2, Bb1, A1 (classic dark rock progression)
        const chordRoots = [73.42, 65.41, 58.27, 55.00]; // D2, C2, Bb1, A1
        const melodyNotes = [
            // Aggressive pentatonic melody fragments
            [293.66, 349.23, 392.00, 349.23, 293.66, 261.63, 220.00, 293.66], // D4-based dark run
            [349.23, 293.66, 261.63, 293.66, 220.00, 196.00, 220.00, 261.63], // F4 descending
            [233.08, 261.63, 293.66, 261.63, 233.08, 196.00, 174.61, 196.00], // Bb3 pattern
            [220.00, 261.63, 293.66, 349.23, 293.66, 261.63, 220.00, 196.00]  // A3 ascending
        ];

        const scheduleLoop = () => {
            if (!this.musicPlaying) return;
            const now = this.ctx.currentTime;
            const loopDur = barDur * 4;

            for (let bar = 0; bar < 4; bar++) {
                const root = chordRoots[bar];
                const barStart = now + bar * barDur;

                // --- Distorted power chords (rhythm guitar) ---
                const dist = this._createDistortion(50);
                const chordGain = this.ctx.createGain();
                chordGain.gain.value = 0.08;
                dist.connect(chordGain); chordGain.connect(this.musicGain);

                // Palm muted chugs on beats
                for (let beat = 0; beat < 8; beat++) {
                    const t = barStart + beat * (beatDur / 2);
                    const dur = (beat % 2 === 0) ? beatDur * 0.4 : beatDur * 0.2;
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = root;
                    g.gain.setValueAtTime(0.12, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
                    o.connect(dist);
                    o.start(t); o.stop(t + dur + 0.01);
                    this.currentMusic.push(o);

                    // Fifth for power chord
                    const o2 = this.ctx.createOscillator();
                    o2.type = 'sawtooth';
                    o2.frequency.value = root * 1.5;
                    o2.connect(dist);
                    o2.start(t); o2.stop(t + dur + 0.01);
                    this.currentMusic.push(o2);
                }

                // --- Lead melody (dark, aggressive) ---
                const melody = melodyNotes[bar];
                for (let n = 0; n < melody.length; n++) {
                    const t = barStart + n * (beatDur / 2);
                    const o = this._playNote(melody[n], t, beatDur * 0.45, 'square', 0.06);
                    this.currentMusic.push(o);
                }

                // --- Bass (sub octave following roots) ---
                const bassO = this._playNote(root / 2, barStart, barDur * 0.95, 'triangle', 0.12);
                this.currentMusic.push(bassO);

                // --- Drums (noise-based kick & snare pattern) ---
                for (let beat = 0; beat < 4; beat++) {
                    const t = barStart + beat * beatDur;
                    // Kick on 1 and 3
                    if (beat === 0 || beat === 2) {
                        const kick = this.ctx.createOscillator();
                        const kg = this.ctx.createGain();
                        kick.type = 'sine'; kick.frequency.value = 100;
                        kick.frequency.exponentialRampToValueAtTime(30, t + 0.12);
                        kg.gain.setValueAtTime(0.3, t);
                        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                        kick.connect(kg); kg.connect(this.musicGain);
                        kick.start(t); kick.stop(t + 0.15);
                        this.currentMusic.push(kick);
                    }
                    // Snare on 2 and 4
                    if (beat === 1 || beat === 3) {
                        const bufferSize = this.ctx.sampleRate * 0.1;
                        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                        const noise = this.ctx.createBufferSource();
                        noise.buffer = buffer;
                        const ng = this.ctx.createGain();
                        ng.gain.setValueAtTime(0.15, t);
                        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                        const hpf = this.ctx.createBiquadFilter();
                        hpf.type = 'highpass'; hpf.frequency.value = 1000;
                        noise.connect(hpf); hpf.connect(ng); ng.connect(this.musicGain);
                        noise.start(t); noise.stop(t + 0.1);
                        this.currentMusic.push(noise);
                    }
                    // Hi-hat on every eighth
                    for (let sub = 0; sub < 2; sub++) {
                        const ht = t + sub * (beatDur / 2);
                        const bufferSize = this.ctx.sampleRate * 0.03;
                        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                        const hh = this.ctx.createBufferSource();
                        hh.buffer = buffer;
                        const hg = this.ctx.createGain();
                        hg.gain.setValueAtTime(0.04, ht);
                        hg.gain.exponentialRampToValueAtTime(0.001, ht + 0.03);
                        const hp = this.ctx.createBiquadFilter();
                        hp.type = 'highpass'; hp.frequency.value = 6000;
                        hh.connect(hp); hp.connect(hg); hg.connect(this.musicGain);
                        hh.start(ht); hh.stop(ht + 0.03);
                        this.currentMusic.push(hh);
                    }
                }
            }

            // Crossfade: schedule next loop slightly before current ends
            const fadeTime = 0.6;
            this._musicTimer = setTimeout(() => {
                // Fade out current music
                if (this.musicGain) {
                    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
                    this.musicGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + fadeTime * 0.5);
                }
                // Schedule new loop
                this.currentMusic = [];
                scheduleLoop();
                // Fade back in
                if (this.musicGain) {
                    this.musicGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + fadeTime);
                }
            }, (loopDur - fadeTime) * 1000);
        };

        scheduleLoop();
    },

    _startMenuMusic() {
        this.musicPlaying = true;
        this.currentMusic = [];
        const bpm = 80;
        const beatDur = 60 / bpm;

        // Dark ambient/clean arpeggios — moody and atmospheric
        const chords = [
            [146.83, 174.61, 220.00], // Dm
            [130.81, 164.81, 196.00], // Cm
            [116.54, 146.83, 174.61], // Bb
            [110.00, 138.59, 164.81]  // Am
        ];

        const scheduleLoop = () => {
            if (!this.musicPlaying) return;
            const now = this.ctx.currentTime;

            for (let bar = 0; bar < 4; bar++) {
                const chord = chords[bar];
                const barStart = now + bar * beatDur * 4;

                // Clean arpeggiated chords
                chord.forEach((note, i) => {
                    for (let rep = 0; rep < 4; rep++) {
                        const t = barStart + (i + rep * 3) * (beatDur * 0.33);
                        if (t < barStart + beatDur * 4) {
                            const o = this._playNote(note, t, beatDur * 0.8, 'sine', 0.06);
                            this.currentMusic.push(o);
                        }
                    }
                });

                // Low drone
                const drone = this._playNote(chord[0] / 2, barStart, beatDur * 3.8, 'triangle', 0.05);
                this.currentMusic.push(drone);
            }

            const loopDur = beatDur * 16;
            const fadeTime = 0.8;
            this._musicTimer = setTimeout(() => {
                if (this.musicGain) {
                    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
                    this.musicGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + fadeTime * 0.5);
                }
                this.currentMusic = [];
                scheduleLoop();
                if (this.musicGain) {
                    this.musicGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + fadeTime);
                }
            }, (loopDur - fadeTime) * 1000);
        };

        scheduleLoop();
    },

    _startMapMusic() {
        this.musicPlaying = true;
        this.currentMusic = [];
        const bpm = 100;
        const beatDur = 60 / bpm;

        // Marching/epic feel but still dark
        const roots = [146.83, 130.81, 110.00, 130.81]; // Dm, Cm, Am, Cm

        const scheduleLoop = () => {
            if (!this.musicPlaying) return;
            const now = this.ctx.currentTime;

            for (let bar = 0; bar < 4; bar++) {
                const root = roots[bar];
                const barStart = now + bar * beatDur * 4;

                // Marching rhythm - strings
                for (let beat = 0; beat < 4; beat++) {
                    const t = barStart + beat * beatDur;
                    const o = this._playNote(root, t, beatDur * 0.6, 'sawtooth', 0.04);
                    this.currentMusic.push(o);
                    const o2 = this._playNote(root * 1.5, t, beatDur * 0.6, 'sawtooth', 0.03);
                    this.currentMusic.push(o2);
                }

                // Bass
                const bass = this._playNote(root / 2, barStart, beatDur * 3.8, 'triangle', 0.08);
                this.currentMusic.push(bass);

                // Slow kick
                for (let beat = 0; beat < 2; beat++) {
                    const t = barStart + beat * beatDur * 2;
                    const kick = this.ctx.createOscillator();
                    const kg = this.ctx.createGain();
                    kick.type = 'sine'; kick.frequency.value = 80;
                    kick.frequency.exponentialRampToValueAtTime(30, t + 0.15);
                    kg.gain.setValueAtTime(0.2, t);
                    kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                    kick.connect(kg); kg.connect(this.musicGain);
                    kick.start(t); kick.stop(t + 0.18);
                    this.currentMusic.push(kick);
                }
            }

            const loopDur = beatDur * 16;
            const fadeTime = 0.6;
            this._musicTimer = setTimeout(() => {
                if (this.musicGain) {
                    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
                    this.musicGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + fadeTime * 0.5);
                }
                this.currentMusic = [];
                scheduleLoop();
                if (this.musicGain) {
                    this.musicGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + fadeTime);
                }
            }, (loopDur - fadeTime) * 1000);
        };

        scheduleLoop();
    }
};
