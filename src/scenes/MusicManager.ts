import Phaser from 'phaser';
import { unlockAudio } from '../shared';
import { getSettings } from '../state/Settings';

export class MusicManager {
    private static music: Phaser.Sound.BaseSound | null = null;

    static play(scene: Phaser.Scene) {
        unlockAudio(scene);

        if (this.music?.isPlaying) {
            (this.music as any).volume = getSettings().musicVolume;
            return;
        }

        this.music = scene.sound.add('bgm', {
            loop: true,
            volume: getSettings().musicVolume,
        });

        this.music.play();
    }

    static setVolume(volume: number) {
        if (this.music?.isPlaying) {
            (this.music as any).volume = volume;
        }
    }

    static stop() {
        this.music?.stop();
        this.music?.destroy();
        this.music = null;
    }
}
