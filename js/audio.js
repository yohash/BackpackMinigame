/**
 * AudioManager - Standalone audio system for Backpack Minigame
 * Handles loading, decoding, and playing embedded audio files
 */
window.AudioManager = {
    audioContext: null,
    sounds: {},
    volume: 0.7,
    isInitialized: false,
    
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
     * Play a sound
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
     * Set master volume
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