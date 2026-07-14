import Phaser from 'phaser';
import { unlockAudio } from '../shared';

export class MusicManager {
    private static music: Phaser.Sound.BaseSound | null = null;

    static play(scene: Phaser.Scene) {
        unlockAudio(scene);

        if (this.music?.isPlaying) return;

        this.music = scene.sound.add('bgm', {
            loop: true,
            volume: 0.25
        });

        this.music.play();
    }

    static stop() {
        this.music?.stop();
        this.music?.destroy();
        this.music = null;
    }
}
