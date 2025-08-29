/**
 * AudioManager - Standalone audio system for Backpack Minigame
 * Handles loading, decoding, and playing embedded audio files
 * BACKGROUND AUDIO VERSION: Added dedicated background audio track support
 */
window.AudioManager = {
    audioContext: null,
    sounds: {},
    volume: 0.7,
    isInitialized: false,
    
    // NEW: Background audio management
    currentBackground: null,
    backgroundVolume: 0.4,
    
    /**
     * Initialize audio system
     */
    init: function() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.preloadSounds();
            this.isInitialized = true;
            console.log('🔊 Audio system initialized');
        } catch (error) {
            console.warn('❌ Audio not supported:', error);
        }
    },
    
    /**
     * Preload all audio files from embedded data
     */
    preloadSounds: function() {
        if (!window.BACKPACK_AUDIO) {
            console.warn('⚠️ No audio data found - audio files may not be embedded yet');
            return;
        }
        
        Object.keys(window.BACKPACK_AUDIO).forEach(key => {
            this.loadSound(key, window.BACKPACK_AUDIO[key]);
        });
    },
    
    /**
     * Load and decode an audio file
     */
    loadSound: function(key, dataUrl) {
        if (!this.audioContext) return;
        
        try {
            // Convert data URL to ArrayBuffer
            const base64 = dataUrl.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Decode audio
            this.audioContext.decodeAudioData(bytes.buffer)
                .then(audioBuffer => {
                    this.sounds[key] = audioBuffer;
                    console.log(`🎵 Loaded audio: ${key}`);
                })
                .catch(error => {
                    console.warn(`❌ Failed to decode audio: ${key}`, error);
                });
        } catch (error) {
            console.warn(`❌ Failed to load audio: ${key}`, error);
        }
    },
    
    /**
     * Play a sound effect (one-shot audio)
     */
    play: function(soundKey, volume = this.volume) {
        if (!this.audioContext || !this.sounds[soundKey]) {
            console.warn(`🔇 Sound not available: ${soundKey}`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sounds[soundKey];
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
        } catch (error) {
            console.warn(`❌ Failed to play sound: ${soundKey}`, error);
        }
    },
    
    /**
     * Play background audio (looping, managed track)
     */
    playBackground: function(soundKey, volume = this.backgroundVolume, loop = true, fadeInTime = 1.0) {
        if (!this.audioContext || !this.sounds[soundKey]) {
            console.warn(`🔇 Background sound not available: ${soundKey}`);
            return;
        }
        
        try {
            // Stop any existing background audio first
            this.stopBackground();
            
            // Create new background audio source
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sounds[soundKey];
            source.loop = loop;
            
            // Set up fade-in effect
            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + fadeInTime);
            
            // Connect audio graph
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Store references for later control
            this.currentBackground = {
                source: source,
                gainNode: gainNode,
                soundKey: soundKey,
                volume: volume
            };
            
            // Start playback
            source.start();
            
            console.log(`🎼 Started background audio: ${soundKey}`);
            
        } catch (error) {
            console.warn(`❌ Failed to play background sound: ${soundKey}`, error);
        }
    },
    
    /**
     * Stop current background audio
     */
    stopBackground: function(fadeOutTime = 1.0) {
        if (!this.currentBackground) {
            return; // No background audio playing
        }
        
        try {
            const { source, gainNode, soundKey } = this.currentBackground;
            
            if (fadeOutTime > 0) {
                // Fade out smoothly
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOutTime);
                
                // Stop after fade completes
                setTimeout(() => {
                    try {
                        source.stop();
                    } catch (e) {
                        // Source may have already ended
                    }
                }, fadeOutTime * 1000);
            } else {
                // Stop immediately
                source.stop();
            }
            
            console.log(`🔇 Stopped background audio: ${soundKey}`);
            this.currentBackground = null;
            
        } catch (error) {
            console.warn('❌ Failed to stop background audio:', error);
            this.currentBackground = null; // Clean up anyway
        }
    },
    
    /**
     * Check if background audio is currently playing
     */
    isBackgroundPlaying: function() {
        return this.currentBackground !== null;
    },
    
    /**
     * Get current background audio info
     */
    getCurrentBackground: function() {
        if (this.currentBackground) {
            return {
                soundKey: this.currentBackground.soundKey,
                volume: this.currentBackground.volume
            };
        }
        return null;
    },
    
    /**
     * Set background volume (affects current and future background audio)
     */
    setBackgroundVolume: function(volume, fadeTime = 0.5) {
        this.backgroundVolume = Math.max(0, Math.min(1, volume));
        
        // Update current background volume if playing
        if (this.currentBackground) {
            this.currentBackground.volume = this.backgroundVolume;
            this.currentBackground.gainNode.gain.linearRampToValueAtTime(
                this.backgroundVolume,
                this.audioContext.currentTime + fadeTime
            );
        }
    },
    
    /**
     * Set master volume (for sound effects)
     */
    setVolume: function(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    },
    
    /**
     * Check if audio system is ready
     */
    isReady: function() {
        return this.isInitialized && this.audioContext && Object.keys(this.sounds).length > 0;
    },
    
    /**
     * Get list of available sounds
     */
    getAvailableSounds: function() {
        return Object.keys(this.sounds);
    }
};