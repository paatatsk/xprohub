import { Audio } from 'expo-av';

const sounds: { [key: string]: Audio.Sound | null } = {
  jobChime: null,
  applyClick: null,
  hiredChord: null,
  clockIn: null,
  coins: null,
};

export async function loadSounds() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    const { sound: jobChime } = await Audio.Sound.createAsync(
      require('../assets/sounds/job-chime.wav')
    );
    sounds.jobChime = jobChime;

    const { sound: applyClick } = await Audio.Sound.createAsync(
      require('../assets/sounds/apply-click.wav')
    );
    sounds.applyClick = applyClick;

    const { sound: hiredChord } = await Audio.Sound.createAsync(
      require('../assets/sounds/hired-chord.wav')
    );
    sounds.hiredChord = hiredChord;

    const { sound: clockIn } = await Audio.Sound.createAsync(
      require('../assets/sounds/clock-in.wav')
    );
    sounds.clockIn = clockIn;

    const { sound: coins } = await Audio.Sound.createAsync(
      require('../assets/sounds/coins.wav')
    );
    sounds.coins = coins;

  } catch (error) {
    console.log('Sound loading error:', error);
  }
}

export async function playSound(name: keyof typeof sounds) {
  try {
    const sound = sounds[name];
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch (error) {
    console.log('Sound play error:', error);
  }
}

export async function unloadSounds() {
  for (const key in sounds) {
    if (sounds[key]) {
      await sounds[key]!.unloadAsync();
      sounds[key] = null;
    }
  }
}